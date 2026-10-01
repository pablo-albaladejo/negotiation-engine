/** Etiquetas de idioma BCP-47: validación y forma canónica (`Intl.getCanonicalLocales`). */
export function canonicalLanguage(tag: string | undefined): string | undefined {
  if (!tag) return undefined;
  if (tag === "und") return "und";
  try {
    const [canonical] = Intl.getCanonicalLocales(tag);
    return canonical;
  } catch {
    return undefined;
  }
}

export function isLanguageTag(tag: string): boolean {
  return canonicalLanguage(tag) !== undefined;
}
