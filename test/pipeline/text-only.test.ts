import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { runArena } from "../../src/arena/arena.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createBotByName } from "../../src/bots/index.js";
import { parseConfig } from "../../src/engine/config.js";
import type { TextParser } from "../../src/llm/parser.js";
import { validateText } from "../../src/llm/validator.js";
import { resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";
import type { TurnOutput } from "../../src/protocol/schemas.js";
import { champion, makeBrain } from "./helpers.js";

const twoIssues = parseConfig({
  ...champion,
  issues: [
    { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.7 },
    { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.3 },
  ],
});
const mandate2 = { role: "buyer" as const, reservation: { pct: 1, day: 10 } };
const t = (round: number, extra: Record<string, unknown>) => ({ sessionId: "s1", round, roundLimit: 10, ...extra });

/** Parser que simula un LLM con una lectura fija. */
const llmSaying = (offer: Record<string, number> | undefined): TextParser => ({
  name: "fake-llm",
  parse: async () => ({ intent: "offer", claims: [], tactics: [], injectionSuspected: false, ...(offer ? { offer } : {}) }),
});

const reconcileOutputs = (records: readonly { box: string; output: unknown }[]) =>
  records.filter((r) => r.box === "reconcile").map((r) => r.output as { offer: Record<string, number> | null; unconfirmed: boolean });

describe("modo solo texto con LLM_PROVIDER=none", () => {
  it("registra la oferta del texto si el determinista da un único valor no ambiguo por issue", async () => {
    const { brain, store, trace } = makeBrain();
    await brain.turn(t(1, { rivalAction: "message", text: "Hola." }));
    await brain.turn(t(2, { rivalAction: "offer", text: "Te ofrezco un 2,5 %." }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 2.5 }]);
    expect(reconcileOutputs(trace.records).at(-1)).toMatchObject({ offer: { pct: 2.5 }, unconfirmed: false, confidence: "deterministic-only" });
  });

  it("un rango no es oferta: turno sin oferta y contraoferta que pide confirmar las cifras", async () => {
    const { brain, store } = makeBrain();
    await brain.turn(t(1, { rivalAction: "message", text: "Hola." }));
    const out = await brain.turn(t(2, { rivalAction: "offer", text: "Podríamos movernos entre 2 y 4 %." }));
    expect(store.get("s1")!.rivalOffers).toEqual([]);
    expect(out.action).toBe("counter");
    expect(out.text).toMatch(/confirmar tus cifras/);
    expect(validateText({ action: "counter", offer: (out as { offer: Record<string, number> }).offer, text: out.text })).toEqual({ ok: true });
  });

  it("con cifras sin confirmar no acepta una oferta anterior, aunque fuera aceptable", async () => {
    const { brain } = makeBrain();
    await brain.turn(t(1, { rivalAction: "message", text: "Hola." }));
    await brain.turn(t(2, { rivalAction: "offer", text: "Te ofrezco un 9 %." }));
    const out = await brain.turn(t(3, { rivalAction: "offer", text: "Te ofrezco 0.09." }));
    expect(out.action).toBe("counter");
    expect(out.text).toMatch(/confirmar tus cifras/);
  });

  it("un accept con cifras ilegibles no es acuerdo; sin cifras, acuerdo en nuestra última oferta", async () => {
    const a = makeBrain();
    const first = (await a.brain.turn(t(1, { rivalAction: "message", text: "Hola." }))) as TurnOutput & { offer: Record<string, number> };
    const out = await a.brain.turn(t(2, { rivalAction: "accept", text: "Acepto entre 8 y 9 %." }));
    expect(out.action).toBe("counter");
    expect(a.store.get("s1")!.agreement).toBeUndefined();

    const b = makeBrain();
    await b.brain.turn(t(1, { rivalAction: "message", text: "Hola." }));
    const deal = await b.brain.turn(t(2, { rivalAction: "accept", text: "De acuerdo, trato hecho." }));
    expect(deal).toMatchObject({ action: "accept", offer: first.offer });
    expect(deal.text).toContain(`${String(first.offer.pct).replace(".", ",")} %`);
  });

  it("la oferta estructurada manda sobre el texto", async () => {
    const { brain, store } = makeBrain();
    await brain.turn(t(1, { rivalAction: "offer", rivalOffer: { pct: 2 }, text: "te ofrezco 5 %" }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 2 }]);
  });
});

describe("modo solo texto con parser LLM: reconciliación dual-strict (comportamiento anterior)", () => {
  const text = "Acepto un 1,5 % pagando el día 15";
  const runtime = resolveRuntimeConfig({ parser: { policy: "dual-strict" } });

  it("parsers coinciden ⇒ se registra la oferta", async () => {
    const { brain, store } = makeBrain({ config: twoIssues, mandate: mandate2, runtime, parser: llmSaying({ pct: 1.5, day: 15 }) });
    await brain.turn(t(1, { rivalAction: "offer", text }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 1.5, day: 15 }]);
  });

  it("parsers discrepan ⇒ sin oferta, el motor no puede aceptar y se piden las cifras", async () => {
    const { brain, store } = makeBrain({ config: twoIssues, mandate: mandate2, runtime, parser: llmSaying({ pct: 15, day: 15 }) });
    const out = await brain.turn(t(10, { rivalAction: "offer", text }));
    expect(store.get("s1")!.rivalOffers).toEqual([]);
    expect(out.action).not.toBe("accept");
  });

  it("el parser LLM caído ⇒ sin oferta en solo texto", async () => {
    const broken: TextParser = { name: "fake-llm", parse: async () => Promise.reject(new Error("503")) };
    const { brain, store } = makeBrain({ config: twoIssues, mandate: mandate2, runtime, parser: broken });
    const out = await brain.turn(t(1, { rivalAction: "offer", text }));
    expect(store.get("s1")!.rivalOffers).toEqual([]);
    expect(out.text).toMatch(/confirmar tus cifras/);
  });
});

describe("200 partidas contra el bot de solo texto", () => {
  it("0 acuerdos distintos de los valores reales y las ofertas mal extraídas quedan contadas", async () => {
    const scenarios = loadCatalog().filter((s) => s.mode === "text-only");
    expect(scenarios.length).toBeGreaterThanOrEqual(2);
    const report = await runArena({
      scenarios,
      rivals: [createBotByName("text-only")],
      agent: createAgentParticipant({ config: champion }),
      seeds: Array.from({ length: 100 }, (_, k) => 1000 + k),
    });
    expect(report.games).toHaveLength(200);
    expect(report.overall.wrongAgreements).toBe(0);
    expect(report.overall.misExtracted).toBe(0);
    expect(report.overall.unextracted).toBeGreaterThan(0);
    expect(report.overall.violations).toBe(0);
    expect(report.overall.agreementRate).toBeGreaterThan(0.9);
  });
});
