import type { Issue } from "./config.js";
import { pickIssues, roundInFavor, utility, type Offer, type OfferMandate } from "./issues.js";

export type Role = "buyer" | "seller";

/**
 * Mandato privado. Lo fija el código desde la configuración del escenario,
 * nunca el texto del rival ni el LLM.
 * - buyer: `reservation` es el máximo que podemos pagar.
 * - seller: `reservation` es el mínimo que podemos aceptar.
 */
export interface Mandate {
  role: Role;
  reservation: number;
}

export function withinMandate(mandate: Mandate, price: number): boolean {
  return mandate.role === "buyer" ? price <= mandate.reservation : price >= mandate.reservation;
}

/**
 * Última barrera antes de enviar una oferta:
 * 1. Nunca cruza el mandato.
 * 2. Nunca retrocede respecto a nuestra oferta anterior (comprador sube o se queda, vendedor baja o se queda).
 */
export function enforceGuardrails(mandate: Mandate, proposed: number, previous?: number): number {
  if (!Number.isFinite(proposed)) {
    throw new Error(`Oferta no finita: ${proposed}`);
  }
  if (mandate.role === "buyer") {
    const floor = previous ?? Number.NEGATIVE_INFINITY;
    return Math.min(Math.max(proposed, floor), mandate.reservation);
  }
  const ceiling = previous ?? Number.POSITIVE_INFINITY;
  return Math.max(Math.min(proposed, ceiling), mandate.reservation);
}

/**
 * Guardarraíles multi-issue (issues orientados a nuestro rol):
 * 1. Ningún issue cruza su límite de reserva (redondeado a nuestro favor), luego tampoco la utilidad.
 * 2. Monotonía en utilidad: si la propuesta nos da más utilidad que la oferta anterior, se repite la anterior.
 * Con un solo issue equivale a `enforceGuardrails`.
 */
export function enforceOfferGuardrails(
  issues: readonly Issue[],
  mandate: OfferMandate,
  proposed: Offer,
  previous?: Offer,
): Offer {
  const names = new Set(issues.map((i) => i.name));
  for (const key of Object.keys(proposed)) {
    if (!names.has(key)) throw new Error(`Issue no declarado en la oferta: ${key}`);
  }
  const limits = roundInFavor(issues, mandate.reservation);
  const clamped: Offer = {};
  for (const issue of issues) {
    const value = proposed[issue.name];
    if (value === undefined || !Number.isFinite(value)) {
      throw new Error(`Oferta no finita en ${issue.name}: ${value}`);
    }
    const limit = limits[issue.name]!;
    clamped[issue.name] = issue.direction === "higher-better" ? Math.max(value, limit) : Math.min(value, limit);
  }
  if (previous && utility(issues, clamped) > utility(issues, previous)) {
    return pickIssues(issues, previous);
  }
  return clamped;
}
