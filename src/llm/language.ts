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

/** Escrituras con un idioma de respaldo inequívoco o razonable (Han sin kana → zh). */
const SCRIPT_LANGUAGES: [RegExp, string][] = [
  [/[\p{Script=Hiragana}\p{Script=Katakana}]/u, "ja"],
  [/\p{Script=Hangul}/u, "ko"],
  [/\p{Script=Han}/u, "zh"],
  [/\p{Script=Arabic}/u, "ar"],
  [/\p{Script=Hebrew}/u, "he"],
  [/\p{Script=Cyrillic}/u, "ru"],
  [/\p{Script=Greek}/u, "el"],
  [/\p{Script=Devanagari}/u, "hi"],
  [/\p{Script=Thai}/u, "th"],
];

const ES_WORDS = new Set(["de", "la", "el", "que", "y", "en", "los", "las", "por", "con", "para", "una", "un", "te", "es", "acepto", "aceptamos", "oferta", "días", "dias", "pago", "pagando", "trato", "hecho", "ofrezco", "podemos", "podríamos"]);
const EN_WORDS = new Set(["the", "and", "of", "to", "we", "you", "is", "for", "with", "a", "accept", "accepted", "offer", "days", "day", "pay", "paying", "deal", "can", "could", "our", "your", "it"]);

/**
 * Idioma de respaldo determinista (si el parser LLM falla o da una etiqueta inválida): por
 * escritura Unicode y, en latín, por palabras frecuentes de español e inglés; si no, `und`.
 */
export function detectLanguage(text: string): string {
  for (const [re, lang] of SCRIPT_LANGUAGES) if (re.test(text)) return lang;
  let es = 0;
  let en = 0;
  for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
    if (ES_WORDS.has(word)) es++;
    if (EN_WORDS.has(word)) en++;
  }
  if (es === en) return "und";
  return es > en ? "es" : "en";
}

/** Idioma del turno: la etiqueta del parser si es válida y no `und`; si no, la detección por escritura. */
export function turnLanguage(parserLanguage: string | undefined, text: string): string {
  const canonical = canonicalLanguage(parserLanguage);
  return canonical && canonical !== "und" ? canonical : detectLanguage(text);
}
