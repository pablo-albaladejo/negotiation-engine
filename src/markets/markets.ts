import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Intent } from "../coordinator/coordinator.js";
import { freeCounts as freeCountsOf, isLastFreeCopy } from "../shared/last-copy.js";
import type { GameState } from "../state/game-state.js";
import type { PriceEntry, Quote, VenueInfo } from "../state/prices.js";
import { countHoldings, type TradeState } from "../trades/trades.js";
import { gameHourOf, marginalValue, SCANNER_PARAMS, ScannerLedger, scanDecision, type ScannerParams } from "./scanner.js";

/**
 * Markets route: the same card can be in El Rastro and in other teams' venues. For each possible purchase or
 * sale the net gap per venue = gap − fee − rival penalty is computed, and the
 * best is chosen (on a tie, El Rastro). Structure only (prices and offers); the figure is that of the offer on display.
 *
 * `auto` venues: the engine crosses overlapping offers every tick before anyone can accept (RULES.md), so a
 * resting offer there crosses nothing and accepting it is a plain accept (v10 tick 311: settlement kind "trade").
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

/** Fee of a one-card deal at `price` (fee_bps on the price + fee_per_card). We accept, so we pay it (verified: El Rastro charges the side that accepts). */
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

/** Offers whose accept failed because they are no longer open: never proposed again this run (v02 #4230 kept showing a 22 P bid). */
const deadOffers = new Set<number>();
const DEAD_OFFER_CODES = new Set(["offer_not_open", "not_found", "http_404", "closed"]);
/** Used when the caller passes no ledger (one run = one process). */
const defaultLedger = new ScannerLedger();

/** Best venue to buy or sell this card at `value` (default: first-copy value); net gap, on a tie El Rastro. */
export function bestVenue(e: PriceEntry, side: "buy" | "sell", venues: readonly VenueInfo[], teams: number, value: number | undefined = e.value): MarketChoice | undefined {
  if (value === undefined) return undefined;
  let best: MarketChoice | undefined;
  for (const v of venues) {
    if (!v.canTrade || (v.status && v.status !== "open")) continue;
    const q = side === "buy" ? e.byVenue[v.id]?.ask : e.byVenue[v.id]?.bid;
    if (!q || deadOffers.has(q.offer) || !fairPrice(side, q.price, e.book)) continue;
    const edge = side === "buy" ? value - q.price : q.price - value;
    const fee = feeOf(v, q.price);
    const penalty = rivalPenalty(v, teams);
    const net = Math.round((edge - fee - penalty) * 10) / 10;
    if (!best || net > best.net || (net === best.net && v.house && !best.venue.house)) best = { ref: e.ref, side, venue: v, quote: q, edge: Math.round(edge * 10) / 10, fee, penalty, net };
  }
  return best;
}

/** What the markets route needs beyond `GameState` (all optional: without them it falls back to first-copy values). */
export interface MarketsContext {
  /** `--scanner` (opt-in): off, the route keeps its pre-scanner rules (first-copy value, net ≥ `minNetEdge`). */
  scanner?: boolean;
  /** El Rastro state of this tick (`TradesRoute.lastState`): value model, held assets, offer makers. */
  trade?: TradeState;
  /** Scanner deals executed this run (hourly spend, per-counterparty count). */
  ledger?: ScannerLedger;
  cashFloor?: number;
  /** `--scanner-spend-per-hour` (default `SCANNER_PARAMS.spendPerHour`). */
  spendPerHour?: number;
  /** Cards with an active rival-page directed listing: the scanner never sells them. */
  directedRefs?: ReadonlySet<string>;
  /** `--page-targets`: the last copy of a card of those sets is never sold. */
  pageTargets?: readonly string[];
  params?: ScannerParams;
}

interface Valued {
  value: number;
  src: string;
}

/**
 * Value of one copy of `e.ref` for `side`. With the El Rastro model: the marginal value (`valueDelta`, plus `pageRisk`
 * when selling), only for cards whose private value we know (held, or `/api/me/value`). Without it: the first-copy value
 * for a card we lack (buy) or a duplicate (sell; it overstates the loss, so it is conservative). Never a last copy.
 */
function valueFor(e: PriceEntry, side: "buy" | "sell", counts: Map<string, number> | undefined, trade: TradeState | undefined): Valued | undefined {
  const held = counts?.get(e.ref) ?? 0;
  if (trade && counts && trade.model.base.has(e.ref) && (e.value !== undefined || held > 0)) {
    if (side === "sell" && held === 0) return undefined;
    return { value: Math.round(marginalValue(counts, e.ref, side, trade.model) * 10) / 10, src: `${held} held` };
  }
  if (e.value === undefined) return undefined;
  // With El Rastro state, `counts` (free copies when selling) beats the sheet's count, which includes locked copies.
  const n = counts ? held : e.holdings;
  if (side === "buy" && n === 0) return { value: e.value, src: "first copy (no model)" };
  if (side === "sell" && n > 1) return { value: e.value, src: "first copy (no model, conservative)" };
  return undefined;
}

