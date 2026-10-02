import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import { isLanguageTag } from "../llm/language.js";

/**
 * Configuración de ejecución (`config/runtime.json`, ruta cambiable con `RUNTIME_CONFIG`): las
 * decisiones que dependen del protocolo del ring. Separada de `AgentConfig` (motor, campeona).
 * Esquema cerrado: nunca lleva mandato, reserva ni claves de API.
 */

export const RING_MODES = ["hybrid", "text-only", "structured"] as const;
export const PARSER_POLICIES = ["llm-primary-verified", "dual-strict", "deterministic-only"] as const;
export const ACCEPTANCE_SIGNALS = ["parser-intent-verified", "ring-action"] as const;
export const WALK_SIGNALS = ["trace-only", "parser-intent-verified", "ring-action"] as const;
export const PROVIDERS = ["none", "claude-cli", "anthropic-api"] as const;

export type RingMode = (typeof RING_MODES)[number];
export type ParserPolicy = (typeof PARSER_POLICIES)[number];
export type AcceptanceSignal = (typeof ACCEPTANCE_SIGNALS)[number];
export type WalkSignal = (typeof WALK_SIGNALS)[number];
export type ProviderName = (typeof PROVIDERS)[number];

const LanguageTag = z.string().min(1).max(35).refine(isLanguageTag, { message: "etiqueta BCP-47 inválida" });

const LlmBoxSchema = z
  .object({
    provider: z.enum(PROVIDERS).optional(),
    model: z.string().min(1).max(100).optional(),
    timeoutMs: z.number().int().positive().max(60_000).optional(),
    attempts: z.number().int().min(1).max(3).optional(),
  })
  .strict();

export const RuntimeConfigSchema = z
  .object({
    ring: z.object({ mode: z.enum(RING_MODES).optional(), timeoutMs: z.number().int().positive().optional() }).strict().optional(),
    parser: z
      .object({
        policy: z.enum(PARSER_POLICIES).optional(),
        acceptWordNumbers: z.enum(["confirm", "llm-only"]).optional(),
        onLlmFailure: z.enum(["deterministic", "confirm"]).optional(),
        ranges: z.enum(["conservative", "confirm"]).optional(),
        units: z.object({ bps: z.record(LanguageTag, z.array(z.string().trim().min(1).max(40)).max(20)).optional() }).strict().optional(),
      })
      .strict()
      .optional(),
    acceptance: z.object({ signal: z.enum(ACCEPTANCE_SIGNALS).optional(), walkSignal: z.enum(WALK_SIGNALS).optional() }).strict().optional(),
    narrator: z.object({ language: z.union([z.literal("auto"), LanguageTag]).optional() }).strict().optional(),
    template: z
      .object({
        languages: z.array(LanguageTag).min(1).max(20).optional(),
        fallbackLanguage: LanguageTag.optional(),
        uncovered: z.enum(["neutral", "fallback-language"]).optional(),
      })
      .strict()
      .optional(),
    validator: z.object({ coherence: z.enum(["known-languages", "strict"]).optional() }).strict().optional(),
    llm: z
      .object({
        parser: LlmBoxSchema.optional(),
        narrator: LlmBoxSchema.extend({ minRemainingMs: z.number().int().min(0).max(60_000).optional() }).strict().optional(),
      })
      .strict()
      .optional(),
    turn: z.object({ budgetRatio: z.number().gt(0).max(1).optional() }).strict().optional(),
    // `brief-text` aplazado por decisión del usuario hasta conocer el ring (tarea 10.1).
    mandate: z.object({ source: z.literal("scenario-file").optional() }).strict().optional(),
  })
  .strict();

export type RuntimeConfigFile = z.infer<typeof RuntimeConfigSchema>;

export interface LlmBoxConfig {
  provider: ProviderName;
  model?: string;
  timeoutMs: number;
  attempts: number;
}

