import { describe, expect, it } from "vitest";
import { parseConfig, type Issue } from "../../src/engine/config.js";
import { createAnthropicClient } from "../../src/llm/anthropic-api.js";
import { createLlmNarrator } from "../../src/llm/llm-narrator.js";
import { createLlmParser } from "../../src/llm/llm-parser.js";
import type { Narrator } from "../../src/llm/narrator.js";
import type { ParserOutput, TextParser } from "../../src/llm/parser.js";
import { validateText } from "../../src/llm/validator.js";
import { turnBudgetMs } from "../../src/pipeline/pipeline.js";
import { resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";
import type { TurnOutput } from "../../src/protocol/schemas.js";
import { champion, makeBrain } from "./helpers.js";

const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.7 };
const day: Issue = { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.3 };
const config = parseConfig({ ...champion, issues: [pct, day] });
const mandate = { role: "buyer" as const, reservation: { pct: 1, day: 10 } };
const t = (round: number, extra: Record<string, unknown> = {}) => ({ sessionId: "s1", round, roundLimit: 10, rivalAction: "message", ...extra });
type WithOffer = TurnOutput & { offer: Record<string, number> };

/** Respuesta de `fetch` que nunca llega: solo termina cuando se cancela la petición. */
const hangingFetch: typeof fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    const signal = init?.signal;
    signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });

const parse = (extra: Partial<ParserOutput> = {}): ParserOutput => ({ intent: "other", claims: [], tactics: [], injectionSuspected: false, ...extra });

describe("presupuesto relativo del turno (turn.budgetRatio)", () => {
  it.each<[number | undefined, number, number]>([
    [3000, 0.9, 2500],
    [4500, 0.9, 4000],
    [10_000, 0.9, 9000],
    [5000, 1, 4500],
    [300, 0.9, 0],
    [undefined, 0.9, champion.turnBudgetMs],
  ])("ring %s ms, ratio %s ⇒ %s ms", (timeoutMs, ratio, expected) => {
    expect(turnBudgetMs(timeoutMs, champion, ratio)).toBe(expected);
  });

  it("ring.timeoutMs de la configuración vale como tiempo declarado si el turno no lo trae", async () => {
    let clock = 0;
    const calls: number[] = [];
    const narrator: Narrator = { name: "fake-llm", narrate: async () => (calls.push(1), "ok") };
    const parser: TextParser = { name: "fake-llm", parse: async () => ((clock += 1700), parse()) };
    // 3000 ms declarados ⇒ presupuesto 2500; tras 1700 ms de parser quedan 800 < 900.
    const runtime = resolveRuntimeConfig({ ring: { timeoutMs: 3000 } });
    const { brain, trace } = makeBrain({ config, mandate, parser, narrator, runtime, now: () => clock });
    await brain.turn(t(1, { text: "Hola" }));
    expect(calls).toHaveLength(0);
    expect(trace.records.some((r) => r.box === "narrator-skipped")).toBe(true);
  });
});

describe("omisión del narrador (llm.narrator.minRemainingMs)", () => {
  function setup(parserMs: number, runtime = resolveRuntimeConfig({})) {
    let clock = 0;
    const calls: unknown[] = [];
    const parser: TextParser = { name: "fake-llm", parse: async () => ((clock += parserMs), parse()) };
    const narrator: Narrator = { name: "fake-llm", narrate: async (input) => (calls.push(input), `Te propongo ${input.offer?.pct} % y ${input.offer?.day} días.`) };
    return { calls, ...makeBrain({ config, mandate, parser, narrator, runtime, now: () => clock }) };
  }

  it("quedan 600 ms tras parser y motor con minRemainingMs = 900: plantilla y `narrator-skipped` en la traza", async () => {
    const { brain, trace, calls } = setup(3400);
    const out = (await brain.turn(t(1, { text: "Hola", timeoutMs: 4500 }))) as WithOffer;
    expect(calls).toHaveLength(0);
    const skipped = trace.records.find((r) => r.box === "narrator-skipped")!;
    expect(skipped).toMatchObject({ result: "fallback", input: { remainingMs: 600, minRemainingMs: 900 } });
    expect(trace.records.some((r) => r.box === "template")).toBe(true);
    expect(validateText({ action: out.action, offer: out.offer, text: out.text })).toEqual({ ok: true });
  });

  it("con tiempo de sobra el narrador sí se llama, una sola vez por defecto en hybrid", async () => {
    const { brain, trace, calls } = setup(100);
    await brain.turn(t(1, { text: "Hola", timeoutMs: 4500 }));
    expect(calls).toHaveLength(1);
    expect(trace.records.some((r) => r.box === "narrator-skipped")).toBe(false);
  });

  it("minRemainingMs configurable: con 500 el narrador se llama con 600 ms restantes", async () => {
    const { brain, calls } = setup(3400, resolveRuntimeConfig({ llm: { narrator: { minRemainingMs: 500 } } }));
    await brain.turn(t(1, { text: "Hola", timeoutMs: 4500 }));
    expect(calls).toHaveLength(1);
  });
});

