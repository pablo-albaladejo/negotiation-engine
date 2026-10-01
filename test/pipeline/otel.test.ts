import { InMemorySpanExporter } from "@opentelemetry/sdk-trace-base";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAgent } from "../../src/agent/agent.js";
import { silentLogger } from "../../src/pipeline/box.js";
import { createOtelSink, redactForExport, teeTrace } from "../../src/pipeline/otel.js";

afterEach(() => vi.unstubAllGlobals());

async function playThree(trace: Parameters<typeof createAgent>[0]["trace"]) {
  const agent = createAgent({ configPath: "config/champion.json", scenarioPath: "config/scenario.json", provider: "none", logger: silentLogger, ...(trace ? { trace } : {}) });
  for (const [k, pct] of [1, 1.5, 2].entries()) {
    await agent.brain.turn({ sessionId: "otel-1", round: k + 1, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct }, text: `Te ofrezco ${pct} %` });
  }
}

describe("exportación OpenTelemetry tras flag", () => {
  it("con el flag apagado no hay sink, ni exportador, ni conexiones", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("red prohibida")));
    vi.stubGlobal("fetch", fetchSpy);
    const exporter = new InMemorySpanExporter();
    const exportSpy = vi.spyOn(exporter, "export");
    expect(await createOtelSink({ env: {}, exporter })).toBeUndefined();
    expect(await createOtelSink({ env: { TRACE_EXPORT: "jsonl", OTEL_EXPORTER_OTLP_ENDPOINT: "https://cloud.langfuse.com/api/public/otel" } })).toBeUndefined();
    await playThree(teeTrace(undefined, undefined));
    expect(exportSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("con el flag encendido la traza de una partida aparece en el exportador, sin mandato", async () => {
    const exporter = new InMemorySpanExporter();
    const sink = (await createOtelSink({ env: { TRACE_EXPORT: "otel" }, exporter }))!;
    await playThree(sink);
    const spans = exporter.getFinishedSpans();
    await sink.shutdown();
    expect(spans.length).toBeGreaterThan(3);
    expect(new Set(spans.map((s) => s.attributes.round))).toEqual(new Set([1, 2, 3]));
    expect(spans.every((s) => s.name.startsWith("box.") && s.attributes["session.id"] === "otel-1")).toBe(true);
    const dump = JSON.stringify(spans.map((s) => s.attributes));
    expect(dump).not.toMatch(/reservation|mandate/);
  });

  it("la redacción quita las claves censuradas a cualquier profundidad", () => {
    expect(redactForExport({ a: 1, mandate: { reservation: { pct: 3 } }, b: { config: {}, c: [{ reservation: 3, d: 2 }] } })).toEqual({ a: 1, b: { c: [{ d: 2 }] } });
  });

  it("textos largos se reemplazan con longitud para evitar fugas en spans", () => {
    const longText = "mi límite es 3 % y no puedo bajar más porque".padEnd(150, "x");
    expect(redactForExport({ input: longText })).toEqual({ input: `[text:${longText.length}]` });
    expect(redactForExport({ input: "corto" })).toEqual({ input: "corto" });
    expect(redactForExport({ nested: { text: longText, n: 42 } })).toEqual({ nested: { text: `[text:${longText.length}]`, n: 42 } });
  });

  it("con flag TRACE_EXPORT=otel un narrator que filtra sensible no deja trazas del contenido", async () => {
    const exporter = new InMemorySpanExporter();
    const sink = (await createOtelSink({ env: { TRACE_EXPORT: "otel" }, exporter }))!;
    await playThree(sink);
    const spans = exporter.getFinishedSpans();
    await sink.shutdown();
    // Verificar que existen spans de narrator
    const narratorSpans = spans.filter((s) => s.name === "box.narrator");
    expect(narratorSpans.length).toBeGreaterThan(0);
    // No debe haber ninguna mención de "Te ofrezco" en los atributos
    const dump = JSON.stringify(spans.map((s) => s.attributes));
    expect(dump).not.toMatch(/Te ofrezco/);
    // Los spans de narrator deben tener input/output sanitizados
    for (const span of narratorSpans) {
      const inputStr = span.attributes.input;
      const outputStr = span.attributes.output;
      // Input debe solo tener persona
      expect(inputStr).toContain("persona");
      expect(inputStr).not.toContain("decision");
      // Output debe tener textLength sin el texto real
      if (typeof outputStr === "string") {
        expect(outputStr).not.toMatch(/Gracias por tu propuesta/);
      }
    }
  });

  it("validator output se sanitiza: solo {ok}, sin reasons con cifras", async () => {
    const exporter = new InMemorySpanExporter();
    const sink = (await createOtelSink({ env: { TRACE_EXPORT: "otel" }, exporter }))!;
    await playThree(sink);
    const spans = exporter.getFinishedSpans();
    await sink.shutdown();
    const validatorSpans = spans.filter((s) => s.name === "box.validator");
    expect(validatorSpans.length).toBeGreaterThan(0);
    for (const span of validatorSpans) {
      const outputStr = span.attributes.output;
      if (typeof outputStr === "string") {
        expect(outputStr).toContain("ok");
        expect(outputStr).not.toContain("reasons");
        // No debe contener citadas de cifras como "cifra no decidida"
        expect(outputStr).not.toMatch(/cifra no decidida/);
      }
    }
  });

  it("el texto crudo del rival (caja rivalText) nunca sale a OTel/Langfuse", async () => {
    const exporter = new InMemorySpanExporter();
    const sink = (await createOtelSink({ env: { TRACE_EXPORT: "otel" }, exporter }))!;
    await playThree(sink);
    const spans = exporter.getFinishedSpans();
    await sink.shutdown();
    expect(spans.some((s) => s.name === "box.rivalText")).toBe(false);
    const dump = JSON.stringify(spans.map((s) => s.attributes));
    expect(dump).not.toMatch(/Te ofrezco/);
  });

  it("error attribute en spans se redacta: texto largo se reemplaza con [text:N]", () => {
    const longError = "Model returned invalid value: my limit is 3 %".padEnd(150, "x");
    const redacted = redactForExport(longError);
    expect(String(redacted)).toMatch(/\[text:\d+\]/);
    expect(String(redacted)).not.toContain("my limit");
  });
});
