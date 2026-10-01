import { z } from "zod";
import type { Issue } from "./config.js";
import { enforceOfferGuardrails, type Role } from "./guardrails.js";
import { acceptableForUs, OFFER_DECIMALS, pickIssues, type AprBand, type Offer, type OfferMandate } from "./issues.js";

/** Issues de una oferta con mandato `apr`: descuento en % y día de pago. */
export const APR_PCT = "pct";
export const APR_DAY = "day";

export const AprBandSchema = z
  .object({ min: z.number().min(0), max: z.number(), baseDays: z.number().positive(), day: z.number().min(0) })
  .strict()
  .refine((b) => b.max > b.min && b.day < b.baseDays, { message: "banda apr inválida (min < max, day < baseDays)" });

/**
 * TAE (%) del descuento por pronto pago: quien paga el día `day` en vez de `baseDays` adelanta
 * `100 − pct` y se ahorra `pct`: `pct/(100 − pct) × 365/(baseDays − day) × 100`. Interés simple
 * anualizado (2/10 net 30 → 37,24 %). Fuera del dominio (`pct ≥ 100` o `day ≥ baseDays`) +∞.
 */
export function aprOf(pct: number, day: number, baseDays: number): number {
  if (pct >= 100 || day >= baseDays) return Number.POSITIVE_INFINITY;
  return (pct / (100 - pct)) * (365 / (baseDays - day)) * 100;
}

/** Inversa a día fijo: el descuento `pct` cuya TAE es `apr`. */
export function pctForApr(apr: number, day: number, baseDays: number): number {
  const k = (apr / 100) * ((baseDays - day) / 365);
  return (100 * k) / (1 + k);
}

export function offerApr(band: Pick<AprBand, "baseDays">, offer: Offer): number {
  const pct = offer[APR_PCT];
  const day = offer[APR_DAY];
  if (pct === undefined || day === undefined || !Number.isFinite(pct) || !Number.isFinite(day)) throw new Error("oferta apr sin pct/day finitos");
  return aprOf(pct, day, band.baseDays);
}

/** Dentro de la banda (estricto, sin tolerancia): límites duros por ambos lados. */
export function withinAprBand(band: AprBand, offer: Offer): boolean {
  const apr = offerApr(band, offer);
  return apr >= band.min && apr <= band.max;
}

/** La TAE `a` es mejor que `b` para el rol (el comprador cobra el descuento: TAE alta). */
export function aprBetter(role: Role, a: number, b: number): boolean {
  return role === "buyer" ? a > b : a < b;
}

/**
 * Oferta `{ pct, day }` en el día dado con TAE ≈ `target` (recortada a la banda): `pct` a la
 * precisión de oferta, redondeado a favor del rol si sigue en la banda y, si no, hacia dentro.
 */
export function aprOffer(band: AprBand, role: Role, target: number, day = band.day): Offer {
  const factor = 10 ** OFFER_DECIMALS;
  const at = Number.isFinite(day) && day < band.baseDays ? day : band.day;
  const exact = pctForApr(Math.min(band.max, Math.max(band.min, target)), at, band.baseDays) * factor;
  const up = Math.ceil(exact - 1e-9);
  const down = Math.floor(exact + 1e-9);
  const order = role === "buyer" ? [up, down] : [down, up];
  for (const scaled of order) {
    const offer = { [APR_PCT]: scaled / factor, [APR_DAY]: at };
    if (withinAprBand(band, offer)) return offer;
  }
  // Banda más estrecha que un céntimo de pct en ese día: se busca hacia dentro desde el centro.
  const mid = Math.round(pctForApr((band.min + band.max) / 2, at, band.baseDays) * factor);
  const offer = { [APR_PCT]: mid / factor, [APR_DAY]: at };
  if (!withinAprBand(band, offer)) throw new Error("banda apr demasiado estrecha para la precisión de oferta");
  return offer;
}

/**
 * Guardarraíl en TAE (última barrera antes de enviar con mandato `apr`):
 * 1. La TAE de la oferta queda dentro de `[min, max]` (si no, se recalcula `pct` en el borde, mismo día).
 * 2. Monotonía en TAE: si la propuesta es mejor para nosotros que la anterior, se repite la anterior.
 */
export function enforceAprGuardrails(issues: readonly Issue[], mandate: OfferMandate & { apr: AprBand }, proposed: Offer, previous?: Offer): Offer {
  const band = mandate.apr;
  let offer = pickIssues(issues, proposed);
  const apr = offerApr(band, offer);
  if (!(apr >= band.min && apr <= band.max)) offer = aprOffer(band, mandate.role, apr < band.min ? band.min : band.max, offer[APR_DAY]);
  if (previous && withinAprBand(band, previous) && aprBetter(mandate.role, offerApr(band, offer), offerApr(band, previous))) {
    return pickIssues(issues, previous);
  }
  return offer;
}

/** Guardarraíl según el mandato: TAE si trae banda `apr`, por issue si no (sin cambios). */
export function offerGuardrails(issues: readonly Issue[], mandate: OfferMandate, proposed: Offer, previous?: Offer): Offer {
  if (mandate.apr) return enforceAprGuardrails(issues, { ...mandate, apr: mandate.apr }, proposed, previous);
  return enforceOfferGuardrails(issues, mandate, proposed, previous);
}

/** Condición de toda aceptación según el mandato: dentro de la banda TAE, o la regla por issue. */
export function acceptable(issues: readonly Issue[], mandate: OfferMandate, offer: Offer): boolean {
  return mandate.apr ? withinAprBand(mandate.apr, offer) : acceptableForUs(issues, mandate, offer);
}
