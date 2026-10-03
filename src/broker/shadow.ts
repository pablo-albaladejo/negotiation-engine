import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BenchSession, Heartbeat, OfficialBench } from "../venue/mechanism.js";
import { benchRun, DEFAULT_BENCH_PARAMS, observeBench, planBench, type BenchParams, type BenchQuote, type BrokerBook, type QuoteTrack } from "./broker.js";

/**
 * Market Test shadow broker: during each bench it reads the book (GET only, also on an auto venue) and records
 * what our planner (`planBench`) would have matched versus what the auto engine crossed (`recent` list of the book).
 * Surplus by quotes (bid − ask): proxy, because hidden limits are not visible. Nothing is sent.
 *
 * ASSUMPTION (to verify live): on an auto venue the engine crosses before we read, so the shadow's book is
 * rebuilt from what remains plus the two legs of each new crossing in `recent` (if it carries quotes or we
 * saw them before). If `recent` carries no bank ids, `autoSurplus` stays 0; the session then counts as measured only
 * once the official `bench.finished` (recorder's stream-team.jsonl) gives auto's matches (ratio by pairs).
 */

export const DEFAULT_SESSIONS_FILE = "bench-sessions.json";
export const DEFAULT_HEARTBEAT_FILE = "broker-heartbeat.json";

export const defaultSessionsFile = (root = process.cwd()) => join(root, "results", "bazaar-live", DEFAULT_SESSIONS_FILE);
export const defaultHeartbeatFile = (root = process.cwd()) => join(root, "results", "bazaar-live", DEFAULT_HEARTBEAT_FILE);

/** Session with what is needed to continue after a restart (crossings already counted, offers already used, quotes seen). */
export interface SessionMemo extends BenchSession {
  firstTick: number;
  lastTick: number;
  autoKeys: string[];
  shadowUsed: string[];
  quotes: Record<string, { side: "ask" | "bid"; quote: number }>;
}

export interface AutoFill {
  sell: string;
  buy: string;
  ask?: number;
  bid?: number;
}

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const id = (x: unknown): string | undefined => (typeof x === "string" ? x : typeof x === "number" ? String(x) : undefined);

const ref = (x: unknown): string | undefined => id(isObj(x) ? (x.id ?? x.offer ?? x.offer_id) : x);

/**
 * Bank crossings in the book's `recent`, tolerant (unverified shape): ids as sell/buy, sell_offer/buy_offer,
 * sell_id/buy_id, ask_id/bid_id, ask/bid objects with an id, or `offers`/`legs` [sell, buy]; ask/bid quotes optional.
 * Also reads `recent_matches`/`settlements`/`matches` if `recent` is absent. Anything else is skipped (never throws).
 */
export function parseRecentBenchFills(raw: unknown): AutoFill[] {
  const out: AutoFill[] = [];
  const list = isObj(raw) ? [raw.recent, raw.recent_matches, raw.settlements, raw.matches].find(Array.isArray) ?? [] : [];
  for (const r of list as unknown[]) {
    if (!isObj(r)) continue;
    const legs = Array.isArray(r.offers) ? r.offers : Array.isArray(r.legs) ? r.legs : [];
    const sell = ref(r.sell ?? r.sell_offer ?? r.sell_id ?? r.sell_offer_id ?? r.ask_id ?? (isObj(r.ask) ? r.ask : undefined) ?? legs[0]);
    const buy = ref(r.buy ?? r.buy_offer ?? r.buy_id ?? r.buy_offer_id ?? r.bid_id ?? (isObj(r.bid) ? r.bid : undefined) ?? legs[1]);
    if (!sell || !buy || !benchRun(sell) || !benchRun(buy)) continue;
    const ask = num(isObj(r.ask) ? r.ask.quote : (r.ask ?? r.sell_quote ?? r.ask_quote));
    const bid = num(isObj(r.bid) ? r.bid.quote : (r.bid ?? r.buy_quote ?? r.bid_quote));
    out.push({ sell, buy, ...(ask !== undefined ? { ask } : {}), ...(bid !== undefined ? { bid } : {}) });
  }
  return out;
}

/**
 * Official results of our venue per bench hour from recorder lines (`{event, data: {type, tick, t, payload}}`):
 * `bench.finished` (team scope) matched to its `bench.started` by `session` for the hour. Bad lines are skipped.
 */
