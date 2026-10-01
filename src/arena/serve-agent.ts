import { serve } from "@hono/node-server";
import type { Hono } from "hono";
import { parseArgs } from "node:util";
import type { AgentConfig } from "../engine/config.js";
import { loadConfig } from "../engine/config.js";
import { deriveSeed } from "../engine/rng.js";
import { createPipeline } from "../pipeline/pipeline.js";
import { SessionStore } from "../pipeline/session.js";
import { createA2AApp } from "../protocol/a2a.js";
import { createHttpApp } from "../protocol/http.js";
import { createMcpApp } from "../protocol/mcp.js";
import { withScenarioIssues } from "./agent-participant.js";
import { DEFAULT_CATALOG, loadCatalog, mandateFor, type Scenario } from "./scenario.js";

export type Transport = "http" | "a2a" | "mcp";

/**
 * Semilla del agente servido igual que en proceso: de `gameId = escenario__rival__semilla` se
 * deriva `deriveSeed(semilla, "agent")`, así una partida por red repite la de la arena en proceso.
 */
export function arenaSeedFor(sessionId: string): number {
  const seed = Number(sessionId.split("__").at(-1));
  return Number.isInteger(seed) ? deriveSeed(seed, "agent") : deriveSeed(0, sessionId);
}

/** Nuestro agente con el mandato de un escenario de arena, expuesto por el transporte elegido. */
export function createScenarioAgentApp(config: AgentConfig, scenario: Scenario, transport: Transport): Hono {
  const scenarioConfig = withScenarioIssues(config, scenario.issues);
  const store = new SessionStore({ mandateFor: () => mandateFor(scenario, scenario.role), configFor: () => scenarioConfig, seedFor: arenaSeedFor });
  const brain = createPipeline({ store, provider: "none" });
  const options = { issueNames: () => scenario.issues.map((i) => i.name) };
  if (transport === "a2a") return createA2AApp(brain, options);
  if (transport === "mcp") return createMcpApp(brain, options);
  return createHttpApp(brain, { ...options, health: () => ({ configVersion: config.version, llmProvider: "none", scenarioId: scenario.id }) });
}

/** `pnpm arena:serve-agent --scenario <id> --transport a2a|mcp|http --port <n>`: solo 127.0.0.1, sin red externa. */
export function main(argv = process.argv.slice(2)): void {
  const { values } = parseArgs({
    args: argv,
    options: {
      scenario: { type: "string" },
      transport: { type: "string", default: "a2a" },
      port: { type: "string", default: "8797" },
      config: { type: "string", default: process.env.AGENT_CONFIG ?? "config/champion.json" },
      catalog: { type: "string", default: DEFAULT_CATALOG },
    },
    strict: true,
  });
  const scenario = loadCatalog(values.catalog, { includeOptIn: true }).find((s) => s.id === values.scenario);
  if (!scenario) throw new Error(`Escenario desconocido: ${values.scenario}`);
  const transport = values.transport as Transport;
  if (!["http", "a2a", "mcp"].includes(transport)) throw new Error(`Transporte desconocido: ${transport}`);
  const app = createScenarioAgentApp(loadConfig(values.config), scenario, transport);
  serve({ fetch: app.fetch, port: Number(values.port), hostname: "127.0.0.1" }, (info) => console.log(`agente (${scenario.id}) por ${transport} en http://127.0.0.1:${info.port}`));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
