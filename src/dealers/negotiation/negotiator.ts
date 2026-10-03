import { enforceGuardrails, type Mandate } from "../../engine/guardrails.js";
import { concession } from "../../engine/offer.js";

/**
 * Negotiator for one dealer (one thread, one price): decides to accept, counter, wait or close.
 * By default, steps adapt to its patience (measured live in exchanges, not ticks): the
 * step closes the gap to our limit in the messages it has left, and goes back to steps of 1 if
 * big steps don't extract more than steps of 1. The (older) `boulware` mode uses the engine curve
 * (`concession`). Always: monotonicity and mandate (`enforceGuardrails`) and AC_next.
 * Pure and deterministic: no network, no clock, no dealer text.
 */

export type Side = "buy" | "sell";

export type StepMode = "adaptive" | "boulware";

export interface NegotiatorParams {
  /** `adaptive` (default): step = ⌈gap ÷ remaining patience⌉; `boulware`: engine curve (older negotiator). */
  stepMode: StepMode;
  /** Estimated dealer patience in our messages per thread (threads 56 and 125: ~6–7). */
  patienceBudget: number;
  /** Max step per counteroffer in adaptive mode (P). */
  maxStep: number;
  /** Buy: opening = fraction of its first price (adaptive) or of min(reservation, its first price) (boulware). */
  buyAnchorFrac: number;
  /** Sell with its bid above our floor: opening = multiple of its bid (adaptive: trimmed to close the gap within its patience). */
  sellAnchorMult: number;
  /** Sell with its bid below our floor (or no bid): opening = ⌈floor × this⌉ (adaptive mode). */
  sellFloorAnchorMult: number;
  /**
   * Sell: the anchor never exceeds `herList` (its sell list for that rarity) × this, even if its plausible bid or
   * `sellFloorAnchorMult` × our floor give more; without its list, no cap. Its list is the only public and stable
   * figure we have for the dealer, so it is the yardstick for a reasonable anchor (avoids anchors like 2× an already
   * inflated bid, e.g. 107 for a list of a much lower rarity). The floor is still our effective reservation.
   */
  sellAnchorCapMult: number;
  /** β of the Boulware curve (< 1 concedes slowly at first). */
  beta: number;
  /** Number of counteroffers over which the curve reaches the effective reservation. */
  horizon: number;
  /** Max step per counteroffer as a fraction of the opening-reservation span. */
  maxStepFrac: number;
  /** Reciprocity: fraction of its last move that we return. */
  reciprocity: number;
  /** Ticks we hold without moving (polite message, same price) before closing if stuck. */
  maxHolds: number;
  /**
   * Fixed price: if after this many of our concessions its price has not moved, it is treated as fixed
   * (accept if it fits the reservation and creates value, even if it is its opening; otherwise close). 0 disables it.
   */
  fixedAfterConcessions: number;
  /**
   * The fixed price only holds against a person who concedes early: with its β (`herBeta`) below this, not moving in the
   * first rounds is what its curve predicts (El Chato, β ≈ 0.35: 4 % of the way in round 2), not its
   * limit. Without a known β, it applies as usual.
   */
  fixedPriceMinBeta: number;
  /**
   * Sell with its first bid < this × our floor (or buy with its price > our max ÷ this): after one
   * counteroffer, if it stays as far away, close politely so as not to waste its patience or the deal quota
   * (thread 125: bid 5–6 for a floor of 10). 0 disables it.
   */
  lowballFrac: number;
  /**
   * `mirror_concessions` (site-map § 8.3): the dealer never concedes faster than our last step. Our FIRST
   * concession after the anchor is at least this fraction of the anchor → effective reservation span (even if above `maxStep`);
   * after that, the usual curve (adaptive or Boulware). 0 disables it.
   */
  firstStepFrac: number;
  /**
   * `welcome_first_deal`: her price is taken without negotiating further only once it captures at least this share of
   * her range (her opening → her expected limit, `herLimitCap`). Below it we keep countering toward our anchor (thread
   * 894: Pilar 47 → 48 → 50 against our 64, 61; taking 50 gave ladder +0.014 vs +0.033 for thread 901 taken at her limit).
   */
  welcomeTakeShare: number;
}

