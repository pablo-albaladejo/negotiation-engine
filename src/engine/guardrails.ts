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
