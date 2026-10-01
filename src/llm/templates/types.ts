import type { Offer } from "../../engine/issues.js";

/** Plantilla de un idioma: frases deterministas que escriben con dígitos ASCII exactamente las cifras dadas. */
export interface TemplatePack {
  /** Cifra con dígitos ASCII y el separador decimal del idioma, sin separador de miles. */
  formatNumber(value: number): string;
  formatOffer(offer: Offer): string;
  accept(offer: Offer): string;
  counter(offer: Offer): string;
  confirmFigures(offer: Offer): string;
  confirmAcceptance(offer: Offer): string;
  walk(): string;
  /** Marcas breves de la forma neutral (idiomas sin plantilla). */
  marks: { accept: string; counter: string; walk: string; confirmFigures: string; confirmAcceptance: string };
}

/**
 * Dígitos ASCII con el separador decimal dado; con exactamente tres decimales se añade un cero
 * ("2,3450") para que no se lea como separador de miles ("2,345" ≈ 2345).
 */
export function formatWith(value: number, decimal: "," | "."): string {
  const fixed = value.toFixed(6).replace(/\.?0+$/, "");
  const [int, frac] = fixed.split(".");
  if (!frac) return int!;
  return `${int}${decimal}${frac.length === 3 ? `${frac}0` : frac}`;
}
