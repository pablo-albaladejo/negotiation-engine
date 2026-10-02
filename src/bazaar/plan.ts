import { counterText } from "./messages.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, plannedSchedule, type NegotiatorParams, type Rule, type Side } from "./negotiator.js";
import { rarityOf, type Target } from "./planner.js";
import type { Catalog, DealerInfo, Me } from "./schemas.js";

/**
 * Planificador por menú: a partir de `/api/me`, `/api/catalog` y la ficha del dealer, ordena qué
 * comprarle (cartas concretas o rareza+set, por valor esperado a nuestros valores privados) y, si
 * ninguna compra deja margen, qué venderle (lo que compra, a la puja aprendida). Puro salvo `valueOf`.
 */

/**
 * Su puja cuando nos compra es DESCONOCIDA hasta su primer precio en el hilo (hilos 56 y 125: la misma común
 * MAL-02 a 13 una vez y a 5–6 otra, sin causa conocida). El plan solo usa un techo plausible para decidir si
 * abrir: su lista de venta de esa rareza × 1,3 (13 sobre su lista 10 de comunes, lo más alto visto).
 */
export const PLAUSIBLE_BID_FRAC = 1.3;
/** ASSUMPTION (sim): apertura de su venta sin opening_ask = list × 1,15 (Abuela, confirmado en vivo). */
const ASSUMED_OPENING_MARKUP = 1.15;
/**
 * Riesgo de repetida al comprar por rareza+set (la carta la elige ella; se supone uniforme entre las de esa
 * rareza y set): se descarta si P(repetida) > 0,34 y la pérdida en el peor caso (pagar el límite por la repetida
 * de menor valor) supera 3 P, porque cada trato puntúa a nuestro valor privado (SAL-07 a 23: neg_points −14,9).
 * Además el valor esperado debe superar su lista en `RARITY_SET_MARGIN` (al menos 2 P o el 10 % de la lista).
 */
export const MAX_DUPLICATE_P = 0.34;
export const MAX_WORST_CASE_LOSS = 3;
export const RARITY_SET_MARGIN = { min: 2, frac: 0.1 };
const PAGE_RARITIES = new Set(["common", "uncommon", "rare"]);

export type CandidateKind = "buy-card" | "buy-rarity-set" | "sell";

export interface PageImpact {
  set: string;
  have: number;
  of: number;
  /** Cartas de la página tras el trato (esperado al comprar por rareza+set). */
  after: number;
}

export interface Candidate extends Target {
  kind: CandidateKind;
  rarity: string | undefined;
  set: string | undefined;
  card?: string;
  /** Compra: valor esperado de lo que recibimos; venta: valor de lo que entregamos. */
  value: number;
  herList: number | undefined;
  /** Su primer precio esperado (al comprar, su apertura; al vender, su puja) y de dónde sale. */
  herOpening: number;
  herOpeningSource: string;
  /** Valor creado a su precio esperado: compra = valor − lista; venta = puja − valor. */
  surplus: number;
  /** Compra: la reserva supera su lista; venta: su puja esperada alcanza nuestra reserva y crea valor. */
  room: boolean;
  why: string;
  cards?: { id: string; value: number; held: boolean }[];
  /** Rareza+set: probabilidad de recibir una repetida y pérdida si nos toca la peor repetida pagando el límite. */
  duplicateP?: number;
  worstCaseLoss?: number;
  /** Compra de carta concreta sobre una entrada de rareza+set: el dealer aún no ha aceptado `{buy: {card}}`. */
  cardTopicUntested?: boolean;
  /** Venta: su puja es desconocida hasta su primer precio en el hilo (`herOpening` es solo el techo plausible). */
  bidUnknown?: boolean;
  copy?: "duplicate" | "only";
  page?: PageImpact;
}

