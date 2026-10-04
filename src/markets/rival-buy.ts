import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Intent } from "../coordinator/coordinator.js";
import { enforceGuardrails } from "../engine/guardrails.js";
import type { RivalsState, RivalTeam } from "../state/rivals.js";
import { buyGain, countHoldings, maxBid, median, MAKER_FEES, readSide, setOf, slowReprice, tradeFee, type TickPlan, type TradeOffer, type TradeState } from "../trades/trades.js";
import { fairPrice } from "./markets.js";
import { setMultipliers } from "./rival-page.js";
import { COUNTERPARTY_CAP, MIN_ROOM, roomOf } from "./room.js";

/**
 * Rival buy: a directed El Rastro bid (`to` = the team, cash for one card) for a page card we lack, sent to a rival
 * seen holding a spare copy of it. Structure only (cards seen with the team, `/api/cards` confirmations); the figure
 * comes from code: our cap = what the card adds to us minus margin (`maxBid`; no fee: the seller accepts and pays it); their floor = the estimated
 * value of a spare copy to them (median set multiplier × book × second-copy marginal); we bid their floor plus a share
 * of the gap, never above the cap. Never for a card El Rastro already bids on (no double fill), and only within the
 * `--max-spend` budget that El Rastro leaves.
 *
 * Two lanes. Normal: a page card of our album, bid capped at `maxBid` (30 P). High value (Pablo, 3 Oct, after MAL-10 at
 * 30 P scored +50.2): any card we lack, a single copy included, whose `/api/me/value` (the value the server scores with, not our model) leaves
 * at least `hiMinEdge` over the bid, capped at `hiMaxBid` (60 P), at most `hiPerWindow` new bids per `hiWindowTicks`.
 */

export const RIVAL_BUY_PARAMS = {
  shareOfGap: 0.3,
  minGap: 2,
  maxOpen: 2,
  expiresInTicks: 20,
  repriceAfterTicks: 10,
  repriceFrac: 0.1,
  maxReprices: 2,
  backoffTicks: 40,
  /** A spare seen (or confirmed) longer ago than this is not bid for. */
  maxStaleTicks: 60,
  /** Normal lane: ceiling of one directed bid (P). */
  maxBid: 30,
  /** High-value lane: ceiling (P), minimum `/api/me/value` − bid, and new bids allowed per rolling window. */
  hiMaxBid: 60,
  hiMinEdge: 20,
  hiPerWindow: 2,
  /** One game hour at 30 s a tick. A restart forgets the window (at most one extra window's worth). */
  hiWindowTicks: 120,
  /** `/api/me/value` lookups per tick for candidate cards (cached for an hour by the client). */
  valueLookups: 8,
};
export type RivalBuyParams = typeof RIVAL_BUY_PARAMS;

/**
 * Epic test lane (`--rival-buy-epic`, Pablo, 4 Oct, test A): one card, directed only to a closed list of holders, one
 * bid open at a time. Price steps start → midpoint → ceiling (`maxReprices` raises, one every `repriceAfterTicks`); a
 * team that does not fill after the last step is done for the run and the next listed holder gets the cycle. Its own
 * cash floor; `/api/me/value` must stay at or above the ceiling (else no bid). The card is never resold (a single copy
 * is never a duplicate). Outside `--max-spend`: the approval set its own ceiling and floor.
 */
export interface EpicBuyParams {
  ref: string;
  teams: readonly string[];
  start: number;
  ceiling: number;
  maxReprices: number;
  repriceAfterTicks: number;
  expiresInTicks: number;
  cashFloor: number;
  /** Open lane: one bid on El Rastro to anyone (no `to`, `teams` unused) at the ceiling, never repriced, reposted when it expires. */
  open?: boolean;
}
export const EPIC_BUY_PARAMS: EpicBuyParams = { ref: "SAL-11", teams: ["t18", "t08", "t17", "t04"], start: 185, ceiling: 185, maxReprices: 0, repriceAfterTicks: 10, expiresInTicks: 20, cashFloor: 100 };
/**
 * Second epic lane: RET-11 (value 288 = book 180 × RET 1.6, no page bonus). Directed to t05/t12/t10 up to 240 got no
 * fill (4 Oct); directed bids between teams fill ~3 % (26 of 811), open ones far more, so it is now one open bid at 240
 * for 40 ticks (coordinator OK with Pablo's rule, 4 Oct).
 */
export const EPIC_BUY_RET11: EpicBuyParams = { ref: "RET-11", teams: [], start: 240, ceiling: 240, maxReprices: 0, repriceAfterTicks: 40, expiresInTicks: 40, cashFloor: 100, open: true };
/** Every lane `--rival-buy-epic` runs; each keeps one bid open, and the cash floor counts what the others commit. */
export const EPIC_BUY_LANES: readonly EpicBuyParams[] = [EPIC_BUY_PARAMS, EPIC_BUY_RET11];

