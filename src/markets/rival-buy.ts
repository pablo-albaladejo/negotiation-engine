import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Intent } from "../coordinator/coordinator.js";
import { enforceGuardrails } from "../engine/guardrails.js";
import type { RivalsState, RivalTeam } from "../state/rivals.js";
import { countHoldings, maxBid, median, RASTRO_FEES, readSide, setOf, slowReprice, tradeFee, valueDelta, type TickPlan, type TradeOffer, type TradeState } from "../trades/trades.js";
import { fairPrice } from "./markets.js";
import { setMultipliers } from "./rival-page.js";

/**
 * Rival buy: a directed El Rastro bid (`to` = the team, cash for one card) for a page card we lack, sent to a rival
 * seen holding a spare copy of it. Structure only (cards seen with the team, `/api/cards` confirmations); the figure
 * comes from code: our cap = what the card adds to us minus fee and margin (`maxBid`); their floor = the estimated
 * value of a spare copy to them (median set multiplier × book × second-copy marginal); we bid their floor plus a share
 * of the gap, never above the cap. Never for a card El Rastro already bids on (no double fill), and only within the
 * `--max-spend` budget that El Rastro leaves.
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
};
export type RivalBuyParams = typeof RIVAL_BUY_PARAMS;

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
}

export type BuyAssessment = { ok: true; p: RivalBuyPricing } | { ok: false; reason: string; p?: Partial<RivalBuyPricing> };

export interface RivalBuyMemoEntry {
  reprices: number;
  backoffUntil?: number;
}
export type RivalBuyMemo = Map<string, RivalBuyMemoEntry>;
const defaultMemo: RivalBuyMemo = new Map();

export interface RivalBuyPost {
  intentId: string;
  team: string;
  ref: string;
  price: number;
  replaces?: number;
  reprice: number;
  body: { venue: "rastro"; to: string; give: { cash: number }; want: { cards: string[] }; expires_in_ticks: number };
}

export interface RivalBuyCancel {
  intentId: string;
  offerId: number;
  key: string;
  backoff: boolean;
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
  return Math.min(input.maxSpend - t.spent - (input.tradePlan?.committedAfter ?? 0) - accept, t.cash - input.cashFloor - (input.tradePlan?.committedAfter ?? 0) - accept);
}

/** Prices one card from one team; `ok: false` with the reason when no bid must go out. */
export function assessRivalBuy(team: RivalTeam, ref: string, input: RivalBuyInput, params: RivalBuyParams = RIVAL_BUY_PARAMS): BuyAssessment {
  const trade = input.trade!;
  const model = trade.model;
  const counts = countHoldings(trade.held);
  if ((counts.get(ref) ?? 0) > 0) return { ok: false, reason: `we hold ${ref}` };
  const set = model.meta.get(ref)?.set ?? setOf(ref);
  if (!trade.pageSets.includes(set) || !(model.pages.get(set) ?? []).includes(ref)) return { ok: false, reason: `${ref} is not a page card of our album` };
  const mine = team.seen.filter((s) => s.ref === ref);
  if (mine.length < 2) return { ok: false, reason: `${team.team} has no spare ${ref} seen` };
  const freshAt = Math.max(...mine.map((s) => s.confirmedTick ?? s.tick));
  if (input.tick - freshAt > params.maxStaleTicks) return { ok: false, reason: `spare seen at tick ${freshAt} (stale)` };
  const gain = valueDelta(counts, [], [ref], model);
  const cap = maxBid(gain, MIN_MARGIN, RASTRO_FEES);
  const book = model.meta.get(ref)?.book ?? 0;
  const mHat = median([...setMultipliers(model).values()]) ?? 1;
  const second = model.rules.marginals[1] ?? model.rules.marginals.at(-1) ?? 0.5;
  const theirFloor = Math.max(1, Math.ceil(mHat * book * second) + 1);
  const base: Partial<RivalBuyPricing> = { team: team.team, ref, copies: mine.length, freshAt, gain, cap, theirFloor };
  if (cap < 1) return { ok: false, reason: `no bid fits our value (gain ${r1(gain)})`, p: base };
  if (cap - theirFloor < params.minGap) return { ok: false, reason: `cap ${cap} − their floor ${theirFloor} < ${params.minGap}`, p: base };
  const raw = theirFloor + Math.round(params.shareOfGap * (cap - theirFloor));
  const bid = enforceGuardrails({ role: "buyer", reservation: cap }, raw);
  const fee = tradeFee(bid, 1, RASTRO_FEES);
  if (!fairPrice("buy", bid, book || undefined)) return { ok: false, reason: `bid ${bid} above fair play (twice the book)`, p: base };
  return { ok: true, p: { ...(base as RivalBuyPricing), bid, fee } };
}

/** Our directed cash-for-one-card bids on El Rastro (open, not expired). */
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
  `${p.ref} ← ${p.team} (${p.copies} copies seen, fresh at tick ${p.freshAt}) · gain ${r1(p.gain)} · cap ${p.cap} · their floor ~${p.theirFloor} · fee ${p.fee} · bid ${p.bid}`;