export const DEFAULT_NEGOTIATOR_PARAMS: NegotiatorParams = {
  stepMode: "adaptive",
  patienceBudget: 6,
  maxStep: 3,
  buyAnchorFrac: 0.75,
  sellAnchorMult: 2.0,
  sellFloorAnchorMult: 1.3,
  sellAnchorCapMult: 1.3,
  beta: 1,
  horizon: 12,
  maxStepFrac: 0.08,
  reciprocity: 0.6,
  maxHolds: 1,
  fixedAfterConcessions: 2,
  fixedPriceMinBeta: 1,
  lowballFrac: 0.7,
  // OFF by default; the coordinator turns it on per persona only with a certain mirror (`MIRROR_FIRST_STEP_FRAC`). Offline replay (personas.md § 3.3 model, with and without mirror): on the 11 saved threads, the same (small gaps);
  // on synthetic rare/epic threads, worse (mean EV 11.42 → 10.92 with 0.12). Try it with --first-step-frac.
  firstStepFrac: 0,
  welcomeTakeShare: 0.8,
};

/** Negotiator from before the evidence of threads 56 and 125 (far anchor + Boulware), for comparison. */
export const LEGACY_NEGOTIATOR_PARAMS: NegotiatorParams = {
  ...DEFAULT_NEGOTIATOR_PARAMS,
  stepMode: "boulware",
  buyAnchorFrac: 0.45,
  sellAnchorMult: 2.0,
  beta: 0.5,
};

export interface HerOffer {
  offerId: number;
  price: number;
  final: boolean;
}

export interface ThreadView {
  side: Side;
  /** Private reservation: buy = max to pay; sell = min to charge. Never appears in a message. */
  reservation: number;
  /** Its first price in the thread (closing at that price doesn't count on the ladder). */
  herOpening?: number;
  /** Sell: its published sell list for that rarity (anchor cap, `sellAnchorCapMult`); without it, no cap. */
  herList?: number | undefined;
  /** Its prices in order (including the current one). */
  herPrices: readonly number[];
  /** Its standing (open) offer, if any. */
  herCurrent?: HerOffer;
  /** Our sent prices in order. */
  ourPrices: readonly number[];
  /** We have not yet written in this thread this tick. */
  canMessage: boolean;
  /** The team has not yet accepted anything this tick. */
  canAccept: boolean;
  /** Hold messages already spent in this thread (same price, no new offer) waiting for its final. */
  holdsUsed?: number;
  /** Our private value of what is bought or sold: a deal only creates value if the price beats it. */
  privateValue?: number;
  /**
   * Its standing price when we sent each of our prices (same length as `ourPrices`). With it and
   * `herCurrent` its response to each of our steps is measured; without it, `herPrices[j]` is assumed to be its price before our message j.
   */
  herAtOurMessages?: readonly number[];
  /**
   * `welcome_first_deal` (site-map § 8.2): the team's first conversation with this dealer, in which its opening is its
   * limit (it won't improve). With this, its price is accepted if it creates value at our private value (rule `welcome-first-deal`),
   * but only for a `welcomeTakeReason` (final, high share, stalled or walk risk); otherwise we keep countering.
   */
  welcomeFirstDeal?: boolean;
  /** Our last message in the thread was text only (a hold, no new offer): never two in a row. */
  lastWasTextOnly?: boolean;
  /**
   * Cap by its expected limit (`offerCap` in `src/dealers/history/persona-fit.ts`): when buying, never offer above;
   * when selling, never ask below. Only narrows the offer reservation; acceptance still uses the private reservation.
   */
  herLimitCap?: number;
  /** Estimated β of its persona's curve (`PersonaModel.strategy.beta`); `undefined` without it. */
  herBeta?: number;
  /** Rounds after which its persona walks unless offered its limit (`PersonaModel.strategy.walk_after_rounds`); `undefined` without it. */
  herWalkAfterRounds?: number;
}