export function parseOfficialBench(lines: Iterable<string>, venue?: string): Map<number, OfficialBench> {
  const started = new Map<number, number>();
  const finished: { t: number | undefined; o: OfficialBench }[] = [];
  for (const line of lines) {
    if (!line.includes('"bench.')) continue;
    let rec: unknown;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (!isObj(rec)) continue;
    const ev = isObj(rec.data) ? rec.data : rec;
    const type = typeof ev.type === "string" ? ev.type : rec.event;
    const p = isObj(ev.payload) ? ev.payload : undefined;
    const session = num(p?.session);
    if (!p || session === undefined) continue;
    if (type === "bench.started" && num(ev.t) !== undefined) started.set(session, num(ev.t)!);
    if (type !== "bench.finished") continue;
    if (venue && typeof p.venue === "string" && p.venue !== venue) continue;
    const autoBaseline = num(p.auto_baseline);
    const matches = num(p.matches);
    if (autoBaseline === undefined || matches === undefined) continue;
    const tick = num(ev.tick);
    finished.push({ t: num(ev.t), o: { session, efficiency: num(p.efficiency) ?? null, autoBaseline, matches, ...(tick !== undefined ? { tick } : {}) } });
  }
  const out = new Map<number, OfficialBench>();
  for (const { t, o } of finished) {
    const at = started.get(o.session) ?? t;
    if (at !== undefined) out.set(Math.floor(at + 1e-6), o);
  }
  return out;
}

/** `parseOfficialBench` over every `<dir>/<date>/stream-team.jsonl`. Never throws (empty map). */
export function loadOfficialBench(dir: string, venue?: string): Map<number, OfficialBench> {
  const out = new Map<number, OfficialBench>();
  try {
    for (const d of readdirSync(dir).sort()) {
      const f = join(dir, d, "stream-team.jsonl");
      if (!existsSync(f)) continue;
      for (const [at, o] of parseOfficialBench(readFileSync(f, "utf8").split("\n"), venue)) out.set(at, o);
    }
  } catch {
    // Missing or unreadable recorder files: no official results yet.
  }
  return out;
}

export function loadBenchSessions(file: string): SessionMemo[] {
  if (!existsSync(file)) return [];
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    return Array.isArray(raw) ? (raw.filter((s) => isObj(s) && typeof s.benchAt === "number") as unknown as SessionMemo[]) : [];
  } catch {
    return [];
  }
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 1) + "\n");
  renameSync(tmp, file);
}

export const saveBenchSessions = (file: string, sessions: readonly SessionMemo[]) => writeJson(file, sessions);

export function loadHeartbeat(file: string): Heartbeat | undefined {
  if (!existsSync(file)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    return isObj(raw) && typeof raw.ts === "string" ? (raw as unknown as Heartbeat) : undefined;
  } catch {
    return undefined;
  }
}

export const saveHeartbeat = (file: string, hb: Heartbeat) => writeJson(file, hb);

/** Without internal state (what the coordinator reads). */
export function publicSession(s: SessionMemo): BenchSession {
  return {
    benchAt: s.benchAt,
    hard: s.hard,
    shadowSurplus: s.shadowSurplus,
    autoSurplus: s.autoSurplus,
    ...(s.ratio !== undefined ? { ratio: s.ratio } : {}),
    ...(s.ratioBasis ? { ratioBasis: s.ratioBasis } : {}),
    ...(s.official ? { official: s.official } : {}),
    pairsShadow: s.pairsShadow,
    pairsAuto: s.pairsAuto,
    autoUnknown: s.autoUnknown,
    ticks: s.ticks,
  };
}

/**
 * Session ratio: shadow / auto quote surplus if auto's crossings were measured; otherwise, with the official result,
 * our shadow pairs / auto's official matches (shadow 0 ⇒ 0: the board was not shown better). Mutates `s`.
 */
export function updateRatio(s: SessionMemo): void {
  const r = (x: number) => Number(x.toFixed(3));
  delete s.ratio;
  delete s.ratioBasis;
  if (s.autoSurplus > 0) {
    s.ratio = r(s.shadowSurplus / s.autoSurplus);
    s.ratioBasis = "surplus";
  } else if (s.official && s.official.matches > 0) {
    s.ratio = r(s.pairsShadow / s.official.matches);
    s.ratioBasis = "pairs";
  }
}

/**
 * One shadow step (one per tick). Pure over `session` and `tracks` (it mutates them): adds the new auto crossings and
 * what the planner would have matched with the rebuilt book. Returns the step's line.
 */