/**
 * Proposes directed bids (new, reprices) and cancels. Pure except for reading `memo`. Safe by default: missing data,
 * agenda freeze or no budget → no new bids and a note.
 */
export function proposeRivalBuy(input: RivalBuyInput, params: RivalBuyParams = RIVAL_BUY_PARAMS, memo: RivalBuyMemo = defaultMemo): { intents: Intent[]; notes: string[]; plan: RivalBuyPlan } {
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

  // Existing directed bids: cancel, reprice or keep (what they commit comes off the budget).
  let open = 0;
  for (const e of existing) {
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
    let committed = e.price + tradeFee(e.price, 1, RASTRO_FEES);
    if (age >= params.repriceAfterTicks) {
      const n = memo.get(key)?.reprices ?? 0;
      const next = enforceGuardrails({ role: "buyer", reservation: cap }, Math.min(cap, slowReprice(e.price, cap, params.repriceFrac)), e.price);
      const extra = next + tradeFee(next, 1, RASTRO_FEES) - committed;
      if (n >= params.maxReprices || next <= e.price || extra > budget) {
        cancel(e.offer.id, key, `no fill after ${n} reprice(s)${extra > budget ? " and no budget to raise" : ""}; backoff ${params.backoffTicks} ticks`, true);
        continue;
      }
      cancel(e.offer.id, key, `reprice ${e.price} → ${next}`);
      const post = makePost(e.team, e.ref, next, params, n + 1, e.offer.id);
      plan.posts.push(post);
      intents.push(postIntent(post, `${TAG} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${params.maxReprices})`, (asm.p?.gain ?? 0) - next - tradeFee(next, 1, RASTRO_FEES)));
      notes.push(`${TAG} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${params.maxReprices})`);
      committed = next + tradeFee(next, 1, RASTRO_FEES);
    }
    budget -= committed;
    open += 1;
    handled.add(key);
  }

  // New candidates: page cards we lack that a rival holds a spare of.
  const fresh: RivalBuyPricing[] = [];
  for (const [ref, who] of Object.entries(rivals!.byRef)) {
    for (const t of who.holders) {
      const team = byTeam.get(t);
      const key = `${t}:${ref}`;
      if (!team || handled.has(key) || team.seen.filter((s) => s.ref === ref).length < 2) continue;
      const until = memo.get(key)?.backoffUntil;
      if (until !== undefined && until > trade.tick) {
        notes.push(`${TAG} skip ${ref} ← ${t}: backoff until tick ${until}`);
        continue;
      }
      const asm = assessRivalBuy(team, ref, input, params);
      if (!asm.ok) {
        if (!/^we hold|is not a page card/.test(asm.reason)) notes.push(`${TAG} skip ${ref} ← ${t}: ${asm.reason}`);
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
  const refs = new Set(existing.map((e) => e.ref));
  for (const p of fresh) {
    if (refs.has(p.ref)) continue;
    if (open >= params.maxOpen) {
      notes.push(`${TAG} skip ${p.ref} ← ${p.team}: ${open}/${params.maxOpen} directed bids open`);
      continue;
    }
    if (p.bid + p.fee > budget) {
      notes.push(`${TAG} skip ${p.ref} ← ${p.team}: bid ${p.bid} + fee ${p.fee} > budget left ${Math.max(0, Math.floor(budget))} (--max-spend shared with El Rastro)`);
      continue;
    }
    const post = makePost(p.team, p.ref, p.bid, params, 0, undefined);
    plan.posts.push(post);
    intents.push(postIntent(post, `${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`, p.gain - p.bid - p.fee));
    notes.push(`${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`);
    budget -= p.bid + p.fee;
    refs.add(p.ref);
    open += 1;
  }
  if (!plan.posts.length && !plan.cancels.length && !notes.length) notes.push(`${TAG} no rival seen with a spare of a page card we lack`);
  return { intents, notes, plan };
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
export async function executeRivalBuy(client: Pick<BazaarClient, "postOffer" | "cancelOffer">, selected: readonly Intent[], plan: RivalBuyPlan, dryRun: boolean, params: RivalBuyParams = RIVAL_BUY_PARAMS, memo: RivalBuyMemo = defaultMemo, tick = 0): Promise<string[]> {
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
      if (c.backoff) memo.set(c.key, { reprices: 0, backoffUntil: tick + params.backoffTicks });
      lines.push(`${TAG} cancelled #${c.offerId} (${c.reason})`);
    } catch (e) {
      lines.push(`${TAG} cancel #${c.offerId} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  for (const p of plan.posts.filter((x) => ids.has(x.intentId))) {
    const what = `POST rastro to=${p.team} bid ${p.price} P for ${p.ref} exp ${params.expiresInTicks}${p.replaces !== undefined ? ` (replaces #${p.replaces})` : ""}`;
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
      lines.push(`${TAG} sent ${what}`);
    } catch (e) {
      lines.push(`${TAG} ${what} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
