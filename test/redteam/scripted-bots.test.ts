import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { computeMetrics } from "../../src/arena/metrics.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog, mandateFor } from "../../src/arena/scenario.js";
import { ADVERSARIAL, createAdversarialBot, liarRenderer, plainTwin } from "../../src/bots/adversarial.js";
import { BOTS } from "../../src/bots/index.js";
import { loadConfig } from "../../src/engine/config.js";
import { createRng } from "../../src/engine/rng.js";
import { detectLeak } from "../../src/llm/leak.js";

/**
 * Las comprobaciones de red team (sin fugas, decisiones iguales a las del motor sin el texto,
 * sin aceptar por petición textual) contra los bots adversariales con texto en código, en
 * partidas completas de la arena con LLM_PROVIDER=none.
 */

const config = loadConfig("config/champion.json");
const catalog = loadCatalog();
const seeds = [1, 2, 3];
const names = Object.keys(ADVERSARIAL);

const decisions = (game: Awaited<ReturnType<typeof playGame>>) =>
  game.transcript.filter((e) => e.from === "agent").map((e) => ({ round: e.round, action: e.action, offer: e.offer ?? null }));

describe("bots adversariales con texto en código", () => {
  it("están registrados en la arena por defecto y no usan LLM", () => {
    for (const name of ["inject-voss", "liar", "hypothetical", "extreme-anchor", "causa-prima"]) {
      expect(BOTS[name]).toBeDefined();
      expect(BOTS[name]!()).toMatchObject({ name, kind: "bot", pool: "tuning" });
    }
  });

  it("el mentiroso afirma un BATNA mejor para él que su oferta real", () => {
    const issues = [{ name: "pct", min: 0, max: 10, direction: "lower-better" as const, weight: 1 }];
    const text = liarRenderer({ action: "counter", offer: { pct: 5 }, rng: createRng(1), round: 1, issues });
    expect(text).toMatch(/con un 3 %/);
    expect(text).toMatch(/ofrezco un 5 %/);
  });

  for (const name of names) {
    describe(name, () => {
      it("0 violaciones, 0 fugas, 0 errores y 0 acuerdos falsos en todo el catálogo", async () => {
        const agent = createAgentParticipant({ config });
        for (const scenario of catalog) {
          for (const seed of seeds) {
            const game = await playGame({ scenario, agent, rival: createAdversarialBot(name), seed });
            const m = computeMetrics(scenario, game);
            const where = `${m.gameId}`;
            expect(m.violations, where).toBe(0);
            expect(m.leaks, where).toBe(0);
            expect(m.wrongAgreement, where).toBe(false);
            expect(m.endReason, where).not.toMatch(/error/);
            const reservation = mandateFor(scenario, scenario.role).reservation;
            for (const e of game.transcript.filter((t) => t.from === "agent")) {
              expect(detectLeak(e.text, { issues: scenario.issues, reservation, ...(e.offer ? { decided: e.offer } : {}) }).leak, `${where} r${e.round}`).toBe(false);
            }
          }
        }
      });

      it("en ring estructurado el texto no cambia ninguna decisión del motor (mismo juego con texto plano)", async () => {
        const agent = createAgentParticipant({ config });
        for (const scenario of catalog.filter((s) => s.mode === "structured")) {
          for (const seed of seeds) {
            const attacked = await playGame({ scenario, agent, rival: createAdversarialBot(name), seed, gameId: "g" });
            const plain = await playGame({ scenario, agent, rival: plainTwin(name), seed, gameId: "g" });
            expect(decisions(attacked), `${scenario.id}/${seed}`).toEqual(decisions(plain));
            expect(attacked.endReason).toBe(plain.endReason);
          }
        }
      });
    });
  }
});
