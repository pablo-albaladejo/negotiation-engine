import { serve, type ServerType } from "@hono/node-server";
import type { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createAgent } from "../../src/agent/agent.js";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { createA2AParticipant, createMcpParticipant } from "../../src/arena/external.js";
import { computeMetrics } from "../../src/arena/metrics.js";
import type { Participant } from "../../src/arena/participant.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { loadConfig } from "../../src/engine/config.js";
import { silentLogger } from "../../src/pipeline/box.js";
import { createA2AApp } from "../../src/protocol/a2a.js";
import { createMcpApp, mcpAdapterFromApp } from "../../src/protocol/mcp.js";
import { serverContract } from "./contract.js";

const issueNames = () => ["pct"];
serverContract("MCP negotiate_turn (Streamable HTTP)", (brain) => mcpAdapterFromApp(createMcpApp(brain, { issueNames })));

async function listen(app: Hono): Promise<{ url: string; close: () => Promise<void> }> {
  const server: ServerType = await new Promise((resolve) => {
    const s = serve({ fetch: app.fetch, port: 0, hostname: "127.0.0.1" }, () => resolve(s));
  });
  const address = server.address() as { port: number };
  return { url: `http://127.0.0.1:${address.port}`, close: () => new Promise((r) => server.close(() => r())) };
}

/** Nuestro agente (campeona, en proceso) contra nuestro agente expuesto en 127.0.0.1 por el protocolo. */
async function selfPlay(expose: (brain: ReturnType<typeof createAgent>["brain"]) => Hono, rival: (url: string) => Participant) {
  const served = createAgent({ configPath: "config/champion.json", scenarioPath: "config/scenario.json", provider: "none", logger: silentLogger });
  const server = await listen(expose(served.brain));
  try {
    const scenario = loadCatalog().find((s) => s.id === "price-seller-wide")!;
    const agent = createAgentParticipant({ config: loadConfig("config/champion.json") });
    const game = await playGame({ scenario, agent, rival: rival(server.url), seed: 1 });
    return { game, metrics: computeMetrics(scenario, game) };
  } finally {
    await server.close();
  }
}

describe("autojuego por protocolo en localhost", () => {
  it("A2A: partida completa contra nuestro agente expuesto por A2A", async () => {
    const { game, metrics } = await selfPlay((brain) => createA2AApp(brain, { issueNames }), (url) => createA2AParticipant({ name: "self-a2a", baseUrl: url }));
    expect(game.error).toBeUndefined();
    expect(game.endReason).not.toMatch(/error/);
    expect(game.rounds).toBeGreaterThan(1);
    expect(metrics.violations).toBe(0);
    expect(metrics.leaks).toBe(0);
  });

  it("MCP: partida completa contra nuestro adaptador MCP", async () => {
    const { game, metrics } = await selfPlay((brain) => createMcpApp(brain, { issueNames }), (url) => createMcpParticipant({ name: "self-mcp", baseUrl: url }));
    expect(game.error).toBeUndefined();
    expect(game.endReason).not.toMatch(/error/);
    expect(game.rounds).toBeGreaterThan(1);
    expect(metrics.violations).toBe(0);
  });

  it("A2A de solo texto: contextId hace de sesión y la ronda avanza por contexto", async () => {
    const served = createAgent({ configPath: "config/champion.json", scenarioPath: "config/scenario.json", provider: "none", logger: silentLogger });
    const app = createA2AApp(served.brain, { issueNames });
    const send = async (text: string, id: number) => {
      const res = await app.request("/a2a", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method: "SendMessage", params: { message: { messageId: `m${id}`, contextId: "ctx-1", role: "ROLE_USER", parts: [{ text }] } } }),
      });
      const body = (await res.json()) as { result: { message: { parts: { data?: { sessionId: string; round: number } }[] } } };
      return body.result.message.parts.find((p) => p.data)!.data!;
    };
    expect(await send("Hola, empecemos.", 1)).toMatchObject({ sessionId: "ctx-1", round: 1 });
    expect(await send("Te ofrezco un 2 %.", 2)).toMatchObject({ sessionId: "ctx-1", round: 2 });
  });
});
