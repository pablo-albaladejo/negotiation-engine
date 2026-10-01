import { describe, expect, it } from "vitest";
import { createLlmNarrator, narratorSystemPrompt } from "../../src/llm/llm-narrator.js";
import { NarratorInputSchema, templateNarrator, type NarratorInput } from "../../src/llm/narrator.js";
import { createLlmClient, type LlmTransportRequest } from "../../src/llm/provider.js";
import { validateText } from "../../src/llm/validator.js";

/** Respuestas grabadas del narrador por idioma (contraoferta 2 %). */
const RECORDED: Record<string, string> = {
  en: "Thanks for the proposal. We can do 2%.",
  es: "Gracias por la propuesta. Podemos hacerlo en un 2 %.",
  fr: "Merci pour votre proposition. Nous pouvons faire 2 %.",
};

function recordedClient() {
  const sent: LlmTransportRequest[] = [];
  const client = createLlmClient("fake", async (request) => {
    sent.push(request);
    const lang = /\((\w+)\)/.exec(request.system.split("\n")[0]!)?.[1] ?? "es";
    return JSON.stringify({ text: RECORDED[lang] });
  });
  return { client, sent };
}

const base: NarratorInput = { action: "counter", offer: { pct: 2 }, rivalIntent: "offer", tactics: [], persona: "calido-firme" };

describe("narrador en el idioma de la sesión (5.4)", () => {
  it.each(["en", "es", "fr"])("language = %s: el prompt pide ese idioma y la respuesta grabada pasa el validador", async (language) => {
    const { client, sent } = recordedClient();
    const text = (await createLlmNarrator(client).narrate({ ...base, language }, new AbortController().signal)) as string;
    expect(sent[0]!.system).toContain(`(${language})`);
    expect(sent[0]!.prompt).toContain(`"language":"${language}"`);
    expect(text).toBe(RECORDED[language]);
    expect(validateText({ action: "counter", offer: { pct: 2 }, text, language })).toMatchObject({ ok: true, ...(language === "fr" ? { coherence: "unchecked" } : {}) });
  });

  it("la entrada sigue cerrada: solo se añade `language` y se valida como BCP-47", () => {
    expect(NarratorInputSchema.safeParse({ ...base, language: "fr" }).success).toBe(true);
    expect(NarratorInputSchema.safeParse({ ...base, language: "no es una etiqueta" }).success).toBe(false);
    expect(NarratorInputSchema.safeParse({ ...base, rivalText: "hola" }).success).toBe(false);
  });

  it("sin idioma el prompt sigue en español; la plantilla escribe en el idioma pedido", async () => {
    expect(narratorSystemPrompt("calido-firme")).toMatch(/en español/);
    expect(await templateNarrator.narrate({ ...base, language: "en" }, new AbortController().signal)).toMatch(/^Thank you/);
  });
});