export interface RankInput {
  me: Me;
  catalog: Catalog;
  dealer: DealerInfo;
  valueOf: (card: string) => Promise<number>;
  /** Fracción del valor que pagamos como máximo al comprar (y divisor del mínimo al vender). */
  safety?: number;
  /** Lo que queda para gastar (tope de la ejecución y de la hora). */
  budget: number;
  /** Proponer cartas concretas (`{buy: {card}}`) sobre entradas de rareza+set; falso si el dealer ya lo rechazó. */
  cardTopic?: boolean;
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

function setsOf(entry: { sets?: string | string[] | null | undefined }, catalog: Catalog): Set<string> {
  const released = catalog.sets.filter((s) => (s as { released?: unknown }).released !== false).map((s) => s.id ?? "");
  const sets = entry.sets;
  if (sets === undefined || sets === null || sets === "released") return new Set(released);
  return new Set(Array.isArray(sets) ? sets : [sets]);
}

function pagesOf(me: Me): Map<string, { have: number; of: number }> {
  const pages = (me.album as { pages?: { set?: unknown; have?: unknown; of?: unknown }[] } | undefined)?.pages ?? [];
  const out = new Map<string, { have: number; of: number }>();
  for (const p of pages) if (typeof p.set === "string" && typeof p.have === "number" && typeof p.of === "number") out.set(p.set, { have: p.have, of: p.of });
  return out;
}

const setOfCard = (ref: string, asset?: { set?: unknown }) => (typeof asset?.set === "string" ? asset.set : (ref.split("-")[0] ?? ref));

export async function rankCandidates(input: RankInput): Promise<Candidate[]> {
  const { me, catalog, dealer, valueOf } = input;
  const safety = input.safety ?? 0.9;
  const cap = Math.floor(Math.max(0, Math.min(input.budget, me.cash)));
  const pages = pagesOf(me);
  const held = new Set(me.assets.filter((a) => a.kind === "card").map((a) => a.ref));
  const buys: Candidate[] = [];

  for (const entry of dealer.menu.sells) {
    if (entry.pack) continue;
    const list = entry.list_price ?? undefined;
    const opening = entry.opening_ask ?? (list !== undefined ? Math.round(list * ASSUMED_OPENING_MARKUP) : undefined);
    if (opening === undefined) continue;
    const openingSource = entry.opening_ask ? "menu opening_ask" : `opening assumed list × ${ASSUMED_OPENING_MARKUP}`;
    const ref = list ?? opening;
    const finish = (c: Omit<Candidate, "room" | "why" | "reservation" | "side" | "herList" | "herOpening" | "herOpeningSource" | "surplus">, extra: string): Candidate => {
      const reservation = Math.min(cap, Math.floor(c.value * safety));
      const room = reservation > ref;
      const capped = reservation < Math.floor(c.value * safety) ? " (capped by spend/cash)" : "";
      const why = room ? `value ${round1(c.value)} × ${safety} = ${reservation} > list ${ref}: ${reservation - ref} P of room${capped}${extra}` : `value ${round1(c.value)} × ${safety} = ${reservation} ≤ list ${ref}: no room${capped}${extra}`;
      return { ...c, side: "buy", reservation, herList: list, herOpening: opening, herOpeningSource: openingSource, surplus: round1(c.value - ref), room, why };
    };
    if (entry.card) {
      const set = setOfCard(entry.card);
      const value = await valueOf(entry.card);
      const page = pages.get(set);
      const isNew = !held.has(entry.card);
      buys.push(
        finish(
          { kind: "buy-card", key: `buy:${entry.card}`, topic: { buy: { card: entry.card } }, label: `buy ${entry.card}`, rarity: entry.rarity?.toLowerCase() ?? undefined, set, card: entry.card, value, ...(page && isNew ? { page: { set, ...page, after: page.have + 1 } } : {}) },
          isNew ? "; new for us" : "; duplicate for us",
        ),
      );
      continue;
    }
    const rarity = entry.rarity?.toLowerCase();
    if (!rarity) continue;
    const allowed = setsOf(entry, catalog);
    for (const set of catalog.sets) {
      const setId = set.id ?? "";
      if (!allowed.has(setId)) continue;
      const cards = set.cards.filter((c) => rarityOf(c) === rarity);
      if (!cards.length) continue;
      const vals: { id: string; value: number; held: boolean }[] = [];
      for (const c of cards) vals.push({ id: c.id, value: await valueOf(c.id), held: held.has(c.id) });
      const value = vals.reduce((s, v) => s + v.value, 0) / vals.length;
      const fresh = vals.filter((v) => !v.held).length;
      const page = pages.get(setId);
      const heldVals = vals.filter((v) => v.held).map((v) => v.value);
      const duplicateP = round2(heldVals.length / vals.length);
      const limit = Math.min(cap, Math.floor(value * safety));
      const worstCaseLoss = heldVals.length ? round1(Math.max(0, limit - Math.min(...heldVals))) : 0;
      const margin = Math.max(RARITY_SET_MARGIN.min, Math.ceil(ref * RARITY_SET_MARGIN.frac));
      const risky = duplicateP > MAX_DUPLICATE_P && worstCaseLoss > MAX_WORST_CASE_LOSS;
      const c = finish(
        {
          kind: "buy-rarity-set",
          key: `buy:${setId}:${rarity}`,
          topic: { buy: { rarity, set: setId } },
          label: `buy ${rarity} ${setId}`,
          rarity,
          set: setId,
          value,
          cards: vals,
          duplicateP,
          worstCaseLoss,
          ...(page ? { page: { set: setId, ...page, after: round1(page.have + fresh / vals.length) } } : {}),
        },
        `; ${fresh}/${vals.length} would be new${page ? ` (${setId} page ${page.have}/${page.of})` : ""}; P(duplicate) ${duplicateP}, worst-case loss ${worstCaseLoss} P`,
      );
      if (c.room && risky) buys.push({ ...c, room: false, why: `${c.why}; SKIP: duplicate risk (P ${duplicateP} > ${MAX_DUPLICATE_P} and worst case −${worstCaseLoss} P > ${MAX_WORST_CASE_LOSS} P)` });
      else if (c.room && c.reservation < ref + margin) buys.push({ ...c, room: false, why: `${c.why}; SKIP: expected value does not clear her list by the ${margin} P margin a random card needs` });
      else buys.push(c);
      if (input.cardTopic === false) continue;
      for (const v of vals) {
        if (v.held) continue;
        buys.push(
          finish(
            { kind: "buy-card", key: `buy:${v.id}`, topic: { buy: { card: v.id } }, label: `buy ${v.id}`, rarity, set: setId, card: v.id, value: v.value, cardTopicUntested: true, ...(page ? { page: { set: setId, ...page, after: page.have + 1 } } : {}) },
            `; new for us; specific card on her ${rarity} entry (topic {buy:{card}} untested: if she refuses it, the agent falls back to rarity+set)`,
          ),
        );
      }
    }
  }
  buys.sort((a, b) => Number(b.room) - Number(a.room) || b.surplus - a.surplus || b.value - a.value);

  const sells: Candidate[] = [];
  const buyRarities = new Map<string, Set<string>>();
  for (const entry of dealer.menu.buys) {
    const rarity = entry.rarity?.toLowerCase();
    if (rarity) buyRarities.set(rarity, setsOf(entry, catalog));
  }
  const byRef = new Map<string, Me["assets"]>();
  for (const a of me.assets) if (a.kind === "card" && !a.locked) byRef.set(a.ref, [...(byRef.get(a.ref) ?? []), a]);
  for (const [ref, copies] of byRef) {
    const sorted = [...copies].sort((x, y) => (y.your_value ?? 0) - (x.your_value ?? 0));
    const top = sorted[0]!;
    const rarity = rarityOf(top);
    const set = setOfCard(ref, top as { set?: unknown });
    if (!rarity || !buyRarities.get(rarity)?.has(set)) continue;
    const sellList = dealer.menu.sells.find((s) => s.rarity?.toLowerCase() === rarity)?.list_price ?? undefined;
    if (sellList === undefined) continue;
    const bid = { price: Math.max(1, Math.floor(sellList * PLAUSIBLE_BID_FRAC)), source: `unknown until her first bid; plausible ceiling her ${rarity} list ${sellList} × ${PLAUSIBLE_BID_FRAC}` };
    const offered = sorted.length > 1 ? sorted.slice(1).map((a) => ({ a, copy: "duplicate" as const })) : [{ a: top, copy: "only" as const }];
    for (const { a, copy } of offered) {
      if (typeof a.your_value !== "number") continue;
      const value = a.your_value;
      const reservation = Math.max(1, Math.ceil(value / safety));
      const room = bid.price >= reservation && bid.price > value;
      const pg = pages.get(set);
      const page = copy === "only" && pg && PAGE_RARITIES.has(rarity) ? { set, ...pg, after: pg.have - 1 } : undefined;
      const impact = page ? `our ONLY copy: ${set} page ${page.have}/${page.of} → ${page.after}/${page.of} (further from complete)` : "DUPLICATE: no album impact";
      sells.push({
        kind: "sell",
        key: `sell:${a.id}`,
        side: "sell",
        topic: { sell: { assets: [a.id] } },
        label: `sell ${ref}`,
        rarity,
        set,
        card: ref,
        value,
        reservation,
        herList: undefined,
        herOpening: bid.price,
        herOpeningSource: bid.source,
        surplus: round1(bid.price - value),
        room,
        bidUnknown: true,
        copy,
        ...(page ? { page } : {}),
        why: `her bid is unknown (could reach ${bid.price}); our value ${round1(value)} → min ${reservation}; ${room ? `plausible: up to +${round1(bid.price - value)} P; if her first bid < ${DEFAULT_NEGOTIATOR_PARAMS.lowballFrac} × ${reservation} we close after one counter` : "her plausible ceiling does not reach our minimum: not opened"}; ${impact}`,
      });
    }
  }
  const impactOf = (c: Candidate) => (c.page ? c.page.have / c.page.of : 0);
  sells.sort((a, b) => Number(b.room) - Number(a.room) || Number(b.copy === "duplicate") - Number(a.copy === "duplicate") || impactOf(a) - impactOf(b) || b.surplus - a.surplus);
  return [...buys, ...sells];
}

export interface Selection {
  candidate: Candidate;
  reason: string;
}

/** Filtro de `--only`: lado y palabras (rareza, set, carta o id de activo), p. ej. `buy:uncommon:SAL`. */
export interface OnlyFilter {
  raw: string;
  side: Side;
  tokens: string[];
}

/** `"buy:uncommon:SAL,buy:common:SAL"` → filtros en ese orden. Lanza si un elemento no empieza por buy/sell. */
export function parseOnly(spec: string): OnlyFilter[] {
  return spec
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((raw) => {
      const [side, ...tokens] = raw.split(":").map((t) => t.trim());
      if (side !== "buy" && side !== "sell") throw new Error(`--only: "${raw}" debe empezar por buy: o sell:`);
      if (!tokens.length || tokens.some((t) => !t)) throw new Error(`--only: "${raw}" necesita rareza, set, carta o id`);
      return { raw, side, tokens: tokens.map((t) => t.toLowerCase()) };
    });
}

/** Candidatos que casan con los filtros, en el orden de los filtros (y por ranking dentro de cada uno), sin repetir. */
export function applyOnly(cands: readonly Candidate[], filters: readonly OnlyFilter[]): Candidate[] {
  const out: Candidate[] = [];
  for (const f of filters) {
    for (const c of cands) {
      if (c.side !== f.side || out.includes(c)) continue;
      const words = [c.rarity, c.set, c.card, c.key.split(":").pop()].filter((w): w is string => !!w).map((w) => w.toLowerCase());
      if (f.tokens.every((t) => words.includes(t))) out.push(c);
    }
  }
  return out;
}

/**
 * Hasta `maxThreads` conversaciones: compras con margen (una común y una infrecuente si ambas lo
 * tienen), recortadas por el gasto que queda; si faltan, ventas con margen (repetidas primero, luego
 * menor impacto en el álbum).
 */
export function selectCandidates(cands: readonly Candidate[], o: { maxThreads: number; maxSpend: number; only?: boolean }): Selection[] {
  const out: Selection[] = [];
  let committed = 0;
  if (o.only) {
    // `--only`: en el orden pedido y sin exigir margen sobre su lista; el negociador sigue sin pasar de nuestro límite.
    for (const c of cands) {
      if (out.length >= o.maxThreads) break;
      const reservation = c.side === "buy" ? Math.min(c.reservation, Math.floor(o.maxSpend - committed)) : c.reservation;
      if (reservation < 1) continue;
      if (c.side === "buy") committed += reservation;
      const list = c.herList ?? c.herOpening;
      const note = c.side === "buy" && reservation <= list ? `; no room over her list ${list}: a deal needs her below list, else we close without buying` : "";
      out.push({ candidate: { ...c, reservation }, reason: `requested with --only${note}` });
    }
    return out;
  }
  const tryBuy = (c: Candidate, reason: string) => {
    if (out.length >= o.maxThreads || out.some((s) => s.candidate.key === c.key)) return;
    const reservation = Math.min(c.reservation, Math.floor(o.maxSpend - committed));
    if (reservation <= (c.herList ?? c.herOpening)) return;
    committed += reservation;
    out.push({ candidate: { ...c, reservation }, reason });
  };
  const buys = cands.filter((c) => c.side === "buy" && c.room);
  const common = buys.find((c) => c.rarity === "common");
  const uncommon = buys.find((c) => c.rarity === "uncommon");
  if (common && uncommon) for (const c of buys.filter((b) => b === common || b === uncommon)) tryBuy(c, `best ${c.rarity} buy with room (one common + one uncommon)`);
  for (const c of buys) tryBuy(c, "next buy with room, by value created");
  const bought = out.length;
  for (const c of cands) {
    if (out.length >= o.maxThreads) break;
    if (c.side !== "sell" || !c.room) continue;
    const base = bought ? "sell with room after the buys" : "fallback: no buy has room; sell what she buys if her first bid can reach our minimum";
    out.push({ candidate: c, reason: `${base} (${c.copy === "duplicate" ? "duplicate first" : "lowest page impact, then most value created"})` });
  }
  return out;
}

export interface PathPreview {
  /** Nuestros precios en orden si ella no se mueve de su primer precio. */
  prices: number[];
  outcome: string;
  rule: Rule;
  firstText: string | undefined;
}

/** Camino de precios previsto si ella no se mueve (lo aprendido con la Abuela al comprarnos comunes). */
export function previewPath(c: Candidate, params: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS, maxRounds = 20): PathPreview {
  const prices: number[] = [];
  const herPrices = [c.herOpening];
  let holdsUsed = 0;
  const first = () => (prices[0] !== undefined ? counterText(c.side, 0, prices[0]) : undefined);
  for (let i = 0; i < maxRounds; i++) {
    const d = decide(
      {
        side: c.side,
        reservation: c.reservation,
        privateValue: c.value,
        herOpening: c.herOpening,
        herPrices: [...herPrices],
        herCurrent: { offerId: 1, price: c.herOpening, final: false },
        ourPrices: [...prices],
        canMessage: true,
        canAccept: true,
        holdsUsed,
      },
      params,
    );
    if (d.action.kind === "counter") {
      prices.push(d.action.price);
      herPrices.push(c.herOpening);
      continue;
    }
    if (d.action.kind === "hold") {
      holdsUsed += 1;
      continue;
    }
    const what = d.action.kind === "accept" ? `accept her ${d.action.price}` : d.action.kind;
    return { prices, outcome: `${what} (rule ${d.rule}${holdsUsed ? `, after ${holdsUsed} holds` : ""})`, rule: d.rule, firstText: first() };
  }
  return { prices, outcome: "still negotiating", rule: "boulware", firstText: first() };
}

export interface PlanCaps {
  maxDeals: number;
  maxSpend: number;
  maxThreads: number;
  /** Fracción del valor usada como límite (solo para mostrarla). */
  safety?: number;
}

/** Texto del plan del dry-run: estado, candidatos ordenados, los elegidos y el primer mensaje de cada uno. */
export function formatPlan(me: Me, dealer: DealerInfo, cands: readonly Candidate[], chosen: readonly Selection[], caps: PlanCaps, params: NegotiatorParams = DEFAULT_NEGOTIATOR_PARAMS): string[] {
  const score = (me.score ?? {}) as { deals?: unknown };
  const deals = typeof score.deals === "number" ? score.deals : undefined;
  const need = dealer.unlock?.early_min_deals ?? undefined;
  const L: string[] = [];
  L.push(`== PLAN (dry-run, no POST) · dealer ${dealer.name ?? dealer.id} ==`);
  L.push(`us: cash ${me.cash} P · level ${me.level ?? "?"} · deals ${deals ?? "?"}${need !== undefined && deals !== undefined ? ` (next level unlocks early at ${need} deals: ${Math.max(0, need - deals)} to go)` : ""}`);
  L.push(`caps: max-deals ${caps.maxDeals} · max-spend ${caps.maxSpend} P · max-threads ${caps.maxThreads} (one conversation at a time per dealer)`);
  L.push("");
  L.push("ranked candidates (values are ours, private; reservation = buy: value × safety, sell: value ÷ safety):");
  cands.forEach((c, i) => {
    const what = c.kind === "buy-rarity-set" ? `BUY ${c.rarity} ${c.set} (any card of that rarity+set)` : c.kind === "buy-card" ? `BUY ${c.card}` : `SELL ${c.card} (${c.rarity}, ${c.copy === "duplicate" ? "DUPLICATE" : "ONLY copy"})`;
    L.push(`${String(i + 1).padStart(2)}. [${c.room ? "ROOM" : "no room"}] ${what}`);
    const her = c.side === "buy" ? `her list ${c.herList ?? "?"}, opening ${c.herOpening} (${c.herOpeningSource})` : `her bid ? (${c.herOpeningSource})`;
    L.push(`      value gain ${c.side === "buy" ? round1(c.value) : `${c.surplus >= 0 ? "+" : ""}${c.surplus}`} P · reservation ${c.reservation} · ${her} · value created at her price ${c.surplus >= 0 ? "+" : ""}${c.surplus} P`);
    if (c.cards) L.push(`      cards: ${c.cards.map((x) => `${x.id}=${round1(x.value)}${x.held ? "(held)" : ""}`).join(" ")}`);
    L.push(`      why: ${c.why}`);
  });
  L.push("");
  if (!chosen.length) {
    L.push("would open: nothing (no candidate leaves room for a value-positive deal)");
    return L;
  }
  L.push(`would open ${chosen.length} conversation(s), one at a time, and stop after ${caps.maxDeals} deal(s):`);
  chosen.forEach((s, i) => {
    const c = s.candidate;
    const path = previewPath(c, params);
    const planned = plannedSchedule({ side: c.side, reservation: c.reservation, herOpening: c.herOpening }, params);
    const limitWhy = c.side === "buy" ? `value × ${caps.safety ?? "safety"}, capped by spend/cash` : `value ÷ ${caps.safety ?? "safety"}`;
    L.push(`  #${i + 1} ${c.label} · topic ${JSON.stringify(c.topic)}`);
    L.push(`      why chosen: ${s.reason}`);
    const her = c.side === "buy" ? `her list ${c.herList ?? "?"} · her opening ${c.herOpening} (${c.herOpeningSource})` : `her bid ? (${c.herOpeningSource})`;
    L.push(`      our value ${round1(c.value)} · our limit ${c.reservation} (${limitWhy}) · ${her}`);
    L.push(`      anchor ${planned[0] ?? "-"} · planned path within ${params.patienceBudget} exchanges (step mode ${params.stepMode}, max step ${params.maxStep}): ${planned.join(" → ") || "-"}`);
    if (c.cardTopicUntested) L.push(`      card topic: {buy:{card:"${c.card}"}} not yet tried live with this dealer; on a 400/422 refusal the agent switches to rarity+set for the rest of the run`);
    L.push(`      if she ${c.bidUnknown ? "bids her plausible ceiling" : "does not move from"} ${c.herOpening}: ${path.prices.join(" → ") || "-"} → ${path.outcome}`);
    L.push(`      first message (price ${path.prices[0] ?? "-"}): "${path.firstText ?? "(none)"}"`);
  });
  return L;
}