/** Price of step `n` (0 = start, `maxReprices` = ceiling), never above the ceiling. */
export function epicStep(epic: EpicBuyParams, n: number): number {
  const steps = Math.max(1, epic.maxReprices);
  return Math.min(epic.ceiling, Math.round(epic.start + ((epic.ceiling - epic.start) * Math.min(n, steps)) / steps));
}

const MIN_MARGIN = 2;
const TAG = "[rival-buy]";

export interface RivalBuyInput {
  tick: number;
  trade: TradeState | undefined;
  /** El Rastro plan this tick: its bids and the budget it already commits. */
  tradePlan?: TickPlan;
  rivals: RivalsState | undefined;
  /** `--max-spend`: shared with El Rastro (what it spent and commits comes first). */
  maxSpend: number;
  cashFloor: number;
  /** Agenda freeze: no new bids and open ones are cancelled. */
  opensBlocked?: string;
  /** `--page-targets` with `--page-bonus-scored`: only then their sets' page bonus counts in a bid; otherwise every card is bid at its standalone value. */
  pageTargets?: readonly string[];
  pageBonusScored?: boolean;
  /** Cash kept for the page targets (`pageReserveOf`): every directed bid is a page card, so it stays above it. */
  pageReserve?: number;
  /** `/api/me/value` of candidate cards we lack (`rivalBuyValues`): enables the high-value lane. */
  apiValues?: ReadonlyMap<string, number>;
  /** `--rival-buy-epic`: the epic lanes (one or several); their cards leave the normal and high-value lanes. */
  epic?: EpicBuyParams | readonly EpicBuyParams[];
  /** Score room left per counterparty (`loadCounterpartyRoom`): a team below `MIN_ROOM` is never bid to. */
  room?: ReadonlyMap<string, number>;
}

export interface RivalBuyPricing {
  team: string;
  ref: string;
  /** Copies of the card seen with the team. */
  copies: number;
  /** Tick of the freshest sighting or confirmation of those copies. */
  freshAt: number;
  gain: number;
  cap: number;
  theirFloor: number;
  bid: number;
  fee: number;
  /** `/api/me/value` of the card, when known. */
  apiValue?: number;
  /** The bid needs the high-value lane (above `maxBid`, or not a page card). */
  hi: boolean;
}

export type BuyAssessment = { ok: true; p: RivalBuyPricing } | { ok: false; reason: string; p?: Partial<RivalBuyPricing> };

export interface RivalBuyMemoEntry {
  reprices: number;
  backoffUntil?: number;
}
export type RivalBuyMemo = Map<string, RivalBuyMemoEntry>;
const defaultMemo: RivalBuyMemo = new Map();

/** Epic-lane holders marked done (`<team>:<ref>`), kept on disk so a restart of `pnpm bazaar:play` does not bid them again. */
export const defaultEpicDoneFile = (root: string): string => join(root, "results", "bazaar-live", "epic-done.json");

/**
 * Loads the done holders into `memo` (missing or unreadable file: nothing). A holder that turned down a lower ceiling
 * than its lane's current one is not loaded (it gets a new cycle at the higher ceiling). Returns the keys loaded.
 */
export function seedEpicDone(file: string, memo: RivalBuyMemo = defaultMemo, lanes: readonly EpicBuyParams[] = []): string[] {
  if (!existsSync(file)) return [];
  try {
    const all = JSON.parse(readFileSync(file, "utf8")) as Record<string, { ceiling?: number } | null>;
    const ceilingOf = new Map(lanes.map((l) => [l.ref, l.ceiling]));
    const keys = Object.keys(all).filter((k) => {
      const now = ceilingOf.get(k.split(":")[1] ?? "");
      const seen = all[k]?.ceiling;
      return now === undefined || seen === undefined || seen >= now;
    });
    for (const k of keys) memo.set(k, { reprices: 0, backoffUntil: Infinity });
    return keys;
  } catch {
    return [];
  }
}

function saveEpicDone(file: string, key: string, tick: number, ceiling?: number): void {
  let all: Record<string, unknown> = {};
  try {
    if (existsSync(file)) all = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    // An unreadable file is rewritten with this key.
  }
  all[key] = { tick, at: new Date().toISOString(), ...(ceiling !== undefined ? { ceiling } : {}) };
  writeFileSync(file, JSON.stringify(all, null, 1));
}
/** Ticks at which high-value bids were posted (new ones, not reprices). */
export type HiBuyLedger = number[];
const defaultHiLedger: HiBuyLedger = [];

export interface RivalBuyPost {
  intentId: string;
  team: string;
  ref: string;
  price: number;
  replaces?: number;
  reprice: number;
  hi?: boolean;
  /** Epic test lane post (`--rival-buy-epic`). */
  epic?: boolean;
  /** `to` is missing only on the open epic lane. */
  body: { venue: "rastro"; to?: string; give: { cash: number }; want: { cards: string[] }; expires_in_ticks: number };
}

export interface RivalBuyCancel {
  intentId: string;
  offerId: number;
  key: string;
  backoff: boolean;
  /** Epic lane: this team is done for the run (no new cycle). */
  done?: boolean;
  /** Epic lane: the ceiling the team turned down (a later, higher ceiling bids it again). */
  ceiling?: number;
  reason: string;
}

