import { formatNumber } from "@negotiation-ring/design-system";
import type { GateFile, PairedReportFile, PhaseSummary } from "../../../src/arena/results-schema.js";

export type GatePhase = "tuning" | "revalidation" | "heldOut";
type GateCheck = GateFile["gate"]["checks"][number];

export const PHASES: readonly GatePhase[] = ["tuning", "revalidation", "heldOut"];
export const PHASE_LABEL: Record<GatePhase, string> = { tuning: "Tuning", revalidation: "Revalidation", heldOut: "Held-out opponents" };

/** Etiqueta inglesa por `(phase, check)`; el umbral y el resultado vienen de `gate.json`, nunca del visor. */
export function checkLabel(phase: GatePhase, check: GateCheck["check"], criterion: GateFile["criterion"]): string {
  const p = PHASE_LABEL[phase];
  switch (check) {
    case "present":
      return `${p} · paired comparison present`;
    case "effect":
      return `${p} · effect ≥ minimum effect`;
    case "significance":
      return `${p} · significant (${criterion === "sign" ? "sign test" : "cluster bootstrap"})`;
    case "fresh-seeds":
      return `${p} · fresh seeds`;
    case "violations":
      return `${p} · 0 violations`;
    case "leaks":
      return `${p} · 0 leaks`;
    case "non-negative":
      return `${p} · mean diff ≥ 0`;
  }
}

const fixed = (v: number, decimals: number) => formatNumber(v, { locale: "en", decimals });
export const formatPp = (v: number | null): string => (v === null ? "not logged" : `${v >= 0 ? "+" : "−"}${fixed(Math.abs(v), 2)} pp`);

/** Valor registrado que respalda cada comprobación (de `reports[phase]`), ya con formato. */
function loggedValue(c: GateCheck, report: PairedReportFile | undefined, criterion: GateFile["criterion"]): string {
  if (!report) return "phase missing";
  switch (c.check) {
    case "present":
      return "present";
    case "effect":
    case "non-negative":
      return formatPp(report.meanDiffPp);
    case "significance":
      if (criterion === "bootstrap") return report.bootstrap ? `[${formatPp(report.bootstrap.lowPp)}, ${formatPp(report.bootstrap.highPp)}]` : "not logged";
      return `p = ${fixed(report.sign.pValue, 4)} · +${report.sign.positive}/−${report.sign.negative}/=${report.sign.ties}`;
    case "fresh-seeds":
      return `${report.seeds.length} seeds`;
    case "violations":
      return `${report.violations.length} games`;
    case "leaks":
      return `${report.leaks.length} games`;
  }
}

export interface GateCheckRow {
  phase: GatePhase;
  check: GateCheck["check"];
  label: string;
  logged: string;
  pass: boolean;
}

export interface PhaseMetrics {
  games: number | null;
  meanSurplus: number | null;
  agreementRate: number | null;
  violations: number | null;
  leaks: number | null;
  meanRoundsToAgreement: number | null;
  emptyZopaCorrect: number | null;
}

export interface GateModel {
  runId: string;
  schemaVersion: 1 | 2;
  candidatePath: string;
  championVersion: number;
  candidateVersion: number | null;
  criterion: GateFile["criterion"];
  verdict: {
    pass: boolean;
    /** `null` en v1 (no registrado). */
    dryRun: boolean | null;
    promoted: boolean | null;
    promotedVersion: number | null;
    failed: GateCheckRow[];
  };
  checks: GateCheckRow[];
  phases: GatePhase[];
  /** Por fase: métricas de cada configuración (`summaries`, o `reports` en v1) y el cambio registrado del excedente. */
  metrics: Partial<Record<GatePhase, { champion: PhaseMetrics; candidate: PhaseMetrics; surplusChangePp: number | null }>>;
  /** Excedente medio de la candidata por rival × rol (`summaries[phase].candidateByRivalRole`); `null` en v1. */
  heatmap: Partial<Record<GatePhase, { roles: ("seller" | "buyer")[]; rows: { rival: string; cells: { role: "seller" | "buyer"; meanSurplus: number | null }[] }[] } | null>>;
  /** Parámetros de las dos configuraciones registradas (sin `provenance`); `null` en v1. */
  params: { key: string; champion: string; candidate: string; changed: boolean }[] | null;
  /** Comando para copiar: solo si fue en seco y la puerta pasó. */
  command: string | null;
}

