import { describe, expect, it } from "vitest";
import { createBotByName } from "../../src/bots/index.js";
import { renderNaturalLanguage, nlRng } from "../../src/bots/nl-renderer.js";
import { loadConfig } from "../../src/engine/config.js";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import type { Participant } from "../../src/arena/participant.js";
import { computeMetrics } from "../../src/arena/metrics.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import type { TurnInput } from "../../src/protocol/schemas.js";

const champion = loadConfig("config/champion.json");

/** Agente espiado: guarda cada turno que recibe. */
function spied(): { agent: Participant; inputs: TurnInput[] } {
  const inner = createAgentParticipant({ config: champion });
  const inputs: TurnInput[] = [];
  return {
    inputs,
    agent: {
      ...inner,
      start: async (s) => {
        const session = await inner.start(s);
        return { ...session, respond: async (input: TurnInput) => (inputs.push(input), session.respond(input)) };
      },
    },
  };
}

describe("arena en texto completo (7.1, 7.2, 4.2)", () => {
  const scenario = loadCatalog().find((s) => s.id === "price-buyer-wide")!;

  it("contra Boulware: ningún turno trae rivalOffer ni acción distinta de message; verdad de terreno por turno; reproducible", async () => {
    const run = async () => {
      const { agent, inputs } = spied();
      const game = await playGame({ scenario, agent, rival: createBotByName("boulware"), seed: 7, textMode: "full", languages: ["es"] });
      return { game, inputs };
    };
    const a = await run();
    expect(a.inputs.every((i) => i.rivalAction === "message" && i.rivalOffer === undefined)).toBe(true);
    expect(a.game.transcript.filter((e) => e.from === "rival" && e.action === "counter").every((e) => e.offer !== undefined)).toBe(true);
    expect(a.game.language).toBe("es");
    const b = await run();
    expect(b.game.transcript.map((e) => e.text)).toEqual(a.game.transcript.map((e) => e.text));
    const m = computeMetrics(scenario, a.game);
    expect(m).toMatchObject({ violations: 0, leaks: 0, falseAccept: 0 });
  });

  it("partida sembrada contra un bot que acepta por texto: acuerdo registrado con origen rival-text-verified y sin aceptaciones perdidas", async () => {
    let found = false;
    for (let seed = 1; seed <= 30 && !found; seed++) {
      const game = await playGame({ scenario, agent: createAgentParticipant({ config: champion }), rival: createBotByName("boulware"), seed, textMode: "full", languages: ["es"] });
      if (game.agreedBy !== "rival") continue;
      found = true;
      expect(game.missedAccept).toBe(0);
      expect(game.records.some((r) => r.box === "agreement" && (r.input as { origin?: string }).origin === "rival-text-verified")).toBe(true);
    }
    expect(found).toBe(true);
  });

  it("renderizador: aceptaciones y retiradas solo en texto, rangos y fracciones marcados no extraíbles", () => {
    const rng = nlRng(3);
    expect(renderNaturalLanguage({ action: "accept" }, "en", rng).text).not.toMatch(/\d/);
    const forms = Array.from({ length: 40 }, () => renderNaturalLanguage({ action: "counter", offer: { pct: 2.5 } }, "es", rng));
    expect(forms.some((f) => !f.extractable)).toBe(true);
    expect(forms.filter((f) => f.forms.includes("range")).every((f) => !f.extractable)).toBe(true);
  });
});
