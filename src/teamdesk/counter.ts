import type { Intent } from "../coordinator/coordinator.js";
import { enforceGuardrails } from "../engine/guardrails.js";
import { isKeepsake } from "../shared/asset-locks.js";
import { isLastFreeCopy } from "../shared/last-copy.js";
import {
  acceptLockedIds,
  evaluateOffer,
  readSide,
  slowReprice,
  tradeFee,
  venueFeesOf,
  DEFAULT_TRADE_PARAMS,
  RASTRO_FEES,
  type Evaluation,
  type FeeModel,
  type RivalSignals,
  type TickPlan,
  type TradeOffer,
  type TradeState,
} from "../trades/trades.js";

/**
 * Team desk: a structural counter-offer to an offer another team made TO us that play rejects. Only sales: the team
 * asked for a card of ours for cash, so we answer with a directed offer (`to` = that team, same venue) of the same card
 * (only a spare: never our last free copy) at a price from code: an anchor above the floor, stepping down monotonically, never below the floor (the card's
 * `your_value` plus margin, fee included). A spare (two or more free copies) the team signals demand for is offered too.
 * Never reads the rival's text; never buys.
 */

export const TEAM_DESK_PARAMS = {
  /** Anchor = floor × (1 + premium), rounded up (SAL-06: floor 132 → 151). */
  anchorPremium: 0.14,
  /** A counter older than this (ticks) steps down one slow-reprice step, while the team's offer is still open. */
  stepTicks: 6,
  stepFrac: 0.05,
  expiresInTicks: 30,
  maxOpen: 3,
  minMargin: 2,
  marginFrac: 0.1,
  /** Rejections we answer: the offer did not leave margin (a last-free-copy request is never countered). */
  reasons: ["below-margin"] as readonly string[],
  /** Venues we never operate on (they lift rival markets). */
  forbiddenVenues: ["v01", "v02", "v07", "v14"] as readonly string[],
};
export type TeamDeskParams = typeof TEAM_DESK_PARAMS;

export const TAG = "[team-desk]";

export interface DeskIncoming {
  id: number;
  team: string;
  venue: string;
  weGet: string;
  weGive: string;
  kind: Evaluation["kind"];
  value: number;
  verdict: string;
}

export interface DeskPost {
  intentId: string;
  team: string;
  venue: string;
  ref: string;
  assetId: number;
  price: number;
  floor: number;
  anchor: number;
  /** `your_value` of the copy we give (what the trade scores against). */
  value: number;
  fee: number;
  incomingId: number;
  replaces?: number;
  event: "counter" | "step";
  body: { venue: string; to: string; give: { assets: number[] }; want: { cash: number }; expires_in_ticks: number };
}

export interface DeskCancel {
  intentId: string;
  offerId: number;
  team: string;
  venue: string;
  ref: string;
  reason: string;
}

export interface DeskPlan {
  incoming: DeskIncoming[];
  posts: DeskPost[];
  cancels: DeskCancel[];
}

export interface DeskInput {
  tick: number;
  trade: TradeState | undefined;
  tradePlan?: TickPlan;
  rivals?: RivalSignals;
}

/** Last price we asked per `team:ref:venue` (counters stay monotonic across expiries within one run). */
export type DeskMemo = Map<string, number>;
const defaultMemo: DeskMemo = new Map();

const side = (offer: TradeOffer, key: "give" | "want") => {
  const s = readSide(offer[key]);
  return [...s.assets.map((a) => a.ref ?? `#${a.id}`), ...s.cards.map((c) => `any ${c}`), ...(s.cash ? [`${s.cash} P`] : [])].join("+") || "-";
};

/** Lowest integer price that leaves max(minMargin, marginFrac × price) over `loss` after fee. */
export function deskFloor(loss: number, fees: FeeModel, p: Pick<TeamDeskParams, "minMargin" | "marginFrac"> = TEAM_DESK_PARAMS): number {
  let price = Math.max(1, Math.ceil(loss + p.minMargin));
  while (price - tradeFee(price, 1, fees) - loss < Math.max(p.minMargin, p.marginFrac * price)) price++;
  return price;
}

/** Our open directed offers that are team-desk counters: one asset for cash, `to` set, outside El Rastro or in it. */
export function openCounters(trade: TradeState): { offer: TradeOffer; team: string; venue: string; assetId: number; ref: string; price: number }[] {
  return trade.mine.flatMap((o) => {
    if (!o.to || !o.venue || o.thread != null || (o.status ?? "open") !== "open" || (o.expires_tick != null && o.expires_tick <= trade.tick)) return [];
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.assets.length !== 1 || g.cash !== 0 || w.cash <= 0 || w.cards.length || w.assets.length) return [];
    const id = g.assets[0]!.id;
    const ref = g.assets[0]!.ref ?? trade.held.find((a) => a.id === id)?.ref;
    return ref ? [{ offer: o, team: o.to, venue: o.venue, assetId: id, ref, price: w.cash }] : [];
  });
}

