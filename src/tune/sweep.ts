import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentConfig } from "../engine/config.js";
import { evaluateGate, type GateCheck } from "../arena/gate.js";
import type { GameMetrics } from "../arena/metrics.js";
import { assertTuningOnly, comparePaired, runPaired, seedsFor, type PairedReport } from "../arena/paired.js";
import type { Participant } from "../arena/participant.js";
import type { Scenario } from "../arena/scenario.js";
import type { Generator, Observation, Proposal } from "./generators.js";
import { applyParams, paramsKey, type Params } from "./space.js";

/** Evalúa una candidata contra la campeona con la comparación pareada en `seeds`. */
export type Evaluator = (candidate: AgentConfig, seeds: readonly number[]) => Promise<PairedReport>;

/**
 * Evaluador de la arena: solo rivales `tuning` y semillas de ajuste (si no, no arranca). Las
 * partidas de la campeona se juegan una vez por conjunto de semillas.
 */
export function arenaEvaluator(options: { champion: AgentConfig; scenarios: readonly Scenario[]; rivals: readonly Participant[] }): Evaluator {
  const cache = new Map<string, readonly GameMetrics[]>();
  return async (candidate, seeds) => {
    assertTuningOnly(options.rivals, seeds);
    const key = seeds.join(",");
    const run = await runPaired({ ...options, seeds, candidate, ...(cache.has(key) ? { championGames: cache.get(key)! } : {}) });
    cache.set(key, run.championGames);
    return comparePaired(run, { roleWeights: options.champion.roleWeights });
  };
}

export interface SweepRow {
  params: Params;
  budget: number;
  diffPp: number | null;
  signP: number;
  violations: number;
  leaks: number;
  /** Chequeos de la fase de ajuste de la puerta de promoción (la misma función que `promote`). */
  tuningGate: { pass: boolean; failed: string[] };
}

export interface SweepResult {
  sweepId: string;
  generator: string;
  seeds: { start: number; count: number };
  rows: SweepRow[];
  evaluations: number;
}

export interface SweepOptions {
  sweepId: string;
  base: AgentConfig;
  generator: Generator;
  evaluate: Evaluator;
  /** Semillas de ajuste por candidata cuando la propuesta no trae presupuesto. */
  seedCount: number;
  rivals: readonly Participant[];
  /** Tope de evaluaciones (protege de generadores que no terminan). */
  maxEvaluations?: number;
}

const tuningOnly = (checks: readonly GateCheck[]) => checks.filter((c) => c.phase === "tuning");

/**
 * Bucle de ajuste: pide lotes al generador, evalúa cada candidata con la arena pareada y le
 * devuelve las observaciones. La tabla queda ordenada por diferencia (la última evaluación,
 * con más semillas, de cada candidata).
 */
export async function runSweep(options: SweepOptions): Promise<SweepResult> {
  assertTuningOnly(options.rivals, seedsFor("tuning", options.seedCount));
  const maxEvaluations = options.maxEvaluations ?? 500;
  const latest = new Map<string, SweepRow>();
  let evaluations = 0;
  for (let batch = options.generator.propose(); batch.length > 0; batch = options.generator.propose()) {
    const observations: Observation[] = [];
    for (const proposal of batch as Proposal[]) {
      if (evaluations >= maxEvaluations) throw new Error(`el barrido supera ${maxEvaluations} evaluaciones`);
      evaluations++;
      const budget = proposal.budget ?? options.seedCount;
      const report = await options.evaluate(applyParams(options.base, proposal.params), seedsFor("tuning", budget));
      const gate = tuningOnly(evaluateGate({ tuning: report, minEffectPp: options.base.minEffectPp }).checks);
      const row: SweepRow = {
        params: proposal.params,
        budget,
        diffPp: report.meanDiffPp,
        signP: report.sign.pValue,
        violations: report.violations.reduce((s, v) => s + v.count, 0),
        leaks: report.leaks.reduce((s, v) => s + v.count, 0),
        tuningGate: { pass: gate.every((c) => c.pass), failed: gate.filter((c) => !c.pass).map((c) => c.check) },
      };
      latest.set(paramsKey(proposal.params), row);
      const clean = row.violations === 0 && row.leaks === 0 && row.diffPp !== null;
      observations.push({ proposal, diffPp: row.diffPp, score: clean ? row.diffPp! : Number.NEGATIVE_INFINITY });
    }
    options.generator.observe(observations);
  }
  const rows = [...latest.values()].sort((a, b) => (b.diffPp ?? -Infinity) - (a.diffPp ?? -Infinity) || a.signP - b.signP);
  return { sweepId: options.sweepId, generator: options.generator.name, seeds: { start: seedsFor("tuning", 1)[0]!, count: options.seedCount }, rows, evaluations };
}

/** Escribe las `keep` mejores candidatas limpias en `dir` con su procedencia; nunca toca la campeona. */
export function writeCandidates(result: SweepResult, base: AgentConfig, dir: string, keep: number): string[] {
  if (/champion\.json$/.test(dir)) throw new Error("las candidatas no se escriben sobre la campeona");
  mkdirSync(dir, { recursive: true });
  const best = result.rows.filter((r) => r.violations === 0 && r.leaks === 0 && r.diffPp !== null).slice(0, keep);
  return best.map((row, k) => {
    const config = applyParams(base, row.params);
    const candidate = {
      ...config,
      version: base.version + 1,
      provenance: {
        source: "tune",
        parent: base.version,
        sweepId: result.sweepId,
        notes: `${result.generator}: ${paramsKey(row.params)}`,
        seeds: { phase: "tuning", start: result.seeds.start, count: row.budget },
        metrics: { diffPp: row.diffPp, signP: row.signP, violations: row.violations, leaks: row.leaks, tuningGate: row.tuningGate.pass },
      },
    };
    const path = join(dir, `${result.sweepId}-${String(k + 1).padStart(2, "0")}.json`);
    writeFileSync(path, `${JSON.stringify(candidate, null, 2)}\n`);
    return path;
  });
}

export function sweepTable(result: SweepResult): string {
  const header = ["#", "dif pp", "p signos", "viol", "fugas", "semillas", "puerta ajuste", "parámetros"];
  const rows = result.rows.map((r, k) => [
    String(k + 1),
    r.diffPp === null ? "—" : r.diffPp.toFixed(2),
    r.signP.toFixed(4),
    String(r.violations),
    String(r.leaks),
    String(r.budget),
    r.tuningGate.pass ? "ok" : r.tuningGate.failed.join("+"),
    paramsKey(r.params),
  ]);
  const widths = header.map((h, k) => Math.max(h.length, ...rows.map((r) => r[k]!.length)));
  const line = (cells: string[]) => cells.map((c, k) => (k === cells.length - 1 ? c : c.padStart(widths[k]!))).join("  ");
  return [line(header), ...rows.map(line)].join("\n");
}
