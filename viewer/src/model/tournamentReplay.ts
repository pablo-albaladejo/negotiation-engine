import type { TraceLine } from "../../../src/pipeline/trace.js";
import { explainSeries, roundPanels, splitTrace, type Offer, type RoundPanel } from "./rounds.js";

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
  traceVersion: 1 | 2;
  ourReserve: Offer | null;
  offers: { ours: { round: number; offer: Offer }[]; rival: { round: number; offer: Offer }[] };
  rounds: RoundPanel[];
  explain: ReturnType<typeof explainSeries>;
  /** "N of M via template": conteos de registros. */
  templateCount: number;
  ourMessageCount: number;
}

export function tournamentReplayModel(trace: readonly TraceLine[], scenarioRef: ScenarioRef | null): TournamentReplayModel {
  const { header, records } = splitTrace(trace);
  if (!header || header.mode !== "tournament") throw new Error("traza sin cabecera de torneo");
  const rounds = roundPanels(records);
  const matches = scenarioRef !== null && scenarioRef.id === header.scenario.id && scenarioRef.hash === header.scenario.hash;
  return {
    sessionId: header.sessionId,
    role: header.role ?? null,
    scenario: { id: header.scenario.id, hash: header.scenario.hash },
    traceVersion: header.traceVersion ?? 1,
    ourReserve: matches ? { ...scenarioRef.mandate.reservation } : null,
    offers: {
      ours: rounds.flatMap((p) => (p.ourOffer ? [{ round: p.round, offer: p.ourOffer }] : [])),
      rival: rounds.flatMap((p) => (p.rivalOffer ? [{ round: p.round, offer: p.rivalOffer }] : [])),
    },
    rounds,
    explain: explainSeries(rounds),
    templateCount: rounds.filter((p) => p.template).length,
    ourMessageCount: rounds.filter((p) => p.ourText !== null).length,
  };
}
