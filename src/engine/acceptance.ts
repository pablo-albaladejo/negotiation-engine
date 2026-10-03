import type { Issue } from "./config.js";
import { acceptableForUs, reservationUtility, utility, type Offer, type OfferMandate } from "./issues.js";

export interface TimeFields {
  round: number;
  /** Ring round limit, if it gives one. */
  roundLimit?: number;
  /** Ring deadline (epoch ms), if it gives one; with session start and clock injected. */
  deadlineMs?: number;
  startedAtMs?: number;
  nowMs?: number;
}

export interface TimeInfo {
  t: number;
  source: "ring-rounds" | "ring-deadline" | "default-horizon";
  /** Our last possible move according to the ring. */
  isLastMove: boolean;
  /** Horizon reached that comes only from `defaultHorizon`: no walking away. */
  defaultHorizonReached: boolean;
}

/** t ∈ [0, 1] only from ring fields or `defaultHorizon`; never from text or the parser. */
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

export type AcceptanceRule = "ac-next" | "ac-combi" | "ac-time" | "last-move" | "default-horizon" | "none";

/**
 * Size of the window W of AC_combi(T, MAX^W): the rival's offers from the last stretch of time
 * of length 1 − t. Without each offer's round, a constant pace is assumed: with `previous`
 * offers in [0, t], the window is the last ⌈previous · (1 − t) / t⌉ (at least 1).
 */
export function acCombiWindow(t: number, previous: number): number {
  if (previous <= 0) return 0;
  if (t <= 0) return previous;
  return Math.min(previous, Math.max(1, Math.ceil(previous * (1 - t) / t - 1e-9)));
}

export interface AcceptanceInput {
  /** Issues oriented to our role. */
  issues: readonly Issue[];
  mandate: OfferMandate;
  /** Rival's current offer (the latest recorded); never an earlier one. */
  rivalCurrent?: Offer;
  /** Rival's earlier offers (without the current one), in order; for AC_combi. */
  rivalPrevious?: readonly Offer[];
  /** Threshold T of AC_combi; absent = AC_combi disabled. */
  acCombiThreshold?: number;
  /** Utility of the counteroffer we would send. */
  ourNextUtility: number;
  time: TimeInfo;
  acceptMargin: number;
  acTimeThreshold: number;
  /** Whether the ring still allows a rival reply after our last move. */
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
  // Every rule requires per-issue limits and u ≥ u(reservation) (task 3.8).
  const acceptable = acceptableForUs(issues, mandate, rivalCurrent);

  // Last move (of the ring) or default horizon: accept if and only if u ≥ u(reservation), no margin.
  if (time.isLastMove || time.defaultHorizonReached) {
    const rule: AcceptanceRule = time.isLastMove ? "last-move" : "default-horizon";
    if (acceptable) return { verdict: "accept", rule };
    return time.isLastMove ? { ...noDeal, rule } : { verdict: "counter", rule };
  }
  if (!acceptable) return noDeal;
  if (u >= input.ourNextUtility - input.acceptMargin) return { verdict: "accept", rule: "ac-next" };
  // AC_combi (Baarslag et al.): with t ≥ T, accept if it is at least as good as the best offer
  // from the rival in the recent window.
  const previous = input.rivalPrevious ?? [];
  if (input.acCombiThreshold !== undefined && time.t >= input.acCombiThreshold && previous.length > 0) {
    const window = previous.slice(previous.length - acCombiWindow(time.t, previous.length));
    if (u >= Math.max(...window.map((offer) => utility(issues, offer)))) return { verdict: "accept", rule: "ac-combi" };
  }
  if (time.t >= input.acTimeThreshold && u > uRes + input.acceptMargin) return { verdict: "accept", rule: "ac-time" };
  return noDeal;
}
