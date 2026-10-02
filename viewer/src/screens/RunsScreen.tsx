import { Card, DataTable, type DataTableCell, type DataTableColumn, type DataTableRow, Pill, formatNumber } from "@negotiation-ring/design-system";
import type { ApiError } from "../api.js";
import { isChampionRun, type RunRow } from "../model/index.js";
import { EmptyStateCard, InvalidLogBanner } from "../ui/states.js";
import { PageTitle } from "../ui/page-title.js";
import { PrimaryButton, SecondaryButton, TableLink } from "../ui/buttons.js";
import { formatRunDate } from "../ui/labels.js";

const COLUMNS: DataTableColumn[] = [
  { key: "id", label: "Run" },
  { key: "date", label: "Date" },
  { key: "cfg", label: "Configuration" },
  { key: "n", label: "Matches", numeric: true },
  { key: "exc", label: "Avg. surplus", numeric: true },
  { key: "acu", label: "Agreement", numeric: true },
  { key: "vio", label: "Violations", numeric: true },
  { key: "fug", label: "Leaks", numeric: true },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);
const num = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en" }));
/** Surplus / ZOPA is reported as a decimal share everywhere (L18), not a percentage. */
const dec = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 2 }));
/** Violations/Leaks: a plain count, in `var(--warn)` (DataTable's "worse" tone) only when it is a
 * logged, non-zero number -- "not logged" and 0 both stay in the default ink. */
const count = (v: number | null): string | DataTableCell => (v !== null && v > 0 ? { value: num(v), tone: "worse" } : num(v));

export interface RunsScreenProps {
  rows: RunRow[];
  errors: ApiError[];
  onOpenRun: (runId: string) => void;
  onOpenLive?: () => void;
  /** `config/champion.json#version`, read-only (ajuste 2); `null` if the file is absent or no run matches it. */
  championVersion?: number | null;
  /** Navigates to `#/compare/:runId` (Champion vs candidate); only offered for runs that logged a `gate.json` (`kind === "promotion"`). */
  onCompareRun?: (runId: string) => void;
}

/** P1: runs de `results/` por tipo, con su `summary.json`. */
export function RunsScreen({ rows, errors, onOpenRun, onOpenLive, championVersion, onCompareRun }: RunsScreenProps) {
  const tableRows: DataTableRow[] = rows.map((r) => {
    const isChampion = isChampionRun(r.config, championVersion ?? null);
    const hasGate = r.kind === "promotion";
    return {
      id: <TableLink onClick={() => onOpenRun(r.runId)}>{r.runId}</TableLink>,
      date: formatRunDate(r.createdAt),
      cfg: r.config ? <span className="nr-cfg">{`${r.config.path} v${r.config.version}`}</span> : "not logged",
      n: num(r.games),
      exc: dec(r.meanSurplus),
      acu: pct(r.agreementRate),
      vio: count(r.violations),
      fug: count(r.leaks),
      status: isChampion ? <Pill kind="champion">champion</Pill> : "",
      actions: (
        <span style={{ display: "flex", gap: "var(--space-2)", flexWrap: "nowrap" }}>
          <SecondaryButton onClick={() => onOpenRun(r.runId)}>Open</SecondaryButton>
          {hasGate && onCompareRun ? <SecondaryButton onClick={() => onCompareRun(r.runId)}>Compare with champion</SecondaryButton> : null}
        </span>
      ),
    };
  });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <PageTitle>Runs</PageTitle>
          <span className="nr-muted">Each run is a batch of test-arena matches with a fixed agent configuration.</span>
        </div>
        {onOpenLive ? <PrimaryButton onClick={onOpenLive}>Open live view</PrimaryButton> : null}
      </div>
      {errors.length > 0 ? <InvalidLogBanner errors={errors} validCount={rows.length} /> : null}
      {rows.length === 0 ? (
        <EmptyStateCard title="No runs yet" body="Run" command="pnpm arena" after="and the viewer will pick up the JSONL logs automatically." />
      ) : (
        <Card>
          <DataTable columns={COLUMNS} rows={tableRows} onRowClick={(i) => onOpenRun(rows[i]!.runId)} />
        </Card>
      )}
    </section>
  );
}
