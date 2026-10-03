import type { Issue } from "./config.js";
import { pickIssues, roundInFavor, utility, type Offer, type OfferMandate } from "./issues.js";

export type Role = "buyer" | "seller";

/**
 * Private mandate. Set by code from the scenario configuration,
 * never by the rival's text or the LLM.
 * - buyer: `reservation` is the most we can pay.
 * - seller: `reservation` is the least we can accept.
 */
export interface Mandate {
  role: Role;
  reservation: number;
}

export function withinMandate(mandate: Mandate, price: number): boolean {
  return mandate.role === "buyer" ? price <= mandate.reservation : price >= mandate.reservation;
}

/**
 * Last barrier before sending an offer:
 * 1. Never crosses the mandate.
 * 2. Never backtracks from our previous offer (buyer goes up or stays, seller goes down or stays).
 */
export function enforceGuardrails(mandate: Mandate, proposed: number, previous?: number): number {
  if (!Number.isFinite(proposed)) {
    throw new Error(`Non-finite offer: ${proposed}`);
  }
  if (mandate.role === "buyer") {
    const floor = previous ?? Number.NEGATIVE_INFINITY;
    return Math.min(Math.max(proposed, floor), mandate.reservation);
  }
  const ceiling = previous ?? Number.POSITIVE_INFINITY;
  return Math.max(Math.min(proposed, ceiling), mandate.reservation);
}

/**
 * Multi-issue guardrails (issues oriented to our role):
 * 1. No issue crosses its reservation limit (rounded in our favor), so utility does not either.
 * 2. Utility monotonicity: if the proposal gives us more utility than the previous offer, the previous one is repeated.
 * With a single issue it is equivalent to `enforceGuardrails`.
 */
export function enforceOfferGuardrails(
  issues: readonly Issue[],
  mandate: OfferMandate,
  proposed: Offer,
  previous?: Offer,
): Offer {
  const names = new Set(issues.map((i) => i.name));
  for (const key of Object.keys(proposed)) {
    if (!names.has(key)) throw new Error(`Issue not declared in the offer: ${key}`);
  }
  const limits = roundInFavor(issues, mandate.reservation);
  const clamped: Offer = {};
  for (const issue of issues) {
    const value = proposed[issue.name];
    if (value === undefined || !Number.isFinite(value)) {
      throw new Error(`Non-finite offer in ${issue.name}: ${value}`);
    }
    const limit = limits[issue.name]!;
    clamped[issue.name] = issue.direction === "higher-better" ? Math.max(value, limit) : Math.min(value, limit);
  }
  if (previous && utility(issues, clamped) > utility(issues, previous)) {
    return pickIssues(issues, previous);
  }
  return clamped;
}
