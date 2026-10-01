import type { Summary } from "../../../src/arena/results-schema.js";

/**
 * Adaptadores puros (fichero validado → modelo de pantalla). Solo seleccionan, filtran, ordenan y
 * cuentan registros: ningún valor numérico se calcula aquí (design.md §5). `null` = "not logged".
 */

export type RunKind = "arena" | "promotion" | "tournament";

/** Entrada de `/api/runs`: el servidor clasifica el directorio y adjunta su `summary.json` si lo hay. */
export interface RunEntry {
  runId: string;
  kind: RunKind;
  summary: Summary | null;
}

export interface RunRow {
  runId: string;
  kind: RunKind;
  createdAt: string | null;
  config: { path: string; version: number } | null;
  games: number | null;
  meanSurplus: number | null;
  agreementRate: number | null;
  violations: number | null;
  leaks: number | null;
}

/** P1: una fila por run, los más recientes primero (por `createdAt`, y por id si no lo hay). */
export function runsModel(entries: readonly RunEntry[]): RunRow[] {
  const rows = entries.map(({ runId, kind, summary }): RunRow => {
    const o = summary?.overall;
    return {
      runId,
      kind,
      createdAt: summary?.createdAt ?? null,
      config: summary ? { path: summary.config.path, version: summary.config.version } : null,
      games: o?.games ?? null,
      meanSurplus: o?.meanSurplus ?? null,
      agreementRate: o?.agreementRate ?? null,
      violations: o?.violations ?? null,
      leaks: o?.leaks ?? null,
    };
  });
  return rows.sort((a, b) => (b.createdAt ?? b.runId).localeCompare(a.createdAt ?? a.runId));
}
