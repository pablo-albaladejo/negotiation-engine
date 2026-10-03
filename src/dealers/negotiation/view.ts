import type { HerOffer, Side } from "./negotiator.js";
import { StandingOfferSchema, type StandingOffer, type Thread } from "../../shared/schemas.js";

/** Structured reading of a thread with a dealer: price and offer fields only, never its text. */

export interface DealerRef {
  id: string;
  /** Names it may sign with (id, "Abuela Carmen"...). */
  aliases: readonly string[];
}

export function isDealer(dealer: DealerRef, who: string | null | undefined): boolean {
  if (!who) return false;
  const w = who.toLowerCase();
  return [dealer.id, ...dealer.aliases].some((a) => a && (w === a.toLowerCase() || w.includes(a.toLowerCase())));
}

/** Side of the thread from its topic: `{buy: ...}` = we buy; `{sell: ...}` = we sell. */
export function sideOfTopic(topic: unknown): Side | undefined {
  if (topic && typeof topic === "object") {
    if ("buy" in topic) return "buy";
    if ("sell" in topic) return "sell";
  }
  return undefined;
}

/** Price of a dealer offer: when buying, the cash it asks; when selling, the cash it gives. */
export function offerPrice(side: Side, offer: StandingOffer): number | undefined {
  return positive(side === "buy" ? offer.want?.cash : offer.give?.cash);
}

/** Price of an offer of ours: when buying, the cash we give; when selling, the cash we ask. */
export function ourOfferPrice(side: Side, offer: StandingOffer): number | undefined {
  return positive(side === "buy" ? offer.give?.cash : offer.want?.cash);
}

const positive = (cash: number | null | undefined) => (typeof cash === "number" && cash > 0 ? cash : undefined);

export interface ThreadPrices {
  herPrices: number[];
  herOpening?: number;
  herCurrent?: HerOffer;
  ourPrices: number[];
}

/** Our prices without consecutive repeats (a resend is not a concession). */
function dedupe(prices: number[]): number[] {
  return prices.filter((p, i) => i === 0 || p !== prices[i - 1]);
}

/**
 * Thread prices. The real server puts the price in each message's offer (`message.offer`,
 * `price` is usually null) and in `standing_offers`; `message.price` is used only if there is no offer.
 * We are the one who signs with `selfId` (e.g. "t02"); without `selfId`, anyone who is not the dealer.
 */
export function threadPrices(thread: Thread, side: Side, dealer: DealerRef, selfId?: string): ThreadPrices {
  const self = selfId ?? thread.team ?? undefined;
  const isUs = (who: string | null | undefined) => (self ? !!who && who.toLowerCase() === self.toLowerCase() : !isDealer(dealer, who));
  const herOffers = thread.standing_offers.filter((o) => isDealer(dealer, o.maker));
  const herPrices: number[] = [];
  const ourPrices: number[] = [];
  for (const m of thread.messages) {
    const offer = StandingOfferSchema.safeParse(m.offer);
    const who = (offer.success ? offer.data.maker : undefined) ?? m.sender;
    const mine = isUs(who);
    if (!mine && !isDealer(dealer, who)) continue;
    const fromOffer = offer.success ? (mine ? ourOfferPrice(side, offer.data) : offerPrice(side, offer.data)) : undefined;
    const price = fromOffer ?? positive(m.price);
    if (price !== undefined) (mine ? ourPrices : herPrices).push(price);
  }
  if (herPrices.length === 0) {
    for (const o of herOffers) {
      const p = offerPrice(side, o);
      if (p !== undefined) herPrices.push(p);
    }
  }
  if (ourPrices.length === 0) {
    for (const o of thread.standing_offers.filter((x) => isUs(x.maker))) {
      const p = ourOfferPrice(side, o);
      if (p !== undefined) ourPrices.push(p);
    }
  }
  const open = [...herOffers].reverse().find((o) => (o.status ?? "open") === "open" && offerPrice(side, o) !== undefined);
  const herCurrent: HerOffer | undefined = open ? { offerId: open.id, price: offerPrice(side, open)!, final: open.final === true } : undefined;
  if (herCurrent && herPrices[herPrices.length - 1] !== herCurrent.price) herPrices.push(herCurrent.price);
  return { herPrices, ...(herPrices.length ? { herOpening: herPrices[0]! } : {}), ...(herCurrent ? { herCurrent } : {}), ourPrices: dedupe(ourPrices) };
}
