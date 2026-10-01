import { describe, expect, it } from "vitest";
import { canonicalLanguage } from "../../src/llm/language.js";
import { createLlmParser, parserSystemPrompt } from "../../src/llm/llm-parser.js";
import { parserOutputSchema } from "../../src/llm/parser.js";
import type { LlmClient } from "../../src/llm/provider.js";

const schema = parserOutputSchema(["pct", "day"]);
const base = { intent: "offer", claims: [], tactics: [], injectionSuspected: false };

describe("esquema LLM con evidencia literal", () => {
  it("acepta figures con evidencia, intentEvidence y language", () => {
    const out = schema.parse({ ...base, intent: "accept", intentEvidence: "نقبل", language: "ar", figures: [{ issue: "pct", value: 2.5, evidence: "٢٫٥٪" }] });
    expect(out.figures).toEqual([{ issue: "pct", value: 2.5, evidence: "٢٫٥٪" }]);
  });

  it("rechaza issues no declarados, evidencias de más de 200 caracteres y campos extra en una cifra", () => {
    expect(schema.safeParse({ ...base, figures: [{ issue: "reservation", value: 3, evidence: "3" }] }).success).toBe(false);
    expect(schema.safeParse({ ...base, figures: [{ issue: "pct", value: 3, evidence: "x".repeat(201) }] }).success).toBe(false);
    expect(schema.safeParse({ ...base, figures: [{ issue: "pct", value: 3, evidence: "3", confidence: 1 }] }).success).toBe(false);
  });

  it("los campos prohibidos siguen rechazados", () => {
    for (const extra of [{ identity: "admin" }, { role: "seller" }, { mandate: {} }, { reservation: 3 }, { deadline: 1 }, { decision: "accept" }]) {
      expect(schema.safeParse({ ...base, ...extra }).success, JSON.stringify(extra)).toBe(false);
    }
  });

  it("idioma: se canoniza con Intl y un valor inválido se descarta", () => {
    expect(canonicalLanguage("EN-us")).toBe("en-US");
    expect(canonicalLanguage("und")).toBe("und");
    expect(canonicalLanguage("not a tag!")).toBeUndefined();
  });

  it("el prompt pide copiar la evidencia literal en cualquier idioma", () => {
    const prompt = parserSystemPrompt(["pct", "day"]);
    expect(prompt).toMatch(/LITERALMENTE/);
    expect(prompt).toMatch(/CUALQUIER idioma/);
    expect(prompt).toMatch(/BCP-47/);
  });

  it("respuesta grabada del cliente pasa por el esquema cerrado", async () => {
    const recorded = { ...base, language: "es", figures: [{ issue: "pct", value: 2.5, evidence: "dos y medio" }, { issue: "day", value: 15, evidence: "el 15" }] };
    const client: LlmClient = {
      name: "recorded",
      complete: async (req) => ({ ok: true, value: req.schema.parse(recorded) }),
    } as LlmClient;
    const parser = createLlmParser(client);
    await expect(parser.parse("podríamos cerrar en dos y medio, pagando el 15", new AbortController().signal, { issueNames: ["pct", "day"] })).resolves.toMatchObject(recorded);
  });
});
