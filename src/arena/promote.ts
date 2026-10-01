import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { parseConfig, type AgentConfig } from "../engine/config.js";
import { evaluateGate, formatGate, type Criterion, type GatePhase, type GateResult } from "./gate.js";
import { summarize, type GameMetrics } from "./metrics.js";
import { comparePaired, heldOutRivals, runPaired, seedsFor, tuningRivals, type HeldOutOptions, type PairedReport, type PairedRun } from "./paired.js";
import type { Participant } from "./participant.js";
import { pairedSummaryLine } from "./report.js";
import { DEFAULT_CATALOG, loadCatalog, type Scenario } from "./scenario.js";

export interface PhasePlan {
  phase: GatePhase;
  rivals: readonly Participant[];
  seeds: readonly number[];
}

/** Informe pareado de una fase y las partidas jugadas (de las que salen los resúmenes de `gate.json`). */
export interface PhaseOutcome {
  report: PairedReport;
  run: PairedRun;
}

export type PhaseEvaluator = (plan: PhasePlan, champion: AgentConfig, candidate: AgentConfig) => Promise<PhaseOutcome>;

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
  /** Ensayo en seco: corre la puerta completa y escribe `gate.json`, nunca `config/champion.json`. */
  dryRun?: boolean;
}

export interface PromoteResult {
  promoted: boolean;
  reason?: string;
  gate?: GateResult;
  version?: number;
  dryRun?: boolean;
  /** Ruta del `gate.json` escrito (no existe si la congelación cortó antes de jugar). */
  gatePath?: string;
}

export function isFrozen(champion: AgentConfig, env: NodeJS.ProcessEnv = process.env): string | null {
  const flag = env.CHAMPION_FROZEN?.trim().toLowerCase();
  if (flag && ["1", "true", "yes"].includes(flag)) return "CHAMPION_FROZEN está activo";
  if (champion.frozen) return "la campeona vigente tiene frozen: true";
  return null;
}

/** Resúmenes de una fase: `summarize` de cada configuración y de la candidata por rival × rol. */
export function phaseSummaries(run: PairedRun) {
  const groups = new Map<string, GameMetrics[]>();
  for (const g of run.candidateGames) {
    const key = `${g.rival}\u0000${g.role}`;
    const group = groups.get(key);
    if (group) group.push(g);
    else groups.set(key, [g]);
  }
  return {
    champion: summarize(run.championGames),
    candidate: summarize(run.candidateGames),
    candidateByRivalRole: [...groups.values()].map((group) => ({ rival: group[0]!.rival, role: group[0]!.role, ...summarize(group) })),
  };
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

/**
 * `pnpm promote <candidata>`: juega la comparación pareada en las tres fases (ajuste,
 * revalidación con semillas nuevas, conjunto reservado con la campeona vigente como rival),
 * aplica la puerta, escribe `gate.json` v2 y solo si pasa (y no es en seco) escribe la candidata
 * como campeona con versión N+1. No hace commit: propone el mensaje `champion vN+1`. La congelación
 * bloquea la promoción real; el ensayo en seco se permite porque no escribe la campeona.
 */
export async function promote(options: PromoteOptions): Promise<PromoteResult> {
  const log = options.log ?? console.log;
  const championPath = options.championPath ?? "config/champion.json";
  const champion = parseConfig(readJson(championPath), championPath);
  const dryRun = options.dryRun === true;
  const frozen = isFrozen(champion, options.env);
  if (frozen && !dryRun) {
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
    (async (plan, a, b) => {
      const run = await runPaired({ scenarios, rivals: plan.rivals, seeds: plan.seeds, champion: a, candidate: b });
      const report = comparePaired(run, {
        roleWeights: a.roleWeights,
        ...(criterion === "bootstrap" ? { bootstrap: { resamples: 2000, seed: 1 } } : {}),
      });
      return { report, run };
    });

  const reports: Partial<Record<GatePhase, PairedReport>> = {};
  const summaries: Partial<Record<GatePhase, ReturnType<typeof phaseSummaries>>> = {};
  for (const plan of plans) {
    const { report, run } = await evaluate(plan, champion, candidate);
    reports[plan.phase] = report;
    summaries[plan.phase] = phaseSummaries(run);
    log(`[${plan.phase}] ${pairedSummaryLine(report)}`);
  }
  const gate = evaluateGate({ ...reports, minEffectPp: champion.minEffectPp, criterion });
  log(formatGate(gate));

  const stamp = (options.now ?? (() => new Date()))().toISOString();
  const runDir = join(options.resultsDir ?? "results", `promote-${stamp.replace(/[:.]/g, "").replace("Z", "")}`);
  mkdirSync(runDir, { recursive: true });
  const gatePath = join(runDir, "gate.json");
  const gateFile = {
    schemaVersion: 2,
    candidate: options.candidatePath,
    champion: champion.version,
    criterion,
    gate,
    reports,
    configs: { champion, candidate },
    summaries,
    dryRun,
    promoted: false,
  };
  const writeGate = async (extra: Record<string, unknown> = {}) => {
    const content = `${JSON.stringify({ ...gateFile, ...extra }, null, 2)}\n`;
    const tmpPath = `${gatePath}.tmp`;
    await writeFile(tmpPath, content, "utf8");
    await rename(tmpPath, gatePath);
  };
  await writeGate();

  if (dryRun) log(`en seco: gate.json en ${gatePath}; ${championPath} no se toca`);
  if (!gate.pass) return { promoted: false, reason: `puerta rechazada: ${gate.failed.map((c) => `${c.phase}/${c.check}`).join(", ")}`, gate, dryRun, gatePath };
  if (dryRun) {
    log(`en seco: la puerta pasa${frozen ? ` (la promoción real está bloqueada: ${frozen})` : ""}; para promover: pnpm promote ${options.candidatePath}`);
    return { promoted: false, reason: "en seco", gate, dryRun, gatePath };
  }

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
  await writeGate({ promoted: true, promotedVersion: version });
  log(`campeona v${version} escrita en ${championPath}; commit sugerido: champion v${version}`);
  return { promoted: true, gate, version, dryRun, gatePath };
}
