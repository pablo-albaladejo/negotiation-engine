import { formatNumber } from "@negotiation-ring/design-system";
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

/** Oferta registrada como texto: un issue ⇒ su valor; varios ⇒ `issue value` separados por " · ". */
export function offerLabel(offer: Offer | null): string {
  if (!offer) return "—";
  const entries = Object.entries(offer);
  if (entries.length === 1) return formatNumber(entries[0]![1], { locale: "en" });
  return entries.map(([k, v]) => `${k} ${formatNumber(v, { locale: "en" })}`).join(" · ");
}
