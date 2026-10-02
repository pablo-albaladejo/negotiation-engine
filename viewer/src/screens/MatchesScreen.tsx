import { Card, DataTable, type DataTableColumn, type DataTableRow, Filters, KpiStrip, Pill, formatNumber } from "@negotiation-ring/design-system";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Summary, TranscriptLine } from "../../../src/arena/results-schema.js";
import { matchesModel, type MatchFilters } from "../model/index.js";
import { BackLink, SecondaryButton, TableLink } from "../ui/buttons.js";
import { resultLabel, roleLabel } from "../ui/labels.js";
import { EmptyStateCard } from "../ui/states.js";

const COLUMNS: DataTableColumn[] = [
  { key: "id", label: "Match" },
  { key: "esc", label: "Scenario" },
  { key: "rival", label: "Opponent" },
  { key: "rol", label: "Role" },
  { key: "res", label: "Outcome" },
  { key: "exc", label: "Surplus", numeric: true },
  { key: "rondas", label: "Rounds", numeric: true },
  { key: "inc", label: "Incidents" },
];

/** Beyond this many filtered rows, the table paginates instead of rendering everything (INBOX §2). */
const PAGE_SIZE = 50;
const PAGINATE_ABOVE = 200;

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);
/** Surplus / ZOPA is reported as a decimal share everywhere (L18), not a percentage. */
const dec = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));

