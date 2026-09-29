import type { Issue } from "../engine/config.js";
import { sameOffer, type Offer } from "../engine/issues.js";
import type { RivalAction } from "../protocol/schemas.js";

export type BindingResult =
  | { kind: "agreement"; offer: Offer }
  | { kind: "offer"; offer: Offer }
  | { kind: "walk" }
  | { kind: "none" };

/**
 * Regla de enlace: un `accept` del rival solo acepta nuestra última oferta enviada.
 * Con cifras distintas de esa oferta es una oferta nueva y pasa por el motor.
 */
export function bindRivalMove(
  issues: readonly Issue[],
  action: RivalAction,
  offer: Offer | undefined,
  ourLast: Offer | undefined,
): BindingResult {
  if (action === "walk") return { kind: "walk" };
  if (action === "accept") {
    if (!offer) return ourLast ? { kind: "agreement", offer: { ...ourLast } } : { kind: "none" };
    if (ourLast && sameOffer(issues, offer, ourLast)) return { kind: "agreement", offer: { ...ourLast } };
    return { kind: "offer", offer: { ...offer } };
  }
  return offer ? { kind: "offer", offer: { ...offer } } : { kind: "none" };
}