/** Configuración efectiva: todas las claves resueltas con los valores por defecto de su modo. */
export interface RuntimeConfig {
  ring: { mode: RingMode; timeoutMs?: number };
  parser: {
    policy: ParserPolicy;
    acceptWordNumbers: "confirm" | "llm-only";
    onLlmFailure: "deterministic" | "confirm";
    /** Rango del rival: `conservative` (extremo peor para nosotros, nunca se acepta) o `confirm` (sin oferta). */
    ranges: "conservative" | "confirm";
    /** Palabras de unidad de puntos básicos por idioma, además de las integradas. */
    units: { bps: Record<string, string[]> };
  };
  acceptance: { signal: AcceptanceSignal; walkSignal: WalkSignal };
  narrator: { language: string };
  template: { languages: string[]; fallbackLanguage: string; uncovered: "neutral" | "fallback-language" };
  validator: { coherence: "known-languages" | "strict" };
  llm: {
    parser: LlmBoxConfig;
    narrator: LlmBoxConfig & {
      /** Con menos tiempo restante no se llama al narrador: plantilla y registro `narrator-skipped`. */
      minRemainingMs: number;
    };
  };
  turn: {
    /** Presupuesto del turno = min(tiempo del ring × budgetRatio, tiempo del ring − margen). */
    budgetRatio: number;
  };
  mandate: { source: "scenario-file" };
  /** Huella de la configuración efectiva (sha256 truncado), para la traza. */
  fingerprint: string;
}

/** Valores por defecto que dependen del modo; `hybrid` usa los de texto (la acción del ring prevalece por turno). */
const MODE_DEFAULTS: Record<RingMode, { policy: ParserPolicy; signal: AcceptanceSignal; walkSignal: WalkSignal; attempts: number }> = {
  hybrid: { policy: "llm-primary-verified", signal: "parser-intent-verified", walkSignal: "trace-only", attempts: 1 },
  "text-only": { policy: "llm-primary-verified", signal: "parser-intent-verified", walkSignal: "trace-only", attempts: 1 },
  structured: { policy: "dual-strict", signal: "ring-action", walkSignal: "ring-action", attempts: 2 },
};

export class RuntimeConfigError extends Error {
  override name = "RuntimeConfigError";
}

function allowedValues(issue: z.core.$ZodIssue): string {
  const values = (issue as { values?: unknown[] }).values;
  return Array.isArray(values) && values.length > 0 ? `; admitidos: ${values.map(String).join(" | ")}` : "";
}

function formatError(error: z.ZodError, source: string): RuntimeConfigError {
  const lines = error.issues.map((issue) => {
    const key = issue.path.map(String).join(".") || "(raíz)";
    if (issue.code === "unrecognized_keys") return `${[key === "(raíz)" ? "" : key, ...issue.keys].filter(Boolean).join(".")}: clave no admitida`;
    return `${key}: ${issue.message}${allowedValues(issue)}`;
  });
  return new RuntimeConfigError(`configuración de ejecución inválida (${source}): ${lines.join("; ")}`);
}

function fingerprintOf(config: Omit<RuntimeConfig, "fingerprint">): string {
  return createHash("sha256").update(JSON.stringify(config)).digest("hex").slice(0, 12);
}

function providerFromEnv(env: NodeJS.ProcessEnv): ProviderName {
  const raw = env.LLM_PROVIDER ?? "none";
  return (PROVIDERS as readonly string[]).includes(raw) ? (raw as ProviderName) : "none";
}

