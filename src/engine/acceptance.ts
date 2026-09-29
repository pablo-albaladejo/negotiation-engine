import type { Issue } from "./config.js";
import { reservationUtility, utility, withinOfferMandate, type Offer, type OfferMandate } from "./issues.js";

export interface TimeFields {
  round: number;
  /** Límite de rondas del ring, si lo da. */
  roundLimit?: number;
  /** Plazo del ring (ms epoch), si lo da; con inicio de sesión y reloj inyectados. */
  deadlineMs?: number;
  startedAtMs?: number;
  nowMs?: number;
}

export interface TimeInfo {
  t: number;
  source: "ring-rounds" | "ring-deadline" | "default-horizon";
  /** Nuestro último movimiento posible según el ring. */
  isLastMove: boolean;
  /** Horizonte alcanzado que solo procede de `defaultHorizon`: sin retirada. */
  defaultHorizonReached: boolean;
}

/** t ∈ [0, 1] solo desde campos del ring o `defaultHorizon`; nunca desde el texto ni el parser. */
export function computeTime(fields: TimeFields, defaultHorizon: number): TimeInfo {
  if (fields.roundLimit !== undefined) {
    return {
      t: Math.min(1, fields.round / fields.roundLimit),
      source: "ring-rounds",
      isLastMove: fields.round >= fields.roundLimit,
      defaultHorizonReached: false,
    };
  }
  const { deadlineMs, startedAtMs, nowMs } = fields;
  if (deadlineMs !== undefined && startedAtMs !== undefined && nowMs !== undefined && deadlineMs > startedAtMs) {
    const t = Math.min(1, Math.max(0, (nowMs - startedAtMs) / (deadlineMs - startedAtMs)));
    return { t, source: "ring-deadline", isLastMove: false, defaultHorizonReached: false };
  }
  return {
    t: Math.min(1, fields.round / defaultHorizon),
    source: "default-horizon",
    isLastMove: false,
    defaultHorizonReached: fields.round >= defaultHorizon,
  };
}

export type AcceptanceRule = "ac-next" | "ac-time" | "last-move" | "default-horizon" | "none";

export interface AcceptanceInput {
  /** Issues orientados a nuestro rol. */
  issues: readonly Issue[];
  mandate: OfferMandate;
  /** Oferta actual del rival (la última registrada); nunca una anterior. */
  rivalCurrent?: Offer;
  /** Utilidad de la contraoferta que enviaríamos. */
  ourNextUtility: number;
  time: TimeInfo;
  acceptMargin: number;
  acTimeThreshold: number;
  /** Si el ring aún admite respuesta del rival tras nuestro último movimiento. */
  rivalCanRespond: boolean;
}

export interface AcceptanceVerdict {
  verdict: "accept" | "counter" | "walk";
  rule: AcceptanceRule;
}

export function decideAcceptance(input: AcceptanceInput): AcceptanceVerdict {
  const { issues, mandate, rivalCurrent, time } = input;
  const uRes = reservationUtility(issues, mandate);
  const noDeal: AcceptanceVerdict =
    time.isLastMove && !input.rivalCanRespond ? { verdict: "walk", rule: "last-move" } : { verdict: "counter", rule: "none" };
  if (!rivalCurrent) return noDeal;

  const u = utility(issues, rivalCurrent);
  const inMandate = withinOfferMandate(issues, mandate, rivalCurrent);

  // Último movimiento (del ring) u horizonte por defecto: aceptar si y solo si u ≥ u(reserva), sin margen.
  if (time.isLastMove || time.defaultHorizonReached) {
    const rule: AcceptanceRule = time.isLastMove ? "last-move" : "default-horizon";
    if (inMandate && u >= uRes) return { verdict: "accept", rule };
    return time.isLastMove ? { ...noDeal, rule } : { verdict: "counter", rule };
  }
  if (!inMandate) return noDeal;
  if (u >= input.ourNextUtility - input.acceptMargin) return { verdict: "accept", rule: "ac-next" };
  if (time.t >= input.acTimeThreshold && u > uRes + input.acceptMargin) return { verdict: "accept", rule: "ac-time" };
  return noDeal;
}
