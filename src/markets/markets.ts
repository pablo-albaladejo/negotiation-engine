import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Intent } from "../coordinator/coordinator.js";
import type { GameState } from "../state/game-state.js";
import type { PriceEntry, Quote, VenueInfo } from "../state/prices.js";

/**
 * Markets route: the same card can be in El Rastro and in other teams' venues. For each possible purchase or
 * sale the net gap per venue = gap − fee − rival penalty is computed, and the
 * best is chosen (on a tie, El Rastro). Structure only (prices and offers); the figure is that of the offer on display.
 *
 * UNVERIFIED hypothesis (RULES.md:75): in an `auto` venue an offer that crosses the house engine without spending
 * our acceptance. Until verified, those intents are marked "fills without accept (unverified)" but the
 * coordinator counts them against the acceptance quota like any other.
 */

/**
 * Rival penalty (P per deal): trading in another team's venue raises its Market-making score, and the
 * figure is relative to the leader. El Rastro (the house) does not penalize; top-3 venues penalize heavily; those in the
 * bottom half, little; the rest, in between.
 */
export const RIVAL_PENALTY = { house: 0, top3: 12, middle: 4, bottomHalf: 1 };

/** Minimum net gap to propose a deal, and to propose a thread with the team in its venue (structure only). */
export const MARKET_PARAMS = { minNetEdge: 1, teamThreadEdge: 15 };

export function rivalPenalty(v: VenueInfo, teams: number): number {
  if (v.house) return RIVAL_PENALTY.house;
  if (v.ownerRank === undefined) return RIVAL_PENALTY.middle;
  if (v.ownerRank <= 3) return RIVAL_PENALTY.top3;
  return v.ownerRank > teams / 2 ? RIVAL_PENALTY.bottomHalf : RIVAL_PENALTY.middle;
}

/** Fee of a one-card deal at `price` (fee_bps on the price + fee_per_card). ASSUMPTION: we pay it. */
export const feeOf = (v: VenueInfo, price: number) => Math.round(((price * v.feeBps) / 10_000 + v.feePerCard) * 10) / 10;

/**
 * Fair play (RULES.md:130–132): never a deal that gives the other team almost all the value. Simple rule:
 * we do not sell below half the book nor buy above double (if there is no book, it is allowed).
 */
export function fairPrice(side: "buy" | "sell", price: number, book: number | undefined): boolean {
  return book === undefined || (side === "sell" ? price >= book * 0.5 : price <= book * 2);
}

export interface MarketChoice {
  ref: string;
  side: "buy" | "sell";
  venue: VenueInfo;
  quote: Quote;
  edge: number;
  fee: number;
  penalty: number;
  net: number;
}

/** Best venue to buy or sell this card (net gap); on a tie, El Rastro. */
export function bestVenue(e: PriceEntry, side: "buy" | "sell", venues: readonly VenueInfo[], teams: number): MarketChoice | undefined {
  if (e.value === undefined) return undefined;
  let best: MarketChoice | undefined;
  for (const v of venues) {
    if (!v.canTrade || (v.status && v.status !== "open")) continue;
    const q = side === "buy" ? e.byVenue[v.id]?.ask : e.byVenue[v.id]?.bid;
    if (!q || !fairPrice(side, q.price, e.book)) continue;
    const edge = side === "buy" ? e.value - q.price : q.price - e.value;
    const fee = feeOf(v, q.price);
    const penalty = rivalPenalty(v, teams);
    const net = Math.round((edge - fee - penalty) * 10) / 10;
    if (!best || net > best.net || (net === best.net && v.house && !best.venue.house)) best = { ref: e.ref, side, venue: v, quote: q, edge: Math.round(edge * 10) / 10, fee, penalty, net };
  }
  return best;
}

