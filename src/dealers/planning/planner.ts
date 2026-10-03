import type { Topic } from "../../shared/client.js";
import type { Side } from "../negotiation/negotiator.js";
import type { Catalog, Me } from "../../shared/schemas.js";

/**
 * What to negotiate with the dealer: sell duplicates (reservation = our your_value for that copy) and buy
 * missing cards to complete pages (reservation = your_value × safety, capped by the hour's
 * budget and cash). No network: private values arrive through `valueOf`.
 */

export interface Target {
  key: string;
  side: Side;
  topic: Topic;
  /** Private reservation (buy: maximum; sell: minimum). Only for the engine and the local trace. */
  reservation: number;
  label: string;
  /** Our private value of what is bought or sold (expected, if by rarity and set): a deal creates value if the price improves on it. */
  value?: number;
  /** Her published list for that rarity (cap on the sell anchor, `sellAnchorCapMult`); without it, no cap. */
  herList?: number | undefined;
}

const PAGE_RARITIES = new Set(["common", "uncommon", "rare"]);
const RARITY_BY_RUN: Record<number, string> = { 300: "common", 90: "uncommon", 30: "rare", 9: "epic", 3: "legendary" };

export function rarityOf(card: { rarity?: string | null | undefined; print_run?: number | null | undefined }): string | undefined {
  if (card.rarity) return card.rarity.toLowerCase();
  return card.print_run ? RARITY_BY_RUN[card.print_run] : undefined;
}

/** Duplicates: per card, we keep the copy we value most; the rest are offered. */
export function spareTargets(me: Me): Target[] {
  const byRef = new Map<string, Me["assets"]>();
  for (const a of me.assets) {
    if (a.kind !== "card" || a.locked) continue;
    byRef.set(a.ref, [...(byRef.get(a.ref) ?? []), a]);
  }
  const out: Target[] = [];
  for (const [ref, copies] of byRef) {
    if (copies.length < 2) continue;
    const sorted = [...copies].sort((x, y) => (y.your_value ?? 0) - (x.your_value ?? 0));
    for (const spare of sorted.slice(1)) {
      if (typeof spare.your_value !== "number") continue;
      out.push({
        key: `sell:${spare.id}`,
        side: "sell",
        topic: { sell: { assets: [spare.id] } },
        reservation: Math.max(1, Math.ceil(spare.your_value)),
        label: `sell spare ${ref}`,
        value: spare.your_value,
      });
    }
  }
  return out.sort((a, b) => b.reservation - a.reservation);
}

export interface MissingCard {
  id: string;
  set: string;
  book: number | undefined;
}

/** Page cards (common, uncommon, rare) we don't have; sets missing the fewest first. */
export function missingPageCards(me: Me, catalog: Catalog): MissingCard[] {
  const held = new Set(me.assets.filter((a) => a.kind === "card").map((a) => a.ref));
  const perSet: MissingCard[][] = [];
  for (const set of catalog.sets) {
    const missing = set.cards
      .filter((c) => PAGE_RARITIES.has(rarityOf(c) ?? "") && !held.has(c.id))
      .map((c) => ({ id: c.id, set: set.id ?? c.id.split("-")[0] ?? "", book: c.book ?? undefined }));
    if (missing.length) perSet.push(missing);
  }
  return perSet.sort((a, b) => a.length - b.length).flat();
}

export interface BuyPlanOptions {
  /** What is left of the hour's budget. */
  budget: number;
  cash: number;
  /** Fraction of your_value we are willing to pay (conservative). */
  safety: number;
  maxLookups: number;
}

export async function buyTargets(missing: readonly MissingCard[], valueOf: (card: string) => Promise<number>, o: BuyPlanOptions): Promise<Target[]> {
  const cap = Math.floor(Math.min(o.budget, o.cash));
  if (cap < 1) return [];
  const out: (Target & { surplus: number })[] = [];
  for (const card of missing.slice(0, o.maxLookups)) {
    const value = await valueOf(card.id);
    const reservation = Math.min(cap, Math.floor(value * o.safety));
    if (reservation < 1) continue;
    // If her book price is far above what we value the card at, an agreement zone is unlikely.
    if (card.book !== undefined && reservation < card.book * 0.6) continue;
    out.push({
      key: `buy:${card.id}`,
      side: "buy",
      topic: { buy: { card: card.id } },
      reservation,
      label: `buy missing ${card.id}`,
      surplus: value - (card.book ?? 0),
    });
  }
  return out.sort((a, b) => b.surplus - a.surplus).map(({ surplus: _s, ...t }) => t);
}

/**
 * Alternative if the dealer doesn't sell specific cards: `{buy: {rarity, set}}`. We may get
 * any card of that rarity and set (a duplicate too), so the reservation is the mean of
 * our value of all of them × safety. Only rarities the dealer sells and sets with gaps.
 */
export async function raritySetTargets(
  missing: readonly MissingCard[],
  catalog: Catalog,
  valueOf: (card: string) => Promise<number>,
  o: BuyPlanOptions & { rarities: readonly string[] },
): Promise<Target[]> {
  const cap = Math.floor(Math.min(o.budget, o.cash));
  if (cap < 1) return [];
  const out: (Target & { surplus: number })[] = [];
  let lookups = 0;
  for (const set of catalog.sets) {
    for (const rarity of o.rarities) {
      const cards = set.cards.filter((c) => rarityOf(c) === rarity);
      const setId = set.id ?? cards[0]?.id.split("-")[0];
      if (!setId || !cards.length || !missing.some((m) => m.set === setId && cards.some((c) => c.id === m.id))) continue;
      if (lookups + cards.length > o.maxLookups) continue;
      lookups += cards.length;
      const vals = await Promise.all(cards.map((c) => valueOf(c.id)));
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const reservation = Math.min(cap, Math.floor(mean * o.safety));
      const book = cards[0]?.book ?? undefined;
      if (reservation < 1 || (book !== undefined && reservation < book * 0.6)) continue;
      out.push({ key: `buy:${setId}:${rarity}`, side: "buy", topic: { buy: { rarity, set: setId } }, reservation, label: `buy ${rarity} ${setId}`, surplus: mean - (book ?? 0) });
    }
  }
  return out.sort((a, b) => b.surplus - a.surplus).map(({ surplus: _s, ...t }) => t);
}
