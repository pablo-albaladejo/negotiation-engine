import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import type { Participant } from "../../src/arena/participant.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog, mandateFor, type Scenario } from "../../src/arena/scenario.js";
import { BOTS } from "../../src/bots/index.js";
import { acceptable, aprValid, offerApr } from "../../src/engine/apr.js";
import { loadConfig } from "../../src/engine/config.js";
import { decide, type EngineInput } from "../../src/engine/engine.js";
import { orientIssues, withinIssueRanges, withinOfferMandate, type Offer } from "../../src/engine/issues.js";
import type { TurnInput, TurnOutput } from "../../src/protocol/schemas.js";

const catalog = loadCatalog(undefined, { includeOptIn: true });
const byId = (id: string) => catalog.find((s) => s.id === id)!;
const config = loadConfig("config/champion.json");
const params = { beta: config.beta, openingMargin: config.openingMargin, acceptMargin: config.acceptMargin, acTimeThreshold: config.acTimeThreshold, noise: 0, defaultHorizon: 10 };

const engineInput = (scenario: Scenario, rival: Offer, round = 9): EngineInput => ({
  issues: scenario.issues,
  mandate: mandateFor(scenario, scenario.role),
  params,
  state: { round, roundLimit: 10, ourOffers: [], rivalOffers: [rival], rivalAcceptedOurLast: false, rivalWalked: false, rivalCanRespond: false },
  seed: 1,
});

/** Una partida del agente en proceso con ofertas estructuradas del rival dadas. */
async function play(scenario: Scenario, offers: Offer[]): Promise<{ outputs: (TurnOutput | "protocol-error")[]; records: readonly { box: string; output: unknown }[] }> {
  const session = await createAgentParticipant({ config }).start({ sessionId: "s", scenarioId: scenario.id, issues: scenario.issues, mandate: mandateFor(scenario, scenario.role), seed: 1, mode: "structured" });
  const outputs: (TurnOutput | "protocol-error")[] = [];
  let input: TurnInput = { sessionId: "s", round: 1, roundLimit: 10, rivalAction: "message", text: "hola" };
  for (const [k, offer] of offers.entries()) {
    let out: TurnOutput | "protocol-error";
    try {
      out = await session.respond(input);
    } catch {
      out = "protocol-error";
    }
    outputs.push(out);
    if (out !== "protocol-error" && out.action !== "counter") break;
    input = { sessionId: "s", round: k + 2, roundLimit: 10, rivalAction: "offer", rivalOffer: offer, text: "oferta" };
  }
  return { outputs, records: session.records?.() ?? [] };
}

const buyerCases: Offer[] = [{ pct: -50, day: 30 }, { pct: -5, day: 40 }, { pct: 0, day: 30 }];
const sellerCases: Offer[] = [{ pct: -50, day: 10 }, { pct: -0.01, day: 0 }, { pct: 0, day: -5 }, { pct: 1, day: 40 }];

