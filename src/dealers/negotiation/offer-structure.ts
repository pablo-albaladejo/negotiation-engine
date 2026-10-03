import type { Side } from "./negotiator.js";
import { StandingOfferSchema, type StandingOffer, type Thread } from "../../shared/schemas.js";
import { isDealer, type DealerRef } from "./view.js";

/**
 * Structure of a dealer offer versus what we asked for in the thread. The price is not enough: in a sale only
 * «gives us cash (> 0) and wants exactly our assets» is valid; in a purchase, «gives us exactly the card
 * asked for and only wants cash ≤ our limit». Any other shape (offers us a pack, asks for cash in a
 * sale, wants other assets) is never accepted: we close politely with the rule `structure-mismatch`.
 */

export type Expectation =
  | { side: "sell"; assetIds: readonly number[] }
  | {
      side: "buy";
      /** Card asked for with `{buy: {card}}`. */
      card?: string;
      /** Rarity+set: the card it gives must be of that rarity and set. */
      matches?: (ref: string) => boolean;
      /** Pack asked for with `{buy: {pack}}`: it must give exactly one sealed pack of that type and nothing else. */
      pack?: string;
    };

export type MismatchReason = "dealer-selling" | "dealer-buying" | "no-cash" | "wants-other-assets" | "wrong-goods" | "over-limit";

export interface StructureCheck {
  ok: boolean;
  reason?: MismatchReason;
}

type OfferSide = NonNullable<StandingOffer["give"]>;

const list = (xs: readonly unknown[] | null | undefined): unknown[] => (Array.isArray(xs) ? [...xs] : []);
const cashOf = (s: OfferSide | null | undefined): number => (typeof s?.cash === "number" ? s.cash : 0);

/** Asset ids of an offer: the server sends objects `{id, ref, ...}`; we send numbers. */
export function assetIdsOf(s: OfferSide | null | undefined): number[] {
  return list(s?.assets).flatMap((a) => (typeof a === "number" ? [a] : a && typeof a === "object" && typeof (a as { id?: unknown }).id === "number" ? [(a as { id: number }).id] : []));
}

/** What an offer carries on one side: cards (by ref) and how many non-card things (packs, unknown types). */
export function goodsOf(s: OfferSide | null | undefined): { cards: string[]; other: number } {
  const cards: string[] = [];
  let other = 0;
  for (const a of list(s?.assets)) {
    const o = a && typeof a === "object" ? (a as { kind?: unknown; ref?: unknown }) : undefined;
    if (o && typeof o.ref === "string" && (o.kind === undefined || o.kind === null || o.kind === "card")) cards.push(o.ref);
    else other += 1;
  }
  for (const c of list(s?.cards)) {
    const ref = typeof c === "string" ? c : c && typeof c === "object" ? ((c as { ref?: unknown; id?: unknown }).ref ?? (c as { id?: unknown }).id) : undefined;
    if (typeof ref === "string") cards.push(ref);
    else other += 1;
  }
  for (const t of list(s?.types)) {
    if (typeof t === "string" && t.startsWith("card:")) cards.push(t.slice(5));
    else other += 1;
  }
  return { cards, other };
}

/** Packs an offer side carries (`types` "pack:sobre_barrio" or assets of kind pack) and how many other things. */
export function packsOf(s: OfferSide | null | undefined): { packs: string[]; other: number } {
  const packs: string[] = [];
  let other = list(s?.cards).length;
  for (const a of list(s?.assets)) {
    const o = a && typeof a === "object" ? (a as { kind?: unknown; ref?: unknown }) : undefined;
    if (o?.kind === "pack" && typeof o.ref === "string") packs.push(o.ref);
    else other += 1;
  }
  for (const t of list(s?.types)) {
    if (typeof t === "string" && t.startsWith("pack:")) packs.push(t.slice(5));
    else other += 1;
  }
  return { packs, other };
}

const hasGoods = (s: OfferSide | null | undefined) => list(s?.assets).length + list(s?.cards).length + list(s?.types).length > 0;

/**
 * Checks the shape of a dealer offer. Without `accept`, gaps are tolerated (it hasn't said yet which card it gives, or hasn't
 * repeated our assets) and only what contradicts the thread is rejected (e.g. it sells us something in a sale).
 * With `accept`, the full shape is required and, in a purchase, its price must fit `maxCash`.
 */
