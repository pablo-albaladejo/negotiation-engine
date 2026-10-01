import { BOTS } from "../bots/index.js";
import { createLlmBot } from "../bots/llm-bot.js";
import type { AgentConfig } from "../engine/config.js";
import type { LlmClient } from "../llm/provider.js";
import { createAgentParticipant } from "./agent-participant.js";
import { runArena } from "./arena.js";
import { createHttpParticipant } from "./external.js";
import type { GameMetrics } from "./metrics.js";
import type { Participant } from "./participant.js";
import type { Scenario } from "./scenario.js";
import { clusterBootstrap, clusterDiffs, signTest, weightedMeanDiff, type BootstrapOptions, type ClusterDiff, type RoleWeights, type SignTest } from "./stats.js";

/**
 * Rangos de semillas disjuntos: el ajuste solo usa `tuning`; la revalidación de la ganadora
 * usa semillas de `revalidation`, que ningún barrido toca.
 */
export const SEED_RANGES = {
  tuning: { start: 1, end: 99_999 },
  revalidation: { start: 100_000, end: 199_999 },
} as const;
export type SeedPhase = keyof typeof SEED_RANGES;

export function seedsFor(phase: SeedPhase, count: number, offset = 0): number[] {
  const { start, end } = SEED_RANGES[phase];
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(offset) || offset < 0) throw new Error("número de semillas inválido");
  if (start + offset + count - 1 > end) throw new Error(`el rango de semillas ${phase} solo llega a ${end}`);
  return Array.from({ length: count }, (_, k) => start + offset + k);
}

export function seedPhase(seed: number): SeedPhase | null {
  for (const phase of Object.keys(SEED_RANGES) as SeedPhase[]) {
    const { start, end } = SEED_RANGES[phase];
    if (seed >= start && seed <= end) return phase;
  }
  return null;
}

/** Un barrido de ajuste se niega a arrancar con un rival reservado o una semilla fuera del rango de ajuste. */
export function assertTuningOnly(rivals: readonly Participant[], seeds: readonly number[]): void {
  const heldOut = rivals.find((r) => r.pool !== "tuning");
  if (heldOut) throw new Error(`el ajuste no puede usar el rival reservado (heldOut) ${heldOut.name}`);
  const seed = seeds.find((s) => seedPhase(s) !== "tuning");
  if (seed !== undefined) throw new Error(`el ajuste no puede usar la semilla ${seed} (fuera del rango de ajuste ${SEED_RANGES.tuning.start}..${SEED_RANGES.tuning.end})`);
}

/** Rivales de ajuste: los bots en código registrados (deterministas, sin LLM ni red). */
export function tuningRivals(names: readonly string[] = Object.keys(BOTS)): Participant[] {
  return names.map((name) => {
    const factory = BOTS[name];
    if (!factory) throw new Error(`Bot desconocido: ${name} (disponibles: ${Object.keys(BOTS).join(", ")})`);
    return factory();
  });
}

export interface HeldOutOptions {
  /** La campeona anterior (en `promote`, la vigente) juega como rival reservado. */
  previousChampion?: AgentConfig;
  /** Bot guiado por LLM: solo si se pide expresamente (hace llamadas al proveedor). */
  llmBot?: { client: LlmClient; persona: string };
  /** Sparring externo por HTTP JSON (red): solo si se pide expresamente. */
  external?: readonly { name: string; baseUrl: string; timeoutMs?: number }[];
}

/** Conjunto reservado: campeona anterior y, opcionalmente, el bot LLM y los agentes externos. */
export function heldOutRivals(options: HeldOutOptions): Participant[] {
  const rivals: Participant[] = [];
  if (options.previousChampion) {
    const config = options.previousChampion;
    rivals.push(createAgentParticipant({ config, name: `champion-v${config.version}`, pool: "heldOut" }));
  }
  if (options.llmBot) rivals.push(createLlmBot({ ...options.llmBot, pool: "heldOut" }));
  for (const ext of options.external ?? []) rivals.push(createHttpParticipant({ name: ext.name, baseUrl: ext.baseUrl, timeoutMs: ext.timeoutMs ?? 5000 }));
  return rivals;
}

