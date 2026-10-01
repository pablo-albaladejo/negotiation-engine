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
