import { counterText } from "../negotiation/messages.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, plannedSchedule, type NegotiatorParams, type Rule, type Side } from "../negotiation/negotiator.js";
import { rarityOf, type Target } from "./planner.js";
import type { Catalog, DealerInfo, Me } from "../../shared/schemas.js";
import { buildValueModel, heldAssets } from "../../trades/trades.js";
import { isKeepsake } from "../../shared/asset-locks.js";
import { FOREX_MAX_LOTS, forexBuyRoute, forexLots, forexSellRoute } from "./forex.js";

/**
 * Menu planner: from `/api/me`, `/api/catalog` and the dealer record, ranks what to
 * buy from her (specific cards or rarity+set, by expected value at our private values) and, if
 * no purchase leaves room, what to sell her (what she buys, at the learned bid). Pure except `valueOf`.
 */

/**
 * Her bid when she buys from us is UNKNOWN until her first price in the thread (threads 56 and 125: the same common
 * MAL-02 at 13 once and at 5–6 another time, no known cause). The plan only uses a plausible ceiling to decide whether to
 * open: her sell list for that rarity × 1.3 (13 over her common list of 10, the highest seen).
 */
export const PLAUSIBLE_BID_FRAC = 1.3;
/**
 * Plausible bid ceiling by rarity for a dealer with no sell list for that rarity (Pilar only sells packs): the
 * highest price she paid in public settlements on 3 Oct (21 uncommons at 17–25 P, one epic LAV-11 at 140). Without
 * this fallback every sale to her was skipped and the planner reported `no-target`. Rare: no public settlement yet, so
 * its catalog book (70), as her uncommon bids top out at their book (25). Only decides whether to open;
 * the reservation (value ÷ safety) still bounds the deal.
 */
export const MEASURED_BID_CEILING: Readonly<Record<string, number>> = { uncommon: 25, rare: 70, epic: 140 };
/**
 * Value of buying ONE MORE copy of a card we hold `copies` of (thread 493: RET-06 held, valued at 40, paid 24 for a ~10 P
 * duplicate). The client's value cache is seeded with `your_value` of the copies we hold (what we lose if one leaves),
 * so for a held card the looked-up value can be the held copy's; the next copy is worth that ÷ marginal(n) × marginal(n+1).
 * Never above `apiValue`; without holdings it is `apiValue`.
 */
export function nextCopyValue(apiValue: number, copies: number, heldValue: number | undefined, marginals: readonly number[]): number {
  if (copies <= 0 || !Number.isFinite(apiValue)) return apiValue;
  const last = heldValue !== undefined && Number.isFinite(heldValue) ? heldValue : apiValue;
  const m = marginals[copies - 1] ?? 0;
  const next = m > 0 ? (last / m) * (marginals[copies] ?? 0) : 0;
  return Math.max(0, Math.min(apiValue, Number.isFinite(next) ? next : 0));
}

/** ASSUMPTION (sim): her sell opening without opening_ask = list × 1.15 (Abuela, confirmed live). */
const ASSUMED_OPENING_MARKUP = 1.15;
/**
 * Duplicate risk when buying by rarity+set (she picks the card; assumed uniform among those of that
 * rarity and set): skipped if P(duplicate) > 0.34 and the worst-case loss (paying the limit for the lowest-value
 * duplicate) exceeds 3 P, because each deal scores at our private value (SAL-07 at 23: neg_points −14.9).
 * Also the expected value must exceed her list by `RARITY_SET_MARGIN` (at least 2 P or 10 % of the list).
 */
export const MAX_DUPLICATE_P = 0.34;
export const MAX_WORST_CASE_LOSS = 3;
export const RARITY_SET_MARGIN = { min: 2, frac: 0.1 };
const PAGE_RARITIES = new Set(["common", "uncommon", "rare"]);
/**
 * Our ONLY copy on a page ≥ 70 % complete is never sold: that last stretch is exactly where the page
 * bonus weighs most in the card's value (completing scores high and losing a piece so close to the end is not
 * easily recovered), so we use the page's own percentage as a simple proxy for "the page bonus
 * drives its value" instead of trying to separate market value from the bonus. Duplicates don't have this
 * problem (the page doesn't change) and are always preferred; below this threshold, a single copy is only offered if it
 * creates at least `ONLY_COPY_MIN_SURPLUS` P (selling the only copy of a nearly empty set for peanuts isn't
 * worth it either) — since only one copy is offered at a time, the page always ends at most at `have − 1`.
 */
