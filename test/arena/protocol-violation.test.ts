import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { createHttpParticipant } from "../../src/arena/external.js";
import { computeMetrics, summarize } from "../../src/arena/metrics.js";
import type { Participant } from "../../src/arena/participant.js";
import { TranscriptLineSchema } from "../../src/arena/results-schema.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { BOTS, OPT_IN_BOTS } from "../../src/bots/index.js";
import { loadConfig } from "../../src/engine/config.js";
import type { TurnInput } from "../../src/protocol/schemas.js";

const catalog = loadCatalog(undefined, { includeOptIn: true });
const scenario = catalog.find((s) => s.id === "price-buyer-wide")!;
const agent = createAgentParticipant({ config: loadConfig("config/champion.json") });

/** Bot que responde con una salida rota en la ronda `at`. */
function broken(name: string, bad: (turn: TurnInput) => unknown, at = 1): Participant {
  return {
    name,
    kind: "bot",
    pool: "tuning",
    start: () => ({
      respond: async (turn) => (turn.round >= at ? bad(turn) : { sessionId: turn.sessionId, round: turn.round, action: "counter", offer: { pct: 1 }, text: "Mi propuesta: 1." }) as never,
    }),
  };
}

describe("fin por violación de protocolo", () => {
  it.each([
    ["counter sin oferta", (t: TurnInput) => ({ sessionId: t.sessionId, round: t.round, action: "counter", text: "hola" })],
    ["issue no declarado", (t: TurnInput) => ({ sessionId: t.sessionId, round: t.round, action: "counter", offer: { pct: 1, day: 3 }, text: "x" })],
    ["otra ronda", (t: TurnInput) => ({ sessionId: t.sessionId, round: t.round + 1, action: "counter", offer: { pct: 1 }, text: "x" })],
    ["otra sesión", (t: TurnInput) => ({ sessionId: "otra", round: t.round, action: "counter", offer: { pct: 1 }, text: "x" })],
  ])("rival: %s → protocol-violation, valor 0 y lado registrado", async (_label, bad) => {
    const game = await playGame({ scenario, agent, rival: broken("broken", bad, 2), seed: 1 });
    expect(game.endReason).toBe("protocol-violation");
    expect(game.protocolViolation?.by).toBe("rival");
    expect(game.rounds).toBe(2);
    const metrics = computeMetrics(scenario, game);
    expect(metrics).toMatchObject({ protocolViolation: "rival", agreement: false, surplusShare: 0, rivalError: false });
    expect(summarize([metrics])).toMatchObject({ protocolViolations: 1, protocolViolationsByAgent: 0 });
    const { records: _records, ...rest } = game;
    expect(TranscriptLineSchema.parse({ schemaVersion: 3, ...rest, metrics }).protocolViolation?.by).toBe("rival");
  });

  it("el lector acepta el literal antiguo protocol_violation como protocol-violation", async () => {
    const game = await playGame({ scenario, agent, rival: broken("broken", (t) => ({ sessionId: t.sessionId, round: t.round, action: "counter", text: "x" })), seed: 1 });
    const { records: _records, ...rest } = game;
    const metrics = computeMetrics(scenario, game);
    const old = { schemaVersion: 3, ...rest, endReason: "protocol_violation", metrics: { ...metrics, endReason: "protocol_violation" } };
    const parsed = TranscriptLineSchema.parse(old);
    expect(parsed.endReason).toBe("protocol-violation");
    expect(parsed.metrics.endReason).toBe("protocol-violation");
  });

  it("agente: salida inválida → protocol-violation del agente", async () => {
    const bad = broken("bad-agent", (t) => ({ sessionId: t.sessionId, round: t.round, action: "accept", text: "ok" }));
    const game = await playGame({ scenario, agent: { ...bad, kind: "agent" }, rival: BOTS.boulware!(), seed: 1 });
    expect(game).toMatchObject({ endReason: "protocol-violation", protocolViolation: { by: "agent" } });
  });

  it("rival HTTP externo: salida fuera de contrato → protocol-violation; red y estado HTTP → rival-error", async () => {
    const http = (respond: (body: TurnInput) => Promise<Response>) =>
      createHttpParticipant({ name: "http", baseUrl: "http://rival.test", fetch: async (_url, init) => respond(JSON.parse(String(init?.body)) as TurnInput) });
    const invalid = await playGame({
      scenario,
      agent,
      rival: http(async (t) => Response.json({ sessionId: t.sessionId, round: t.round, action: "counter", text: "sin oferta" })),
      seed: 1,
    });
    expect(invalid).toMatchObject({ endReason: "protocol-violation", protocolViolation: { by: "rival" } });
    expect(invalid.protocolViolation?.detail).toMatch(/fuera de contrato/);
    const down = await playGame({ scenario, agent, rival: http(async () => Promise.reject(new Error("ECONNREFUSED"))), seed: 1 });
    expect(down.endReason).toBe("rival-error");
    const status = await playGame({ scenario, agent, rival: http(async () => new Response("boom", { status: 500 })), seed: 1 });
    expect(status.endReason).toBe("rival-error");
  });

  it("un error de red sigue siendo error del rival, no violación", async () => {
    const failing: Participant = { name: "down", kind: "bot", pool: "tuning", start: () => ({ respond: async () => Promise.reject(new Error("ECONNREFUSED")) }) };
    const game = await playGame({ scenario, agent, rival: failing, seed: 1 });
    expect(game.endReason).toBe("rival-error");
    expect(game.protocolViolation).toBeUndefined();
  });

  it("nuestro agente nunca rompe el protocolo (todo el catálogo, todos los bots)", async () => {
    const rivals = { ...BOTS, ...OPT_IN_BOTS };
    for (const s of catalog) {
      for (const make of Object.values(rivals)) {
        const game = await playGame({ scenario: s, agent, rival: make(), seed: 3 });
        expect(game.protocolViolation?.by, `${s.id} ${game.rival}`).not.toBe("agent");
        expect(game.endReason).not.toBe("agent-error");
      }
    }
  }, 30_000);
});