export function checkStructure(offer: StandingOffer, exp: Expectation, opts: { accept?: boolean; maxCash?: number } = {}): StructureCheck {
  const { give, want } = offer;
  if (exp.side === "sell") {
    if (hasGoods(give) || cashOf(want) > 0) return { ok: false, reason: "dealer-selling" };
    if (list(want?.cards).length || list(want?.types).length) return { ok: false, reason: "wants-other-assets" };
    const wanted = assetIdsOf(want);
    const expected = new Set(exp.assetIds);
    if (list(want?.assets).length !== wanted.length || wanted.some((id) => !expected.has(id))) return { ok: false, reason: "wants-other-assets" };
    if (!opts.accept) return { ok: true };
    if (cashOf(give) <= 0) return { ok: false, reason: "no-cash" };
    if (wanted.length !== expected.size || new Set(wanted).size !== expected.size) return { ok: false, reason: "wants-other-assets" };
    return { ok: true };
  }
  if (hasGoods(want) || cashOf(give) > 0) return { ok: false, reason: "dealer-buying" };
  if (exp.pack !== undefined) {
    const p = packsOf(give);
    if (p.other > 0 || p.packs.length > 1 || p.packs.some((x) => x !== exp.pack)) return { ok: false, reason: "wrong-goods" };
    if (!opts.accept) return { ok: true };
    if (p.packs.length !== 1) return { ok: false, reason: "wrong-goods" };
    return cashWithin(want, opts.maxCash);
  }
  const goods = goodsOf(give);
  const wrongCard = (ref: string) => (exp.card !== undefined && ref !== exp.card) || (exp.matches !== undefined && !exp.matches(ref));
  if (goods.other > 0 || goods.cards.length > 1 || goods.cards.some(wrongCard)) return { ok: false, reason: "wrong-goods" };
  if (!opts.accept) return { ok: true };
  if (goods.cards.length !== 1) return { ok: false, reason: "wrong-goods" };
  return cashWithin(want, opts.maxCash);
}

/** Buy accept: it asks for cash > 0 and within `maxCash`. */
function cashWithin(want: OfferSide | null | undefined, maxCash: number | undefined): StructureCheck {
  const price = cashOf(want);
  if (price <= 0) return { ok: false, reason: "no-cash" };
  if (maxCash !== undefined && price > maxCash) return { ok: false, reason: "over-limit" };
  return { ok: true };
}

/** Dealer offers in the thread (standing and from messages), without repeats, in id order. */
export function dealerOffers(thread: Thread, dealer: DealerRef): StandingOffer[] {
  const seen = new Map<number, StandingOffer>();
  const fromMessages = thread.messages.map((m) => StandingOfferSchema.safeParse(m.offer)).flatMap((r) => (r.success ? [r.data] : []));
  for (const o of [...fromMessages, ...thread.standing_offers]) if (isDealer(dealer, o.maker)) seen.set(o.id, o);
  return [...seen.values()].sort((a, b) => a.id - b.id);
}

/** First dealer offer that contradicts the thread (e.g. it sells us a pack in a sale), if any. */
export function firstMismatch(thread: Thread, dealer: DealerRef, exp: Expectation): { offer: StandingOffer; reason: MismatchReason } | undefined {
  for (const offer of dealerOffers(thread, dealer)) {
    const c = checkStructure(offer, exp);
    if (!c.ok) return { offer, reason: c.reason! };
  }
  return undefined;
}

/** What we expect from a thread according to its topic; `undefined` if the topic is not recognized (then nothing is accepted). */
export function expectationOf(topic: unknown, side: Side, matches?: (ref: string) => boolean): Expectation | undefined {
  const t = topic as { buy?: { card?: string; rarity?: string; pack?: string }; sell?: { assets?: unknown[] } } | undefined;
  if (side === "sell") {
    const ids = list(t?.sell?.assets).filter((x): x is number => typeof x === "number");
    return ids.length ? { side, assetIds: ids } : undefined;
  }
  if (t?.buy?.pack) return { side, pack: t.buy.pack };
  if (t?.buy?.card) return { side, card: t.buy.card };
  if (t?.buy?.rarity) return { side, ...(matches ? { matches } : {}) };
  return undefined;
}
