import { z } from "zod";
import type { Offer } from "../engine/issues.js";

/**
 * Contrato canónico entre los adaptadores del ring y el cerebro del agente.
 * Una oferta es un valor por cada issue declarado en la configuración (solo precio: un issue).
 */
export type { Offer };

export const RivalActionSchema = z.enum(["offer", "accept", "walk", "message"]);
export type RivalAction = z.infer<typeof RivalActionSchema>;

export const OurActionSchema = z.enum(["accept", "counter", "walk"]);
export type OurAction = z.infer<typeof OurActionSchema>;

/** Oferta cerrada: exactamente los issues declarados, valores finitos. */
export function offerSchema(issueNames: readonly string[]): z.ZodType<Offer> {
  const shape = Object.fromEntries(issueNames.map((name) => [name, z.number()]));
  return z.object(shape).strict() as unknown as z.ZodType<Offer>;
}

function buildSchemas(offer: z.ZodType<Offer>) {
  const turnInput = z
    .object({
      sessionId: z.string().min(1).max(200),
      /** Ronda según el ring, empezando en 1. */
      round: z.number().int().min(1),
      /** Límite de rondas, solo si el ring lo da. */
      roundLimit: z.number().int().min(1).optional(),
      /** Plazo absoluto, solo si el ring lo da. */
      deadline: z.iso.datetime({ offset: true }).optional(),
      /** Tiempo máximo de respuesta declarado por el ring. */
      timeoutMs: z.number().int().positive().optional(),
      /**
       * El ring admite respuesta del rival tras nuestro movimiento (también el último). Ausente: se
       * supone que no, y el último movimiento sin oferta aceptable termina en `walk`.
       */
      rivalCanRespond: z.boolean().optional(),
      rivalAction: RivalActionSchema,
      /** Oferta estructurada del rival; ausente en un ring de solo texto. */
      rivalOffer: offer.optional(),
      /** Texto libre del rival: dato opaco que solo lee el parser. */
      text: z.string().max(20_000).optional(),
    })
    .strict();

  const common = {
    sessionId: z.string().min(1).max(200),
    round: z.number().int().min(1),
    text: z.string().min(1).max(5_000),
  };
  const turnOutput = z.discriminatedUnion("action", [
    z.object({ ...common, action: z.literal("counter"), offer }).strict(),
    z.object({ ...common, action: z.literal("accept"), offer }).strict(),
    z.object({ ...common, action: z.literal("walk") }).strict(),
  ]);
  return { offer, turnInput, turnOutput };
}

const generic = buildSchemas(z.record(z.string(), z.number()));
export type TurnInput = z.infer<typeof generic.turnInput>;
export type TurnOutput = z.infer<typeof generic.turnOutput>;
/** Esquema con oferta genérica: para validar la forma antes de conocer los issues de la sesión. */
export const GenericTurnInputSchema = generic.turnInput;

export interface ProtocolSchemas {
  issueNames: readonly string[];
  offer: z.ZodType<Offer>;
  turnInput: z.ZodType<TurnInput>;
  turnOutput: z.ZodType<TurnOutput>;
}

export function createProtocolSchemas(issueNames: readonly string[]): ProtocolSchemas {
  const schemas = buildSchemas(offerSchema(issueNames));
  return {
    issueNames,
    offer: schemas.offer,
    turnInput: schemas.turnInput as unknown as z.ZodType<TurnInput>,
    turnOutput: schemas.turnOutput as unknown as z.ZodType<TurnOutput>,
  };
}

/** Error de protocolo estructurado: se devuelve sin invocar al cerebro. */
export interface ProtocolErrorBody {
  error: { code: "protocol_error"; message: string; fields?: string[] };
}

export class ProtocolError extends Error {
  override name = "ProtocolError";
  constructor(
    message: string,
    readonly fields: string[] = [],
  ) {
    super(message);
  }

  static fromZod(error: z.ZodError, what: string): ProtocolError {
    const fields = error.issues.map((i) => i.path.join(".") || "(raíz)");
    return new ProtocolError(`${what} inválido: ${fields.join(", ")}`, fields);
  }

  toBody(): ProtocolErrorBody {
    return { error: { code: "protocol_error", message: this.message, fields: this.fields } };
  }
}
