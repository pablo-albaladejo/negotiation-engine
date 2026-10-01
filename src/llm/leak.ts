import type { Issue } from "../engine/config.js";
import type { Offer } from "../engine/issues.js";
import { normalizeNumbers } from "./numbers.js";

/** Tolerancia por defecto: fracción del rango del issue alrededor de la reserva. */
export const DEFAULT_LEAK_TOLERANCE = 0.02;

/**
 * Menciones del mandato o de instrucciones por idioma: señal SECUNDARIA (la principal es la
 * proximidad numérica a la reserva, independiente del idioma). Se comprueban todas las listas.
 */
export const MANDATE_PATTERNS: Readonly<Record<string, RegExp>> = {
  es: /(?<![\p{L}])(?:mi (?:máximo|maximo|mínimo|minimo|límite|limite|tope|reserva|precio de reserva)|reserva|mandato|instrucciones|prompt del sistema)(?![\p{L}])/iu,
  en: /(?<![\p{L}])(?:my (?:max|maximum|minimum|limit|reservation|bottom line|walk-?away)|reservation|mandate|instructions|system prompt)(?![\p{L}])/iu,
};

export interface LeakContext {
  issues: readonly Issue[];
  reservation: Offer;
  /** Cifras decididas en este turno: no son fuga aunque coincidan con la reserva. */
  decided?: Offer;
  tolerance?: number;
  /** Plazo propio u otras cifras privadas. */
  privateNumbers?: readonly number[];
  /** Fragmentos de instrucciones internas que no deben aparecer. */
  internalFragments?: readonly string[];
}

export type LeakResult = { leak: false } | { leak: true; reasons: string[] };

/**
 * Detector de fugas sobre el normalizador compartido: bloquea la reserva (o un valor dentro de
 * la tolerancia) en cualquier forma, con todas las lecturas de las cifras ambiguas, salvo cuando
 * coincide con la cifra decidida; también plazo propio y, como señal secundaria por idioma
 * (`MANDATE_PATTERNS`), mandato e instrucciones internas.
 * Los motivos no incluyen el valor de la reserva.
 */
export function detectLeak(text: string, ctx: LeakContext): LeakResult {
  const reasons: string[] = [];
  const tolerance = ctx.tolerance ?? DEFAULT_LEAK_TOLERANCE;
  const decided = ctx.decided ? Object.values(ctx.decided) : [];
  const isDecided = (r: number) => decided.some((d) => Math.abs(r - d) <= 1e-6);

  for (const mention of normalizeNumbers(text)) {
    for (const reading of mention.readings) {
      if (isDecided(reading)) continue;
      for (const issue of ctx.issues) {
        const reservation = ctx.reservation[issue.name];
        if (reservation === undefined) continue;
        if (Math.abs(reading - reservation) <= tolerance * (issue.max - issue.min) + 1e-9) {
          reasons.push(`reserva de ${issue.name} revelada en "${mention.text}"`);
        }
      }
      if (ctx.privateNumbers?.some((p) => Math.abs(reading - p) <= 1e-9)) {
        reasons.push(`cifra privada revelada en "${mention.text}"`);
      }
    }
  }
  if (Object.values(MANDATE_PATTERNS).some((re) => re.test(text))) reasons.push("menciona el mandato o las instrucciones");
  const lower = text.toLowerCase();
  for (const fragment of ctx.internalFragments ?? []) {
    if (fragment.trim().length >= 8 && lower.includes(fragment.trim().toLowerCase())) {
      reasons.push("fragmento de instrucciones internas");
    }
  }
  return reasons.length ? { leak: true, reasons: [...new Set(reasons)] } : { leak: false };
}