export const ONLY_COPY_PAGE_COMPLETE_BLOCK = 0.5;
export const ONLY_COPY_MIN_SURPLUS = 5;

export type CandidateKind = "buy-card" | "buy-rarity-set" | "buy-pack" | "sell";

/**
 * Pack buys: our pack value is an ESTIMATE (slots × our mean value per rarity, `src/packs/`), so the reservation is
 * value × `PACK_SAFETY`; there is room only if it clears her list (her expected deal, never her opening).
 */
export const PACK_SAFETY = 0.97;

/**
 * The card that completes a page carries the whole page bonus in its `your_value` (SAL-09: 91 base + 86 bonus = 177.1).
 * With `--page-bonus-scored` a page target's limit is value × this; without it, its base (no page bonus seen in
 * neg_points yet: RET-10 from El Chato at 91 P on tick 530 gave Δ0). Either way capped by cash above the floor only: the
 * hourly spend cap (60 P) sat below every rare list (77) and left El Chato idle with SAL-09 on his menu.
 */
export const PAGE_COMPLETING_SAFETY = 0.9;

export interface PageImpact {
  set: string;
  have: number;
  of: number;
  /** Page cards after the deal (expected when buying by rarity+set). */
  after: number;
}

export interface Candidate extends Target {
  kind: CandidateKind;
  rarity: string | undefined;
  set: string | undefined;
  card?: string;
  /** Buy: expected value of what we receive; sell: value of what we hand over. */
  value: number;
  herList: number | undefined;
  /** Her expected first price (buying: her opening; selling: her bid) and where it comes from. */
  herOpening: number;
  herOpeningSource: string;
  /** Valor creado a su precio esperado: compra = valor − lista; venta = puja − valor. */
  surplus: number;
  /** Buy: the reservation exceeds her list; sell: her expected bid reaches our reservation and creates value. */
  room: boolean;
  why: string;
  cards?: { id: string; value: number; held: boolean }[];
  /** Rarity+set: probability of receiving a duplicate and loss if we get the worst duplicate paying the limit. */
  duplicateP?: number;
  worstCaseLoss?: number;
  /** Specific-card buy on a rarity+set entry: the dealer has not yet accepted `{buy: {card}}`. */
  cardTopicUntested?: boolean;
  /** Sell: her bid is unknown until her first price in the thread (`herOpening` is only the plausible ceiling). */
  bidUnknown?: boolean;
  copy?: "duplicate" | "only";
  page?: PageImpact;
  /** Pack buy: pack type (`sobre_barrio`) and her cap per team and game hour (`per_team_per_hour`). */
  pack?: string;
  perHour?: number;
  /** Dealer-to-dealer arbitrage leg (`forex.ts`): a copy bought to resell, or its resale. */
  forex?: true;
}

