import type { Participant } from "./participant.js";
import { byCluster, computeMetrics, summarize, type ClusterSummary, type GameMetrics } from "./metrics.js";
import { playGame, type GameOptions, type GameResult } from "./runner.js";
import type { Scenario } from "./scenario.js";

export interface ArenaOptions {
  scenarios: readonly Scenario[];
  rivals: readonly Participant[];
  agent: Participant;
  seeds: readonly number[];
  textMode?: "agent-side" | "full";
  languages?: GameOptions["languages"];
  /** Cada partida terminada (para escribir transcripciones y trazas sin guardarlas en memoria). */
  onGame?: (game: GameResult, metrics: GameMetrics, scenario: Scenario) => void | Promise<void>;
}

export interface ArenaReport {
  games: GameMetrics[];
  clusters: ClusterSummary[];
  overall: ReturnType<typeof summarize>;
  byRole: Record<Scenario["role"], ReturnType<typeof summarize>>;
}

/** Todas las combinaciones escenario × rival × semilla, en orden estable. */
export async function runArena(options: ArenaOptions): Promise<ArenaReport> {
  const games: GameMetrics[] = [];
  for (const scenario of options.scenarios) {
    for (const rival of options.rivals) {
      for (const seed of options.seeds) {
        const game = await playGame({ scenario, agent: options.agent, rival, seed, ...(options.textMode ? { textMode: options.textMode } : {}), ...(options.languages ? { languages: options.languages } : {}) });
        const metrics = computeMetrics(scenario, game);
        games.push(metrics);
        await options.onGame?.(game, metrics, scenario);
      }
    }
  }
  return {
    games,
    clusters: byCluster(games),
    overall: summarize(games),
    byRole: {
      buyer: summarize(games.filter((g) => g.role === "buyer")),
      seller: summarize(games.filter((g) => g.role === "seller")),
    },
  };
}

export interface PairedCluster {
  scenarioId: string;
  rival: string;
  pairs: number;
  champion: number | null;
  candidate: number | null;
  /** Diferencia media pareada (candidata − campeona) en puntos porcentuales de excedente. */
  diffPp: number | null;
}

/**
 * Comparación pareada mínima por clúster escenario × rival: mismas partidas (escenario, rival,
 * semilla) con ambas configuraciones. Sin test de signos ni puerta (tareas 13.x).
 */
export function pairByCluster(champion: readonly GameMetrics[], candidate: readonly GameMetrics[]): PairedCluster[] {
  const key = (m: GameMetrics) => `${m.scenarioId}\u0000${m.rival}\u0000${m.seed}`;
  const byKey = new Map(candidate.map((m) => [key(m), m]));
  const clusters = new Map<string, { scenarioId: string; rival: string; a: number[]; b: number[] }>();
  for (const a of champion) {
    const b = byKey.get(key(a));
    const ck = `${a.scenarioId}\u0000${a.rival}`;
    let cluster = clusters.get(ck);
    if (!cluster) {
      cluster = { scenarioId: a.scenarioId, rival: a.rival, a: [], b: [] };
      clusters.set(ck, cluster);
    }
    if (!b || a.surplusShare === null || b.surplusShare === null) continue;
    cluster.a.push(a.surplusShare);
    cluster.b.push(b.surplusShare);
  }
  const mean = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
  return [...clusters.values()].map(({ scenarioId, rival, a, b }) => {
    const champ = mean(a);
    const cand = mean(b);
    return { scenarioId, rival, pairs: a.length, champion: champ, candidate: cand, diffPp: champ === null || cand === null ? null : (cand - champ) * 100 };
  });
}
