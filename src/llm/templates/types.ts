import type { Offer } from "../../engine/issues.js";

/** Lo que el rival dijo y no pudimos fijar: cifras SUYAS que la petición de confirmar repite. */
export type Echo = { kind: "range"; issue: string; bounds: [number, number] } | { kind: "figure"; issue: string; value: number };

/**
 * Plantilla de un idioma: al menos 4 formulaciones por intención, que escriben con dígitos ASCII
 * exactamente las cifras dadas; `variant` elige la formulación (rotación determinista).
 */
export interface TemplatePack {
  /** Cifra con dígitos ASCII y el separador decimal del idioma, sin separador de miles. */
  formatNumber(value: number): string;
  formatOffer(offer: Offer): string;
  accept: readonly ((offer: string) => string)[];
  counter: readonly ((offer: string) => string)[];
  confirmFigures: readonly ((offer: string) => string)[];
  confirmAcceptance: readonly ((offer: string) => string)[];
  walk: readonly string[];
  /** Petición concreta con las cifras del rival ("¿Es un 2 o un 2,5 %?"). */
  echo(echo: Echo, offer: string): string;
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
