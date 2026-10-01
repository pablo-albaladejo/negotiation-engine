import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { scenarioHash } from "../arena/scenario.js";
import { z } from "zod";
import { ConfigError, loadConfig, type AgentConfig } from "../engine/config.js";
import type { OfferMandate } from "../engine/issues.js";
import { createLlmNarrator } from "../llm/llm-narrator.js";
import { createLlmParser } from "../llm/llm-parser.js";
import { createProviderClient, currentProvider, type LlmClient, type LlmProvider } from "../llm/provider.js";
import type { Logger, TraceSink } from "../pipeline/box.js";
import { createPipeline, type Brain } from "../pipeline/pipeline.js";
import { SessionStore } from "../pipeline/session.js";
import { createPinoLogger, levelFromEnv } from "../pipeline/log.js";
import { JsonlSessionTrace } from "../pipeline/trace.js";
import { createHttpApp } from "../protocol/http.js";

/** Logger JSON (pino) por stderr con `redact` del mandato; nivel por `LOG_LEVEL`. */
export const stderrLogger: Logger = createPinoLogger({ level: levelFromEnv() });

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

/**
 * Traza JSONL por sesión en modo torneo: la cabecera solo lleva la referencia al escenario
 * (nombre del fichero + hash de su contenido), nunca el mandato.
 */
export function createTournamentTrace(dir: string, scenarioPath: string): JsonlSessionTrace {
  const scenario = { id: basename(scenarioPath), hash: scenarioHash(readFileSync(scenarioPath, "utf8")) };
  return new JsonlSessionTrace(dir, (record) => ({
    kind: "header",
    mode: "tournament",
    sessionId: record.sessionId,
    configVersion: record.configVersion ?? 0,
    createdAt: new Date().toISOString(),
    scenario,
  }));
}

export interface AgentOptions {
  configPath: string;
  scenarioPath: string;
  provider?: LlmProvider;
  /** Cliente LLM inyectado (tests); por defecto el de `provider`. */
  llmClient?: LlmClient;
  logger?: Logger;
  trace?: TraceSink;
  auth?: { header: string; value: string };
}

/**
 * Autenticación de `POST /turn` desde el entorno: `AGENT_AUTH_TOKEN` exige `Authorization: Bearer <token>`;
 * con `AGENT_AUTH_HEADER` se exige esa cabecera con el token tal cual. Sin token, sin autenticación.
 */
export function authFromEnv(env: NodeJS.ProcessEnv = process.env): { header: string; value: string } | undefined {
  const token = env.AGENT_AUTH_TOKEN;
  if (!token) return undefined;
  const header = env.AGENT_AUTH_HEADER?.toLowerCase();
  return header ? { header, value: token } : { header: "authorization", value: `Bearer ${token}` };
}

/**
 * Modo servidor: sin `AGENT_AUTH_TOKEN` cualquiera que alcance el endpoint podría escribir ronda,
 * plazo u ofertas en una sesión real y crear sesiones sin límite. Por eso el agente se niega a
 * arrancar sin token salvo que `AGENT_ALLOW_NOAUTH=1` lo permita explícitamente (solo en local).
 */
export function serverAuthFromEnv(env: NodeJS.ProcessEnv = process.env): { header: string; value: string } | undefined {
  const auth = authFromEnv(env);
  if (auth || env.AGENT_ALLOW_NOAUTH === "1") return auth;
  throw new ConfigError("Modo servidor sin AGENT_AUTH_TOKEN: define el token o AGENT_ALLOW_NOAUTH=1 (solo para pruebas en local)");
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
  const store = new SessionStore({ mandateFor: () => mandate, configFor: champion.current });
  const deps: Parameters<typeof createPipeline>[0] = { store, logger, provider };
  // Con un proveedor LLM: parser en cuarentena (doble lectura con el determinista) y narrador.
  const client = options.llmClient ?? createProviderClient(provider);
  if (client) {
    deps.parser = createLlmParser(client);
    deps.narrator = createLlmNarrator(client);
  }
  if (options.trace) deps.trace = options.trace;
  const brain = createPipeline(deps);
  const issueNames = () => champion.current().issues.map((i) => i.name);
  const app = createHttpApp(brain, {
    issueNames,
    logger,
    health: () => ({ configVersion: champion.current().version, llmProvider: provider }),
    ...(options.auth ? { auth: options.auth } : {}),
  });
  return { brain, app, store, config: champion.current, issueNames };
}
