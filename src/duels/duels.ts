import type { Issue } from "../engine/config.js";
import { decideAcceptance, type AcceptanceRule, type TimeInfo } from "../engine/acceptance.js";
import { enforceGuardrails, type Role } from "../engine/guardrails.js";
import { utility } from "../engine/issues.js";
import { concession } from "../engine/offer.js";
import type { Duel, StructuredOffer } from "./schemas.js";
import { numbersIn } from "../dealers/negotiation/messages.js";

/**
 * Pure, deterministic decision for a Bazaar duel (1 vs 1, one message per side per tick).
 * The pie shrinks with every round of talk, so we concede fast (β > 1, the engine's concede curve)
 * towards a floor that keeps part of the opening surplus and closes in ~`maxRounds`.
 * Everything is measured in own surplus in P: seller price − limit, buyer limit − price, plus the
 * value of the delivery days (`daysValue`) when the duel negotiates `days`. Acceptance is the
 * engine's (`decideAcceptance`, AC_next and last move) over a synthetic `surplus` issue; the
 * price never crosses `your_limit` (`enforceGuardrails`). Only the rival's structured offer is read.
 */

export const DAYS_MIN = 0;
export const DAYS_MAX = 10;

export interface DuelParams {
  /** Opening: the seller asks limit × (1 + a); the buyer offers limit ÷ (1 + a). */
  anchorMargin: number;
  /** β of the engine's `concession` curve (> 1 concedes early). */
  beta: number;
  /** Rondas (mensajes nuestros) hasta llegar al suelo. */
  maxRounds: number;
  /** Floor: fraction of the opening surplus that is not conceded before the end. */
  floorShare: number;
  /** Minimum surplus of any deal (P); below it, better not to close. */
  minSurplus: number;
  /** Remaining ticks at which it is already the last move: accept anything acceptable. */
  lastMoveTicks: number;
  /** Remaining ticks from which, if the rival has ever offered, we move towards a deal (split the difference; never below the floor). */
  endgameTicks: number;
  /** P per delivery day if the duel has no `your_days_weight` (assumption; 0 = indifferent). */
  assumedDaysWeight: number;
  /** Multiplier for `your_days_weight` (in case it arrives on a scale other than P per day). */
  daysWeightScale: number;
  /** Decay per round if the duel has no `decay_per_round` (the deal's value shrinks each round: 0.06–0.1). */
  decay: number;
  /** Accept early: the rival's offer leaves us at least this fraction of the opening surplus. */
  acceptShare: number;
  /** Decay rounds by which our next offer is discounted when compared with the rival's (AC_next with decay). */
  acceptLookahead: number;
  /** Our allowed concessions without a new counteroffer from the rival (never two in a row: 1). */
  maxSilentConcessions: number;
  /** Ticks to wait for a silent rival before that single unanswered concession. */
  silentWaitTicks: number;
}

export const DEFAULT_DUEL_PARAMS: DuelParams = {
  anchorMargin: 0.5,
  beta: 2,
  // v2: 3 rounds to the floor (was 4): in practice, 6–7 round hagglings lost 30–35 % to decay.
  maxRounds: 3,
  floorShare: 0.3,
  minSurplus: 1,
  lastMoveTicks: 1,
  endgameTicks: 3,
  assumedDaysWeight: 0,
  daysWeightScale: 1,
  decay: 0.08,
  // Replay of the 27 practice duels: 0.5 accepted too early (89, 200); with 0.65 it is neutral (407 vs 415 real P).
  acceptShare: 0.65,
  acceptLookahead: 1,
  maxSilentConcessions: 1,
  silentWaitTicks: 2,
};

/** Value to us (P) of each delivery day 0..10. */
export type DaysValue = readonly number[];

/** Per-day value table from `your_days_weight` (number = P per day; array or object = per day). */
export function daysValueFrom(raw: Duel["your_days_weight"], params: DuelParams): { table: DaysValue; assumption?: string } {
  const days = Array.from({ length: DAYS_MAX - DAYS_MIN + 1 }, (_, k) => DAYS_MIN + k);
  const scale = params.daysWeightScale;
  if (typeof raw === "number" && Number.isFinite(raw)) return { table: days.map((d) => raw * scale * d) };
  if (Array.isArray(raw) && raw.length === days.length && raw.every(Number.isFinite)) return { table: raw.map((v) => v * scale) };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, number>;
    if (days.every((d) => Number.isFinite(rec[String(d)]))) return { table: days.map((d) => rec[String(d)]! * scale) };
  }
  return {
    table: days.map((d) => params.assumedDaysWeight * d),
    assumption: `your_days_weight missing or unreadable: assuming ${params.assumedDaysWeight} P per day`,
  };
}

