import { describe, expect, it } from "vitest";
import { parseConfig, type Issue } from "../../src/engine/config.js";
import type { ParserFigure, ParserOutput, TextParser } from "../../src/llm/parser.js";
import { InMemorySpanExporter } from "@opentelemetry/sdk-trace-base";
import { createOtelSink } from "../../src/pipeline/otel.js";
import { reconcileOffer, type ReconcileInput } from "../../src/pipeline/reconcile.js";
import { resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";
import { champion, makeBrain } from "./helpers.js";

const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.7 };
const day: Issue = { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.3 };
const issues = [pct, day];
const fig = (issue: string, value: number, evidence: string): ParserFigure => ({ issue, value, evidence });
const llmOut = (figures: ParserFigure[], extra: Partial<ParserOutput> = {}): ParserOutput => ({ intent: "offer", claims: [], tactics: [], injectionSuspected: false, figures, ...extra });

function input(overrides: Partial<ReconcileInput>): ReconcileInput {
  return { issues, text: "", policy: "llm-primary-verified", deterministic: undefined, acceptWordNumbers: "confirm", onLlmFailure: "deterministic", ...overrides };
}

describe("reconcileOffer: tabla de las tres políticas", () => {
  const arabic = "نقبل ٢٫٥٪ والدفع في اليوم ١٥";
  const verifiedArabic = llmOut([fig("pct", 2.5, "٢٫٥٪"), fig("day", 15, "١٥")]);

  it("llm-primary-verified: dígitos arábigo-índicos verificados sin lectura determinista", () => {
    expect(reconcileOffer(input({ text: arabic, llm: { ok: true, output: verifiedArabic } }))).toMatchObject({ offer: { pct: 2.5, day: 15 }, confidence: "verified-digits" });
  });

  it("llm-primary-verified: ancho completo verificado", () => {
    const text = "２．５％、１５日でどうですか";
    const out = reconcileOffer(input({ text, llm: { ok: true, output: llmOut([fig("pct", 2.5, "２．５％"), fig("day", 15, "１５日")]) } }));
    expect(out).toMatchObject({ offer: { pct: 2.5, day: 15 }, confidence: "verified-digits" });
  });

  it("llm-primary-verified: fragmento inventado ⇒ sin oferta, span-not-found", () => {
    const out = reconcileOffer(input({ text: "te doy un 2 % a día 15", llm: { ok: true, output: llmOut([fig("pct", 1.5, "1,5 %"), fig("day", 15, "día 15")]) } }));
    expect(out).toMatchObject({ confidence: "unconfirmed", reason: "span-not-found" });
    expect(out.offer).toBeUndefined();
  });

  it("llm-primary-verified: palabras de idioma no cubierto según acceptWordNumbers", () => {
    const text = "二・五パーセントで、十五日払い";
    const output = llmOut([fig("pct", 2.5, "二・五パーセント"), fig("day", 15, "十五日")]);
    expect(reconcileOffer(input({ text, llm: { ok: true, output } }))).toMatchObject({ confidence: "unconfirmed", reason: "words-unverifiable" });
    expect(reconcileOffer(input({ text, llm: { ok: true, output }, acceptWordNumbers: "llm-only" }))).toMatchObject({ offer: { pct: 2.5, day: 15 }, confidence: "llm-only" });
  });

  it("llm-primary-verified: palabras es verificadas aunque el determinista no extraiga oferta", () => {
    const text = "podríamos cerrar en dos y medio, pagando el 15";
    const out = reconcileOffer(input({ text, llm: { ok: true, output: llmOut([fig("pct", 2.5, "dos y medio"), fig("day", 15, "el 15")]) } }));
    expect(out).toMatchObject({ offer: { pct: 2.5, day: 15 }, confidence: "verified-words" });
  });

  it("llm-primary-verified: veto determinista ⇒ disagreement", () => {
    const text = "1,5 % pagando el día 15, o 5 % si quieres";
    const out = reconcileOffer(input({ text, deterministic: { pct: 1.5, day: 15 }, llm: { ok: true, output: llmOut([fig("pct", 5, "5 %"), fig("day", 15, "día 15")]) } }));
    expect(out).toMatchObject({ confidence: "unconfirmed", reason: "disagreement" });
  });

  it("llm-primary-verified: fallo del LLM según onLlmFailure", () => {
    const det = { pct: 3, day: 10 };
    expect(reconcileOffer(input({ text: "pct: 3, day: 10", deterministic: det, llm: { ok: false } }))).toMatchObject({ offer: det, confidence: "deterministic-only" });
    expect(reconcileOffer(input({ text: "pct: 3, day: 10", deterministic: det, llm: { ok: false }, onLlmFailure: "confirm" }))).toMatchObject({ confidence: "unconfirmed", reason: "llm-failed" });
  });

  it("dual-strict: coincidencia ⇒ dual-agreed; LLM verificado sin determinista ⇒ sin oferta (comportamiento anterior)", () => {
    const det = { pct: 2.5, day: 15 };
    expect(reconcileOffer(input({ policy: "dual-strict", text: arabic, deterministic: det, llm: { ok: true, output: verifiedArabic } }))).toMatchObject({ offer: det, confidence: "dual-agreed" });
    expect(reconcileOffer(input({ policy: "dual-strict", text: arabic, llm: { ok: true, output: verifiedArabic } }))).toMatchObject({ confidence: "unconfirmed", reason: "disagreement" });
    expect(reconcileOffer(input({ policy: "dual-strict", text: arabic, deterministic: det, llm: { ok: false } }))).toMatchObject({ reason: "llm-failed" });
  });

  it("deterministic-only: ignora al LLM", () => {
    expect(reconcileOffer(input({ policy: "deterministic-only", deterministic: { pct: 1, day: 2 }, llm: { ok: true, output: verifiedArabic } }))).toMatchObject({ offer: { pct: 1, day: 2 }, confidence: "deterministic-only" });
    expect(reconcileOffer(input({ policy: "deterministic-only" }))).toMatchObject({ confidence: "unconfirmed" });
  });
});

