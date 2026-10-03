import { ACCEPT_PRIORITY, type Intent } from "../../../src/coordinator/coordinator.js";
import type { GameState } from "../../../src/state/game-state.js";
import { parseMyOffers, parseOffers, readSide, type TradeOffer } from "../../../src/trades/trades.js";

/**
 * Núcleo puro de la pestaña «Now» (`/api/bazaar/model` → `now`): a qué objetivo sirve cada intención del tick,
 * nuestras ofertas publicadas (precio, edad, comisión, si cruzan algo), el estado de nuestro venue y los plazos.
 * Solo lee lo que ya trae el modelo (estructura, nunca texto del rival); no calcula ninguna cifra nueva:
 * la cifra de cada intención es la que decidió el código (`price`, la decisión de la ruta o la de su resumen).
 */

export interface NowIntentGoal {
  /** Objetivo de la conversación (`goal.why`) o el que se deduce de la ruta. */
  goal: string;
  /** Objetivo global al que sirve: página del álbum, escalera de dealers, duelo, ventaja de mercado… */
  global: string;
  /** Cifra decidida por código, si la intención lleva una. */
  figure: number | null;
}

export interface NowOffer {
  id: number;
  venue: string;
  venue_name: string | null;
  side: "sell" | "buy" | "swap";
  /** Lo que damos y lo que pedimos, en texto corto ("SAL-07" / "32 P"). */
  give: string;
  want: string;
  refs: string[];
  /** Cifra de la oferta (P), si es dinero contra carta. */
  price: number | null;
  created_tick: number | null;
  expires_tick: number | null;
  age_ticks: number | null;
  fee: { bps: number; per_card: number; est: number | null } | null;
  /** Mejor oferta ajena que cruza la nuestra en el mismo libro; `null` si no cruza; "unknown" sin libro. */
  crosses: { offer: number; price: number } | null | "unknown";
  /** Objetivo de la conversación `rastro:<id>` si el modelo la tiene. */
  goal: string | null;
}

export interface NowVenue {
  id: string;
  name: string | null;
  status: string | null;
  mechanism: string | null;
  opened_tick: number | null;
  trades: number | null;
  volume: number | null;
  fees: number | null;
  fee_bps: number | null;
  fee_per_card: number | null;
  pending_fee: { fee_bps: number | null; fee_per_card: number | null; effective_tick: number | null; in_ticks: number | null } | null;
  suspension_reason: string | null;
}

export interface NowOut {
  /** Por id de intención. */
  goals: Record<string, NowIntentGoal>;
  /** Tick límite por conversación (duelos: `deadline_tick`; ofertas: `expires_tick`). */
  deadlines: Record<string, number>;
  offers: NowOffer[];
  venue: NowVenue | null;
}

const record = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const num = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? x : null);
const str = (x: unknown): string | null => (typeof x === "string" && x !== "" ? x : null);

/** Objetivo global de cada `goal.why`. */
function globalOf(why: string, state: GameState, pageTargets: readonly string[], ref: string | null): string {
  if (why === "page") return `album page${ref ? ` (${ref} completes ${ref.split("-")[0]})` : pageTargets.length ? ` (${pageTargets.join(", ")})` : ""}`;
  if (why === "ladder") return `dealer ladder (level ${state.ours.level ?? "?"})`;
  if (why === "duel") return "duel points (value decays every round)";
  if (why === "duplicate") return "market edge: sell a spare copy";
  if (why === "listing" || why === "bid" || why === "market") return "market edge (value created)";
  if (why === "housekeeping") return "keep the book clean (frees an offer slot)";
  return "score (other)";
}

const CARD = /\b[A-Z]{3}-\d{2}\b/;

