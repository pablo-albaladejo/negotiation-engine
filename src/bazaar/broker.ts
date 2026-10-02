/**
 * Lógica pura del broker de nuestro venue: lee el libro (`GET /api/broker/book`) de forma tolerante y
 * decide qué cruzar. Sin E/S. El Market Test puntúa la ganancia entre los límites reales de las ofertas
 * de banco (`bench_offers`) que casamos; el precio solo reparte, no cambia la eficiencia.
 */

export interface BenchQuote {
  id: string;
  /** Tanda del banco: "b12" en el id "b12-7". Solo se cruzan ofertas de la misma tanda. */
  run: string;
  side: "ask" | "bid";
  quote: number;
  index: number;
}

export interface PublicSell {
  id: string | number;
  maker: string;
  card: string;
  ask: number;
  index: number;
}

export interface PublicBuy {
  id: string | number;
  maker: string;
  card: string;
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
  /** Ofertas públicas bien formadas que no son venta de una carta ni puja por un tipo. */
  unsupported: number;
  /** Ofertas con forma inesperada (se saltan; nunca rompen el bucle). */
  errors: string[];
}

export interface BrokerMatch {
  source: "bench" | "public";
  sell: string | number;
  buy: string | number;
  price: number;
  ask: number;
  bid: number;
  /** Excedente entre cotizaciones (bid − ask). */
  surplus: number;
  /** Excedente entre límites estimados (solo banco; igual a `surplus` sin historial). */
  estSurplus: number;
}

export interface BenchParams {
  /** Ticks que se observa una oferta nueva antes de cruzarla (salvo urgencia). 0 = como el puesto auto. */
  holdTicks: number;
  /** Rebaja supuesta entre cotización y límite de una oferta firme (nunca se mueve), en fracción. */
  firmShade: number;
  /** Edad (ticks) a partir de la cual una oferta se trata como a punto de irse. */
  maxAgeTicks: number;
}

export const DEFAULT_BENCH_PARAMS: BenchParams = { holdTicks: 0, firmShade: 0.1, maxAgeTicks: 6 };
export const MAX_PUBLIC_MATCHES_PER_TICK = 10;

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const posNum = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : undefined);
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

/** "b12-7" → "b12"; `undefined` si el id no tiene la forma tanda-número. */
export function benchRun(id: string): string | undefined {
  const m = /^([A-Za-z]+\d+)-(\d+)$/.exec(id);
  return m ? m[1] : undefined;
}

/** Comisión del venue por un precio (redondeada hacia arriba, más la cuota por carta). */
export function venueFee(price: number, feeBps: number, feePerCard: number): number {
  return Math.ceil((feeBps * price) / 10_000) + feePerCard;
}

/** Punto medio entero dentro de [ask, bid], bajado hasta que el comprador pueda pagar también la comisión. */
export function fairPrice(ask: number, bid: number, fee: (price: number) => number = () => 0): number | undefined {
  if (!(bid >= ask)) return undefined;
  let p = Math.floor((ask + bid) / 2);
  while (p > ask && p + fee(p) > bid) p -= 1;
  return p >= ask && p <= bid && p + fee(p) <= bid ? p : undefined;
}

function cardKey(x: unknown): string | undefined {
  if (typeof x === "string") return x.includes(":") ? x : `card:${x}`;
  if (isObj(x) && typeof x.ref === "string") return `${typeof x.kind === "string" ? x.kind : "card"}:${x.ref}`;
  return undefined;
}

/** Libro tolerante: lo que no encaja va a `errors` y se salta. */
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
    const types = [...arr(o.want.types), ...arr(o.want.cards)];
    const giveCash = posNum(o.give.cash);
    const wantCash = posNum(o.want.cash);
    if (assets.length === 1 && wantCash !== undefined && giveCash === undefined && types.length === 0) {
      const card = cardKey(assets[0]);
      if (!card) return void book.errors.push(`offer ${o.id}: asset without ref`);
      book.sells.push({ id: o.id, maker, card, ask: wantCash, index });
    } else if (giveCash !== undefined && assets.length === 0 && types.length === 1 && wantCash === undefined) {
      const card = cardKey(types[0]);
      if (!card) return void book.errors.push(`offer ${o.id}: wanted type unreadable`);
      book.buys.push({ id: o.id, maker, card, bid: giveCash, index });
    } else {
      book.unsupported += 1;
    }
  });
  return book;
}

