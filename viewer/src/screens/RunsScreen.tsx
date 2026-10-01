import { Card, DataTable, type DataTableColumn, type DataTableRow, formatNumber } from "@negotiation-ring/design-system";
import type { ApiError } from "../api.js";
import type { RunRow } from "../model/index.js";
import { EmptyStateCard, InvalidLogBanner } from "../ui/states.js";

const COLUMNS: DataTableColumn[] = [
  { key: "id", label: "Run" },
  { key: "kind", label: "Type" },
  { key: "date", label: "Date" },
  { key: "cfg", label: "Configuration" },
  { key: "n", label: "Matches", numeric: true },
  { key: "exc", label: "Avg. surplus", numeric: true },
  { key: "acu", label: "Agreement", numeric: true },
  { key: "vio", label: "Violations", numeric: true },
  { key: "fug", label: "Leaks", numeric: true },
  { key: "act", label: "Actions" },
];

const pct = (v: number | null): string => (v === null ? "not logged" : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);
const num = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en" }));

export interface RunsScreenProps {
  rows: RunRow[];
  errors: ApiError[];
  onOpenRun: (runId: string) => void;
}

/** P1: runs de `results/` por tipo, con su `summary.json`. */
export function RunsScreen({ rows, errors, onOpenRun }: RunsScreenProps) {
  const tableRows: DataTableRow[] = rows.map((r) => ({
    id: r.runId,
    kind: r.kind,
    date: r.createdAt ?? "not logged",
    cfg: r.config ? `${r.config.path} v${r.config.version}` : "not logged",
    n: num(r.games),
    exc: pct(r.meanSurplus),
    acu: pct(r.agreementRate),
    vio: num(r.violations),
    fug: num(r.leaks),
    act: (
      <button type="button" onClick={() => onOpenRun(r.runId)}>
        Open
      </button>
    ),
  }));

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <h2 className="nr-heading">Runs</h2>
        <span className="nr-muted">Each run is a batch of test-arena matches with a fixed agent configuration.</span>
      </div>
      {errors.length > 0 ? <InvalidLogBanner errors={errors} validCount={rows.length} /> : null}
      {rows.length === 0 ? (
        <EmptyStateCard title="No runs yet" body="Run" command="pnpm arena" />
      ) : (
        <Card>
          <DataTable columns={COLUMNS} rows={tableRows} />
        </Card>
      )}
    </section>
  );
}
