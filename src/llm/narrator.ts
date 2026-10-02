import { z } from "zod";
import { isLanguageTag } from "./language.js";
import { IntentSchema, TacticSchema } from "./parser.js";
import { AskSchema, renderTemplate, type Echo, type TemplateDecision } from "./template.js";

/**
 * Entrada del narrador: solo enums y las cifras decididas. Nunca el texto del rival, sus
 * afirmaciones, la reserva, el plazo propio ni instrucciones de otras cajas.
 */
export const NarratorInputSchema = z
  .object({
    action: z.enum(["accept", "counter", "walk"]),
    offer: z.record(z.string(), z.number()).optional(),
    rivalIntent: IntentSchema,
    tactics: z.array(TacticSchema),
    persona: z.string().min(1),
    ask: AskSchema.optional(),
    /** Idioma de salida (BCP-47): el de la sesión con `narrator.language = auto`, o el fijado. */
    language: z.string().min(1).max(35).refine(isLanguageTag, { message: "etiqueta BCP-47 inválida" }).optional(),
  })
  .strict();
export type NarratorInput = z.infer<typeof NarratorInputSchema>;

export interface TemplateContext {
  variant?: number;
  echo?: Echo;
}

export interface Narrator {
  name: string;
  /** `context` solo lo usa la plantilla (formulación y cifras del rival a repetir); nunca llega a un LLM. */
  narrate(input: NarratorInput, signal: AbortSignal, context?: TemplateContext): Promise<unknown>;
}

/** Proveedor `none`: la plantilla determinista hace de narrador. */
export const templateNarrator: Narrator = {
  name: "template",
  narrate: async (input, _signal, context) => {
    const decision: TemplateDecision = { action: input.action };
    if (context?.variant !== undefined) decision.variant = context.variant;
    if (context?.echo && input.ask === "confirm-figures") decision.echo = context.echo;
    if (input.offer) decision.offer = input.offer;
    if (input.ask) decision.ask = input.ask;
    return renderTemplate(decision, input.language);
  },
};
