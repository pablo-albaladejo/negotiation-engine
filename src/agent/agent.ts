import { readFileSync, statSync } from "node:fs";
import { z } from "zod";
import { ConfigError, loadConfig, type AgentConfig } from "../engine/config.js";
import type { OfferMandate } from "../engine/issues.js";
import { currentProvider, type LlmProvider } from "../llm/provider.js";
import type { Logger, TraceSink } from "../pipeline/box.js";
import { createPipeline, type Brain } from "../pipeline/pipeline.js";
import { SessionStore } from "../pipeline/session.js";
import { createHttpApp } from "../protocol/http.js";

/** Logger JSON por stderr. Los eventos nunca llevan el mandato ni la reserva. */
export const stderrLogger: Logger = {
  info: (event, data) => console.error(JSON.stringify({ level: "info", event, ...data })),
  warn: (event, data) => console.error(JSON.stringify({ level: "warn", event, ...data })),
  error: (event, data) => console.error(JSON.stringify({ level: "error", event, ...data })),
};

/**
 * Campeona con recarga: se relee al abrir cada sesión si cambió su mtime; nunca a mitad de sesión.
 * Una campeona inválida al arrancar impide el arranque; una recarga inválida conserva la anterior.
 */
export function createChampionProvider(path: string, logger: Logger): { current: () => AgentConfig; initial: AgentConfig } {
  let config = loadConfig(path);
  let mtimeMs = statSync(path).mtimeMs;
  const initial = config;
  return {
    initial,
    current() {
      try {
        const stat = statSync(path);
        if (stat.mtimeMs !== mtimeMs) {
          mtimeMs = stat.mtimeMs;
          config = loadConfig(path);
          logger.info("config_reloaded", { version: config.version });
        }
      } catch (error) {
        logger.error("config_reload_failed", { error: (error as Error).message.split("\n")[0] });
      }
      return config;
    },
  };
}

const ScenarioSchema = z
  .object({
    description: z.string().optional(),
    role: z.enum(["buyer", "seller"]),
    reservation: z.record(z.string(), z.number()),
  })
  .strict();

/** Mandato de la sesión desde el fichero de escenario (sparring); en el torneo lo fijará el ring o la sesión. */
export function loadScenario(path: string, config: AgentConfig): OfferMandate {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ConfigError(`No se puede leer el escenario ${path}: ${(error as Error).message}`);
  }
  const parsed = ScenarioSchema.safeParse(raw);
  if (!parsed.success) throw new ConfigError(`Escenario inválido (${path}):\n${z.prettifyError(parsed.error)}`);
  const names = config.issues.map((i) => i.name);
  const keys = Object.keys(parsed.data.reservation);
  if (keys.length !== names.length || !names.every((n) => keys.includes(n))) {
    throw new ConfigError(`Escenario inválido (${path}): reservation debe tener exactamente los issues ${names.join(", ")}`);
  }
  return { role: parsed.data.role, reservation: parsed.data.reservation };
}

export interface AgentOptions {
  configPath: string;
  scenarioPath: string;
  provider?: LlmProvider;
  logger?: Logger;
  trace?: TraceSink;
}

export interface Agent {
  brain: Brain;
  app: ReturnType<typeof createHttpApp>;
  store: SessionStore;
  config: () => AgentConfig;
  issueNames: () => readonly string[];
}

/** Adaptador HTTP + pipeline + campeona con recarga al abrir sesión. */
export function createAgent(options: AgentOptions): Agent {
  const logger = options.logger ?? stderrLogger;
  const provider = options.provider ?? currentProvider();
  const champion = createChampionProvider(options.configPath, logger);
  const mandate = loadScenario(options.scenarioPath, champion.initial);
  if (provider !== "none") {
    logger.warn("provider_not_implemented", { provider, using: "none" });
  }
  const store = new SessionStore({ mandateFor: () => mandate, configFor: champion.current });
  const deps: Parameters<typeof createPipeline>[0] = { store, logger, provider };
  if (options.trace) deps.trace = options.trace;
  const brain = createPipeline(deps);
  const issueNames = () => champion.current().issues.map((i) => i.name);
  const app = createHttpApp(brain, {
    issueNames,
    logger,
    health: () => ({ configVersion: champion.current().version, llmProvider: provider }),
  });
  return { brain, app, store, config: champion.current, issueNames };
}