export interface RivalBuyPlan {
  posts: RivalBuyPost[];
  cancels: RivalBuyCancel[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/** Cards El Rastro bids on: its open public bids and the ones it posts this tick. */
function rastroBids(trade: TradeState, plan: TickPlan | undefined): Set<string> {
  const out = new Set<string>();
  for (const o of trade.mine) {
    if (o.to || o.venue !== "rastro" || o.thread != null || (o.status ?? "open") !== "open") continue;
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.cash > 0 && !g.assets.length) for (const c of w.cards) out.add(c);
  }
  for (const p of plan?.posts ?? []) if (p.kind === "bid") out.add(p.ref);
  return out;
}

/** Budget left for directed bids: `--max-spend` minus what El Rastro spent and commits this tick. */
export function spendLeft(input: RivalBuyInput): number {
  const t = input.trade;
  if (!t) return 0;
  const accept = input.tradePlan?.accept?.spend ?? 0;
  return Math.min(input.maxSpend - t.spent - (input.tradePlan?.committedAfter ?? 0) - accept, t.cash - input.cashFloor - (input.pageReserve ?? 0) - (input.tradePlan?.committedAfter ?? 0) - accept);
}

/** Prices one card from one team; `ok: false` with the reason when no bid must go out. */
export function assessRivalBuy(team: RivalTeam, ref: string, input: RivalBuyInput, params: RivalBuyParams = RIVAL_BUY_PARAMS): BuyAssessment {
  const trade = input.trade!;
  const model = trade.model;
  const counts = countHoldings(trade.held);
  if ((counts.get(ref) ?? 0) > 0) return { ok: false, reason: `we hold ${ref}` };
  const set = model.meta.get(ref)?.set ?? setOf(ref);
  const pageCard = trade.pageSets.includes(set) && (model.pages.get(set) ?? []).includes(ref);
  const apiValue = input.apiValues?.get(ref);
  if (!pageCard && apiValue === undefined) return { ok: false, reason: `${ref} is not a page card of our album` };
  const mine = team.seen.filter((s) => s.ref === ref);
  if (!mine.length || (mine.length < 2 && apiValue === undefined)) return { ok: false, reason: `${team.team} has no spare ${ref} seen` };
  // A single copy is bid for only in the high-value lane (approved by Pablo, 3 Oct); the other team decides whether to sell.
  const spare = mine.length >= 2;
  const freshAt = Math.max(...mine.map((s) => s.confirmedTick ?? s.tick));
  if (input.tick - freshAt > params.maxStaleTicks) return { ok: false, reason: `spare seen at tick ${freshAt} (stale)` };
  const modelGain = pageCard ? buyGain(counts, ref, model, new Set(input.pageBonusScored ? (input.pageTargets ?? []).map(setOf) : [])) : 0;
  const normalCap = pageCard && spare ? Math.min(params.maxBid, maxBid(modelGain, MIN_MARGIN, MAKER_FEES)) : 0;
  const hiCap = apiValue !== undefined ? Math.min(params.hiMaxBid, Math.floor(apiValue - params.hiMinEdge)) : 0;
  const cap = Math.max(normalCap, hiCap);
  const gain = apiValue ?? modelGain;
  const book = model.meta.get(ref)?.book ?? 0;
  const mHat = median([...setMultipliers(model).values()]) ?? 1;
  const second = spare ? (model.rules.marginals[1] ?? model.rules.marginals.at(-1) ?? 0.5) : (model.rules.marginals[0] ?? 1);
  const theirFloor = Math.max(1, Math.ceil(mHat * book * second) + 1);
  const base: Partial<RivalBuyPricing> = { team: team.team, ref, copies: mine.length, freshAt, gain, cap, theirFloor, ...(apiValue !== undefined ? { apiValue } : {}) };
  if (cap < 1) return { ok: false, reason: `no bid fits our value (gain ${r1(gain)})`, p: base };
  if (cap - theirFloor < params.minGap) return { ok: false, reason: `cap ${cap} − their floor ${theirFloor} < ${params.minGap}`, p: base };
  const raw = theirFloor + Math.round(params.shareOfGap * (cap - theirFloor));
  const bid = enforceGuardrails({ role: "buyer", reservation: cap }, raw);
  const fee = tradeFee(bid, 1, MAKER_FEES);
  if (!fairPrice("buy", bid, book || undefined)) return { ok: false, reason: `bid ${bid} above fair play (twice the book)`, p: base };
  const hi = bid > normalCap;
  if (hi && (apiValue === undefined || apiValue - bid < params.hiMinEdge)) return { ok: false, reason: `bid ${bid} above the normal cap ${normalCap} without /api/me/value − bid ≥ ${params.hiMinEdge}`, p: base };
  return { ok: true, p: { ...(base as RivalBuyPricing), bid, fee, hi } };
}

/** Our directed cash-for-one-card bids on El Rastro (open, not expired). */
/** Our open (no `to`) single-card cash bids on El Rastro for `ref`: the epic open lane's own. */
export function openBids(trade: TradeState, ref: string): { offer: TradeOffer; team: string; ref: string; price: number }[] {
  return trade.mine.flatMap((o) => {
    if (o.to || o.venue !== "rastro" || o.thread != null || (o.status ?? "open") !== "open" || (o.expires_tick != null && o.expires_tick <= trade.tick)) return [];
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.cash <= 0 || g.assets.length || w.cash !== 0 || w.assets.length || w.cards.length !== 1 || w.cards[0] !== ref) return [];
    return [{ offer: o, team: "open", ref, price: g.cash }];
  });
}

