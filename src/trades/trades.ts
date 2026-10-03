import { z } from "zod";
import type { Asset, Catalog } from "../shared/schemas.js";

/**
 * Trades with other teams in El Rastro: valuation at OUR private values and pure,
 * deterministic decisions (accept, list duplicates, bid for page cards). Only the structure of
 * each offer (give/want) is read; other teams' text never enters here.
 */

const num = z.number();
const TradeAssetSchema = z.looseObject({ id: num, ref: z.string().nullish(), rarity: z.string().nullish() });
const TradeSideSchema = z.looseObject({
  cash: num.nullish(),
  assets: z.array(z.union([num, TradeAssetSchema])).nullish(),
  types: z.array(z.string()).nullish(),
  cards: z.array(z.string()).nullish(),
});
export const TradeOfferSchema = z.looseObject({
  id: num,
  maker: z.string().nullish(),
  to: z.string().nullish(),
  venue: z.string().nullish(),
  thread: num.nullish(),
  status: z.string().nullish(),
  give: TradeSideSchema.nullish(),
  want: TradeSideSchema.nullish(),
  expires_tick: num.nullish(),
  created_tick: num.nullish(),
});
export type TradeOffer = z.infer<typeof TradeOfferSchema>;

/** Valid offers from a list (`[...]` or `{offers}`); an odd offer is dropped without taking down the rest. */
export function parseOffers(raw: unknown): TradeOffer[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray((raw as { offers?: unknown }).offers) ? (raw as { offers: unknown[] }).offers : [];
  return list.flatMap((o) => {
    const p = TradeOfferSchema.safeParse(o);
    return p.success ? [p.data] : [];
  });
}

/** `/api/me/offers`: the server answers `{offers}` or `{open, queued, to_me}`. */
export function parseMyOffers(raw: unknown, myId: string): { mine: TradeOffer[]; toMe: TradeOffer[] } {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if ("open" in obj || "queued" in obj || "to_me" in obj) {
    return { mine: [...parseOffers(obj.open ?? []), ...parseOffers(obj.queued ?? [])], toMe: parseOffers(obj.to_me ?? []).filter((o) => o.maker !== myId) };
  }
  const all = parseOffers(raw);
  return { mine: all.filter((o) => o.maker === myId), toMe: all.filter((o) => o.to === myId && o.maker !== myId) };
}

export interface Side {
  cash: number;
  assets: { id: number; ref: string | null }[];
  /** Cards asked/given by kind (`card:SAL-07` or `cards: ["SAL-07"]`). */
  cards: string[];
  /** Kinds we can't value (e.g. a generic rarity): the offer is left alone. */
  unsupported: string[];
}

export function readSide(side: TradeOffer["give"]): Side {
  const out: Side = { cash: side?.cash ?? 0, assets: [], cards: [...(side?.cards ?? [])], unsupported: [] };
  for (const a of side?.assets ?? []) out.assets.push(typeof a === "number" ? { id: a, ref: null } : { id: a.id, ref: a.ref ?? null });
  for (const t of side?.types ?? []) {
    if (t.startsWith("card:")) out.cards.push(t.slice(5));
    else out.unsupported.push(t);
  }
  return out;
}

// ---------------------------------------------------------------- valuation

export interface ValueRules {
  /** Value of the 1st, 2nd, 3rd copy as a fraction of the base value (beyond that, 0). */
  marginals: number[];
  /** Complete page (commons + uncommons + rares): fraction of the sum of their bases. */
  pageBonus: number;
  /** Whole set (with epic and legendary): extra fraction of the sum of the whole set. */
  masterBonus: number;
}
export const DEFAULT_VALUE_RULES: ValueRules = { marginals: [1, 0.25, 0.1], pageBonus: 0.25, masterBonus: 0.1 };

export interface CardMeta {
  ref: string;
  set: string;
  rarity: string;
  book: number;
}

export interface ValueModel {
  rules: ValueRules;
  /** Private base value (first copy) per card. */
  base: Map<string, number>;
  meta: Map<string, CardMeta>;
  /** Page cards per set (commons, uncommons, rares). */
  pages: Map<string, string[]>;
  sets: Map<string, string[]>;
}

export interface HeldAsset {
  id: number;
  ref: string;
  /** `your_value` of that copy: what we lose if it leaves (for duplicates, the marginal of the last copy). */
  value: number;
  locked: boolean;
}

const PAGE_RARITIES = new Set(["common", "uncommon", "rare"]);
export const setOf = (ref: string): string => ref.split("-")[0] ?? ref;

export function readValueRules(catalog: Catalog): ValueRules {
  const v = (catalog as { values?: unknown }).values as { copy_marginals?: unknown; page_bonus?: unknown; master_bonus?: unknown } | undefined;
  const marg = Array.isArray(v?.copy_marginals) && v.copy_marginals.every((x) => typeof x === "number") ? (v.copy_marginals as number[]) : DEFAULT_VALUE_RULES.marginals;
  return {
    marginals: marg,
    pageBonus: typeof v?.page_bonus === "number" ? v.page_bonus : DEFAULT_VALUE_RULES.pageBonus,
    masterBonus: typeof v?.master_bonus === "number" ? v.master_bonus : DEFAULT_VALUE_RULES.masterBonus,
  };
}

export function heldAssets(assets: Asset[]): HeldAsset[] {
  return assets
    .filter((a) => (a.kind ?? "card") === "card" && /^[A-Z]+-\d+$/.test(a.ref))
    .map((a) => ({ id: a.id, ref: a.ref, value: a.your_value ?? 0, locked: a.locked === true }));
}