/**
 * Counterparty of an offer, structure only: the maker from the El Rastro board; in another team's venue the maker is
 * not in the price sheet, so the venue owner stands in (ASSUMPTION); otherwise `?@venue` (shared, conservative).
 */
function counterpartyOf(c: MarketChoice, trade: TradeState | undefined): string {
  const maker = c.venue.house ? trade?.board.find((o) => o.id === c.quote.offer)?.maker : undefined;
  return maker ?? (c.venue.house ? undefined : c.venue.owner) ?? `?@${c.venue.id}`;
}

/** A free copy of `ref` to sell: not locked in another offer nor reserved (El Rastro state), else the first held. */
function freeAsset(ref: string, trade: TradeState | undefined, assetsByRef: ReadonlyMap<string, number[]>): number | undefined {
  if (trade) return trade.held.find((a) => a.ref === ref && !a.locked && !trade.reserved.has(a.id))?.id;
  return assetsByRef.get(ref)?.[0];
}

const teamsOf = (state: GameState) => Math.max(1, ...state.markets.venues.map((v) => v.ownerRank ?? 0));
const setOfRef = (ref: string) => ref.split("-")[0] ?? ref;

/**
 * The sale of `ref` the markets route would propose this tick, if any. With `trade` (scanner on): exactly the scanner's
 * own decision (one source of truth: `proposeMarkets` with `ctx`, so directed listings, page-target last copies, free
 * copies, caps and cash all apply). Its pending ledger entries are replaced by the coordinator's own `proposeMarkets` call.
 */
export function marketSale(state: GameState, ref: string, trade?: TradeState, ctx: MarketsContext = {}): MarketChoice | undefined {
  if (!trade) return legacyMarketSale(state, ref);
  return proposeMarkets(state, new Map(), { ...ctx, scanner: true, trade }).sales.get(ref);
}

interface Candidate {
  e: PriceEntry;
  c: MarketChoice;
  v: Valued;
  asset?: number;
}

