import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Conversation } from "../state/conversation.js";
import type { PriceEntry, VenueInfo } from "../state/prices.js";
import type { DealerTrade } from "./ledger.js";

/**
 * Forex chains (Pablo, 3 Oct): buy a card where it is cheap (A), hold the copy (B), sell it where it pays more (C).
 * Found every tick from the day's public dealer deals (`ledger.ts`) and the live venue books (El Rastro and the other
 * venues, with their fees). Each step carries its expected price; `current` marks the step we are on.
 * Structure only: prices from settlements and offers, never a dealer's text.
 */

/** Deals older than this (ticks, ~2 h at 30 s) no longer set a dealer's price. */
export const FOREX_WINDOW_TICKS = 240;
/** Dealer deals of a card at a price before that leg counts (a venue quote counts as one live sample). */
export const FOREX_MIN_SAMPLES = 3;
/** Smallest expected net margin (P, after fees) a chain must leave. */
export const FOREX_MIN_MARGIN = 8;
/** El Rastro fee (measured today: 2 P at 3–20, 4 at 44–55, 5 at 65–76, 6 at 82–88, 9 at 160), rounded up. */
export const rastroFee = (price: number): number => Math.ceil(2 + 0.04 * price);

export interface ForexLeg {
  /** Dealer id, or venue id (`rastro`, `v07`…). */
  at: string;
  kind: "dealer" | "venue";
  /** Expected price (median of recent deals, or the live quote), with its quartiles and samples. */
  price: number;
  lo: number;
  hi: number;
  n: number;
  fee: number;
  lastTick: number;
}

export interface ForexStep {
  kind: "buy" | "hold" | "sell";
  at: string;
  /** Expected cash for this step (buy: −price − fee; hold: 0; sell: +price − fee). */
  expected: number;
  label: string;
}

export interface ForexChain {
  id: string;
  card: string;
  rarity?: string;
  buy: ForexLeg;
  sell: ForexLeg;
  steps: ForexStep[];
  /** Expected net margin (sell − buy − fees) and the worst case (sell's low quartile − buy's high quartile − fees). */
  margin: number;
  worst: number;
  /** Both legs with dealers: the dealers planner runs it; otherwise shown only. */
  automated: boolean;
  /** Planner limits for an automated chain. */
  maxBuy: number;
  minSell: number;
  /** Step we are on (index in `steps`), or −1 when idle; `status` says why. */
  current: number;
  status: string;
  /** Round trips we completed today (bought at A and sold at C). */
  doneToday: number;
}

export interface ForexState {
  tick: number;
  chains: ForexChain[];
  /** Dealer deals in the window, and how many cards had both a cheap and a dear side. */
  trades: number;
  scanned: number;
}

export interface ForexInput {
  tick: number;
  trades: readonly DealerTrade[];
  prices: readonly PriceEntry[];
  venues: readonly VenueInfo[];
  team?: string;
  holdings: Record<string, number>;
  conversations: readonly Conversation[];
}

const quantile = (xs: readonly number[], q: number): number => {
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  return s[lo]! + (s[Math.ceil(i)]! - s[lo]!) * (i - lo);
};
const r1 = (x: number) => Math.round(x * 10) / 10;

function venueFee(venues: readonly VenueInfo[], id: string, price: number): number {
  if (id === "rastro") return rastroFee(price);
  const v = venues.find((x) => x.id === id);
  return v ? Math.ceil((price * v.feeBps) / 10_000 + v.feePerCard) : rastroFee(price);
}

