import type { Issue } from "./config.js";
import { pickIssues, utility, valueAtNorm, type Offer } from "./issues.js";

/** Lo que el modelo del rival expone al resto del motor. Nunca incluye sus afirmaciones. */
export interface OpponentSummary {
  offersSeen: number;
  currentOffer?: Offer;
  /** La oferta del rival más favorable para nosotros hasta ahora. */
  bestOffer?: Offer;
  /** Utilidad (nuestra) ganada entre sus dos últimas ofertas; 0 con menos de dos. */
  lastConcession: number;
  /** Media de sus concesiones en nuestra utilidad. */
  averageConcession: number;
  estimatedReservation: Offer;
  /** β ajustado de su curva de concesión (regresión); ausente si no hay datos para ajustarla. */
  concessionBeta?: number;
  /** Pesos estimados del rival por frecuencias (issue que menos mueve ⇒ más peso); suman 1. */
  estimatedWeights: Record<string, number>;
  /** 0 = solo a priori; crece con el número de ofertas. */
  confidence: number;
}

export interface ConcessionFit {
  /** Valor estimado en t = 1: la reserva del rival en ese issue. */
  reservation: number;
  beta: number;
  sse: number;
}

/** Rejilla logarítmica de β entre 0,05 y 20. */
const BETA_GRID = Array.from({ length: 53 }, (_, k) => 10 ** (-1.3 + k * 0.05));

/**
 * Regresión de la curva de concesión dependiente del tiempo x(t) = a + c · t^(1/β): para cada β de
 * la rejilla, mínimos cuadrados lineales en (a, c); se queda el β de menor error. La reserva es x(1).
 * Hace falta al menos 3 puntos con t ∈ (0, 1] y algún movimiento.
 */
export function fitConcessionCurve(points: readonly { t: number; x: number }[]): ConcessionFit | undefined {
  const pts = points.filter((p) => p.t > 0 && p.t <= 1 && Number.isFinite(p.x));
  if (pts.length < 3 || pts.every((p) => p.x === pts[0]!.x)) return undefined;
  const n = pts.length;
  const meanX = pts.reduce((s, p) => s + p.x, 0) / n;
  let best: ConcessionFit | undefined;
  for (const beta of BETA_GRID) {
    const f = pts.map((p) => p.t ** (1 / beta));
    const meanF = f.reduce((s, v) => s + v, 0) / n;
    const sff = f.reduce((s, v) => s + (v - meanF) ** 2, 0);
    if (sff < 1e-12) continue;
    const c = f.reduce((s, v, k) => s + (v - meanF) * (pts[k]!.x - meanX), 0) / sff;
    const a = meanX - c * meanF;
    const sse = f.reduce((s, v, k) => s + (pts[k]!.x - a - c * v) ** 2, 0);
    if (!best || sse < best.sse) best = { reservation: a + c, beta, sse };
  }
  return best;
}

/** A priori del escenario: sin ofertas, suponemos la reserva del rival en el punto medio del rango. */
export function priorFromIssues(issues: readonly Issue[]): Offer {
  return Object.fromEntries(issues.map((issue) => [issue.name, valueAtNorm(issue, 0.5)]));
}

/**
 * Modelo simple del rival (issues orientados a nuestro rol). Las afirmaciones del rival
 * son datos no fiables: se guardan en un campo privado y no salen del modelo.
 */
export class OpponentModel {
  readonly #issues: readonly Issue[];
  readonly #prior: Offer;
  readonly #offers: Offer[] = [];
  /** t ∈ [0, 1] de cada oferta, si se conoce (campos del ring o `defaultHorizon`). */
  readonly #times: (number | undefined)[] = [];
  readonly #claims: string[] = [];

  constructor(issues: readonly Issue[], prior: Offer = priorFromIssues(issues)) {
    this.#issues = issues;
    this.#prior = pickIssues(issues, prior);
  }

  recordOffer(offer: Offer, t?: number): void {
    this.#offers.push(pickIssues(this.#issues, offer));
    this.#times.push(t);
  }

  recordClaims(claims: readonly string[]): void {
    this.#claims.push(...claims);
  }

  get claimCount(): number {
    return this.#claims.length;
  }

  summary(): OpponentSummary {
    const offers = this.#offers;
    const utilities = offers.map((offer) => utility(this.#issues, offer));
    const concessions = utilities.slice(1).map((u, i) => u - utilities[i]!);
    let bestIndex = -1;
    utilities.forEach((u, i) => {
      if (bestIndex < 0 || u > utilities[bestIndex]!) bestIndex = i;
    });
    const best = offers[bestIndex];
    const regression = best ? this.#regression(best) : undefined;
    const summary: OpponentSummary = {
      offersSeen: offers.length,
      lastConcession: concessions.at(-1) ?? 0,
      averageConcession: concessions.length ? concessions.reduce((s, c) => s + c, 0) / concessions.length : 0,
      estimatedReservation: regression?.reservation ?? (offers.length >= 2 ? { ...best! } : { ...this.#prior }),
      estimatedWeights: this.#frequencyWeights(),
      confidence: offers.length >= 2 ? Math.min(1, (offers.length - 1) / 10) : 0,
    };
    if (regression) summary.concessionBeta = regression.beta;
    const current = offers.at(-1);
    if (current) summary.currentOffer = { ...current };
    if (bestIndex >= 0) summary.bestOffer = { ...offers[bestIndex]! };
    return summary;
  }

  /**
   * Reserva por regresión, issue a issue, con las ofertas de tiempo conocido. Se recorta a los
   * límites del issue y nunca es peor para nosotros que su mejor oferta (el rival no ofrece
   * por debajo de su reserva).
   */
  #regression(best: Offer): { reservation: Offer; beta: number } | undefined {
    const timed = this.#offers.flatMap((offer, k) => (this.#times[k] === undefined ? [] : [{ offer, t: this.#times[k]! }]));
    if (timed.length < 3) return undefined;
    const reservation: Offer = {};
    let beta: number | undefined;
    for (const issue of this.#issues) {
      const fit = fitConcessionCurve(timed.map(({ offer, t }) => ({ t, x: offer[issue.name]! })));
      const seen = best[issue.name]!;
      const raw = fit?.reservation ?? seen;
      const atLeastSeen = issue.direction === "higher-better" ? Math.max(raw, seen) : Math.min(raw, seen);
      reservation[issue.name] = Math.min(issue.max, Math.max(issue.min, atLeastSeen));
      if (fit && beta === undefined) beta = fit.beta;
    }
    return beta === undefined ? undefined : { reservation, beta };
  }

  /** Modelo de frecuencias: peso ∝ 1 + veces que el rival no movió el issue entre ofertas seguidas. */
  #frequencyWeights(): Record<string, number> {
    const counts = this.#issues.map(
      (issue) => 1 + this.#offers.slice(1).filter((offer, k) => offer[issue.name] === this.#offers[k]![issue.name]).length,
    );
    const total = counts.reduce((s, c) => s + c, 0);
    return Object.fromEntries(this.#issues.map((issue, k) => [issue.name, counts[k]! / total]));
  }

  toJSON(): OpponentSummary {
    return this.summary();
  }
}
