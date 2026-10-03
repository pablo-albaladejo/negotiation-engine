import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { BrokerClient } from "./client.js";
import { BazaarError } from "../shared/client.js";
import { ScheduleSchema } from "../duels/schemas.js";
import { activeBench, ticksPerHourOf, type Heartbeat } from "../venue/mechanism.js";
import type { BenchShadow } from "./shadow.js";
import {
  ANNOUNCEMENT,
  DEFAULT_BENCH_PARAMS,
  MAX_PUBLIC_MATCHES_PER_TICK,
  bookStateKey,
  observeBench,
  parseBrokerBook,
  planBench,
  planPublic,
  temperOf,
  type BenchParams,
  type BrokerMatch,
  type QuoteTrack,
} from "./broker.js";

/** What the loop needs from the client (injectable in tests). */
export type BrokerApi = Pick<BrokerClient, "clock" | "book" | "venues" | "match" | "announce"> & Partial<Pick<BrokerClient, "schedule">>;

/** One JSONL line per match (planned, sent or refused) or per bank snapshot. No key. */
export interface BrokerRecord {
  ts: string;
  tick: number;
  kind: "match" | "bench";
  dryRun: boolean;
  source?: BrokerMatch["source"];
  sell?: string | number;
  buy?: string | number;
  price?: number;
  ask?: number;
  bid?: number;
  surplus?: number;
  estSurplus?: number;
  status?: "dry-run" | "sent" | "refused";
  error?: string;
  bench?: { id: string; side: "ask" | "bid"; quote: number; temper: string }[];
}

export interface BrokerSink {
  write(record: BrokerRecord): void;
}

/** `results/bazaar-live/<date>/broker.jsonl` (matches) and `bench.jsonl` (bank snapshots for calibration). */
export class FileBrokerSink implements BrokerSink {
  constructor(private readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }
  write(record: BrokerRecord): void {
    appendFileSync(join(this.dir, record.kind === "bench" ? "bench.jsonl" : "broker.jsonl"), JSON.stringify(record) + "\n");
  }
}

export function brokerLogDir(root = process.cwd(), now = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10));
}

export interface BrokerAgentOptions {
  dryRun: boolean;
  log?: (line: string) => void;
  sink?: BrokerSink;
  bench?: BenchParams;
  maxPublic?: number;
  announce?: boolean;
  now?: () => Date;
  /** Market Test shadow (dry-run only): records per bench what we would match versus what auto crossed. */
  shadow?: BenchShadow;
  /** Heartbeat per step (the coordinator reads it to know whether the broker is healthy). */
  heartbeat?: (hb: Heartbeat) => void;
}

export interface BrokerStep {
  status: "error" | "unchanged" | "planned";
  tick?: number;
  matches: BrokerMatch[];
  sent: number;
  refused: number;
}

const errText = (e: unknown) => (e instanceof BazaarError ? e.code : e instanceof Error ? e.message : String(e));

/**
 * Broker loop: reads clock and book; if the state (tick + ids + quotes) did not change, it does nothing;
 * if it changed, it plans with `planBench` + `planPublic` (pure) and sends each match (nothing in dry-run). An
 * already matched offer is not reused while it stays in the book. Announces the venue once.
 */
export class BrokerAgent {
  readonly tracks = new Map<string, QuoteTrack>();
  private lastKey: string | undefined;
  private readonly used = new Set<string>();
  private readonly seenErrors = new Set<string>();
  private announced = false;
  private venueChecked = false;
  mechanism: string | undefined;
  private schedule: { tick: number; value: ReturnType<typeof ScheduleSchema.parse> | undefined } | undefined;
  private readonly log: (line: string) => void;
  private readonly params: BenchParams;

  constructor(
    private readonly api: BrokerApi,
    private readonly opts: BrokerAgentOptions,
  ) {
    this.log = opts.log ?? console.log;
    this.params = opts.bench ?? DEFAULT_BENCH_PARAMS;
  }