export interface DuelState {
  role: Role;
  /** `your_limit`: seller's cost or buyer's value. Private: never appears in the text. */
  limit: number;
  withDays: boolean;
  daysValue: DaysValue;
  /** Nuestras ofertas enviadas, en orden. */
  ourOffers: readonly StructuredOffer[];
  /** Distinct structured offers from the rival, in order; the last is the current one. */
  rivalOffers: readonly StructuredOffer[];
  /** The rival has made a new offer since our last message. */
  rivalMovedSinceOurLast: boolean;
  /** Our concessions (price/days changes) since the rival's last offer; the opening doesn't count. */
  concessionsSinceRival?: number;
  /** Decay per round of the duel (`decay_per_round`); if missing, `params.decay`. */
  decay?: number;
  ticksSinceOurLast?: number;
  ticksLeft?: number;
}

export type DuelAction = "accept" | "counter" | "wait";

export interface DuelDecision {
  action: DuelAction;
  offer?: StructuredOffer;
  text?: string;
  rule: AcceptanceRule | "accept-share" | "accept-decay" | "opening" | "concede" | "silent-concede" | "endgame" | "waiting-for-rival" | "match-stale";
  /** Target surplus of the offer (or that of the rival's offer being accepted). */
  surplus: number;
  round: number;
}

const sign = (role: Role) => (role === "seller" ? 1 : -1);

function daysAt(table: DaysValue, days: number | undefined): number {
  if (days === undefined) return 0;
  return table[Math.round(days) - DAYS_MIN] ?? Number.NEGATIVE_INFINITY;
}

/** Our surplus (P) of an offer: price side relative to the limit plus the value of its days. */
export function surplusOf(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, offer: StructuredOffer): number {
  const price = sign(state.role) * (offer.price - state.limit);
  return state.withDays ? price + daysAt(state.daysValue, offer.days) : price;
}

/** The price doesn't cross the limit (seller ≥, buyer ≤) and, with days, they are integers in 0..10. */
export function withinLimit(state: Pick<DuelState, "role" | "limit" | "withDays">, offer: StructuredOffer): boolean {
  if (!Number.isFinite(offer.price) || offer.price < 1) return false;
  if (state.role === "seller" ? offer.price < state.limit : offer.price > state.limit) return false;
  if (!state.withDays) return true;
  return offer.days !== undefined && Number.isInteger(offer.days) && offer.days >= DAYS_MIN && offer.days <= DAYS_MAX;
}

export function openingSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  const a = params.anchorMargin;
  const price = state.role === "seller" ? state.limit * a : state.limit - state.limit / (1 + a);
  const days = state.withDays ? Math.max(...state.daysValue) : 0;
  return Math.max(params.minSurplus, price + days);
}

export function floorSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  return Math.max(params.minSurplus, params.floorShare * openingSurplus(state, params));
}

/** Target surplus of our offer number `round` (0 = opening) by the engine's curve. */
export function targetSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams, round: number): number {
  const open = openingSurplus(state, params);
  const floor = floorSurplus(state, params);
  return open - (open - floor) * concession(round / params.maxRounds, params.beta);
}

/**
 * What we estimate the rival values days at: their last requested day and how much (P) each day
 * of distance from it costs them. Intensity = our average slope × 2 if they moved the price without moving the
 * days (they care more), × 0.5 if they moved the days towards our preferred day; × 1 with no further data.
 */
export function estimateRivalDaysWeight(state: Pick<DuelState, "daysValue" | "rivalOffers">): { days: number; weight: number } | undefined {
  const withDays = state.rivalOffers.filter((o) => o.days !== undefined);
  const last = withDays.at(-1);
  if (!last) return undefined;
  const ourSlope = Math.abs(state.daysValue.at(-1)! - state.daysValue[0]!) / (DAYS_MAX - DAYS_MIN);
  const base = ourSlope > 0 ? ourSlope : 1;
  const ourBest = DAYS_MIN + state.daysValue.indexOf(Math.max(...state.daysValue));
  let factor = 1;
  if (withDays.length >= 2) {
    const first = withDays[0]!;
    if (last.days === first.days && last.price !== first.price) factor = 2;
    else if (Math.abs(last.days! - ourBest) < Math.abs(first.days! - ourBest)) factor = 0.5;
  }
  return { days: last.days!, weight: base * factor };
}

/**
 * Offer with our surplus ≈ `target`: with days, the day that maximizes the estimated joint value
 * (ours minus what we estimate the rival loses by moving away from their day; logrolling) and the price that leaves us at `target`. Ties: the day
 * closest to the rival's last. The price is rounded in our favor and never crosses the limit.
 */
