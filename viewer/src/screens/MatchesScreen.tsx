import { Card, DataTable, type DataTableColumn, type DataTableRow, Filters, KpiStrip, Pill, formatNumber } from "@negotiation-ring/design-system";
import { useState } from "react";
import type { Summary, TranscriptLine } from "../../../src/arena/results-schema.js";
import { matchesModel, type MatchFilters } from "../model/index.js";
import { EmptyStateCard } from "../ui/states.js";
import { BackLink, TableLink } from "../ui/buttons.js";

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

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);

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
  return parts.length === 0 ? "clean" : parts.join(" · ");
}

export interface MatchesScreenProps {
  runId: string;
  summary: Summary;
  games: readonly TranscriptLine[];
  onOpenGame: (gameId: string) => void;
  onBack: () => void;
}

/** P2: KPIs de `summary.overall` y partidas de `transcripts.jsonl`, filtrables con `Filters`. */
export function MatchesScreen({ runId, summary, games, onOpenGame, onBack }: MatchesScreenProps) {
  const [filters, setFilters] = useState<MatchFilters>({});
  const model = matchesModel(summary, games, filters);

  if (model.empty) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <BackLink onClick={onBack}>← Runs</BackLink>
        <EmptyStateCard title={`${runId} has no matches`} body="The log has a config header but 0 match lines. Check" command="pnpm arena --matches" />
      </section>
    );
  }

  const rows: DataTableRow[] = model.rows.map((r) => ({
    id: r.gameId,
    esc: r.scenarioId,
    rival: r.rival,
    rol: r.role,
    res: r.endReason,
    exc: pct(r.surplusShare),
    rondas: r.roundLimit !== null ? `${r.rounds} / ${r.roundLimit}` : String(r.rounds),
    inc: incidents(r),
  }));

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <BackLink onClick={onBack}>← Runs</BackLink>
        <h2 className="nr-heading">{runId}</h2>
      </div>
      <KpiStrip
        items={[
          { label: "Matches", value: formatNumber(model.kpis.games, { locale: "en" }) },
          { label: "Deal", value: pct(model.kpis.agreementRate), tone: model.kpis.agreementRate ? "deal" : "walk" },
          { label: "Avg. surplus", value: pct(model.kpis.meanSurplus) },
          { label: "Violations", value: formatNumber(model.kpis.violations, { locale: "en" }), tone: model.kpis.violations > 0 ? "walk" : "deal" },
          { label: "Leaks", value: formatNumber(model.kpis.leaks, { locale: "en" }), tone: model.kpis.leaks > 0 ? "walk" : "deal" },
          { label: "Template fallbacks", value: formatNumber(model.kpis.templateFallbacks, { locale: "en" }) },
        ]}
      />
      <Filters
        rivalOptions={[{ value: "", label: "All" }, ...model.options.rivals.map((v) => ({ value: v, label: v }))]}
        rival={filters.rival ?? ""}
        onRivalChange={(v) => setFilters((f) => withFilter(f, "rival", v === "" ? undefined : v))}
        roleOptions={[{ value: "", label: "All" }, ...model.options.roles.map((v) => ({ value: v, label: v }))]}
        role={filters.role ?? ""}
        onRoleChange={(v) => setFilters((f) => withFilter(f, "role", v === "" ? undefined : (v as MatchFilters["role"])))}
        resultOptions={[{ value: "", label: "All" }, ...model.options.results.map((v) => ({ value: v, label: v }))]}
        result={filters.result ?? ""}
        onResultChange={(v) => setFilters((f) => withFilter(f, "result", v === "" ? undefined : (v as MatchFilters["result"])))}
        checkboxes={[{ key: "template", label: "template", checked: filters.template ?? false }]}
        onCheckboxChange={(key, checked) => {
          if (key === "template") setFilters((f) => withFilter(f, "template", checked ? true : undefined));
        }}
      />
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <span className="nr-muted">
            {model.shownCount} of {games.length} matches
          </span>
          <Pill kind="sample">sample</Pill>
        </div>
        <DataTable
          columns={COLUMNS}
          rows={rows.map((r, i) => ({ ...r, id: <TableLink onClick={() => onOpenGame(model.rows[i]!.gameId)}>{r.id as string}</TableLink> }))}
        />
      </Card>
    </section>
  );
}
