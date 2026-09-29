import type { Issue } from "./config.js";
import { normalizeIssue, roundInFavor, utility, valueAtNorm, type Offer } from "./issues.js";
import type { Rng } from "./rng.js";

/** Utilidad de apertura: fracción `openingMargin` del tramo entre la reserva y 1. */
export function openingUtility(reservationUtility: number, openingMargin: number): number {
  return reservationUtility + openingMargin * (1 - reservationUtility);
}

/** Fracción concedida en t (Faratin et al.): t^(1/β). β = 0 no concede hasta t = 1. */
export function concession(t: number, beta: number): number {
  const time = Math.min(1, Math.max(0, t));
  if (time >= 1) return 1;
  if (beta === 0) return 0;
  return time ** (1 / beta);
}

export function boulwareTarget(t: number, uOpen: number, uRes: number, beta: number): number {
  return uOpen - (uOpen - uRes) * concession(t, beta);
}

/** ε ∈ [−n, n] del generador sembrado de la caja. */
export function sampleEpsilon(rng: Rng, noise: number): number {
  return noise === 0 ? 0 : rng.between(-noise, noise);
}

export interface UtilityStep {
  uOpen: number;
  uRes: number;
  beta: number;
  t: number;
  /** Utilidad de nuestra oferta anterior; ausente en la primera oferta. */
  previousUtility?: number;
  epsilon: number;
}

/**
 * Utilidad objetivo de nuestra siguiente oferta. El ruido se aplica al paso, no a la oferta:
 * paso' = max(0, paso · (1 + ε)), así nunca sube nuestra utilidad. En t = 1 no hay ruido:
 * se ofrece la oferta de t = 1 (la reserva).
 */
export function nextUtility(step: UtilityStep): number {
  if (step.previousUtility === undefined) return step.uOpen;
  const target = boulwareTarget(step.t, step.uOpen, step.uRes, step.beta);
  if (step.t >= 1) return Math.max(step.uRes, Math.min(step.previousUtility, target));
  const base = Math.max(0, step.previousUtility - target);
  const noisy = Math.max(0, base * (1 + step.epsilon));
  return Math.max(step.uRes, step.previousUtility - noisy);
}

/**
 * Oferta con utilidad `u` que respeta los límites por issue: cada issue se interpola entre su
 * nivel de reserva rᵢ y 1 con el mismo λ, ℓᵢ = rᵢ + λ(1 − rᵢ), de modo que Σ wᵢ·ℓᵢ = u.
 */
export function offerAboveReservation(issues: readonly Issue[], reservation: Offer, u: number): Offer {
  const levels = issues.map((issue) => normalizeIssue(issue, reservation[issue.name]!));
  const uRes = issues.reduce((sum, issue, k) => sum + issue.weight * levels[k]!, 0);
  const lambda = uRes >= 1 ? 1 : Math.min(1, Math.max(0, (u - uRes) / (1 - uRes)));
  return Object.fromEntries(
    issues.map((issue, k) => [issue.name, valueAtNorm(issue, levels[k]! + lambda * (1 - levels[k]!))]),
  );
}

export interface OfferParams {
  /** Issues orientados a nuestro rol. */
  issues: readonly Issue[];
  /** Límites por issue del mandato. */
  reservation: Offer;
  uRes: number;
  openingMargin: number;
  beta: number;
}

/** Propuesta Boulware sin reciprocidad, redondeada a nuestro favor; pasa después por los guardarraíles. */
export function generateOffer(
  params: OfferParams,
  t: number,
  epsilon: number,
  previous?: Offer,
): Offer {
  const step: UtilityStep = {
    uOpen: openingUtility(params.uRes, params.openingMargin),
    uRes: params.uRes,
    beta: params.beta,
    t,
    epsilon,
  };
  if (previous) step.previousUtility = utility(params.issues, previous);
  return roundInFavor(params.issues, offerAboveReservation(params.issues, params.reservation, nextUtility(step)));
}
