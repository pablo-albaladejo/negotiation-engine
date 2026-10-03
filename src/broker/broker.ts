/**
 * Pure logic of our venue's broker: reads the book (`GET /api/broker/book`) tolerantly and
 * decides what to cross. No I/O. The Market Test scores the gain between the real limits of the bank offers
 * (`bench_offers`) we match; the price only splits, it does not change efficiency.
 */

export interface BenchQuote {
  id: string;
  /** Bank batch: "b12" in the id "b12-7". Only offers of the same batch are crossed. */
  run: string;
  side: "ask" | "bid";
  quote: number;
  index: number;
}

export interface PublicSell {
  id: string | number;
  maker: string;
  /** "card:LAV-03": kind and ref of the single asset given (any serial). */
  card: string;
  /** Id of the asset given (a specific serial), when the book carries it. */
  asset?: string | number;
  ask: number;
  index: number;
}

export interface PublicBuy {
  id: string | number;
  maker: string;
  card: string;
  /** Set only for an exact bid (`want.assets: [asset]`): that specific asset. Unset = any copy of `card`. */
  asset?: string | number;
  bid: number;
  index: number;
}

export interface BrokerBook {
  venue?: string;
  status?: string;
  feeBps: number;
  feePerCard: number;
  bench: BenchQuote[];
  sells: PublicSell[];
  buys: PublicBuy[];
  /** Well-formed public offers that are neither a card sale nor a bid for a type. */
  unsupported: number;
  /** Offers with an unexpected shape (skipped; they never break the loop). */
  errors: string[];
}

export type PublicKind = "exact" | "any-copy";

export interface BrokerMatch {
  source: "bench" | "public";
  /** Public only: exact asset bid or any-copy bid (`want.cards` / `want.types: ["card:REF"]`). */
  pairing?: PublicKind;
  sell: string | number;
  buy: string | number;
  price: number;
  ask: number;
  bid: number;
  /** Surplus between quotes (bid − ask). */
  surplus: number;
  /** Surplus between estimated limits (bank only; equal to `surplus` without history). */
  estSurplus: number;
}

export interface BenchParams {
  /** Ticks a new offer is observed before crossing it (except urgency). 0 = like the auto stall. */
  holdTicks: number;
  /** Assumed shade between quote and limit of a firm offer (it never moves), as a fraction. */
  firmShade: number;
  /** Age (ticks) from which an offer is treated as about to leave. */
  maxAgeTicks: number;
}

export const DEFAULT_BENCH_PARAMS: BenchParams = { holdTicks: 0, firmShade: 0.1, maxAgeTicks: 6 };
export const MAX_PUBLIC_MATCHES_PER_TICK = 10;

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const posNum = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : undefined);
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

/** "b12-7" → "b12"; `undefined` if the id does not have the batch-number shape. */
export function benchRun(id: string): string | undefined {
  const m = /^([A-Za-z]+\d+)-(\d+)$/.exec(id);
  return m ? m[1] : undefined;
}

/** Venue fee for a price (rounded up, plus the per-card fee). */
export function venueFee(price: number, feeBps: number, feePerCard: number): number {
  return Math.ceil((feeBps * price) / 10_000) + feePerCard;
}

/** Integer midpoint within [ask, bid], lowered until the buyer can also pay the fee. */
export function fairPrice(ask: number, bid: number, fee: (price: number) => number = () => 0): number | undefined {
  if (!(bid >= ask)) return undefined;
  let p = Math.floor((ask + bid) / 2);
  while (p > ask && p + fee(p) > bid) p -= 1;
  return p >= ask && p <= bid && p + fee(p) <= bid ? p : undefined;
}

const assetId = (x: unknown): string | number | undefined =>
  isObj(x) && (typeof x.id === "number" || typeof x.id === "string") ? x.id : typeof x === "number" ? x : undefined;

function cardKey(x: unknown): string | undefined {
  if (typeof x === "string") return x.includes(":") ? x : `card:${x}`;
  if (isObj(x) && typeof x.ref === "string") return `${typeof x.kind === "string" ? x.kind : "card"}:${x.ref}`;
  return undefined;
}