export type Rule =
  | "anchor"
  | "boulware"
  | "reciprocity"
  | "adaptive"
  | "adaptive-fallback"
  | "mirror-first-step"
  | "ac-next"
  | "welcome-first-deal"
  | "welcome-counter"
  | "final-above-reservation"
  | "final-below-reservation"
  | "fixed-price"
  | "fixed-price-out-of-range"
  | "opening-last-chance"
  | "lowball-bid"
  | "stuck-at-reservation"
  | "stuck-accept-within-limit"
  | "hold"
  | "holds-exhausted"
  | "no-zone"
  | "one-message-per-tick"
  | "one-accept-per-tick"
  | "structure-mismatch"
  | "named-card-revalue"
  | "asset-busy";

export type Action =
  | { kind: "accept"; offerId: number; price: number }
  | { kind: "counter"; price: number }
  | { kind: "hold"; price: number }
  | { kind: "close" }
  | { kind: "wait" };

export interface Decision {
  action: Action;
  rule: Rule;
  /** Effective reservation: the private one, trimmed so as not to close at its opening price. */
  effectiveReservation: number;
  /** Counteroffer we would send (for AC_next and traces). */
  ourNext?: number;
}

const better = (side: Side, a: number, b: number) => (side === "buy" ? a < b : a > b);
const atLeastAsGood = (side: Side, a: number, b: number) => (side === "buy" ? a <= b : a >= b);

export function effectiveReservation(view: Pick<ThreadView, "side" | "reservation" | "herOpening">): number {
  const { side, reservation, herOpening } = view;
  if (side === "buy") return Math.floor(herOpening === undefined ? reservation : Math.min(reservation, herOpening - 1));
  return Math.ceil(herOpening === undefined ? reservation : Math.max(reservation, herOpening + 1));
}

export function anchorPrice(view: Pick<ThreadView, "side" | "reservation" | "herOpening" | "herList">, p: NegotiatorParams, effRes: number): number {
  // Sell: the anchor never exceeds its list × sellAnchorCapMult (without its list, no cap); the floor is still effRes.
  const sellCap = view.herList !== undefined ? Math.round(view.herList * p.sellAnchorCapMult) : undefined;
  const clampSell = (x: number) => Math.max(effRes, sellCap !== undefined ? Math.min(x, sellCap) : x);
  if (p.stepMode === "adaptive") {
    if (view.side === "buy") {
      const ref = view.herOpening ?? view.reservation;
      return Math.max(1, Math.min(effRes - 1, Math.round(ref * p.buyAnchorFrac)));
    }
    if (view.herOpening === undefined || view.herOpening < view.reservation) return clampSell(Math.ceil(view.reservation * p.sellFloorAnchorMult));
    // Its bid already covers our floor: anchor relative to it, but closable within its patience with steps of `maxStep`.
    const closable = effRes + Math.max(1, p.maxStep) * Math.max(0, p.patienceBudget - 1);
    return clampSell(Math.min(closable, Math.round(view.herOpening * p.sellAnchorMult)));
  }
  if (view.side === "buy") {
    const ref = Math.min(view.reservation, view.herOpening ?? view.reservation);
    return Math.max(1, Math.min(effRes, Math.round(ref * p.buyAnchorFrac)));
  }
  const ref = Math.max(view.reservation, view.herOpening ?? view.reservation);
  return clampSell(Math.round(ref * p.sellAnchorMult));
}

/** What it conceded in its last move, in our direction (0 if it didn't move or went back). */
export function herLastConcession(side: Side, herPrices: readonly number[]): number {
  if (herPrices.length < 2) return 0;
  const cur = herPrices[herPrices.length - 1]!;
  const prev = herPrices[herPrices.length - 2]!;
  return Math.max(0, side === "buy" ? prev - cur : cur - prev);
}

/** Our concessions: times our price moved closer to its price relative to the previous one. */
export function ourConcessions(side: Side, ourPrices: readonly number[]): number {
  let n = 0;
  for (let i = 1; i < ourPrices.length; i++) if (better(side, ourPrices[i - 1]!, ourPrices[i]!)) n += 1;
  return n;
}

/**
 * Its price has not moved after `fixedAfterConcessions` of our concessions (Abuela buying commons, thread 56).
 * Only when the dealer buys from us (we sell): when it sells to us it does concede (thread 178: 29→25), so we negotiate until its final.
 * And only if its persona concedes early (`herBeta` ≥ `fixedPriceMinBeta`): with β < 1 its curve doesn't move at first.
 */