export function directedBids(trade: TradeState): { offer: TradeOffer; team: string; ref: string; price: number }[] {
  return trade.mine.flatMap((o) => {
    if (!o.to || o.venue !== "rastro" || o.thread != null || (o.status ?? "open") !== "open" || (o.expires_tick != null && o.expires_tick <= trade.tick)) return [];
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.cash <= 0 || g.assets.length || w.cash !== 0 || w.assets.length || w.cards.length !== 1) return [];
    return [{ offer: o, team: o.to, ref: w.cards[0]!, price: g.cash }];
  });
}

const describe = (p: RivalBuyPricing) =>
  `${p.ref} ← ${p.team} (${p.copies} copies seen, fresh at tick ${p.freshAt}) · gain ${r1(p.gain)}${p.apiValue !== undefined ? " (/api/me/value)" : ""} · cap ${p.cap} · their floor ~${p.theirFloor} · fee ${p.fee} · bid ${p.bid}${p.hi ? " · high-value lane" : ""}`;

/**
 * Proposes directed bids (new, reprices) and cancels. Pure except for reading `memo`. Safe by default: missing data,
 * agenda freeze or no budget → no new bids and a note.
 */
export function proposeRivalBuy(input: RivalBuyInput, params: RivalBuyParams = RIVAL_BUY_PARAMS, memo: RivalBuyMemo = defaultMemo, hiLedger: HiBuyLedger = defaultHiLedger): { intents: Intent[]; notes: string[]; plan: RivalBuyPlan } {
  const intents: Intent[] = [];
  const notes: string[] = [];
  const plan: RivalBuyPlan = { posts: [], cancels: [] };
  const trade = input.trade;
  if (!trade) {
    notes.push(`${TAG} off: no El Rastro state this tick`);
    return { intents, notes, plan };
  }
  const existing = directedBids(trade);
  const handled = new Set<string>();
  const cancel = (offerId: number, key: string, reason: string, backoff = false) => {
    handled.add(key);
    const intentId = `markets:rivalbuy:cancel:${offerId}`;
    plan.cancels.push({ intentId, offerId, key, backoff, reason });
    intents.push({ id: intentId, route: "markets", kind: "cancel", summary: `${TAG} cancel #${offerId} (${reason})` });
    notes.push(`${TAG} cancel #${offerId} ${reason}`);
  };
  const rivals = input.rivals;
  const off = !rivals ? "rivals unavailable" : input.opensBlocked ? `agenda: ${input.opensBlocked}` : undefined;
  if (off) {
    notes.push(`${TAG} off: ${off}`);
    for (const e of existing) cancel(e.offer.id, `${e.team}:${e.ref}`, off);
    return { intents, notes, plan };
  }
  const byTeam = new Map(rivals!.teams.map((t) => [t.team, t]));
  const rastro = rastroBids(trade, input.tradePlan);
  let budget = spendLeft(input);
  const epics: readonly EpicBuyParams[] = !input.epic ? [] : "ref" in input.epic ? [input.epic] : input.epic;
  const epicRefs = new Set(epics.map((e) => e.ref));
  // Each lane's cash floor counts what the other lanes keep open or post this tick (open bids hold no cash server side).
  const epicKept = new Map<string, number>(epics.map((e) => [e.ref, (e.open ? openBids(trade, e.ref) : existing.filter((x) => x.ref === e.ref)).reduce((s, x) => s + x.price, 0)]));
  for (const epic of epics) {
    const others = [...epicKept].filter(([ref]) => ref !== epic.ref).reduce((s, [, v]) => s + v, 0);
    epicKept.set(epic.ref, proposeEpicBuy(input, epic, existing, memo, { intents, notes, plan }, others));
  }

  // Existing directed bids: cancel, reprice or keep (what they commit comes off the budget).
  let open = 0;
  for (const e of existing) {
    if (epicRefs.has(e.ref)) continue;
    const key = `${e.team}:${e.ref}`;
    const team = byTeam.get(e.team);
    if (!team) {
      cancel(e.offer.id, key, `${e.team} not in the rivals view`);
      continue;
    }
    if (rastro.has(e.ref)) {
      cancel(e.offer.id, key, `El Rastro bids on ${e.ref} (no double fill)`);
      continue;
    }
    if (roomOf(input.room, e.team) < MIN_ROOM) {
      cancel(e.offer.id, key, `${e.team} score room ${roomOf(input.room, e.team)} < ${MIN_ROOM}`, true);
      continue;
    }
    const asm = assessRivalBuy(team, e.ref, input, params);
    const cap = asm.p?.cap;
    if (!asm.ok && !/^cap /.test(asm.reason)) {
      cancel(e.offer.id, key, asm.reason);
      continue;
    }
    if (cap === undefined || e.price > cap) {
      cancel(e.offer.id, key, cap === undefined ? "no cap" : `bid ${e.price} > cap ${cap}`);
      continue;
    }
    const age = trade.tick - (e.offer.created_tick ?? trade.tick);
    let committed = e.price + tradeFee(e.price, 1, MAKER_FEES);
    if (age >= params.repriceAfterTicks) {
      const n = memo.get(key)?.reprices ?? 0;
      const next = enforceGuardrails({ role: "buyer", reservation: cap }, Math.min(cap, slowReprice(e.price, cap, params.repriceFrac)), e.price);
      const extra = next + tradeFee(next, 1, MAKER_FEES) - committed;
      if (n >= params.maxReprices || next <= e.price || extra > budget) {
        cancel(e.offer.id, key, `no fill after ${n} reprice(s)${extra > budget ? " and no budget to raise" : ""}; backoff ${params.backoffTicks} ticks`, true);
        continue;
      }
      cancel(e.offer.id, key, `reprice ${e.price} → ${next}`);
      const post = makePost(e.team, e.ref, next, params, n + 1, e.offer.id);
      plan.posts.push(post);
      intents.push(postIntent(post, `${TAG} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${params.maxReprices})`, (asm.p?.gain ?? 0) - next - tradeFee(next, 1, MAKER_FEES)));
      notes.push(`${TAG} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${params.maxReprices})`);
      committed = next + tradeFee(next, 1, MAKER_FEES);
    }
    budget -= committed;
    open += 1;
    handled.add(key);
  }

  // New candidates: page cards we lack that a rival holds a spare of.
  const fresh: RivalBuyPricing[] = [];
  for (const [ref, who] of Object.entries(rivals!.byRef)) {
    if (epicRefs.has(ref)) continue;
    for (const t of who.holders) {
      const team = byTeam.get(t);
      const key = `${t}:${ref}`;
      if (!team || handled.has(key) || team.seen.filter((s) => s.ref === ref).length < (input.apiValues?.has(ref) ? 1 : 2)) continue;
      if (roomOf(input.room, t) < MIN_ROOM) {
        notes.push(`${TAG} skip ${ref} ← ${t}: score room ${roomOf(input.room, t)} < ${MIN_ROOM}`);
        continue;
      }
      const until = memo.get(key)?.backoffUntil;
      if (until !== undefined && until > trade.tick) {
        notes.push(`${TAG} skip ${ref} ← ${t}: backoff until tick ${until}`);
        continue;
      }
      const asm = assessRivalBuy(team, ref, input, params);
      if (!asm.ok) {
        if (!/^we hold|is not a page card|^no bid fits/.test(asm.reason)) notes.push(`${TAG} skip ${ref} ← ${t}: ${asm.reason}`);
        continue;
      }
      if (rastro.has(ref)) {
        notes.push(`${TAG} skip ${ref} ← ${t}: El Rastro already bids on it (would be ${asm.p.bid} directed)`);
        continue;
      }
      fresh.push(asm.p);
    }
  }
  // Most value created first; one bid per card.
  fresh.sort((a, b) => b.gain - b.bid - (a.gain - a.bid) || a.ref.localeCompare(b.ref) || a.team.localeCompare(b.team));
  const refs = new Set(existing.filter((e) => !epicRefs.has(e.ref)).map((e) => e.ref));
  let hiUsed = hiLedger.filter((t) => t > trade.tick - params.hiWindowTicks).length;
  for (const p of fresh) {
    if (refs.has(p.ref)) continue;
    if (open >= params.maxOpen) {
      notes.push(`${TAG} skip ${p.ref} ← ${p.team}: ${open}/${params.maxOpen} directed bids open`);
      continue;
    }
    if (p.hi && hiUsed >= params.hiPerWindow) {
      notes.push(`${TAG} skip ${p.ref} ← ${p.team}: bid ${p.bid} needs the high-value lane, ${hiUsed}/${params.hiPerWindow} used in the last ${params.hiWindowTicks} ticks`);
      continue;
    }
    if (p.bid + p.fee > budget) {
      notes.push(`${TAG} skip ${p.ref} ← ${p.team}: bid ${p.bid} + fee ${p.fee} > budget left ${Math.max(0, Math.floor(budget))} (--max-spend shared with El Rastro)`);
      continue;
    }
    const post = { ...makePost(p.team, p.ref, p.bid, params, 0, undefined), ...(p.hi ? { hi: true } : {}) };
    plan.posts.push(post);
    if (p.hi) hiUsed += 1;
    intents.push(postIntent(post, `${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`, p.gain - p.bid - p.fee));
    notes.push(`${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`);
    budget -= p.bid + p.fee;
    refs.add(p.ref);
    open += 1;
  }
  if (!plan.posts.length && !plan.cancels.length && !notes.length) notes.push(`${TAG} no rival seen with a spare of a page card we lack`);
  return { intents, notes, plan };
}