/** Tolerant book: what does not fit goes to `errors` and is skipped. */
export function parseBrokerBook(raw: unknown): BrokerBook {
  const book: BrokerBook = { feeBps: 0, feePerCard: 0, bench: [], sells: [], buys: [], unsupported: 0, errors: [] };
  if (!isObj(raw)) {
    book.errors.push("book: not an object");
    return book;
  }
  if (typeof raw.venue === "string") book.venue = raw.venue;
  if (typeof raw.status === "string") book.status = raw.status;
  book.feeBps = posNum(raw.fee_bps) ?? 0;
  book.feePerCard = posNum(raw.fee_per_card) ?? 0;

  arr(raw.bench_offers).forEach((o, index) => {
    if (!isObj(o) || typeof o.id !== "string") return void book.errors.push(`bench[${index}]: no string id`);
    const run = benchRun(o.id);
    if (!run) return void book.errors.push(`bench ${o.id}: id is not <run>-<n>`);
    const ask = isObj(o.want) ? posNum(o.want.cash) : undefined;
    const bid = isObj(o.give) ? posNum(o.give.cash) : undefined;
    if (ask !== undefined && bid === undefined) book.bench.push({ id: o.id, run, side: "ask", quote: ask, index });
    else if (bid !== undefined && ask === undefined) book.bench.push({ id: o.id, run, side: "bid", quote: bid, index });
    else book.errors.push(`bench ${o.id}: neither a cash ask nor a cash bid`);
  });

  arr(raw.offers).forEach((o, index) => {
    if (!isObj(o) || (typeof o.id !== "number" && typeof o.id !== "string") || !isObj(o.give) || !isObj(o.want)) {
      return void book.errors.push(`offer[${index}]: missing id/give/want`);
    }
    const maker = typeof o.maker === "string" ? o.maker : String(o.maker ?? "");
    const assets = arr(o.give.assets);
    const wantAssets = arr(o.want.assets);
    const types = [...arr(o.want.types), ...arr(o.want.cards)];
    const giveCash = posNum(o.give.cash);
    const wantCash = posNum(o.want.cash);
    if (assets.length === 1 && wantCash !== undefined && giveCash === undefined && types.length === 0 && wantAssets.length === 0) {
      const card = cardKey(assets[0]);
      if (!card) return void book.errors.push(`offer ${o.id}: asset without ref`);
      const asset = assetId(assets[0]);
      book.sells.push({ id: o.id, maker, card, ...(asset !== undefined ? { asset } : {}), ask: wantCash, index });
    } else if (giveCash !== undefined && assets.length === 0 && types.length === 1 && wantAssets.length === 0 && wantCash === undefined) {
      const card = cardKey(types[0]);
      if (!card) return void book.errors.push(`offer ${o.id}: wanted type unreadable`);
      book.buys.push({ id: o.id, maker, card, bid: giveCash, index });
    } else if (giveCash !== undefined && assets.length === 0 && types.length === 0 && wantAssets.length === 1 && wantCash === undefined) {
      const asset = assetId(wantAssets[0]);
      if (asset === undefined) return void book.errors.push(`offer ${o.id}: wanted asset without id`);
      book.buys.push({ id: o.id, maker, card: cardKey(wantAssets[0]) ?? `asset:${asset}`, asset, bid: giveCash, index });
    } else {
      book.unsupported += 1;
    }
  });
  return book;
}

/** Book fingerprint: tick + ids and quotes. Same state ⇒ nothing is sent again. */
export function bookStateKey(tick: number, book: BrokerBook): string {
  const parts = [
    ...book.bench.map((b) => `${b.id}@${b.quote}`),
    ...book.sells.map((s) => `s${s.id}@${s.ask}`),
    ...book.buys.map((b) => `b${b.id}@${b.bid}`),
  ].sort();
  return `${tick}|${parts.join(",")}`;
}

// ------------------------------------------------------------------ bank patience

export interface QuoteTrack {
  side: "ask" | "bid";
  firstTick: number;
  lastTick: number;
  first: number;
  last: number;
  /** Last step toward the market (ask goes down, bid goes up), in P. */
  lastStep: number;
  lastMoveTick?: number;
  moves: number;
  /** Distinct ticks in which it has been seen. */
  seen: number;
}

