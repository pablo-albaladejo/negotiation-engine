import { gameHours } from "./dealer-profile.js";
import type { Clock } from "../shared/schemas.js";
import type { TraceRecord } from "../shared/trace.js";

/**
 * Piezas puras del modo continuo (`pnpm bazaar --serious`): cuándo esperar (reloj en pausa o puertas cerradas),
 * qué errores son pasajeros (reintento con espera creciente), cuáles ya gestiona el agente y cuáles paran la
 * ejecución, y la línea de estado por tick.
 */

export const SERIOUS_DEFAULTS = { maxSpendPerHour: 60, maxSpendTotal: 150, safety: 1.0, venueReserve: 270, cashReserve: 10 } as const;

/** Suelo de caja: por defecto mercado (270) + reserva (10); con `--cash-floor N`, N es el suelo (+ `--cash-reserve` solo si se da). */
export function cashFloorOf(floorRaw: string | undefined, reserveRaw: string | undefined): { floor: number; venue: number; reserve: number } {
  const venue = floorRaw === undefined ? SERIOUS_DEFAULTS.venueReserve : Number(floorRaw);
  const reserve = reserveRaw !== undefined ? Number(reserveRaw) : floorRaw === undefined ? SERIOUS_DEFAULTS.cashReserve : 0;
  return { floor: venue + reserve, venue, reserve };
}

export interface ClockGate {
  run: boolean;
  reason?: "paused" | "doors-closed";
  waitMs: number;
}

/** Reloj en pausa o fuera de horario (`doors` ≠ "open"): esperar (hasta `next_opens`, en tramos de 5 min como mucho). */
export function clockGate(clock: Clock, nowMs: number = Date.now()): ClockGate {
  const c = clock as Clock & { doors?: unknown; next_opens?: unknown };
  if (clock.paused) return { run: false, reason: "paused", waitMs: Math.min(60_000, Math.max(5_000, (clock.next_tick_in ?? 30) * 1000)) };
  if (typeof c.doors === "string" && c.doors !== "open") {
    const opens = typeof c.next_opens === "string" ? Date.parse(c.next_opens) : NaN;
    const until = Number.isFinite(opens) ? opens - nowMs : 300_000;
    return { run: false, reason: "doors-closed", waitMs: Math.min(300_000, Math.max(10_000, until + 2_000)) };
  }
  return { run: true, waitMs: 0 };
}

export type ErrorClass = "transient" | "handled" | "unknown";

const TRANSIENT = new Set(["network", "rate_limited", "too_many_failures", "wait_for_tick", "timeout", "http_500", "http_502", "http_503", "http_504"]);
/** Los gestiona el agente (salta el objetivo, espera la hora o el cooloff, o cambia de topic). */
const HANDLED = new Set(["persona_quota", "cooloff", "sold_out", "locked", "asset_locked", "insufficient_cash", "invalid", "not_found", "http_404", "closed", "http_409"]);

export function classifyError(code: string | undefined, rule?: string): ErrorClass {
  if (!code) return "unknown";
  if (TRANSIENT.has(code)) return "transient";
  if (HANDLED.has(code) || rule === "card-topic-unsupported") return "handled";
  return "unknown";
}

/** Clase de error de un error lanzado fuera del agente (reloj, /api/me): códigos de `BazaarError` o fallos de red de fetch. */
export function classifyThrown(e: unknown): { cls: ErrorClass; code: string } {
  const code = typeof (e as { code?: unknown })?.code === "string" ? (e as { code: string }).code : e instanceof Error && /fetch failed|ECONN|ETIMEDOUT|EAI_AGAIN|socket|timeout/i.test(e.message) ? "network" : "exception";
  return { cls: classifyError(code), code };
}

/** Errores del tick en las trazas del agente: el peor manda (unknown > transient > handled). */
export function worstError(records: readonly TraceRecord[]): { cls: ErrorClass; code: string } | undefined {
  let worst: { cls: ErrorClass; code: string } | undefined;
  const rank = { handled: 0, transient: 1, unknown: 2 } as const;
  for (const r of records) {
    if (r.action !== "error") continue;
    const cls = classifyError(r.error, r.rule);
    if (!worst || rank[cls] > rank[worst.cls]) worst = { cls, code: r.error ?? "?" };
  }
  return worst;
}

/** Espera creciente ante errores pasajeros: 2 s, 4 s, 8 s… hasta 60 s; se reinicia con un tick sano. */
export class Backoff {
  private n = 0;
  constructor(
    private readonly baseMs = 2_000,
    private readonly maxMs = 60_000,
  ) {}
  next(): number {
    const ms = Math.min(this.maxMs, this.baseMs * 2 ** this.n);
    this.n += 1;
    return ms;
  }
  reset(): void {
    this.n = 0;
  }
  get failures(): number {
    return this.n;
  }
}

export interface DealerStatus {
  id: string;
  state: string;
}

export interface StatusInput {
  clock: Clock;
  cash?: number;
  cashFloor: number;
  spentHour: number;
  maxSpendHour: number;
  spentTotal: number;
  maxSpendTotal: number;
  dealers: readonly DealerStatus[];
  deals?: number;
  negPoints?: number;
  rank?: number;
}

/** "[tick 102 · 1.70h · open] cash 390 (floor 280) · spent 0/60 this hour, 0/150 run · abuela: idle no-target · chato: locked · deals 2 · neg -14.9 · rank 15" */
export function statusLine(s: StatusInput): string {
  const doors = (s.clock as { doors?: unknown }).doors;
  const head = `[tick ${s.clock.tick} · ${gameHours(s.clock).toFixed(2)}h${typeof doors === "string" ? ` · ${doors}` : ""}${s.clock.paused ? " · paused" : ""}]`;
  const parts = [
    `cash ${s.cash ?? "?"} (floor ${s.cashFloor}${s.cash !== undefined && s.cashFloor > s.cash ? ` > cash: WARNING no buys; lower it with --cash-floor` : ""})`,
    `spent ${s.spentHour}/${s.maxSpendHour} this hour, ${s.spentTotal}/${s.maxSpendTotal} run`,
    ...s.dealers.map((d) => `${d.id}: ${d.state}`),
    ...(s.deals !== undefined ? [`deals ${s.deals}`] : []),
    ...(s.negPoints !== undefined ? [`neg ${s.negPoints}`] : []),
    ...(s.rank !== undefined ? [`rank ${s.rank}`] : []),
  ];
  return `${head} ${parts.join(" · ")}`;
}

/** Estado corto de un dealer a partir de sus trazas del tick. */
export function dealerState(records: readonly TraceRecord[]): string {
  const r = [...records].reverse().find((x) => x.action !== "outcome") ?? records[records.length - 1];
  if (!r) return "-";
  const bits: string[] = [r.action];
  if (r.thread !== undefined) bits.push(`#${r.thread}`);
  if (r.target) bits.push(r.target);
  if (r.herPrice !== undefined) bits.push(`her ${r.herPrice}${r.herFinal ? "F" : ""}`);
  if (r.ourPrice !== undefined) bits.push(`ours ${r.ourPrice}`);
  if (r.rule) bits.push(r.rule);
  if (r.error) bits.push(`error ${r.error}`);
  return bits.join(" ");
}