export function proposeMarkets(state: GameState, assetsByRef: ReadonlyMap<string, number[]>, ctx: MarketsContext = {}): { intents: Intent[]; notes: string[]; sales: Map<string, MarketChoice> } {
  if (!ctx.scanner) return { ...legacyProposeMarkets(state, assetsByRef), sales: new Map() };
  const intents: Intent[] = [];
  const params = ctx.params ?? SCANNER_PARAMS;
  const ledger = ctx.ledger ?? defaultLedger;
  ledger.resetPending();
  const trade = ctx.trade;
  const counts = trade ? countHoldings(trade.held) : undefined;
  // Sell side: copies locked in our own offers or reserved are already gone; the last free copy is never sold.
  const lockedIds = new Set(trade?.held.filter((a) => a.locked).map((a) => a.id));
  const freeCounts = trade ? freeCountsOf(trade.held, lockedIds, trade.reserved) : undefined;
  // Cash committed by this route's buys this tick (page-completing first, then scanner). Other routes' spend is not seen here.
  let committed = 0;
  const cash = state.ours.cash ?? 0;
  const cashFloor = ctx.cashFloor ?? 0;
  const spendPerHour = ctx.spendPerHour ?? params.spendPerHour;
  const hour = gameHourOf(state.tick, state.time.gameHour ?? state.clock.tHours, state.clock.tickSeconds);
  const targetSets = new Set((ctx.pageTargets ?? []).map(setOfRef));
  const notes: string[] = [
    `RIVAL_PENALTY house ${RIVAL_PENALTY.house} · top-3 ${RIVAL_PENALTY.top3} · middle ${RIVAL_PENALTY.middle} · bottom half ${RIVAL_PENALTY.bottomHalf}`,
    `[scanner] game hour ${hour} · spent ${ledger.spentIn(hour)}/${spendPerHour} P (in memory since start) · margin max(${params.minEdge} P, ${params.minEdgeFrac * 100} %) · ≤ ${params.dealsPerCounterpartyPerHour} deals/counterparty/h · cash floor ${cashFloor} · values: ${trade ? "marginal (El Rastro model)" : "first copy only (no El Rastro model this tick)"}`,
  ];
  const teams = teamsOf(state);
  const candidates: Candidate[] = [];
  for (const e of state.markets.prices) {
    // Buy: anything whose marginal value clears price + fee + margin; page-completing buys keep their own class and rule.
    const bv = valueFor(e, "buy", counts, trade);
    const buy = bv && bestVenue(e, "buy", state.markets.venues, teams, bv.value);
    if (buy && e.completesPage) {
      if (buy.net >= MARKET_PARAMS.minNetEdge && cash >= buy.quote.price + buy.fee) {
        intents.push(intent(buy, e, undefined, "page-completing", bv));
        committed += buy.quote.price + buy.fee;
      } else if (buy.net > 0) notes.push(`${e.ref}: best buy on ${buy.venue.id} net ${buy.net} (< ${MARKET_PARAMS.minNetEdge} or no cash)`);
      if (buy.net >= MARKET_PARAMS.teamThreadEdge && !buy.venue.house && buy.venue.owner) {
        intents.push({ id: `markets:thread:${buy.venue.owner}:${e.ref}`, route: "markets", kind: "open", conversation: `team:${buy.venue.owner}:${e.ref}`, ev: buy.net, summary: `team thread with ${buy.venue.owner} on ${buy.venue.id} for ${e.ref} (net edge ${buy.net}; structure only; proposal only)` });
      }
    } else if (buy && bv && buy.net > 0) {
      candidates.push({ e, c: buy, v: bv });
    }
    // Sell: duplicates and, with the model, the last copy too (its marginal loss includes the page risk).
    if (e.holdings < 1) continue;
    if (ctx.directedRefs?.has(e.ref)) {
      notes.push(`[scanner] ${e.ref}: sale skipped (active rival-page directed listing)`);
      continue;
    }
    const sv = valueFor(e, "sell", freeCounts, trade);
    const sell = sv && bestVenue(e, "sell", state.markets.venues, teams, sv.value);
    if (!sell || !sv || sell.net <= 0) continue;
    const asset = freeAsset(e.ref, trade, assetsByRef);
    const last = trade && asset !== undefined ? isLastFreeCopy(asset, trade.held, lockedIds, trade.reserved) : e.holdings <= 1;
    if (asset !== undefined && last) {
      notes.push(`[scanner] ${e.ref}: last free copy${targetSets.has(setOfRef(e.ref)) ? " of a page-target set" : ""}, not sold (bid ${sell.quote.price} on ${sell.venue.id})`);
      continue;
    }
    if (asset === undefined) notes.push(`[scanner] ${e.ref}: sell net ${sell.net} on ${sell.venue.id} but no free copy (locked or reserved)`);
    else candidates.push({ e, c: sell, v: sv, asset });
  }
  // Best net first, so the hourly cap, cash floor and counterparty cap go to the best deals of the tick.
  candidates.sort((a, b) => b.c.net - a.c.net);
  const sales = new Map<string, MarketChoice>();
  const tickDeals = new Map<string, number>();
  for (const { e, c, v, asset } of candidates) {
    const cp = counterpartyOf(c, trade);
    const d = scanDecision(
      { side: c.side, price: c.quote.price, fee: c.fee, penalty: c.penalty, marginal: v.value, cash, cashFloor, spentThisHour: ledger.spentIn(hour), committedThisTick: committed, spendPerHour, dealsWithCounterparty: ledger.dealsWith(hour, cp) + (tickDeals.get(cp) ?? 0) },
      params,
    );
    if (!d.ok) {
      notes.push(`[scanner] ${c.side.toUpperCase()} ${e.ref} on ${c.venue.id} at ${c.quote.price} P (#${c.quote.offer}, ${cp}) skipped: ${d.reason} · marginal ${v.value} (${v.src}) · edge ${d.edge} − fee ${c.fee} − rival ${c.penalty} = net ${d.net}`);
      continue;
    }
    const i = intent(c, e, asset, "scanner", v, `${d.reason} · counterparty ${cp}`);
    intents.push(i);
    const spend = c.side === "buy" ? c.quote.price + c.fee : 0;
    committed += spend;
    tickDeals.set(cp, (tickDeals.get(cp) ?? 0) + 1);
    ledger.propose(i.id, { hour, counterparty: cp, spend });
    if (c.side === "sell") sales.set(e.ref, c);
  }
  return { intents, notes, sales };
}

