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
  /** 0 = solo a priori; crece con el número de ofertas. */
  confidence: number;
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
  readonly #claims: string[] = [];

  constructor(issues: readonly Issue[], prior: Offer = priorFromIssues(issues)) {
    this.#issues = issues;
    this.#prior = pickIssues(issues, prior);
  }

  recordOffer(offer: Offer): void {
    this.#offers.push(pickIssues(this.#issues, offer));
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
    const summary: OpponentSummary = {
      offersSeen: offers.length,
      lastConcession: concessions.at(-1) ?? 0,
      averageConcession: concessions.length ? concessions.reduce((s, c) => s + c, 0) / concessions.length : 0,
      estimatedReservation: offers.length >= 2 ? { ...offers[bestIndex]! } : { ...this.#prior },
      confidence: offers.length >= 2 ? Math.min(1, (offers.length - 1) / 10) : 0,
    };
    const current = offers.at(-1);
    if (current) summary.currentOffer = { ...current };
    if (bestIndex >= 0) summary.bestOffer = { ...offers[bestIndex]! };
    return summary;
  }

  toJSON(): OpponentSummary {
    return this.summary();
  }
}