export function countHoldings(held: HeldAsset[]): Map<string, number> {
  const c = new Map<string, number>();
  for (const a of held) c.set(a.ref, (c.get(a.ref) ?? 0) + 1);
  return c;
}

const marginal = (rules: ValueRules, copy: number): number => rules.marginals[copy - 1] ?? 0;

export function median(xs: number[]): number | undefined {
  if (xs.length === 0) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

/**
 * Private bases: from what we hold (`your_value` ÷ marginal of the last copy) and from `/api/me/value`
 * for cards we don't hold (`zeroValues`, value of the first copy). If that first copy would complete
 * the page, the API already includes the bonus: set multiplier × book is used so it isn't counted twice.
 * Cards with no data in a known set are estimated the same way (median multiplier × book).
 */
export function buildValueModel(catalog: Catalog, held: HeldAsset[], zeroValues: Map<string, number>, rules: ValueRules = readValueRules(catalog)): ValueModel {
  const meta = new Map<string, CardMeta>();
  const pages = new Map<string, string[]>();
  const sets = new Map<string, string[]>();
  for (const s of catalog.sets) {
    for (const c of s.cards) {
      const set = s.id ?? setOf(c.id);
      const rarity = c.rarity ?? "common";
      meta.set(c.id, { ref: c.id, set, rarity, book: c.book ?? 0 });
      sets.set(set, [...(sets.get(set) ?? []), c.id]);
      if (PAGE_RARITIES.has(rarity)) pages.set(set, [...(pages.get(set) ?? []), c.id]);
    }
  }
  const counts = countHoldings(held);
  const base = new Map<string, number>();
  for (const [ref, n] of counts) {
    const m = marginal(rules, n);
    const v = held.find((a) => a.ref === ref)?.value ?? 0;
    if (m > 0) base.set(ref, v / m);
  }
  const mult = (set: string): number | undefined =>
    median(
      (sets.get(set) ?? []).flatMap((r) => {
        const b = base.get(r);
        const book = meta.get(r)?.book ?? 0;
        return b !== undefined && book > 0 ? [b / book] : [];
      }),
    );
  const completing: string[] = [];
  for (const [ref, v] of zeroValues) {
    if (base.has(ref)) continue;
    const page = pages.get(meta.get(ref)?.set ?? setOf(ref)) ?? [];
    const have = page.filter((r) => (counts.get(r) ?? 0) > 0).length;
    if (page.includes(ref) && have === page.length - 1) completing.push(ref);
    else base.set(ref, v);
  }
  for (const ref of completing) {
    const m = mult(meta.get(ref)?.set ?? setOf(ref));
    const book = meta.get(ref)?.book ?? 0;
    base.set(ref, m !== undefined && book > 0 ? m * book : (zeroValues.get(ref) ?? 0));
  }
  for (const [set, refs] of sets) {
    const m = mult(set);
    if (m === undefined) continue;
    for (const r of refs) if (!base.has(r)) base.set(r, m * (meta.get(r)?.book ?? 0));
  }
  return { rules, base, meta, pages, sets };
}

/** Value of a collection at our values: copies with decreasing marginals + page and set bonus. */
export function portfolioValue(counts: Map<string, number>, model: ValueModel): number {
  let v = 0;
  for (const [ref, n] of counts) {
    const b = model.base.get(ref) ?? 0;
    for (let k = 1; k <= n; k++) v += b * marginal(model.rules, k);
  }
  const has = (r: string) => (counts.get(r) ?? 0) > 0;
  const sum = (refs: string[]) => refs.reduce((s, r) => s + (model.base.get(r) ?? 0), 0);
  for (const [set, page] of model.pages) {
    if (page.length === 0 || !page.every(has)) continue;
    v += model.rules.pageBonus * sum(page);
    const all = model.sets.get(set) ?? [];
    if (all.every(has)) v += model.rules.masterBonus * sum(all);
  }
  return v;
}

export function applyCards(counts: Map<string, number>, give: string[], get: string[]): Map<string, number> {
  const c = new Map(counts);
  for (const r of give) c.set(r, (c.get(r) ?? 0) - 1);
  for (const r of get) c.set(r, (c.get(r) ?? 0) + 1);
  for (const [r, n] of c) if (n <= 0) c.delete(r);
  return c;
}

/** Cambio de valor de cartas si damos `give` y recibimos `get`. */
export function valueDelta(counts: Map<string, number>, give: string[], get: string[], model: ValueModel): number {
  return portfolioValue(applyCards(counts, give, get), model) - portfolioValue(counts, model);
}

/**
 * Penalty for removing our ONLY copy of a nearly complete page (≥ `protectHave` cards, not yet
 * complete): the bonus we would stop collecting. An already complete page is already counted by `portfolioValue`.
 */
export function pageRisk(counts: Map<string, number>, give: string[], model: ValueModel, protectHave: number): number {
  const after = applyCards(counts, give, []);
  let risk = 0;
  for (const page of model.pages.values()) {
    const before = page.filter((r) => (counts.get(r) ?? 0) > 0).length;
    if (before < protectHave || before >= page.length) continue;
    if (page.some((r) => give.includes(r) && (counts.get(r) ?? 0) > 0 && !after.has(r))) {
      risk += model.rules.pageBonus * page.reduce((s, r) => s + (model.base.get(r) ?? 0), 0);
    }
  }
  return risk;
}

// ---------------------------------------------------------------- fees and limit prices

export interface FeeModel {
  /** El Rastro: 5 % = 500 bps. */
  bps: number;
  perCard: number;
}
export const RASTRO_FEES: FeeModel = { bps: 500, perCard: 1 };

/** Fee of a deal, rounded up (the feed shows 9 P → 2 P). Assumed to be paid by us. */
export function tradeFee(cash: number, cards: number, fees: FeeModel): number {
  if (cash <= 0 && cards <= 0) return 0;
  return Math.ceil((Math.max(0, cash) * fees.bps) / 10_000 + cards * fees.perCard - 1e-9);
}

/** Minimum integer price at which to sell a card that costs us `loss` and still earn `margin` after fee. */
export function minAsk(loss: number, margin: number, fees: FeeModel): number {
  let p = Math.max(1, Math.ceil((loss + margin + fees.perCard) / (1 - fees.bps / 10_000)));
  while (p - tradeFee(p, 1, fees) - loss < margin) p++;
  while (p > 1 && p - 1 - tradeFee(p - 1, 1, fees) - loss >= margin) p--;
  return p;
}

/** Maximum integer bid for a card worth `gain` to us leaving `margin` after fee (0 = no bid possible). */
export function maxBid(gain: number, margin: number, fees: FeeModel): number {
  let b = Math.floor((gain - margin - fees.perCard) / (1 + fees.bps / 10_000));
  while (b >= 1 && gain - b - tradeFee(b, 1, fees) < margin) b--;
  return Math.max(0, b);
}

// ---------------------------------------------------------------- price references (feed and board)

export interface Quote {
  ref: string;
  rarity: string | undefined;
  price: number;
}

/** Single-card settlements between teams at a venue (`/api/feed`, type `settlement`): price per card. */
export function parseSettlements(raw: unknown): Quote[] {
  const events = raw && typeof raw === "object" && Array.isArray((raw as { events?: unknown }).events) ? (raw as { events: unknown[] }).events : Array.isArray(raw) ? raw : [];
  const out: Quote[] = [];
  for (const e of events) {
    if (!e || typeof e !== "object" || (e as { type?: unknown }).type !== "settlement") continue;
    const p = (e as { payload?: Record<string, unknown> }).payload ?? {};
    const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
    if (!p.venue || p.persona || items.length !== 1 || typeof p.price !== "number" || p.price <= 0) continue;
    const it = items[0]!;
    if (typeof it.ref !== "string") continue;
    out.push({ ref: it.ref, rarity: typeof it.rarity === "string" ? it.rarity : undefined, price: p.price });
  }
  return out;
}

/** Single-card cash sales (asks) and single-card cash purchases (bids), excluding ours. */
export function boardQuotes(board: TradeOffer[], mineIds: Set<number>, model: ValueModel, tick: number): { asks: Quote[]; bids: Quote[] } {
  const asks: Quote[] = [];
  const bids: Quote[] = [];
  for (const o of board) {
    if (mineIds.has(o.id) || (o.status ?? "open") !== "open" || (o.expires_tick != null && o.expires_tick <= tick) || o.to) continue;
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.unsupported.length || w.unsupported.length) continue;
    if (g.assets.length === 1 && g.cards.length === 0 && g.cash === 0 && w.cash > 0 && w.assets.length === 0 && w.cards.length === 0 && g.assets[0]?.ref) {
      const ref = g.assets[0].ref;
      asks.push({ ref, rarity: model.meta.get(ref)?.rarity, price: w.cash });
    } else if (g.cash > 0 && g.assets.length === 0 && g.cards.length === 0 && w.cash === 0 && w.assets.length === 0 && w.cards.length === 1 && w.cards[0]) {
      const ref = w.cards[0];
      bids.push({ ref, rarity: model.meta.get(ref)?.rarity, price: g.cash });
    }
  }
  return { asks, bids };
}

