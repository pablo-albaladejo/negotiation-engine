import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BenchSession, Heartbeat } from "../venue/mechanism.js";
import { benchRun, DEFAULT_BENCH_PARAMS, observeBench, planBench, type BenchParams, type BenchQuote, type BrokerBook, type QuoteTrack } from "./broker.js";

/**
 * Market Test shadow broker: during each bench it reads the book (GET only, also on an auto venue) and records
 * what our planner (`planBench`) would have matched versus what the auto engine crossed (`recent` list of the book).
 * Surplus by quotes (bid − ask): proxy, because hidden limits are not visible. Nothing is sent.
 *
 * ASSUMPTION (to verify live): on an auto venue the engine crosses before we read, so the shadow's book is
 * rebuilt from what remains plus the two legs of each new crossing in `recent` (if it carries quotes or we
 * saw them before). If `recent` carries no bank ids, `autoSurplus` stays 0 and the session does not count as measured.
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

/** Bank crossings in the book's `recent`, tolerant (unverified shape: sell/buy or sell_offer/buy_offer, ask/bid optional). */
export function parseRecentBenchFills(raw: unknown): AutoFill[] {
  const out: AutoFill[] = [];
  for (const r of isObj(raw) && Array.isArray(raw.recent) ? raw.recent : []) {
    if (!isObj(r)) continue;
    const sell = id(r.sell ?? r.sell_offer ?? r.ask_id);
    const buy = id(r.buy ?? r.buy_offer ?? r.bid_id);
    if (!sell || !buy || !benchRun(sell) || !benchRun(buy)) continue;
    const ask = num(r.ask ?? r.sell_quote);
    const bid = num(r.bid ?? r.buy_quote);
    out.push({ sell, buy, ...(ask !== undefined ? { ask } : {}), ...(bid !== undefined ? { bid } : {}) });
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
    pairsShadow: s.pairsShadow,
    pairsAuto: s.pairsAuto,
    autoUnknown: s.autoUnknown,
    ticks: s.ticks,
  };
}

const ratioOf = (shadow: number, auto: number) => (auto > 0 ? Number((shadow / auto).toFixed(3)) : undefined);

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
  const ratio = ratioOf(session.shadowSurplus, session.autoSurplus);
  if (ratio !== undefined) session.ratio = ratio;
  else delete session.ratio;
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

  constructor(
    private readonly file: string,
    private readonly params: BenchParams = DEFAULT_BENCH_PARAMS,
  ) {
    this.sessions = loadBenchSessions(file);
  }

  /** Only within a bench (`slot`); once per tick. Saves the session after each step. */
  step(tick: number, slot: { atHours: number; hard: boolean } | undefined, book: BrokerBook, rawBook: unknown): string | undefined {
    if (!slot || tick === this.lastTick) return undefined;
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
