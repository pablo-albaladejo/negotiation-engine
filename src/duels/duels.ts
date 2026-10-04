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
  /** Margin that the floor and `acceptShare` are measured against (kept apart so a softer opening doesn't lower them). */
  referenceMargin: number;
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
  /** A two-issue duel whose `your_days_weight` cannot be read waits (no message, no accept) instead of assuming `assumedDaysWeight`. */
  pauseOnUnreadableDays: boolean;
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
  /** Unanswered concessions to a rival that has never offered (a ladder along the curve; no rounds, so no decay). */
  silentLadder: number;
  /** In the last ticks, a rival that never offered gets an offer at this fraction of the floor surplus. */
  silentEndgameShare: number;
  /** Day deadlock (`dayStand`): our best day must be worth at least this fraction of the reference surplus over the rival's day. */
  dayStandShare: number;
  /** Day hold (`dayHold`): before the endgame, keep our best day if its range is worth at least this fraction of the reference surplus. */
  dayHoldShare: number;
}

export const DEFAULT_DUEL_PARAMS: DuelParams = {
  // Day-2 hint 3: "open with an offer the other side can take"; 0–1 round deals scored 24–33 vs 6–7 for 6+ rounds.
  anchorMargin: 0.35,
  referenceMargin: 0.5,
  beta: 2,
  // v2: 3 rounds to the floor (was 4): in practice, 6–7 round hagglings lost 30–35 % to decay.
  maxRounds: 3,
  floorShare: 0.3,
  minSurplus: 1,
  // 2, not 1: play's loop takes ~30 s against 15 s ticks and saw Duels III 11146 only at 10, 8, 6, 4, 2 ticks left, so the
  // last-move accept never fired (rival 108 P day 0 = +3 standing since ~t1873; no deal).
  lastMoveTicks: 2,
  endgameTicks: 3,
  assumedDaysWeight: 0,
  pauseOnUnreadableDays: true,
  daysWeightScale: 1,
  decay: 0.08,
  // Replay of the 27 practice duels: 0.5 accepted too early (89, 200); with 0.65 it is neutral (407 vs 415 real P).
  acceptShare: 0.65,
  acceptLookahead: 1,
  maxSilentConcessions: 1,
  silentWaitTicks: 2,
  // Silent rivals: 15 of 18 no-deals by 13:00 on Saturday scored 0; 4 of 19 accepted an offer of ours unanswered.
  silentLadder: 3,
  silentEndgameShare: 0.5,
  // Duels II: 5805 (w 1.23, 6 P over 5 days) closed following the rival's day; 5659/6029 (w ~5, ~50 P) did not.
  dayStandShare: 0.2,
  // Duels II sellers: 6068 (range 0.5 of reference) and 5614 (0.34) gave up our day early; 5654 (0.28) gave it and closed +23.9.
  dayHoldShare: 0.4,
};

/** Value to us (P) of each delivery day 0..10. */
export type DaysValue = readonly number[];

/** Keys under which an object may carry a single P-per-day weight (`{ weight: 2 }`). */
const WEIGHT_KEYS = ["weight", "per_day", "p_per_day", "value", "value_per_day"] as const;

/**
 * Direction read from `days_meaning`: "fewer" when a later day costs us (earlier is better), "more" when a
 * later day is worth more, undefined when the text says neither or both (then the weight's own sign decides).
 */
export function daysDirection(meaning: unknown): "fewer" | "more" | undefined {
  const text = typeof meaning === "string" ? meaning : meaning && typeof meaning === "object" ? JSON.stringify(meaning) : "";
  const fewer = /\b(cost|costs|penalt|lose|loses|loss|earl|soon|fewer|quick|fast|delay)/i.test(text);
  const more = /\b(later is better|more days|longer|gain|worth more)/i.test(text);
  return fewer === more ? undefined : fewer ? "fewer" : "more";
}

