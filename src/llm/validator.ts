import { z } from "zod";
import type { Offer } from "../engine/issues.js";
import { defineBox, registerBox } from "../pipeline/box.js";
import { normalizeNumbers } from "./numbers.js";

const EPS = 1e-6;

function phrase(words: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}])(?:${words.join("|")})(?![\\p{L}])`, "iu");
}

export const ACCEPT_RE = phrase([
  "acepto",
  "aceptamos",
  "aceptado",
  "trato hecho",
  "accept",
  "we accept",
  "accepted",
  "agreed",
  "it's a deal",
  "we have a deal",
]);
export const WALK_RE = phrase([
  "me retiro",
  "nos retiramos",
  "lo dejamos",
  "no podemos seguir",
  "sin acuerdo",
  "walk away",
  "we withdraw",
  "no deal",
]);

export interface TextCheck {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
  text: string;
}

export type CheckResult = { ok: true } | { ok: false; reasons: string[] };

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

  const saysAccept = ACCEPT_RE.test(text);
  const saysWalk = WALK_RE.test(text);
  if (check.action === "accept" && (!saysAccept || saysWalk)) reasons.push("texto incoherente con accept");
  if (check.action === "counter" && (saysAccept || saysWalk)) reasons.push("texto incoherente con counter");
  if (check.action === "walk" && (!saysWalk || saysAccept)) reasons.push("texto incoherente con walk");

  return reasons.length ? { ok: false, reasons } : { ok: true };
}

export const CheckResultSchema = z.union([
  z.object({ ok: z.literal(true) }).strict(),
  z.object({ ok: z.literal(false), reasons: z.array(z.string()).min(1) }).strict(),
]);

export const validatorBox = defineBox({
  name: "validator",
  input: z
    .object({
      action: z.enum(["accept", "counter", "walk"]),
      offer: z.record(z.string(), z.number()).optional(),
      text: z.string(),
    })
    .strict(),
  output: CheckResultSchema,
  run: (input) => {
    const check: TextCheck = { action: input.action, text: input.text };
    if (input.offer) check.offer = input.offer;
    return validateText(check);
  },
});

registerBox(validatorBox);