  async step(): Promise<BrokerStep> {
    const empty = { matches: [], sent: 0, refused: 0 };
    let tick: number;
    let hours: number | undefined;
    let raw: unknown;
    try {
      const clock = await this.api.clock();
      tick = clock.tick;
      hours = clock.t_hours;
      raw = await this.api.book();
    } catch (e) {
      this.log(`broker: cannot read clock/book (${errText(e)}), trying again`);
      return { status: "error", ...empty };
    }
    const book = parseBrokerBook(raw);
    for (const err of book.errors) {
      if (this.seenErrors.has(err)) continue;
      this.seenErrors.add(err);
      this.log(`broker: skipped ${err}`);
    }
    if (!this.venueChecked) await this.checkVenue(book.venue);
    await this.maybeAnnounce();

    observeBench(this.tracks, book.bench, tick);
    const hbNow = (this.opts.now ?? (() => new Date()))();
    this.opts.heartbeat?.({ ts: hbNow.toISOString(), tick, mode: this.opts.dryRun ? "shadow" : "live", ...(book.venue ? { venue: book.venue } : {}), ...(this.mechanism ? { mechanism: this.mechanism } : {}) });
    if (this.opts.shadow && this.opts.dryRun) {
      const slot = await this.benchSlot(tick, hours, book.bench.length > 0);
      const line = this.opts.shadow.step(tick, slot, book, raw);
      if (line) this.log(line);
    }
    const present = new Set([...book.bench.map((b) => b.id), ...book.sells.map((s) => String(s.id)), ...book.buys.map((b) => String(b.id))]);
    for (const id of [...this.used]) if (!present.has(id)) this.used.delete(id);

    const key = bookStateKey(tick, book);
    if (key === this.lastKey) return { status: "unchanged", tick, ...empty };
    this.lastKey = key;

    const bench = planBench(book, this.tracks, tick, this.params);
    const pub = planPublic(book, this.opts.maxPublic ?? MAX_PUBLIC_MATCHES_PER_TICK);
    const matches = [...bench.matches, ...pub].filter((m) => !this.used.has(String(m.sell)) && !this.used.has(String(m.buy)));
    const ts = (this.opts.now ?? (() => new Date()))().toISOString();
    if (book.bench.length && this.opts.sink) {
      this.opts.sink.write({
        ts,
        tick,
        kind: "bench",
        dryRun: this.opts.dryRun,
        bench: book.bench.map((b) => ({ id: b.id, side: b.side, quote: b.quote, temper: temperOf(this.tracks.get(b.id)) })),
      });
    }

    let sent = 0;
    let refused = 0;
    for (const m of matches) {
      const rec: BrokerRecord = { ts, tick, kind: "match", dryRun: this.opts.dryRun, ...m };
      if (this.opts.dryRun) {
        rec.status = "dry-run";
      } else {
        try {
          await this.api.match(m.sell, m.buy, m.price);
          rec.status = "sent";
          sent += 1;
          this.used.add(String(m.sell));
          this.used.add(String(m.buy));
        } catch (e) {
          if (!(e instanceof BazaarError)) throw e;
          rec.status = "refused";
          rec.error = e.code;
          refused += 1;
          this.log(`tick ${tick}: ${m.sell} x ${m.buy} at ${m.price} refused (${e.code})`);
        }
      }
      this.opts.sink?.write(rec);
    }

    const runs = new Set(book.bench.map((b) => b.run)).size;
    const surplus = matches.reduce((s, m) => s + m.surplus, 0);
    const verb = this.opts.dryRun ? "would match" : "matched";
    this.log(
      `tick ${tick}${hours !== undefined ? ` · h ${hours.toFixed(2)}` : ""} · ${book.venue ?? "?"} ${book.status ?? ""}`.trimEnd() +
        ` · bench ${book.bench.length} (${runs} runs) · offers ${book.sells.length} sell / ${book.buys.length} buy` +
        `${book.unsupported ? ` (+${book.unsupported} other)` : ""} · ${verb} ${this.opts.dryRun ? matches.length : sent} (surplus ${surplus})` +
        `${bench.held.length ? ` · held ${bench.held.length}` : ""}${refused ? ` · refused ${refused}` : ""}`,
    );
    for (const m of matches) if (this.opts.dryRun) this.log(`  ${m.source} ${m.sell} x ${m.buy} at ${m.price} (ask ${m.ask}, bid ${m.bid}, surplus ${m.surplus})`);
    return { status: "planned", tick, matches, sent, refused };
  }

  /**
   * Bench in progress per `/api/schedule` (re-read every 30 ticks). Without a readable calendar but with a bank in the book,
   * the whole hour in progress (benches fall on whole hours).
   */
  private async benchSlot(tick: number, hours: number | undefined, benchVisible: boolean): Promise<{ atHours: number; hard: boolean } | undefined> {
    if (this.api.schedule && (!this.schedule || tick - this.schedule.tick >= 30)) {
      const parsed = ScheduleSchema.safeParse(await this.api.schedule().catch(() => undefined));
      this.schedule = { tick, value: parsed.success ? parsed.data : undefined };
    }
    const sched = this.schedule?.value;
    if (hours !== undefined && sched) {
      const slot = activeBench(sched, hours, ticksPerHourOf(tick, hours));
      if (slot) return slot;
    }
    return benchVisible && hours !== undefined ? { atHours: Math.floor(hours), hard: false } : undefined;
  }

  private async checkVenue(venue: string | undefined): Promise<void> {
    this.venueChecked = true;
    try {
      const raw = (await this.api.venues()) as { venues?: unknown[] } | undefined;
      const mine = (raw?.venues ?? []).find((v) => typeof v === "object" && v !== null && (v as Record<string, unknown>).venue === venue) as
        | { name?: string; fee_bps?: number; fee_per_card?: number; rules?: { mechanism?: string } }
        | undefined;
      this.mechanism = mine?.rules?.mechanism;
      this.log(`broker: venue ${venue ?? "?"} "${mine?.name ?? "?"}" · mechanism ${this.mechanism ?? "?"} · fees ${mine?.fee_bps ?? "?"} bps + ${mine?.fee_per_card ?? "?"} P/card`);
      if (this.mechanism === "auto") {
        this.log("broker: WARNING mechanism auto: the engine crosses every bench pair before the broker reads the book (stall level, half Market Test points); only a board venue lets this broker beat it.");
      }
    } catch (e) {
      this.log(`broker: cannot read venues (${errText(e)})`);
    }
  }

  private async maybeAnnounce(): Promise<void> {
    if (this.announced || this.opts.announce === false) return;
    this.announced = true;
    if (this.opts.dryRun) {
      this.log(`broker: would announce: ${ANNOUNCEMENT}`);
      return;
    }
    try {
      await this.api.announce(ANNOUNCEMENT);
      this.log("broker: announced the venue");
    } catch (e) {
      this.log(`broker: announce refused (${errText(e)})`);
    }
  }
}