export function herPriceIsFixed(view: Pick<ThreadView, "side" | "herPrices" | "ourPrices" | "herCurrent" | "herBeta">, p: Pick<NegotiatorParams, "fixedAfterConcessions" | "fixedPriceMinBeta">): boolean {
  if (view.side !== "sell" || p.fixedAfterConcessions <= 0 || !view.herCurrent || view.herPrices.length === 0) return false;
  if (view.herBeta !== undefined && view.herBeta < p.fixedPriceMinBeta) return false;
  const first = view.herPrices[0]!;
  if (view.herCurrent.price !== first || view.herPrices.some((x) => x !== first)) return false;
  return ourConcessions(view.side, view.ourPrices) >= p.fixedAfterConcessions;
}

/** Its price fits our private reservation (without the opening trim) and creates value at our private value. */
export function valuePositive(view: Pick<ThreadView, "side" | "reservation" | "privateValue">, price: number): boolean {
  if (!atLeastAsGood(view.side, price, view.reservation)) return false;
  return view.privateValue === undefined || better(view.side, price, view.privateValue);
}

export interface StepResponse {
  /** Index of our message (1 = the first concession after the anchor). */
  index: number;
  /** Size of our step (P, towards her). */
  step: number;
  /** How much she moved towards us in response (may be 0 or negative). */
  herMove: number;
}

/** Its response to each of our already-answered steps (the anchor is not a step). */
export function stepResponses(view: Pick<ThreadView, "side" | "ourPrices" | "herPrices" | "herCurrent" | "herAtOurMessages">): StepResponse[] {
  const { side, ourPrices } = view;
  const aligned = view.herAtOurMessages && view.herAtOurMessages.length === ourPrices.length && view.herCurrent;
  const her = aligned ? [...view.herAtOurMessages!, view.herCurrent!.price] : view.herPrices;
  const out: StepResponse[] = [];
  for (let j = 1; j < ourPrices.length; j++) {
    const before = her[j];
    const after = her[j + 1];
    if (before === undefined || after === undefined) break;
    out.push({ index: j, step: Math.abs(ourPrices[j]! - ourPrices[j - 1]!), herMove: side === "buy" ? before - after : after - before });
  }
  return out;
}

/** Some big step (≥ 2) extracted no more than the best of our steps of 1 (0 if there was none yet): go back to steps of 1. */
export function bigStepsDidNotPay(responses: readonly StepResponse[]): boolean {
  const big = responses.filter((r) => r.step >= 2);
  if (!big.length) return false;
  const ones = responses.filter((r) => r.step === 1);
  const baseline = ones.length ? Math.max(...ones.map((r) => r.herMove)) : 0;
  return big.some((r) => r.herMove <= baseline);
}

export type MirrorVerdict = "mirror" | "not-mirror" | "unknown";

/**
 * Do its steps follow ours (`mirror_concessions`)? Sizes are compared: «mirror» if some big step of ours
 * (≥ 2) extracted more than the best of our steps of 1 (or than 0); «not-mirror» if none did
 * (`bigStepsDidNotPay`): then we go back to small steps. Without answered big steps, «unknown».
 */
export function mirrorVerdict(responses: readonly StepResponse[]): MirrorVerdict {
  if (!responses.some((r) => r.step >= 2)) return "unknown";
  return bigStepsDidNotPay(responses) ? "not-mirror" : "mirror";
}

/** Adaptive step: ⌈gap to our limit ÷ messages of patience it has left⌉, between 1 and `maxStep`. */
export function adaptiveStep(gap: number, sent: number, p: Pick<NegotiatorParams, "patienceBudget" | "maxStep">): number {
  const remaining = Math.max(1, p.patienceBudget - sent);
  return Math.min(Math.max(1, p.maxStep), Math.max(1, Math.ceil(Math.max(0, gap) / remaining)));
}

/** Planned path from the anchor to our limit in `patienceBudget` messages if she responds (without going back to steps of 1). */
export function plannedSchedule(view: Pick<ThreadView, "side" | "reservation" | "herOpening" | "herList">, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): number[] {
  const effRes = effectiveReservation(view);
  if (effRes < 1) return [];
  const dir = view.side === "buy" ? 1 : -1;
  const prices = [anchorPrice(view, p, effRes)];
  while (prices.length < Math.max(1, p.patienceBudget)) {
    const prev = prices[prices.length - 1]!;
    const gap = dir * (effRes - prev);
    if (gap <= 0) break;
    prices.push(prev + dir * Math.min(gap, p.stepMode === "adaptive" ? adaptiveStep(gap, prices.length, p) : 1));
  }
  return prices;
}

