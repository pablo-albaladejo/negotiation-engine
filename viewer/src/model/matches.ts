import type { Summary, TranscriptLine } from "../../../src/arena/results-schema.js";

export type EndReason = TranscriptLine["endReason"];
export type Role = TranscriptLine["role"];

export interface MatchFilters {
  rival?: string;
  role?: Role;
  result?: EndReason;
  /** Solo partidas con algún mensaje propio por plantilla. */
  template?: boolean;
}

export interface MatchRow {
  gameId: string;
  scenarioId: string;
  rival: string;
  role: Role;
  seed: number;
  endReason: EndReason;
  surplusShare: number | null;
  rounds: number;
  /** `null` en transcripts v1 ("not logged"). */
  roundLimit: number | null;
  templateFallbacks: number;
  violations: number;
  leaks: number;
}

export interface MatchesModel {
  runId: string;
  /** `summary.overall.games = 0`: P2 muestra "has no matches", no una tabla vacía. */
  empty: boolean;
  kpis: Pick<Summary["overall"], "games" | "agreementRate" | "meanSurplus" | "violations" | "leaks" | "templateFallbacks" | "rivalErrors">;
  options: { rivals: string[]; roles: Role[]; results: EndReason[] };
  rows: MatchRow[];
  /** Partidas que pasan los filtros (conteo de filas). */
  shownCount: number;
}

const distinct = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort();

/** P2: KPIs de `summary.overall` y tabla de `transcripts.jsonl` filtrada. */
export function matchesModel(summary: Summary, games: readonly TranscriptLine[], filters: MatchFilters = {}): MatchesModel {
  const { games: g, agreementRate, meanSurplus, violations, leaks, templateFallbacks, rivalErrors } = summary.overall;
  const rows = games
    .filter(
      (line) =>
        (filters.rival === undefined || line.rival === filters.rival) &&
        (filters.role === undefined || line.role === filters.role) &&
        (filters.result === undefined || line.endReason === filters.result) &&
        (!filters.template || line.metrics.templateFallbacks > 0),
    )
    .map(
      (line): MatchRow => ({
        gameId: line.gameId,
        scenarioId: line.scenarioId,
        rival: line.rival,
        role: line.role,
        seed: line.seed,
        endReason: line.endReason,
        surplusShare: line.metrics.surplusShare,
        rounds: line.rounds,
        roundLimit: line.roundLimit ?? null,
        templateFallbacks: line.metrics.templateFallbacks,
        violations: line.metrics.violations,
        leaks: line.metrics.leaks,
      }),
    );
  return {
    runId: summary.runId,
    empty: g === 0,
    kpis: { games: g, agreementRate, meanSurplus, violations, leaks, templateFallbacks, rivalErrors },
    options: {
      rivals: distinct(games.map((l) => l.rival)),
      roles: distinct(games.map((l) => l.role)),
      results: distinct(games.map((l) => l.endReason)),
    },
    rows,
    shownCount: rows.length,
  };
}
