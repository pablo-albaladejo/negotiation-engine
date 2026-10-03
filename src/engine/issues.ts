import type { Issue } from "./config.js";
import type { Role } from "./guardrails.js";

/** One value per declared issue. */
export type Offer = Record<string, number>;

/**
 * Private session mandate: role and per-issue limits (the reservation offer).
 * Reservation utility is computed with the same utility function.
 * Set by code from the scenario or session configuration, never by the rival's text.
 */
export interface OfferMandate {
  role: Role;
  reservation: Offer;
  /** Optional band in % APR (`src/engine/apr.ts`); if present, it overrides the per-issue reservation. */
  apr?: AprBand;
}

/**
 * Mandate in % APR for `{ pct, day }` offers: hard limits `[min, max]`, original term
 * `baseDays` (net 30/60) and the reference payment day of our offers.
 */
export interface AprBand {
  min: number;
  max: number;
  baseDays: number;
  day: number;
}

/** Precision of our offers (decimals). */
export const OFFER_DECIMALS = 2;
const EPS = 1e-9;

/**
 * `direction` is declared in the configuration from the buyer role; for the seller it is flipped.
 * The whole engine works with issues already oriented to our role.
 */
export function orientIssues(issues: readonly Issue[], role: Role): Issue[] {
  if (role === "buyer") return issues.map((i) => ({ ...i }));
  return issues.map((i) => ({
    ...i,
    direction: i.direction === "higher-better" ? "lower-better" : "higher-better",
  }));
}

function valueOf(offer: Offer, issue: Issue): number {
  const value = offer[issue.name];
  if (value === undefined || !Number.isFinite(value)) {
    throw new Error(`Offer has no finite value for issue ${issue.name}`);
  }
  return value;
}

/** Linear scale to [0, 1] by the issue's bounds and direction, clipping outside the bounds. */
export function normalizeIssue(issue: Issue, value: number): number {
  const raw = (value - issue.min) / (issue.max - issue.min);
  const clipped = Math.min(1, Math.max(0, raw));
  return issue.direction === "higher-better" ? clipped : 1 - clipped;
}

/** Weighted additive utility: u = Σ wᵢ · normᵢ(xᵢ), in [0, 1]. Weights already normalized to sum 1. */
export function utility(issues: readonly Issue[], offer: Offer): number {
  let total = 0;
  for (const issue of issues) total += issue.weight * normalizeIssue(issue, valueOf(offer, issue));
  return Math.min(1, Math.max(0, total));
}

/** Issue value whose normalized utility is `u`. */
export function valueAtNorm(issue: Issue, u: number): number {
  const span = issue.max - issue.min;
  const clamped = Math.min(1, Math.max(0, u));
  return issue.direction === "higher-better" ? issue.min + clamped * span : issue.max - clamped * span;
}

/** An offer with utility `u`: each issue at its own level `u` (Σ wᵢ · u = u). */
export function offerAtUtility(issues: readonly Issue[], u: number): Offer {
  return Object.fromEntries(issues.map((issue) => [issue.name, valueAtNorm(issue, u)]));
}

/**
 * Rounds each value to offer precision in the direction that favors us. The EPS avoids
 * jumping a cent due to floating-point noise (2.31 · 100 = 231.00000000000003), but if after
 * rounding the value is still against us (0.1 + 0.2 → 0.3 < 0.30000000000000004) we step
 * one step in our favor: the result is never worse than the input.
 */
export function roundInFavor(issues: readonly Issue[], offer: Offer): Offer {
  const factor = 10 ** OFFER_DECIMALS;
  return Object.fromEntries(
    issues.map((issue) => {
      const value = valueOf(offer, issue);
      const higher = issue.direction === "higher-better";
      const scaled = value * factor;
      let rounded = higher ? Math.ceil(scaled - EPS) : Math.floor(scaled + EPS);
      if (higher ? rounded / factor < value : rounded / factor > value) rounded += higher ? 1 : -1;
      return [issue.name, rounded / factor];
    }),
  );
}

/** No issue crosses its reservation limit (and therefore u ≥ u(reservation)). Strict: no tolerance. */
export function withinOfferMandate(issues: readonly Issue[], mandate: OfferMandate, offer: Offer): boolean {
  return issues.every((issue) => {
    const value = valueOf(offer, issue);
    const limit = valueOf(mandate.reservation, issue);
    return issue.direction === "higher-better" ? value >= limit : value <= limit;
  });
}

/**
 * Every declared issue has a finite value within its `[min, max]` range. A rival offer
 * that fails this is not a valid offer: it is neither accepted nor fed to the rival model.
 */
export function withinIssueRanges(issues: readonly Issue[], offer: Offer): boolean {
  return issues.every((issue) => {
    const value = offer[issue.name];
    return value !== undefined && Number.isFinite(value) && value >= issue.min && value <= issue.max;
  });
}

export function reservationUtility(issues: readonly Issue[], mandate: OfferMandate): number {
  return utility(issues, mandate.reservation);
}

/**
 * Condition for every acceptance (any rule): within per-issue limits and `u ≥ u(reservation)`.
 * With monotone utility the second follows from the first; it is checked anyway so that no
 * acceptance rule depends on that deduction.
 */
export function acceptableForUs(issues: readonly Issue[], mandate: OfferMandate, offer: Offer): boolean {
  return withinOfferMandate(issues, mandate, offer) && utility(issues, offer) >= reservationUtility(issues, mandate);
}

export function sameOffer(issues: readonly Issue[], a: Offer, b: Offer, eps = 1e-6): boolean {
  return issues.every((issue) => Math.abs(valueOf(a, issue) - valueOf(b, issue)) <= eps);
}

/** Only the declared issues, in their order. */
export function pickIssues(issues: readonly Issue[], offer: Offer): Offer {
  return Object.fromEntries(issues.map((issue) => [issue.name, valueOf(offer, issue)]));
}
