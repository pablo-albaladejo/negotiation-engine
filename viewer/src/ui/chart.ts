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
  
  // Calculate padding
  const pad = (max - min) * 0.1;
  let domainMin = min - pad;
  let domainMax = max + pad;
  
  // Round to nice steps (1, 2, 5 × 10ⁿ)
  const range = domainMax - domainMin;
  
  // Generate candidate nice steps: 1, 2, 5, 10, 20, 50, 100, etc.
  const candidates: number[] = [];
  for (let exp = -2; exp <= 3; exp++) {
    const base = 10 ** exp;
    candidates.push(base * 1);
    candidates.push(base * 2);
    candidates.push(base * 5);
  }
  
  // Find the nice step that gives us 4-6 ticks (or closest to it)
  let bestStep = candidates[0]!;
  let bestTicks = range / bestStep;
  let bestDist = Math.abs(bestTicks - 5);
  
  for (const step of candidates) {
    const ticks = range / step;
    // Prefer 4-6 ticks, but accept 3-7 as fallback
    if (ticks >= 4 && ticks <= 6) {
      const dist = Math.abs(ticks - 5);
      if (dist < bestDist) {
        bestStep = step;
        bestTicks = ticks;
        bestDist = dist;
      }
    }
  }
  
  // If no step gives 4-6 ticks, use the best from all
  if (bestTicks < 4 || bestTicks > 6) {
    bestStep = candidates[0]!;
    bestDist = Math.abs(range / bestStep - 5);
    for (const step of candidates) {
      const ticks = range / step;
      const dist = Math.abs(ticks - 5);
      if (dist < bestDist) {
        bestStep = step;
        bestDist = dist;
      }
    }
  }
  
  // Round down min and up max to nearest niceStep
  domainMin = Math.floor(domainMin / bestStep) * bestStep;
  domainMax = Math.ceil(domainMax / bestStep) * bestStep;
  
  // Never go below 0 when all values are >= 0
  if (min >= 0 && domainMin < 0) domainMin = 0;
  
  return [domainMin, domainMax];
}

/**
 * Offers chart caption for an arena replay (A4, d:98): the ZOPA span from the logged reserves, or
 * the empty-ZOPA sentence (d:474), or "not logged" when reserves weren't recorded (v1 transcripts).
 */
export function arenaChartCaption(ourReserve: number | null, theirReserve: number | null, zopaEmpty: boolean): string {
  if (ourReserve === null || theirReserve === null) return "not logged";
  if (zopaEmpty) {
    const relation = theirReserve < ourReserve ? "below" : "above";
    return `Empty ZOPA: their reserve (${theirReserve}) is ${relation} ours (${ourReserve}). No ZOPA band.`;
  }
  const lo = Math.min(ourReserve, theirReserve);
  const hi = Math.max(ourReserve, theirReserve);
  return `ZOPA ${lo}\u2013${hi} (arena: the opponent's reserve is revealed afterwards). Click a point to highlight its message.`;
}
