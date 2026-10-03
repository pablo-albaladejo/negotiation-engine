import { RASTRO_FEES, tradeFee, type FeeModel } from "../trades/trades.js";
import type { Me } from "../shared/schemas.js";
import { SettlementSchema, StreamOfferSchema, type DecisionNote, type StreamEvent, type StreamOffer } from "./sources.js";

/**
 * Replays the recorder stream (team + public, in server id order) over a baseline `/api/me`: a book per card id (when,
 * at what price and from where it came in and went out), our trades with the copies held before each one, the order
 * book of every venue at the moment of each of our trades, and our own listings and cancellations. Pure: the same
 * events give the same ledger, so `--watch` simply replays everything after reading the new bytes.
 */

export interface Baseline {
  source: string;
  tick: number;
  /** Card assets with real ids (from a recorded `/api/me`) or synthetic negative ids (from `plan.jsonl` counts). */
  cards: { id: number; ref: string }[];
}

export interface Lot {
  id: number;
  ref: string;
  inTick: number;
  /** `baseline`, `pack`, `gift`, `dealer:<persona>`, `venue:<venue>` or `unknown` (an asset we sent but never saw come in). */
  inFrom: string;
  inPrice?: number;
  inSettlement?: number;
  inThread?: number;
  outTick?: number;
  outTo?: string;
  outPrice?: number;
  outFee?: number;
  outSettlement?: number;
}

export interface Quote {
  offer: number;
  venue: string;
  maker: string;
  price: number;
  /** Price net of the venue fee (bids) or plus it (asks). */
  net: number;
}

export interface OurTrade {
  settlement: number;
  tick: number;
  side: "buy" | "sell" | "swap";
  ref: string;
  assetId: number;
  /** Cash of the settlement split evenly over its cards. */
  price: number;
  fee: number;
  venue?: string;
  persona?: string;
  counterparty?: string;
  thread?: number;
  reservation?: number;
  /** Copies of `ref` we held just before (ledger count). */
  copiesBefore: number;
  /** All our copies by ref just before. */
  countsBefore: Map<string, number>;
  bestBid?: Quote;
  bestAsk?: Quote;
}

export interface OfferChurn {
  offer: number;
  side: "buy" | "sell";
  ref: string;
  tick: number;
}

export interface Ledger {
  team: string;
  baseline?: Baseline;
  lots: Lot[];
  trades: OurTrade[];
  cancels: OfferChurn[];
  lastTick: number;
  /** Our spend (cash paid on buys, plus fees) per tick. */
  spendByTick: Map<number, number>;
}

interface BookEntry {
  offer: StreamOffer;
  venue: string;
  side: "bid" | "ask";
  ref: string;
  cash: number;
  assetId?: number;
}

const cardRef = (t: string): string | undefined => (t.startsWith("card:") ? t.slice(5) : undefined);

/** A single-card cash bid or ask; anything else (swaps, bundles, rarity kinds) is not a quote. */
function classify(o: StreamOffer, venue: string): BookEntry | undefined {
  const giveAssets = o.give?.assets ?? [];
  const giveTypes = o.give?.types ?? [];
  const wantAssets = o.want?.assets ?? [];
  const wantTypes = o.want?.types ?? [];
  const giveCash = o.give?.cash ?? 0;
  const wantCash = o.want?.cash ?? 0;
  if (giveCash > 0 && giveAssets.length === 0 && giveTypes.length === 0 && wantAssets.length === 0 && wantTypes.length === 1 && wantCash === 0) {
    const ref = cardRef(wantTypes[0]!);
    return ref ? { offer: o, venue, side: "bid", ref, cash: giveCash } : undefined;
  }
  if (wantCash > 0 && giveCash === 0 && giveAssets.length === 1 && giveTypes.length === 0 && wantAssets.length === 0 && wantTypes.length === 0) {
    const a = giveAssets[0]!;
    if (typeof a === "number" || !a.ref || (a.kind ?? "card") !== "card") return undefined;
    return { offer: o, venue, side: "ask", ref: a.ref, cash: wantCash, assetId: a.id };
  }
  return undefined;
}

