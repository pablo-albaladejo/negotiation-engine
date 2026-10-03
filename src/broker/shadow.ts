import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { BenchSession, Heartbeat } from "../venue/mechanism.js";
import { benchRun, DEFAULT_BENCH_PARAMS, observeBench, planBench, type BenchParams, type BenchQuote, type BrokerBook, type QuoteTrack } from "./broker.js";

/**
 * Broker en sombra del Market Test: durante cada bench lee el libro (solo GET, también en un venue auto) y apunta
 * qué habría casado nuestro planificador (`planBench`) frente a lo que cruzó el motor auto (lista `recent` del libro).
 * Excedente por cotizaciones (bid − ask): proxy, porque los límites ocultos no se ven. Nada se envía.
 *
 * ASSUMPTION (por verificar en vivo): en un venue auto el motor cruza antes de que leamos, así que el libro de la
 * sombra se reconstruye con lo que queda más las dos patas de cada cruce nuevo de `recent` (si trae cotizaciones o las
 * vimos antes). Si `recent` no trae ids de banco, `autoSurplus` queda en 0 y la sesión no cuenta como medida.
 */

export const DEFAULT_SESSIONS_FILE = "bench-sessions.json";
export const DEFAULT_HEARTBEAT_FILE = "broker-heartbeat.json";

export const defaultSessionsFile = (root = process.cwd()) => join(root, "results", "bazaar-live", DEFAULT_SESSIONS_FILE);
export const defaultHeartbeatFile = (root = process.cwd()) => join(root, "results", "bazaar-live", DEFAULT_HEARTBEAT_FILE);

/** Sesión con lo necesario para seguir tras un reinicio (cruces ya contados, ofertas ya usadas, cotizaciones vistas). */
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

/** Cruces de banco en `recent` del libro, tolerante (forma sin verificar: sell/buy o sell_offer/buy_offer, ask/bid opcionales). */
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

/** Sin el estado interno (lo que lee el coordinador). */
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
 * Un paso de la sombra (uno por tick). Puro sobre `session` y `tracks` (los muta): suma los cruces nuevos de auto y
 * lo que habría casado el planificador con el libro reconstruido. Devuelve la línea del paso.
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
      // Las dos patas vuelven al libro de la sombra: en un board seguirían ahí hasta que las casara nuestro broker.
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

/** Sombra con estado en disco: una sesión por bench (`benchAt`), retomada tras un reinicio. */
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

  /** Solo dentro de un bench (`slot`); una vez por tick. Guarda la sesión tras cada paso. */
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