/** Cash the epic lane may use: cash minus what El Rastro commits and accepts this tick. */
function epicCash(input: RivalBuyInput): number {
  const t = input.trade!;
  return t.cash - (input.tradePlan?.committedAfter ?? 0) - (input.tradePlan?.accept?.spend ?? 0);
}

/**
 * Epic test lane: keeps at most one directed bid for `epic.ref`, only to `epic.teams`, at `epicStep` prices through
 * `enforceGuardrails` (reservation = ceiling), never leaving cash below `epic.cashFloor` after `reserved` (what the
 * other epic lanes commit). Returns the cash this lane commits (its kept or posted bid). Pure except reading `memo`.
 */
export function proposeEpicBuy(input: RivalBuyInput, epic: EpicBuyParams, existing: ReturnType<typeof directedBids>, memo: RivalBuyMemo, out: { intents: Intent[]; notes: string[]; plan: RivalBuyPlan }, reserved = 0): number {
  const trade = input.trade!;
  const tag = `${TAG} [epic]`;
  const mine = epic.open ? openBids(input.trade!, epic.ref) : existing.filter((e) => e.ref === epic.ref);
  // Teams marked done this tick: the memo only learns it on execution, so the new-bid pick must skip them now.
  const doneNow = new Set<string>();
  const cancel = (offerId: number, team: string, reason: string, done: boolean) => {
    if (done) doneNow.add(team);
    const intentId = `markets:rivalbuy:cancel:${offerId}`;
    out.plan.cancels.push({ intentId, offerId, key: `${team}:${epic.ref}`, backoff: false, ...(done ? { done: true, ceiling: epic.ceiling } : {}), reason });
    out.intents.push({ id: intentId, route: "markets", kind: "cancel", summary: `${tag} cancel #${offerId} (${reason})` });
    out.notes.push(`${tag} cancel #${offerId} ${reason}`);
  };
  const held = countHoldings(trade.held).get(epic.ref) ?? 0;
  const value = input.apiValues?.get(epic.ref);
  const stop = held > 0 ? `we hold ${epic.ref}: test done` : value === undefined ? `/api/me/value of ${epic.ref} unknown` : value < epic.ceiling ? `/api/me/value ${value} < ceiling ${epic.ceiling}` : undefined;
  if (stop) {
    for (const e of mine) cancel(e.offer.id, e.team, stop, held > 0);
    out.notes.push(`${tag} ${epic.ref}: ${stop}`);
    return 0;
  }
  const cash = epicCash(input) - reserved;
  if (epic.open) return proposeOpenEpic(input, epic, mine, value!, cash, out, cancel);
  let open = 0;
  let committed = 0;
  for (const e of mine) {
    const lowRoom = roomOf(input.room, e.team) < MIN_ROOM;
    if (!epic.teams.includes(e.team) || e.price > epic.ceiling || open >= 1 || lowRoom) {
      cancel(e.offer.id, e.team, !epic.teams.includes(e.team) ? `${e.team} not in the epic list` : e.price > epic.ceiling ? `bid ${e.price} > ceiling ${epic.ceiling}` : lowRoom ? `${e.team} score room ${roomOf(input.room, e.team)} < ${MIN_ROOM}` : "one epic bid at a time", false);
      continue;
    }
    const age = trade.tick - (e.offer.created_tick ?? trade.tick);
    if (age < epic.repriceAfterTicks) {
      open += 1;
      committed += e.price;
      continue;
    }
    // Step already reached: from memo, or from the price on display after a restart.
    let n = memo.get(`${e.team}:${epic.ref}`)?.reprices ?? 0;
    for (let k = 0; k <= epic.maxReprices; k++) if (epicStep(epic, k) <= e.price) n = Math.max(n, k);
    if (n >= epic.maxReprices) {
      cancel(e.offer.id, e.team, `no fill at the ceiling ${epic.ceiling} after ${n} reprice(s): ${e.team} done`, true);
      continue;
    }
    const next = enforceGuardrails({ role: "buyer", reservation: epic.ceiling }, epicStep(epic, n + 1), e.price);
    const fee = tradeFee(next, 1, MAKER_FEES);
    if (next + fee > input.maxSpend) {
      out.notes.push(`${tag} hold ${epic.ref} ← ${e.team} #${e.offer.id} at ${e.price}: step ${next} + fee ${fee} > --max-spend ${input.maxSpend}`);
      open += 1;
      committed += e.price;
      continue;
    }
    if (next <= e.price || cash - next - fee < epic.cashFloor) {
      cancel(e.offer.id, e.team, next <= e.price ? `no higher step than ${e.price}: ${e.team} done` : `cash ${Math.floor(cash)} − ${next + fee} < floor ${epic.cashFloor}`, next <= e.price);
      continue;
    }
    cancel(e.offer.id, e.team, `reprice ${e.price} → ${next}`, false);
    const post = makeEpicPost(e.team, next, epic, n + 1, e.offer.id);
    out.plan.posts.push(post);
    out.intents.push(postIntent(post, `${tag} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${epic.maxReprices})`, value! - next - fee));
    out.notes.push(`${tag} reprice ${epic.ref} ← ${e.team} #${e.offer.id} ${e.price} → ${next} (${n + 1}/${epic.maxReprices}, ceiling ${epic.ceiling})`);
    open += 1;
    committed += next;
  }
  if (open) return committed;
  const seenWith = (team: string) => input.rivals?.teams.find((t) => t.team === team)?.seen.some((s) => s.ref === epic.ref) ?? false;
  // Coordinator, 4 Oct: one bid at value − min(50, room), only to a team whose room covers that whole gain.
  const fullGain = Math.min(COUNTERPARTY_CAP, value! - epicStep(epic, 0));
  const team = epic.teams.find((t) => !doneNow.has(t) && memo.get(`${t}:${epic.ref}`)?.backoffUntil !== Infinity && seenWith(t) && roomOf(input.room, t) >= Math.max(MIN_ROOM, fullGain));
  if (!team) {
    out.notes.push(`${tag} ${epic.ref}: no listed holder left (${epic.teams.join("/")} done or not seen with it)`);
    return 0;
  }
  const price = enforceGuardrails({ role: "buyer", reservation: epic.ceiling }, epicStep(epic, 0));
  const fee = tradeFee(price, 1, MAKER_FEES);
  if (price + fee > input.maxSpend) {
    out.notes.push(`${tag} ${epic.ref} ← ${team}: ${price} + fee ${fee} > --max-spend ${input.maxSpend}`);
    return 0;
  }
  if (cash - price - fee < epic.cashFloor) {
    out.notes.push(`${tag} ${epic.ref} ← ${team}: cash ${Math.floor(cash)}${reserved ? ` (after ${reserved} other epic bids)` : ""} − ${price + fee} < floor ${epic.cashFloor}`);
    return 0;
  }
  const post = makeEpicPost(team, price, epic, 0, undefined);
  out.plan.posts.push(post);
  const line = `${tag} ${epic.ref} ← ${team} · /api/me/value ${value} · bid ${price} (steps ${epicStep(epic, 0)}→${epicStep(epic, epic.maxReprices)}, ceiling ${epic.ceiling}) · cash floor ${epic.cashFloor} · POST rastro to=${team} exp ${epic.expiresInTicks}`;
  out.intents.push(postIntent(post, line, value! - price - fee));
  out.notes.push(line);
  return price;
}