/** Updates the bank's quote history (mutates and returns `tracks`); forgets ids that are no longer there. */
export function observeBench(tracks: Map<string, QuoteTrack>, bench: BenchQuote[], tick: number): Map<string, QuoteTrack> {
  const present = new Set<string>();
  for (const b of bench) {
    present.add(b.id);
    const t = tracks.get(b.id);
    if (!t) {
      tracks.set(b.id, { side: b.side, firstTick: tick, lastTick: tick, first: b.quote, last: b.quote, lastStep: 0, moves: 0, seen: 1 });
      continue;
    }
    if (tick !== t.lastTick) t.seen += 1;
    const step = b.side === "ask" ? t.last - b.quote : b.quote - t.last;
    if (step > 0) {
      t.moves += 1;
      t.lastStep = step;
      t.lastMoveTick = tick;
    }
    t.last = b.quote;
    t.lastTick = tick;
  }
  for (const id of [...tracks.keys()]) if (!present.has(id)) tracks.delete(id);
  return tracks;
}

export type Temper = "new" | "relaxing" | "firm" | "settled";

export function temperOf(t: QuoteTrack | undefined): Temper {
  if (!t || (t.seen < 2 && t.moves === 0)) return "new";
  if (t.lastMoveTick !== undefined && t.lastMoveTick === t.lastTick) return "relaxing";
  return t.moves === 0 ? "firm" : "settled";
}

/** About to leave: relaxes its quote now (its patience is running out) or is already `maxAgeTicks` old. */
export function isUrgent(t: QuoteTrack | undefined, tick: number, params: BenchParams): boolean {
  if (!t) return false;
  return temperOf(t) === "relaxing" || tick - t.firstTick >= params.maxAgeTicks;
}

/** Estimated hidden limit: a firm one hides `firmShade`; one that relaxes, at least one more step. */
export function estimatedLimit(q: BenchQuote, t: QuoteTrack | undefined, params: BenchParams): number {
  const temper = temperOf(t);
  const slack = temper === "firm" ? q.quote * params.firmShade : temper === "relaxing" && t ? t.lastStep : 0;
  return q.side === "ask" ? q.quote - slack : q.quote + slack;
}

export interface BenchPlan {
  matches: BrokerMatch[];
  /** Pairs that cross but are deferred (new, patient offers, `holdTicks`). */
  held: BrokerMatch[];
}

/**
 * Per batch: bids by descending estimated limit, each against the free ask of lowest estimated
 * limit whose quote covers it (bid ≥ ask, with fee). Without history it is exactly the auto
 * stall's crossing (ascending asks against descending bids while bid ≥ ask, at the midpoint). Each
 * offer is used at most once.
 */
export function planBench(
  book: BrokerBook,
  tracks: Map<string, QuoteTrack> = new Map(),
  tick = 0,
  params: BenchParams = DEFAULT_BENCH_PARAMS,
): BenchPlan {
  const fee = (p: number) => venueFee(p, book.feeBps, book.feePerCard);
  const runs = new Map<string, BenchQuote[]>();
  for (const b of book.bench) runs.set(b.run, [...(runs.get(b.run) ?? []), b]);
  const young = (o: BenchQuote) => {
    const t = tracks.get(o.id);
    return t !== undefined && tick - t.firstTick < params.holdTicks && !isUrgent(t, tick, params);
  };
  const plan: BenchPlan = { matches: [], held: [] };
  for (const offers of runs.values()) {
    const est = new Map(offers.map((o) => [o.id, estimatedLimit(o, tracks.get(o.id), params)]));
    const e = (o: BenchQuote) => est.get(o.id) ?? o.quote;
    const asks = offers.filter((o) => o.side === "ask").sort((a, b) => e(a) - e(b) || a.quote - b.quote || a.index - b.index);
    const bids = offers.filter((o) => o.side === "bid").sort((a, b) => e(b) - e(a) || b.quote - a.quote || a.index - b.index);
    const used = new Set<string>();
    for (const bid of bids) {
      for (const ask of asks) {
        if (used.has(ask.id)) continue;
        const price = fairPrice(ask.quote, bid.quote, fee);
        if (price === undefined) continue;
        used.add(ask.id);
        const m: BrokerMatch = {
          source: "bench",
          sell: ask.id,
          buy: bid.id,
          price,
          ask: ask.quote,
          bid: bid.quote,
          surplus: bid.quote - ask.quote,
          estSurplus: e(bid) - e(ask),
        };
        (params.holdTicks > 0 && young(ask) && young(bid) ? plan.held : plan.matches).push(m);
        break;
      }
    }
  }
  return plan;
}

/** Offers and assets already taken within one planning call (shared across exact and any-copy). */
export interface PublicUsed {
  offers: Set<string>;
  assets: Set<string>;
}

