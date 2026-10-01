import { parseConfig, type AgentConfig, type Issue } from "../engine/config.js";
import type { Narrator } from "../llm/narrator.js";
import type { TextParser } from "../llm/parser.js";
import { MemoryTrace, type Logger } from "../pipeline/box.js";
import { createPipeline } from "../pipeline/pipeline.js";
import { SessionStore } from "../pipeline/session.js";
import { createInMemoryAdapter } from "../protocol/adapter.js";
import type { GameSetup, Participant, PlayerSession } from "./participant.js";

/**
 * La configuración con los issues del escenario (en el torneo, los fija la tarea 10.3).
 * Se revalida con el esquema, así que los pesos quedan normalizados.
 */
export function withScenarioIssues(config: AgentConfig, issues: readonly Issue[]): AgentConfig {
  return parseConfig({ ...config, issues: issues.map((i) => ({ ...i })) }, "config+escenario");
}

export interface AgentParticipantOptions {
  name?: string;
  config: AgentConfig;
  pool?: "tuning" | "heldOut";
  logger?: Logger;
  /** Parser y narrador LLM opcionales; por defecto ninguno (proveedor `none`, sin red). */
  parser?: TextParser;
  narrator?: Narrator;
}

/**
 * Nuestro agente en proceso: el mismo pipeline y adaptador que `pnpm agent`, con proveedor
 * `none`, una sesión por partida y la traza de cajas en memoria.
 */
export function createAgentParticipant(options: AgentParticipantOptions): Participant {
  const configs = new Map<string, AgentConfig>();
  const configFor = (issues: readonly Issue[]) => {
    const key = JSON.stringify(issues);
    let config = configs.get(key);
    if (!config) {
      config = withScenarioIssues(options.config, issues);
      configs.set(key, config);
    }
    return config;
  };

  return {
    name: options.name ?? `agent-v${options.config.version}`,
    kind: "agent",
    pool: options.pool ?? "tuning",
    start(setup: GameSetup): PlayerSession {
      const config = configFor(setup.issues);
      const trace = new MemoryTrace();
      const store = new SessionStore({
        mandateFor: () => setup.mandate,
        configFor: () => config,
        seedFor: () => setup.seed,
      });
      const deps: Parameters<typeof createPipeline>[0] = { store, trace, provider: "none" };
      if (options.logger) deps.logger = options.logger;
      if (options.parser) deps.parser = options.parser;
      if (options.narrator) deps.narrator = options.narrator;
      const brain = createPipeline(deps);
      const issueNames = config.issues.map((i) => i.name);
      const adapter = createInMemoryAdapter(brain, { issueNames: () => issueNames });
      return {
        async respond(turn) {
          const result = await adapter.handle(turn);
          if (result.status !== "ok") throw new Error(`error de protocolo: ${result.error.error.message}`);
          return result.output;
        },
        records: () => trace.records,
      };
    },
  };
}
