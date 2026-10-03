import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { PlanLineSchema, type PlanLine } from "../coordinator/plan-log.js";
import { CatalogSchema, MeSchema, type Catalog, type Me } from "../shared/schemas.js";

/**
 * Local sources of the auditor, read-only. JSONL files are tailed by byte offset (a partial last line waits for the
 * next read), so `--watch` only parses what is new. Every parser is tolerant: an odd line is skipped, never fatal.
 */

/** Reads only the bytes appended since the previous call; returns complete lines. */
export class Tail {
  private offset = 0;
  private rest = "";
  constructor(readonly file: string) {}

  read(): string[] {
    if (!existsSync(this.file)) return [];
    const size = statSync(this.file).size;
    if (size < this.offset) {
      // Truncated or replaced: start again.
      this.offset = 0;
      this.rest = "";
    }
    if (size === this.offset) return [];
    const fd = openSync(this.file, "r");
    try {
      const buf = Buffer.alloc(size - this.offset);
      readSync(fd, buf, 0, buf.length, this.offset);
      this.offset = size;
      const text = this.rest + buf.toString("utf8");
      const lines = text.split("\n");
      this.rest = lines.pop() ?? "";
      return lines.filter((l) => l.trim() !== "");
    } finally {
      closeSync(fd);
    }
  }
}

