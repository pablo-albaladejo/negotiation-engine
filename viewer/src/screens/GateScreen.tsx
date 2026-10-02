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
import { useEffect, useRef, useState } from "react";
import { formatPp, PHASE_LABEL, type GateModel, type GatePhase, type PhaseMetrics } from "../model/index.js";
import { BackLink, PrimaryButton } from "../ui/buttons.js";

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
/** Surplus / ZOPA is reported as a decimal share everywhere (L18), not a percentage. */
const surplusDec = (v: number | null): string => (v === null ? NL : formatNumber(v, { locale: "en", decimals: 2 }));

function metricRows(m: { champion: PhaseMetrics; candidate: PhaseMetrics; surplusChangePp: number | null }): DataTableRow[] {
  const row = (k: string, f: (v: number | null) => string, pick: (p: PhaseMetrics) => number | null) => ({ k, a: f(pick(m.champion)), b: f(pick(m.candidate)), d: NL });
  const change = m.surplusChangePp;
  return [
    // gate.json never logs a direction for this change; showing a hard-coded better/worse tone from
    // the sign would be the UI inventing a judgement the engine never made, so it is plain text (L12).
    { ...row("Avg. surplus / ZOPA", surplusDec, (p) => p.meanSurplus), d: formatPp(change) },
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

type CopyStatus = "idle" | "copied" | "failed";

/** C1: label reflects the actual clipboard outcome ("Copied" / "Copy failed"), resets after 1.5 s; the timer is cleared on unmount. A mounted ref (L16) guards every state update so a clipboard promise that settles after unmount is a no-op. */
function CopyCommand({ command }: { command: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);
  const scheduleReset = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (mounted.current) setStatus("idle");
    }, 1500);
  };
  const setStatusIfMounted = (next: CopyStatus) => {
    if (mounted.current) setStatus(next);
  };
  const label = status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy";
  const liveMessage = status === "copied" ? "Command copied" : status === "failed" ? "Copy failed, select the command manually" : "";
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "stretch", margin: "var(--space-3) 0 var(--space-2)" }}>
      <code className="nr-code-box" style={{ flex: 1, minWidth: 0 }}>
        {command}
      </code>
      <PrimaryButton
        onClick={() => {
          if (!navigator.clipboard) {
            setStatusIfMounted("failed");
            scheduleReset();
            return;
          }
          navigator.clipboard
            .writeText(command)
            .then(() => setStatusIfMounted("copied"))
            .catch(() => setStatusIfMounted("failed"))
            .finally(scheduleReset);
        }}
      >
        {label}
      </PrimaryButton>
      <span role="status" aria-live="polite" className="nr-sr-only">
        {liveMessage}
      </span>
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
      <BackLink onClick={onBack}>← Runs</BackLink>
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
      <div className="nr-grid" style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" }}>
        <Card title={`Metrics · ${PHASE_LABEL[phase]}`} caption="Change is the logged paired, role-weighted surplus difference; other rows have no logged change.">
          {metrics ? <DataTable columns={METRIC_COLUMNS(model)} rows={metricRows(metrics)} /> : <p className="nr-muted">Phase not logged.</p>}
        </Card>
        <Card title="Promotion gate">
          <DataTable columns={CHECK_COLUMNS} rows={checkRows} />
        </Card>
      </div>
      <div className="nr-grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <Card title={`Surplus / ZOPA by opponent and role · ${PHASE_LABEL[phase]}`} caption="Candidate · ≥ 0.60 good · 0.45–0.59 mid · < 0.45 poor">
          {heat ? (
            <Heatmap
              rowHeader="Opponent"
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
              <div className="nr-diff">
                {model.params.flatMap((p) =>
                  p.changed
                    ? [
                        <div key={`${p.key}-a`} className="nr-diff-row">
                          <span className="nr-diff-sign">−</span>
                          <span>{p.key}: {p.champion}</span>
                        </div>,
                        <div key={`${p.key}-b`} className="nr-diff-row">
                          <span className="nr-diff-sign">+</span>
                          <span>{p.key}: {p.candidate}</span>
                        </div>,
                      ]
                    : [
                        <div key={p.key} className="nr-diff-row">
                          <span className="nr-diff-sign"> </span>
                          <span>{p.key}: {p.champion}</span>
                        </div>,
                      ],
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
