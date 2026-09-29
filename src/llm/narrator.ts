import { z } from "zod";
import { IntentSchema, TacticSchema } from "./parser.js";
import { renderTemplate } from "./template.js";

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
  })
  .strict();
export type NarratorInput = z.infer<typeof NarratorInputSchema>;

export interface Narrator {
  name: string;
  narrate(input: NarratorInput, signal: AbortSignal): Promise<unknown>;
}

/** Proveedor `none`: la plantilla determinista hace de narrador. */
export const templateNarrator: Narrator = {
  name: "template",
  narrate: async (input) => {
    return input.offer ? renderTemplate({ action: input.action, offer: input.offer }) : renderTemplate({ action: input.action });
  },
};
