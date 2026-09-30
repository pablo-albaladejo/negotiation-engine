/**
 * Formats a number using the Spanish decimal comma convention (e.g. 0.64 -> "0,64").
 * This is the only place in the package that touches a number: every other
 * value shown by a component is passed in already formatted by the engine.
 */
export function formatEsNumber(value: number): string {
  return value.toString().replace(".", ",");
}