describe("ofertas del rival fuera de rango o del dominio TAE (revisión, crítico)", () => {
  it.each([
    ["apr-buyer-wide", buyerCases],
    ["apr-seller-wide", sellerCases],
  ] as const)("%s: acceptable() es falso y decide no acepta", (id, cases) => {
    const scenario = byId(id);
    const mandate = mandateFor(scenario, scenario.role);
    const oriented = orientIssues(scenario.issues, scenario.role);
    for (const offer of cases) {
      expect(acceptable(oriented, mandate, offer), JSON.stringify(offer)).toBe(false);
      for (const round of [2, 9, 10]) expect(decide(engineInput(scenario, offer, round)).action, `${JSON.stringify(offer)} r${round}`).not.toBe("accept");
    }
  });

  it.each([
    ["apr-buyer-wide", buyerCases],
    ["apr-seller-wide", sellerCases],
  ] as const)("%s por el pipeline: no acepta y registra la oferta como inválida", async (id, cases) => {
    for (const offer of cases) {
      const { outputs, records } = await play(byId(id), [offer, offer]);
      for (const out of outputs) if (out !== "protocol-error") expect(out.action, JSON.stringify(offer)).not.toBe("accept");
      const reconcile = records.filter((r) => r.box === "reconcile").map((r) => r.output as { offer: Offer | null; invalidOffer?: Offer; reason?: string });
      expect(reconcile.at(-1)).toMatchObject({ offer: null, invalidOffer: offer, reason: "out-of-range" });
    }
  });

  it("fuzz: con ofertas en cualquier sitio (también no finitas) nunca aceptamos fuera de rango ni cruzando la reserva", async () => {
    const value = fc.oneof(
      { weight: 6, arbitrary: fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }) },
      { weight: 3, arbitrary: fc.integer({ min: 0, max: 60 }) },
      { weight: 1, arbitrary: fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, -1e9, 1e9) },
    );
    const ids = ["price-buyer-wide", "price-seller-narrow", "pct-day-seller-wide", "pct-day-buyer-wide", "apr-buyer-wide", "apr-seller-narrow"];
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...ids), fc.array(fc.tuple(value, value), { minLength: 1, maxLength: 9 }), async (id, raw) => {
        const scenario = byId(id);
        const names = scenario.issues.map((i) => i.name);
        const offers = raw.map(([a, b]) => Object.fromEntries(names.map((n, k) => [n, k === 0 ? a : b])));
        const mandate = mandateFor(scenario, scenario.role);
        const oriented = orientIssues(scenario.issues, scenario.role);
        const { outputs } = await play(scenario, offers);
        for (const out of outputs) {
          if (out === "protocol-error" || out.action !== "accept") continue;
          expect(withinIssueRanges(scenario.issues, out.offer)).toBe(true);
          if (mandate.apr) {
            expect(aprValid(mandate.apr, out.offer)).toBe(true);
            const apr = offerApr(mandate.apr, out.offer);
            expect(mandate.role === "buyer" ? apr >= mandate.apr.min : apr <= mandate.apr.max).toBe(true);
          } else expect(withinOfferMandate(oriented, mandate, out.offer)).toBe(true);
        }
      }),
      { numRuns: 150 },
    );
  }, 60_000);

  it("solo texto: una cifra fuera de rango se ignora (sin oferta, se piden cifras) y nunca se acepta", async () => {
    const scenario = byId("text-buyer-wide");
    const session = await createAgentParticipant({ config }).start({ sessionId: "t", scenarioId: scenario.id, issues: scenario.issues, mandate: mandateFor(scenario, scenario.role), seed: 1, mode: "text-only" });
    await session.respond({ sessionId: "t", round: 1, roundLimit: 10, rivalAction: "message", text: "hola" });
    const out = await session.respond({ sessionId: "t", round: 2, roundLimit: 10, rivalAction: "offer", text: "Te ofrezco un 15 %, es mi última palabra." });
    expect(out.action).toBe("counter");
    const reconcile = (session.records?.() ?? []).filter((r) => r.box === "reconcile").at(-1)!.output;
    expect(reconcile).toMatchObject({ offer: null, unconfirmed: true, invalidOffer: { pct: 15 }, reason: "out-of-range" });
  });

  it("cruce apr × solo texto: cifra fuera de rango y día ≥ baseDays por texto nunca se aceptan, y el agente siempre responde", async () => {
    // Issue por separado (mandato TAE): "15 %" fuera del rango declarado de `pct` ([0, 10]).
    const textScenario = byId("text-buyer-wide");
    const textSession = await createAgentParticipant({ config }).start({
      sessionId: "cross-text",
      scenarioId: textScenario.id,
      issues: textScenario.issues,
      mandate: mandateFor(textScenario, textScenario.role),
      seed: 1,
      mode: "text-only",
    });
    await textSession.respond({ sessionId: "cross-text", round: 1, roundLimit: 10, rivalAction: "message", text: "hola" });
    const textOut = await textSession.respond({ sessionId: "cross-text", round: 2, roundLimit: 10, rivalAction: "offer", text: "Te ofrezco un 15 %, es mi última palabra." });
    expect(textOut.action).not.toBe("accept");

    // Mandato apr: una oferta de texto con día ≥ baseDays (30) no es válida en el dominio TAE.
    const aprScenario = byId("apr-buyer-wide");
    const aprSession = await createAgentParticipant({ config }).start({
      sessionId: "cross-apr",
      scenarioId: aprScenario.id,
      issues: aprScenario.issues,
      mandate: mandateFor(aprScenario, aprScenario.role),
      seed: 1,
      mode: "text-only",
    });
    await aprSession.respond({ sessionId: "cross-apr", round: 1, roundLimit: 10, rivalAction: "message", text: "hola" });
    const aprOut = await aprSession.respond({ sessionId: "cross-apr", round: 2, roundLimit: 10, rivalAction: "offer", text: "Te ofrezco 2% al día 35." });
    expect(aprOut.action).not.toBe("accept");
    // El agente responde con una salida válida del protocolo en los dos casos, nunca lanza.
    for (const out of [textOut, aprOut]) expect(["counter", "walk"]).toContain(out.action);
  });

  it("arena: una oferta estructurada del rival fuera de rango es protocol-violation del rival", async () => {
    const scenario = byId("price-buyer-wide");
    const rival: Participant = {
      name: "out-of-range",
      kind: "bot",
      pool: "tuning",
      start: () => ({ respond: async (t) => ({ sessionId: t.sessionId, round: t.round, action: "counter", offer: { pct: 12 }, text: "12" }) }),
    };
    const game = await playGame({ scenario, agent: createAgentParticipant({ config }), rival, seed: 1 });
    expect(game).toMatchObject({ endReason: "protocol-violation", protocolViolation: { by: "rival" } });
    expect(game.protocolViolation?.detail).toMatch(/fuera del rango declarado: pct/);
    // Los bots en código nunca la provocan.
    for (const make of Object.values(BOTS)) expect((await playGame({ scenario, agent: createAgentParticipant({ config }), rival: make(), seed: 2 })).endReason).not.toBe("protocol-violation");
  });
});