/** Cifra del resumen (`@ 32 P`, `COUNTER 86 P`, `cash 55 P`): la escribió el código, no el rival. */
function figureOf(summary: string): number | null {
  const m = /(?:@|COUNTER|ACCEPT[^(]*\(|cash)\s*(-?\d+(?:\.\d+)?)\s*P\b/.exec(summary) ?? /(-?\d+(?:\.\d+)?)\s*P\b/.exec(summary);
  return m ? Number(m[1]) : null;
}

export function intentGoals(intents: readonly Intent[], state: GameState, pageTargets: readonly string[]): Record<string, NowIntentGoal> {
  const out: Record<string, NowIntentGoal> = {};
  for (const i of intents) {
    const conv = i.conversation ? state.conversations.find((c) => c.id === i.conversation || c.id === i.conversation?.replace(/^rastro-offer:/, "rastro:")) : undefined;
    const ref = conv?.asset.ref ?? CARD.exec(i.summary)?.[0] ?? null;
    let why: string;
    if (conv) why = conv.goal.why;
    else if (i.route === "duels") why = "duel";
    else if (i.kind === "cancel") why = "housekeeping";
    else if (i.acceptClass === "page-completing" || (ref !== null && pageTargets.includes(ref))) why = "page";
    else if (i.route === "dealers") why = /\bsell:/.test(i.summary) ? "duplicate" : "ladder";
    else if (i.kind === "listing") why = /\((duplicate|listing|bid|page)\b/.exec(i.summary)?.[1] ?? "market";
    else why = "market";
    const figure = i.price ?? conv?.strategy.lastDecision?.price ?? figureOf(i.summary);
    out[i.id] = { goal: why, global: globalOf(why, state, pageTargets, ref), figure };
  }
  return out;
}

/** Pasadas de `arbitrate`, en su orden (`arbitrate` devuelve los veredictos en el orden de entrada). */
const PASS: Record<string, number> = { accept: 0, message: 1, probe: 2, open: 3, unpack: 4, agenda: 5, flag: 6, cancel: 7, listing: 8 };

/**
 * Orden en que `arbitrate` reparte el tick: aceptaciones por `ACCEPT_PRIORITY` y EV, mensajes, probes, hilos
 * nuevos por EV, sobres, agenda, flags, cancelaciones y altas. Solo para pintar el plan en ese orden.
 */
export function arbitrationOrder(intents: readonly Intent[]): Map<string, number> {
  const rank = (i: Intent) => (i.kind === "accept" ? ACCEPT_PRIORITY[i.acceptClass ?? "other"].rank : 0);
  const byEv = (i: Intent) => (i.kind === "accept" || i.kind === "open" ? -(i.ev ?? 0) : 0);
  const sorted = intents.map((i, k) => ({ i, k })).sort((a, b) => (PASS[a.i.kind] ?? 9) - (PASS[b.i.kind] ?? 9) || rank(a.i) - rank(b.i) || byEv(a.i) - byEv(b.i) || a.k - b.k);
  return new Map(sorted.map(({ i }, k) => [i.id, k]));
}

/** Plazos de los duelos (`/api/duels`: `deadline_tick` o `deadline` si es un tick). */
export function duelDeadlines(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of Array.isArray(record(raw).duels) ? (record(raw).duels as unknown[]) : []) {
    const o = record(d);
    const id = num(o.duel) ?? num(o.id);
    const dl = num(o.deadline_tick) ?? (num(o.deadline) !== null && num(o.deadline)! < 1e9 ? num(o.deadline) : null);
    if (id !== null && dl !== null) out[`duel:${id}`] = dl;
  }
  return out;
}

function sideText(side: ReturnType<typeof readSide>): string {
  const parts = [...side.assets.map((a) => a.ref ?? `#${a.id}`), ...side.cards, ...(side.cash > 0 ? [`${side.cash} P`] : [])];
  return parts.join(" + ") || "—";
}

interface VenueFee {
  name: string | null;
  bps: number;
  perCard: number;
}

/** Comisión de cada venue (`state.markets.venues` en camelCase o `/api/venues` en snake_case). */
export function venueFees(list: readonly unknown[]): Map<string, VenueFee> {
  const out = new Map<string, VenueFee>();
  for (const v of list) {
    const o = record(v);
    const id = str(o.id) ?? str(o.venue);
    if (!id) continue;
    out.set(id, { name: str(o.name), bps: num(o.feeBps) ?? num(o.fee_bps) ?? 0, perCard: num(o.feePerCard) ?? num(o.fee_per_card) ?? 0 });
  }
  return out;
}

/**
 * Nuestras ofertas abiertas en cualquier venue. Cruza = en el mismo libro hay una oferta ajena de dinero contra la
 * misma carta al otro lado a un precio que casaría (bid ≥ nuestro ask, o ask ≤ nuestro bid).
 */
export function ourOffers(input: { myOffers: unknown; team: string; tick: number; books: Map<string, unknown>; venues: readonly unknown[]; state: GameState }): NowOffer[] {
  const { mine } = parseMyOffers(input.myOffers, input.team);
  const fees = venueFees(input.venues);
  const ourIds = new Set(mine.map((o) => o.id));
  const books = new Map<string, TradeOffer[]>();
  for (const [venue, raw] of input.books) books.set(venue, parseOffers(raw).filter((o) => !ourIds.has(o.id) && (o.status ?? "open") === "open"));
  return mine
    .filter((o) => (o.status ?? "open") === "open" || o.status === "queued")
    .map((o): NowOffer => {
      const give = readSide(o.give);
      const want = readSide(o.want);
      const gives = [...give.assets.map((a) => a.ref).filter((r): r is string => !!r), ...give.cards];
      const wants = [...want.cards, ...want.assets.map((a) => a.ref).filter((r): r is string => !!r)];
      const side: NowOffer["side"] = gives.length > 0 && wants.length === 0 ? "sell" : wants.length > 0 && gives.length === 0 ? "buy" : "swap";
      const price = side === "sell" ? want.cash || null : side === "buy" ? give.cash || null : null;
      const venue = o.venue ?? "?";
      const fee = fees.get(venue);
      const cards = gives.length + wants.length;
      const book = books.get(venue);
      let crosses: NowOffer["crosses"] = book ? null : "unknown";
      const ref = side === "sell" ? gives[0] : side === "buy" ? wants[0] : undefined;
      if (book && price !== null && ref && (side === "sell" ? gives.length : wants.length) === 1) {
        for (const b of book) {
          const bg = readSide(b.give);
          const bw = readSide(b.want);
          // Del otro lado: si vendemos, una puja (dinero por nuestra carta); si compramos, una venta de esa carta.
          const theirPrice = side === "sell" ? (bw.cards.includes(ref) && bg.assets.length === 0 && bg.cash > 0 ? bg.cash : null) : bg.assets.some((a) => a.ref === ref) && bw.cash > 0 && bw.cards.length + bw.assets.length === 0 ? bw.cash : null;
          if (theirPrice === null) continue;
          const match = side === "sell" ? theirPrice >= price : theirPrice <= price;
          if (match && (crosses === null || crosses === "unknown" || (side === "sell" ? theirPrice > crosses.price : theirPrice < crosses.price))) crosses = { offer: b.id, price: theirPrice };
        }
      }
      const conv = input.state.conversations.find((c) => c.id === `rastro:${o.id}`);
      return {
        id: o.id,
        venue,
        venue_name: fee?.name ?? null,
        side,
        give: sideText(give),
        want: sideText(want),
        refs: [...gives, ...wants],
        price,
        created_tick: o.created_tick ?? null,
        expires_tick: o.expires_tick ?? null,
        age_ticks: o.created_tick != null ? Math.max(0, input.tick - o.created_tick) : null,
        fee: fee ? { bps: fee.bps, per_card: fee.perCard, est: price !== null ? Math.round((price * fee.bps) / 100) / 100 + fee.perCard * cards : null } : null,
        crosses,
        goal: conv?.goal.why ?? null,
      };
    })
    .sort((a, b) => a.venue.localeCompare(b.venue) || a.id - b.id);
}

/** Nuestro venue (`/api/me` → `venue`): estado, apertura y el cambio de comisión pendiente con su cuenta atrás. */
export function ourVenue(me: unknown, tick: number): NowVenue | null {
  const v = record(record(me).venue);
  const id = str(v.venue) ?? str(v.id);
  if (!id) return null;
  const p = record(v.pending_fee);
  const eff = num(p.effective_tick);
  return {
    id,
    name: str(v.name),
    status: str(v.status),
    mechanism: str(record(v.rules).mechanism) ?? str(v.mechanism),
    opened_tick: num(v.opened_tick),
    trades: num(v.trades),
    volume: num(v.volume),
    fees: num(v.fees),
    fee_bps: num(v.fee_bps),
    fee_per_card: num(v.fee_per_card),
    pending_fee: v.pending_fee ? { fee_bps: num(p.fee_bps), fee_per_card: num(p.fee_per_card), effective_tick: eff, in_ticks: eff !== null ? eff - tick : null } : null,
    suspension_reason: str(v.suspension_reason),
  };
}