export function offerForSurplus(state: DuelState, target: number): StructuredOffer {
  const s = sign(state.role);
  const clampPrice = (p: number) => Math.max(1, enforceGuardrails({ role: state.role, reservation: state.limit }, p));
  const roundInFavor = (p: number) => (s > 0 ? Math.ceil(p - 1e-9) : Math.floor(p + 1e-9));
  if (!state.withDays) return { price: clampPrice(roundInFavor(state.limit + s * target)) };

  const rivalEst = estimateRivalDaysWeight(state);
  const rivalDays = rivalEst?.days;
  type Candidate = { offer: StructuredOffer; joint: number; exact: boolean; surplus: number; dist: number };
  const candidates: Candidate[] = state.daysValue.map((value, k) => {
    const days = DAYS_MIN + k;
    const raw = roundInFavor(state.limit + s * (target - value));
    const price = clampPrice(raw);
    const offer = { price, days };
    return {
      offer,
      joint: value - (rivalEst ? rivalEst.weight * Math.abs(days - rivalEst.days) : 0),
      exact: price === raw,
      surplus: surplusOf(state, offer),
      dist: rivalDays === undefined ? 0 : Math.abs(days - rivalDays),
    };
  });
  const exact = candidates.filter((c) => c.exact);
  const pool = exact.length > 0 ? exact : candidates;
  const byJoint = (a: Candidate, b: Candidate) => (Math.abs(b.joint - a.joint) > 1e-9 ? b.joint - a.joint : 0);
  pool.sort((a, b) => (exact.length > 0 ? byJoint(a, b) : a.surplus - b.surplus) || a.dist - b.dist || b.surplus - a.surplus);
  return pool[0]!.offer;
}

const OPEN_PRICE = [
  "Hello, and thank you for meeting me. I would propose {p} P for this one.",
  "Good to meet you, and thank you! To get us started, I can offer {p} P.",
];
const COUNTER_PRICE = [
  "Thank you for your offer. I can move to {p} P.",
  "I appreciate it, thank you. Could we close at {p} P, please?",
  "Fair enough, thank you. I will meet you partway at {p} P.",
  "Thank you, we are getting close. {p} P works for me.",
];
const HOLD_PRICE = ["Thank you. My offer stays at {p} P, and I am happy to close there.", "Thank you. I think {p} P is fair for both of us. Shall we settle, please?"];
const OPEN_DAYS = [
  "Hello, and thank you for meeting me. I would propose {p} P with delivery on day {d}.",
  "Good to meet you, and thank you! To get us started: {p} P, delivery on day {d}.",
];
const COUNTER_DAYS = [
  "Thank you for your offer. I can do {p} P with delivery on day {d}.",
  "I appreciate it, thank you. Could we close at {p} P, delivery on day {d}, please?",
  "Fair enough, thank you. I will meet you partway: {p} P with delivery on day {d}.",
  "Thank you, we are getting close. {p} P and delivery on day {d} works for me.",
];
const HOLD_DAYS = [
  "Thank you. My offer stays at {p} P with delivery on day {d}, and I am happy to close there.",
  "Thank you. I think {p} P with delivery on day {d} is fair for both of us. Shall we settle, please?",
];

/** All duel templates (for the politeness and blacklist guardrail). */
export const DUEL_TEMPLATES: readonly string[] = [...OPEN_PRICE, ...COUNTER_PRICE, ...HOLD_PRICE, ...OPEN_DAYS, ...COUNTER_DAYS, ...HOLD_DAYS];

/** The text carries exactly the figures of the structured offer: the price and, with days, the days. */
export function textMatchesOffer(text: string, offer: StructuredOffer): boolean {
  const expected = offer.days === undefined ? [Math.round(offer.price)] : [Math.round(offer.price), Math.round(offer.days)];
  const nums = numbersIn(text);
  return nums.length === expected.length && nums.every((n, k) => n === expected[k]);
}

/** Friendly English template with the same figures as the offer; throws if they don't match. */
export function duelText(kind: "open" | "counter" | "hold", round: number, offer: StructuredOffer): string {
  const withDays = offer.days !== undefined;
  const list = {
    open: withDays ? OPEN_DAYS : OPEN_PRICE,
    counter: withDays ? COUNTER_DAYS : COUNTER_PRICE,
    hold: withDays ? HOLD_DAYS : HOLD_PRICE,
  }[kind];
  const tpl = list[Math.max(0, round) % list.length]!;
  const text = tpl.replace("{p}", String(Math.round(offer.price))).replace("{d}", String(Math.round(offer.days ?? 0)));
  if (!textMatchesOffer(text, offer)) throw new Error("duel template states a number different from the offer");
  return text;
}

/** Synthetic engine issue: our surplus in P, the more the better. */
function surplusIssue(state: DuelState): Issue {
  const span = Math.max(1000, 20 * Math.abs(state.limit) + 20 * Math.max(...state.daysValue.map(Math.abs)));
  return { name: "surplus", min: -span, max: span, direction: "higher-better", weight: 1 };
}

