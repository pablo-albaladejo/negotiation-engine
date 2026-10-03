import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Catalog } from "../shared/schemas.js";
import { readSide, type TradeOffer } from "../trades/trades.js";
import type { FeedEvent } from "./world.js";

/**
 * Price sheet: one entry per catalog card (published sets; a new set enters only when its
 * `released` becomes true), with scarcity, dealers that sell or buy it, best ask and bid in El Rastro and in other
 * venues (not counting our own), last deal price from the feed, our private value, how many we hold and
 * the derived gaps. Structure only: no text. Private values are for local use.
 */

export interface Quote {
  price: number;
  venue: string;
  offer: number;
}

export interface PriceEntry {
  ref: string;
  name?: string;
  set: string;
  rarity?: string;
  book?: number;
  printRun?: number;
  minted?: number;
  /** minted / print_run (1 = sold out). */
  scarcity?: number;
  hidden: boolean;
  dealers: { sells: string[]; buys: string[] };
  /** Best ask and bid among the venues where we can trade (ours does not count). */
  bestAsk?: Quote;
  bestBid?: Quote;
  /** Per venue: best ask and bid and depth (open single-card offers per side). */
  byVenue: Record<string, { ask?: Quote; bid?: Quote; asks: number; bids: number }>;
  /** Last single-card deal in the feed (`settlement`); without it, unknown. */
  lastTrade?: { price: number; tick: number };
  value?: number;
  holdings: number;
  /** value − bestAsk: what we gain by buying at the best ask. */
  buyEdge?: number;
  /** bestBid − value: what we gain by selling at the best bid. */
  sellEdge?: number;
  /**
   * ASSUMPTION (neg_points anomaly): with a dealer, going above the book gains nothing more, so the useful cap
   * of a dealer deal is min(value, book).
   */
  dealerCap?: number;
  completesPage: boolean;
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

/** Single card on a side (asset with `ref` or type `card:REF`), or undefined if there is more than one or none. */
function singleCard(side: TradeOffer["give"]): string | undefined {
  const s = readSide(side);
  const refs = [...s.assets.map((a) => a.ref), ...s.cards];
  return refs.length === 1 && refs[0] && s.unsupported.length === 0 ? refs[0] : undefined;
}

/** Does the persona sell or buy this card? Menu by rarity (`sets: "released"` or a list) or by card. */
function menuHas(entries: unknown, ref: string, set: string, rarity: string | undefined): boolean {
  if (!Array.isArray(entries)) return false;
  return entries.map(obj).some((e) => {
    if (typeof e.card === "string") return e.card === ref;
    if (typeof e.rarity !== "string" || e.rarity !== rarity) return false;
    const sets = e.sets;
    return sets === undefined || sets === null || sets === "released" || sets === "all" || (Array.isArray(sets) && sets.includes(set)) || sets === set;
  });
}

export interface PriceInputs {
  catalog?: Catalog;
  dealers: readonly unknown[];
  /** Open offers per venue (El Rastro and others). */
  boards: readonly { venue: string; offers: readonly TradeOffer[] }[];
  team?: string;
  /** Venues where we cannot trade (ours: RULES "You cannot trade on your own venue"). */
  untradeable?: ReadonlySet<string>;
  events: readonly FeedEvent[];
  values: Readonly<Record<string, number>>;
  holdings: Readonly<Record<string, number>>;
  pages: readonly { set: string; have: number; of: number }[];
  pageTargets: readonly string[];
}

export function buildPriceSheet(i: PriceInputs): PriceEntry[] {
  const asks = new Map<string, Quote>();
  const bids = new Map<string, Quote>();
  const byVenue = new Map<string, PriceEntry["byVenue"]>();
  const slot = (ref: string, venue: string) => {
    const m = byVenue.get(ref) ?? {};
    byVenue.set(ref, m);
    return (m[venue] ??= { asks: 0, bids: 0 });
  };
  for (const b of i.boards) {
    const tradeable = !i.untradeable?.has(b.venue);
    for (const o of b.offers) {
      if ((o.status ?? "open") !== "open" || (i.team && o.maker === i.team) || (o.to && o.to !== i.team)) continue;
      const give = readSide(o.give);
      const want = readSide(o.want);
      const sold = singleCard(o.give);
      if (sold && give.cash === 0 && want.cash > 0 && !want.assets.length && !want.cards.length) {
        const q = { price: want.cash, venue: b.venue, offer: o.id };
        const v = slot(sold, b.venue);
        v.asks += 1;
        if (!v.ask || q.price < v.ask.price) v.ask = q;
        const cur = asks.get(sold);
        if (tradeable && (!cur || q.price < cur.price || (q.price === cur.price && b.venue === "rastro"))) asks.set(sold, q);
      }
      const bought = singleCard(o.want);
      if (bought && want.cash === 0 && give.cash > 0 && !give.assets.length && !give.cards.length) {
        const q = { price: give.cash, venue: b.venue, offer: o.id };
        const v = slot(bought, b.venue);
        v.bids += 1;
        if (!v.bid || q.price > v.bid.price) v.bid = q;
        const cur = bids.get(bought);
        if (tradeable && (!cur || q.price > cur.price || (q.price === cur.price && b.venue === "rastro"))) bids.set(bought, q);
      }
    }
  }
  const last = new Map<string, { price: number; tick: number }>();
  for (const e of i.events) {
    if (e.type !== "settlement") continue;
    const items = Array.isArray(e.payload.items) ? e.payload.items.map(obj) : [];
    const price = num(e.payload.price);
    if (items.length !== 1 || price === undefined || items[0]!.kind !== "card" || typeof items[0]!.ref !== "string") continue;
    const prev = last.get(items[0]!.ref);
    if (!prev || e.tick >= prev.tick) last.set(items[0]!.ref, { price, tick: e.tick });
  }
  const out: PriceEntry[] = [];
  for (const s of i.catalog?.sets ?? []) {
    if ((s as { released?: unknown }).released === false) continue;
    const setId = s.id ?? "?";
    const page = i.pages.find((p) => p.set === setId);
    for (const c of s.cards) {
      const raw = c as typeof c & { hidden?: unknown; minted?: unknown };
      const value = i.values[c.id];
      const ask = asks.get(c.id);
      const bid = bids.get(c.id);
      const book = num(c.book);
      const printRun = num(c.print_run);
      const minted = num(raw.minted);
      const held = i.holdings[c.id] ?? 0;
      const sells = i.dealers.filter((d) => menuHas(obj(obj(d).menu).sells, c.id, setId, c.rarity)).map((d) => String(obj(d).id));
      const buys = i.dealers.filter((d) => menuHas(obj(obj(d).menu).buys, c.id, setId, c.rarity)).map((d) => String(obj(d).id));
      const lt = last.get(c.id);
      out.push({
        ref: c.id,
        ...(c.name ? { name: c.name } : {}),
        set: setId,
        ...(c.rarity ? { rarity: c.rarity } : {}),
        ...(book !== undefined ? { book } : {}),
        ...(printRun !== undefined ? { printRun } : {}),
        ...(minted !== undefined ? { minted } : {}),
        ...(minted !== undefined && printRun ? { scarcity: Math.round((minted / printRun) * 100) / 100 } : {}),
        hidden: raw.hidden === true,
        dealers: { sells, buys },
        ...(ask ? { bestAsk: ask } : {}),
        ...(bid ? { bestBid: bid } : {}),
        byVenue: byVenue.get(c.id) ?? {},
        ...(lt ? { lastTrade: lt } : {}),
        ...(value !== undefined ? { value } : {}),
        holdings: held,
        ...(value !== undefined && ask ? { buyEdge: Math.round((value - ask.price) * 10) / 10 } : {}),
        ...(value !== undefined && bid ? { sellEdge: Math.round((bid.price - value) * 10) / 10 } : {}),
        ...(value !== undefined && book !== undefined ? { dealerCap: Math.min(value, book) } : {}),
        completesPage: i.pageTargets.includes(c.id) || (!!page && held === 0 && page.have === page.of - 1),
      });
    }
  }
  return out;
}

/** Cards without a known value that matter most (with an ask or bid in view), to request few per tick. */
export function valuesWanted(sheet: readonly PriceEntry[], max: number): string[] {
  return sheet
    .filter((e) => e.value === undefined && !e.hidden && (e.bestAsk || e.bestBid))
    .sort((a, b) => Number(b.completesPage) - Number(a.completesPage) || (b.bestBid?.price ?? 0) - (a.bestBid?.price ?? 0))
    .slice(0, max)
    .map((e) => e.ref);
}

// ---------------------------------------------------------------- private values cache

/** `results/bazaar-live/values.json`: values already requested from `/api/me/value` (private, outside git). */
export const defaultValuesFile = (root: string) => join(root, "results", "bazaar-live", "values.json");

export function loadValueCache(file: string): { values: Map<string, number>; at: number } {
  if (!existsSync(file)) return { values: new Map(), at: 0 };
  try {
    const d = obj(JSON.parse(readFileSync(file, "utf8")));
    const at = typeof d.updated === "string" ? Date.parse(d.updated) : 0;
    return { values: new Map(Object.entries(obj(d.values)).flatMap(([k, v]) => (num(v) !== undefined ? [[k, num(v)!] as const] : []))), at: Number.isFinite(at) ? at : 0 };
  } catch {
    // Corrupt cache: values are requested again little by little.
    return { values: new Map(), at: 0 };
  }
}

export function saveValueCache(file: string, values: ReadonlyMap<string, number>): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ updated: new Date().toISOString(), values: Object.fromEntries(values) }, null, 2)}\n`);
  renameSync(tmp, file);
}

export function formatPriceSheet(sheet: readonly PriceEntry[]): string[] {
  const q = (x?: Quote) => (x ? `${x.price}@${x.venue}#${x.offer}` : "-");
  const buy = sheet.filter((e) => e.buyEdge !== undefined).sort((a, b) => b.buyEdge! - a.buyEdge!).slice(0, 5);
  const sell = sheet.filter((e) => e.sellEdge !== undefined && e.holdings > 0).sort((a, b) => b.sellEdge! - a.sellEdge!).slice(0, 5);
  const known = sheet.filter((e) => e.value !== undefined).length;
  return [
    `prices: ${sheet.length} cards · ${known} values known · ${sheet.filter((e) => e.bestAsk).length} with ask · ${sheet.filter((e) => e.bestBid).length} with bid · ${sheet.filter((e) => e.lastTrade).length} with last trade`,
    `top buy edges (value − ask): ${buy.map((e) => `${e.ref} ${e.buyEdge! >= 0 ? "+" : ""}${e.buyEdge} (ask ${q(e.bestAsk)}${e.completesPage ? ", page" : ""})`).join(" · ") || "-"}`,
    `top sell edges (bid − value, held): ${sell.map((e) => `${e.ref} ${e.sellEdge! >= 0 ? "+" : ""}${e.sellEdge} (bid ${q(e.bestBid)}, x${e.holdings})`).join(" · ") || "-"}`,
  ];
}