/** Valida el contenido del fichero y resuelve los valores por defecto de su modo. */
export function resolveRuntimeConfig(raw: unknown = {}, env: NodeJS.ProcessEnv = {}, source = "runtime"): RuntimeConfig {
  const parsed = RuntimeConfigSchema.safeParse(raw);
  if (!parsed.success) throw formatError(parsed.error, source);
  const file = parsed.data;
  const mode = file.ring?.mode ?? "hybrid";
  const defaults = MODE_DEFAULTS[mode];
  const provider = providerFromEnv(env);
  const model = env.ANTHROPIC_MODEL;
  const box = (given: z.infer<typeof LlmBoxSchema> | undefined, timeoutMs: number): LlmBoxConfig => {
    const resolved: LlmBoxConfig = {
      provider: given?.provider ?? provider,
      timeoutMs: given?.timeoutMs ?? timeoutMs,
      attempts: given?.attempts ?? defaults.attempts,
    };
    const m = given?.model ?? model;
    if (m) resolved.model = m;
    return resolved;
  };
  const languages = file.template?.languages ?? ["en", "es"];
  const fallbackLanguage = file.template?.fallbackLanguage ?? "en";
  if (!languages.includes(fallbackLanguage)) {
    throw new RuntimeConfigError(`configuración de ejecución inválida (${source}): template.fallbackLanguage: debe ser uno de template.languages (${languages.join(" | ")})`);
  }
  const ring: RuntimeConfig["ring"] = { mode };
  if (file.ring?.timeoutMs !== undefined) ring.timeoutMs = file.ring.timeoutMs;
  const config: Omit<RuntimeConfig, "fingerprint"> = {
    ring,
    parser: {
      policy: file.parser?.policy ?? defaults.policy,
      acceptWordNumbers: file.parser?.acceptWordNumbers ?? "confirm",
      onLlmFailure: file.parser?.onLlmFailure ?? "deterministic",
      ranges: file.parser?.ranges ?? "conservative",
      units: { bps: file.parser?.units?.bps ?? {} },
    },
    acceptance: { signal: file.acceptance?.signal ?? defaults.signal, walkSignal: file.acceptance?.walkSignal ?? defaults.walkSignal },
    narrator: { language: file.narrator?.language ?? "auto" },
    template: { languages, fallbackLanguage, uncovered: file.template?.uncovered ?? "neutral" },
    validator: { coherence: file.validator?.coherence ?? "known-languages" },
    llm: {
      parser: box(file.llm?.parser, 1_800),
      narrator: { ...box(file.llm?.narrator, 1_500), minRemainingMs: file.llm?.narrator?.minRemainingMs ?? 900 },
    },
    turn: { budgetRatio: file.turn?.budgetRatio ?? 0.9 },
    mandate: { source: "scenario-file" },
  };
  return { ...config, fingerprint: fingerprintOf(config) };
}

/** Sobrescrituras de línea de comandos (arena, eval) sobre el contenido del fichero. */
export interface RuntimeOverrides {
  ringMode?: string;
  parserPolicy?: string;
  acceptanceSignal?: string;
  narratorLanguage?: string;
  parserProvider?: string;
  narratorProvider?: string;
}

export function applyOverrides(raw: unknown, overrides: RuntimeOverrides): unknown {
  const base = (raw && typeof raw === "object" ? structuredClone(raw) : {}) as Record<string, Record<string, unknown>>;
  const set = (section: string, key: string, value: string | undefined) => {
    if (value === undefined) return;
    base[section] = { ...(base[section] ?? {}), [key]: value };
  };
  set("ring", "mode", overrides.ringMode);
  set("parser", "policy", overrides.parserPolicy);
  set("acceptance", "signal", overrides.acceptanceSignal);
  set("narrator", "language", overrides.narratorLanguage);
  if (overrides.parserProvider !== undefined || overrides.narratorProvider !== undefined) {
    const llm = (base.llm ?? {}) as Record<string, Record<string, unknown>>;
    if (overrides.parserProvider !== undefined) llm.parser = { ...(llm.parser ?? {}), provider: overrides.parserProvider };
    if (overrides.narratorProvider !== undefined) llm.narrator = { ...(llm.narrator ?? {}), provider: overrides.narratorProvider };
    base.llm = llm;
  }
  return base;
}

export const DEFAULT_RUNTIME_PATH = "config/runtime.json";

/**
 * Carga `config/runtime.json` (o `RUNTIME_CONFIG`). Sin fichero en la ruta por defecto, valores
 * por defecto de `hybrid`; una ruta explícita que no existe o un valor inválido impiden arrancar.
 */
export function loadRuntimeConfig(options: { path?: string; env?: NodeJS.ProcessEnv; overrides?: RuntimeOverrides } = {}): RuntimeConfig {
  const env = options.env ?? process.env;
  const explicit = options.path ?? env.RUNTIME_CONFIG;
  const path = explicit ?? DEFAULT_RUNTIME_PATH;
  let raw: unknown = {};
  if (existsSync(path)) {
    try {
      raw = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      throw new RuntimeConfigError(`configuración de ejecución ilegible (${path}): ${(error as Error).message}`);
    }
  } else if (explicit) {
    throw new RuntimeConfigError(`configuración de ejecución no encontrada: ${path}`);
  }
  return resolveRuntimeConfig(options.overrides ? applyOverrides(raw, options.overrides) : raw, env, path);
}

/** Valores por defecto (`hybrid`, sin proveedor): lo que usa el pipeline si no se le inyecta otra. */
export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = resolveRuntimeConfig({});
