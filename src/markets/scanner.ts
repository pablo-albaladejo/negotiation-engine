import { buyGain, pageRisk, valueDelta, type ValueModel } from "../trades/trades.js";

/**
 * Dispersion scanner (markets route): buy asks below our MARGINAL private value and sell into bids above it.
 * neg_points score value gained at private value (buy: v − p, sell: p − v), so each leg scores on its own.
 * Per-deal cap: a team trade scores at most `scoredGainCap` (Payday: gain ≤ 50 per trade), so the edge is ranked at
 * min(edge, cap); a bigger raw edge buys nothing extra. The per-counterparty cap is approximated by `dealsPerCounterpartyPerHour`.
 * Pure: margin, marginal value, per-deal decision and the hourly ledger. The figure is always the price on display.
 */
export const SCANNER_PARAMS = {
  /** Minimum net edge: max(minEdge P, minEdgeFrac × price), after fee and rival penalty. */
  minEdge: 3,
  minEdgeFrac: 0.15,
  /** Scanner buy spend per game hour (P); `--scanner-spend-per-hour` overrides it. */
  spendPerHour: 60,
  /** Anti-feeding (RULES.md:132): at most N scanner deals per counterparty team per game hour. */
  dealsPerCounterpartyPerHour: 2,
  /** Payday: a team trade scores at most this gain (value − price or price − value), so edges above it count as it. */
  scoredGainCap: 50,
  /** Page protection for `pageRisk` (same threshold as rival-page). */
  protectPageHave: 8,
};
export type ScannerParams = typeof SCANNER_PARAMS;

const r1 = (x: number) => Math.round(x * 10) / 10;

export const scannerMargin = (price: number, p: ScannerParams = SCANNER_PARAMS): number => r1(Math.max(p.minEdge, p.minEdgeFrac * price));

/**
 * Marginal value of one copy of `ref` given our holdings: buy → what one more copy adds (`valueDelta`; with `scoredSets`,
 * the page bonus of any other set is left out: `buyGain`); sell → what losing one costs, plus the page risk of breaking
 * a near-complete page.
 */
export function marginalValue(counts: Map<string, number>, ref: string, side: "buy" | "sell", model: ValueModel, protectHave = SCANNER_PARAMS.protectPageHave, scoredSets?: ReadonlySet<string>): number {
  if (side === "buy") return scoredSets ? buyGain(counts, ref, model, scoredSets) : valueDelta(counts, [], [ref], model);
  return -valueDelta(counts, [ref], [], model) + pageRisk(counts, [ref], model, protectHave);
}

/** Game hour bucket: `t_hours` when known, otherwise derived from the tick and `tick_seconds`. */
export function gameHourOf(tick: number, tHours?: number, tickSeconds?: number): number {
  if (tHours !== undefined) return Math.floor(tHours);
  return tickSeconds ? Math.floor((tick * tickSeconds) / 3600) : 0;
}

export interface ScanInput {
  side: "buy" | "sell";
  price: number;
  fee: number;
  penalty: number;
  marginal: number;
  cash: number;
  cashFloor: number;
  /** Scanner buy spend already executed this game hour, and what earlier intents of this tick commit. */
  spentThisHour: number;
  committedThisTick: number;
  spendPerHour: number;
  /** Scanner deals with this counterparty this game hour (executed + earlier this tick). */
  dealsWithCounterparty: number;
}

export interface ScanDecision {
  ok: boolean;
  edge: number;
  net: number;
  margin: number;
  reason: string;
}

/** One scanner deal: net (edge − fee − penalty) ≥ margin, spend cap, cash floor and counterparty cap. */
export function scanDecision(i: ScanInput, p: ScannerParams = SCANNER_PARAMS): ScanDecision {
  const edge = r1(Math.min(p.scoredGainCap, i.side === "buy" ? i.marginal - i.price : i.price - i.marginal));
  const net = r1(edge - i.fee - i.penalty);
  const margin = scannerMargin(i.price, p);
  const d = (ok: boolean, reason: string): ScanDecision => ({ ok, edge, net, margin, reason });
  if (!(net >= margin)) return d(false, `net ${net} < margin ${margin}`);
  if (i.dealsWithCounterparty >= p.dealsPerCounterpartyPerHour) return d(false, `counterparty cap ${p.dealsPerCounterpartyPerHour}/h reached`);
  if (i.side === "buy") {
    const cost = i.price + i.fee;
    if (i.spentThisHour + i.committedThisTick + cost > i.spendPerHour) return d(false, `hour spend ${r1(i.spentThisHour + i.committedThisTick)} + ${r1(cost)} > cap ${i.spendPerHour}`);
    if (i.cash - i.committedThisTick - cost < i.cashFloor) return d(false, `cash ${i.cash} − ${r1(i.committedThisTick + cost)} < floor ${i.cashFloor}`);
  } else if (i.cash - i.committedThisTick - i.fee < i.cashFloor) {
    return d(false, `cash ${i.cash} − fee ${i.fee} < floor ${i.cashFloor}`);
  }
  return d(true, `${i.side} net ${net} ≥ margin ${margin}`);
}

export interface ScannerDeal {
  hour: number;
  counterparty: string;
  /** Cash out (price + fee) for a buy; 0 for a sale. */
  spend: number;
}

/**
 * Executed scanner deals per game hour, in memory for the run (a restart counts from zero: the hourly cap then
 * allows at most one extra hour's worth). Proposals register a pending deal; only a successful accept commits it.
 */
export class ScannerLedger {
  private readonly spend = new Map<number, number>();
  private readonly deals = new Map<string, number>();
  private pending = new Map<string, ScannerDeal>();

  spentIn(hour: number): number {
    return this.spend.get(hour) ?? 0;
  }
  dealsWith(hour: number, counterparty: string): number {
    return this.deals.get(`${hour}:${counterparty}`) ?? 0;
  }
  /** Called at the start of each proposal: pending deals of the previous tick that did not go out are dropped. */
  resetPending(): void {
    this.pending = new Map();
  }
  propose(intentId: string, deal: ScannerDeal): void {
    this.pending.set(intentId, deal);
  }
  /** A scanner accept went through: count its spend and counterparty. */
  commit(intentId: string): ScannerDeal | undefined {
    const d = this.pending.get(intentId);
    if (!d) return undefined;
    this.pending.delete(intentId);
    this.record(d);
    return d;
  }
  record(d: ScannerDeal): void {
    this.spend.set(d.hour, this.spentIn(d.hour) + d.spend);
    this.deals.set(`${d.hour}:${d.counterparty}`, this.dealsWith(d.hour, d.counterparty) + 1);
  }
}
