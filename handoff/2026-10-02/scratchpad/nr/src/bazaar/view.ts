import type { HerOffer, Side } from "./negotiator.js";
import type { StandingOffer, Thread } from "./schemas.js";

/** Lectura estructurada de un hilo con un dealer: solo campos de precio y oferta, nunca su texto. */

export interface DealerRef {
  id: string;
  /** Nombres con los que puede firmar (id, "Abuela Carmen"...). */
  aliases: readonly string[];
}

export function isDealer(dealer: DealerRef, who: string | null | undefined): boolean {
  if (!who) return false;
  const w = who.toLowerCase();
  return [dealer.id, ...dealer.aliases].some((a) => a && (w === a.toLowerCase() || w.includes(a.toLowerCase())));
}

/** Lado del hilo desde su topic: `{buy: ...}` = compramos; `{sell: ...}` = vendemos. */
export function sideOfTopic(topic: unknown): Side | undefined {
  if (topic && typeof topic === "object") {
    if ("buy" in topic) return "buy";
    if ("sell" in topic) return "sell";
  }
  return undefined;
}

/** Precio de una oferta del dealer: al comprar, el efectivo que pide; al vender, el que da. */
export function offerPrice(side: Side, offer: StandingOffer): number | undefined {
  const cash = side === "buy" ? offer.want?.cash : offer.give?.cash;
  return typeof cash === "number" ? cash : undefined;
}

export interface ThreadPrices {
  herPrices: number[];
  herOpening?: number;
  herCurrent?: HerOffer;
  ourPrices: number[];
}

export function threadPrices(thread: Thread, side: Side, dealer: DealerRef): ThreadPrices {
  const herOffers = thread.standing_offers.filter((o) => isDealer(dealer, o.maker));
  const herPrices: number[] = [];
  const ourPrices: number[] = [];
  for (const m of thread.messages) {
    if (typeof m.price !== "number") continue;
    (isDealer(dealer, m.sender) ? herPrices : ourPrices).push(m.price);
  }
  if (herPrices.length === 0) {
    for (const o of herOffers) {
      const p = offerPrice(side, o);
      if (p !== undefined) herPrices.push(p);
    }
  }
  const open = [...herOffers].reverse().find((o) => (o.status ?? "open") === "open" && offerPrice(side, o) !== undefined);
  const herCurrent: HerOffer | undefined = open ? { offerId: open.id, price: offerPrice(side, open)!, final: open.final === true } : undefined;
  if (herCurrent && herPrices[herPrices.length - 1] !== herCurrent.price) herPrices.push(herCurrent.price);
  return { herPrices, ...(herPrices.length ? { herOpening: herPrices[0]! } : {}), ...(herCurrent ? { herCurrent } : {}), ourPrices };
}
