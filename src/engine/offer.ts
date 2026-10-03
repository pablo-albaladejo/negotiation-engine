import type { Issue } from "./config.js";
import { normalizeIssue, roundInFavor, utility, valueAtNorm, type Offer } from "./issues.js";
import type { Rng } from "./rng.js";

/** Opening utility: fraction `openingMargin` of the span between the reservation and 1. */
export function openingUtility(reservationUtility: number, openingMargin: number): number {
  return reservationUtility + openingMargin * (1 - reservationUtility);
}

/** Fraction conceded at t (Faratin et al.): t^(1/β). β = 0 does not concede until t = 1. */
export function concession(t: number, beta: number): number {
  const time = Math.min(1, Math.max(0, t));
  if (time >= 1) return 1;
  if (beta === 0) return 0;
  return time ** (1 / beta);
}

export function boulwareTarget(t: number, uOpen: number, uRes: number, beta: number): number {
  const c = concession(t, beta);
  // Full concession: exactly the reservation utility, without floating-point noise.
  return c >= 1 ? uRes : uOpen - (uOpen - uRes) * c;
}

/** ε ∈ [−n, n] from the box's seeded generator. */
export function sampleEpsilon(rng: Rng, noise: number): number {
  return noise === 0 ? 0 : rng.between(-noise, noise);
}

/**
 * Tit-for-Tat reciprocity as a factor in [0, 1] on our step: with weight `weight`, the step is
 * reduced in proportion to what the rival conceded (in our utility) versus our last
 * concession. Without data for either concession, 1 (Boulware curve unchanged).
 */
export function reciprocityFactor(weight: number, rivalConcession: number | undefined, ourConcession: number | undefined): number {
  if (weight <= 0 || rivalConcession === undefined || ourConcession === undefined || ourConcession <= 0) return 1;
  const ratio = Math.min(1, Math.max(0, rivalConcession / ourConcession));
  return 1 - Math.min(1, weight) * (1 - ratio);
}

export interface UtilityStep {
  uOpen: number;
  uRes: number;
  beta: number;
  t: number;
  /** Utility of our previous offer; absent on the first offer. */
  previousUtility?: number;
  epsilon: number;
  /** Reciprocity factor in [0, 1]; absent = 1. It can only reduce the step. */
  reciprocity?: number;
}

/**
 * Target utility of our next offer. Noise is applied to the step, not the offer:
 * step' = max(0, step · (1 + ε)), so our utility never rises. At t = 1 there is no noise:
 * the t = 1 offer (the reservation) is made.
 */
export function nextUtility(step: UtilityStep): number {
  if (step.previousUtility === undefined) return step.uOpen;
  const target = boulwareTarget(step.t, step.uOpen, step.uRes, step.beta);
  if (step.t >= 1) return Math.max(step.uRes, Math.min(step.previousUtility, target));
  const base = Math.max(0, step.previousUtility - target);
  const factor = Math.min(1, Math.max(0, step.reciprocity ?? 1));
  const noisy = Math.max(0, base * (1 + step.epsilon)) * factor;
  return Math.max(step.uRes, step.previousUtility - noisy);
}

/**
 * Offer with utility `u` that respects per-issue limits: each issue is interpolated between its
 * reservation level rᵢ and 1 with the same λ, ℓᵢ = rᵢ + λ(1 − rᵢ), so that Σ wᵢ·ℓᵢ = u.
 */
export function offerAboveReservation(issues: readonly Issue[], reservation: Offer, u: number): Offer {
  const levels = issues.map((issue) => normalizeIssue(issue, reservation[issue.name]!));
  const uRes = issues.reduce((sum, issue, k) => sum + issue.weight * levels[k]!, 0);
  const lambda = uRes >= 1 ? 1 : Math.min(1, Math.max(0, (u - uRes) / (1 - uRes)));
  // λ = 0 is the reservation itself: its exact value, not the round trip through normalization.
  return Object.fromEntries(
    issues.map((issue, k) => [issue.name, lambda === 0 ? reservation[issue.name]! : valueAtNorm(issue, levels[k]! + lambda * (1 - levels[k]!))]),
  );
}

export interface OfferParams {
  /** Issues orientados a nuestro rol. */
  issues: readonly Issue[];
  /** Per-issue limits of the mandate. */
  reservation: Offer;
  uRes: number;
  openingMargin: number;
  beta: number;
}

/** Boulware proposal without reciprocity, rounded in our favor; it then goes through the guardrails. */
export function generateOffer(
  params: OfferParams,
  t: number,
  epsilon: number,
  previous?: Offer,
  reciprocity = 1,
): Offer {
  const step: UtilityStep = {
    uOpen: openingUtility(params.uRes, params.openingMargin),
    uRes: params.uRes,
    beta: params.beta,
    t,
    epsilon,
    reciprocity,
  };
  if (previous) step.previousUtility = utility(params.issues, previous);
  return roundInFavor(params.issues, offerAboveReservation(params.issues, params.reservation, nextUtility(step)));
}