export interface PriceRef {
  price: number;
  source: string;
}

/**
 * Reference price of a card: median of that card's settlements, then of its rarity; if none,
 * median of what is asked on the board (card, then rarity); otherwise its book.
 */
export function priceReference(ref: string, model: ValueModel, settlements: Quote[], asks: Quote[]): PriceRef | undefined {
  const rarity = model.meta.get(ref)?.rarity;
  const tiers: [string, number[]][] = [
    ["settled card", settlements.filter((q) => q.ref === ref).map((q) => q.price)],
    [`settled ${rarity ?? "?"}`, settlements.filter((q) => rarity !== undefined && (q.rarity ?? model.meta.get(q.ref)?.rarity) === rarity).map((q) => q.price)],
    ["asks card", asks.filter((q) => q.ref === ref).map((q) => q.price)],
    [`asks ${rarity ?? "?"}`, asks.filter((q) => rarity !== undefined && q.rarity === rarity).map((q) => q.price)],
  ];
  for (const [source, xs] of tiers) {
    const m = median(xs);
    if (m !== undefined) return { price: m, source: `${source} n=${xs.length}` };
  }
  const book = model.meta.get(ref)?.book;
  return book ? { price: book, source: "book" } : undefined;
}

// ---------------------------------------------------------------- parameters and state

export interface TradeParams {
  fees: FeeModel;
  /** Minimum absolute margin (P) of value created to accept, list or bid. */
  minMargin: number;
  /** Minimum margin relative to the deal's cash when accepting. */
  marginFrac: number;
  /** "Nearly complete" page to protect: distinct cards we already hold. */
  protectPageHave: number;
  /** We ask slightly above the reference (settlements, otherwise board). */
  askPremium: number;
  /** With no comparable bids for that card, we bid this fraction of the reference. */
  bidDiscount: number;
  expiresInTicks: number;
  /** Slow repricing: only offers at least this old, in steps of `repriceFrac` (min. 1 P). */
  repriceAfterTicks: number;
  repriceFrac: number;
  /** Tope de ofertas abiertas nuestras en El Rastro. */
  maxOffers: number;
  /** Run spend cap (accepted purchases + open bids, with fee). */
  maxSpend: number;
  maxBids: number;
  maxNewPerTick: number;
  /** Cash never spent below this (acceptances and open bids). */
  cashFloor: number;
  /** After this many postings of the same listing with no fill and no visible bid, reposts back off exponentially. */
  relistBackoffAfter: number;
  /** Extra ask premium on a card another team asked for or that brings a team within 2 of a page (`TradeState.rivals`). */
  demandPremium: number;
}

