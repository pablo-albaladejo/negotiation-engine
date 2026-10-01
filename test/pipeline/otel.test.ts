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
});