/**
 * Next counteroffer, strictly monotonic and not crossing the effective reservation. Adaptive: step according to the
 * patience it has left (back to 1 if big steps don't pay). Boulware: engine curve and reciprocity.
 */
export function nextPrice(view: ThreadView, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): { price: number; rule: Rule } | undefined {
  const effRes = effectiveReservation(view);
  const anchor = anchorPrice(view, p, effRes);
  const cap = view.herLimitCap;
  const offerRes = cap === undefined ? effRes : view.side === "buy" ? Math.min(effRes, cap) : Math.max(effRes, cap);
  const mandate: Mandate = { role: view.side === "buy" ? "buyer" : "seller", reservation: offerRes };
  const prev = view.ourPrices[view.ourPrices.length - 1];
  if (prev === undefined) return { price: enforceGuardrails(mandate, anchor), rule: "anchor" };

  // First concession after the anchor with `firstStepFrac` (mirror_concessions): big step, guardrails and monotonicity intact.
  if (view.ourPrices.length === 1 && p.firstStepFrac > 0) {
    const dir = view.side === "buy" ? 1 : -1;
    const big = Math.max(1, Math.round(p.firstStepFrac * Math.abs(effRes - view.ourPrices[0]!)));
    const normal = p.stepMode === "adaptive" ? adaptiveStep(dir * (effRes - prev), 1, p) : 1;
    const price = enforceGuardrails(mandate, prev + dir * Math.max(big, normal), prev);
    if (price !== prev) return { price, rule: big > normal ? "mirror-first-step" : "adaptive" };
  }

  if (p.stepMode === "adaptive") {
    const dir = view.side === "buy" ? 1 : -1;
    const wanted = adaptiveStep(dir * (effRes - prev), view.ourPrices.length, p);
    const fallback = wanted > 1 && bigStepsDidNotPay(stepResponses(view));
    const price = enforceGuardrails(mandate, prev + dir * (fallback ? 1 : wanted), prev);
    if (price === prev) return undefined;
    return { price, rule: fallback ? "adaptive-fallback" : "adaptive" };
  }

  const dir = view.side === "buy" ? 1 : -1;
  const span = Math.abs(effRes - anchor);
  const maxStep = Math.max(1, Math.round(span * p.maxStepFrac));
  const t = view.ourPrices.length / p.horizon;
  const target = Math.round(anchor + (effRes - anchor) * concession(t, p.beta));
  const herMove = herLastConcession(view.side, view.herPrices);
  const step = herMove > 0 ? Math.min(maxStep, Math.max(1, Math.round(herMove * p.reciprocity))) : 1;
  const byStep = prev + dir * step;
  const byCurve = dir > 0 ? Math.min(target, prev + maxStep) : Math.max(target, prev - maxStep);
  const proposed = dir > 0 ? Math.max(byStep, byCurve) : Math.min(byStep, byCurve);
  const price = enforceGuardrails(mandate, proposed, prev);
  if (price === prev) return undefined;
  return { price, rule: herMove > 0 && Math.abs(byStep - prev) >= Math.abs(byCurve - prev) ? "reciprocity" : "boulware" };
}

/**
 * Allowed holds: `maxHolds` (1 by default). Previously, in adaptive mode, we held up to its patience + maxHolds
 * messages waiting for its final; live (thread 184: we held 9 over 6 ticks) no final ever came and she
 * left with `no_progress`, so holding the same price doesn't extract the final: it provokes the walk-away.
 */
export function holdsAllowed(_pricedSent: number, p: Pick<NegotiatorParams, "stepMode" | "maxHolds" | "patienceBudget">): number {
  return p.maxHolds;
}

/**
 * Its first and current prices are far from our limit after a counteroffer of ours: sell, bid < `lowballFrac` ×
 * our floor; buy, price > our max ÷ `lowballFrac` (e.g. when revealing a duplicate by rarity+set).
 */