export const DEFAULT_TRADE_PARAMS: TradeParams = {
  fees: RASTRO_FEES,
  minMargin: 2,
  marginFrac: 0.1,
  protectPageHave: 8,
  askPremium: 0.05,
  bidDiscount: 0.9,
  expiresInTicks: 40,
  repriceAfterTicks: 10,
  repriceFrac: 0.05,
  maxOffers: 16,
  maxSpend: 60,
  maxBids: 12,
  maxNewPerTick: 12,
  cashFloor: 0,
  relistBackoffAfter: 3,
  demandPremium: 0.15,
};

/**
 * What we know of other teams, from public structure only (`GameState.rivals`, see `tradeSignals` in
 * `src/state/rivals.ts`): who would pay more for a card, and which cards a rival recently held. It never sets a figure
 * by itself: it only adds a premium above our floor and ranks bids within the same page distance.
 */
export interface RivalSignals {
  /** Card → teams that asked for it or that it leaves at most 2 from a page. */
  demand: Map<string, string[]>;
  /** Cards a rival was seen (or confirmed) holding recently: a bid on them can fill. */
  supply: Set<string>;
}

export interface TradeState {
  tick: number;
  myId: string;
  cash: number;
  held: HeldAsset[];
  /** Sets with a page in the album: bid candidates. */
  pageSets: string[];
  board: TradeOffer[];
  mine: TradeOffer[];
  toMe: TradeOffer[];
  /** Liquidaciones recientes entre equipos (referencia de precio). */
  settlements: Quote[];
  model: ValueModel;
  /** Server limits in force (`/api/clock` → limits). */
  limits: { offersPerTick: number; maxOpenOffers: number; acceptsPerTick: number };
  /** Already spent in this run. */
  spent: number;
  /** Committed assets (acceptance pending settlement). */
  reserved: Set<number>;
  /** Listings backing off (asset id → tick until which it is neither reposted nor repriced). */
  listBackoff?: Map<number, number>;
  /** Other teams' demand and supply (only when the coordinator has `GameState.rivals`). */
  rivals?: RivalSignals;
}

export interface Evaluation {
  offer: TradeOffer;
  source: "board" | "to_me";
  kind: "buy" | "sell" | "swap" | "unknown";
  ok: boolean;
  reason: string;
  getCards: string[];
  giveCards: string[];
  payAssets: number[];
  cashNet: number;
  cardDelta: number;
  fee: number;
  risk: number;
  valueCreated: number;
  required: number;
  /** Net cash outflow (what counts against `maxSpend`). */
  spend: number;
}

export interface OfferBody {
  venue: "rastro";
  give: { assets: number[] } | { cash: number };
  want: { cash: number } | { cards: string[] };
  expires_in_ticks: number;
}

export interface PlannedPost {
  key: string;
  kind: "list" | "bid";
  ref: string;
  price: number;
  /** Value created if filled at that price (with fee). */
  value: number;
  /** Suelo (venta) o techo (puja) a nuestros valores. */
  limit: number;
  reference: PriceRef | undefined;
  why: "new" | "reprice" | "safety";
  replaces?: number;
  body: OfferBody;
}

export interface TickPlan {
  tick: number;
  /** Offers read (board + addressed to us). */
  evaluated: number;
  /** Those we could accept (excluding ours, expired, foreign, without the requested card or not valuable). */
  opportunities: Evaluation[];
  accept?: Evaluation;
  cancels: { id: number; reason: string }[];
  posts: PlannedPost[];
  notes: string[];
  openAfter: number;
  committedAfter: number;
  /** Median of settlements by rarity (what the dry-run shows). */
  settledByRarity: Record<string, { n: number; median: number }>;
}

// ---------------------------------------------------------------- evaluation of others' offers

function blank(offer: TradeOffer, source: Evaluation["source"], reason: string): Evaluation {
  return { offer, source, kind: "unknown", ok: false, reason, getCards: [], giveCards: [], payAssets: [], cashNet: 0, cardDelta: 0, fee: 0, risk: 0, valueCreated: 0, required: 0, spend: 0 };
}

