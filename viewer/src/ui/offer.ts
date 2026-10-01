import type { Offer } from "../model/index.js";

/**
 * `OfferChart` dibuja un único valor numérico por punto; los escenarios del camino crítico tienen
 * un issue (price, pct). Para una `Offer` de más de un issue (P5) esta función no se usa.
 */
export function offerValue(offer: Offer | null | undefined): number | null {
  if (!offer) return null;
  const values = Object.values(offer);
  return values.length === 1 ? values[0]! : null;
}