export interface RankInput {
  me: Me;
  catalog: Catalog;
  dealer: DealerInfo;
  valueOf: (card: string) => Promise<number>;
  /** Fraction of the value we pay at most when buying (and divisor of the minimum when selling). */
  safety?: number;
  /** What is left to spend (cap of the run and of the hour). */
  budget: number;
  /** Propose specific cards (`{buy: {card}}`) on rarity+set entries; false if the dealer already refused it. */
  cardTopic?: boolean;
  /** Our estimated value of a pack type (`GameState.packs`); without it (or `undefined`) packs are skipped. */
  packValueOf?: (pack: string) => number | undefined;
  /**
   * Blind buys: rarity+set (she picks the card) and packs (their contents score as luck, never as value). Off by
   * default: on 3 Oct they bought duplicates (threads 519+523: SAL-06 at 24 and SAL-08 at 32, both held, neg_points −39.8).
   */
  blindBuys?: boolean;
  /** Spend available to a page-completing buy (cash above the floor); without it, `budget`. */
  pageBudget?: number;
  /**
   * `--page-targets` (SAL-09): only a card of these completes a page with its bonus. The album scores nothing by itself,
   * so a card that would complete any other page is valued at its standalone base (`buildValueModel`), like any card.
   */
  pageTargets?: readonly string[];
  /**
   * `--page-bonus-scored`: a page target keeps its bonus (reservation value × `PAGE_COMPLETING_SAFETY`). Without it the
   * target is valued at its base too (no page bonus seen in neg_points yet), still with the page-completing budget.
   */
  pageBonusScored?: boolean;
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

/**
 * Final menu guard (thread 257): sell only what her `menu.buys` buys (rarity and sets) and buy only what
 * her `menu.sells` sells (the card, or its rarity in those sets). Returns the reason if it does not allow it.
 */
export function menuBlocks(dealer: DealerInfo, catalog: Catalog, c: Pick<Candidate, "side" | "rarity" | "set" | "card"> & { pack?: string | undefined }): string | undefined {
  if (c.pack !== undefined) return c.side === "buy" && dealer.menu.sells.some((e) => e.pack === c.pack) ? undefined : `${dealer.id} does not sell ${c.pack} (menu.sells)`;
  const rarity = c.rarity?.toLowerCase();
  const set = c.set ?? (c.card ? setOfCard(c.card) : undefined);
  const covers = (e: { rarity?: string | null | undefined; sets?: string | string[] | null | undefined; card?: string | null | undefined }) =>
    (c.card !== undefined && e.card === c.card) || (!e.card && !!rarity && e.rarity?.toLowerCase() === rarity && set !== undefined && setsOf(e, catalog).has(set));
  if (c.side === "sell") return dealer.menu.buys.some(covers) ? undefined : `${dealer.id} does not buy ${rarity ?? "?"} ${set ?? "?"} (menu.buys)`;
  return dealer.menu.sells.some((e) => !e.pack && covers(e)) ? undefined : `${dealer.id} does not sell ${c.card ?? `${rarity ?? "?"} ${set ?? "?"}`} (menu.sells)`;
}

export async function rankCandidates(input: RankInput): Promise<Candidate[]> {
  const { me, catalog, dealer, valueOf } = input;
  const safety = input.safety ?? 0.9;
  const cap = Math.floor(Math.max(0, Math.min(input.budget, me.cash)));
  const pageCap = Math.floor(Math.max(0, Math.min(input.pageBudget ?? input.budget, me.cash)));
  const pages = pagesOf(me);
  const held = new Set(me.assets.filter((a) => a.kind === "card").map((a) => a.ref));
  const buys: Candidate[] = [];
  /** Base of a card we lack (its first copy without the page bonus `value` carries when it completes the page). */
  const standaloneBase = (card: string, value: number): number => buildValueModel(catalog, heldAssets(me.assets), new Map([[card, value]])).base.get(card) ?? value;

  for (const entry of dealer.menu.sells) {
    if (entry.pack) {
      if (!input.blindBuys) continue;
      const value = input.packValueOf?.(entry.pack);
      const list = entry.list_price ?? undefined;
      if (value === undefined || list === undefined) continue;
      const opening = entry.opening_ask ?? Math.round(list * ASSUMED_OPENING_MARKUP);
      const reservation = Math.min(cap, Math.floor(value * PACK_SAFETY));
      const room = reservation > list && list < opening;
      const capped = reservation < Math.floor(value * PACK_SAFETY) ? " (capped by spend/cash)" : "";
      const perHour = entry.per_team_per_hour ?? undefined;
      buys.push({
        kind: "buy-pack",
        key: `buy:pack:${entry.pack}`,
        side: "buy",
        topic: { buy: { pack: entry.pack } },
        label: `buy pack ${entry.pack}`,
        rarity: undefined,
        set: undefined,
        pack: entry.pack,
        value,
        reservation,
        herList: list,
        herOpening: opening,
        herOpeningSource: entry.opening_ask ? "menu opening_ask" : `opening assumed list × ${ASSUMED_OPENING_MARKUP}`,
        surplus: round1(value - list),
        room,
        ...(perHour !== undefined ? { perHour } : {}),
        why: `pack value ~${round1(value)} (estimate) × ${PACK_SAFETY} = ${reservation} ${room ? ">" : "≤"} list ${list}: ${room ? `${reservation - list} P of room` : "no room"}${capped}; opening ${opening}${perHour !== undefined ? `; ${perHour} per team per hour` : ""}`,
      });
      continue;
    }
    const list = entry.list_price ?? undefined;
    const opening = entry.opening_ask ?? (list !== undefined ? Math.round(list * ASSUMED_OPENING_MARKUP) : undefined);
    if (opening === undefined) continue;
    const openingSource = entry.opening_ask ? "menu opening_ask" : `opening assumed list × ${ASSUMED_OPENING_MARKUP}`;
    const ref = list ?? opening;
    const finish = (raw: Omit<Candidate, "room" | "why" | "reservation" | "side" | "herList" | "herOpening" | "herOpeningSource" | "surplus">, extra: string): Candidate => {
      const completes = raw.kind === "buy-card" && raw.page !== undefined && raw.page.after >= raw.page.of;
      const completing = completes && raw.card !== undefined && (input.pageTargets ?? []).includes(raw.card);
      // Completing a page that is not a target: its value without the bonus (no page-completing budget either). A target
      // too, until --page-bonus-scored: capped at its base, but it keeps the page-completing budget and the reserve.
      const bonusOut = completes && raw.card !== undefined && !(completing && input.pageBonusScored);
      const c = bonusOut ? { ...raw, value: standaloneBase(raw.card!, raw.value) } : raw;
      if (bonusOut) extra += `; ${completing ? "page target" : `would complete the ${raw.page!.set} page`}, valued without its bonus (${completing ? "--page-bonus-scored lifts it" : "not a page target"}): ${round1(raw.value)} → ${round1(c.value)}`;
      const s = completing && input.pageBonusScored ? Math.min(safety, PAGE_COMPLETING_SAFETY) : safety;
      const reservation = Math.min(completing ? pageCap : cap, Math.floor(c.value * s));
      const room = reservation > ref;
      const capped = reservation < Math.floor(c.value * s) ? ` (capped by ${completing ? "cash above the floor" : "spend/cash"})` : "";
      const tag = completing ? `; COMPLETES the ${c.page!.set} page${input.pageBonusScored ? " (bonus in its value)" : ""}` : "";
      const why = room ? `value ${round1(c.value)} × ${s} = ${reservation} > list ${ref}: ${reservation - ref} P of room${capped}${extra}${tag}` : `value ${round1(c.value)} × ${s} = ${reservation} ≤ list ${ref}: no room${capped}${extra}${tag}`;
      return { ...c, side: "buy", reservation, herList: list, herOpening: opening, herOpeningSource: openingSource, surplus: round1(c.value - ref), room, why, ...(completing ? { pageCompleting: true } : {}) };
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
      // Specific cards on her rarity+set entry: the only way to fill a page without risking a duplicate.
      const pushCards = () => {
        if (input.cardTopic === false) return;
        for (const v of vals) {
          const fx = forexBuyRoute(dealer.id, v.id);
          // Only a card we already hold: the copy we buy is then the one we resell (our first stays). A card we lack would
          // stay in the album unsold (3 Oct: SAL-11 epic Picaros ~140 -> Pilar ~195, 143 P of 181 tied up for nothing).
          if (fx && v.held && forexLots(me) < FOREX_MAX_LOTS) {
            // Forex buy: valued at her rival's plausible bid; our max is the route's, so the resale clears the margin.
            const reservation = Math.min(cap, fx.maxBuy);
            const room = cap >= fx.maxBuy;
            buys.push({ kind: "buy-card", key: `buy:${v.id}`, side: "buy", topic: { buy: { card: v.id } }, label: `buy ${v.id} (forex → ${fx.to})`, rarity, set: setId, card: v.id, value: fx.plausibleBid, reservation, herList: list, herOpening: opening, herOpeningSource: openingSource, surplus: round1(fx.plausibleBid - ref), room, cardTopicUntested: true, forex: true, why: `forex: buy ≤ ${fx.maxBuy} here, resell to ${fx.to} ≥ ${fx.minSell} (plausible ${fx.plausibleBid}, fees ${fx.fees})${room ? "" : `; no room (cap ${cap})`}` });
            continue;
          }
          if (v.held) continue;
          buys.push(
            finish(
              { kind: "buy-card", key: `buy:${v.id}`, topic: { buy: { card: v.id } }, label: `buy ${v.id}`, rarity, set: setId, card: v.id, value: v.value, cardTopicUntested: true, ...(page ? { page: { set: setId, ...page, after: page.have + 1 } } : {}) },
              `; new for us; specific card on her ${rarity} entry (topic {buy:{card}}; if she refuses it, no blind fallback unless blind buys are on)`,
            ),
          );
        }
      };
      const heldVals = vals.filter((v) => v.held).map((v) => v.value);
      const duplicateP = round2(heldVals.length / vals.length);
      const limit = Math.min(cap, Math.floor(value * safety));
      const worstCaseLoss = heldVals.length ? round1(Math.max(0, limit - Math.min(...heldVals))) : 0;
      const margin = Math.max(RARITY_SET_MARGIN.min, Math.ceil(ref * RARITY_SET_MARGIN.frac));
      const risky = duplicateP > MAX_DUPLICATE_P && worstCaseLoss > MAX_WORST_CASE_LOSS;
      if (!input.blindBuys) {
        pushCards();
        continue;
      }
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
      pushCards();
    }
  }
  buys.sort((a, b) => Number(b.room) - Number(a.room) || b.surplus - a.surplus || b.value - a.value);

  const sells: Candidate[] = [];
  const buyRarities = new Map<string, Set<string>>();
  for (const entry of dealer.menu.buys) {
    const rarity = entry.rarity?.toLowerCase();
    if (rarity) buyRarities.set(rarity, setsOf(entry, catalog));
  }
  const targetSets = new Set((input.pageTargets ?? []).map((t) => setOfCard(t)));
  const byRef = new Map<string, Me["assets"]>();
  // Pablo, 3 Oct: hidden cards are never sold (catalog `hidden`, e.g. the egg prize LAT-13), nor any keepsake (`isKeepsake`).
  const hidden = new Set(catalog.sets.flatMap((st) => st.cards.filter((c) => (c as { hidden?: unknown }).hidden === true).map((c) => c.id)));
  for (const a of me.assets) if (a.kind === "card" && !a.locked && !hidden.has(a.ref) && !isKeepsake(a)) byRef.set(a.ref, [...(byRef.get(a.ref) ?? []), a]);
  for (const [ref, copies] of byRef) {
    const sorted = [...copies].sort((x, y) => (y.your_value ?? 0) - (x.your_value ?? 0));
    const top = sorted[0]!;
    const rarity = rarityOf(top);
    const set = setOfCard(ref, top as { set?: unknown });
    if (!rarity || !buyRarities.get(rarity)?.has(set)) continue;
    const sellList = dealer.menu.sells.find((s) => s.rarity?.toLowerCase() === rarity)?.list_price ?? undefined;
    const measured = MEASURED_BID_CEILING[rarity];
    if (sellList === undefined && measured === undefined) continue;
    const bid =
      sellList !== undefined
        ? { price: Math.max(1, Math.floor(sellList * PLAUSIBLE_BID_FRAC)), source: `unknown until her first bid; plausible ceiling her ${rarity} list ${sellList} × ${PLAUSIBLE_BID_FRAC}` }
        : { price: measured!, source: `unknown until her first bid; no ${rarity} sell list, plausible ceiling = highest ${rarity} bid measured in public settlements, else its book (${measured})` };
    const offered = sorted.length > 1 ? sorted.slice(1).map((a) => ({ a, copy: "duplicate" as const })) : [{ a: top, copy: "only" as const }];
    const fx = forexSellRoute(dealer.id, ref);
    if (fx) {
      // Forex resale: only a copy beyond our first, at the route's minimum (dealer deals never score at private values).
      for (const a of sorted.slice(1)) {
        const room = fx.plausibleBid >= fx.minSell;
        sells.push({ kind: "sell", key: `sell:${a.id}`, side: "sell", topic: { sell: { assets: [a.id] } }, label: `sell ${ref} (forex)`, rarity, set, card: ref, value: fx.minSell, reservation: fx.minSell, herList: sellList, herOpening: fx.plausibleBid, herOpeningSource: `forex route: her measured median for ${ref}`, surplus: round1(fx.plausibleBid - fx.minSell), room, bidUnknown: true, copy: "duplicate", forex: true, why: `forex resale: min ${fx.minSell} (bought ≤ ${fx.maxBuy}, fees ${fx.fees}), plausible ${fx.plausibleBid}; our first copy stays` });
      }
      continue;
    }
    for (const { a, copy } of offered) {
      // A value of 0 is unknown, not worthless (3 Oct: egg prize LAT-13, legendary print run 1, came with your_value 0 and
      // was offered to banco at a minimum of 1 P): never sold until it has a real value.
      if (typeof a.your_value !== "number" || a.your_value <= 0) continue;
      const value = a.your_value;
      const reservation = Math.max(1, Math.ceil(value / safety));
      const surplus = round1(bid.price - value);
      let room = bid.price >= reservation && bid.price > value;
      const pg = pages.get(set);
      const page = copy === "only" && pg && PAGE_RARITIES.has(rarity) ? { set, ...pg, after: pg.have - 1 } : undefined;
      const impact = page ? `our ONLY copy: ${set} page ${page.have}/${page.of} → ${page.after}/${page.of} (further from complete)` : "DUPLICATE: no album impact";
      let guard = "";
      if (room && copy === "only") {
        const pageComplete = page ? page.have / page.of : undefined;
        // The album scores nothing by itself: the page guard only holds for a page-target set or a complete page; any other
        // only copy is valued at its `your_value` (reservation) and still needs ONLY_COPY_MIN_SURPLUS.
        const guarded = page !== undefined && (page.have >= page.of || targetSets.has(set));
        if (guarded && pageComplete !== undefined && pageComplete >= ONLY_COPY_PAGE_COMPLETE_BLOCK) {
          room = false;
          guard = `; NEVER: our only copy and ${set} page is ${page!.have}/${page!.of} (≥ ${Math.round(ONLY_COPY_PAGE_COMPLETE_BLOCK * 100)} %) — that near-complete a page is where the page bonus drives most of the card's value, so we keep it and sell a duplicate instead`;
        } else if (surplus < ONLY_COPY_MIN_SURPLUS) {
          room = false;
          guard = `; SKIP: only copy needs at least +${ONLY_COPY_MIN_SURPLUS} P of value created to give it up (plausible +${surplus} P)`;
        }
      }
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
        herList: sellList,
        herOpening: bid.price,
        herOpeningSource: bid.source,
        surplus,
        room,
        bidUnknown: true,
        copy,
        ...(page ? { page } : {}),
        why: `her bid is unknown (could reach ${bid.price}); our value ${round1(value)} → min ${reservation}; ${room ? `plausible: up to +${surplus} P; if her first bid < ${DEFAULT_NEGOTIATOR_PARAMS.lowballFrac} × ${reservation} we close after one counter` : "her plausible ceiling does not reach our minimum: not opened"}; ${impact}${guard}`,
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

/** `--only` filter: side and words (rarity, set, card or asset id), e.g. `buy:uncommon:SAL`. */
export interface OnlyFilter {
  raw: string;
  side: Side;
  tokens: string[];
}

/** `"buy:uncommon:SAL,buy:common:SAL"` → filters in that order. Throws if an element doesn't start with buy/sell. */
export function parseOnly(spec: string): OnlyFilter[] {
  return spec
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((raw) => {
      const [side, ...tokens] = raw.split(":").map((t) => t.trim());
      if (side !== "buy" && side !== "sell") throw new Error(`--only: "${raw}" must start with buy: or sell:`);
      if (!tokens.length || tokens.some((t) => !t)) throw new Error(`--only: "${raw}" needs a rarity, set, card or id`);
      return { raw, side, tokens: tokens.map((t) => t.toLowerCase()) };
    });
}

/** Candidates matching the filters, in filter order (and by ranking within each), without repeats. */
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
 * Up to `maxThreads` conversations: buys with room (one common and one uncommon if both have
 * it), capped by the remaining spend; if short, sells with room (duplicates first, then
 * lowest album impact).
 */
export function selectCandidates(cands: readonly Candidate[], o: { maxThreads: number; maxSpend: number; pageSpend?: number; only?: boolean }): Selection[] {
  const out: Selection[] = [];
  let committed = 0;
  if (o.only) {
    // `--only`: in the requested order and without requiring room over her list; the negotiator still never exceeds our limit.
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
    const reservation = Math.min(c.reservation, Math.floor((c.pageCompleting ? (o.pageSpend ?? o.maxSpend) : o.maxSpend) - committed));
    // A forex buy sits below her list on purpose (Picaros list 63, public deals 48–56): she comes down or we close.
    if (!c.forex && reservation <= (c.herList ?? c.herOpening)) return;
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

/**
 * Unlock chase: P of value we accept to give up on ONE deal with the dealer whose deals unlock a persona early
 * (e.g. Pilar via Chato). Bounded: a buy pays at most value + 2, a sale charges at least value − 2.
 */
export const UNLOCK_CHASE_TOLERANCE = 2;

/**
 * Least harmful deal for an unlock chase when no candidate has room: sells of DUPLICATES (no album impact) whose
 * plausible bid reaches value − tolerance, and buys of a known card (or a rarity+set with no duplicate risk) whose list
 * fits value + tolerance and the spend left. Order: expected value created ≥ 0 first, duplicates before buys, then most
 * value created. Reservation = value ± tolerance (capped by spend for buys). Pure.
 */
export function chaseCandidates(cands: readonly Candidate[], o: { tolerance: number; maxSpend: number }): Candidate[] {
  const out: Candidate[] = [];
  for (const c of cands) {
    if (c.side === "sell") {
      if (c.copy !== "duplicate") continue;
      const reservation = Math.max(1, Math.ceil(c.value - o.tolerance));
      if (c.herOpening < reservation) continue;
      out.push({ ...c, reservation });
      continue;
    }
    if (c.kind === "buy-pack" || (c.kind === "buy-rarity-set" && (c.duplicateP ?? 1) > 0)) continue;
    const reservation = Math.min(Math.floor(o.maxSpend), Math.floor(c.value + o.tolerance));
    if (reservation < 1 || reservation < (c.herList ?? c.herOpening)) continue;
    out.push({ ...c, reservation });
  }
  return out.sort((a, b) => Number(b.surplus >= 0) - Number(a.surplus >= 0) || Number(b.side === "sell") - Number(a.side === "sell") || b.surplus - a.surplus);
}

export interface PathPreview {
  /** Our prices in order if she doesn't move from her first price. */
  prices: number[];
  outcome: string;
  rule: Rule;
  firstText: string | undefined;
}

/** Expected price path if she doesn't move (what we learned from Abuela buying commons from us). */
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
        herList: c.herList,
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
  /** Fraction of the value used as the limit (display only). */
  safety?: number;
}

/** Dry-run plan text: status, ranked candidates, the chosen ones and the first message of each. */
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
    const what = c.kind === "buy-pack" ? `BUY pack ${c.pack}` : c.kind === "buy-rarity-set" ? `BUY ${c.rarity} ${c.set} (any card of that rarity+set)` : c.kind === "buy-card" ? `BUY ${c.card}` : `SELL ${c.card} (${c.rarity}, ${c.copy === "duplicate" ? "DUPLICATE" : "ONLY copy"})`;
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
    const planned = plannedSchedule({ side: c.side, reservation: c.reservation, herOpening: c.herOpening, herList: c.herList }, params);
    const limitWhy = c.side === "buy" ? `value × ${c.kind === "buy-pack" ? PACK_SAFETY : (caps.safety ?? "safety")}, capped by spend/cash` : `value ÷ ${caps.safety ?? "safety"}`;
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
