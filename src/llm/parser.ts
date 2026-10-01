import { z } from "zod";
import { offerSchema, type Offer } from "../protocol/schemas.js";

export const TacticSchema = z.enum([
  "anchoring",
  "false-deadline",
  "false-batna",
  "prompt-injection",
  "identity-claim",
  "hypothetical-framing",
  "pressure",
  "flattery",
  "other",
]);
export type Tactic = z.infer<typeof TacticSchema>;

export const IntentSchema = z.enum(["offer", "accept", "walk", "other"]);
export type Intent = z.infer<typeof IntentSchema>;

export interface ParserOutput {
  offer?: Offer;
  intent: Intent;
  claims: string[];
  tactics: Tactic[];
  injectionSuspected: boolean;
}

/**
 * Esquema cerrado de la salida del parser: sin identidad, rol, mandato, reserva, plazo propio
 * ni decisión. Cualquier campo extra hace fallar la validación.
 */
export function parserOutputSchema(issueNames: readonly string[]): z.ZodType<ParserOutput> {
  return z
    .object({
      offer: offerSchema(issueNames).optional(),
      intent: IntentSchema,
      claims: z.array(z.string().max(500)).max(20),
      tactics: z.array(TacticSchema).max(20),
      injectionSuspected: z.boolean(),
    })
    .strict() as unknown as z.ZodType<ParserOutput>;
}

/** Lo único que el parser sabe además del texto: los nombres de los issues declarados (públicos). */
export interface ParserContext {
  issueNames: readonly string[];
}

/** Parser en cuarentena: solo ve el texto del rival, sin herramientas, mandato ni historial. */
export interface TextParser {
  name: string;
  parse(text: string, signal: AbortSignal, context?: ParserContext): Promise<unknown>;
}

/** Resultado cuando no se interpreta el texto: el turno sigue solo con los campos estructurados. */
export const EMPTY_PARSE: ParserOutput = { intent: "other", claims: [], tactics: [], injectionSuspected: false };

/** Parser que no interpreta el texto: el turno sigue solo con los campos estructurados. */
export const noneParser: TextParser = {
  name: "none",
  parse: async () => ({ ...EMPTY_PARSE, claims: [], tactics: [] }),
};