/** Valor creado a nuestros valores si aceptamos `offer` (recibimos su `give`, entregamos su `want`). */
export function evaluateOffer(offer: TradeOffer, source: Evaluation["source"], state: TradeState, params: TradeParams, mineIds: Set<number>, counts = countHoldings(state.held)): Evaluation {
  if (mineIds.has(offer.id) || offer.maker === state.myId) return blank(offer, source, "own");
  if ((offer.status ?? "open") !== "open") return blank(offer, source, "not-open");
  if (offer.expires_tick != null && offer.expires_tick <= state.tick) return blank(offer, source, "expired");
  if (offer.to && offer.to !== state.myId) return blank(offer, source, "addressed-to-other");
  if (!offer.venue || offer.thread != null) return blank(offer, source, "not-a-venue-offer");
  const give = readSide(offer.give);
  const want = readSide(offer.want);
  if (give.unsupported.length || want.unsupported.length || give.cards.length || give.assets.some((a) => a.ref === null)) return blank(offer, source, "unsupported");

  const ownById = new Map(state.held.map((a) => [a.id, a]));
  const payAssets: number[] = [];
  const giveCards: string[] = [];
  for (const a of want.assets) {
    const mine = ownById.get(a.id);
    if (!mine || mine.locked || state.reserved.has(a.id)) return blank(offer, source, "missing-card");
    payAssets.push(a.id);
    giveCards.push(mine.ref);
  }
  for (const ref of want.cards) {
    const pick = state.held
      .filter((a) => a.ref === ref && !a.locked && !state.reserved.has(a.id) && !payAssets.includes(a.id))
      .sort((x, y) => y.id - x.id)[0];
    if (!pick) return blank(offer, source, "missing-card");
    payAssets.push(pick.id);
    giveCards.push(ref);
  }
  const getCards = give.assets.map((a) => a.ref as string);
  const cashNet = give.cash - want.cash;
  const fee = tradeFee(give.cash + want.cash, getCards.length + giveCards.length, params.fees);
  const cardDelta = valueDelta(counts, giveCards, getCards, state.model);
  const risk = pageRisk(counts, giveCards, state.model, params.protectPageHave);
  const valueCreated = cardDelta + cashNet - fee - risk;
  const required = Math.max(params.minMargin, params.marginFrac * (give.cash + want.cash));
  const spend = Math.max(0, want.cash + fee - give.cash);
  const kind: Evaluation["kind"] = getCards.length && !giveCards.length ? "buy" : giveCards.length && !getCards.length ? "sell" : "swap";
  const base = { offer, source, kind, getCards, giveCards, payAssets, cashNet, cardDelta, fee, risk, valueCreated, required, spend };
  if (getCards.length === 0 && giveCards.length === 0) return { ...base, ok: false, reason: "no-cards" };
  if (want.cash > state.cash) return { ...base, ok: false, reason: "insufficient-cash" };
  if (valueCreated < required) return { ...base, ok: false, reason: "below-margin" };
  return { ...base, ok: true, reason: "value" };
}

// ---------------------------------------------------------------- tick plan

interface ExistingOffer {
  offer: TradeOffer;
  kind: "list" | "bid";
  key: string;
  ref: string;
  price: number;
  assetId?: number;
}

function classifyMine(o: TradeOffer, held: HeldAsset[]): ExistingOffer | undefined {
  const g = readSide(o.give);
  const w = readSide(o.want);
  if (g.assets.length === 1 && g.cash === 0 && w.cash > 0 && w.cards.length === 0 && w.assets.length === 0) {
    const id = g.assets[0]!.id;
    const ref = g.assets[0]!.ref ?? held.find((a) => a.id === id)?.ref ?? "?";
    return { offer: o, kind: "list", key: `list:${id}`, ref, price: w.cash, assetId: id };
  }
  if (g.cash > 0 && g.assets.length === 0 && w.cash === 0 && w.cards.length === 1 && w.assets.length === 0) {
    const ref = w.cards[0]!;
    return { offer: o, kind: "bid", key: `bid:${ref}`, ref, price: g.cash };
  }
  return undefined;
}

const listBody = (assetId: number, price: number, p: TradeParams): OfferBody => ({ venue: "rastro", give: { assets: [assetId] }, want: { cash: price }, expires_in_ticks: p.expiresInTicks });
const bidBody = (ref: string, price: number, p: TradeParams): OfferBody => ({ venue: "rastro", give: { cash: price }, want: { cards: [ref] }, expires_in_ticks: p.expiresInTicks });

/** Next price with slow repricing: towards `target` at most one step of `repriceFrac` (min. 1 P). */
export function slowReprice(current: number, target: number, frac: number): number {
  const step = Math.max(1, Math.round(current * frac));
  return current + Math.max(-step, Math.min(step, target - current));
}

function settledByRarity(settlements: Quote[], model: ValueModel): TickPlan["settledByRarity"] {
  const groups = new Map<string, number[]>();
  for (const q of settlements) {
    const r = q.rarity ?? model.meta.get(q.ref)?.rarity ?? "?";
    groups.set(r, [...(groups.get(r) ?? []), q.price]);
  }
  return Object.fromEntries([...groups].sort(([a], [b]) => a.localeCompare(b)).map(([r, xs]) => [r, { n: xs.length, median: median(xs) ?? 0 }]));
}

/**
 * Decides a tick: at most one acceptance (the one with the most value created that fits in cash and `maxSpend`),
 * cancellations (our invalid or over-budget offers), slow reprices and new offers
 * (duplicates for sale, bids for page cards) within `maxOffers`, the server limit and
 * the per-tick creations. Pure and deterministic.
 */
