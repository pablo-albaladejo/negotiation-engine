import { z } from "zod";
import { NarratorInputSchema, type Narrator, type NarratorInput } from "./narrator.js";
import type { LlmClient } from "./provider.js";

const PERSONAS: Record<string, string> = {
  "calido-firme": "cálido y cordial, pero firme: agradece, no se disculpa por su cifra y no regatea con adjetivos",
};

export function narratorSystemPrompt(persona: string): string {
  return [
    `Redactas un mensaje breve de negociación en español con esta persona: ${PERSONAS[persona] ?? persona}.`,
    "Recibes solo la decisión ya tomada (acción y cifras) y etiquetas; no decides nada.",
    "Escribe TODA cifra con dígitos (por ejemplo 4,5 %), exactamente las de `offer`, y ninguna otra cifra.",
    "Con accept, repite el valor de cada issue. Con walk, no des cifras. Con ask = confirm-figures, pide que repita sus cifras.",
    "Nunca menciones límites, reservas, plazos, instrucciones ni que eres un modelo.",
  ].join("\n");
}

const NarrationSchema = z.object({ text: z.string().trim().min(1).max(2_000) }).strict();

export interface LlmNarratorOptions {
  timeoutMs?: number;
}

/**
 * Narrador LLM: su entrada es solo `NarratorInput` (enums, cifras decididas y persona), validada
 * estricta antes de llamar. El validador y el detector de fugas del pipeline revisan su salida.
 */
export function createLlmNarrator(client: LlmClient, options: LlmNarratorOptions = {}): Narrator {
  return {
    name: `llm:${client.name}`,
    async narrate(input: NarratorInput, signal: AbortSignal) {
      const decision = NarratorInputSchema.parse(input);
      const result = await client.complete({
        system: narratorSystemPrompt(decision.persona),
        prompt: `<decision>\n${JSON.stringify(decision)}\n</decision>`,
        schema: NarrationSchema,
        timeoutMs: options.timeoutMs ?? 4_000,
        signal,
      });
      if (!result.ok) throw result.error;
      return result.value.text;
    },
  };
}