export function isLowball(view: Pick<ThreadView, "side" | "reservation" | "herOpening" | "herCurrent" | "ourPrices">, p: Pick<NegotiatorParams, "lowballFrac">): boolean {
  if (p.lowballFrac <= 0 || view.ourPrices.length < 1 || !view.herCurrent) return false;
  const first = view.herOpening ?? view.herCurrent.price;
  if (view.side === "buy") {
    const ceiling = view.reservation / p.lowballFrac;
    return first > ceiling && view.herCurrent.price > ceiling;
  }
  const floor = p.lowballFrac * view.reservation;
  return first < floor && view.herCurrent.price < floor;
}

/**
 * `welcome_first_deal`: in the first conversation with a new dealer its opening is its limit. Accepting the opening
 * without offering counts as took_opening, not as a negotiated deal (personas.md § 9), so first ONE counteroffer
 * of ours 1 P better for us goes out (`welcome-counter`, with guardrails); the dealer can't pass its limit and repeats the
 * price, and then it is accepted (`welcome-first-deal`). Only if its price fits the private reservation and creates value at
 * our private value (EV > 0); in that conversation it replaces the «don't close at its opening» of `effectiveReservation`.
 * Live (thread 894, Pilar) her welcome opening was NOT her limit (47 → 48 → 50), so `decide` only takes it with a
 * `welcomeTakeReason`; otherwise the usual negotiation goes on.
 */
export function welcomeTake(view: Pick<ThreadView, "side" | "reservation" | "privateValue" | "herCurrent" | "welcomeFirstDeal">): boolean {
  return !!view.welcomeFirstDeal && !!view.herCurrent && view.privateValue !== undefined && valuePositive(view, view.herCurrent.price);
}

/**
 * Share of her range (her opening → her expected limit `herLimitCap`) that `price` captures for us, 0–1: the ladder
 * share (RULES.md:118, personas.md § 9). `undefined` without her opening or an expected limit.
 */
export function rangeShare(view: Pick<ThreadView, "side" | "herOpening" | "herLimitCap">, price: number): number | undefined {
  const { herOpening: open, herLimitCap: limit } = view;
  if (open === undefined || limit === undefined) return undefined;
  const span = view.side === "sell" ? limit - open : open - limit;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (view.side === "sell" ? price - open : open - price) / span));
}

export type WelcomeTakeReason = "final" | "share" | "stalled" | "walk-risk";

/**
 * Why a welcome price may be taken now instead of countering toward our anchor, or `undefined` to keep negotiating:
 * her offer is `final`; it already captures `welcomeTakeShare` of her range; she stopped moving after our last
 * counter (her limit; not with β < `fixedPriceMinBeta`, whose curve doesn't move early); or our next counter would go
 * past her persona's `walk_after_rounds` (past it she walks unless offered her limit, personas.md § 3).
 */
export function welcomeTakeReason(view: ThreadView, p: Pick<NegotiatorParams, "welcomeTakeShare" | "fixedPriceMinBeta">): WelcomeTakeReason | undefined {
  const her = view.herCurrent;
  if (!her) return undefined;
  if (her.final) return "final";
  const share = rangeShare(view, her.price);
  if (share !== undefined && share >= p.welcomeTakeShare) return "share";
  const n = view.ourPrices.length;
  // Stalled: she already answered our last counter (one price per reply after her opening) with the same price.
  if (n >= 1 && view.herPrices.length >= n + 1 && (view.herBeta === undefined || view.herBeta >= p.fixedPriceMinBeta)) {
    if (view.herPrices[view.herPrices.length - 2] === her.price) return "stalled";
  }
  // Our next counter would go past her measured patience (thread 901: Pilar answered our 4th counter with her final).
  if (view.herWalkAfterRounds !== undefined && n >= Math.round(view.herWalkAfterRounds)) return "walk-risk";
  return undefined;
}