/** Huella del libro: tick + ids y cotizaciones. Mismo estado ⇒ no se vuelve a enviar nada. */
export function bookStateKey(tick: number, book: BrokerBook): string {
  const parts = [
    ...book.bench.map((b) => `${b.id}@${b.quote}`),
    ...book.sells.map((s) => `s${s.id}@${s.ask}`),
    ...book.buys.map((b) => `b${b.id}@${b.bid}`),
  ].sort();
  return `${tick}|${parts.join(",")}`;
}

// ------------------------------------------------------------------ paciencia del banco

export interface QuoteTrack {
  side: "ask" | "bid";
  firstTick: number;
  lastTick: number;
  first: number;
  last: number;
  /** Último paso hacia el mercado (ask baja, bid sube), en P. */
  lastStep: number;
  lastMoveTick?: number;
  moves: number;
  /** Ticks distintos en los que se ha visto. */
  seen: number;
}

/** Actualiza el historial de cotizaciones del banco (muta y devuelve `tracks`); olvida los ids que ya no están. */
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

/** A punto de irse: relaja su cotización ahora (se le acaba la paciencia) o ya lleva `maxAgeTicks`. */
export function isUrgent(t: QuoteTrack | undefined, tick: number, params: BenchParams): boolean {
  if (!t) return false;
  return temperOf(t) === "relaxing" || tick - t.firstTick >= params.maxAgeTicks;
}

/** Límite oculto estimado: una firme esconde `firmShade`; una que relaja, al menos un paso más. */
export function estimatedLimit(q: BenchQuote, t: QuoteTrack | undefined, params: BenchParams): number {
  const temper = temperOf(t);
  const slack = temper === "firm" ? q.quote * params.firmShade : temper === "relaxing" && t ? t.lastStep : 0;
  return q.side === "ask" ? q.quote - slack : q.quote + slack;
}

export interface BenchPlan {
  matches: BrokerMatch[];
  /** Pares que cruzan pero se aplazan (ofertas nuevas y pacientes, `holdTicks`). */
  held: BrokerMatch[];
}

/**
 * Por tanda: pujas por límite estimado descendente, cada una contra el ask libre de menor límite
 * estimado cuya cotización cubre (bid ≥ ask, con comisión). Sin historial es exactamente el cruce del
 * puesto auto (asks ascendentes contra bids descendentes mientras bid ≥ ask, al punto medio). Cada
 * oferta se usa una vez como mucho.
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

/**
 * Ofertas reales del venue, carta a carta: el ask más bajo contra la puja más alta (de otro maker) que
 * cubre ask + comisión, al punto medio rebajado hasta que el comprador pueda pagar la comisión. Si hay
 * más de `max` cruces, se quedan los de mayor excedente.
 */
export function planPublic(book: BrokerBook, max = MAX_PUBLIC_MATCHES_PER_TICK): BrokerMatch[] {
  const fee = (p: number) => venueFee(p, book.feeBps, book.feePerCard);
  const bids = [...book.buys].sort((a, b) => b.bid - a.bid || a.index - b.index);
  const used = new Set<PublicBuy>();
  const out: BrokerMatch[] = [];
  for (const s of [...book.sells].sort((a, b) => a.ask - b.ask || a.index - b.index)) {
    const b = bids.find((x) => !used.has(x) && x.card === s.card && x.maker !== s.maker && s.ask + fee(s.ask) <= x.bid);
    if (!b) continue;
    const price = fairPrice(s.ask, b.bid, fee);
    if (price === undefined) continue;
    used.add(b);
    out.push({ source: "public", sell: s.id, buy: b.id, price, ask: s.ask, bid: b.bid, surplus: b.bid - s.ask, estSurplus: b.bid - s.ask });
  }
  return out.sort((a, b) => b.surplus - a.surplus).slice(0, Math.max(0, max));
}

export const ANNOUNCEMENT =
  "Welcome to Team 2 · El Rastro Express: zero fees (0 % and 0 P per card). Crossing offers are matched at the fair midpoint. Bienvenidos, sin comisiones.";
