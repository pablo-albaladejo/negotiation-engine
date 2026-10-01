import type { Offer } from "../engine/issues.js";
import { createRng, deriveSeed, type Rng } from "../engine/rng.js";
import { formatNumber } from "../llm/template.js";
import { renderDay, renderPct, type DayForm, type PctForm } from "./text-only.js";

/** Idiomas del renderizador de lenguaje natural de la arena (fr, ja, ar: tarea 9.1). */
export const NL_LANGUAGES = ["es", "en"] as const;
export type NlLanguage = (typeof NL_LANGUAGES)[number];

const PCT_BY_LANG: Record<NlLanguage, readonly PctForm[]> = {
  es: ["digits-comma", "words-es", "bps", "range", "fraction"],
  en: ["digits-dot", "words-en", "bps", "range", "fraction"],
};
const DAY_BY_LANG: Record<NlLanguage, readonly DayForm[]> = { es: ["el-dia", "a-dias", "words"], en: ["day"] };
const OPENERS: Record<NlLanguage, readonly string[]> = {
  es: ["Te ofrezco", "Mi propuesta es", "Podemos cerrar con", "Lo máximo que puedo hacer es"],
  en: ["I can offer", "My offer is", "We could settle on", "How about"],
};
const ACCEPTS: Record<NlLanguage, readonly string[]> = {
  es: ["De acuerdo, trato hecho.", "Vale, lo acepto.", "Perfecto, aceptamos tu propuesta."],
  en: ["Deal, we accept.", "Agreed, that works for us.", "Fine, we accept your offer."],
};
const WALKS: Record<NlLanguage, readonly string[]> = {
  es: ["Lo siento, así no hay acuerdo posible. Me retiro.", "Nos retiramos de la negociación."],
  en: ["No deal, we walk away.", "We withdraw from this negotiation."],
};
/** Formas que el agente no puede extraer como oferta firme (verdad de terreno). */
const NOT_EXTRACTABLE: ReadonlySet<string> = new Set(["range", "fraction"]);

const choose = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng.float() * items.length)]!;

export interface NlMove {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
}

export interface NlRendered {
  text: string;
  /** Formas usadas por cifra y si la oferta es extraíble como oferta firme. */
  forms: string[];
  extractable: boolean;
}

function rangeText(value: number, lang: NlLanguage): string {
  return lang === "es" ? `entre ${formatNumber(value)} y ${formatNumber(value + 0.5)} %` : `between ${value} and ${value + 0.5}%`;
}

/**
 * Renderizador de lenguaje natural común (generaliza `text-only.ts`): convierte el movimiento
 * canónico de CUALQUIER bot en texto del idioma dado, con formatos variados; aceptaciones y
 * retiradas solo en texto. La arena guarda el movimiento canónico como verdad de terreno.
 */
export function renderNaturalLanguage(move: NlMove, lang: NlLanguage, rng: Rng): NlRendered {
  if (move.action === "accept") return { text: choose(ACCEPTS[lang], rng), forms: [], extractable: true };
  if (move.action === "walk") return { text: choose(WALKS[lang], rng), forms: [], extractable: true };
  const parts: string[] = [];
  const forms: string[] = [];
  for (const [name, value] of Object.entries(move.offer ?? {})) {
    if (name === "pct") {
      const form = choose(PCT_BY_LANG[lang], rng);
      forms.push(form);
      parts.push(form === "range" ? rangeText(value, lang) : renderPct(value, form, rng));
    } else if (name === "day") {
      const form = choose(DAY_BY_LANG[lang], rng);
      forms.push(`day-${form}`);
      parts.push(renderDay(value, form));
    } else {
      forms.push("named");
      parts.push(`${name} ${lang === "es" ? formatNumber(value) : String(value)}`);
    }
  }
  return { text: `${choose(OPENERS[lang], rng)} ${parts.join(lang === "es" ? " y " : " and ")}.`, forms, extractable: !forms.some((f) => NOT_EXTRACTABLE.has(f)) };
}

/** Idioma de una partida: elegido por semilla de la lista configurada. */
export function languageForSeed(languages: readonly NlLanguage[], seed: number): NlLanguage {
  return languages[Math.abs(seed) % languages.length]!;
}

export function nlRng(seed: number): Rng {
  return createRng(deriveSeed(seed, "nl-renderer"));
}
