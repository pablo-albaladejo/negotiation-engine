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
  /** Side that broke the protocol (`endReason: "protocol-violation"`); `null` otherwise or if unknown. */
  protocolViolationBy: "agent" | "rival" | null;
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

/** The finite set of `endReason` values the engine can log (`results-schema.ts`'s `EndReasonSchema`); anything else from the URL is dropped. */
const KNOWN_END_REASONS: readonly EndReason[] = ["agreement", "agent-walk", "rival-walk", "limit", "rival-error", "agent-error", "protocol-violation"];

/**
 * Same predicate `matchesModel` uses for its rows, exposed so other views of the same run (the
 * MatchSelector in a replay screen) can filter by the carried Matches filters instead of showing
 * every game in the run (L14).
 */
export function filterGames(games: readonly TranscriptLine[], filters: MatchFilters = {}): TranscriptLine[] {
  const hasInjectionData = games.some((l) => l.metrics.injectionSuspected !== undefined);
  return games.filter(
    (line) =>
      (filters.rival === undefined || line.rival === filters.rival) &&
      (filters.role === undefined || line.role === filters.role) &&
      (filters.result === undefined || line.endReason === filters.result) &&
      (!filters.template || line.metrics.templateFallbacks > 0) &&
      (!hasInjectionData || !filters.injection || (line.metrics.injectionSuspected ?? 0) > 0),
  );
}

/** P2: KPIs de `summary.overall` y tabla de `transcripts.jsonl` filtrada. */
export function matchesModel(summary: Summary, games: readonly TranscriptLine[], filters: MatchFilters = {}): MatchesModel {
  const { games: g, agreementRate, meanSurplus, violations, leaks, templateFallbacks, rivalErrors } = summary.overall;
  const hasInjectionData = games.some((l) => l.metrics.injectionSuspected !== undefined);
  const rows = filterGames(games, filters)
    .map(
      (line): MatchRow => ({
        gameId: line.gameId,
        scenarioId: line.scenarioId,
        rival: line.rival,
        role: line.role,
        seed: line.seed,
        endReason: line.endReason,
        protocolViolationBy: line.protocolViolation?.by ?? line.metrics.protocolViolation ?? null,
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

/** T7: current page (0-based) carried as `p` (1-based) in the query string; missing, non-numeric or
 * non-positive values fall back to the first page. Upper-bound clamping needs the row count, so it
 * is the caller's job (MatchesScreen already clamps against `pageCount`). */
export function queryToPage(query: string): number {
  const raw = new URLSearchParams(query).get("p");
  const n = raw === null ? NaN : Number(raw);
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

/** Encodes the filters and the page (0-based) together; `p` is omitted for the first page so a plain
 * filter-only URL stays unchanged. */
export function queryWithPage(filters: MatchFilters, page: number): string {
  const params = new URLSearchParams(filtersToQuery(filters));
  if (page > 0) params.set("p", String(page + 1));
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
  // `rival` is free-form (the run's own data, not a fixed set) and not validated here; `result` is.
  const result = params.get("result");
  if (result && (KNOWN_END_REASONS as readonly string[]).includes(result)) filters.result = result as EndReason;
  if (params.get("template") === "1") filters.template = true;
  if (params.get("injection") === "1") filters.injection = true;
  return filters;
}