export function planTick(state: TradeState, params: TradeParams): TickPlan {
  const notes: string[] = [];
  // Directed offers of ours (`to` set: rival-page listings) belong to the markets route: their assets are busy here.
  const directed = state.mine.filter((o) => o.to && (o.status ?? "open") === "open").flatMap((o) => readSide(o.give).assets.map((a) => a.id));
  if (directed.length) state = { ...state, reserved: new Set([...state.reserved, ...directed]) };
  const mineIds = new Set(state.mine.map((o) => o.id));
  let counts = countHoldings(state.held);
  const seen = new Set<number>();
  const evals: Evaluation[] = [];
  for (const [list, source] of [
    [state.toMe, "to_me"],
    [state.board, "board"],
  ] as const) {
    for (const o of list) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      evals.push(evaluateOffer(o, source, state, params, mineIds, counts));
    }
  }
  const opportunities = evals
    .filter((e) => !["own", "not-open", "expired", "addressed-to-other", "not-a-venue-offer", "missing-card", "unsupported"].includes(e.reason))
    .sort((a, b) => b.valueCreated - a.valueCreated || a.offer.id - b.offer.id);

  const budget = params.maxSpend - state.spent;
  const spendable = state.cash - params.cashFloor;
  let accept: Evaluation | undefined;
  if (state.limits.acceptsPerTick >= 1) {
    accept = opportunities.find((e) => e.ok && e.spend <= budget && e.spend <= spendable);
    const blocked = opportunities.find((e) => e.ok && e !== accept && (e.spend > budget || e.spend > spendable));
    if (blocked && (!accept || blocked.valueCreated > accept.valueCreated)) notes.push(`offer #${blocked.offer.id} has value ${blocked.valueCreated.toFixed(1)} but needs ${blocked.spend} P > budget ${budget.toFixed(0)}`);
  }
  const reserved = new Set(state.reserved);
  if (accept) {
    for (const id of accept.payAssets) reserved.add(id);
    counts = applyCards(counts, accept.giveCards, accept.getCards);
  }
  const acceptSpend = accept?.spend ?? 0;
  const acceptCash = accept ? Math.max(0, readSide(accept.offer.want).cash - readSide(accept.offer.give).cash) : 0;
  const { asks, bids } = boardQuotes(state.board, mineIds, state.model, state.tick);
  const fees = params.fees;

  // Our El Rastro offers (those in dealer threads and directed ones, `to` set, are left alone but still count as open).
  const nonRastroOpen = state.mine.filter((o) => (o.status ?? "open") === "open" && !(o.venue === "rastro" && o.thread == null && !o.to)).length;
  const existing = state.mine
    .filter((o) => (o.status ?? "open") === "open" && o.venue === "rastro" && o.thread == null && !o.to && (o.expires_tick == null || o.expires_tick > state.tick))
    .flatMap((o) => {
      const c = classifyMine(o, state.held);
      return c ? [c] : [];
    });
  const listedAssets = new Set(existing.filter((e) => e.assetId !== undefined).map((e) => e.assetId as number));
  const heldIds = new Set(state.held.map((a) => a.id));

  // Duplicates: surplus copies and their sequential loss at our values. Copies locked or busy elsewhere (dealer
  // threads, pending acceptances) count as already gone, so one free copy always stays for the album; copies we
  // already list come first (no churn), then the highest id.
  const spares: { assetId: number; ref: string; loss: number }[] = [];
  for (const [ref, n] of [...counts].sort(([a], [b]) => a.localeCompare(b))) {
    if (n < 2) continue;
    const copies = state.held
      .filter((a) => a.ref === ref && (!a.locked || listedAssets.has(a.id)) && !reserved.has(a.id))
      .sort((x, y) => Number(listedAssets.has(y.id)) - Number(listedAssets.has(x.id)) || y.id - x.id);
    let c = applyCards(counts, Array<string>(Math.max(0, n - copies.length)).fill(ref), []);
    for (const a of copies.slice(0, copies.length - 1)) {
      const loss = -valueDelta(c, [ref], [], state.model);
      spares.push({ assetId: a.id, ref, loss });
      c = applyCards(c, [ref], []);
    }
  }
  // Demand from other teams lifts the ask (never the floor): base = reference (or floor) × (1 + premium).
  const demanded = (ref: string) => (state.rivals?.demand.get(ref)?.length ?? 0) > 0;
  const listTarget = (ref: string, loss: number) => {
    const floor = minAsk(loss, params.minMargin, fees);
    const reference = priceReference(ref, state.model, state.settlements, asks);
    const extra = demanded(ref) ? params.demandPremium : 0;
    const target = Math.max(floor, reference ? Math.ceil(reference.price * (1 + params.askPremium + extra)) : Math.ceil(floor * (1 + extra)));
    return { floor, reference, target };
  };

  // Bids: page cards we don't hold from the album's sets; `missing` = page cards still missing (fewer first).
  const bidTargets = new Map<string, { cap: number; target: number; value: number; reference: PriceRef | undefined; gain: number; missing: number }>();
  for (const set of state.pageSets) {
    const page = state.model.pages.get(set) ?? [];
    const missing = page.filter((r) => (counts.get(r) ?? 0) === 0).length;
    for (const ref of page) {
      if ((counts.get(ref) ?? 0) > 0) continue;
      const gain = valueDelta(counts, [], [ref], state.model);
      const cap = maxBid(gain, params.minMargin, fees);
      if (cap < 1) continue;
      const sameBids = bids.filter((q) => q.ref === ref).map((q) => q.price);
      let reference: PriceRef | undefined;
      let target: number;
      if (sameBids.length) {
        reference = { price: Math.max(...sameBids), source: `best bid n=${sameBids.length}` };
        target = Math.min(cap, reference.price + 1);
      } else {
        reference = priceReference(ref, state.model, state.settlements, asks);
        target = Math.min(cap, reference ? Math.max(1, Math.floor(reference.price * params.bidDiscount)) : cap);
      }
      bidTargets.set(ref, { cap, target, value: gain - target - tradeFee(target, 1, fees), reference, gain, missing });
    }
  }

  const cancels: TickPlan["cancels"] = [];
  const posts: PlannedPost[] = [];
  const kept: ExistingOffer[] = [];
  let newSlots = Math.min(state.limits.offersPerTick, params.maxNewPerTick);
  const tryPost = (p: PlannedPost): boolean => {
    if (newSlots <= 0) return false;
    newSlots -= 1;
    posts.push(p);
    return true;
  };

  // Existing listings: valid ones are kept; below the floor are repriced now; old ones, slowly.
  for (const e of existing.filter((x) => x.kind === "list")) {
    const id = e.assetId as number;
    if (!heldIds.has(id) || reserved.has(id)) {
      cancels.push({ id: e.offer.id, reason: `asset ${id} no longer available` });
      continue;
    }
    const spare = spares.find((s) => s.assetId === id);
    if (!spare) {
      // Selling it would leave no free copy of the card (another copy is busy elsewhere or gone): keep it for the album.
      cancels.push({ id: e.offer.id, reason: `asset ${id} is our last free ${e.ref} (album copy)` });
      continue;
    }
    const { floor, target, reference } = listTarget(e.ref, spare.loss);
    const loss = spare.loss;
    const age = state.tick - (e.offer.created_tick ?? state.tick);
    const backingOff = (state.listBackoff?.get(id) ?? -Infinity) > state.tick && !bids.some((q) => q.ref === e.ref);
    let price = e.price;
    let why: PlannedPost["why"] | undefined;
    if (e.price < floor) {
      price = floor;
      why = "safety";
    } else if (!backingOff && age >= params.repriceAfterTicks && target !== e.price) {
      price = Math.max(floor, slowReprice(e.price, target, params.repriceFrac));
      if (price !== e.price) why = "reprice";
    }
    if (why) {
      const post: PlannedPost = { key: e.key, kind: "list", ref: e.ref, price, value: price - tradeFee(price, 1, fees) - loss, limit: floor, reference, why, replaces: e.offer.id, body: listBody(id, price, params) };
      if (tryPost(post)) {
        cancels.push({ id: e.offer.id, reason: `${why} ${e.price} → ${price}` });
        continue;
      }
      if (why === "safety") {
        cancels.push({ id: e.offer.id, reason: `below floor ${floor}, no slot to repost` });
        continue;
      }
    }
    kept.push(e);
  }

  // Existing bids: invalid out; above the ceiling, to the ceiling now; budget by value.
  let committed = 0;
  let bidCount = 0;
  const bidBudget = Math.min(budget - acceptSpend, spendable - acceptCash);
  // Bids closest to completing a page first, then cards a rival recently held (a bid can fill), then by value created.
  const unsupplied = (ref: string) => (state.rivals && !state.rivals.supply.has(ref) ? 1 : 0);
  const bidRank = (ref: string): [number, number, number] => {
    const t = bidTargets.get(ref);
    return t ? [t.missing, unsupplied(ref), -t.value] : [1e9, 1, 0];
  };
  const byRank = (ra: string, rb: string): number => {
    const [ma, sa, va] = bidRank(ra);
    const [mb, sb, vb] = bidRank(rb);
    return ma - mb || sa - sb || va - vb;
  };
  const existingBids = existing.filter((x) => x.kind === "bid").sort((a, b) => byRank(a.ref, b.ref) || a.offer.id - b.offer.id);
  const bidRefs = new Set<string>();
  for (const e of existingBids) {
    const t = bidTargets.get(e.ref);
    if (!t || bidRefs.has(e.ref)) {
      cancels.push({ id: e.offer.id, reason: bidRefs.has(e.ref) ? `duplicate bid ${e.ref}` : `bid ${e.ref} no longer wanted at our values` });
      continue;
    }
    const age = state.tick - (e.offer.created_tick ?? state.tick);
    let price = e.price;
    let why: PlannedPost["why"] | undefined;
    if (e.price > t.cap) {
      price = t.cap;
      why = "safety";
    } else if (age >= params.repriceAfterTicks && t.target !== e.price) {
      price = Math.min(t.cap, slowReprice(e.price, t.target, params.repriceFrac));
      if (price !== e.price) why = "reprice";
    }
    const cost = price + tradeFee(price, 1, fees);
    if (committed + cost > bidBudget || bidCount >= params.maxBids) {
      cancels.push({ id: e.offer.id, reason: bidCount >= params.maxBids ? "over --max-bids" : "over --max-spend budget" });
      continue;
    }
    if (why) {
      const post: PlannedPost = { key: e.key, kind: "bid", ref: e.ref, price, value: t.gain - price - tradeFee(price, 1, fees), limit: t.cap, reference: t.reference, why, replaces: e.offer.id, body: bidBody(e.ref, price, params) };
      if (tryPost(post)) {
        cancels.push({ id: e.offer.id, reason: `${why} ${e.price} → ${price}` });
        committed += cost;
        bidCount += 1;
        bidRefs.add(e.ref);
        continue;
      }
      if (why === "safety") {
        cancels.push({ id: e.offer.id, reason: `above cap ${t.cap}, no slot to repost` });
        continue;
      }
    }
    committed += e.price + tradeFee(e.price, 1, fees);
    bidCount += 1;
    bidRefs.add(e.ref);
    kept.push(e);
  }

  const openCap = Math.min(params.maxOffers, state.limits.maxOpenOffers - nonRastroOpen);
  let open = kept.length + posts.length;

  // New listings of duplicates (by value created), then new bids (by value created).
  const newLists = spares
    .filter((s) => !listedAssets.has(s.assetId) && !((state.listBackoff?.get(s.assetId) ?? -Infinity) > state.tick && !bids.some((q) => q.ref === s.ref)))
    .map((s) => {
      const { floor, target, reference } = listTarget(s.ref, s.loss);
      return { s, floor, target, reference, value: target - tradeFee(target, 1, fees) - s.loss };
    })
    .sort((a, b) => b.value - a.value || a.s.assetId - b.s.assetId);
  for (const l of newLists) {
    if (open >= openCap) {
      notes.push(`listing ${l.s.ref} skipped: open-offer cap ${openCap} (--max-offers)`);
      break;
    }
    if (!tryPost({ key: `list:${l.s.assetId}`, kind: "list", ref: l.s.ref, price: l.target, value: l.value, limit: l.floor, reference: l.reference, why: "new", body: listBody(l.s.assetId, l.target, params) })) {
      notes.push("new listings stopped: offers-per-tick limit");
      break;
    }
    open += 1;
  }
  const newBids = [...bidTargets]
    .filter(([ref, t]) => !bidRefs.has(ref) && t.value >= params.minMargin)
    .sort(([ra], [rb]) => byRank(ra, rb) || ra.localeCompare(rb));
  const overBudget: string[] = [];
  for (const [ref, t] of newBids) {
    if (bidCount >= params.maxBids || open >= openCap || newSlots <= 0) break;
    const cost = t.target + tradeFee(t.target, 1, fees);
    if (committed + cost > bidBudget) {
      overBudget.push(`${ref}@${t.target}`);
      continue;
    }
    tryPost({ key: `bid:${ref}`, kind: "bid", ref, price: t.target, value: t.value, limit: t.cap, reference: t.reference, why: "new", body: bidBody(ref, t.target, params) });
    committed += cost;
    bidCount += 1;
    open += 1;
  }

  if (overBudget.length) notes.push(`${overBudget.length} bids skipped by --max-spend budget: ${overBudget.join(" ")}`);
  if (state.rivals) {
    const lifted = posts.filter((p) => p.kind === "list" && demanded(p.ref)).map((p) => `${p.ref}@${p.price} (${state.rivals!.demand.get(p.ref)!.join(",")})`);
    const supplied = posts.filter((p) => p.kind === "bid" && state.rivals!.supply.has(p.ref)).map((p) => p.ref);
    notes.push(`rivals: ${state.rivals.demand.size} cards in demand, ${state.rivals.supply.size} held by a rival${lifted.length ? ` · listings +${Math.round(params.demandPremium * 100)}%: ${lifted.join(" ")}` : ""}${supplied.length ? ` · bids with a known holder: ${supplied.join(" ")}` : ""}`);
  }
  const plan: TickPlan = { tick: state.tick, evaluated: evals.length, opportunities, cancels, posts, notes, openAfter: open, committedAfter: committed, settledByRarity: settledByRarity(state.settlements, state.model) };
  if (accept) plan.accept = accept;
  return plan;
}

