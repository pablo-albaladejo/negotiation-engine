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

/** Cifra propuesta por el parser LLM con el fragmento LITERAL del texto del rival que la respalda. */
export interface ParserFigure {
  issue: string;
  value: number;
  evidence: string;
}

export interface ParserOutput {
  offer?: Offer;
  /** Cifras con evidencia literal: el código las verifica (`src/llm/verify.ts`) antes de usarlas. */
  figures?: ParserFigure[];
  intent: Intent;
  /** Fragmento literal que respalda la intención (aceptación o retirada). */
  intentEvidence?: string;
  /** Idioma del texto (BCP-47); se canoniza en código y, si no vale, se detecta por escritura. */
  language?: string;
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
      figures: z
        .array(
          z
            .object({
              issue: z.string().refine((name) => issueNames.includes(name), { message: "issue no declarado" }),
              value: z.number().finite(),
              evidence: z.string().min(1).max(200),
            })
            .strict(),
        )
        .max(20)
        .optional(),
      intent: IntentSchema,
      intentEvidence: z.string().min(1).max(200).optional(),
      language: z.string().min(1).max(35).optional(),
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