function fromSummary(s: PhaseSummary): PhaseMetrics {
  return {
    games: s.games,
    meanSurplus: s.meanSurplus,
    agreementRate: s.agreementRate,
    violations: s.violations,
    leaks: s.leaks,
    meanRoundsToAgreement: s.meanRoundsToAgreement,
    emptyZopaCorrect: s.emptyZopaCorrect,
  };
}

function fromOverview(o: { agreementRate: number; meanSurplus: number | null }): PhaseMetrics {
  return { games: null, meanSurplus: o.meanSurplus, agreementRate: o.agreementRate, violations: null, leaks: null, meanRoundsToAgreement: null, emptyZopaCorrect: null };
}

const show = (v: unknown): string => (v === undefined ? "not logged" : JSON.stringify(v));

/** P6: `gate.json` tal como lo escribió `pnpm promote`; el veredicto y cada comprobación salen del fichero. */
export function gateModel(runId: string, file: GateFile): GateModel {
  const rows: GateCheckRow[] = file.gate.checks.map((c) => ({
    phase: c.phase,
    check: c.check,
    label: checkLabel(c.phase, c.check, file.criterion),
    logged: loggedValue(c, file.reports[c.phase], file.criterion),
    pass: c.pass,
  }));
  const failed: GateCheckRow[] = file.gate.failed.map((c) => ({
    phase: c.phase,
    check: c.check,
    label: checkLabel(c.phase, c.check, file.criterion),
    logged: loggedValue(c, file.reports[c.phase], file.criterion),
    pass: c.pass,
  }));
  const phases = PHASES.filter((p) => file.reports[p] !== undefined || file.summaries?.[p] !== undefined);

  const metrics: GateModel["metrics"] = {};
  const heatmap: GateModel["heatmap"] = {};
  for (const phase of phases) {
    const report = file.reports[phase];
    const summary = file.summaries?.[phase];
    if (summary) metrics[phase] = { champion: fromSummary(summary.champion), candidate: fromSummary(summary.candidate), surplusChangePp: report?.meanDiffPp ?? null };
    else if (report) metrics[phase] = { champion: fromOverview(report.champion), candidate: fromOverview(report.candidate), surplusChangePp: report.meanDiffPp };
    if (!summary) {
      heatmap[phase] = null;
      continue;
    }
    const cells = summary.candidateByRivalRole;
    const roles = (["seller", "buyer"] as const).filter((r) => cells.some((c) => c.role === r));
    const rivals = [...new Set(cells.map((c) => c.rival))];
    heatmap[phase] = {
      roles,
      rows: rivals.map((rival) => ({
        rival,
        cells: roles.map((role) => ({ role, meanSurplus: cells.find((c) => c.rival === rival && c.role === role)?.meanSurplus ?? null })),
      })),
    };
  }

  let params: GateModel["params"] = null;
  if (file.configs) {
    const { champion, candidate } = file.configs;
    const keys = [...new Set([...Object.keys(champion), ...Object.keys(candidate)])].filter((k) => k !== "provenance");
    params = keys.map((key) => {
      const a = show(champion[key]);
      const b = show(candidate[key]);
      return { key, champion: a, candidate: b, changed: a !== b };
    });
  }

  return {
    runId,
    schemaVersion: file.schemaVersion ?? 1,
    candidatePath: file.candidate,
    championVersion: file.champion,
    candidateVersion: file.configs?.candidate.version ?? null,
    criterion: file.criterion,
    verdict: {
      pass: file.gate.pass,
      dryRun: file.dryRun ?? null,
      promoted: file.promoted ?? null,
      promotedVersion: file.promotedVersion ?? null,
      failed,
    },
    checks: rows,
    phases,
    metrics,
    heatmap,
    params,
    command: file.dryRun === true && file.gate.pass ? `pnpm promote ${file.candidate}` : null,
  };
}