// ---------------------------------------------------------------- salida legible

function describeSide(side: Side): string {
  const parts: string[] = [];
  if (side.cash) parts.push(`${side.cash} P`);
  for (const a of side.assets) parts.push(a.ref ?? `#${a.id}`);
  for (const c of side.cards) parts.push(`any ${c}`);
  for (const u of side.unsupported) parts.push(`?${u}`);
  return parts.join(" + ") || "nothing";
}

const f1 = (x: number) => (x >= 0 ? "+" : "") + x.toFixed(1);
const refText = (r: PriceRef | undefined) => (r ? `${r.price} (${r.source})` : "-");

export function formatTickPlan(plan: TickPlan, opts: { top?: number; dryRun?: boolean } = {}): string[] {
  const top = opts.top ?? 10;
  const lines: string[] = [];
  lines.push(`Trades plan · tick ${plan.tick} · ${plan.evaluated} offers read, ${plan.opportunities.length} actionable, valued at our private values (fees included)`);
  const settled = Object.entries(plan.settledByRarity);
  lines.push(`Settled team trades (feed): ${settled.length ? settled.map(([r, s]) => `${r} n=${s.n} median ${s.median}`).join(" · ") : "none"}`);
  lines.push(`Top opportunities (value created if WE accept):`);
  for (const e of plan.opportunities.slice(0, top)) {
    const they = `${describeSide(readSide(e.offer.give))} for ${describeSide(readSide(e.offer.want))}`;
    lines.push(
      `  #${e.offer.id} [${e.source}] ${e.kind.padEnd(4)} ${they.padEnd(28)} value ${f1(e.valueCreated).padStart(6)} (cards ${f1(e.cardDelta)}, cash ${f1(e.cashNet)}, fee -${e.fee}${e.risk ? `, page risk -${e.risk.toFixed(1)}` : ""}) need ≥${e.required.toFixed(1)} → ${e.ok ? "OK" : e.reason}`,
    );
  }
  if (plan.opportunities.length === 0) lines.push("  (none)");
  lines.push(plan.accept ? `Accept: #${plan.accept.offer.id} (${plan.accept.kind}, value ${f1(plan.accept.valueCreated)}${plan.accept.payAssets.length ? `, paying asset ${plan.accept.payAssets.join(",")}` : ""})` : "Accept: none");
  lines.push(`Cancels: ${plan.cancels.length ? "" : "none"}`);
  for (const c of plan.cancels) lines.push(`  #${c.id}: ${c.reason}`);
  const lists = plan.posts.filter((p) => p.kind === "list");
  const bids = plan.posts.filter((p) => p.kind === "bid");
  lines.push(`Listings to post: ${lists.length ? "" : "none"}`);
  for (const p of lists) lines.push(`  SELL ${p.ref} (asset ${(p.body.give as { assets: number[] }).assets[0]}) at ${p.price} P · floor ${p.limit} · ref ${refText(p.reference)} · value ${f1(p.value)} · ${p.why}${p.replaces ? ` (replaces #${p.replaces})` : ""}`);
  lines.push(`Bids to post: ${bids.length ? "" : "none"}`);
  for (const p of bids) lines.push(`  BUY  ${p.ref} at ${p.price} P · cap ${p.limit} · ref ${refText(p.reference)} · value ${f1(p.value)} · ${p.why}${p.replaces ? ` (replaces #${p.replaces})` : ""}`);
  lines.push(`Open offers after: ${plan.openAfter} · bid cash committed: ${plan.committedAfter} P`);
  for (const n of plan.notes) lines.push(`  note: ${n}`);
  if (opts.dryRun) lines.push("DRY-RUN: nothing sent.");
  return lines;
}
