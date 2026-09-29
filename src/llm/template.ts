import { z } from "zod";
import type { Offer } from "../engine/issues.js";
import { defineBox, registerBox } from "../pipeline/box.js";

/**
 * Cifra con dígitos, coma decimal y sin separador de miles. Con exactamente tres decimales se
 * añade un cero ("2,3450") para que no se lea como miles ("2,345" ≈ 2345).
 */
export function formatNumber(value: number): string {
  const fixed = value.toFixed(6).replace(/\.?0+$/, "");
  const [int, frac] = fixed.split(".");
  if (!frac) return int!;
  return `${int},${frac.length === 3 ? `${frac}0` : frac}`;
}

function formatIssue(name: string, value: number): string {
  if (name === "pct") return `un ${formatNumber(value)} %`;
  if (name === "day") return `pago el día ${formatNumber(value)}`;
  return `${name} ${formatNumber(value)}`;
}

export function formatOffer(offer: Offer): string {
  return Object.entries(offer)
    .map(([name, value]) => formatIssue(name, value))
    .join(", con ");
}

export interface TemplateDecision {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
}

/** Plantilla determinista de la persona "cálido-firme": escribe exactamente las cifras decididas. */
export function renderTemplate(decision: TemplateDecision): string {
  switch (decision.action) {
    case "accept":
      return `¡Trato hecho! Aceptamos ${formatOffer(decision.offer ?? {})}. Gracias por la negociación.`;
    case "counter":
      return `Gracias por tu propuesta. Te propongo ${formatOffer(decision.offer ?? {})}. Creo que es una propuesta justa para ambos.`;
    case "walk":
      return "Gracias por tu tiempo, pero así no podemos seguir. Lo dejamos aquí.";
  }
}

export const templateBox = defineBox({
  name: "template",
  input: z
    .object({
      action: z.enum(["accept", "counter", "walk"]),
      offer: z.record(z.string(), z.number()).optional(),
    })
    .strict(),
  output: z.object({ text: z.string().min(1) }).strict(),
  run: (input) => {
    const decision: TemplateDecision = { action: input.action };
    if (input.offer) decision.offer = input.offer;
    return { text: renderTemplate(decision) };
  },
});

registerBox(templateBox);