/**
 * Per-day value table from `your_days_weight` (number = P per day; array or object "0".."10" = per day;
 * `{ weight: n }` = P per day). With a single number, `days_meaning` sets the direction when it is clear
 * (fewer: |w| × (10 − d); more: |w| × d). `unreadable` when the duel negotiates days but the weight cannot be
 * read: the caller pauses that duel instead of playing as if days were worth nothing.
 */
export function daysValueFrom(
  raw: unknown,
  params: DuelParams,
  meaning?: unknown,
): { table: DaysValue; assumption?: string; unreadable?: boolean } {
  const days = Array.from({ length: DAYS_MAX - DAYS_MIN + 1 }, (_, k) => DAYS_MIN + k);
  const scale = params.daysWeightScale;
  const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  const note = meaning != null ? ` · days_meaning ${JSON.stringify(meaning).slice(0, 120)}` : "";
  let perDay: number | undefined;
  if (finite(raw)) perDay = raw;
  else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    if (days.every((d) => finite(rec[String(d)]))) return { table: days.map((d) => (rec[String(d)] as number) * scale), ...(note ? { assumption: `days table${note}` } : {}) };
    const key = WEIGHT_KEYS.find((k) => finite(rec[k]));
    if (key) perDay = rec[key] as number;
  } else if (Array.isArray(raw) && raw.length === days.length && raw.every(finite)) {
    return { table: raw.map((v) => v * scale), ...(note ? { assumption: `days table${note}` } : {}) };
  }
  if (perDay !== undefined) {
    const dir = daysDirection(meaning);
    const w = perDay * scale;
    // Real value, not shifted: each day costs |w| (day 0 = 0). A +10·|w| shift made a day-10 offer look like profit (Duels II).
    if (dir === "fewer") return { table: days.map((d) => -Math.abs(w) * d), assumption: `${perDay} P per day, earlier is better${note}` };
    if (dir === "more") return { table: days.map((d) => Math.abs(w) * d), assumption: `${perDay} P per day, later is better${note}` };
    return { table: days.map((d) => w * d), ...(note ? { assumption: `${perDay} P per day, direction from its sign${note}` } : {}) };
  }
  const shape = raw === undefined ? "missing" : `unreadable ${JSON.stringify(raw).slice(0, 120)}`;
  return {
    table: days.map((d) => params.assumedDaysWeight * d),
    assumption: `your_days_weight ${shape}: assuming ${params.assumedDaysWeight} P per day${note}`,
    unreadable: true,
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
  rule: AcceptanceRule | "accept-share" | "accept-decay" | "opening" | "concede" | "silent-concede" | "endgame" | "day-stand" | "day-hold" | "waiting-for-rival" | "match-stale" | "days-unreadable";
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

function surplusAtMargin(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, a: number, minSurplus: number): number {
  const price = state.role === "seller" ? state.limit * a : state.limit - state.limit / (1 + a);
  const days = state.withDays ? Math.max(...state.daysValue) : 0;
  return Math.max(minSurplus, price + days);
}

export function openingSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  return surplusAtMargin(state, params.anchorMargin, params.minSurplus);
}

/** Surplus at `referenceMargin`: the yardstick for the floor and `acceptShare`. */
export function referenceSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  return surplusAtMargin(state, params.referenceMargin, params.minSurplus);
}