export function decide(view: ThreadView, p: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): Decision {
  const effRes = effectiveReservation(view);
  const welcomeWhy = view.herCurrent && welcomeTake(view) ? welcomeTakeReason(view, p) : undefined;
  // Welcome price with room left in her range: no early take, the usual negotiation (anchor, steps, AC_next) goes on.
  if (view.herCurrent && welcomeWhy) {
    const her = view.herCurrent;
    if (view.ourPrices.length === 0) {
      const mandate: Mandate = { role: view.side === "buy" ? "buyer" : "seller", reservation: view.reservation };
      const price = enforceGuardrails(mandate, her.price + (view.side === "buy" ? -1 : 1));
      if (price !== her.price && price >= 1) {
        if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes };
        return { action: { kind: "counter", price }, rule: "welcome-counter", effectiveReservation: effRes, ourNext: price };
      }
    }
    if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
    return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule: "welcome-first-deal", effectiveReservation: effRes };
  }
  if (effRes < 1) return { action: { kind: "close" }, rule: "no-zone", effectiveReservation: effRes };
  const next = nextPrice(view, p);
  const her = view.herCurrent;

  if (her && herPriceIsFixed(view, p)) {
    if (!valuePositive(view, her.price)) return { action: { kind: "close" }, rule: "fixed-price-out-of-range", effectiveReservation: effRes };
    if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
    return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule: "fixed-price", effectiveReservation: effRes };
  }

  if (her) {
    const isOpening = view.herOpening !== undefined && her.price === view.herOpening;
    const withinRes = !isOpening && atLeastAsGood(view.side, her.price, effRes);
    // AC_next: its offer is at least as good as the one we would send; or we can no longer move.
    const acNext = withinRes && (next === undefined || atLeastAsGood(view.side, her.price, next.price));
    // A final offer is accepted if it fits the private reservation and creates value, even if it is its opening (counts as a deal).
    const finalTake = her.final && valuePositive(view, her.price);
    // It is about to leave (final, or our next message exhausts the patience we estimated for it) with its opening
    // unmoved: better to close at positive cash than risk no-deal (thread 257: its opening 13, reservation 9).
    const aboutToWalk = her.final || view.ourPrices.length >= p.patienceBudget - 1;
    const openingLastChance = isOpening && !finalTake && aboutToWalk && valuePositive(view, her.price);
    const take = acNext || finalTake || openingLastChance;
    if (take) {
      const rule: Rule = acNext ? "ac-next" : finalTake ? "final-above-reservation" : "opening-last-chance";
      if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
      return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule, effectiveReservation: effRes, ...(next ? { ourNext: next.price } : {}) };
    }
    if (her.final) return { action: { kind: "close" }, rule: "final-below-reservation", effectiveReservation: effRes };
    if (isLowball(view, p)) return { action: { kind: "close" }, rule: "lowball-bid", effectiveReservation: effRes };
  }

  // Stuck: our next counteroffer would cross the effective reservation (doesn't improve its offer, or no
  // room to move). Instead of closing at once, we hold the price a few ticks (without a final offer from it)
  // so she says her last word; we only close once the holds are exhausted.
  const stuck = next === undefined || (her !== undefined && !better(view.side, next.price, her.price));
  if (stuck) {
    // Stuck with its price within our private limit and creating value: accept now (the deal counts).
    if (her && valuePositive(view, her.price)) {
      if (!view.canAccept) return { action: { kind: "wait" }, rule: "one-accept-per-tick", effectiveReservation: effRes };
      return { action: { kind: "accept", offerId: her.offerId, price: her.price }, rule: "stuck-accept-within-limit", effectiveReservation: effRes };
    }
    const prevPrice = view.ourPrices[view.ourPrices.length - 1];
    const holdsUsed = view.holdsUsed ?? 0;
    // Never two messages without an offer in a row (the judge may flag it as spam, site-map § 9.5).
    if (her && !her.final && prevPrice !== undefined && !view.lastWasTextOnly && holdsUsed < holdsAllowed(view.ourPrices.length, p)) {
      if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes };
      return { action: { kind: "hold", price: prevPrice }, rule: "hold", effectiveReservation: effRes };
    }
    return { action: { kind: "close" }, rule: holdsUsed > 0 ? "holds-exhausted" : "stuck-at-reservation", effectiveReservation: effRes };
  }
  if (!view.canMessage) return { action: { kind: "wait" }, rule: "one-message-per-tick", effectiveReservation: effRes, ourNext: next.price };
  return { action: { kind: "counter", price: next.price }, rule: next.rule, effectiveReservation: effRes, ourNext: next.price };
}
