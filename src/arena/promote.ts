import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseConfig, type AgentConfig } from "../engine/config.js";
import { evaluateGate, formatGate, type Criterion, type GatePhase, type GateResult } from "./gate.js";
import { comparePaired, heldOutRivals, runPaired, seedsFor, tuningRivals, type HeldOutOptions, type PairedReport } from "./paired.js";
import type { Participant } from "./participant.js";
import { pairedSummaryLine } from "./report.js";
import { DEFAULT_CATALOG, loadCatalog, type Scenario } from "./scenario.js";

export interface PhasePlan {
  phase: GatePhase;
  rivals: readonly Participant[];
  seeds: readonly number[];
}

export type PhaseEvaluator = (plan: PhasePlan, champion: AgentConfig, candidate: AgentConfig) => Promise<PairedReport>;

export interface PromoteOptions {
  candidatePath: string;
  championPath?: string;
  env?: NodeJS.ProcessEnv;
  /** Semillas por fase: ajuste y revalidación (el conjunto reservado usa otras tantas de revalidación). */
  seeds?: number;
  revalidationSeeds?: number;
  scenarios?: readonly Scenario[];
  tuningRivalNames?: readonly string[];
  /** Rivales reservados extra (bot LLM, externos), solo si se piden. */
  heldOut?: Omit<HeldOutOptions, "previousChampion">;
  criterion?: Criterion;
  resultsDir?: string;
  log?: (line: string) => void;
  /** Sustituible en tests; por defecto, la comparación pareada real en la arena. */
  evaluate?: PhaseEvaluator;
  now?: () => Date;
}

export interface PromoteResult {
  promoted: boolean;
  reason?: string;
  gate?: GateResult;
  version?: number;
}

export function isFrozen(champion: AgentConfig, env: NodeJS.ProcessEnv = process.env): string | null {
  const flag = env.CHAMPION_FROZEN?.trim().toLowerCase();
  if (flag && ["1", "true", "yes"].includes(flag)) return "CHAMPION_FROZEN está activo";
  if (champion.frozen) return "la campeona vigente tiene frozen: true";
  return null;
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

/**
 * `pnpm promote <candidata>`: juega la comparación pareada en las tres fases (ajuste,
 * revalidación con semillas nuevas, conjunto reservado con la campeona vigente como rival),
 * aplica la puerta y solo si pasa escribe la candidata como campeona con versión N+1.
 * No hace commit: propone el mensaje `champion vN+1`.
 */
export async function promote(options: PromoteOptions): Promise<PromoteResult> {
  const log = options.log ?? console.log;
  const championPath = options.championPath ?? "config/champion.json";
  const champion = parseConfig(readJson(championPath), championPath);
  const frozen = isFrozen(champion, options.env);
  if (frozen) {
    const reason = `congelación: ${frozen}; no se sobrescribe ${championPath}`;
    log(`promoción denegada (${reason})`);
    return { promoted: false, reason };
  }
  const candidateRaw = readJson(options.candidatePath);
  const candidate = parseConfig(candidateRaw, options.candidatePath);

  const scenarios = options.scenarios ?? loadCatalog(DEFAULT_CATALOG);
  const criterion = options.criterion ?? "sign";
  const nTuning = options.seeds ?? 21;
  const nReval = options.revalidationSeeds ?? nTuning;
  const plans: PhasePlan[] = [
    { phase: "tuning", rivals: tuningRivals(options.tuningRivalNames), seeds: seedsFor("tuning", nTuning) },
    { phase: "revalidation", rivals: tuningRivals(options.tuningRivalNames), seeds: seedsFor("revalidation", nReval) },
    { phase: "heldOut", rivals: heldOutRivals({ ...options.heldOut, previousChampion: champion }), seeds: seedsFor("revalidation", nReval, nReval) },
  ];
  const evaluate: PhaseEvaluator =
    options.evaluate ??
    (async (plan, a, b) =>
      comparePaired(await runPaired({ scenarios, rivals: plan.rivals, seeds: plan.seeds, champion: a, candidate: b }), {
        roleWeights: a.roleWeights,
        ...(criterion === "bootstrap" ? { bootstrap: { resamples: 2000, seed: 1 } } : {}),
      }));

  const reports: Partial<Record<GatePhase, PairedReport>> = {};
  for (const plan of plans) {
    const report = await evaluate(plan, champion, candidate);
    reports[plan.phase] = report;
    log(`[${plan.phase}] ${pairedSummaryLine(report)}`);
  }
  const gate = evaluateGate({ ...reports, minEffectPp: champion.minEffectPp, criterion });
  log(formatGate(gate));

  const stamp = (options.now ?? (() => new Date()))().toISOString();
  const runDir = join(options.resultsDir ?? "results", `promote-${stamp.replace(/[:.]/g, "").replace("Z", "")}`);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "gate.json"), `${JSON.stringify({ candidate: options.candidatePath, champion: champion.version, criterion, gate, reports }, null, 2)}\n`);

  if (!gate.pass) return { promoted: false, reason: `puerta rechazada: ${gate.failed.map((c) => `${c.phase}/${c.check}`).join(", ")}`, gate };

  const version = champion.version + 1;
  const { frozen: _frozen, ...rest } = candidateRaw;
  const next = {
    ...rest,
    version,
    provenance: {
      source: "promote",
      parent: champion.version,
      createdAt: stamp,
      notes: `candidata ${options.candidatePath} (${candidate.provenance.source})`,
      ...(candidate.provenance.sweepId ? { sweepId: candidate.provenance.sweepId } : {}),
      seeds: { phase: "tuning", start: plans[0]!.seeds[0]!, count: plans[0]!.seeds.length },
      metrics: {
        criterion,
        tuningDiffPp: reports.tuning?.meanDiffPp ?? null,
        tuningSignP: reports.tuning?.sign.pValue ?? null,
        revalidationDiffPp: reports.revalidation?.meanDiffPp ?? null,
        heldOutDiffPp: reports.heldOut?.meanDiffPp ?? null,
      },
    },
  };
  parseConfig(next, "campeona nueva");
  writeFileSync(championPath, `${JSON.stringify(next, null, 2)}\n`);
  log(`campeona v${version} escrita en ${championPath}; commit sugerido: champion v${version}`);
  return { promoted: true, gate, version };
}
