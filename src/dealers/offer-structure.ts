import type { Side } from "./negotiator.js";
import { StandingOfferSchema, type StandingOffer, type Thread } from "../shared/schemas.js";
import { isDealer, type DealerRef } from "./view.js";

/**
 * Estructura de una oferta del dealer frente a lo que pedimos en el hilo. El precio no basta: en una venta solo
 * vale «nos da efectivo (> 0) y quiere exactamente nuestros activos»; en una compra, «nos da exactamente la carta
 * pedida y solo quiere efectivo ≤ nuestro límite». Cualquier otra forma (nos ofrece un sobre, pide efectivo en una
 * venta, quiere otros activos) no se acepta nunca: se cierra educadamente con la regla `structure-mismatch`.
 */

export type Expectation =
  | { side: "sell"; assetIds: readonly number[] }
  | {
      side: "buy";
      /** Carta pedida con `{buy: {card}}`. */
      card?: string;
      /** Rareza+set: la carta que da debe ser de esa rareza y set. */
      matches?: (ref: string) => boolean;
    };

export type MismatchReason = "dealer-selling" | "dealer-buying" | "no-cash" | "wants-other-assets" | "wrong-goods" | "over-limit";

export interface StructureCheck {
  ok: boolean;
  reason?: MismatchReason;
}

type OfferSide = NonNullable<StandingOffer["give"]>;

const list = (xs: readonly unknown[] | null | undefined): unknown[] => (Array.isArray(xs) ? [...xs] : []);
const cashOf = (s: OfferSide | null | undefined): number => (typeof s?.cash === "number" ? s.cash : 0);

/** Ids de activos de una oferta: el servidor manda objetos `{id, ref, ...}`; nosotros enviamos números. */
export function assetIdsOf(s: OfferSide | null | undefined): number[] {
  return list(s?.assets).flatMap((a) => (typeof a === "number" ? [a] : a && typeof a === "object" && typeof (a as { id?: unknown }).id === "number" ? [(a as { id: number }).id] : []));
}

/** Lo que trae una oferta en un lado: cartas (por ref) y cuántas cosas que no son cartas (sobres, tipos desconocidos). */
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

const hasGoods = (s: OfferSide | null | undefined) => list(s?.assets).length + list(s?.cards).length + list(s?.types).length > 0;

/**
 * Comprueba la forma de una oferta del dealer. Sin `accept`, se toleran huecos (aún no ha dicho qué carta da, o no
 * repite nuestros activos) y solo se rechaza lo que contradice el hilo (p. ej. nos vende algo en una venta).
 * Con `accept`, se exige la forma completa y, en compra, que su precio quepa en `maxCash`.
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
  const goods = goodsOf(give);
  const wrongCard = (ref: string) => (exp.card !== undefined && ref !== exp.card) || (exp.matches !== undefined && !exp.matches(ref));
  if (goods.other > 0 || goods.cards.length > 1 || goods.cards.some(wrongCard)) return { ok: false, reason: "wrong-goods" };
  if (!opts.accept) return { ok: true };
  if (goods.cards.length !== 1) return { ok: false, reason: "wrong-goods" };
  const price = cashOf(want);
  if (price <= 0) return { ok: false, reason: "no-cash" };
  if (opts.maxCash !== undefined && price > opts.maxCash) return { ok: false, reason: "over-limit" };
  return { ok: true };
}

/** Ofertas del dealer en el hilo (vigentes y de los mensajes), sin repetir, en orden de id. */
export function dealerOffers(thread: Thread, dealer: DealerRef): StandingOffer[] {
  const seen = new Map<number, StandingOffer>();
  const fromMessages = thread.messages.map((m) => StandingOfferSchema.safeParse(m.offer)).flatMap((r) => (r.success ? [r.data] : []));
  for (const o of [...fromMessages, ...thread.standing_offers]) if (isDealer(dealer, o.maker)) seen.set(o.id, o);
  return [...seen.values()].sort((a, b) => a.id - b.id);
}

/** Primera oferta del dealer que contradice el hilo (p. ej. nos vende un sobre en una venta), si la hay. */
export function firstMismatch(thread: Thread, dealer: DealerRef, exp: Expectation): { offer: StandingOffer; reason: MismatchReason } | undefined {
  for (const offer of dealerOffers(thread, dealer)) {
    const c = checkStructure(offer, exp);
    if (!c.ok) return { offer, reason: c.reason! };
  }
  return undefined;
}

/** Lo que esperamos de un hilo según su topic; `undefined` si el topic no se reconoce (entonces no se acepta nada). */
export function expectationOf(topic: unknown, side: Side, matches?: (ref: string) => boolean): Expectation | undefined {
  const t = topic as { buy?: { card?: string; rarity?: string }; sell?: { assets?: unknown[] } } | undefined;
  if (side === "sell") {
    const ids = list(t?.sell?.assets).filter((x): x is number => typeof x === "number");
    return ids.length ? { side, assetIds: ids } : undefined;
  }
  if (t?.buy?.card) return { side, card: t.buy.card };
  if (t?.buy?.rarity) return { side, ...(matches ? { matches } : {}) };
  return undefined;
}
