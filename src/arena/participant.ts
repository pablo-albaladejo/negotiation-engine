import type { Issue } from "../engine/config.js";
import type { OfferMandate } from "../engine/issues.js";
import type { TraceRecord } from "../pipeline/box.js";
import type { TurnInput, TurnOutput } from "../protocol/schemas.js";

/** Lo que un participante sabe al empezar una partida (su propio mandato, nunca el del otro). */
export interface GameSetup {
  sessionId: string;
  scenarioId: string;
  /** Issues del escenario (dirección declarada desde el comprador). */
  issues: readonly Issue[];
  mandate: OfferMandate;
  /** Semilla propia del participante, derivada de la semilla de la partida. */
  seed: number;
  mode: "structured" | "text-only";
}

/** Una partida desde el punto de vista de un participante: turnos canónicos de entrada y salida. */
export interface PlayerSession {
  respond(turn: TurnInput): Promise<TurnOutput>;
  /** Registros de traza por caja (solo nuestro agente en proceso). */
  records?(): readonly TraceRecord[];
  close?(): Promise<void>;
}

/**
 * Participante común de la arena: nuestro agente, bots en código, bots LLM y agentes externos.
 * `pool` separa rivales de ajuste y reservados (lo usa el ajuste del sábado).
 */
export interface Participant {
  name: string;
  kind: "agent" | "bot" | "external";
  pool: "tuning" | "heldOut";
  start(setup: GameSetup): PlayerSession | Promise<PlayerSession>;
}