/** Ref and side of one of our own listings (cards or packs), for churn. */
function ourListing(o: StreamOffer): { side: "buy" | "sell"; ref: string } | undefined {
  const give = o.give?.assets ?? [];
  const wantTypes = o.want?.types ?? [];
  const g = give[0];
  if (g !== undefined) {
    if (typeof g === "number") return { side: "sell", ref: `asset:${g}` };
    return { side: "sell", ref: (g.kind ?? "card") === "card" && g.ref ? g.ref : `pack:${g.ref ?? g.id}` };
  }
  const w = wantTypes[0];
  if (w) return { side: "buy", ref: cardRef(w) ?? w };
  return undefined;
}

export interface ReplayInput {
  team: string;
  events: StreamEvent[];
  baseline?: Baseline;
  decisions: DecisionNote[];
}

export function replay(input: ReplayInput): Ledger {
  const { team } = input;
  const events = [...input.events].sort((a, b) => a.id - b.id);
  const held = new Map<number, Lot>();
  const lots: Lot[] = [];
  const trades: OurTrade[] = [];
  const cancels: OfferChurn[] = [];
  const spendByTick = new Map<number, number>();
  const book = new Map<number, BookEntry>();
  const ours = new Map<number, { side: "buy" | "sell"; ref: string }>();
  const fees = new Map<string, FeeModel>([["rastro", RASTRO_FEES]]);
  const threads = new Map<number, { with: string; cash: number; tick: number }>();
  let synthetic = -1;
  let lastTick = input.baseline?.tick ?? 0;
  const baseTick = input.baseline?.tick ?? -Infinity;

  for (const c of input.baseline?.cards ?? []) {
    const lot: Lot = { id: c.id, ref: c.ref, inTick: input.baseline!.tick, inFrom: "baseline" };
    held.set(c.id, lot);
    lots.push(lot);
  }
  const counts = (): Map<string, number> => {
    const m = new Map<string, number>();
    for (const l of held.values()) m.set(l.ref, (m.get(l.ref) ?? 0) + 1);
    return m;
  };
  const receive = (id: number, ref: string, tick: number, from: string, extra: Partial<Lot> = {}): void => {
    if (held.has(id)) return; // already in the baseline
    const lot: Lot = { id, ref, inTick: tick, inFrom: from, ...extra };
    held.set(id, lot);
    lots.push(lot);
  };
  /** Takes the asset out; an id we never saw come in consumes a synthetic copy of the same ref (gift, plan baseline). */
  const send = (id: number, ref: string, tick: number): Lot => {
    let lot = held.get(id);
    if (!lot) {
      const syn = [...held.values()].find((l) => l.id < 0 && l.ref === ref);
      if (syn) {
        held.delete(syn.id);
        syn.id = id;
        lot = syn;
      } else {
        lot = { id, ref, inTick: tick, inFrom: "unknown" };
        lots.push(lot);
      }
    }
    held.delete(lot.id);
    held.delete(id);
    return lot;
  };
  const feeAt = (venue: string, cash: number): number => tradeFee(cash, 1, fees.get(venue) ?? { bps: 0, perCard: 0 });
  const isOpen = (e: BookEntry, tick: number): boolean => e.offer.expires_tick == null || e.offer.expires_tick >= tick;
  const best = (side: "bid" | "ask", ref: string, tick: number, skip: (e: BookEntry) => boolean): Quote | undefined => {
    let out: Quote | undefined;
    for (const e of book.values()) {
      // An offer addressed to another team (`to`) is not one we could take.
      if (e.side !== side || e.ref !== ref || e.offer.maker === team || (e.offer.to && e.offer.to !== team) || !isOpen(e, tick) || skip(e)) continue;
      const fee = feeAt(e.venue, e.cash);
      const net = side === "bid" ? e.cash - fee : e.cash + fee;
      if (!out || (side === "bid" ? net > out.net : net < out.net)) out = { offer: e.offer.id, venue: e.venue, maker: e.offer.maker ?? "?", price: e.cash, net };
    }
    return out;
  };
  const threadFor = (persona: string, price: number, tick: number): { thread?: number; reservation?: number } => {
    let thread: number | undefined;
    let at = -Infinity;
    for (const [id, t] of threads) if (t.with === persona && t.cash === price && t.tick >= tick - 6 && t.tick > at) [thread, at] = [id, t.tick];
    const notes = input.decisions.filter((d) => d.dealer === persona && d.tick <= tick && d.tick >= tick - 6 && (thread === undefined ? d.ourPrice === price : d.thread === thread));
    const note = notes.at(-1);
    thread ??= note?.thread;
    const reservation = input.decisions.filter((d) => d.thread === thread && d.reservation !== undefined).at(-1)?.reservation;
    return { ...(thread !== undefined ? { thread } : {}), ...(reservation !== undefined ? { reservation } : {}) };
  };

  for (const ev of events) {
    lastTick = Math.max(lastTick, ev.tick);
    const p = ev.payload;
    switch (ev.type) {
      case "venue.opened":
      case "venue.fee_changed": {
        const v = typeof p.venue === "string" ? p.venue : undefined;
        if (v && typeof p.fee_bps === "number") fees.set(v, { bps: p.fee_bps, perCard: typeof p.fee_per_card === "number" ? p.fee_per_card : 0 });
        break;
      }
      case "venue.closed":
        for (const [id, e] of book) if (e.venue === p.venue) book.delete(id);
        break;
      case "offer.listed": {
        const o = StreamOfferSchema.safeParse(p.offer);
        if (!o.success) break;
        const venue = o.data.venue ?? (typeof p.venue === "string" ? p.venue : undefined);
        if (!venue) break;
        const e = classify(o.data, venue);
        if (e) book.set(o.data.id, e);
        if (o.data.maker === team) {
          const l = ourListing(o.data);
          if (l) ours.set(o.data.id, l);
        }
        break;
      }
      case "offer.cancelled": {
        const id = typeof p.offer === "number" ? p.offer : undefined;
        if (id === undefined) break;
        book.delete(id);
        const l = ours.get(id);
        if (l) cancels.push({ offer: id, side: l.side, ref: l.ref, tick: ev.tick });
        break;
      }
      case "thread.message": {
        if (p.team !== team || typeof p.thread !== "number" || typeof p.with !== "string") break;
        const o = StreamOfferSchema.safeParse(p.offer);
        if (!o.success) break;
        const cash = (o.data.give?.cash ?? 0) || (o.data.want?.cash ?? 0);
        if (cash > 0) threads.set(p.thread, { with: p.with, cash, tick: ev.tick });
        break;
      }
      case "pack.opened": {
        if (p.team !== team || !Array.isArray(p.cards) || ev.tick < baseTick) break;
        for (const c of p.cards as unknown[]) {
          const a = c as { id?: unknown; ref?: unknown; kind?: unknown };
          if (typeof a.id === "number" && typeof a.ref === "string" && (a.kind ?? "card") === "card") receive(a.id, a.ref, ev.tick, "pack");
        }
        break;
      }
      case "gift.given":
      case "admin.grant": {
        if (p.team !== team || !Array.isArray(p.cards) || ev.tick < baseTick) break;
        for (const c of p.cards as unknown[]) {
          const ref = typeof c === "string" ? c : typeof (c as { ref?: unknown }).ref === "string" ? (c as { ref: string }).ref : undefined;
          const id = typeof c === "object" && c && typeof (c as { id?: unknown }).id === "number" ? (c as { id: number }).id : synthetic--;
          if (ref) receive(id, ref, ev.tick, ev.type === "gift.given" ? "gift" : "grant");
        }
        break;
      }
      case "settlement": {
        const s = SettlementSchema.safeParse(p);
        if (!s.success) break;
        const st = s.data;
        const tick = st.tick ?? ev.tick;
        const cards = st.items.filter((i) => (i.kind ?? "card") === "card" && i.ref);
        // Someone else's fill closes the quotes it consumed: the ask of that asset, and the receiver's bid at that price.
        const consumed = (e: BookEntry): boolean =>
          cards.some((i) => (e.side === "ask" && e.assetId === i.id) || (e.side === "bid" && e.venue === st.venue && e.offer.maker === i.to && e.ref === i.ref && e.cash === st.price));
        const mineIn = cards.filter((i) => i.to === team);
        const mineOut = cards.filter((i) => i.frm === team);
        if (tick >= baseTick && (mineIn.length || mineOut.length)) {
          const side: OurTrade["side"] = mineIn.length && mineOut.length ? "swap" : mineIn.length ? "buy" : "sell";
          const n = mineIn.length + mineOut.length;
          const price = (st.price ?? 0) / n;
          // El Rastro charges only the side that accepts (verified on our cash, ticks 320–380). The offer this fill
          // consumed decides who accepted: a quote of the other side means we accepted and paid; else one of ours means
          // they accepted (no fee for us); with neither in the book, assume we paid.
          const madeBy = (maker: (m: string | null | undefined) => boolean): boolean =>
            [...book.values()].some(
              (e) => maker(e.offer.maker) && e.venue === st.venue && e.cash === st.price && cards.some((i) => (e.side === "ask" && e.assetId === i.id) || (e.side === "bid" && e.offer.maker === i.to && e.ref === i.ref)),
            );
          const weMade = !madeBy((m) => m !== team) && madeBy((m) => m === team);
          const paidFee = weMade ? 0 : (st.fee ?? 0);
          const fee = paidFee / n;
          const counterparty = (st.parties ?? []).find((x) => x !== team) ?? st.persona ?? undefined;
          const link = st.persona && st.price ? threadFor(st.persona, st.price, tick) : {};
          const from = st.persona ? `dealer:${st.persona}` : st.venue ? `venue:${st.venue}` : "unknown";
          if (side === "buy") spendByTick.set(tick, (spendByTick.get(tick) ?? 0) + (st.price ?? 0) + (st.venue ? paidFee : 0));
          for (const i of [...mineOut, ...mineIn]) {
            const before = counts();
            const tSide = side === "swap" ? "swap" : i.to === team ? "buy" : "sell";
            const filled = (e: BookEntry): boolean => e.venue === st.venue && e.offer.maker === counterparty && e.cash === st.price;
            trades.push({
              settlement: st.settlement,
              tick,
              side: tSide,
              ref: i.ref!,
              assetId: i.id,
              price,
              fee,
              ...(st.venue ? { venue: st.venue } : {}),
              ...(st.persona ? { persona: st.persona } : {}),
              ...(counterparty ? { counterparty } : {}),
              ...link,
              copiesBefore: before.get(i.ref!) ?? 0,
              countsBefore: before,
              ...(tSide === "sell" ? optional("bestBid", best("bid", i.ref!, tick, filled)) : {}),
              ...(tSide === "buy" ? optional("bestAsk", best("ask", i.ref!, tick, (e) => filled(e) || e.assetId === i.id)) : {}),
            });
            if (i.to === team) receive(i.id, i.ref!, tick, from, { inPrice: price, inSettlement: st.settlement, ...(link.thread !== undefined ? { inThread: link.thread } : {}) });
            else {
              const lot = send(i.id, i.ref!, tick);
              Object.assign(lot, { outTick: tick, outTo: counterparty ?? "?", outPrice: price, outFee: fee, outSettlement: st.settlement });
            }
          }
        }
        for (const [id, e] of book) if (consumed(e)) book.delete(id);
        break;
      }
    }
  }
  return { team, ...(input.baseline ? { baseline: input.baseline } : {}), lots, trades, cancels, lastTick, spendByTick };
}

function optional<K extends string, V>(k: K, v: V | undefined): { [P in K]?: V } {
  return (v === undefined ? {} : { [k]: v }) as { [P in K]?: V };
}

/** Baseline from a recorded `/api/me`: its card assets with their ids. */
export function baselineFromMe(me: Me, tick: number, source: string): Baseline {
  return { source, tick, cards: me.assets.filter((a) => (a.kind ?? "card") === "card" && /^[A-Z]+-\d+$/.test(a.ref)).map((a) => ({ id: a.id, ref: a.ref })) };
}

/** Baseline from the first `plan.jsonl` line: copies by ref only, so synthetic ids (matched by ref when they leave). */
export function baselineFromCounts(holdings: Record<string, number>, tick: number, source: string): Baseline {
  let id = -1_000_000;
  const cards: { id: number; ref: string }[] = [];
  for (const [ref, n] of Object.entries(holdings)) if (/^[A-Z]+-\d+$/.test(ref)) for (let k = 0; k < n; k++) cards.push({ id: id--, ref });
  return { source, tick, cards };
}
