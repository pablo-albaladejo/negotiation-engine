import { z } from "zod";
import type { FeedEvent } from "../bazaar-board-core.js";

/**
 * Directed offers BETWEEN OTHER TEAMS (`offer.listed` with a `to` on the public stream the recorder saves): they never
 * show in the venue books, and they tell who wants what and at what price. Structure only (cards, cash, teams, ticks);
 * their text is never read. Outcome: cancelled (`offer.cancelled`), filled (a settlement between the same two teams with
 * the same card and price, after it was listed), expired, or open. Read-only.
 */

const num = z.number();
const str = z.string();
const SideSchema = z.looseObject({ cash: num.nullish(), assets: z.array(z.looseObject({ ref: str.nullish() })).nullish(), types: z.array(str).nullish() });
const OfferSchema = z.looseObject({ id: num, maker: str.nullish(), to: str.nullish(), venue: str.nullish(), give: SideSchema.nullish(), want: SideSchema.nullish(), created_tick: num.nullish(), expires_tick: num.nullish() });
const ListedSchema = z.looseObject({ offer: OfferSchema });
const CancelledSchema = z.looseObject({ offer: num });
const SettledSchema = z.looseObject({ parties: z.array(str).nullish(), items: z.array(z.looseObject({ ref: str.nullish() })).nullish(), price: num.nullish(), tick: num.nullish() });

export interface DirectedOffer {
  id: number;
  tick: number | null;
  maker: string;
  to: string;
  venue: string | null;
  /** «sells» (gives cards for cash), «buys» (gives cash for cards) or «swap». */
  side: "sells" | "buys" | "swap";
  /** Cards that change hands (what the maker gives on a sale, wants on a buy; both on a swap). */
  refs: string[];
  price: number;
  status: "open" | "filled" | "cancelled" | "expired";
  expires_tick: number | null;
  /** Our copies of the (single) card, and whether we have a spare (hand ≥ 2). */
  hand: number | null;
  spare: boolean;
}

const cardOf = (t: string) => t.replace(/^card:/, "");

export function directedOffersOf(events: readonly FeedEvent[], tick: number | null, team: string, hand: Readonly<Record<string, number>>, window = 60): DirectedOffer[] {
  const since = tick !== null ? tick - window : -Infinity;
  const listed = new Map<number, { e: FeedEvent; o: z.infer<typeof OfferSchema> }>();
  const cancelled = new Set<number>();
  const settled: z.infer<typeof SettledSchema>[] = [];
  for (const e of events) {
    if ((e.tick ?? -Infinity) < since - 20) continue;
    if (e.type === "offer.listed") {
      const p = ListedSchema.safeParse(e.payload);
      if (!p.success) continue;
      const o = p.data.offer;
      if (!o.to || !o.maker || o.maker === team || o.to === team) continue;
      if ((o.created_tick ?? e.tick ?? -Infinity) < since) continue;
      listed.set(o.id, { e, o });
    } else if (e.type === "offer.cancelled") {
      const p = CancelledSchema.safeParse(e.payload);
      if (p.success) cancelled.add(p.data.offer);
    } else if (e.type === "settlement") {
      const p = SettledSchema.safeParse(e.payload);
      if (p.success) settled.push({ ...p.data, tick: p.data.tick ?? e.tick ?? null });
    }
  }
  const out: DirectedOffer[] = [];
  for (const { e, o } of listed.values()) {
    const giveCards = (o.give?.assets ?? []).flatMap((a) => (a.ref ? [a.ref] : []));
    const wantCards = [...(o.want?.types ?? []).map(cardOf), ...(o.want?.assets ?? []).flatMap((a) => (a.ref ? [a.ref] : []))];
    const giveCash = o.give?.cash ?? 0;
    const wantCash = o.want?.cash ?? 0;
    const side = giveCards.length && !wantCards.length ? "sells" : wantCards.length && !giveCards.length ? "buys" : "swap";
    const refs = side === "sells" ? giveCards : side === "buys" ? wantCards : [...giveCards, ...wantCards];
    const price = side === "sells" ? wantCash : side === "buys" ? giveCash : Math.max(giveCash, wantCash);
    const created = o.created_tick ?? e.tick ?? 0;
    const filled = settled.some(
      (s) =>
        (s.parties ?? []).includes(o.maker!) &&
        (s.parties ?? []).includes(o.to!) &&
        (s.tick ?? 0) >= created &&
        (o.expires_tick == null || (s.tick ?? 0) <= o.expires_tick + 1) &&
        (s.price ?? 0) === price &&
        refs.every((r) => (s.items ?? []).some((i) => i.ref === r)),
    );
    const status = filled ? "filled" : cancelled.has(o.id) ? "cancelled" : o.expires_tick != null && tick !== null && tick > o.expires_tick ? "expired" : "open";
    const single = refs.length === 1 ? refs[0]! : null;
    const h = single !== null ? (hand[single] ?? 0) : null;
    out.push({ id: o.id, tick: created, maker: o.maker!, to: o.to!, venue: o.venue ?? null, side, refs, price, status, expires_tick: o.expires_tick ?? null, hand: h, spare: h !== null && h >= 2 });
  }
  return out.sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0) || b.id - a.id);
}