/**
 * Open epic lane: keeps one bid at the ceiling on El Rastro to anyone (structure only: cash for one card), never
 * repriced; one above the ceiling or a second one is cancelled; a new one only above the cash floor.
 */
function proposeOpenEpic(input: RivalBuyInput, epic: EpicBuyParams, mine: ReturnType<typeof openBids>, value: number, cash: number, out: { intents: Intent[]; notes: string[]; plan: RivalBuyPlan }, cancel: (offerId: number, team: string, reason: string, done: boolean) => void): number {
  const tag = `${TAG} [epic] [open]`;
  let committed = 0;
  for (const e of mine) {
    if (e.price > epic.ceiling || committed > 0) cancel(e.offer.id, "open", e.price > epic.ceiling ? `bid ${e.price} > ceiling ${epic.ceiling}` : "one open epic bid at a time", false);
    else committed = e.price;
  }
  if (committed) return committed;
  const price = enforceGuardrails({ role: "buyer", reservation: epic.ceiling }, epic.ceiling);
  const fee = tradeFee(price, 1, MAKER_FEES);
  if (price + fee > input.maxSpend) {
    out.notes.push(`${tag} ${epic.ref}: open bid ${price} + fee ${fee} > --max-spend ${input.maxSpend}`);
    return 0;
  }
  if (cash - price - fee < epic.cashFloor) {
    out.notes.push(`${tag} ${epic.ref}: cash ${Math.floor(cash)} − ${price + fee} < floor ${epic.cashFloor}`);
    return 0;
  }
  const post = makeEpicPost("open", price, epic, 0, undefined);
  out.plan.posts.push(post);
  const line = `${tag} ${epic.ref} · /api/me/value ${value} · open bid ${price} (no reprice) · cash floor ${epic.cashFloor} · POST rastro (anyone) exp ${epic.expiresInTicks}`;
  out.intents.push(postIntent(post, line, value - price - fee));
  out.notes.push(line);
  return price;
}