function withFilter<K extends keyof MatchFilters>(filters: MatchFilters, key: K, value: MatchFilters[K] | undefined): MatchFilters {
  const next = { ...filters };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

function incidents(row: { violations: number; leaks: number; templateFallbacks: number }): string {
  const parts: string[] = [];
  if (row.violations > 0) parts.push(`${row.violations} violation(s)`);
  if (row.leaks > 0) parts.push(`${row.leaks} leak(s)`);
  if (row.templateFallbacks > 0) parts.push(`${row.templateFallbacks} template`);
  return parts.length === 0 ? "clean" : parts.join(" \u00b7 ");
}

export interface MatchesScreenProps {
  runId: string;
  summary: Summary;
  games: readonly TranscriptLine[];
  onOpenGame: (gameId: string) => void;
  onBack: () => void;
  /** Filters read from the hash route's query string on first render (INBOX §2: persisted on reload/back). */
  initialFilters?: MatchFilters;
  /** Page (0-based) read from the hash route's `p` query param on first render (T7). */
  initialPage?: number;
  /** Called with the next filters, before they are applied, so the container can write them back into the URL. */
  onFiltersChange?: (filters: MatchFilters) => void;
  /** Called with the next page (0-based) so the container can write it back into the URL (T7). */
  onPageChange?: (page: number) => void;
  /** `true` when this run's config version matches `config/champion.json#version` (ajuste 2). */
  isChampion?: boolean;
}

/** P2: KPIs de `summary.overall` y partidas de `transcripts.jsonl`, filtrables con `Filters`. */
export function MatchesScreen({ runId, summary, games, onOpenGame, onBack, initialFilters, initialPage, onFiltersChange, onPageChange, isChampion }: MatchesScreenProps) {
  const [filters, setFiltersState] = useState<MatchFilters>(initialFilters ?? {});
  const [page, setPage] = useState(initialPage ?? 0);
  const countRef = useRef<HTMLSpanElement>(null);
  /** Clear filters (L24): the count span only exists once the (now unfiltered) rows render, so
   * the focus move happens in an effect, after that commit, not inline in the click handler. */
  const [clearedAt, setClearedAt] = useState(0);
  useEffect(() => {
    if (clearedAt > 0) countRef.current?.focus();
  }, [clearedAt]);
  const setFilters = (updater: MatchFilters | ((f: MatchFilters) => MatchFilters)) => {
    const next = typeof updater === "function" ? (updater as (f: MatchFilters) => MatchFilters)(filters) : updater;
    setFiltersState(next);
    onFiltersChange?.(next);
    setPage(0);
  };
  // T10: summary/games/filters only change on a real filter action or a new run, not on every render.
  const model = useMemo(() => matchesModel(summary, games, filters), [summary, games, filters]);
  /** T8: `injection` is meaningless (and its checkbox hidden) once the run has no injection data at
   * all; drop it from the filters/URL instead of silently filtering by a column nobody can see. */
  useEffect(() => {
    if (!model.hasInjectionData && filters.injection) setFilters((f) => withFilter(f, "injection", undefined));
  }, [model.hasInjectionData]);

  if (model.empty) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <BackLink onClick={onBack}>← Runs</BackLink>
        <EmptyStateCard title={`${runId} has no matches`} body="The log has a config header but 0 match lines. Check" command="pnpm arena --matches" />
      </section>
    );
  }

  const paginated = model.rows.length > PAGINATE_ABOVE;
  const pageCount = paginated ? Math.max(1, Math.ceil(model.rows.length / PAGE_SIZE)) : 1;
  /** T7: an out-of-range `p` (e.g. edited by hand, or stale after the result set shrank) clamps
   * instead of showing an empty page. */
  const currentPage = Math.max(0, Math.min(page, pageCount - 1));
  const pageRows = paginated ? model.rows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE) : model.rows;
  const changePage = (next: number) => {
    setPage(next);
    onPageChange?.(next);
  };

  const rows: DataTableRow[] = pageRows.map((r) => ({
    id: r.gameId,
    esc: r.scenarioId,
    rival: r.rival,
    rol: roleLabel(r.role),
    res: resultLabel(r.endReason, r.protocolViolationBy).label,
    exc: dec(r.surplusShare),
    rondas: r.roundLimit !== null ? `${r.rounds} / ${r.roundLimit}` : String(r.rounds),
    inc: incidents(r),
  }));

  const clearFilters = () => {
    setFilters({});
    setClearedAt((n) => n + 1);
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <BackLink onClick={onBack}>← Runs</BackLink>
        <h2 className="nr-heading-lg" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {runId} · matches
          {isChampion ? <Pill kind="champion">champion</Pill> : null}
        </h2>
      </div>
      <KpiStrip
        items={[
          { label: "Matches", value: formatNumber(model.kpis.games, { locale: "en" }) },
          { label: "Deal", value: pct(model.kpis.agreementRate), tone: model.kpis.agreementRate ? "deal" : "walk" },
          { label: "Avg. surplus", value: dec(model.kpis.meanSurplus) },
          { label: "Violations", value: formatNumber(model.kpis.violations, { locale: "en" }), tone: model.kpis.violations > 0 ? "walk" : "deal" },
          { label: "Leaks", value: formatNumber(model.kpis.leaks, { locale: "en" }), tone: model.kpis.leaks > 0 ? "walk" : "deal" },
          { label: "Template fallbacks", value: formatNumber(model.kpis.templateFallbacks, { locale: "en" }) },
        ]}
      />
      <Filters
        rivalOptions={[{ value: "", label: "All opponents" }, ...model.options.rivals.map((v) => ({ value: v, label: v }))]}
        rival={filters.rival ?? ""}
        onRivalChange={(v) => setFilters((f) => withFilter(f, "rival", v === "" ? undefined : v))}
        roleOptions={[{ value: "", label: "All" }, ...model.options.roles.map((v) => ({ value: v, label: roleLabel(v) }))]}
        role={filters.role ?? ""}
        onRoleChange={(v) => setFilters((f) => withFilter(f, "role", v === "" ? undefined : (v as MatchFilters["role"])))}
        resultOptions={[{ value: "", label: "All" }, ...model.options.results.map((v) => ({ value: v, label: resultLabel(v).label }))]}
        result={filters.result ?? ""}
        onResultChange={(v) => setFilters((f) => withFilter(f, "result", v === "" ? undefined : (v as MatchFilters["result"])))}
        checkboxes={[
          { key: "template", label: "With fallback", checked: filters.template ?? false },
          ...(model.hasInjectionData ? [{ key: "injection", label: "With injection", checked: filters.injection ?? false }] : []),
        ]}
        onCheckboxChange={(key, checked) => {
          if (key === "template") setFilters((f) => withFilter(f, "template", checked ? true : undefined));
          if (key === "injection") setFilters((f) => withFilter(f, "injection", checked ? true : undefined));
        }}
      />
      {model.rows.length === 0 ? (
        <EmptyStateCard title="No matches for these filters" action={<SecondaryButton onClick={clearFilters}>Clear filters</SecondaryButton>} />
      ) : (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <span className="nr-muted" ref={countRef} tabIndex={-1} aria-live="polite">
              {`Showing ${paginated ? currentPage * PAGE_SIZE + 1 : 1}–${paginated ? currentPage * PAGE_SIZE + pageRows.length : model.rows.length} of ${model.rows.length} matches`}
              {model.rows.length !== games.length ? ` (filtered from ${games.length})` : ""}
            </span>
          </div>
          <DataTable
            columns={COLUMNS}
            rows={rows.map((r, i) => ({ ...r, id: <TableLink onClick={() => onOpenGame(pageRows[i]!.gameId)}>{r.id as string}</TableLink> }))}
            onRowClick={(i) => onOpenGame(pageRows[i]!.gameId)}
          />
          {paginated ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
              <SecondaryButton onClick={() => changePage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
                Previous
              </SecondaryButton>
              <span className="nr-muted" aria-live="polite">
                Page {currentPage + 1} of {pageCount}
              </span>
              <SecondaryButton onClick={() => changePage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1}>
                Next
              </SecondaryButton>
            </div>
          ) : null}
        </Card>
      )}
    </section>
  );
}
