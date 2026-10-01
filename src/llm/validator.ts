import { z } from "zod";
import type { Offer } from "../engine/issues.js";
import { defineBox, registerBox } from "../pipeline/box.js";
import { normalizeNumbers } from "./numbers.js";

const EPS = 1e-6;

function phrase(words: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}])(?:${words.join("|")})(?![\\p{L}])`, "iu");
}

/** Expresiones de coherencia por idioma (subetiqueta principal); fr, ja y ar llegarán con 9.2. */
const COHERENCE_WORDS: Record<string, { accept: string[]; walk: string[] }> = {
  es: {
    accept: ["acepto", "aceptamos", "aceptado", "trato hecho"],
    walk: ["me retiro", "nos retiramos", "lo dejamos", "no podemos seguir", "sin acuerdo"],
  },
  en: {
    accept: ["accept", "we accept", "accepted", "agreed", "it's a deal", "we have a deal"],
    walk: ["walk away", "we withdraw", "no deal"],
  },
};

export const COHERENCE: Readonly<Record<string, { accept: RegExp; walk: RegExp }>> = Object.fromEntries(
  Object.entries(COHERENCE_WORDS).map(([lang, w]) => [lang, { accept: phrase(w.accept), walk: phrase(w.walk) }]),
);
export const COHERENCE_LANGUAGES = Object.keys(COHERENCE_WORDS);

/** Unión de todos los idiomas cubiertos (la usa también el parser determinista). */
export const ACCEPT_RE = phrase(Object.values(COHERENCE_WORDS).flatMap((w) => w.accept));
export const WALK_RE = phrase(Object.values(COHERENCE_WORDS).flatMap((w) => w.walk));

export interface TextCheck {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
  text: string;
  /** Idioma en que está escrito el texto (BCP-47); sin él, coherencia con todos los idiomas cubiertos. */
  language?: string;
  /** `known-languages` aprueba un idioma no cubierto marcando `coherence: "unchecked"`; `strict` lo rechaza. */
  coherence?: "known-languages" | "strict";
}

export type CheckResult = { ok: true; coherence?: "unchecked" } | { ok: false; reasons: string[] };

/**
 * Validador del texto saliente sobre el normalizador compartido: toda cifra interpretable como
 * oferta coincide con la decisión, `accept` y `counter` repiten cada valor decidido, sin rangos
 * ni cifras ambiguas, y el texto es coherente con la acción.
 */
export function validateText(check: TextCheck): CheckResult {
  const reasons: string[] = [];
  const text = check.text.trim();
  if (!text) return { ok: false, reasons: ["texto vacío"] };
  if (text.length > 5_000) reasons.push("texto demasiado largo");

  const decided = check.offer ? Object.entries(check.offer) : [];
  if (check.action !== "walk" && decided.length === 0) reasons.push(`${check.action} sin oferta`);
  const matches = (v: number) => decided.some(([, d]) => Math.abs(v - d) <= EPS);

  const mentions = normalizeNumbers(text);
  const seen: number[] = [];
  for (const m of mentions) {
    if (m.kind === "range") {
      reasons.push(`rango no permitido: "${m.text}"`);
    } else if (m.ambiguity === "separator") {
      reasons.push(`cifra ambigua: "${m.text}"`);
    } else if (!matches(m.value)) {
      reasons.push(`cifra no decidida: "${m.text}"`);
    } else {
      seen.push(m.value);
    }
  }
  if (check.action !== "walk") {
    for (const [name, value] of decided) {
      if (!seen.some((v) => Math.abs(v - value) <= EPS)) reasons.push(`falta el valor de ${name}`);
    }
  }

  // Coherencia: la afirmación de la acción con las expresiones del idioma del texto; la contradicción,
  // con las de cualquier idioma cubierto. Idioma no cubierto: según `coherence`.
  const lang = check.language?.split("-")[0]?.toLowerCase();
  const own = lang ? COHERENCE[lang] : { accept: ACCEPT_RE, walk: WALK_RE };
  let unchecked = false;
  const saysAcceptAny = ACCEPT_RE.test(text);
  const saysWalkAny = WALK_RE.test(text);
  if (!own) {
    if ((check.coherence ?? "known-languages") === "strict") reasons.push(`coherencia no comprobable en ${check.language}`);
    else unchecked = true;
    if (check.action === "accept" && saysWalkAny) reasons.push("texto incoherente con accept");
    if (check.action === "counter" && (saysAcceptAny || saysWalkAny)) reasons.push("texto incoherente con counter");
    if (check.action === "walk" && saysAcceptAny) reasons.push("texto incoherente con walk");
  } else {
    if (check.action === "accept" && (!own.accept.test(text) || saysWalkAny)) reasons.push("texto incoherente con accept");
    if (check.action === "counter" && (saysAcceptAny || saysWalkAny)) reasons.push("texto incoherente con counter");
    if (check.action === "walk" && (!own.walk.test(text) || saysAcceptAny)) reasons.push("texto incoherente con walk");
  }

  if (reasons.length) return { ok: false, reasons };
  return unchecked ? { ok: true, coherence: "unchecked" } : { ok: true };
}

export const CheckResultSchema = z.union([
  z.object({ ok: z.literal(true), coherence: z.literal("unchecked").optional() }).strict(),
  z.object({ ok: z.literal(false), reasons: z.array(z.string()).min(1) }).strict(),
]);

export const validatorBox = defineBox({
  name: "validator",
  input: z
    .object({
      action: z.enum(["accept", "counter", "walk"]),
      offer: z.record(z.string(), z.number()).optional(),
      text: z.string(),
      language: z.string().max(35).optional(),
      coherence: z.enum(["known-languages", "strict"]).optional(),
    })
    .strict(),
  output: CheckResultSchema,
  run: (input) => {
    const check: TextCheck = { action: input.action, text: input.text };
    if (input.offer) check.offer = input.offer;
    if (input.language) check.language = input.language;
    if (input.coherence) check.coherence = input.coherence;
    return validateText(check);
  },
});

registerBox(validatorBox);
