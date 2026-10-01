import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import type { Participant } from "../../src/arena/participant.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createBotByName } from "../../src/bots/index.js";
import { loadConfig } from "../../src/engine/config.js";

const catalog = loadCatalog();
const scenario = (id: string) => catalog.find((s) => s.id === id)!;
const agent = createAgentParticipant({ config: loadConfig("config/champion.json") });

describe("runner de partidas en proceso", () => {
  it.each(["boulware", "conceder"])("misma semilla ⇒ misma transcripción (%s)", async (bot) => {
    for (const id of ["price-buyer-wide", "price-seller-narrow"]) {
      const a = await playGame({ scenario: scenario(id), agent, rival: createBotByName(bot), seed: 11 });
      const b = await playGame({ scenario: scenario(id), agent, rival: createBotByName(bot), seed: 11 });
      expect(a.transcript.length).toBeGreaterThan(0);
      expect(b.transcript).toEqual(a.transcript);
      expect(b.endReason).toBe(a.endReason);
      expect(b.agreement).toEqual(a.agreement);
    }
  });

  it("semillas distintas pueden dar transcripciones distintas", async () => {
    const transcripts = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5]) {
      const game = await playGame({ scenario: scenario("price-buyer-wide"), agent, rival: createBotByName("conceder"), seed });
      transcripts.add(JSON.stringify(game.transcript));
    }
    expect(transcripts.size).toBeGreaterThan(1);
  });

  it("el agente abre, cada mensaje cumple el contrato y la partida termina", async () => {
    const game = await playGame({ scenario: scenario("price-buyer-wide"), agent, rival: createBotByName("conceder"), seed: 3 });
    expect(game.transcript[0]).toMatchObject({ round: 1, from: "agent", action: "counter" });
    expect(["agreement", "agent-walk", "rival-walk", "limit"]).toContain(game.endReason);
    expect(game.records.some((r) => r.box === "engine")).toBe(true);
  });

  it("con ZOPA vacía no hay acuerdo", async () => {
    for (const bot of ["boulware", "conceder"]) {
      const game = await playGame({ scenario: scenario("price-seller-empty"), agent, rival: createBotByName(bot), seed: 5 });
      expect(game.endReason).not.toBe("agreement");
    }
  });

  it("un rival que falla deja la partida como error del rival", async () => {
    const broken: Participant = {
      name: "broken",
      kind: "bot",
      pool: "tuning",
      start: () => ({
        respond: async () => {
          throw new Error("conexión rechazada");
        },
      }),
    };
    const game = await playGame({ scenario: scenario("price-buyer-wide"), agent, rival: broken, seed: 1 });
    expect(game.endReason).toBe("rival-error");
    expect(game.error).toMatch(/conexión/);
  });

  it("un rival fuera de contrato rompe el protocolo (protocol_violation del rival)", async () => {
    const invalid: Participant = {
      name: "invalid",
      kind: "bot",
      pool: "tuning",
      start: () => ({ respond: async (turn) => ({ sessionId: turn.sessionId, round: turn.round, action: "counter", text: "sin oferta" }) as never }),
    };
    const game = await playGame({ scenario: scenario("price-buyer-wide"), agent, rival: invalid, seed: 1 });
    expect(game.endReason).toBe("protocol_violation");
    expect(game.protocolViolation?.by).toBe("rival");
  });
});

describe("escenarios con respuesta del rival tras nuestro último movimiento (10.10)", () => {
  it("con rivalCanRespond el agente recibe el campo en cada turno; sin él, nunca", async () => {
    const seen: unknown[] = [];
    const spy: Participant = {
      name: "spy",
      kind: "agent",
      pool: "tuning",
      async start(setup) {
        const inner = await agent.start(setup);
        return {
          respond: (turn) => {
            seen.push(turn.rivalCanRespond);
            return inner.respond(turn);
          },
        };
      },
    };
    await playGame({ scenario: { ...scenario("price-buyer-narrow"), rivalCanRespond: true }, agent: spy, rival: createBotByName("boulware"), seed: 1 });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((v) => v === true)).toBe(true);
    seen.length = 0;
    await playGame({ scenario: scenario("price-buyer-narrow"), agent: spy, rival: createBotByName("boulware"), seed: 1 });
    expect(seen.every((v) => v === undefined)).toBe(true);
  });
});
