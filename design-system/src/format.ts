/**
 * Formats a number using the Spanish decimal comma convention (e.g. 0.64 -> "0,64").
 * This is the only place in the package that touches a number: every other
 * value shown by a component is passed in already formatted by the engine.
 *
 * @deprecated kept for backward compatibility; use `formatNumber(value, { locale: "es" })`.
 */
export function formatEsNumber(value: number): string {
  return value.toString().replace(".", ",");
}

export interface FormatNumberOptions {
  locale: "en" | "es";
  decimals?: number;
}

/**
 * Formats a number for either locale this package supports. This is the only
 * place in the package that touches a number: every other value shown by a
 * component is passed in already formatted by the engine.
 */
export function formatNumber(value: number, { locale, decimals }: FormatNumberOptions): string {
  const text = decimals === undefined ? value.toString() : value.toFixed(decimals);
  return locale === "es" ? text.replace(".", ",") : text;
}
