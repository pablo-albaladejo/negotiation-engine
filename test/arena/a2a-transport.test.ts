import { serve, type ServerType } from "@hono/node-server";
import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { runArenaCli } from "../../src/arena/cli.js";
import { createA2AParticipant } from "../../src/arena/external.js";
import { playGame, type GameResult } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createScenarioAgentApp } from "../../src/arena/serve-agent.js";
import { createBotByName } from "../../src/bots/index.js";
import { loadConfig } from "../../src/engine/config.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const config = loadConfig("config/champion.json");
const catalog = loadCatalog(undefined, { includeOptIn: true });

async function listen(app: ReturnType<typeof createScenarioAgentApp>): Promise<{ url: string; close: () => Promise<void> }> {
  const server: ServerType = await new Promise((resolve) => {
    const s = serve({ fetch: app.fetch, port: 0, hostname: "127.0.0.1" }, () => resolve(s));
  });
  const { port } = server.address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(() => r())) };
}

const comparable = (g: GameResult) => ({ endReason: g.endReason, rounds: g.rounds, agreement: g.agreement, agreedBy: g.agreedBy, transcript: g.transcript });

describe("transporte A2A en la arena", () => {
  it("nuestro agente servido por A2A en localhost juega igual que en proceso (mismas semillas)", async () => {
    const inProcess = createAgentParticipant({ config });
    for (const id of ["apr-buyer-wide", "price-seller-wide"]) {
      const scenario = catalog.find((s) => s.id === id)!;
      const server = await listen(createScenarioAgentApp(config, scenario, "a2a"));
      try {
        const remote = createA2AParticipant({ name: "agent-a2a", baseUrl: server.url, kind: "agent" });
        for (const rival of ["causa-prima-engine", "boulware", "tit-for-tat"]) {
          for (const seed of [1, 2, 3]) {
            const local = await playGame({ scenario, agent: inProcess, rival: createBotByName(rival), seed });
            const viaA2A = await playGame({ scenario, agent: remote, rival: createBotByName(rival), seed });
            expect(viaA2A.error, `${id} ${rival} ${seed}`).toBeUndefined();
            expect(comparable(viaA2A)).toEqual(comparable(local));
          }
        }
      } finally {
        await server.close();
      }
    }
  }, 30_000);

  it("pnpm arena --agent-a2a juega por A2A", async () => {
    const scenario = catalog.find((s) => s.id === "apr-seller-narrow")!;
    const server = await listen(createScenarioAgentApp(config, scenario, "a2a"));
    try {
      const out = mkdtempSync(join(tmpdir(), "arena-a2a-"));
      const { report, summary } = await runArenaCli(["--agent-a2a", server.url, "--scenarios", scenario.id, "--rivals", "causa-prima-engine", "--seeds", "2", "--out", out, "--quiet"]);
      expect(summary).toMatchObject({ agent: "agent-a2a", network: true });
      expect(report.overall.games).toBe(2);
      expect(report.overall.rivalErrors).toBe(0);
      expect(report.overall.protocolViolations).toBe(0);
    } finally {
      await server.close();
    }
  });
});
