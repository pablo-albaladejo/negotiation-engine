import type { Summary, TranscriptLine } from "../../../src/arena/results-schema.js";

export type EndReason = TranscriptLine["endReason"];
export type Role = TranscriptLine["role"];

export interface MatchFilters {
  rival?: string;
  role?: Role;
  result?: EndReason;
  /** Solo partidas con algún mensaje propio por plantilla. */
  template?: boolean;
  /** Solo partidas con alguna ronda marcada `injectionSuspected`; solo tiene sentido si `hasInjectionData`. */
  injection?: boolean;
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
  /** Al menos una partida del run trae `metrics.injectionSuspected` (campo opcional, runs antiguos no lo tienen). */
  hasInjectionData: boolean;
}

const distinct = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort();

/** P2: KPIs de `summary.overall` y tabla de `transcripts.jsonl` filtrada. */
export function matchesModel(summary: Summary, games: readonly TranscriptLine[], filters: MatchFilters = {}): MatchesModel {
  const { games: g, agreementRate, meanSurplus, violations, leaks, templateFallbacks, rivalErrors } = summary.overall;
  const hasInjectionData = games.some((l) => l.metrics.injectionSuspected !== undefined);
  const rows = games
    .filter(
      (line) =>
        (filters.rival === undefined || line.rival === filters.rival) &&
        (filters.role === undefined || line.role === filters.role) &&
        (filters.result === undefined || line.endReason === filters.result) &&
        (!filters.template || line.metrics.templateFallbacks > 0) &&
        (!hasInjectionData || !filters.injection || (line.metrics.injectionSuspected ?? 0) > 0),
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
    hasInjectionData,
  };
}

/** Encodes `MatchFilters` as a query string for the hash route (INBOX §2: persisted on reload/back). */
export function filtersToQuery(filters: MatchFilters): string {
  const params = new URLSearchParams();
  if (filters.rival !== undefined) params.set("rival", filters.rival);
  if (filters.role !== undefined) params.set("role", filters.role);
  if (filters.result !== undefined) params.set("result", filters.result);
  if (filters.template) params.set("template", "1");
  if (filters.injection) params.set("injection", "1");
  return params.toString();
}

/** Reads `MatchFilters` back out of the hash route's query string; unknown or empty values are dropped. */
export function queryToFilters(query: string): MatchFilters {
  const params = new URLSearchParams(query);
  const filters: MatchFilters = {};
  const rival = params.get("rival");
  if (rival) filters.rival = rival;
  const role = params.get("role");
  if (role === "buyer" || role === "seller") filters.role = role;
  const result = params.get("result");
  if (result) filters.result = result as EndReason;
  if (params.get("template") === "1") filters.template = true;
  if (params.get("injection") === "1") filters.injection = true;
  return filters;
}