const twoIssues = parseConfig({ ...champion, issues: [pct, day] });
const mandate2 = { role: "buyer" as const, reservation: { pct: 1, day: 10 } };
const priceConfig = parseConfig({ ...champion, issues: [{ name: "price", min: 0, max: 5000, direction: "lower-better", weight: 1 }] });
const priceMandate = { role: "buyer" as const, reservation: { price: 4000 } };
const t = (round: number, extra: Record<string, unknown>) => ({ sessionId: "s1", round, roundLimit: 10, ...extra });

function llmSaying(output: ParserOutput): TextParser & { calls: number } {
  const parser = { name: "fake-llm", calls: 0, parse: async () => (parser.calls++, output) };
  return parser;
}

type ReconcileRecord = { input: { policy: string; llmCalled: boolean }; output: { offer: unknown; unconfirmed: boolean; confidence: string | null; reason: string | null } };
const reconcileRecords = (records: readonly { box: string }[]) => records.filter((r) => r.box === "reconcile") as unknown as ReconcileRecord[];

describe("pipeline con llm-primary-verified (valor por defecto en hybrid)", () => {
  it("registra una oferta en dígitos arábigo-índicos con confianza verified-digits", async () => {
    const parser = llmSaying(llmOut([fig("pct", 2.5, "٢٫٥٪"), fig("day", 15, "١٥")]));
    const { brain, store, trace } = makeBrain({ config: twoIssues, mandate: mandate2, parser });
    await brain.turn(t(1, { rivalAction: "message", text: "نقبل ٢٫٥٪ والدفع في اليوم ١٥" }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 2.5, day: 15 }]);
    expect(reconcileRecords(trace.records)[0]).toMatchObject({ input: { policy: "llm-primary-verified", llmCalled: true }, output: { confidence: "verified-digits", reason: null } });
  });

  it.each([
    ["1.234,5", "Our price 1.234,5 EUR"],
    ["1,234.5", "Our price 1,234.5 USD"],
  ])("convención decimal %s verificada y coincidente con el determinista", async (evidence, text) => {
    const parser = llmSaying(llmOut([fig("price", 1234.5, evidence)]));
    const { brain, store } = makeBrain({ config: priceConfig, mandate: priceMandate, parser });
    await brain.turn(t(1, { rivalAction: "message", text }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ price: 1234.5 }]);
  });

  it("fragmento inventado: sin oferta, pide confirmar y la evidencia queda solo en la traza local", async () => {
    const parser = llmSaying(llmOut([fig("pct", 1.5, "1,5 %"), fig("day", 15, "día 15")]));
    const { brain, store, trace } = makeBrain({ config: twoIssues, mandate: mandate2, parser });
    const out = await brain.turn(t(1, { rivalAction: "message", text: "Te doy un 2 % pagando el día 15" }));
    expect(store.get("s1")!.rivalOffers).toEqual([]);
    expect(out.text).toMatch(/confirmar tus cifras/);
    expect(reconcileRecords(trace.records)[0]!.output).toMatchObject({ confidence: "unconfirmed", reason: "span-not-found" });
    const evidence = trace.records.find((r) => r.box === "evidence")!;
    expect(JSON.stringify(evidence.output)).toContain("1,5 %");
    expect(JSON.stringify(trace.records.find((r) => r.box === "parser")!.output)).not.toContain("1,5 %");

    const exporter = new InMemorySpanExporter();
    const sink = (await createOtelSink({ env: { TRACE_EXPORT: "otel" }, exporter }))!;
    for (const record of trace.records) sink.write(record);
    const spans = exporter.getFinishedSpans();
    await sink.shutdown();
    expect(spans.length).toBeGreaterThan(3);
    expect(spans.some((s) => s.name === "box.evidence")).toBe(false);
    expect(JSON.stringify(spans.map((s) => s.attributes))).not.toContain("1,5 %");
  });

  it("palabras ja: confirm pide confirmar; llm-only registra la oferta pero el motor no puede aceptarla", async () => {
    const text = "二・五パーセントで、十五日払い";
    const output = llmOut([fig("pct", 9, "二・五パーセント"), fig("day", 50, "十五日")]);
    const confirmRun = makeBrain({ config: twoIssues, mandate: mandate2, parser: llmSaying(output) });
    const out = await confirmRun.brain.turn(t(1, { rivalAction: "message", text }));
    expect(confirmRun.store.get("s1")!.rivalOffers).toEqual([]);
    // Japonés sin plantilla: forma neutral (marca en `template.fallbackLanguage` y cifras con su issue).
    expect(out.text).toMatch(/^Please restate your figures in digits\. Counter-offer: pct /);

    const runtime = resolveRuntimeConfig({ parser: { acceptWordNumbers: "llm-only" } });
    const llmOnly = makeBrain({ config: twoIssues, mandate: mandate2, parser: llmSaying(output), runtime });
    await llmOnly.brain.turn(t(1, { rivalAction: "message", text: "Hola" }));
    // Oferta muy buena para nosotros en la penúltima ronda: la cifra es llm-only y el motor no puede aceptarla.
    const last = await llmOnly.brain.turn(t(9, { rivalAction: "message", text }));
    expect(llmOnly.store.get("s1")!.rivalOffers.at(-1)).toEqual({ pct: 9, day: 50 });
    expect(last.action).toBe("counter");
    expect(last.text).toMatch(/^Please restate your figures in digits\./);
    expect(llmOnly.store.get("s1")!.agreement).toBeUndefined();
    // La oferta no firme no llega al motor como oferta actual: ni la acepta ni hay que bloquearla.
    const engineState = llmOnly.trace.records.filter((r) => r.box === "engine").at(-1)!.input as { state: { currentOfferUnconfirmed?: boolean } };
    expect(engineState.state.currentOfferUnconfirmed).toBe(true);
  });

  it("discrepancia con el determinista: sin oferta, el motor no acepta y pide confirmar", async () => {
    // El LLM cruza los issues: ambas evidencias se verifican, pero el determinista lee pct 5, día 8 y veta.
    const parser = llmSaying(llmOut([fig("pct", 8, "8"), fig("day", 5, "5")]));
    const { brain, store, trace } = makeBrain({ config: twoIssues, mandate: mandate2, parser });
    const out = await brain.turn(t(5, { rivalAction: "message", text: "Te ofrezco un 5 % pagando el día 8" }));
    expect(store.get("s1")!.rivalOffers).toEqual([]);
    expect(out.action).not.toBe("accept");
    expect(out.text).toMatch(/confirmar tus cifras/);
    expect(reconcileRecords(trace.records)[0]!.output.reason).toBe("disagreement");
  });

  it("fallo del LLM con respaldo determinista: oferta con confianza deterministic-only", async () => {
    const broken: TextParser = { name: "fake-llm", parse: async () => Promise.reject(new Error("timeout")) };
    const { brain, store, trace } = makeBrain({ config: twoIssues, mandate: mandate2, parser: broken });
    await brain.turn(t(1, { rivalAction: "message", text: "3 % pagando el día 10" }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 3, day: 10 }]);
    expect(reconcileRecords(trace.records)[0]!.output.confidence).toBe("deterministic-only");
  });

  it("deterministic-only: no se llama al LLM y la traza lo registra", async () => {
    const parser = llmSaying(llmOut([]));
    const runtime = resolveRuntimeConfig({ parser: { policy: "deterministic-only" } });
    const { brain, trace } = makeBrain({ config: twoIssues, mandate: mandate2, parser, runtime });
    await brain.turn(t(1, { rivalAction: "message", text: "pct: 3, day: 10" }));
    expect(parser.calls).toBe(0);
    expect(reconcileRecords(trace.records)[0]!.input).toMatchObject({ policy: "deterministic-only", llmCalled: false });
  });

  it("cada entrada de la traza lleva la huella de la configuración de ejecución", async () => {
    const runtime = resolveRuntimeConfig({ parser: { policy: "dual-strict" } });
    const { brain, trace } = makeBrain({ runtime });
    await brain.turn(t(1, { rivalAction: "message", text: "Hola" }));
    expect(trace.records.length).toBeGreaterThan(3);
    for (const r of trace.records) expect((r as { runtimeConfig?: string }).runtimeConfig).toBe(runtime.fingerprint);
  });
});