export function decideDuel(state: DuelState, params: DuelParams = DEFAULT_DUEL_PARAMS): DuelDecision {
  const round = state.ourOffers.length;
  const rival = state.rivalOffers.at(-1);
  const rivalHasOffered = state.rivalOffers.length > 0;
  const lastMove = state.ticksLeft !== undefined && state.ticksLeft <= params.lastMoveTicks;
  const endgame = state.ticksLeft !== undefined && state.ticksLeft <= params.endgameTicks;
  const previous = state.ourOffers.at(-1);
  const prevSurplus = previous ? surplusOf(state, previous) : undefined;
  const decay = state.decay ?? params.decay;
  // At the end, only move towards a deal if the rival has ever offered; if they never
  // spoke there is nothing to split and it's better to keep the current offer than to concede alone.
  const endgameWithRival = endgame && rivalHasOffered;
  // Never two concessions without a new rival counteroffer: without one, at most `maxSilentConcessions`
  // (one), after waiting `silentWaitTicks` or already at the end. In practice, 8 of 10 duels without a deal had a
  // silent rival; 2 of those rivals accepted an offer of ours without saying anything.
  const silentLeft = (state.concessionsSinceRival ?? 0) < params.maxSilentConcessions;
  const waitedEnough = (state.ticksSinceOurLast ?? 0) >= params.silentWaitTicks;
  const canConcede = !previous || state.rivalMovedSinceOurLast || (silentLeft && (waitedEnough || endgameWithRival));

  // Next target surplus: engine curve, at the end split the difference with the rival.
  let target = targetSurplus(state, params, round);
  let rule: DuelDecision["rule"] = round === 0 ? "opening" : state.rivalMovedSinceOurLast ? "concede" : "silent-concede";
  const rivalSurplus = rival && withinLimit(state, rival) ? surplusOf(state, rival) : undefined;
  if (endgameWithRival && round > 0 && rivalSurplus !== undefined && rivalSurplus < target) {
    target = Math.max(floorSurplus(state, params), (target + Math.max(rivalSurplus, params.minSurplus)) / 2);
    rule = "endgame";
  }
  // Engine guardrail on surplus: never rises above the previous offer nor drops below the minimum.
  target = enforceGuardrails({ role: "seller", reservation: params.minSurplus }, target, prevSurplus);
  // What we would actually offer next: if we can't concede, the current offer.
  const nextSurplus = canConcede || prevSurplus === undefined ? target : prevSurplus;

  // Never close outside our limit: `rivalSurplus` only exists if their offer respects `your_limit`.
  if (rival && rivalSurplus !== undefined && rivalSurplus >= params.minSurplus) {
    // Accept early: each round shrinks the deal (`decay`); an offer that already leaves a reasonable share, or is worth
    // more than our next offer discounted one round, is accepted now.
    if (rivalSurplus >= params.acceptShare * openingSurplus(state, params)) return { action: "accept", rule: "accept-share", surplus: rivalSurplus, round };
    if (rivalSurplus >= (1 - decay) ** params.acceptLookahead * nextSurplus) return { action: "accept", rule: "accept-decay", surplus: rivalSurplus, round };
  }

  // Engine acceptance (AC_next; on the last move, anything that respects the reservation).
  if (rival && rivalSurplus !== undefined) {
    const issue = surplusIssue(state);
    const time: TimeInfo = {
      t: Math.min(1, round / params.maxRounds),
      source: "ring-rounds",
      isLastMove: lastMove,
      defaultHorizonReached: false,
    };
    const verdict = decideAcceptance({
      issues: [issue],
      mandate: { role: "seller", reservation: { surplus: params.minSurplus } },
      rivalCurrent: { surplus: rivalSurplus },
      ourNextUtility: utility([issue], { surplus: nextSurplus }),
      time,
      acceptMargin: 0,
      acTimeThreshold: 2,
      rivalCanRespond: !lastMove,
    });
    if (verdict.verdict === "accept") return { action: "accept", rule: verdict.rule, surplus: rivalSurplus, round };
  }

  if (!canConcede) return { action: "wait", rule: "waiting-for-rival", surplus: prevSurplus!, round };

  let offer = offerForSurplus(state, target);
  // With days, rounding to another day could ask for more than the previous offer: then we repeat.
  if (previous && prevSurplus !== undefined && surplusOf(state, offer) > prevSurplus) offer = previous;
  const same = previous !== undefined && previous.price === offer.price && previous.days === offer.days;
  // Repeating the same offer to a silent rival adds nothing: wait without a message.
  if (same && !state.rivalMovedSinceOurLast) return { action: "wait", rule: "waiting-for-rival", surplus: prevSurplus!, round };
  const kind = round === 0 ? "open" : same ? "hold" : "counter";
  return { action: "counter", offer, text: duelText(kind, round, offer), rule, surplus: surplusOf(state, offer), round };
}
