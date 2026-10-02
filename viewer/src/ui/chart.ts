import type { OfferPoint } from "@negotiation-ring/design-system";
import type { Offer } from "../model/index.js";
import { offerValue } from "./offer.js";

/** Un punto de `OfferChart` por entrada con oferta de un issue; las de varios issues se descartan (P5). */
export function toOfferPoints(entries: readonly { round: number; offer: Offer }[]): OfferPoint[] {
  return entries.flatMap(({ round, offer }) => {
    const value = offerValue(offer);
    return value === null ? [] : [{ round, value }];
  });
}

/**
 * Puntos de la curva objetivo (Boulware) en unidades de oferta, a partir de `explain.targetOffer`
 * (espacio de oferta, no utilidad 0–1). `targetOffer` es `null` en concesión completa: esas
 * rondas se omiten en vez de dibujar un punto falso o la utilidad en el eje de precio.
 */
export function toTargetOfferPoints(entries: readonly { round: number; targetOffer: Offer | null }[]): OfferPoint[] {
  return entries.flatMap(({ round, targetOffer }) => {
    const value = offerValue(targetOffer);
    return value === null ? [] : [{ round, value }];
  });
}

/** Dominio Y con margen, a partir de todos los valores que va a dibujar el gráfico. */
export function offerDomain(values: readonly (number | null | undefined)[]): [number, number] {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return [0, 1];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.1;
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}
