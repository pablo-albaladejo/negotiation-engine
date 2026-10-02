import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { AprBandSchema } from "../engine/apr.js";
import type { TraceRecord, TraceSink } from "./box.js";

const OfferRecord = z.record(z.string(), z.number());

/** Registro de una caja en un turno. */
export const TraceRecordSchema = z
  .object({
    kind: z.literal("box"),
    sessionId: z.string().min(1),
    round: z.number().int().min(1),
    box: z.string().min(1),
    input: z.unknown(),
    output: z.unknown(),
    result: z.enum(["ok", "retry", "fallback", "error"]),
    latencyMs: z.number().nonnegative(),
    seed: z.number().int().optional(),
    configVersion: z.number().int().nonnegative().optional(),
    /** Huella de la configuración de ejecución efectiva (`src/pipeline/runtime-config.ts`). */
    runtimeConfig: z.string().regex(/^[0-9a-f]{12}$/).optional(),
    provider: z.string().optional(),
    error: z.string().optional(),
  })
  .strict();

const headerCommon = {
  kind: z.literal("header"),
  sessionId: z.string().min(1),
  configVersion: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  /** v1 no lo lleva (undefined); v2 añade campos aditivos (role en torneo, nunca mandato); v3, `mandate.apr` en arena. */
  traceVersion: z.union([z.literal(2), z.literal(3)]).optional(),
};

/**
 * Cabecera de sesión: el mandato solo en modo arena; en modo torneo solo una referencia al
 * escenario (id + hash), y el esquema estricto rechaza cualquier campo de mandato.
 */
export const TraceHeaderSchema = z.discriminatedUnion("mode", [
  z
    .object({
      ...headerCommon,
      mode: z.literal("arena"),
      runId: z.string().min(1),
      scenarioId: z.string().min(1),
      rival: z.string().min(1),
      seed: z.number().int(),
      /** v3: banda `apr` opcional (solo arena; el torneo nunca lleva mandato). */
      mandate: z.object({ role: z.enum(["buyer", "seller"]), reservation: OfferRecord, apr: AprBandSchema.optional() }).strict(),
    })
    .strict(),
  z
    .object({
      ...headerCommon,
      mode: z.literal("tournament"),
      scenario: z.object({ id: z.string().min(1), hash: z.string().regex(/^[0-9a-f]{16}$/) }).strict(),
      /** v2: rol en el ring (buyer | seller); nunca mandato ni reserva. */
      role: z.enum(["buyer", "seller"]).optional(),
    })
    .strict(),
]);

export type TraceHeader = z.infer<typeof TraceHeaderSchema>;
export type TraceLine = TraceHeader | z.infer<typeof TraceRecordSchema>;
export const TraceLineSchema = z.union([TraceHeaderSchema, TraceRecordSchema]);

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

/** Una partida terminada: cabecera y registros en `file` (una línea JSON por registro). */
export function writeJsonlTrace(file: string, header: TraceHeader, records: readonly TraceRecord[]): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, line(header) + records.map((r) => line({ kind: "box", ...r })).join(""));
}

/** Nombre de fichero seguro y único para un `sessionId` arbitrario del ring. */
export function sessionFileName(sessionId: string): string {
  const safe = sessionId.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 60);
  const hash = createHash("sha256").update(sessionId).digest("hex").slice(0, 8);
  return `${safe}-${hash}.jsonl`;
}

/**
 * Traza en ficheros por sesión (modo torneo): la cabecera se escribe con el primer registro de la
 * sesión. Nunca lanza: un fallo de disco no puede tumbar un turno.
 */
export class JsonlSessionTrace implements TraceSink {
  readonly #dir: string;
  readonly #header: (record: TraceRecord) => TraceHeader;
  readonly #started = new Set<string>();
  failures = 0;

  constructor(dir: string, header: (record: TraceRecord) => TraceHeader) {
    this.#dir = dir;
    this.#header = header;
  }

  fileFor(sessionId: string): string {
    return join(this.#dir, sessionFileName(sessionId));
  }

  write(record: TraceRecord): void {
    try {
      const file = this.fileFor(record.sessionId);
      if (!this.#started.has(record.sessionId)) {
        mkdirSync(this.#dir, { recursive: true });
        appendFileSync(file, line(this.#header(record)));
        this.#started.add(record.sessionId);
      }
      appendFileSync(file, line({ kind: "box", ...record }));
    } catch {
      this.failures++;
    }
  }
}
