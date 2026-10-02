import type { TraceLine } from "../../../src/pipeline/trace.js";
import { explainSeries, loggedProvider, protocolBreaks, roundPanels, splitTrace, type Offer, type RoundPanel } from "./rounds.js";

/** Respuesta de `/api/scenario-ref`: nuestro mandato local, con el nombre y hash del fichero leído. */
export interface ScenarioRef {
  id: string;
  hash: string;
  mandate: { role: "buyer" | "seller"; reservation: Offer };
}

/**
 * P4. Privacidad: no hay reserva del rival ni ZOPA (no existen en torneo). Nuestra reserva solo si
 * el escenario local coincide en nombre y hash con `header.scenario`; si no, `null` ("not available").
 */
export interface TournamentReplayModel {
  sessionId: string;
  role: "buyer" | "seller" | null;
  scenario: { id: string; hash: string };
  traceVersion: 1 | 2 | 3;
  /** `configVersion` de la cabecera: el único dato de configuración que registra el torneo (sin `summary.json`). */
  configVersion: number;
  /** R7: límite de rondas, del registro `input` más reciente que lo trae (el ring lo da); `null` si no se registró. */
  roundLimit: number | null;
  ourReserve: Offer | null;
  offers: { ours: { round: number; offer: Offer }[]; rival: { round: number; offer: Offer }[] };
  rounds: RoundPanel[];
  explain: ReturnType<typeof explainSeries>;
  /** "N of M via template": conteos de registros. */
  templateCount: number;
  ourMessageCount: number;
  /** Registros `protocol`: el rival rompió el protocolo (rutas y códigos de Zod). */
  protocol: { round: number; issues: { path: string; code: string }[] }[];
  provider: string | null;
  /**
   * Fin de sesión (C2). `binding` solo registra el movimiento del RIVAL, así que cuando es nuestro
   * motor el que acepta o se retira (sin que el rival lo haya ofrecido/pedido en su turno) no hay
   * `binding` que lo capture: se recurre a `decision.action` de la última ronda registrada.
   * `by: "rival"` -> binding del rival (fuente primaria); `by: "agent"` -> inferido de nuestra última
   * decisión. `null` si ninguna de las dos fuentes lo registró (sesión en curso o límite de rondas).
   */
  outcome: { kind: "agreement" | "walk"; by: "agent" | "rival"; offer: Offer | null } | null;
}

const obj = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);

export function tournamentReplayModel(trace: readonly TraceLine[], scenarioRef: ScenarioRef | null): TournamentReplayModel {
  const { header, records } = splitTrace(trace);
  if (!header || header.mode !== "tournament") throw new Error("traza sin cabecera de torneo");
  const rounds = roundPanels(records);
  const matches = scenarioRef !== null && scenarioRef.id === header.scenario.id && scenarioRef.hash === header.scenario.hash;
  const inputs = records.filter((r) => r.box === "input").map((r) => obj(r.output)?.roundLimit);
  const roundLimit = [...inputs].reverse().find((v): v is number => typeof v === "number") ?? null;
  return {
    sessionId: header.sessionId,
    role: header.role ?? null,
    scenario: { id: header.scenario.id, hash: header.scenario.hash },
    traceVersion: header.traceVersion ?? 1,
    configVersion: header.configVersion,
    roundLimit,
    ourReserve: matches ? { ...scenarioRef.mandate.reservation } : null,
    offers: {
      ours: rounds.flatMap((p) => (p.ourOffer ? [{ round: p.round, offer: p.ourOffer }] : [])),
      rival: rounds.flatMap((p) => (p.rivalOffer ? [{ round: p.round, offer: p.rivalOffer }] : [])),
    },
    rounds,
    explain: explainSeries(rounds),
    templateCount: rounds.filter((p) => p.template).length,
    ourMessageCount: rounds.filter((p) => p.ourText !== null).length,
    protocol: protocolBreaks(records),
    provider: loggedProvider(records),
    outcome: sessionOutcome(rounds),
  };
}

function sessionOutcome(rounds: readonly RoundPanel[]): TournamentReplayModel["outcome"] {
  const bound = [...rounds].reverse().find((p) => p.outcome !== null)?.outcome ?? null;
  if (bound) return { kind: bound.kind, by: "rival", offer: bound.offer };
  const last = rounds[rounds.length - 1];
  if (last?.decision?.action === "accept") return { kind: "agreement", by: "agent", offer: last.rivalOffer };
  if (last?.decision?.action === "walk") return { kind: "walk", by: "agent", offer: null };
  return null;
}