export const newPublicUsed = (): PublicUsed => ({ offers: new Set(), assets: new Set() });

function pairPublic(book: BrokerBook, kind: PublicKind, used: PublicUsed): BrokerMatch[] {
  const fee = (p: number) => venueFee(p, book.feeBps, book.feePerCard);
  const fits = (s: PublicSell, b: PublicBuy) =>
    kind === "exact"
      ? b.asset !== undefined && s.asset !== undefined && String(s.asset) === String(b.asset)
      : b.asset === undefined && s.card === b.card;
  const cands: { s: PublicSell; b: PublicBuy; price: number }[] = [];
  for (const s of book.sells) {
    for (const b of book.buys) {
      if (!fits(s, b) || b.maker === s.maker || s.ask + fee(s.ask) > b.bid) continue;
      const price = fairPrice(s.ask, b.bid, fee);
      if (price !== undefined) cands.push({ s, b, price });
    }
  }
  // Best surplus first: the highest bid against the lowest ask of each card.
  cands.sort((x, y) => y.b.bid - y.s.ask - (x.b.bid - x.s.ask) || x.s.ask - y.s.ask || y.b.bid - x.b.bid || x.s.index - y.s.index || x.b.index - y.b.index);
  const out: BrokerMatch[] = [];
  for (const { s, b, price } of cands) {
    const sk = `s${s.id}`;
    const bk = `b${b.id}`;
    const ak = s.asset !== undefined ? String(s.asset) : undefined;
    if (used.offers.has(sk) || used.offers.has(bk) || (ak !== undefined && used.assets.has(ak))) continue;
    used.offers.add(sk);
    used.offers.add(bk);
    if (ak !== undefined) used.assets.add(ak);
    out.push({ source: "public", pairing: kind, sell: s.id, buy: b.id, price, ask: s.ask, bid: b.bid, surplus: b.bid - s.ask, estSurplus: b.bid - s.ask });
  }
  return out;
}

/**
 * Any-copy bids (`want.cards: ["LAV-03"]`, stored as `want.types: ["card:LAV-03"]`, cash given) against sales of one
 * asset of that same card, any serial: same card only, another maker, bid ≥ ask + fee, at the integer midpoint lowered
 * until the buyer can pay the fee. Best surplus first; each offer and each asset at most once (also across `used`).
 */
export function planAnyCopy(book: BrokerBook, used: PublicUsed = newPublicUsed()): BrokerMatch[] {
  return pairPublic(book, "any-copy", used);
}

/** Exact bids (`want.assets: [asset]`) against the sale of that same asset; same rules as `planAnyCopy`. */
export function planExactAsset(book: BrokerBook, used: PublicUsed = newPublicUsed()): BrokerMatch[] {
  return pairPublic(book, "exact", used);
}

/**
 * Real offers of the venue: exact asset bids first, then any-copy bids, never reusing an offer or an asset.
 * If there are more than `max` matches, those with the highest surplus are kept.
 */
export function planPublic(book: BrokerBook, max = MAX_PUBLIC_MATCHES_PER_TICK): BrokerMatch[] {
  const used = newPublicUsed();
  const out = [...planExactAsset(book, used), ...planAnyCopy(book, used)];
  return out.sort((a, b) => b.surplus - a.surplus).slice(0, Math.max(0, max));
}

// game text: kept in Spanish (ends with a Spanish phrase)
/**
 * The venue announcement for our CURRENT venue id (read from the book or `/api/me`, never a constant: after the
 * v04 → v26 switch a fixed "v04" sent teams to a closed venue). `board`: our broker crosses, any copy fills a card bid.
 */
export function announcementFor(venue: string, mechanism: string | undefined = undefined): string {
  const crossing = mechanism === "board" ? "our broker crosses the best bid and ask every tick, and any copy fills your card bid" : "the best bid and ask cross automatically every tick";
  // game text
  return `Team 2 · El Rastro Express (${venue}): 0 % fee and 0 P per card (El Rastro takes 5 % + 1 P a card). Post your spare cards and want-to-buy bids with venue "${venue}" (give cash, want {"cards": ["LAV-03"]}): any team can accept them, both sides keep the whole price, and ${crossing}. Card-for-card swaps welcome. Long expiry welcome. ¡Cero comisiones, todas las cartas!`;
}
