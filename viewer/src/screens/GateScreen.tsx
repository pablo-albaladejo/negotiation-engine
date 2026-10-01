import {
  Card,
  DataTable,
  type DataTableColumn,
  type DataTableRow,
  Flag,
  Heatmap,
  Pill,
  Tabs,
  formatNumber,
} from "@negotiation-ring/design-system";
import { useState } from "react";
import { formatPp, PHASE_LABEL, type GateModel, type GatePhase, type PhaseMetrics } from "../model/index.js";

const METRIC_COLUMNS = (model: GateModel): DataTableColumn[] => [
  { key: "k", label: "Metric" },
  { key: "a", label: `Champion v${model.championVersion}`, numeric: true },
  { key: "b", label: model.candidateVersion !== null ? `Candidate v${model.candidateVersion}` : "Candidate", numeric: true },
  { key: "d", label: "Change", numeric: true },
];
const CHECK_COLUMNS: DataTableColumn[] = [
  { key: "k", label: "Check" },
  { key: "v", label: "Logged", numeric: true },
  { key: "st", label: "Status" },
];

const NL = "not logged";
const pct = (v: number | null): string => (v === null ? NL : `${formatNumber(v * 100, { locale: "en", decimals: 1 })}%`);
const int = (v: number | null): string => (v === null ? NL : formatNumber(v, { locale: "en" }));
const dec = (v: number | null): string => (v === null ? NL : formatNumber(v, { locale: "en", decimals: 1 }));

function metricRows(m: { champion: PhaseMetrics; candidate: PhaseMetrics; surplusChangePp: number | null }): DataTableRow[] {
  const row = (k: string, f: (v: number | null) => string, pick: (p: PhaseMetrics) => number | null) => ({ k, a: f(pick(m.champion)), b: f(pick(m.candidate)), d: "—" });
  const change = m.surplusChangePp;
  return [
    {
      ...row("Avg. surplus / ZOPA", pct, (p) => p.meanSurplus),
      d: change === null ? NL : { value: formatPp(change), ...(change !== 0 ? { tone: change > 0 ? ("better" as const) : ("worse" as const) } : {}) },
    },
    row("Agreement", pct, (p) => p.agreementRate),
    row("Violations", int, (p) => p.violations),
    row("Leaks", int, (p) => p.leaks),
    row("Avg. rounds to agreement", dec, (p) => p.meanRoundsToAgreement),
    row("Empty ZOPA handled correctly", pct, (p) => p.emptyZopaCorrect),
    row("Games", int, (p) => p.games),
  ];
}

function Verdict({ model }: { model: GateModel }) {
  const v = model.verdict;
  if (v.promoted && v.promotedVersion !== null) return <Pill kind="verdict">promoted to champion v{v.promotedVersion}</Pill>;
  if (v.pass) return <Pill kind="verdict">gate passed{v.dryRun ? " · dry run" : ""}</Pill>;
  const [first, ...rest] = v.failed;
  return (
    <Pill kind="rejected">
      rejected{first ? ` · ${first.label}: ${first.logged}` : ""}
      {rest.length > 0 ? ` (+${rest.length} more)` : ""}
    </Pill>
  );
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "stretch", margin: "var(--space-3) 0 var(--space-2)" }}>
      <code className="nr-cfg" style={{ flex: 1, minWidth: 0, overflowX: "auto", whiteSpace: "nowrap" }}>
        {command}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(command).catch(() => {});
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export interface GateScreenProps {
  model: GateModel;
  onBack: () => void;
}

/** P6: campeona vs candidata desde `gate.json`. El visor nunca promueve ni evalúa la puerta. */
export function GateScreen({ model, onBack }: GateScreenProps) {
  const [phase, setPhase] = useState<GatePhase>(model.phases[0] ?? "tuning");
  const metrics = model.metrics[phase];
  const heat = model.heatmap[phase];
  const changed = model.params?.filter((p) => p.changed && p.key !== "version") ?? [];
  const checkRows: DataTableRow[] = model.checks.map((c) => ({
    k: c.label,
    v: c.pass ? c.logged : { value: c.logged, tone: "worse" },
    st: <Flag kind={c.pass ? "decision" : "walk"}>{c.pass ? "pass" : "fail"}</Flag>,
  }));

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <button type="button" onClick={onBack} style={{ alignSelf: "flex-start" }}>
        ← Runs
      </button>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <h2 className="nr-heading">
            Champion v{model.championVersion} vs {model.candidateVersion !== null ? `candidate v${model.candidateVersion}` : "candidate"}
          </h2>
          <span className="nr-cfg">
            {model.runId} · {model.candidatePath} · criterion: {model.criterion}
            {model.params ? ` · ${changed.length === 0 ? "no parameter changes" : `changed: ${changed.map((p) => `${p.key} ${p.champion} → ${p.candidate}`).join(", ")}`}` : ""}
          </span>
        </div>
        <Verdict model={model} />
      </div>
      <Tabs items={model.phases.map((p) => ({ id: p, label: PHASE_LABEL[p] }))} selectedId={phase} onSelect={(id) => setPhase(id as GatePhase)} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title={`Metrics · ${PHASE_LABEL[phase]}`} caption="Change is the logged paired, role-weighted surplus difference; other rows have no logged change.">
          {metrics ? <DataTable columns={METRIC_COLUMNS(model)} rows={metricRows(metrics)} /> : <p className="nr-muted">Phase not logged.</p>}
        </Card>
        <Card title="Promotion gate">
          <DataTable columns={CHECK_COLUMNS} rows={checkRows} />
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "var(--space-4)", alignItems: "start" }}>
        <Card title={`Surplus / ZOPA by opponent and role · ${PHASE_LABEL[phase]}`} caption="Candidate · ≥ 0.60 good · 0.45–0.59 mid · < 0.45 poor">
          {heat ? (
            <Heatmap
              columns={heat.roles}
              rows={heat.rows.map((r) => ({
                rival: r.rival,
                cells: r.cells.map((c) => ({ label: c.meanSurplus === null ? "n/a" : formatNumber(c.meanSurplus, { locale: "en", decimals: 2 }), value: c.meanSurplus })),
              }))}
            />
          ) : (
            <p className="nr-muted">Not logged (gate.json v1).</p>
          )}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
          <Card title="Parameter diff">
            {model.params ? (
              <div className="nr-cfg" style={{ display: "flex", flexDirection: "column" }}>
                {model.params.flatMap((p) =>
                  p.changed
                    ? [
                        <div key={`${p.key}-a`}>− {p.key}: {p.champion}</div>,
                        <div key={`${p.key}-b`}>+ {p.key}: {p.candidate}</div>,
                      ]
                    : [<div key={p.key}>  {p.key}: {p.champion}</div>],
                )}
              </div>
            ) : (
              <p className="nr-muted">Not logged (gate.json v1).</p>
            )}
          </Card>
          <Card title="Promote" caption="The viewer does not promote: copy the command and run it in your terminal.">
            {model.command ? (
              <CopyCommand command={model.command} />
            ) : model.verdict.promoted ? (
              <p className="nr-muted">Already promoted to champion v{model.verdict.promotedVersion}.</p>
            ) : !model.verdict.pass ? (
              <p className="nr-muted">No command: the gate did not pass.</p>
            ) : (
              <p className="nr-muted">No command: this run was not a dry run.</p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
