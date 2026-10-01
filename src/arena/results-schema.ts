import { z } from "zod";

/**
 * Esquemas Zod de los ficheros de resultados (`results/`), en el lado del escritor; el visor los
 * importa por ruta relativa, así no se duplican. v1 (ya escrito antes de esta change) sigue siendo
 * válido: los campos nuevos son opcionales. `schemaVersion: 2` los añade al escribir.
 */

const Offer = z.record(z.string(), z.number());

const TranscriptEntrySchema = z
  .object({
    round: z.number().int().min(1),
    from: z.enum(["agent", "rival"]),
    action: z.enum(["accept", "counter", "walk"]),
    offer: Offer.optional(),
    text: z.string(),
  })
  .strict();

const GameMetricsSchema = z
  .object({
    gameId: z.string(),
    scenarioId: z.string(),
    rival: z.string(),
    role: z.enum(["buyer", "seller"]),
    seed: z.number().int(),
    endReason: z.enum(["agreement", "agent-walk", "rival-walk", "limit", "rival-error", "agent-error"]),
    agreement: z.boolean(),
    zopaEmpty: z.boolean(),
    surplusShare: z.number().nullable(),
    violations: z.number().int().nonnegative(),
    correct: z.boolean(),
    rivalError: z.boolean(),
    rounds: z.number().int().nonnegative(),
    leaks: z.number().int().nonnegative(),
    templateFallbacks: z.number().int().nonnegative(),
    latencyMeanMs: z.number(),
    latencyMaxMs: z.number(),
    misExtracted: z.number().int().nonnegative(),
    unextracted: z.number().int().nonnegative(),
    wrongAgreement: z.boolean(),
  })
  .strict();

/**
 * Línea de `transcripts.jsonl`: v1 (sin `schemaVersion`) sigue siendo válida. v2 añade
 * `schemaVersion: 2`, `roundLimit` (o `null` sin límite declarado) y `reserves: { ours, rival }`
 * con las reservas por issue del escenario de arena; solo en modo arena, nunca en torneo.
 */
export const TranscriptLineSchema = z
  .object({
    gameId: z.string(),
    scenarioId: z.string(),
    rival: z.string(),
    agent: z.string(),
    role: z.enum(["buyer", "seller"]),
    mode: z.enum(["structured", "text-only"]),
    seed: z.number().int(),
    endReason: z.enum(["agreement", "agent-walk", "rival-walk", "limit", "rival-error", "agent-error"]),
    agreement: Offer.optional(),
    agreedBy: z.enum(["agent", "rival"]).optional(),
    wrongAgreement: z.boolean(),
    rounds: z.number().int().nonnegative(),
    transcript: z.array(TranscriptEntrySchema),
    agentLatencyMs: z.array(z.number()),
    error: z.string().optional(),
    metrics: GameMetricsSchema,
    schemaVersion: z.literal(2).optional(),
    roundLimit: z.number().int().min(1).nullable().optional(),
    reserves: z.object({ ours: Offer, rival: Offer }).strict().optional(),
  })
  .strict();
export type TranscriptLine = z.infer<typeof TranscriptLineSchema>;

const ClusterSummarySchema = z.looseObject({ scenarioId: z.string(), rival: z.string() });
const RoleSummarySchema = z.looseObject({});

/**
 * `summary.json`: v1 sigue siendo válido. v2 añade `schemaVersion: 2` y `config.params` (los
 * parámetros del motor con los que se jugó, `src/engine/engine.ts#EngineParamsSchema`).
 */
export const SummarySchema = z
  .object({
    runId: z.string(),
    createdAt: z.iso.datetime(),
    llmProvider: z.string(),
    network: z.boolean(),
    agent: z.string(),
    config: z
      .object({
        path: z.string(),
        version: z.number().int().nonnegative(),
        provenance: z.looseObject({}),
        params: z
          .object({
            beta: z.number(),
            openingMargin: z.number(),
            acceptMargin: z.number(),
            acTimeThreshold: z.number(),
            noise: z.number(),
            defaultHorizon: z.number().int(),
            persona: z.string(),
            reciprocity: z.number().optional(),
            acCombiThreshold: z.number().optional(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    seeds: z.object({ start: z.number().int(), count: z.number().int() }).strict(),
    scenarios: z.array(z.string()),
    rivals: z.array(z.looseObject({ name: z.string() })),
    durationMs: z.number().nonnegative(),
    overall: RoleSummarySchema,
    byRole: z.object({ buyer: RoleSummarySchema, seller: RoleSummarySchema }).strict(),
    clusters: z.array(ClusterSummarySchema),
    schemaVersion: z.literal(2).optional(),
    candidate: z.looseObject({}).optional(),
    paired: z.unknown().optional(),
    comparison: z.looseObject({}).optional(),
  })
  .strict();
export type Summary = z.infer<typeof SummarySchema>;

const GateCheckSchema = z
  .object({
    phase: z.enum(["tuning", "revalidation", "heldOut"]),
    check: z.enum(["present", "effect", "significance", "fresh-seeds", "violations", "leaks", "non-negative"]),
    pass: z.boolean(),
    detail: z.string(),
  })
  .strict();

const PairedReportSchema = z.looseObject({});

/**
 * `gate.json`: v1 sigue siendo válido. v2 añade `configs` (campeona y candidata completas),
 * `summaries` por fase (con `candidateByRivalRole`), `dryRun` y `promoted`.
 */
export const GateFileSchema = z
  .object({
    candidate: z.string(),
    champion: z.number().int().nonnegative(),
    criterion: z.enum(["sign", "bootstrap"]),
    gate: z.object({ pass: z.boolean(), checks: z.array(GateCheckSchema), failed: z.array(GateCheckSchema) }).strict(),
    reports: z.record(z.enum(["tuning", "revalidation", "heldOut"]), PairedReportSchema),
    configs: z.object({ champion: z.looseObject({}), candidate: z.looseObject({}) }).strict().optional(),
    summaries: z
      .record(
        z.enum(["tuning", "revalidation", "heldOut"]),
        z.object({ champion: z.looseObject({}), candidate: z.looseObject({}), candidateByRivalRole: z.array(z.looseObject({})) }).strict(),
      )
      .optional(),
    dryRun: z.boolean().optional(),
    promoted: z.boolean().optional(),
  })
  .strict();
export type GateFile = z.infer<typeof GateFileSchema>;