function intent(c: MarketChoice, e: PriceEntry, asset: number | undefined, acceptClass: "page-completing" | "scanner" | "other", v: Valued, reason?: string): Intent {
  return {
    id: `markets:accept:${c.venue.id}:${c.quote.offer}`,
    route: "markets",
    kind: "accept",
    conversation: `market:${c.venue.id}:${c.quote.offer}`,
    acceptClass,
    ev: c.net,
    price: c.quote.price,
    ref: e.ref,
    // `sell:<ref>`: one sale of a card per tick across routes (El Rastro lists the same card with that lock).
    locks: [`offer:${c.quote.offer}`, ...(asset !== undefined ? [`asset:${asset}`, `sell:${e.ref}`] : [`buy:${e.ref}`])],
    summary: `${acceptClass === "scanner" ? "[scanner] " : ""}${c.side.toUpperCase()} ${e.ref} on ${c.venue.id} at ${c.quote.price} P (offer #${c.quote.offer}): marginal ${v.value} (${v.src}) · edge ${c.edge} − fee ${c.fee} − rival ${c.penalty} = net ${c.net}${reason ? ` · ${reason}` : ""}`,
  };
}

// ---------------------------------------------------------------- without --scanner (pre-scanner rules)

/** Without `--scanner`: the sale of a duplicate at first-copy value, net ≥ `minNetEdge`. */
function legacyMarketSale(state: GameState, ref: string): MarketChoice | undefined {
  const e = state.markets?.prices.find((x) => x.ref === ref);
  if (!e || e.holdings <= 1) return undefined;
  const c = bestVenue(e, "sell", state.markets.venues, teamsOf(state));
  return c && c.net >= MARKET_PARAMS.minNetEdge ? c : undefined;
}

/** Without `--scanner`: buy what we lack or what completes a page, sell duplicates; first-copy value, net ≥ `minNetEdge`. */
function legacyProposeMarkets(state: GameState, assetsByRef: ReadonlyMap<string, number[]>): { intents: Intent[]; notes: string[] } {
  const intents: Intent[] = [];
  const notes: string[] = [`RIVAL_PENALTY house ${RIVAL_PENALTY.house} · top-3 ${RIVAL_PENALTY.top3} · middle ${RIVAL_PENALTY.middle} · bottom half ${RIVAL_PENALTY.bottomHalf}`, "[scanner] off (opt-in --scanner)"];
  const teams = teamsOf(state);
  for (const e of state.markets.prices) {
    if (e.value === undefined) continue;
    const first: Valued = { value: e.value, src: "first copy" };
    if (e.holdings === 0 || e.completesPage) {
      const c = bestVenue(e, "buy", state.markets.venues, teams);
      if (c && c.net >= MARKET_PARAMS.minNetEdge && (state.ours.cash ?? 0) >= c.quote.price + c.fee) intents.push(intent(c, e, undefined, e.completesPage ? "page-completing" : "other", first));
      else if (c && c.net > 0) notes.push(`${e.ref}: best buy on ${c.venue.id} net ${c.net} (< ${MARKET_PARAMS.minNetEdge} or no cash)`);
      if (c && e.completesPage && c.net >= MARKET_PARAMS.teamThreadEdge && !c.venue.house && c.venue.owner) {
        intents.push({ id: `markets:thread:${c.venue.owner}:${e.ref}`, route: "markets", kind: "open", conversation: `team:${c.venue.owner}:${e.ref}`, ev: c.net, summary: `team thread with ${c.venue.owner} on ${c.venue.id} for ${e.ref} (net edge ${c.net}; structure only; proposal only)` });
      }
    }
    if (e.holdings === 1) {
      const c = bestVenue(e, "sell", state.markets.venues, teams);
      if (c && c.net >= MARKET_PARAMS.minNetEdge) notes.push(`${e.ref}: sell net ${c.net} on ${c.venue.id} but it is our last copy (left to the El Rastro route's page logic)`);
    }
    if (e.holdings > 1) {
      const c = bestVenue(e, "sell", state.markets.venues, teams);
      const asset = assetsByRef.get(e.ref)?.[0];
      if (c && asset !== undefined && c.net >= MARKET_PARAMS.minNetEdge) intents.push(intent(c, e, asset, "other", first));
    }
  }
  return { intents, notes };
}

/** Live (only with --confirm): accept the selected offers in their venue; a scanner accept that goes through counts in `ledger`. */
export async function executeMarkets(client: BazaarClient, selected: readonly Intent[], dryRun: boolean, ledger: ScannerLedger = defaultLedger): Promise<string[]> {
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
      const deal = ledger.commit(i.id);
      lines.push(`markets: accepted #${offer}${deal ? ` (scanner: ${deal.counterparty}, hour ${deal.hour} spend ${ledger.spentIn(deal.hour)} P)` : ""}`);
    } catch (e) {
      if (e instanceof BazaarError && DEAD_OFFER_CODES.has(e.code)) deadOffers.add(offer);
      lines.push(`markets: #${offer} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