// ---------------------------------------------------------------- venues

export interface VenueInfo {
  id: string;
  name?: string;
  owner?: string;
  ownerName?: string;
  /** Owner's rank and figure on the leaderboard (for the rival penalty). */
  ownerRank?: number;
  ownerScore?: number;
  house: boolean;
  feeBps: number;
  feePerCard: number;
  mechanism?: string;
  status?: string;
  /** Open offers in its book (all cards). */
  depth: number;
  /** Ours: we cannot trade in it with our key. */
  canTrade: boolean;
}

export function buildVenues(raw: readonly unknown[], boards: readonly { venue: string; offers: readonly TradeOffer[] }[], team: string | undefined, ranks: ReadonlyMap<string, { rank?: number; score?: number }>): VenueInfo[] {
  return raw.map(obj).flatMap((v) => {
    const id = typeof v.venue === "string" ? v.venue : undefined;
    if (!id) return [];
    const owner = typeof v.owner === "string" ? v.owner : undefined;
    const r = owner ? ranks.get(owner) : undefined;
    const mech = obj(v.rules).mechanism;
    return [
      {
        id,
        ...(typeof v.name === "string" ? { name: v.name } : {}),
        ...(owner ? { owner } : {}),
        ...(typeof v.owner_name === "string" ? { ownerName: v.owner_name } : {}),
        ...(r?.rank !== undefined ? { ownerRank: r.rank } : {}),
        ...(r?.score !== undefined ? { ownerScore: r.score } : {}),
        house: v.house === true,
        feeBps: num(v.fee_bps) ?? 0,
        feePerCard: num(v.fee_per_card) ?? 0,
        ...(typeof mech === "string" ? { mechanism: mech } : {}),
        ...(typeof v.status === "string" ? { status: v.status } : {}),
        depth: boards.find((b) => b.venue === id)?.offers.filter((o) => (o.status ?? "open") === "open").length ?? 0,
        canTrade: !owner || owner !== team,
      },
    ];
  });
}

export function formatVenues(vs: readonly VenueInfo[]): string[] {
  return vs.map((v) => `  ${v.id} ${v.name ?? ""} · owner ${v.house ? "house" : `${v.ownerName ?? v.owner ?? "?"} (rank ${v.ownerRank ?? "?"}, ${v.ownerScore ?? "?"})`} · fee ${v.feeBps / 100}% + ${v.feePerCard} P/card · ${v.mechanism ?? "?"} · ${v.status ?? "?"} · depth ${v.depth}${v.canTrade ? "" : " · OURS: can't trade"}`);
}