function makeEpicPost(team: string, price: number, epic: EpicBuyParams, reprice: number, replaces: number | undefined): RivalBuyPost {
  return {
    intentId: `markets:rivalbuy:post:${team}:${epic.ref}`,
    team,
    ref: epic.ref,
    price,
    reprice,
    epic: true,
    ...(replaces !== undefined ? { replaces } : {}),
    body: { venue: "rastro", ...(epic.open ? {} : { to: team }), give: { cash: price }, want: { cards: [epic.ref] }, expires_in_ticks: epic.expiresInTicks },
  };
}

function makePost(team: string, ref: string, price: number, params: RivalBuyParams, reprice: number, replaces: number | undefined): RivalBuyPost {
  return {
    intentId: `markets:rivalbuy:post:${team}:${ref}`,
    team,
    ref,
    price,
    reprice,
    ...(replaces !== undefined ? { replaces } : {}),
    body: { venue: "rastro", to: team, give: { cash: price }, want: { cards: [ref] }, expires_in_ticks: params.expiresInTicks },
  };
}

function postIntent(p: RivalBuyPost, summary: string, ev: number): Intent {
  return { id: p.intentId, route: "markets", kind: "listing", ev: r1(ev), price: p.price, ref: p.ref, locks: [`buy:${p.ref}`], summary };
}