export function parseJson(line: string): unknown {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------- stream (recorder)

const num = z.number();
const OfferAssetSchema = z.union([num, z.looseObject({ id: num, ref: z.string().nullish(), kind: z.string().nullish() })]);
const OfferSideSchema = z.looseObject({ cash: num.nullish(), assets: z.array(OfferAssetSchema).nullish(), types: z.array(z.string()).nullish() });
export const StreamOfferSchema = z.looseObject({
  id: num,
  maker: z.string().nullish(),
  to: z.string().nullish(),
  venue: z.string().nullish(),
  thread: num.nullish(),
  give: OfferSideSchema.nullish(),
  want: OfferSideSchema.nullish(),
  expires_tick: num.nullish(),
  created_tick: num.nullish(),
});
export type StreamOffer = z.infer<typeof StreamOfferSchema>;

const SettlementItemSchema = z.looseObject({ id: num, kind: z.string().nullish(), ref: z.string().nullish(), frm: z.string().nullish(), to: z.string().nullish() });
export const SettlementSchema = z.looseObject({
  settlement: num,
  tick: num.nullish(),
  parties: z.array(z.string()).nullish(),
  venue: z.string().nullish(),
  persona: z.string().nullish(),
  fee: num.nullish(),
  price: num.nullish(),
  items: z.array(SettlementItemSchema).default([]),
});
export type Settlement = z.infer<typeof SettlementSchema>;

/** One recorder event, deduplicated across the team and public streams by its server id. */
export interface StreamEvent {
  id: number;
  tick: number;
  type: string;
  scope: string;
  payload: Record<string, unknown>;
  /** Wall-clock time the recorder received it (ISO). */
  recv?: string;
}

const RecordSchema = z.looseObject({
  recv: z.string().optional(),
  event: z.string(),
  data: z.looseObject({ id: num.optional(), tick: num.optional(), scope: z.string().optional(), payload: z.record(z.string(), z.unknown()).optional() }).optional(),
});

/** `hello` carries `scope: team:<id>`: our team id without any API call. */
export function parseStreamLine(line: string): { event?: StreamEvent; team?: string } {
  const r = RecordSchema.safeParse(parseJson(line));
  if (!r.success || !r.data.data) return {};
  const d = r.data.data;
  if (r.data.event === "hello") {
    const m = /^team:(\w+)$/.exec(d.scope ?? "");
    return m?.[1] ? { team: m[1] } : {};
  }
  if (d.id === undefined || d.tick === undefined || !d.payload) return {};
  return { event: { id: d.id, tick: d.tick, type: r.data.event, scope: d.scope ?? "", payload: d.payload, ...(r.data.recv ? { recv: r.data.recv } : {}) } };
}

// ---------------------------------------------------------------- plan.jsonl (coordinator, schema from src/coordinator/plan-log.ts)

export type { PlanLine };

export function parsePlanLine(line: string): PlanLine | undefined {
  const r = PlanLineSchema.safeParse(parseJson(line));
  return r.success ? r.data : undefined;
}

// ---------------------------------------------------------------- duel sends (play.log and plan.jsonl execution details)

/** A duel counter or accept we actually sent (`[sent]`), with the duel agent's rule. */
export interface DuelSend {
  tick: number;
  duel: number;
  action: "counter" | "accept";
  price?: number;
  rule?: string;
  /** From the duel header: our role and our limit (the private value) at that tick. */
  role?: "seller" | "buyer";
  limit?: number;
  line: string;
}

export interface DuelTerms {
  role?: "seller" | "buyer";
  limit?: number;
  /** P per delivery day as logged: a seller gains it per later day, a buyer pays it (a negative one flips that). */
  perDay?: number;
}

/**
 * Our real surplus on an offer: buyer limit − price − w·days, seller price − limit + w·days. Undefined when the limit
 * is unknown, or the offer has days and our weight is unknown.
 */
export function duelSurplus(terms: DuelTerms | undefined, price: number, days: number | undefined): number | undefined {
  if (!terms?.role || terms.limit === undefined) return undefined;
  if (days !== undefined && days !== 0 && terms.perDay === undefined) return undefined;
  const w = (terms.perDay ?? 0) * (days ?? 0);
  return terms.role === "buyer" ? terms.limit - price - w : price - terms.limit + w;
}

/**
 * `formatDuelEntry` prints `duel 300 · buyer · price · limit … · ticks left 10` and then
 * `→ COUNTER 92 P (surplus 24.0, round 1, concede) "…" [sent]` (or `→ ACCEPT rival 109 P (surplus 12.0, accept-share) [sent]`).
 * Only `[sent]` lines count: dry-run, deferred and skipped entries never reached the rival.
 */
export class DuelSendParser {
  readonly sends: DuelSend[] = [];
  /** Per duel: our role, our limit and our weight per delivery day (`[duels] duel N (…): … X P per day`). */
  readonly terms = new Map<number, DuelTerms>();
  private duel: number | undefined;
  private head: { role: "seller" | "buyer"; limit?: number } | undefined;

  push(line: string, tick: number): void {
    const weight = /^\[duels\] duel (\d+) \((seller|buyer),.*?(-?\d+(?:\.\d+)?) P per day/.exec(line);
    if (weight) this.terms.set(Number(weight[1]), { ...this.terms.get(Number(weight[1])), role: weight[2] as "seller" | "buyer", perDay: Number(weight[3]) });
    const head = /^duel (\d+) · (seller|buyer) · (?:.*?\blimit (\d+(?:\.\d+)?))?/.exec(line);
    if (head) {
      this.duel = Number(head[1]);
      this.head = { role: head[2] as "seller" | "buyer", ...(head[3] !== undefined ? { limit: Number(head[3]) } : {}) };
      this.terms.set(this.duel, { ...this.terms.get(this.duel), ...this.head });
      return;
    }
    const sent = /^→ (COUNTER|ACCEPT) (?:rival )?(\d+(?:\.\d+)?) P\b.*?\(([^()]*)\).*\[sent\]/.exec(line);
    if (!sent || this.duel === undefined) return;
    const rule = sent[3]!.split(",").at(-1)?.trim();
    this.sends.push({ tick, duel: this.duel, action: sent[1] === "ACCEPT" ? "accept" : "counter", price: Number(sent[2]), ...(rule ? { rule } : {}), ...this.head, line });
    this.duel = undefined;
    this.head = undefined;
  }
}

// ---------------------------------------------------------------- play.log fallback

/** What the auditor needs from one tick of `play.log` when there is no `plan.jsonl`. */
export interface PlayTick {
  tick: number;
  cash?: number;
  cashFloor?: number;
  /** Intents that went out: side, ref (or asset id for dealer sells), route and the log line. */
  acts: { route: string; side: "buy" | "sell"; ref?: string; assetId?: number; line: string }[];
  /** `route:error` shapes of failed executions. */
  failures: { shape: string; line: string }[];
  /** Cash kept for page-completing cards (`page reserve: N P kept for <refs>`, logged only when N > 0). */
  reserve?: { amount: number; refs: string[] };
}

/**
 * Parses `play.log` lines incrementally with tolerant regexes: `== tick N`, `us: … cash N P`, the header
 * `cash floor N P`, `SELECTED markets:accept:<venue>:<offer>` with its `[markets] accept: SELL|BUY <ref>` proposal,
 * `El Rastro sent: post list|bid <ref>`, `dealer X: [tick N] · open · thread N · buy:<ref>|sell:<asset>` and failures
 * (`failed: <code>`, `El Rastro error: … : <code>`, `· error · … error <code>`).
 */
export class PlayLogParser {
  readonly ticks = new Map<number, PlayTick>();
  private current: PlayTick | undefined;
  private cashFloor: number | undefined;
  private marketProposals = new Map<string, { side: "buy" | "sell"; ref: string; line: string }>();
  /** Duel counters and accepts sent, from the execution block of each tick. */
  readonly duels = new DuelSendParser();
  /** First tick with a `page reserve:` line: from there on a tick without one kept nothing. */
  reserveFrom: number | undefined;

  push(raw: string): void {
    const line = raw.replace(/^\d\d:\d\d:\d\d\s+/, "").trim();
    const floor = /cash floor (\d+(?:\.\d+)?) P/.exec(line);
    if (floor && /^bazaar:play/.test(line)) this.cashFloor = Number(floor[1]);
    const t = /^== tick (\d+)/.exec(line);
    if (t) {
      const tick = Number(t[1]);
      // A process restart prints the same tick again: keep accumulating on it.
      this.current = this.ticks.get(tick) ?? { tick, acts: [], failures: [] };
      if (this.cashFloor !== undefined) this.current.cashFloor = this.cashFloor;
      this.ticks.set(tick, this.current);
      this.marketProposals.clear();
      return;
    }
    const cur = this.current;
    if (!cur) return;
    this.duels.push(line, cur.tick);
    const reserve = /page reserve: (\d+(?:\.\d+)?) P kept for ([A-Z]{3}-\d{2}(?:, [A-Z]{3}-\d{2})*)/.exec(line);
    if (reserve) {
      cur.reserve = { amount: Number(reserve[1]), refs: reserve[2]!.split(", ") };
      this.reserveFrom ??= cur.tick;
    }
    const cash = /^us: .*· cash (-?\d+(?:\.\d+)?) P/.exec(line);
    if (cash) cur.cash = Number(cash[1]);
    const prop = /^\[markets\] accept: (SELL|BUY) ([A-Z]+-\d+) on (\w+) at \d+(?:\.\d+)? P \(offer #(\d+)\)/.exec(line);
    if (prop) this.marketProposals.set(`${prop[3]}:${prop[4]}`, { side: prop[1] === "SELL" ? "sell" : "buy", ref: prop[2]!, line });
    const sel = /^SELECTED markets:accept:(\w+):(\d+)/.exec(line);
    if (sel) {
      const p = this.marketProposals.get(`${sel[1]}:${sel[2]}`);
      if (p) cur.acts.push({ route: "markets", side: p.side, ref: p.ref, line: p.line });
    }
    const post = /^El Rastro sent: post (list|bid) ([A-Z]+-\d+) @/.exec(line);
    if (post) cur.acts.push({ route: "trades", side: post[1] === "list" ? "sell" : "buy", ref: post[2]!, line });
    const open = /^dealer (\w+): \[tick \d+\] · open · thread \d+ · (buy|sell):([A-Z]+-\d+|\d+)\b/.exec(line);
    if (open) {
      const target = open[3]!;
      cur.acts.push({ route: "dealers", side: open[2] as "buy" | "sell", ...(/^\d+$/.test(target) ? { assetId: Number(target) } : { ref: target }), line });
    }
    const failed = /^(\w+): .*\bfailed: ([\w-]+)/.exec(line);
    if (failed) cur.failures.push({ shape: `${failed[1]}:${failed[2]}`, line });
    const rastroErr = /^El Rastro error: .*: ([\w-]+)$/.exec(line);
    if (rastroErr) cur.failures.push({ shape: `trades:${rastroErr[1]}`, line });
    const dealerErr = /^dealer (\w+): \[tick \d+\] · error · .*error ([\w-]+)/.exec(line);
    if (dealerErr) cur.failures.push({ shape: `dealers:${dealerErr[2]}`, line });
  }
}

// ---------------------------------------------------------------- decisions.jsonl

export interface DecisionNote {
  tick: number;
  dealer: string;
  thread: number;
  target?: string;
  reservation?: number;
  ourPrice?: number;
}

const DecisionSchema = z.looseObject({ tick: num, dealer: z.string(), thread: num.optional(), target: z.string().optional(), reservation: num.optional(), ourPrice: num.optional() });

export function parseDecision(line: string): DecisionNote | undefined {
  const r = DecisionSchema.safeParse(parseJson(line));
  if (!r.success || r.data.thread === undefined) return undefined;
  const d = r.data;
  return { tick: d.tick, dealer: d.dealer, thread: d.thread as number, ...(d.target ? { target: d.target } : {}), ...(d.reservation !== undefined ? { reservation: d.reservation } : {}), ...(d.ourPrice !== undefined ? { ourPrice: d.ourPrice } : {}) };
}

/** Every dealer-agent decision, errors included (`action: error`, with `error` and `target` but no thread). */
export interface DealerEvent {
  tick: number;
  dealer: string;
  action: string;
  dryRun: boolean;
  rule?: string;
  error?: string;
  target?: string;
  thread?: number;
  ourPrice?: number;
}

const DealerEventSchema = z.looseObject({
  tick: num,
  dealer: z.string(),
  action: z.string(),
  dryRun: z.boolean().optional(),
  rule: z.string().optional(),
  error: z.string().optional(),
  target: z.string().optional(),
  thread: num.optional(),
  ourPrice: num.optional(),
});

export function parseDealerEvent(line: string): DealerEvent | undefined {
  const r = DealerEventSchema.safeParse(parseJson(line));
  if (!r.success) return undefined;
  const d = r.data;
  return {
    tick: d.tick,
    dealer: d.dealer,
    action: d.action,
    dryRun: d.dryRun ?? false,
    ...(d.rule ? { rule: d.rule } : {}),
    ...(d.error ? { error: d.error } : {}),
    ...(d.target ? { target: d.target } : {}),
    ...(d.thread !== undefined ? { thread: d.thread } : {}),
    ...(d.ourPrice !== undefined ? { ourPrice: d.ourPrice } : {}),
  };
}

// ---------------------------------------------------------------- duels-state.json (duel agent memory)

/** Our offers per duel as the duel agent remembers them (prices only, no ticks) and the tick of our last one. */
export interface DuelMemory {
  ourPrices: number[];
  lastOurTick?: number;
}

const DuelsStateSchema = z.looseObject({
  duels: z.record(z.string(), z.looseObject({ ourOffers: z.array(z.looseObject({ price: num.nullish() })).default([]), lastOurTick: num.nullish() })),
});

export function readDuelsState(file: string): Map<number, DuelMemory> {
  const out = new Map<number, DuelMemory>();
  if (!existsSync(file)) return out;
  const r = DuelsStateSchema.safeParse(parseJson(readFileSync(file, "utf8")));
  if (!r.success) return out;
  for (const [id, d] of Object.entries(r.data.duels)) {
    const ourPrices = d.ourOffers.flatMap((o) => (typeof o.price === "number" ? [o.price] : []));
    out.set(Number(id), { ourPrices, ...(typeof d.lastOurTick === "number" ? { lastOurTick: d.lastOurTick } : {}) });
  }
  return out;
}

// ---------------------------------------------------------------- snapshots: baseline /api/me and catalog

/** A recorded `/api/me` (and `/api/catalog` when present) from a dump folder (snapshot.json) or an api-scan JSON file. */
export interface Snapshot {
  file: string;
  tick: number;
  me?: Me;
  catalog?: Catalog;
}

function bodyOf(v: unknown): unknown {
  return v && typeof v === "object" && "body" in v ? (v as { body: unknown }).body : v;
}

function readSnapshot(file: string): Snapshot | undefined {
  const j = parseJson(readFileSync(file, "utf8"));
  if (!j || typeof j !== "object") return undefined;
  const o = j as Record<string, unknown>;
  const me = MeSchema.safeParse(bodyOf(o["/api/me"]));
  const cat = CatalogSchema.safeParse(bodyOf(o["/api/catalog"]));
  const clock = bodyOf(o["/api/clock"]) as { tick?: unknown } | undefined;
  const meTick = me.success ? (me.data as { tick?: unknown }).tick : undefined;
  const tick = typeof clock?.tick === "number" ? clock.tick : typeof meTick === "number" ? meTick : undefined;
  if (tick === undefined) return undefined;
  return { file, tick, ...(me.success ? { me: me.data } : {}), ...(cat.success && cat.data.sets.length ? { catalog: cat.data } : {}) };
}

/** Every snapshot of one day's folder, oldest tick first. */
export function daySnapshots(dayDir: string): Snapshot[] {
  if (!existsSync(dayDir)) return [];
  const files: string[] = [];
  for (const name of readdirSync(dayDir)) {
    if (/^api-scan-.*\.json$/.test(name)) files.push(join(dayDir, name));
    else if (/^dump-/.test(name) && existsSync(join(dayDir, name, "snapshot.json"))) files.push(join(dayDir, name, "snapshot.json"));
  }
  return files.flatMap((f) => {
    try {
      const s = readSnapshot(f);
      return s ? [s] : [];
    } catch {
      return [];
    }
  }).sort((a, b) => a.tick - b.tick);
}

/** The newest catalog recorded in any day folder (the catalog lists unreleased sets too). */
export function latestCatalog(liveRoot: string): Catalog | undefined {
  if (!existsSync(liveRoot)) return undefined;
  const days = readdirSync(liveRoot).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
  for (const d of days) {
    const withCat = daySnapshots(join(liveRoot, d)).filter((s) => s.catalog);
    const last = withCat.at(-1);
    if (last?.catalog) return last.catalog;
  }
  return undefined;
}

/** `results/bazaar-live/values.json`: private values already asked (`/api/me/value`). */
export function readValuesFile(file: string): Map<string, number> {
  const out = new Map<string, number>();
  if (!existsSync(file)) return out;
  const j = parseJson(readFileSync(file, "utf8")) as { values?: Record<string, unknown> } | undefined;
  for (const [k, v] of Object.entries(j?.values ?? {})) if (typeof v === "number" && Number.isFinite(v)) out.set(k, v);
  return out;
}

