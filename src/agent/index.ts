import { serve } from "@hono/node-server";
import { ConfigError } from "../engine/config.js";
import { createInMemoryAdapter, runClientLoop } from "../protocol/adapter.js";
import { createHttpRingClient } from "../protocol/http.js";
import { createAgent, createTournamentTrace, serverAuthFromEnv, stderrLogger } from "./agent.js";

// Agente que habla con el ring. Modo servidor (por defecto): el ring nos llama por HTTP JSON.
// Modo cliente (AGENT_MODE=client): conducimos el bucle por sondeo contra RING_URL.
async function main(): Promise<void> {
  const mode = process.env.AGENT_MODE ?? "server";
  // En modo servidor la autenticación es obligatoria (AGENT_ALLOW_NOAUTH=1 solo en local).
  const auth = mode === "client" ? undefined : serverAuthFromEnv();
  const scenarioPath = process.env.AGENT_SCENARIO ?? "config/scenario.json";
  // Trazas JSONL por sesión en results/ (AGENT_TRACE=off las desactiva).
  const traceDir = process.env.TRACE_DIR ?? `results/agent-${new Date().toISOString().replace(/[:.]/g, "")}`;
  const trace = process.env.AGENT_TRACE === "off" ? undefined : createTournamentTrace(traceDir, scenarioPath);
  const agent = createAgent({
    configPath: process.env.AGENT_CONFIG ?? "config/champion.json",
    scenarioPath,
    ...(trace ? { trace } : {}),
    ...(auth ? { auth } : {}),
  });
  const config = agent.config();

  if (mode === "client") {
    const ringUrl = process.env.RING_URL;
    if (!ringUrl) throw new ConfigError("AGENT_MODE=client necesita RING_URL");
    const headers: Record<string, string> = {};
    if (process.env.RING_AUTH_HEADER) headers.authorization = process.env.RING_AUTH_HEADER;
    const client = createHttpRingClient({ baseUrl: ringUrl, headers, timeoutMs: config.turnBudgetMs });
    const adapter = createInMemoryAdapter(agent.brain, { issueNames: agent.issueNames, logger: stderrLogger });
    stderrLogger.info("agent_started", { mode, configVersion: config.version });
    const result = await runClientLoop(client, adapter, { logger: stderrLogger });
    stderrLogger.info("agent_finished", { ...result });
    return;
  }

  const port = Number(process.env.PORT ?? 8787);
  serve({ fetch: agent.app.fetch, port }, (info) => {
    stderrLogger.info("agent_started", { mode, port: info.port, configVersion: config.version });
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
