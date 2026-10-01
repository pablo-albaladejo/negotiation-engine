import { readFileSync } from "node:fs";
import { z } from "zod";

/**
 * Issue negociable. `direction` se declara desde el rol comprador; para el vendedor se invierte
 * (ver `orientIssues` en issues.ts). Los límites son explícitos para normalizar la utilidad.
 */
export const IssueSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9_]*$/),
    min: z.number(),
    max: z.number(),
    direction: z.enum(["higher-better", "lower-better"]),
    weight: z.number().nonnegative(),
  })
  .strict()
  .refine((issue) => issue.min < issue.max, { message: "min debe ser menor que max", path: ["max"] });

export type Issue = z.infer<typeof IssueSchema>;

const IssuesSchema = z
  .array(IssueSchema)
  .min(1, "hace falta al menos un issue")
  .refine((issues) => new Set(issues.map((i) => i.name)).size === issues.length, {
    message: "nombres de issue repetidos",
  })
  .refine((issues) => issues.reduce((sum, i) => sum + i.weight, 0) > 0, {
    message: "la suma de pesos debe ser positiva",
  })
  .transform((issues) => {
    const total = issues.reduce((sum, i) => sum + i.weight, 0);
    return issues.map((i) => ({ ...i, weight: i.weight / total }));
  });

const ProvenanceSchema = z
  .object({
    source: z.string().min(1),
    parent: z.number().int().nonnegative().optional(),
    createdAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

/** Parámetros del motor. Los ajusta el bucle de self-play y se congelan en config/champion.json. */
export const AgentConfigSchema = z
  .object({
    version: z.number().int().nonnegative(),
    issues: IssuesSchema,
    /** Rondas que se suponen cuando el ring no da límite: t = min(1, ronda / defaultHorizon). */
    defaultHorizon: z.number().int().min(1),
    /** Peso de cada rol en la puerta de promoción; 1:1 hasta conocer la puntuación oficial. */
    roleWeights: z
      .object({ buyer: z.number().nonnegative(), seller: z.number().nonnegative() })
      .strict()
      .default({ buyer: 1, seller: 1 }),
    /** Exponente Boulware: <1 concede tarde, >1 concede pronto; 0 no concede hasta t = 1. */
    beta: z.number().nonnegative(),
    /** Fracción del rango de utilidad entre la reserva y 1 con la que abrimos (0..1). */
    openingMargin: z.number().min(0).max(1),
    /** Tolerancia en utilidad para AC_next y AC_time (0..1). */
    acceptMargin: z.number().min(0).max(1),
    /** Umbral de tiempo a partir del cual se aplica AC_time (0..1). */
    acTimeThreshold: z.number().min(0).max(1),
    /** Amplitud n del ruido sobre el paso de concesión: ε ∈ [−n, n], n < 1. */
    noise: z.number().min(0).lt(1),
    /** Peso de la reciprocidad Tit-for-Tat sobre el paso de concesión (0..1; 0 = Boulware puro). */
    reciprocity: z.number().min(0).max(1).optional(),
    /** Margen de seguridad restado al tiempo máximo del ring. */
    turnSafetyMarginMs: z.number().int().nonnegative().default(500),
    /** Presupuesto del turno cuando el ring no declara tiempo máximo. */
    turnBudgetMs: z.number().int().positive(),
    /** Efecto mínimo (puntos porcentuales de excedente) para promover una candidata. */
    minEffectPp: z.number().nonnegative().default(1),
    persona: z.string().min(1),
    provenance: ProvenanceSchema,
  })
  .strict();

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export class ConfigError extends Error {
  override name = "ConfigError";
}

export function parseConfig(raw: unknown, source = "config"): AgentConfig {
  const result = AgentConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigError(`Configuración inválida (${source}):\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function loadConfig(path = process.env.AGENT_CONFIG ?? "config/champion.json"): AgentConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ConfigError(`No se puede leer la configuración ${path}: ${(error as Error).message}`);
  }
  return parseConfig(raw, path);
}