export function shadowStep(
  session: SessionMemo,
  tracks: Map<string, QuoteTrack>,
  tick: number,
  book: BrokerBook,
  fills: readonly AutoFill[],
  params: BenchParams = DEFAULT_BENCH_PARAMS,
): string {
  for (const b of book.bench) session.quotes[b.id] = { side: b.side, quote: b.quote };
  const seen = new Set(session.autoKeys);
  const used = new Set(session.shadowUsed);
  const extra: BenchQuote[] = [];
  let newAuto = 0;
  for (const f of fills) {
    const key = `${f.sell}x${f.buy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    session.autoKeys.push(key);
    session.pairsAuto += 1;
    newAuto += 1;
    const ask = f.ask ?? session.quotes[f.sell]?.quote;
    const bid = f.bid ?? session.quotes[f.buy]?.quote;
    if (ask === undefined || bid === undefined) {
      session.autoUnknown += 1;
    } else {
      session.autoSurplus += bid - ask;
      // Both legs go back into the shadow book: on a board they would stay there until our broker matched them.
      for (const [oid, side, quote] of [[f.sell, "ask", ask], [f.buy, "bid", bid]] as const) {
        if (used.has(oid) || book.bench.some((b) => b.id === oid)) continue;
        extra.push({ id: oid, run: benchRun(oid)!, side, quote, index: book.bench.length + extra.length });
      }
    }
  }
  const bench = [...book.bench, ...extra].filter((b) => !used.has(b.id));
  observeBench(tracks, bench, tick);
  const plan = planBench({ ...book, bench }, tracks, tick, params);
  for (const m of plan.matches) {
    session.shadowUsed.push(String(m.sell), String(m.buy));
    session.pairsShadow += 1;
    session.shadowSurplus += m.surplus;
  }
  if (tick !== session.lastTick) session.ticks += 1;
  session.lastTick = tick;
  updateRatio(session);
  return (
    `shadow bench ${session.benchAt} h${session.hard ? " (hard)" : ""} · tick ${tick}: book ${book.bench.length} + ${extra.length} rebuilt · ` +
    `auto +${newAuto} (${session.pairsAuto} pairs, surplus ${session.autoSurplus}${session.autoUnknown ? `, ${session.autoUnknown} without quotes` : ""}) · ` +
    `shadow +${plan.matches.length} (${session.pairsShadow} pairs, surplus ${session.shadowSurplus})${plan.held.length ? ` held ${plan.held.length}` : ""} · ratio ${session.ratio ?? "?"}`
  );
}

/** Shadow with state on disk: one session per bench (`benchAt`), resumed after a restart. */
export class BenchShadow {
  readonly sessions: SessionMemo[];
  private readonly tracks = new Map<string, QuoteTrack>();
  private lastTick: number | undefined;
  private officialTick: number | undefined;

  constructor(
    private readonly file: string,
    private readonly params: BenchParams = DEFAULT_BENCH_PARAMS,
    /** Where the recorder's `<date>/stream-team.jsonl` live (default: the sessions file's folder). */
    private readonly streamDir: string = dirname(file),
  ) {
    this.sessions = loadBenchSessions(file);
  }

  /**
   * Attaches the official `bench.finished` to sessions already recorded (every 5 ticks, also outside a bench; backfills
   * older sessions on restart). Returns a line per newly attached result. Never throws.
   */
  reconcileOfficial(tick: number, venue?: string): string[] {
    if (this.officialTick !== undefined && tick - this.officialTick < 5 && tick >= this.officialTick) return [];
    this.officialTick = tick;
    const lines: string[] = [];
    try {
      const official = loadOfficialBench(this.streamDir, venue);
      for (const s of this.sessions) {
        const o = official.get(s.benchAt);
        if (!o || JSON.stringify(o) === JSON.stringify(s.official)) continue;
        s.official = o;
        updateRatio(s);
        lines.push(`shadow bench ${s.benchAt} h: official session ${o.session} · auto ${o.matches} matches · efficiency ${o.efficiency ?? "?"} (baseline ${o.autoBaseline}) · shadow ${s.pairsShadow} pairs → ratio ${s.ratio ?? "?"}${s.ratioBasis ? ` (${s.ratioBasis})` : ""}`);
      }
      if (lines.length) saveBenchSessions(this.file, this.sessions);
    } catch {
      return lines;
    }
    return lines;
  }

  /** Only within a bench (`slot`); once per tick. Saves the session after each step. */
  step(tick: number, slot: { atHours: number; hard: boolean } | undefined, book: BrokerBook, rawBook: unknown): string | undefined {
    const official = this.reconcileOfficial(tick, book.venue);
    if (!slot || tick === this.lastTick) return official.length ? official.join("\n") : undefined;
    this.lastTick = tick;
    let s = this.sessions.find((x) => x.benchAt === slot.atHours);
    if (!s) {
      s = { benchAt: slot.atHours, hard: slot.hard, shadowSurplus: 0, autoSurplus: 0, pairsShadow: 0, pairsAuto: 0, autoUnknown: 0, ticks: 0, firstTick: tick, lastTick: -1, autoKeys: [], shadowUsed: [], quotes: {} };
      this.sessions.push(s);
      this.tracks.clear();
    }
    const line = shadowStep(s, this.tracks, tick, book, parseRecentBenchFills(rawBook), this.params);
    saveBenchSessions(this.file, this.sessions);
    return line;
  }
}