describe("intentos por caja (llm.*.attempts)", () => {
  const failingParser = (calls: number[]): TextParser => ({
    name: "fake-llm",
    parse: async () => {
      calls.push(1);
      throw new Error("fallo simulado");
    },
  });
  const failingNarrator = (calls: number[]): Narrator => ({
    name: "fake-llm",
    narrate: async () => {
      calls.push(1);
      throw new Error("fallo simulado");
    },
  });

  it("hybrid: 1 intento por caja; structured: 2", async () => {
    for (const [mode, expected] of [["hybrid", 1], ["structured", 2]] as const) {
      const p: number[] = [];
      const n: number[] = [];
      const { brain } = makeBrain({ config, mandate, parser: failingParser(p), narrator: failingNarrator(n), runtime: resolveRuntimeConfig({ ring: { mode } }) });
      await brain.turn(t(1, { text: "Hola" }));
      expect([mode, p.length, n.length]).toEqual([mode, expected, expected]);
    }
  });

  it("el fichero fija los intentos de cada caja por separado", async () => {
    const p: number[] = [];
    const n: number[] = [];
    const runtime = resolveRuntimeConfig({ llm: { parser: { attempts: 2 }, narrator: { attempts: 3 } } });
    const { brain } = makeBrain({ config, mandate, parser: failingParser(p), narrator: failingNarrator(n), runtime });
    await brain.turn(t(1, { text: "Hola" }));
    expect([p.length, n.length]).toEqual([2, 3]);
  });
});

describe("proveedor lento (anthropic-api con transporte simulado)", () => {
  const slowClient = () => createAnthropicClient({ apiKey: "test-key", model: "test-model", fetch: hangingFetch });

  it("el turno responde dentro del presupuesto aunque parser y narrador no contesten nunca", async () => {
    const runtime = resolveRuntimeConfig({ llm: { parser: { provider: "anthropic-api" }, narrator: { provider: "anthropic-api" } } });
    const client = slowClient();
    const parser = createLlmParser(client, { timeoutMs: runtime.llm.parser.timeoutMs });
    const narrator = createLlmNarrator(client, { timeoutMs: runtime.llm.narrator.timeoutMs });
    const { brain, trace } = makeBrain({ config, mandate, parser, narrator, runtime });
    // 1500 ms declarados ⇒ presupuesto min(1350, 1000) = 1000 ms.
    for (const round of [1, 2]) {
      const started = performance.now();
      const out = (await brain.turn(t(round, { text: round === 1 ? "Hola" : "Ofrezco 3 % y 30 días", timeoutMs: 1500 }))) as WithOffer;
      const elapsed = performance.now() - started;
      expect(elapsed).toBeLessThan(1000 + 150);
      expect(out.action).toBe("counter");
      expect(validateText({ action: out.action, offer: out.offer, text: out.text })).toEqual({ ok: true });
    }
    expect(trace.records.filter((r) => r.box === "template")).toHaveLength(2);
  });

  it("el tiempo por llamada del parser es llm.parser.timeoutMs, no el presupuesto entero", async () => {
    const runtime = resolveRuntimeConfig({ llm: { parser: { timeoutMs: 80 } } });
    const parser = createLlmParser(slowClient(), { timeoutMs: 10_000 });
    const { brain, trace } = makeBrain({ config, mandate, parser, runtime });
    const started = performance.now();
    await brain.turn(t(1, { text: "Hola" }));
    expect(performance.now() - started).toBeLessThan(600);
    expect(trace.records.find((r) => r.box === "parser")).toMatchObject({ result: "fallback", error: expect.stringMatching(/^timeout/) });
  });

  describe("timeout del parser ⇒ parser.onLlmFailure", () => {
    async function play(onLlmFailure: "deterministic" | "confirm") {
      const runtime = resolveRuntimeConfig({ parser: { onLlmFailure }, llm: { parser: { timeoutMs: 50 } } });
      const parser = createLlmParser(slowClient(), { timeoutMs: 10_000 });
      const run = makeBrain({ config, mandate, parser, runtime });
      const opening = (await run.brain.turn(t(1, { text: "Hola" }))) as WithOffer;
      const out = (await run.brain.turn(t(2, { text: "Vale, trato hecho." }))) as WithOffer;
      return { ...run, opening, out };
    }

    it("deterministic: la aceptación sin cifras se verifica con el determinista", async () => {
      const { opening, out, store, trace } = await play("deterministic");
      expect(out).toMatchObject({ action: "accept", offer: opening.offer });
      expect(store.get("s1")!.agreementOrigin).toBe("rival-text-verified");
      expect(trace.records.find((r) => r.box === "parser" && r.round === 2)!.error).toMatch(/^timeout/);
    });

    it("confirm: nunca hay acuerdo; repetimos nuestra oferta y pedimos confirmación", async () => {
      const { opening, out, store } = await play("confirm");
      expect(out).toMatchObject({ action: "counter", offer: opening.offer });
      expect(store.get("s1")!.agreement).toBeUndefined();
    });
  });
});
