import type { Me } from "../../shared/schemas.js";

/**
 * Dealer-to-dealer arbitrage ("forex", Pablo, 3 Oct): buy a card from the dealer that sells it cheap and resell that
 * copy to the dealer that pays more for it. Dealer deals score only through the ladder (never at private values), so
 * the buy fills Picaros' empty L4 slots and the resale brings the cash back with a margin.
 *
 * Measured in today's public dealer settlements (stream-public, t766–t1128, every team):
 * - SAL-09: Picaros sold at 48–67 (median ~54, n 10); Pilar bought at 65–84 (median ~75, n 8).
 * - SAL-10: Picaros sold at 52–62 (median ~55, n 6); Pilar bought at 69–87 (median ~76, n 8).
 * Pilar pays rares of other sets far less (LAV/LAT/MAL 50–56), so only these cards are routed.
 * Fees: every dealer settlement today carries fee 0 (413 of 413); El Rastro charges 2–9 P a deal. A route only holds
 * if `minSell − maxBuy − fees ≥ FOREX_MIN_MARGIN` (`forexMargin`).
 */
export interface ForexRoute {
  card: string;
  /** Dealer we buy from, and our maximum price there. */
  from: string;
  maxBuy: number;
  /** Dealer we resell to, our minimum there, and her plausible bid (median measured). */
  to: string;
  minSell: number;
  plausibleBid: number;
  /** Fees paid on both legs (P): 0 between dealers; an El Rastro leg would add its 2–9 P. */
  fees: number;
}

export const FOREX_ROUTES: readonly ForexRoute[] = [
  { card: "SAL-09", from: "picaros", maxBuy: 56, to: "pilar", minSell: 70, plausibleBid: 75, fees: 0 },
  { card: "SAL-10", from: "picaros", maxBuy: 56, to: "pilar", minSell: 70, plausibleBid: 76, fees: 0 },
];

/** Smallest net margin (P) a route must leave after fees. */
export const FOREX_MIN_MARGIN = 8;

export const forexMargin = (r: ForexRoute): number => r.minSell - r.maxBuy - r.fees;

/** Unsold forex copies held at once: one lot (~56 P) keeps the rest of the cash for El Rastro and the duels. */
export const FOREX_MAX_LOTS = 1;

const live = (r: ForexRoute) => forexMargin(r) >= FOREX_MIN_MARGIN;
export const forexBuyRoute = (dealer: string, card: string): ForexRoute | undefined => FOREX_ROUTES.find((r) => live(r) && r.from === dealer && r.card === card);
export const forexSellRoute = (dealer: string, card: string): ForexRoute | undefined => FOREX_ROUTES.find((r) => r.to === dealer && r.card === card);

/**
 * Forex copies we hold: every copy of a routed card beyond the first. Our own copy (the first) is never resold;
 * since we held exactly one of each when this started, any extra copy is one we bought to resell.
 */
export function forexLots(me: Me): number {
  let lots = 0;
  for (const r of FOREX_ROUTES) lots += Math.max(0, me.assets.filter((a) => a.kind === "card" && a.ref === r.card).length - 1);
  return lots;
}
