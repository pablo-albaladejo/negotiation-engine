import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { computeMetrics } from "../../src/arena/metrics.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog, mandateFor } from "../../src/arena/scenario.js";
import { BOTS } from "../../src/bots/index.js";
import { withinAprBand } from "../../src/engine/apr.js";
import { loadConfig } from "../../src/engine/config.js";

const apr = loadCatalog(undefined, { includeOptIn: true }).filter((s) => s.mandateUnit === "apr");

describe("escenarios apr (opt-in)", () => {
  it("no entran en el catálogo por defecto", () => {
    expect(apr.map((s) => s.id).sort()).toEqual(["apr-buyer-narrow", "apr-buyer-wide", "apr-seller-narrow", "apr-seller-wide"]);
    expect(loadCatalog().some((s) => s.optIn || s.mandateUnit === "apr")).toBe(false);
  });

  it("la campeona no cruza su banda TAE contra los bots por defecto", async () => {
    const agent = createAgentParticipant({ config: loadConfig("config/champion.json") });
    for (const scenario of apr) {
      const band = mandateFor(scenario, scenario.role).apr!;
      for (const name of Object.keys(BOTS)) {
        for (const seed of [1, 2]) {
          const game = await playGame({ scenario, agent, rival: BOTS[name]!(), seed });
          const metrics = computeMetrics(scenario, game);
          expect(metrics.violations, `${scenario.id} ${name} ${seed}`).toBe(0);
          for (const e of game.transcript) if (e.from === "agent" && e.offer) expect(withinAprBand(band, e.offer)).toBe(true);
          if (game.agreement) expect(withinAprBand(band, game.agreement)).toBe(true);
          expect(metrics.surplusShare).not.toBeNull();
        }
      }
    }
  }, 30_000);
});

describe("escenarios apr: revisión", () => {
  it("checkApr rechaza una banda más estrecha que un paso de 0,01 de pct", async () => {
    const { ScenarioSchema } = await import("../../src/arena/scenario.js");
    const { APR_STEP_MESSAGE } = await import("../../src/engine/apr.js");
    const base = apr.find((s) => s.id === "apr-buyer-wide")!;
    const narrow = { ...base, zopa: "empty", mandates: { ...base.mandates, buyer: { reservation: { pct: 1.09, day: 10 }, apr: { min: 20.05, max: 20.1 } } } };
    const parsed = ScenarioSchema.safeParse(narrow);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((i) => i.message.includes(APR_STEP_MESSAGE))).toBe(true);
  });

  it("aceptar una oferta mejor que nuestro ancla no cuenta como violación", async () => {
    const { computeMetrics: metricsOf } = await import("../../src/arena/metrics.js");
    const scenario = apr.find((s) => s.id === "apr-buyer-wide")!;
    const better = { pct: 3.5, day: 10 };
    const game = {
      gameId: "g", scenarioId: scenario.id, rival: "r", agent: "a", role: scenario.role, mode: scenario.mode, seed: 1,
      endReason: "agreement" as const, agreement: better, agreedBy: "agent" as const, wrongAgreement: false, rounds: 1,
      transcript: [{ round: 1, from: "agent" as const, action: "accept" as const, offer: better, text: "ok" }], agentLatencyMs: [], records: [],
    };
    expect(metricsOf(scenario, game)).toMatchObject({ violations: 0, surplusShare: 1 });
  });

  it("la ruta de emergencia nunca lanza con una banda imposible: se retira o repite la última oferta", async () => {
    const { emergencyDecision } = await import("../../src/pipeline/pipeline.js");
    const { SessionStore } = await import("../../src/pipeline/session.js");
    const { withScenarioIssues } = await import("../../src/arena/agent-participant.js");
    const scenario = apr.find((s) => s.id === "apr-buyer-wide")!;
    const config = withScenarioIssues(loadConfig("config/champion.json"), scenario.issues);
    const impossible = { role: "buyer" as const, reservation: { pct: 1.09, day: 10 }, apr: { min: 20.05, max: 20.1, baseDays: 30, day: 10 } };
    const store = new SessionStore({ mandateFor: () => impossible, configFor: () => config, seedFor: () => 1 });
    const fresh = store.getOrCreate("s1");
    expect(emergencyDecision(fresh)).toMatchObject({ action: "walk" });
    const played = store.getOrCreate("s2");
    played.ourOffers.push({ pct: 1.5, day: 10 });
    expect(emergencyDecision(played)).toMatchObject({ action: "counter", offer: { pct: 1.5, day: 10 } });
  });
});