export function proposeTeamDesk(input: DeskInput, params: TeamDeskParams = TEAM_DESK_PARAMS, memo: DeskMemo = defaultMemo, ours: ReadonlySet<number> = new Set()): { intents: Intent[]; notes: string[]; plan: DeskPlan } {
  const intents: Intent[] = [];
  const notes: string[] = [];
  const plan: DeskPlan = { incoming: [], posts: [], cancels: [] };
  const trade = input.trade;
  if (!trade) return { intents, notes: [`${TAG} off: no trade state`], plan };
  const lockedIds = acceptLockedIds(trade);
  const mineIds = new Set(trade.mine.map((o) => o.id));
  const evals = trade.toMe.map((o) => evaluateOffer(o, "to_me", trade, DEFAULT_TRADE_PARAMS, mineIds, lockedIds));
  for (const e of evals) {
    if (!e.offer.maker || !e.offer.venue) continue;
    plan.incoming.push({ id: e.offer.id, team: e.offer.maker, venue: e.offer.venue, weGet: side(e.offer, "give"), weGive: side(e.offer, "want"), kind: e.kind, value: Math.round(e.valueCreated * 10) / 10, verdict: e.ok ? "ok" : e.reason });
  }

  // Sale requests we answer: cash for one card of ours, rejected for margin or last copy, on an allowed venue.
  const requests = evals.flatMap((e) => {
    const o = e.offer;
    if (e.ok || !params.reasons.includes(e.reason) || !o.maker || !o.venue || o.thread != null) return [];
    if (params.forbiddenVenues.includes(o.venue)) {
      notes.push(`${TAG} skip #${o.id} from ${o.maker}: venue ${o.venue} is off-limits`);
      return [];
    }
    const give = readSide(o.give);
    const want = readSide(o.want);
    const refs = [...want.cards, ...want.assets.flatMap((a) => (a.ref ? [a.ref] : []))];
    if (give.assets.length || give.cards.length || refs.length !== 1) return [];
    return [{ offer: o, team: o.maker, venue: o.venue, ref: refs[0]!, offered: give.cash }];
  });

  // Busy assets: our other open offers (El Rastro listings, rival-page, swaps), assets the El Rastro plan posts, locks.
  // Only counters this desk posted (`ours`, seeded from the log): rival-page and rival-swap own their directed offers.
  const counters = openCounters(trade).filter((c) => ours.has(c.offer.id));
  const counterIds = new Set(counters.map((c) => c.offer.id));
  const busy = new Set<number>();
  for (const o of trade.mine) if ((o.status ?? "open") === "open" && !counterIds.has(o.id)) for (const a of readSide(o.give).assets) busy.add(a.id);
  for (const p of input.tradePlan?.posts ?? []) if ("assets" in p.body.give) for (const id of p.body.give.assets) busy.add(id);
  const usable = (id: number) => {
    const a = trade.held.find((h) => h.id === id);
    return !!a && !a.locked && !trade.reserved.has(id) && !busy.has(id);
  };

  const fees = (venue: string) => venueFeesOf(venue, trade.venueFees, RASTRO_FEES);
  const priceFor = (key: string, value: number, venue: string) => {
    const floor = deskFloor(value, fees(venue), params);
    const anchor = Math.max(floor, Math.ceil(floor * (1 + params.anchorPremium)));
    const last = memo.get(key);
    // Monotonic for the seller: never above our last ask for this team and card, never below the floor.
    return { floor, anchor, price: enforceGuardrails({ role: "seller", reservation: floor }, anchor, last) };
  };
  let open = counters.length;
  const answered = new Set<string>();

  // Existing counters: step down while the team's offer is open, cancel when the floor rose above the ask.
  for (const c of counters) {
    const key = `${c.team}:${c.ref}:${c.venue}`;
    answered.add(key);
    const asset = trade.held.find((a) => a.id === c.assetId);
    if (!asset) continue;
    const { floor, anchor } = priceFor(key, asset.value, c.venue);
    memo.set(key, Math.min(memo.get(key) ?? c.price, c.price));
    const intentId = `teamdesk:cancel:${c.offer.id}`;
    if (c.price < floor) {
      plan.cancels.push({ intentId, offerId: c.offer.id, team: c.team, venue: c.venue, ref: c.ref, reason: `floor ${floor} rose above ask ${c.price}` });
      intents.push({ id: intentId, route: "markets", kind: "cancel", summary: `${TAG} cancel #${c.offer.id} ${c.ref} → ${c.team} (floor rose)` });
      continue;
    }
    const req = requests.find((r) => r.team === c.team && r.ref === c.ref && r.venue === c.venue);
    // Age from created_tick, or from expires_tick minus the expiry we post with.
    const created = c.offer.created_tick ?? (c.offer.expires_tick != null ? c.offer.expires_tick - params.expiresInTicks : input.tick);
    const age = input.tick - created;
    if (!req || age < params.stepTicks || c.price <= floor) {
      notes.push(`${TAG} hold #${c.offer.id} ${c.ref} → ${c.team}@${c.venue} @ ${c.price} P (floor ${floor}, age ${age})`);
      continue;
    }
    const next = enforceGuardrails({ role: "seller", reservation: floor }, slowReprice(c.price, floor, params.stepFrac), c.price);
    if (next >= c.price) continue;
    plan.cancels.push({ intentId, offerId: c.offer.id, team: c.team, venue: c.venue, ref: c.ref, reason: `step ${c.price} → ${next}` });
    intents.push({ id: intentId, route: "markets", kind: "cancel", summary: `${TAG} cancel #${c.offer.id} to step down` });
    const post = makePost("step", c.team, c.venue, c.ref, c.assetId, next, floor, anchor, asset.value, fees(c.venue), req.offer.id, params, c.offer.id);
    plan.posts.push(post);
    intents.push(postIntent(post));
    memo.set(key, next);
    notes.push(`${TAG} step #${c.offer.id} ${c.ref} → ${c.team}@${c.venue}: ${c.price} → ${next} P (floor ${floor})`);
  }

  // New counters: the requested card, then spares the team signals demand for.
  for (const r of requests) {
    const wanted = [r.ref, ...[...(input.rivals?.demand ?? new Map<string, string[]>())].filter(([ref, teams]) => ref !== r.ref && teams.includes(r.team)).map(([ref]) => ref)];
    for (const ref of wanted) {
      const key = `${r.team}:${ref}:${r.venue}`;
      if (answered.has(key)) continue;
      answered.add(key);
      if (open >= params.maxOpen) {
        notes.push(`${TAG} skip ${ref} → ${r.team}: ${params.maxOpen} counters open`);
        continue;
      }
      const copies = trade.held.filter((a) => a.ref === ref && usable(a.id)).sort((x, y) => x.value - y.value || y.id - x.id);
      const asset = copies[0];
      if (!asset) {
        notes.push(`${TAG} skip ${ref} → ${r.team}: no free copy (listed, locked or reserved)`);
        continue;
      }
      // A copy with no private value (an egg gift such as LAT-13: your_value 0) has no floor from code: never countered.
      // Legendaries and epics too: their price is Pablo's call, not the margin rule's.
      const rarity = trade.model.meta.get(ref)?.rarity;
      const legendary = rarity === "legendary" || rarity === "epic" || rarity === undefined;
      // Hidden cards are never sold (Pablo's rule), whatever their value: the shared keepsake guard.
      if (isKeepsake({ ref, ...(rarity ? { rarity } : {}), your_value: asset.value })) {
        notes.push(`${TAG} skip ${ref} → ${r.team}: hidden or keepsake card, never sold`);
        continue;
      }
      if (asset.value <= 0 || legendary) {
        notes.push(`${TAG} skip ${ref} → ${r.team}: ${legendary ? `rarity ${rarity ?? "unknown"}` : `your_value ${asset.value}`} (no floor from code; needs a price from Pablo)`);
        continue;
      }
      // Never our last free copy (Pablo, 3 Oct: complete pages are not sold): only spares, requested or not.
      if (isLastFreeCopy(asset.id, trade.held, lockedIds, trade.reserved)) {
        if (ref === r.ref) notes.push(`${TAG} skip ${ref} → ${r.team}: our last free copy (complete pages are not sold)`);
        continue;
      }
      const { floor, anchor, price } = priceFor(key, asset.value, r.venue);
      if (ref === r.ref && r.offered >= price) continue;
      const post = makePost("counter", r.team, r.venue, ref, asset.id, price, floor, anchor, asset.value, fees(r.venue), r.offer.id, params);
      plan.posts.push(post);
      intents.push(postIntent(post));
      memo.set(key, price);
      busy.add(asset.id);
      open += 1;
      notes.push(`${TAG} counter #${r.offer.id} (${r.team} offers ${r.offered} P for ${r.ref}) → ${ref} @ ${price} P on ${r.venue} (floor ${floor}, anchor ${anchor})`);
    }
  }
  if (!plan.posts.length && !plan.cancels.length && !notes.length) notes.push(`${TAG} no rejected sale request to counter (${evals.length} to-me)`);
  return { intents, notes, plan };
}

function makePost(event: DeskPost["event"], team: string, venue: string, ref: string, assetId: number, price: number, floor: number, anchor: number, value: number, fees: FeeModel, incomingId: number, params: TeamDeskParams, replaces?: number): DeskPost {
  return {
    intentId: `teamdesk:post:${team}:${ref}:${venue}`,
    team,
    venue,
    ref,
    assetId,
    price,
    floor,
    anchor,
    value,
    fee: tradeFee(price, 1, fees),
    incomingId,
    event,
    ...(replaces !== undefined ? { replaces } : {}),
    body: { venue, to: team, give: { assets: [assetId] }, want: { cash: price }, expires_in_ticks: params.expiresInTicks },
  };
}

function postIntent(p: DeskPost): Intent {
  return {
    id: p.intentId,
    route: "markets",
    kind: "listing",
    ev: p.price - p.fee - p.value,
    price: p.price,
    ref: p.ref,
    locks: [`asset:${p.assetId}`],
    summary: `${TAG} ${p.event} ${p.ref} → ${p.team}@${p.venue} @ ${p.price} P (floor ${p.floor})`,
  };
}
