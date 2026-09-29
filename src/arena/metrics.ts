import { orientIssues, withinOfferMandate, type Offer } from "../engine/issues.js";
import type { GameResult } from "./runner.js";
import { mandateFor, zopaOf, type Scenario } from "./scenario.js";

export interface GameMetrics {
  gameId: string;
  scenarioId: string;
  rival: string;
  role: Scenario["role"];
  seed: number;
  endReason: GameResult["endReason"];
  agreement: boolean;
  zopaEmpty: boolean;
  /** Fracción del excedente de la ZOPA capturada por nosotros; null con ZOPA vacía o error del rival. */
  surplusShare: number | null;
  /** Ofertas o aceptaciones nuestras fuera del mandato. */
  violations: number;
  /** ZOPA vacía: correcta si no hay acuerdo ni violaciones. */
  correct: boolean;
  /** Error del rival: no computa en excedente ni en tasa de acuerdo. */
  rivalError: boolean;
}

/**
 * Fracción capturada del excedente: por issue, la parte del intervalo acordable entre nuestra
 * reserva y la del rival que nos llevamos, ponderada con los pesos del escenario. En solo precio
 * es (acuerdo − nuestra reserva) / (reserva del rival − nuestra reserva). Sin acuerdo vale 0.
 */
export function surplusShare(scenario: Scenario, agreement: Offer | undefined): number | null {
  const zopa = zopaOf(scenario);
  if (!zopa) return null;
  if (!agreement) return 0;
  const totalWeight = scenario.issues.reduce((s, i) => s + i.weight, 0);
  let share = 0;
  for (const { issue, buyerLimit, sellerLimit } of zopa) {
    const width = sellerLimit - buyerLimit;
    const value = agreement[issue.name]!;
    const buyerShare = width === 0 ? 0.5 : Math.min(1, Math.max(0, (value - buyerLimit) / width));
    share += (issue.weight / totalWeight) * (scenario.role === "buyer" ? buyerShare : 1 - buyerShare);
  }
  return share;
}

export function computeMetrics(scenario: Scenario, game: GameResult): GameMetrics {
  const mandate = mandateFor(scenario, scenario.role);
  const oriented = orientIssues(scenario.issues, scenario.role);
  const violations = game.transcript.filter((e) => e.from === "agent" && e.offer && !withinOfferMandate(oriented, mandate, e.offer)).length;
  const zopaEmpty = zopaOf(scenario) === null;
  const rivalError = game.endReason === "rival-error";
  const agreement = game.endReason === "agreement";
  return {
    gameId: game.gameId,
    scenarioId: game.scenarioId,
    rival: game.rival,
    role: game.role,
    seed: game.seed,
    endReason: game.endReason,
    agreement,
    zopaEmpty,
    surplusShare: rivalError ? null : surplusShare(scenario, agreement ? game.agreement : undefined),
    violations,
    correct: violations === 0 && (!zopaEmpty || !agreement),
    rivalError,
  };
}

export interface ClusterSummary {
  scenarioId: string;
  rival: string;
  role: Scenario["role"];
  games: number;
  rivalErrors: number;
  agreementRate: number;
  /** Media de excedente sin ZOPA vacía ni errores del rival; null si no hay partidas que cuenten. */
  meanSurplus: number | null;
  violations: number;
  /** Partidas correctas en ZOPA vacía (sin acuerdo ni violaciones) / partidas en ZOPA vacía. */
  emptyZopaCorrect: number | null;
}

const mean = (values: readonly number[]): number | null => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);

/** Resumen de un grupo de partidas (un clúster escenario × rival, o todas). */
export function summarize(metrics: readonly GameMetrics[]) {
  const counted = metrics.filter((m) => !m.rivalError);
  const surplus = counted.filter((m) => !m.zopaEmpty).map((m) => m.surplusShare!);
  const empty = counted.filter((m) => m.zopaEmpty);
  return {
    games: metrics.length,
    rivalErrors: metrics.length - counted.length,
    agreementRate: counted.length ? counted.filter((m) => m.agreement).length / counted.length : 0,
    meanSurplus: mean(surplus),
    violations: metrics.reduce((s, m) => s + m.violations, 0),
    emptyZopaCorrect: empty.length ? empty.filter((m) => m.correct).length / empty.length : null,
  };
}

/** Agrupa por clúster escenario × rival (las partidas de un clúster no son independientes). */
export function byCluster(metrics: readonly GameMetrics[]): ClusterSummary[] {
  const groups = new Map<string, GameMetrics[]>();
  for (const m of metrics) {
    const key = `${m.scenarioId}\u0000${m.rival}`;
    const group = groups.get(key);
    if (group) group.push(m);
    else groups.set(key, [m]);
  }
  return [...groups.values()].map((group) => ({
    scenarioId: group[0]!.scenarioId,
    rival: group[0]!.rival,
    role: group[0]!.role,
    ...summarize(group),
  }));
}
