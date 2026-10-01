import { seedPhase, type PairedReport } from "./paired.js";

export type Criterion = "sign" | "bootstrap";
export type GatePhase = "tuning" | "revalidation" | "heldOut";

export interface GateCheck {
  phase: GatePhase;
  check: "present" | "effect" | "significance" | "fresh-seeds" | "violations" | "leaks" | "non-negative";
  pass: boolean;
  detail: string;
}

export interface GateInput {
  tuning?: PairedReport;
  revalidation?: PairedReport;
  heldOut?: PairedReport;
  minEffectPp: number;
  /** Test de signos (p < alpha) o límite inferior del intervalo por bootstrap > 0. */
  criterion?: Criterion;
  alpha?: number;
}

export interface GateResult {
  pass: boolean;
  checks: GateCheck[];
  failed: GateCheck[];
}

const PHASE_SEEDS: Record<GatePhase, string> = {
  tuning: "semillas de ajuste",
  revalidation: "semillas nuevas del rango de revalidación",
  heldOut: "rivales reservados",
};

const fmt = (v: number | null) => (v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)} pp`);

function cleanChecks(phase: GatePhase, report: PairedReport): GateCheck[] {
  const v = report.violations;
  const l = report.leaks;
  return [
    { phase, check: "violations", pass: v.length === 0, detail: v.length ? `${v.length} partidas con violaciones del mandato, p. ej. ${v[0]!.gameId}` : "0 violaciones" },
    { phase, check: "leaks", pass: l.length === 0, detail: l.length ? `${l.length} partidas con fugas, p. ej. ${l[0]!.gameId}` : "0 fugas" },
  ];
}

function improvementChecks(phase: GatePhase, report: PairedReport, input: GateInput): GateCheck[] {
  const diff = report.meanDiffPp;
  const alpha = input.alpha ?? 0.05;
  const effect: GateCheck = {
    phase,
    check: "effect",
    pass: diff !== null && diff >= input.minEffectPp,
    detail: `diferencia media ${fmt(diff)} (mínimo ${fmt(input.minEffectPp)})`,
  };
  let significance: GateCheck;
  if ((input.criterion ?? "sign") === "sign") {
    const s = report.sign;
    significance = {
      phase,
      check: "significance",
      pass: diff !== null && diff > 0 && s.pValue < alpha,
      detail: `test de signos +${s.positive}/−${s.negative}/=${s.ties}, p = ${s.pValue.toFixed(4)} (umbral ${alpha})`,
    };
  } else {
    const b = report.bootstrap;
    significance = {
      phase,
      check: "significance",
      pass: b !== undefined && b.lowPp > 0,
      detail: b ? `IC bootstrap de clústeres [${fmt(b.lowPp)}, ${fmt(b.highPp)}] (${b.resamples} remuestreos)` : "sin intervalo por bootstrap",
    };
  }
  return [effect, significance];
}

/**
 * Puerta de promoción: (a) efecto ≥ `minEffectPp` y significativo con semillas de ajuste,
 * (b) 0 violaciones y 0 fugas, (c) lo mismo con semillas nuevas de revalidación y (d) en el
 * conjunto reservado diferencia media ≥ 0 sin violaciones ni fugas. Una fase ausente falla.
 */
export function evaluateGate(input: GateInput): GateResult {
  const checks: GateCheck[] = [];
  for (const phase of ["tuning", "revalidation", "heldOut"] as const) {
    const report = input[phase];
    if (!report) {
      checks.push({ phase, check: "present", pass: false, detail: `falta la fase ${phase} (comparación pareada con ${PHASE_SEEDS[phase]})` });
      continue;
    }
    if (phase === "heldOut") {
      checks.push({ phase, check: "non-negative", pass: report.meanDiffPp !== null && report.meanDiffPp >= 0, detail: `diferencia media ${fmt(report.meanDiffPp)} (debe ser ≥ 0)` });
    } else {
      checks.push(...improvementChecks(phase, report, input));
    }
    if (phase === "revalidation") {
      const tuningSeeds = new Set(input.tuning?.seeds ?? []);
      const stale = report.seeds.filter((s) => seedPhase(s) !== "revalidation" || tuningSeeds.has(s));
      checks.push({
        phase,
        check: "fresh-seeds",
        pass: report.seeds.length > 0 && stale.length === 0,
        detail: stale.length ? `semillas fuera del rango de revalidación o ya usadas: ${stale.slice(0, 5).join(", ")}` : `${report.seeds.length} semillas nuevas`,
      });
    }
    checks.push(...cleanChecks(phase, report));
  }
  const failed = checks.filter((c) => !c.pass);
  return { pass: failed.length === 0, checks, failed };
}

export function formatGate(result: GateResult): string {
  const lines = result.checks.map((c) => `${c.pass ? "ok   " : "FALLA"} ${c.phase}/${c.check}: ${c.detail}`);
  lines.push(result.pass ? "puerta: APROBADA" : `puerta: RECHAZADA (${result.failed.map((c) => `${c.phase}/${c.check}`).join(", ")})`);
  return lines.join("\n");
}
