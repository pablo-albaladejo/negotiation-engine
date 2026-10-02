import { z } from "zod";

/**
 * Esquemas Zod de los ficheros de resultados (`results/`), en el lado del escritor; el visor los
 * importa por ruta relativa, así no se duplican. v1 (ya escrito antes de esta change) sigue siendo
 * válido: los campos nuevos son opcionales. `schemaVersion: 2` los añade al escribir.
 */

const Offer = z.record(z.string(), z.number());
/** v3 añade `protocol-violation`; el literal antiguo `protocol_violation` (escrito antes de unificar) se lee como el nuevo. */
const EndReasonSchema = z.preprocess(
  (value) => (value === "protocol_violation" ? "protocol-violation" : value),
  z.enum(["agreement", "agent-walk", "rival-walk", "limit", "rival-error", "agent-error", "protocol-violation"]),
);

const TranscriptEntrySchema = z
  .object({
    round: z.number().int().min(1),
    from: z.enum(["agent", "rival"]),
    action: z.enum(["accept", "counter", "walk"]),
    offer: Offer.optional(),
    text: z.string(),
    /** Solo en texto completo: si el texto del rival lleva la cifra en una forma que el parser determinista puede leer. */
    extractable: z.boolean().optional(),
  })
  .strict();

const GameMetricsSchema = z
  .object({
    gameId: z.string(),
    scenarioId: z.string(),
    rival: z.string(),
    role: z.enum(["buyer", "seller"]),
    seed: z.number().int(),
    endReason: EndReasonSchema,
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
    falseAccept: z.number().int().optional(),
    missedAccept: z.number().int().optional(),
    confirmRate: z.number().optional(),
    templateRate: z.number().optional(),
    language: z.string().optional(),
    /** v3: lado que rompió el protocolo, o null. */
    protocolViolation: z.enum(["agent", "rival"]).nullable().optional(),
  })
  .strict();

/**
 * Línea de `transcripts.jsonl`: v1 (sin `schemaVersion`) sigue siendo válida. v2 añade
 * `schemaVersion: 2`, `roundLimit` (o `null` sin límite declarado) y `reserves: { ours, rival }`
 * con las reservas por issue del escenario de arena; solo en modo arena, nunca en torneo.
 * v3 añade `schemaVersion: 3`, `endReason: "protocol-violation"`, `protocolViolation { by, detail }`
 * y `metrics.protocolViolation`; v1 y v2 siguen validando.
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
    endReason: EndReasonSchema,
    agreement: Offer.optional(),
    agreedBy: z.enum(["agent", "rival"]).optional(),
    wrongAgreement: z.boolean(),
    rounds: z.number().int().nonnegative(),
    transcript: z.array(TranscriptEntrySchema),
    agentLatencyMs: z.array(z.number()),
    error: z.string().optional(),
    metrics: GameMetricsSchema,
    schemaVersion: z.union([z.literal(2), z.literal(3)]).optional(),
    roundLimit: z.number().int().min(1).nullable().optional(),
    /** v3: quién rompió el protocolo y por qué (solo con `endReason: "protocol-violation"`). */
    protocolViolation: z.object({ by: z.enum(["agent", "rival"]), detail: z.string() }).strict().optional(),
    reserves: z.object({ ours: Offer, rival: Offer }).strict().optional(),
    /** Texto completo (`--text-mode full`): modo, idioma del rival y aciertos de la aceptación por texto. */
    textMode: z.enum(["agent-side", "full"]).optional(),
    language: z.string().optional(),
    falseAccept: z.number().int().min(0).optional(),
    missedAccept: z.number().int().min(0).optional(),
  })
  .strict();
export type TranscriptLine = z.infer<typeof TranscriptLineSchema>;

const ClusterSummarySchema = z.looseObject({ scenarioId: z.string(), rival: z.string() });
/** Resumen de `summarize` (`src/arena/metrics.ts`): los campos que lee el visor, el resto se conserva. */
const RoleSummarySchema = z.looseObject({
  games: z.number().int().nonnegative(),
  agreementRate: z.number(),
  meanSurplus: z.number().nullable(),
  violations: z.number().int().nonnegative(),
  leaks: z.number().int().nonnegative(),
  templateFallbacks: z.number().int().nonnegative(),
  rivalErrors: z.number().int().nonnegative(),
});
export type RoleSummary = z.infer<typeof RoleSummarySchema>;

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

const Phase = z.enum(["tuning", "revalidation", "heldOut"]);
const GameRefSchema = z.looseObject({ gameId: z.string(), count: z.number().int().nonnegative() });
const OverviewSchema = z.looseObject({ agreementRate: z.number(), meanSurplus: z.number().nullable() });

/** `PairedReport` (`src/arena/paired.ts`): los campos que lee el visor, el resto se conserva. Igual en v1 y v2. */
const PairedReportSchema = z.looseObject({
  meanDiffPp: z.number().nullable(),
  sign: z.looseObject({ positive: z.number().int(), negative: z.number().int(), ties: z.number().int(), pValue: z.number() }),
  bootstrap: z.looseObject({ lowPp: z.number(), highPp: z.number(), resamples: z.number().int() }).optional(),
  champion: OverviewSchema,
  candidate: OverviewSchema,
  violations: z.array(GameRefSchema),
  leaks: z.array(GameRefSchema),
  games: z.number().int().nonnegative(),
  seeds: z.array(z.number().int()),
  rivals: z.array(z.string()),
});
export type PairedReportFile = z.infer<typeof PairedReportSchema>;

/** `summarize` de un grupo de partidas (`src/arena/metrics.ts`), con los campos que muestra P6. */
const PhaseSummarySchema = RoleSummarySchema.extend({
  meanRoundsToAgreement: z.number().nullable(),
  emptyZopaCorrect: z.number().nullable(),
});
const RivalRoleSummarySchema = PhaseSummarySchema.extend({ rival: z.string(), role: z.enum(["buyer", "seller"]) });
export type PhaseSummary = z.infer<typeof PhaseSummarySchema>;
export type RivalRoleSummary = z.infer<typeof RivalRoleSummarySchema>;

/**
 * `gate.json`: v1 (sin `schemaVersion`) sigue siendo válido. v2 añade `schemaVersion: 2`, `configs`
 * (campeona y candidata completas tal como se compararon), `summaries` por fase (`summarize` de cada
 * configuración y de la candidata por rival × rol), `dryRun`, `promoted` y, si se promovió,
 * `promotedVersion` (la versión escrita en `config/champion.json`).
 */
export const GateFileSchema = z
  .object({
    candidate: z.string(),
    champion: z.number().int().nonnegative(),
    criterion: z.enum(["sign", "bootstrap"]),
    gate: z.object({ pass: z.boolean(), checks: z.array(GateCheckSchema), failed: z.array(GateCheckSchema) }).strict(),
    reports: z.partialRecord(Phase, PairedReportSchema),
    schemaVersion: z.literal(2).optional(),
    configs: z.object({ champion: z.looseObject({ version: z.number().int() }), candidate: z.looseObject({ version: z.number().int() }) }).strict().optional(),
    summaries: z
      .partialRecord(Phase, z.object({ champion: PhaseSummarySchema, candidate: PhaseSummarySchema, candidateByRivalRole: z.array(RivalRoleSummarySchema) }).strict())
      .optional(),
    dryRun: z.boolean().optional(),
    promoted: z.boolean().optional(),
    promotedVersion: z.number().int().optional(),
  })
  .strict();
export type GateFile = z.infer<typeof GateFileSchema>;