/** Dealer legs per card: `sells` = where we can buy, `buys` = where we can sell. */
function dealerLegs(trades: readonly DealerTrade[], tick: number): Map<string, { sells: ForexLeg[]; buys: ForexLeg[]; rarity?: string }> {
  const groups = new Map<string, DealerTrade[]>();
  for (const t of trades) {
    if (t.tick < tick - FOREX_WINDOW_TICKS) continue;
    const k = `${t.ref}|${t.dealer}|${t.side}`;
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  const out = new Map<string, { sells: ForexLeg[]; buys: ForexLeg[]; rarity?: string }>();
  for (const [k, ts] of groups) {
    if (ts.length < FOREX_MIN_SAMPLES) continue;
    const [ref, dealer, side] = k.split("|") as [string, string, "sells" | "buys"];
    const ps = ts.map((t) => t.price);
    const leg: ForexLeg = { at: dealer, kind: "dealer", price: r1(quantile(ps, 0.5)), lo: r1(quantile(ps, 0.25)), hi: r1(quantile(ps, 0.75)), n: ps.length, fee: 0, lastTick: Math.max(...ts.map((t) => t.tick)) };
    const e = out.get(ref) ?? { sells: [], buys: [], ...(ts[0]!.rarity ? { rarity: ts[0]!.rarity } : {}) };
    e[side].push(leg);
    out.set(ref, e);
  }
  return out;
}

/** Where we are in an automated chain: a buy thread at A, a copy to resell (beyond our first), or a sell thread at C. */
function stepOf(c: Pick<ForexChain, "card" | "buy" | "sell">, input: ForexInput): { current: number; status: string } {
  const open = (who: string, side: "buy" | "sell") => input.conversations.find((v) => v.kind === "dealer" && v.counterparty === who && v.side === side && v.asset.ref === c.card && v.phase !== "done");
  const held = input.holdings[c.card] ?? 0;
  const selling = open(c.sell.at, "sell");
  if (selling) return { current: 2, status: `selling to ${c.sell.at} (${selling.id})` };
  if (held > 1) return { current: 1, status: `holding ${held - 1} copy to resell (our first stays)` };
  const buying = open(c.buy.at, "buy");
  if (buying) return { current: 0, status: `buying from ${c.buy.at} (${buying.id})` };
  return { current: -1, status: held ? "idle: next is the buy" : "idle: we lack the card, so the first copy stays in the album" };
}

export function findChains(input: ForexInput): ForexState {
  const legs = dealerLegs(input.trades, input.tick);
  const chains: ForexChain[] = [];
  const refs = new Set([...legs.keys(), ...input.prices.filter((p) => p.bestAsk || p.bestBid).map((p) => p.ref)]);
  let scanned = 0;
  for (const ref of refs) {
    const entry = input.prices.find((p) => p.ref === ref);
    if (entry?.hidden) continue;
    const d = legs.get(ref);
    const buys: ForexLeg[] = [...(d?.sells ?? [])];
    const sells: ForexLeg[] = [...(d?.buys ?? [])];
    for (const [venue, q] of Object.entries(entry?.byVenue ?? {})) {
      if (q.ask) buys.push({ at: venue, kind: "venue", price: q.ask.price, lo: q.ask.price, hi: q.ask.price, n: 1, fee: venueFee(input.venues, venue, q.ask.price), lastTick: input.tick });
      if (q.bid) sells.push({ at: venue, kind: "venue", price: q.bid.price, lo: q.bid.price, hi: q.bid.price, n: 1, fee: venueFee(input.venues, venue, q.bid.price), lastTick: input.tick });
    }
    if (!buys.length || !sells.length) continue;
    scanned++;
    for (const b of buys) {
      for (const s of sells) {
        if (b.at === s.at) continue;
        const fees = b.fee + s.fee;
        const margin = r1(s.price - b.price - fees);
        if (margin < FOREX_MIN_MARGIN) continue;
        // Run only between dealers and on a card we hold: a bought copy of a card we lack would stay in the album unsold.
        const lacking = !(input.holdings[ref] ?? 0);
        const automated = b.kind === "dealer" && s.kind === "dealer" && !lacking;
        const maxBuy = Math.floor(Math.min(b.hi, s.lo - fees - FOREX_MIN_MARGIN));
        const minSell = Math.ceil(Math.max(maxBuy + fees + FOREX_MIN_MARGIN, s.lo));
        const base = { card: ref, buy: b, sell: s };
        const step = automated ? stepOf(base, input) : { current: -1, status: lacking ? "shown only: we lack the card, a bought copy would stay in the album" : "shown only: a venue leg is not automated" };
        const mine = input.team ? input.trades.filter((t) => t.team === input.team && t.ref === ref) : [];
        const doneToday = Math.min(mine.filter((t) => t.dealer === b.at && t.side === "sells").length, mine.filter((t) => t.dealer === s.at && t.side === "buys").length);
        chains.push({
          id: `${ref}:${b.at}->${s.at}`,
          card: ref,
          ...((entry?.rarity ?? d?.rarity) !== undefined ? { rarity: (entry?.rarity ?? d?.rarity)! } : {}),
          buy: b,
          sell: s,
          steps: [
            { kind: "buy", at: b.at, expected: -(b.price + b.fee), label: `buy ${ref} at ${b.at} ~${b.price}${b.fee ? ` + fee ${b.fee}` : ""}` },
            { kind: "hold", at: "us", expected: 0, label: `hold the copy (${r1(b.price + b.fee)} P tied up)` },
            { kind: "sell", at: s.at, expected: s.price - s.fee, label: `sell to ${s.at} ~${s.price}${s.fee ? ` − fee ${s.fee}` : ""}` },
          ],
          margin,
          worst: r1(s.lo - b.hi - fees),
          automated,
          maxBuy,
          minSell,
          ...step,
          doneToday,
        });
      }
    }
  }
  chains.sort((a, b) => Number(b.current >= 0) - Number(a.current >= 0) || Number(b.automated) - Number(a.automated) || b.margin - a.margin);
  return { tick: input.tick, chains, trades: input.trades.filter((t) => t.tick >= input.tick - FOREX_WINDOW_TICKS).length, scanned };
}

/** `forex.json` in the day folder for the viewer's «Forex» tab (atomic, best effort). */
export function writeForex(dir: string, s: ForexState): void {
  try {
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "forex.json");
    writeFileSync(`${path}.tmp`, JSON.stringify({ ...s, updated: new Date().toISOString() }));
    renameSync(`${path}.tmp`, path);
  } catch {
    // The view is optional; a failed write never stops the tick.
  }
}