export interface PairedRunOptions {
  scenarios: readonly Scenario[];
  rivals: readonly Participant[];
  seeds: readonly number[];
  champion: AgentConfig;
  candidate: AgentConfig;
  /** Partidas de la campeona ya jugadas con los mismos escenarios, rivales y semillas (caché del barrido). */
  championGames?: readonly GameMetrics[];
}

export interface PairedRun {
  championGames: readonly GameMetrics[];
  candidateGames: readonly GameMetrics[];
}

/** Campeona y candidata sobre los mismos escenarios × rivales × semillas (y por tanto roles). */
export async function runPaired(options: PairedRunOptions): Promise<PairedRun> {
  const play = async (config: AgentConfig, name: string) =>
    (await runArena({ scenarios: options.scenarios, rivals: options.rivals, seeds: options.seeds, agent: createAgentParticipant({ config, name }) })).games;
  const championGames = options.championGames ?? (await play(options.champion, "champion"));
  const candidateGames = await play(options.candidate, "candidate");
  return { championGames, candidateGames };
}

export interface PairedReport {
  clusters: ClusterDiff[];
  /** Diferencia media ponderada por rol (candidata − campeona), en puntos porcentuales; null sin pares. */
  meanDiffPp: number | null;
  sign: SignTest;
  /** Intervalo por bootstrap de clústeres, en pp (solo si se pide). */
  bootstrap?: { lowPp: number; highPp: number; resamples: number };
  byRival: { rival: string; meanDiffPp: number | null }[];
  champion: { agreementRate: number; meanSurplus: number | null };
  candidate: { agreementRate: number; meanSurplus: number | null };
  /** Partidas de la candidata con violaciones del mandato o fugas. */
  violations: { gameId: string; count: number }[];
  leaks: { gameId: string; count: number }[];
  games: number;
  seeds: number[];
  rivals: string[];
}

function overview(games: readonly GameMetrics[]) {
  const counted = games.filter((g) => !g.rivalError);
  const surplus = counted.filter((g) => !g.zopaEmpty).map((g) => g.surplusShare!);
  return {
    agreementRate: counted.length ? counted.filter((g) => g.agreement).length / counted.length : 0,
    meanSurplus: surplus.length ? surplus.reduce((s, v) => s + v, 0) / surplus.length : null,
  };
}

const toPp = (v: number | null) => (v === null ? null : v * 100);

export function comparePaired(run: PairedRun, options: { roleWeights: RoleWeights; bootstrap?: BootstrapOptions }): PairedReport {
  const clusters = clusterDiffs(run.championGames, run.candidateGames);
  const counted = clusters.filter((c): c is ClusterDiff & { diff: number } => c.diff !== null);
  const rivals = [...new Set(clusters.map((c) => c.rival))];
  const report: PairedReport = {
    clusters,
    meanDiffPp: toPp(weightedMeanDiff(counted, options.roleWeights)),
    sign: signTest(counted.map((c) => c.diff)),
    byRival: rivals.map((rival) => ({ rival, meanDiffPp: toPp(weightedMeanDiff(counted.filter((c) => c.rival === rival), options.roleWeights)) })),
    champion: overview(run.championGames),
    candidate: overview(run.candidateGames),
    violations: run.candidateGames.filter((g) => g.violations > 0).map((g) => ({ gameId: g.gameId, count: g.violations })),
    leaks: run.candidateGames.filter((g) => g.leaks > 0).map((g) => ({ gameId: g.gameId, count: g.leaks })),
    games: run.candidateGames.length,
    seeds: [...new Set(run.candidateGames.map((g) => g.seed))],
    rivals,
  };
  if (options.bootstrap) {
    const interval = clusterBootstrap(counted, options.roleWeights, options.bootstrap);
    if (interval) report.bootstrap = { lowPp: interval.low * 100, highPp: interval.high * 100, resamples: interval.resamples };
  }
  return report;
}
