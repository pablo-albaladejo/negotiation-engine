import type { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createHttpParticipant } from "../../src/arena/external.js";
import { computeMetrics, summarize } from "../../src/arena/metrics.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createAgent } from "../../src/agent/agent.js";
import { createBotByName } from "../../src/bots/index.js";
import { createBotApp } from "../../src/bots/serve-app.js";
import { silentLogger } from "../../src/pipeline/box.js";
import type { FetchLike } from "../../src/protocol/http.js";

const scenario = loadCatalog().find((s) => s.id === "price-buyer-wide")!;

/** fetch que entra en la app Hono sin abrir puertos. */
const viaApp = (app: Hono): FetchLike => (url, init) => Promise.resolve(app.request(url, init));

function httpAgent() {
  // Mismo entrypoint que `pnpm agent`; su mandato (config/scenario.json) es el de price-buyer-wide.
  const agent = createAgent({ configPath: "config/champion.json", scenarioPath: "config/scenario.json", provider: "none", logger: silentLogger });
  return createHttpParticipant({ name: "agent-http", kind: "agent", baseUrl: "http://agent", fetch: viaApp(agent.app) });
}

describe("sparring externo por HTTP JSON", () => {
  it("pnpm agent contra un bot servido por HTTP: partida completa y mensajes en contrato", async () => {
    const botApp = createBotApp({ bot: createBotByName("conceder"), scenario });
    const rival = createHttpParticipant({ name: "conceder-http", baseUrl: "http://bot", fetch: viaApp(botApp) });
    const health = await (await botApp.request("/health")).json();
    expect(health).toMatchObject({ status: "ok" });

    const game = await playGame({ scenario, agent: httpAgent(), rival, seed: 1 });
    expect(["agreement", "agent-walk", "rival-walk", "limit"]).toContain(game.endReason);
    expect(game.transcript.length).toBeGreaterThan(1);
    const metrics = computeMetrics(scenario, game);
    expect(metrics.violations).toBe(0);
    expect(metrics.rival).toBe("conceder-http");
  });

  it("un bot que se cae a mitad de partida queda como error del rival y no computa", async () => {
    const botApp = createBotApp({ bot: createBotByName("boulware"), scenario });
    let calls = 0;
    const dying: FetchLike = (url, init) => {
      calls++;
      return calls > 3 ? Promise.reject(new TypeError("fetch failed: ECONNREFUSED")) : viaApp(botApp)(url, init);
    };
    const rival = createHttpParticipant({ name: "flaky", baseUrl: "http://bot", fetch: dying });
    const game = await playGame({ scenario, agent: httpAgent(), rival, seed: 2 });
    expect(game.endReason).toBe("rival-error");
    expect(game.error).toMatch(/Fallo de red/);
    const summary = summarize([computeMetrics(scenario, game)]);
    expect(summary).toMatchObject({ rivalErrors: 1, meanSurplus: null, agreementRate: 0 });
  });

  it("un bot que responde fuera de contrato rompe el protocolo (protocol-violation del rival)", async () => {
    const rival = createHttpParticipant({
      name: "garbage",
      baseUrl: "http://bot",
      fetch: async () => new Response(JSON.stringify({ hello: "world" }), { status: 200, headers: { "content-type": "application/json" } }),
    });
    const game = await playGame({ scenario, agent: httpAgent(), rival, seed: 3 });
    expect(game.endReason).toBe("protocol-violation");
    expect(game.protocolViolation?.by).toBe("rival");
  });
});