export function floorSurplus(state: Pick<DuelState, "role" | "limit" | "withDays" | "daysValue">, params: DuelParams): number {
  return Math.min(openingSurplus(state, params), Math.max(params.minSurplus, params.floorShare * referenceSurplus(state, params)));
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

/**
 * Day deadlock: the rival's last two offers do not move towards our best day (and the last is not on it), their last offer there is
 * below our minimum surplus, and their price on our best day would already reach it. Returns our best day, its value
 * to us and the surplus their price would give us on it; undefined otherwise.
 */
export function dayStand(state: DuelState, params: DuelParams): { days: number; value: number; rivalPriceSurplus: number } | undefined {
  if (!state.withDays) return undefined;
  const withDays = state.rivalOffers.filter((o) => o.days !== undefined);
  const last = withDays.at(-1);
  const before = withDays.at(-2);
  if (!last) return undefined;
  const best = Math.max(...state.daysValue);
  const days = DAYS_MIN + state.daysValue.indexOf(best);
  // Not converging on the day: their last ask is no closer to our best day than the one before (6113: day 8 → 9).
  if (last.days === days || (before && Math.abs(last.days! - days) < Math.abs(before.days! - days))) return undefined;
  // Only a day that matters to us: when it weighs little, the deck's tip is to give it up and win on price.
  if (best - daysAt(state.daysValue, last.days) < params.dayStandShare * referenceSurplus(state, params)) return undefined;
  if (surplusOf(state, last) >= params.minSurplus) return undefined;
  const atOurDay: StructuredOffer = { price: last.price, days };
  if (!withinLimit(state, atOurDay)) return undefined;
  const rivalPriceSurplus = surplusOf(state, atOurDay);
  // With a single rival offer, only when their price on our day is already clearly good (6150: 55 P on day 10 = +31.7).
  const needed = before ? params.minSurplus : Math.max(params.minSurplus, floorSurplus(state, params));
  return rivalPriceSurplus >= needed ? { days, value: best, rivalPriceSurplus } : undefined;
}

/**
 * Day hold: before the endgame, a day worth at least `dayHoldShare` of the reference surplus to us is kept and only
 * price is conceded (Payday tip 5: give up the day you care little about; 6068 gave 42 P of day for 15 P of price).
 * Never past the rival's own price on that day.
 */
export function dayHold(state: DuelState, params: DuelParams, endgame: boolean): { days: number; value: number; rivalPriceSurplus: number } | undefined {
  if (!state.withDays || endgame) return undefined;
  const best = Math.max(...state.daysValue);
  if (best - Math.min(...state.daysValue) < params.dayHoldShare * referenceSurplus(state, params)) return undefined;
  const days = DAYS_MIN + state.daysValue.indexOf(best);
  const rival = state.rivalOffers.at(-1);
  const atOurDay: StructuredOffer | undefined = rival ? { price: rival.price, days } : undefined;
  const rivalPriceSurplus = atOurDay && withinLimit(state, atOurDay) ? surplusOf(state, atOurDay) : Number.NEGATIVE_INFINITY;
  return { days, value: best, rivalPriceSurplus };
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
  // A standing offer below the minimum surplus (sent with the shifted days table, Duels II 5659: 93 P day 10 = −10.7) is a
  // loss if the rival accepts it: replace it now, ignoring monotonicity against it and without waiting for the rival.
  const rawPrevSurplus = previous ? surplusOf(state, previous) : undefined;
  const repair = rawPrevSurplus !== undefined && rawPrevSurplus < params.minSurplus;
  const prevSurplus = repair ? undefined : rawPrevSurplus;
  const decay = state.decay ?? params.decay;
  // At the end, only move towards a deal if the rival has ever offered; if they never
  // spoke there is nothing to split and it's better to keep the current offer than to concede alone.
  const endgameWithRival = endgame && rivalHasOffered;
  // Never two concessions without a new rival counteroffer: without one, at most `maxSilentConcessions`
  // (one), after waiting `silentWaitTicks` or already at the end. In practice, 8 of 10 duels without a deal had a
  // silent rival; 2 of those rivals accepted an offer of ours without saying anything.
  // A rival that has never offered gets a ladder (`silentLadder`): without their offers no round is counted, so no decay,
  // and an unanswered duel scores 0. In the last ticks it gets one more step (`silentEndgameShare` of the floor).
  const silentCap = rivalHasOffered ? params.maxSilentConcessions : params.silentLadder;
  const silentLeft = (state.concessionsSinceRival ?? 0) < silentCap;
  const waitedEnough = (state.ticksSinceOurLast ?? 0) >= params.silentWaitTicks;
  const endgameSilent = endgame && !rivalHasOffered && previous !== undefined;
  const canConcede = !previous || repair || state.rivalMovedSinceOurLast || (silentLeft && (waitedEnough || endgameWithRival)) || endgameSilent;

  // Next target surplus: engine curve, at the end split the difference with the rival.
  let target = targetSurplus(state, params, round);
  let rule: DuelDecision["rule"] = round === 0 ? "opening" : state.rivalMovedSinceOurLast ? "concede" : "silent-concede";
  const rivalSurplus = rival && withinLimit(state, rival) ? surplusOf(state, rival) : undefined;
  // At the end the floor gives way to the minimum surplus: split the difference with a rival inside our limit, and
  // with one outside it (2313: limit 65, rival 67, we held 55 until no deal) offer our best price within the limit.
  if (endgameWithRival && round > 0 && rivalSurplus !== undefined && rivalSurplus < target) {
    target = Math.max(params.minSurplus, (target + Math.max(rivalSurplus, params.minSurplus)) / 2);
    rule = "endgame";
  } else if (endgameWithRival && round > 0 && rival && rivalSurplus === undefined) {
    target = params.minSurplus;
    rule = "endgame";
  } else if (endgameSilent) {
    target = Math.min(target, Math.max(params.minSurplus, params.silentEndgameShare * floorSurplus(state, params)));
    rule = "endgame";
  }
  // Never ask for less than the best figure the rival has already offered within our limit: 2558 offered 136 then
  // dropped to 123, and we conceded to 130 instead of holding 136.
  const bestRivalSurplus = Math.max(-Infinity, ...state.rivalOffers.filter((o) => withinLimit(state, o)).map((o) => surplusOf(state, o)));
  if (round > 0 && bestRivalSurplus > target) target = bestRivalSurplus;
  // Engine guardrail on surplus: never rises above the previous offer nor drops below the minimum.
  target = enforceGuardrails({ role: "seller", reservation: params.minSurplus }, target, prevSurplus);
  // What we would actually offer next: if we can't concede, the current offer.
  let nextSurplus = canConcede || prevSurplus === undefined ? target : prevSurplus;
  // When the curve doesn't move us and the rival did, we'd send the 1 P micro-step below: judge acceptance against it.
  if (canConcede && state.rivalMovedSinceOurLast && prevSurplus !== undefined && nextSurplus >= prevSurplus) {
    nextSurplus = Math.max(params.minSurplus, prevSurplus - 1);
  }

  // Never close outside our limit: `rivalSurplus` only exists if their offer respects `your_limit`.
  if (rival && rivalSurplus !== undefined && rivalSurplus >= params.minSurplus) {
    // Accept early: each round shrinks the deal (`decay`); an offer that already leaves a reasonable share, or is worth
    // more than our next offer discounted one round, is accepted now.
    if (rivalSurplus >= params.acceptShare * referenceSurplus(state, params)) return { action: "accept", rule: "accept-share", surplus: rivalSurplus, round };
    // Compare with the deal we'd expect by going on, not our next offer: the midpoint of theirs and ours, since rivals
    // meet us halfway. 2558: rival 29, next 32 → we countered and closed 11 P lower.
    // Within 1 P of our next offer: take it now. 2489: rival 122, we sent 121.
    if (rivalSurplus >= nextSurplus - 1) return { action: "accept", rule: "accept-decay", surplus: rivalSurplus, round };
    const expected = (rivalSurplus + nextSurplus) / 2;
    if (rivalSurplus >= (1 - decay) ** params.acceptLookahead * expected) return { action: "accept", rule: "accept-decay", surplus: rivalSurplus, round };
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

  // Endgame with the rival outside our limit on price only (Grand Final 15824: seller, limit 100, 6.66 P per day, rival
  // 62 / day 10): the clamp in `offerForSurplus` left day 0 as the only exact day and we sent 101 / day 0 (+1) instead of
  // 100 / day 10 (+66.6). Offer our limit price on the rival's day: a price no worse for them than our previous one, on
  // the day they ask for, so it is a concession to them even if our surplus rises.
  if (rule === "endgame" && rival && rivalSurplus === undefined && state.withDays && rival.days !== undefined) {
    const s = sign(state.role);
    const atRivalDay: StructuredOffer = { price: s > 0 ? Math.ceil(state.limit - 1e-9) : Math.floor(state.limit + 1e-9), days: rival.days };
    const noWorsePrice = !previous || s * (atRivalDay.price - previous.price) <= 0;
    const repeat = previous !== undefined && previous.price === atRivalDay.price && previous.days === atRivalDay.days;
    if (noWorsePrice && !repeat && withinLimit(state, atRivalDay) && surplusOf(state, atRivalDay) >= params.minSurplus) {
      return { action: "counter", offer: atRivalDay, text: duelText("counter", round, atRivalDay), rule, surplus: surplusOf(state, atRivalDay), round };
    }
  }

  let offer = offerForSurplus(state, target);
  // Day deadlock (Duels II 5659, 5679, 6029: no deal): the rival repeats a day that leaves no room for us (their offer
  // is a loss there) while their own price would already be a deal on our best day. Following their day only shaves
  // cents; offer our best day instead. Never conceding past their price on that day, and never above our previous
  // offer's surplus (monotonic).
  const standing = dayStand(state, params);
  const stand = standing ?? dayHold(state, params, endgame);
  if (stand && offer.days !== stand.days) {
    const standTarget = Math.min(Math.max(target, stand.rivalPriceSurplus), prevSurplus ?? Number.POSITIVE_INFINITY);
    const s = sign(state.role);
    const raw = s > 0 ? Math.ceil(state.limit + s * (standTarget - stand.value) - 1e-9) : Math.floor(state.limit + s * (standTarget - stand.value) + 1e-9);
    const candidate: StructuredOffer = { price: raw, days: stand.days };
    // Rounding in our favor may overshoot the previous offer's surplus: give that 1 P back.
    if (prevSurplus !== undefined && surplusOf(state, candidate) > prevSurplus) candidate.price -= s;
    if (withinLimit(state, candidate) && surplusOf(state, candidate) >= params.minSurplus && (prevSurplus === undefined || surplusOf(state, candidate) <= prevSurplus)) {
      offer = candidate;
      rule = standing ? "day-stand" : "day-hold";
    }
  }
  // With days, rounding to another day could ask for more than the previous offer: then we repeat.
  if (previous && prevSurplus !== undefined && surplusOf(state, offer) > prevSurplus) offer = previous;
  let same = previous !== undefined && previous.price === offer.price && previous.days === offer.days;
  // Repeating our price earns no concession from the rival ("20→20→20 is not a move"): while they keep moving, take a
  // 1 P step on the price (days as planned) as long as it stays within the limit and keeps the minimum surplus.
  if (previous && previous.price === offer.price && state.rivalMovedSinceOurLast) {
    const step: StructuredOffer = { ...offer, price: previous.price - sign(state.role) };
    const guarded = enforceGuardrails({ role: state.role, reservation: state.limit }, step.price, previous.price);
    // Never step past the rival's own price: that would leave value on the table.
    const pastRival = rival !== undefined && sign(state.role) * (step.price - rival.price) < 0;
    if (!pastRival && guarded === step.price && withinLimit(state, step) && surplusOf(state, step) >= params.minSurplus) {
      offer = step;
      same = false;
    }
  }
  // Repeating the same offer to a silent rival adds nothing: wait without a message.
  if (same && !state.rivalMovedSinceOurLast) return { action: "wait", rule: "waiting-for-rival", surplus: prevSurplus!, round };
  const kind = round === 0 ? "open" : same ? "hold" : "counter";
  return { action: "counter", offer, text: duelText(kind, round, offer), rule, surplus: surplusOf(state, offer), round };
}