export function proposeMarkets(state: GameState, assetsByRef: ReadonlyMap<string, number[]>): { intents: Intent[]; notes: string[] } {
  const intents: Intent[] = [];
  const notes: string[] = [`RIVAL_PENALTY house ${RIVAL_PENALTY.house} · top-3 ${RIVAL_PENALTY.top3} · middle ${RIVAL_PENALTY.middle} · bottom half ${RIVAL_PENALTY.bottomHalf}`];
  const teams = Math.max(1, ...state.markets.venues.map((v) => v.ownerRank ?? 0));
  for (const e of state.markets.prices) {
    // Buy: only what we lack or what completes a page (a duplicate is worth little).
    if (e.holdings === 0 || e.completesPage) {
      const c = bestVenue(e, "buy", state.markets.venues, teams);
      if (c && c.net >= MARKET_PARAMS.minNetEdge && (state.ours.cash ?? 0) >= c.quote.price + c.fee) intents.push(intent(c, e, undefined));
      else if (c && c.net > 0) notes.push(`${e.ref}: best buy on ${c.venue.id} net ${c.net} (< ${MARKET_PARAMS.minNetEdge} or no cash)`);
      if (c && e.completesPage && c.net >= MARKET_PARAMS.teamThreadEdge && !c.venue.house && c.venue.owner) {
        intents.push({ id: `markets:thread:${c.venue.owner}:${e.ref}`, route: "markets", kind: "open", conversation: `team:${c.venue.owner}:${e.ref}`, ev: c.net, summary: `team thread with ${c.venue.owner} on ${c.venue.id} for ${e.ref} (net edge ${c.net}; structure only; proposal only)` });
      }
    }
    // Sell: only duplicates (never the last copy of a page card).
    if (e.holdings === 1) {
      const c = bestVenue(e, "sell", state.markets.venues, teams);
      if (c && c.net >= MARKET_PARAMS.minNetEdge) notes.push(`${e.ref}: sell net ${c.net} on ${c.venue.id} but it is our last copy (left to the El Rastro route's page logic)`);
    }
    if (e.holdings > 1) {
      const c = bestVenue(e, "sell", state.markets.venues, teams);
      const asset = assetsByRef.get(e.ref)?.[0];
      if (c && asset !== undefined && c.net >= MARKET_PARAMS.minNetEdge) intents.push(intent(c, e, asset));
    }
  }
  return { intents, notes };
}

function intent(c: MarketChoice, e: PriceEntry, asset: number | undefined): Intent {
  const auto = c.venue.mechanism === "auto" ? " · fills without accept (unverified; counted in the accept quota)" : "";
  return {
    id: `markets:accept:${c.venue.id}:${c.quote.offer}`,
    route: "markets",
    kind: "accept",
    conversation: `market:${c.venue.id}:${c.quote.offer}`,
    acceptClass: c.side === "buy" && e.completesPage ? "page-completing" : "other",
    ev: c.net,
    price: c.quote.price,
    locks: [`offer:${c.quote.offer}`, ...(asset !== undefined ? [`asset:${asset}`] : [`buy:${e.ref}`])],
    summary: `${c.side.toUpperCase()} ${e.ref} on ${c.venue.id} at ${c.quote.price} P (offer #${c.quote.offer}): edge ${c.edge} − fee ${c.fee} − rival ${c.penalty} = net ${c.net}${auto}`,
  };
}

/** Live (only with --confirm): accept the selected offers in their venue. */
export async function executeMarkets(client: BazaarClient, selected: readonly Intent[], dryRun: boolean): Promise<string[]> {
  const lines: string[] = [];
  for (const i of selected.filter((x) => x.route === "markets" && x.kind === "accept")) {
    const offer = Number(i.id.split(":")[3]);
    if (dryRun) {
      lines.push(`markets: would ${i.summary}`);
      continue;
    }
    try {
      const asset = i.locks?.find((l) => l.startsWith("asset:"));
      await client.acceptOffer(offer, asset ? [Number(asset.slice(6))] : undefined);
      lines.push(`markets: accepted #${offer}`);
    } catch (e) {
      lines.push(`markets: #${offer} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
