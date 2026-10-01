import { createRng } from "../engine/rng.js";
import type { GameMetrics } from "./metrics.js";
import type { Scenario } from "./scenario.js";

export type RoleWeights = Record<Scenario["role"], number>;

/** Diferencia pareada de un clúster escenario × rival (fracciones de excedente, no pp). */
export interface ClusterDiff {
  scenarioId: string;
  rival: string;
  role: Scenario["role"];
  /** Partidas emparejadas que cuentan (sin ZOPA vacía ni errores del rival en ninguno de los dos lados). */
  pairs: number;
  champion: number | null;
  candidate: number | null;
  /** Media de (candidata − campeona) sobre los pares; null sin pares. */
  diff: number | null;
}

const mean = (v: readonly number[]) => v.reduce((s, x) => s + x, 0) / v.length;

/** Empareja por (escenario, rival, semilla) y agrega por clúster escenario × rival. */
export function clusterDiffs(champion: readonly GameMetrics[], candidate: readonly GameMetrics[]): ClusterDiff[] {
  const key = (m: GameMetrics) => `${m.scenarioId}\u0000${m.rival}\u0000${m.seed}`;
  const byKey = new Map(candidate.map((m) => [key(m), m]));
  const clusters = new Map<string, { scenarioId: string; rival: string; role: Scenario["role"]; a: number[]; b: number[] }>();
  for (const a of champion) {
    const ck = `${a.scenarioId}\u0000${a.rival}`;
    let cluster = clusters.get(ck);
    if (!cluster) clusters.set(ck, (cluster = { scenarioId: a.scenarioId, rival: a.rival, role: a.role, a: [], b: [] }));
    const b = byKey.get(key(a));
    if (!b || a.surplusShare === null || b.surplusShare === null) continue;
    cluster.a.push(a.surplusShare);
    cluster.b.push(b.surplusShare);
  }
  return [...clusters.values()].map(({ scenarioId, rival, role, a, b }) => {
    const champ = a.length ? mean(a) : null;
    const cand = b.length ? mean(b) : null;
    return { scenarioId, rival, role, pairs: a.length, champion: champ, candidate: cand, diff: champ === null || cand === null ? null : cand - champ };
  });
}

type Weighted = Pick<ClusterDiff, "role"> & { diff: number };

/**
 * Media ponderada por rol: media de los clústeres de cada rol y después media de los roles con
 * `roleWeights` (así un rol con más escenarios no pesa más). Los roles sin clústeres no cuentan.
 */
export function weightedMeanDiff(clusters: readonly Weighted[], roleWeights: RoleWeights): number | null {
  let total = 0;
  let weight = 0;
  for (const role of ["buyer", "seller"] as const) {
    const diffs = clusters.filter((c) => c.role === role).map((c) => c.diff);
    const w = roleWeights[role];
    if (!diffs.length || w <= 0) continue;
    total += w * mean(diffs);
    weight += w;
  }
  return weight > 0 ? total / weight : null;
}

export interface SignTest {
  positive: number;
  negative: number;
  ties: number;
  /** p bilateral exacto (binomial n, 1/2) sobre los clústeres no empatados; 1 sin clústeres. */
  pValue: number;
}

const TIE = 1e-12;

function binomialCdfHalf(k: number, n: number): number {
  let term = 0.5 ** n;
  let cdf = term;
  for (let i = 1; i <= k; i++) {
    term = (term * (n - i + 1)) / i;
    cdf += term;
  }
  return cdf;
}

/** Test de signos sobre las diferencias por clúster (los empates se descartan). */
export function signTest(diffs: readonly number[]): SignTest {
  const positive = diffs.filter((d) => d > TIE).length;
  const negative = diffs.filter((d) => d < -TIE).length;
  const n = positive + negative;
  const pValue = n === 0 ? 1 : Math.min(1, 2 * binomialCdfHalf(Math.min(positive, negative), n));
  return { positive, negative, ties: diffs.length - n, pValue };
}

export interface BootstrapOptions {
  resamples?: number;
  seed?: number;
  /** Intervalo de confianza 1 − alpha (por defecto 0,05 → 95 %). */
  alpha?: number;
}

export interface BootstrapInterval {
  estimate: number;
  low: number;
  high: number;
  resamples: number;
}

/**
 * Bootstrap sembrado que remuestrea clústeres (nunca partidas), estratificado por rol para que
 * cada remuestra conserve la ponderación de `roleWeights`. Intervalo por percentiles.
 */
export function clusterBootstrap(clusters: readonly Weighted[], roleWeights: RoleWeights, options: BootstrapOptions = {}): BootstrapInterval | null {
  const estimate = weightedMeanDiff(clusters, roleWeights);
  if (estimate === null) return null;
  const resamples = options.resamples ?? 2000;
  const alpha = options.alpha ?? 0.05;
  const rng = createRng(options.seed ?? 1);
  const strata = (["buyer", "seller"] as const).map((role) => clusters.filter((c) => c.role === role));
  const stats = new Float64Array(resamples);
  const sample: Weighted[] = [];
  for (let r = 0; r < resamples; r++) {
    sample.length = 0;
    for (const stratum of strata) {
      for (let k = 0; k < stratum.length; k++) sample.push(stratum[Math.floor(rng.float() * stratum.length)]!);
    }
    stats[r] = weightedMeanDiff(sample, roleWeights)!;
  }
  stats.sort();
  const at = (q: number) => stats[Math.min(resamples - 1, Math.max(0, Math.floor(q * resamples)))]!;
  return { estimate, low: at(alpha / 2), high: at(1 - alpha / 2), resamples };
}