/**
 * Sends the selected cancels and directed bids. `dryRun` (also when `--rival-buy` is off) only prints "would" lines.
 * A reprice is posted only if its cancel went through.
 */
export async function executeRivalBuy(client: Pick<BazaarClient, "postOffer" | "cancelOffer">, selected: readonly Intent[], plan: RivalBuyPlan, dryRun: boolean, params: RivalBuyParams = RIVAL_BUY_PARAMS, memo: RivalBuyMemo = defaultMemo, tick = 0, hiLedger: HiBuyLedger = defaultHiLedger, epicDoneFile?: string): Promise<string[]> {
  const lines: string[] = [];
  const ids = new Set(selected.map((i) => i.id));
  const cancelled = new Set<number>();
  for (const c of plan.cancels.filter((x) => ids.has(x.intentId))) {
    if (dryRun) {
      lines.push(`${TAG} would cancel #${c.offerId} (${c.reason})`);
      continue;
    }
    try {
      await client.cancelOffer(c.offerId);
      cancelled.add(c.offerId);
      if (c.done) {
        memo.set(c.key, { reprices: 0, backoffUntil: Infinity });
        if (epicDoneFile) saveEpicDone(epicDoneFile, c.key, tick, c.ceiling);
      }
      else if (c.backoff) memo.set(c.key, { reprices: 0, backoffUntil: tick + params.backoffTicks });
      lines.push(`${TAG} cancelled #${c.offerId} (${c.reason})`);
    } catch (e) {
      lines.push(`${TAG} cancel #${c.offerId} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  for (const p of plan.posts.filter((x) => ids.has(x.intentId))) {
    const what = `POST rastro ${p.body.to ? `to=${p.body.to}` : "(anyone)"} bid ${p.price} P for ${p.ref} exp ${p.body.expires_in_ticks}${p.replaces !== undefined ? ` (replaces #${p.replaces})` : ""}`;
    if (dryRun) {
      lines.push(`${TAG} would ${what}`);
      continue;
    }
    if (p.replaces !== undefined && !cancelled.has(p.replaces)) {
      lines.push(`${TAG} ${what}: skipped, cancel of #${p.replaces} did not go through`);
      continue;
    }
    try {
      await client.postOffer(p.body);
      memo.set(`${p.team}:${p.ref}`, { reprices: p.reprice });
      if (p.hi && p.reprice === 0) hiLedger.push(tick);
      lines.push(`${TAG} sent ${what}${p.hi ? " (high-value lane)" : ""}${p.epic ? " (epic test lane)" : ""}`);
    } catch (e) {
      lines.push(`${TAG} ${what} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}

/**
 * `/api/me/value` of the cards a rival is seen holding (a spare or a single copy) and we lack, highest book first, at most `valueLookups` per
 * call (the client caches each value for an hour, so later ticks reuse them). A failed lookup is left out.
 */
export async function rivalBuyValues(client: Pick<BazaarClient, "value">, trade: TradeState | undefined, rivals: RivalsState | undefined, params: RivalBuyParams = RIVAL_BUY_PARAMS, always: readonly string[] = []): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!trade || !rivals) return out;
  const counts = countHoldings(trade.held);
  const held = new Set(rivals.teams.flatMap((t) => t.seen.map((s) => s.ref)));
  const refs = [...held].filter((r) => (counts.get(r) ?? 0) === 0);
  refs.sort((a, b) => (trade.model.meta.get(b)?.book ?? 0) - (trade.model.meta.get(a)?.book ?? 0) || a.localeCompare(b));
  // `always` (the epic card) is looked up first and on top of the per-call budget.
  for (const ref of [...always.filter((r) => (counts.get(r) ?? 0) === 0), ...refs.filter((r) => !always.includes(r)).slice(0, params.valueLookups)]) {
    try {
      out.set(ref, await client.value(ref));
    } catch {
      // Left out: the card stays in the normal lane.
    }
  }
  return out;
}
