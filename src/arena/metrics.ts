import { offerApr, withinAprBand } from "../engine/apr.js";
import { orientIssues, sameOffer, withinOfferMandate, type Offer } from "../engine/issues.js";
import { detectLeak } from "../llm/leak.js";
import type { GameResult } from "./runner.js";
import { aprZopa, mandateFor, zopaOf, type Scenario } from "./scenario.js";

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
  /** Rondas jugadas hasta cerrar (acuerdo, retirada o límite). */
  rounds: number;
  /** Textos nuestros que el detector de fugas bloquearía (reserva, mandato, instrucciones). */
  leaks: number;
  /** Turnos en los que salió la plantilla de emergencia. */
  templateFallbacks: number;
  latencyMeanMs: number;
  latencyMaxMs: number;
  /** Solo texto: ofertas del rival registradas con valores distintos de los reales. */
  misExtracted: number;
  /** Solo texto: ofertas reales del rival que no se registraron (sin oferta, se piden cifras). */
  unextracted: number;
  /** Aceptamos valores que no eran la oferta real del rival. */
  wrongAgreement: boolean;
}

/**
 * Fracción capturada del excedente: por issue, la parte del intervalo acordable entre nuestra
 * reserva y la del rival que nos llevamos, ponderada con los pesos del escenario. En solo precio
 * es (acuerdo − nuestra reserva) / (reserva del rival − nuestra reserva). Sin acuerdo vale 0.
 */
export function surplusShare(scenario: Scenario, agreement: Offer | undefined): number | null {
  if (scenario.mandateUnit === "apr") return aprSurplusShare(scenario, agreement);
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

/** Excedente en TAE: (TAE del acuerdo − nuestro límite) / (límite del rival − nuestro límite), recortado a [0, 1]. */
function aprSurplusShare(scenario: Scenario, agreement: Offer | undefined): number | null {
  const zopa = aprZopa(scenario);
  if (!zopa) return null;
  if (!agreement) return 0;
  const width = zopa.sellerLimit - zopa.buyerLimit;
  const apr = offerApr({ baseDays: scenario.baseDays! }, agreement);
  const buyerShare = width === 0 ? 0.5 : Math.min(1, Math.max(0, (apr - zopa.buyerLimit) / width));
  return scenario.role === "buyer" ? buyerShare : 1 - buyerShare;
}

/** Compara la oferta que registró el agente en cada turno (caja `reconcile`) con la real del rival. */
function extraction(scenario: Scenario, game: GameResult): { misExtracted: number; unextracted: number } {
  const counts = { misExtracted: 0, unextracted: 0 };
  if (scenario.mode !== "text-only") return counts;
  const registered = new Map<number, Offer | null>();
  for (const r of game.records) {
    if (r.box === "reconcile") registered.set(r.round, ((r.output as { offer?: Offer | null } | null)?.offer ?? null) as Offer | null);
  }
  for (const entry of game.transcript) {
    if (entry.from !== "rival" || entry.action !== "counter" || !entry.offer) continue;
    if (!registered.has(entry.round + 1)) continue;
    const got = registered.get(entry.round + 1);
    if (!got) counts.unextracted++;
    else if (!sameOffer(scenario.issues, got, entry.offer)) counts.misExtracted++;
  }
  return counts;
}

export function computeMetrics(scenario: Scenario, game: GameResult): GameMetrics {
  const mandate = mandateFor(scenario, scenario.role);
  const oriented = orientIssues(scenario.issues, scenario.role);
  const ours = game.transcript.filter((e) => e.from === "agent");
  const inMandate = (offer: Offer) => (mandate.apr ? withinAprBand(mandate.apr, offer) : withinOfferMandate(oriented, mandate, offer));
  const violations = ours.filter((e) => e.offer && !inMandate(e.offer)).length;
  const leaks = ours.filter((e) => detectLeak(e.text, { issues: scenario.issues, reservation: mandate.reservation, ...(e.offer ? { decided: e.offer } : {}) }).leak).length;
  const latency = game.agentLatencyMs;
  const zopaEmpty = (scenario.mandateUnit === "apr" ? aprZopa(scenario) : zopaOf(scenario)) === null;
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
    rounds: game.rounds,
    leaks,
    templateFallbacks: game.records.filter((r) => r.box === "template").length,
    latencyMeanMs: latency.length ? latency.reduce((s, v) => s + v, 0) / latency.length : 0,
    latencyMaxMs: latency.length ? Math.max(...latency) : 0,
    ...extraction(scenario, game),
    wrongAgreement: game.wrongAgreement,
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
  /** Rondas medias hasta el acuerdo; null sin acuerdos. */
  meanRoundsToAgreement: number | null;
  leaks: number;
  templateFallbacks: number;
  latencyMeanMs: number | null;
  latencyMaxMs: number;
  misExtracted: number;
  unextracted: number;
  wrongAgreements: number;
}

const sum = (metrics: readonly GameMetrics[], f: (m: GameMetrics) => number) => metrics.reduce((s, m) => s + f(m), 0);
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
    meanRoundsToAgreement: mean(counted.filter((m) => m.agreement).map((m) => m.rounds)),
    leaks: sum(metrics, (m) => m.leaks),
    templateFallbacks: sum(metrics, (m) => m.templateFallbacks),
    latencyMeanMs: mean(metrics.map((m) => m.latencyMeanMs)),
    latencyMaxMs: metrics.reduce((s, m) => Math.max(s, m.latencyMaxMs), 0),
    misExtracted: sum(metrics, (m) => m.misExtracted),
    unextracted: sum(metrics, (m) => m.unextracted),
    wrongAgreements: metrics.filter((m) => m.wrongAgreement).length,
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
