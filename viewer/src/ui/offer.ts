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
  if (!offer) return "not logged";
  const entries = Object.entries(offer);
  if (entries.length === 1) return formatNumber(entries[0]![1], { locale: "en" });
  return entries.map(([k, v]) => `${k} ${formatNumber(v, { locale: "en" })}`).join(" · ");
}

/** Price column/KPI: the logged agreement offer, or "\u2014" when there was no deal (M2/A3). */
export function priceLabel(agreement: Offer | null): string {
  return agreement ? offerLabel(agreement) : "\u2014";
}

/** First issue name seen on a side's logged offers, e.g. "price" (A2 header `sub`); `null` if none logged. */
export function firstIssueName(offers: readonly { offer: Offer }[]): string | null {
  const first = offers.find((o) => Object.keys(o.offer).length > 0);
  return first ? Object.keys(first.offer)[0]! : null;
}
