import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Intent } from "../coordinator/coordinator.js";
import { isLastFreeCopy } from "../shared/last-copy.js";
import type { RivalsState, RivalTeam } from "../state/rivals.js";
import { applyCards, countHoldings, MAKER_FEES, pageRisk, RASTRO_FEES, readSide, setOf, tradeFee, unscoredPageBonus, valueDelta, type TickPlan, type TradeOffer, type TradeState } from "../trades/trades.js";

/**
 * Rival swap: a directed El Rastro offer (`to` = the team) of one of our spare copies X for any copy of a card Y the
 * team holds: `give {assets: [X]}`, `want {cards: [Y]}`. Negotiation points come from value gained at our private
 * values, so a swap scores ourValue(Y) − ourValue(X) with no cash. Structure only (`GameState.rivals`): the team needs X
 * (it asked for X, or X is missing from one of its pages that is at most `nearPage` cards from complete) and was seen
 * holding Y (latest sighting or `/api/cards` confirmation within `maxStaleTicks`; spares first, a lone copy only if
 * `allowSingleCopy`). The figure comes from code: gain = value of Y − value of X − page risk − fee ≥ `minGain`, at our
 * values (`valueDelta`, without the page bonus of a set we do not score). No fee as maker (El Rastro charges the side
 * that accepts, `MAKER_FEES`); cash must still cover the Rastro fee above `--cash-floor`, in case. Never our last free
 * copy of a card (`isLastFreeCopy`), never a locked, reserved or busy asset.
 */

export const RIVAL_SWAP_PARAMS = {
  minGain: 2,
  maxOpen: 3,
  expiresInTicks: 20,
  /** No repost of the same (X, team, Y) for this long after it expires or is cancelled. */
  backoffTicks: 40,
  /** A card seen (or confirmed) with the team longer ago than this is not asked for; a want older than this does not count. */
  maxStaleTicks: 60,
  /** A page card the team misses counts as needed when its page is at most this many cards from complete. */
  nearPage: 2,
  /** Ask for a card the team was seen with only once (ranked after spares). */
  allowSingleCopy: true,
};
export type RivalSwapParams = typeof RIVAL_SWAP_PARAMS;

const TAG = "[rival-swap]";
const PROTECT_PAGE_HAVE = 8;
const CARD_REF = /^[A-Z]+-\d+$/;

export interface RivalSwapInput {
  tick: number;
  trade: TradeState | undefined;
  /** El Rastro plan this tick: the assets it posts are not used here. */
  tradePlan?: TickPlan;
  /** Assets other markets routes post this tick (rival-page): they count as gone. */
  otherAssets?: readonly number[];
  rivals: RivalsState | undefined;
  /** `--page-targets` with `--page-bonus-scored`: only then their sets' page bonus counts in the gain. */
  pageTargets?: readonly string[];
  pageBonusScored?: boolean;
  cashFloor: number;
  /** Agenda freeze: no new swaps and open ones are cancelled. */
  opensBlocked?: string;
}

export interface RivalSwapPricing {
  team: string;
  give: string;
  get: string;
  /** Why the team needs `give`: it asked for it, or it is missing from a near-complete page. */
  need: "asked" | "page";
  /** Copies of `get` seen with the team, and the tick of the freshest sighting. */
  copies: number;
  freshAt: number;
  /** What `give` costs us and what `get` adds, at our values. */
  giveValue: number;
  getValue: number;
  risk: number;
  fee: number;
  gain: number;
}

export interface RivalSwapMemoEntry {
  backoffUntil?: number;
}
export type RivalSwapMemo = Map<string, RivalSwapMemoEntry>;
const defaultMemo: RivalSwapMemo = new Map();

export interface RivalSwapPost {
  intentId: string;
  key: string;
  team: string;
  give: string;
  get: string;
  assetId: number;
  body: { venue: "rastro"; to: string; give: { assets: number[] }; want: { cards: string[] }; expires_in_ticks: number };
}

export interface RivalSwapCancel {
  intentId: string;
  offerId: number;
  key: string;
  backoff: boolean;
  reason: string;
}

export interface RivalSwapPlan {
  posts: RivalSwapPost[];
  cancels: RivalSwapCancel[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;
export const swapKey = (give: string, team: string, get: string) => `${give}>${team}>${get}`;

/** Our directed one-card-for-one-card offers on El Rastro (open, not expired). */
export function directedSwaps(trade: TradeState): { offer: TradeOffer; team: string; assetId: number; give: string; get: string }[] {
  return trade.mine.flatMap((o) => {
    if (!o.to || o.venue !== "rastro" || o.thread != null || (o.status ?? "open") !== "open" || (o.expires_tick != null && o.expires_tick <= trade.tick)) return [];
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.assets.length !== 1 || g.cash !== 0 || w.cash !== 0 || w.assets.length || w.cards.length !== 1) return [];
    const id = g.assets[0]!.id;
    const give = g.assets[0]!.ref ?? trade.held.find((a) => a.id === id)?.ref;
    return give ? [{ offer: o, team: o.to, assetId: id, give, get: w.cards[0]! }] : [];
  });
}

/** Why `team` needs `ref` (structure only), or undefined. */
export function teamNeeds(team: RivalTeam, ref: string, tick: number, params: RivalSwapParams = RIVAL_SWAP_PARAMS): "asked" | "page" | undefined {
  if (team.wants.some((w) => w.ref === ref && tick - w.tick <= params.maxStaleTicks)) return "asked";
  if (team.seen.some((s) => s.ref === ref)) return undefined;
  return team.pages.some((p) => p.missing.includes(ref) && p.of - p.have <= params.nearPage) ? "page" : undefined;
}

/** Cards seen with the team, fresh enough: ref → copies and freshest tick. */
function freshHoldings(team: RivalTeam, tick: number, params: RivalSwapParams): Map<string, { copies: number; freshAt: number }> {
  const out = new Map<string, { copies: number; freshAt: number }>();
  for (const s of team.seen) {
    const at = s.confirmedTick ?? s.tick;
    const prev = out.get(s.ref);
    out.set(s.ref, { copies: (prev?.copies ?? 0) + 1, freshAt: Math.max(prev?.freshAt ?? -Infinity, at) });
  }
  for (const [ref, h] of out) if (tick - h.freshAt > params.maxStaleTicks || !CARD_REF.test(ref)) out.delete(ref);
  return out;
}

/** Gain at our values of giving one `give` for one `get` (fee as maker: 0). */
export function swapGain(trade: TradeState, give: string, get: string, scoredSets: ReadonlySet<string>): Pick<RivalSwapPricing, "giveValue" | "getValue" | "risk" | "fee" | "gain"> | undefined {
  const model = trade.model;
  if (!model.base.has(get) || !model.base.has(give)) return undefined;
  const counts = countHoldings(trade.held);
  const after = applyCards(counts, [give], [get]);
  const cardDelta = valueDelta(counts, [give], [get], model) - unscoredPageBonus(counts, after, model, scoredSets);
  const giveValue = -valueDelta(counts, [give], [], model);
  const getValue = cardDelta + giveValue;
  const risk = pageRisk(counts, [give], model, PROTECT_PAGE_HAVE);
  const fee = tradeFee(0, 2, MAKER_FEES);
  return { giveValue, getValue, risk, fee, gain: cardDelta - risk - fee };
}

const describe = (p: RivalSwapPricing) =>
  `give ${p.give} → ${p.team} for ${p.get} (${p.need === "asked" ? `${p.team} asked for ${p.give}` : `${p.give} missing from a near page`} · ${p.copies} ${p.get} seen, fresh at tick ${p.freshAt}) · our values ${r1(p.giveValue)}/${r1(p.getValue)}${p.risk ? ` · page risk ${r1(p.risk)}` : ""} · fee ${p.fee} (maker) · gain ${r1(p.gain)}`;

/**
 * Proposes directed swaps (new) and cancels. Pure except for reading `memo`. Safe by default: missing data, agenda
 * freeze or cash short of the fee → no new swaps and a note.
 */
export function proposeRivalSwap(input: RivalSwapInput, params: RivalSwapParams = RIVAL_SWAP_PARAMS, memo: RivalSwapMemo = defaultMemo): { intents: Intent[]; notes: string[]; plan: RivalSwapPlan } {
  const intents: Intent[] = [];
  const notes: string[] = [];
  const plan: RivalSwapPlan = { posts: [], cancels: [] };
  const trade = input.trade;
  if (!trade) {
    notes.push(`${TAG} off: no El Rastro state this tick`);
    return { intents, notes, plan };
  }
  const existing = directedSwaps(trade);
  const cancel = (offerId: number, key: string, reason: string, backoff = true) => {
    const intentId = `markets:rivalswap:cancel:${offerId}`;
    plan.cancels.push({ intentId, offerId, key, backoff, reason });
    intents.push({ id: intentId, route: "markets", kind: "cancel", summary: `${TAG} cancel #${offerId} (${reason})` });
    notes.push(`${TAG} cancel #${offerId} ${reason}`);
  };
  const rivals = input.rivals;
  const off = !rivals ? "rivals unavailable" : input.opensBlocked ? `agenda: ${input.opensBlocked}` : undefined;
  if (off) {
    notes.push(`${TAG} off: ${off}`);
    for (const e of existing) cancel(e.offer.id, swapKey(e.give, e.team, e.get), off, false);
    return { intents, notes, plan };
  }
  const byTeam = new Map(rivals!.teams.map((t) => [t.team, t]));
  const scored = new Set(input.pageBonusScored ? (input.pageTargets ?? []).map(setOf) : []);
  const heldById = new Map(trade.held.map((a) => [a.id, a]));
  // Assets El Rastro or rival-page post this tick, and assets in our other open offers.
  const tickAssets = new Set([...(input.tradePlan?.posts ?? []).flatMap((p) => ("assets" in p.body.give ? p.body.give.assets : [])), ...(input.otherAssets ?? [])]);
  const busy = new Set<number>();
  for (const o of trade.mine) {
    if ((o.status ?? "open") !== "open" || existing.some((e) => e.offer.id === o.id)) continue;
    for (const a of readSide(o.give).assets) busy.add(a.id);
  }
  const usable = (id: number) => {
    const a = heldById.get(id);
    return !!a && !a.locked && !trade.reserved.has(id) && !busy.has(id) && !tickAssets.has(id);
  };

  // Existing swaps: cancel (with backoff) or keep.
  const teamsOpen = new Set<string>();
  const getsOpen = new Set<string>();
  let open = 0;
  for (const e of existing) {
    const key = swapKey(e.give, e.team, e.get);
    const team = byTeam.get(e.team);
    if (!heldById.has(e.assetId) || trade.reserved.has(e.assetId) || busy.has(e.assetId) || tickAssets.has(e.assetId)) {
      cancel(e.offer.id, key, `asset ${e.assetId} busy elsewhere`);
      continue;
    }
    if (!team) {
      cancel(e.offer.id, key, `${e.team} not in the rivals view`);
      continue;
    }
    if (!teamNeeds(team, e.give, trade.tick, params)) {
      cancel(e.offer.id, key, `${e.team} no longer seen needing ${e.give}`);
      continue;
    }
    if (!freshHoldings(team, trade.tick, params).has(e.get)) {
      cancel(e.offer.id, key, `${e.team} no longer seen holding ${e.get} (or stale)`);
      continue;
    }
    const g = swapGain(trade, e.give, e.get, scored);
    if (!g || g.gain < params.minGain) {
      cancel(e.offer.id, key, `gain ${g ? r1(g.gain) : "?"} < ${params.minGain}`);
      continue;
    }
    teamsOpen.add(e.team);
    getsOpen.add(e.get);
    open += 1;
  }

  // New candidates: our spare X a team needs, for a card Y that team holds.
  const feeIfCharged = tradeFee(0, 2, RASTRO_FEES);
  if (trade.cash - input.cashFloor < feeIfCharged) {
    notes.push(`${TAG} off: cash ${trade.cash} − floor ${input.cashFloor} < Rastro fee ${feeIfCharged}`);
    return { intents, notes, plan };
  }
  const gone = new Set(trade.held.filter((a) => !usable(a.id)).map((a) => a.id));
  const spares = [...new Set(trade.held.map((a) => a.ref))].filter((ref) => trade.held.some((a) => a.ref === ref && usable(a.id) && !isLastFreeCopy(a.id, trade.held, gone, trade.reserved))).sort();
  const fresh: (RivalSwapPricing & { spare: boolean })[] = [];
  for (const give of spares) {
    for (const team of rivals!.teams) {
      const need = teamNeeds(team, give, trade.tick, params);
      if (!need) continue;
      if (teamsOpen.has(team.team)) {
        notes.push(`${TAG} skip give ${give} → ${team.team}: a swap to ${team.team} is already open`);
        continue;
      }
      const holds = freshHoldings(team, trade.tick, params);
      let best: (RivalSwapPricing & { spare: boolean }) | undefined;
      let bestGain = -Infinity;
      for (const [get, h] of holds) {
        if (get === give || getsOpen.has(get) || (h.copies < 2 && !params.allowSingleCopy)) continue;
        const until = memo.get(swapKey(give, team.team, get))?.backoffUntil;
        if (until !== undefined && until > trade.tick) continue;
        const g = swapGain(trade, give, get, scored);
        if (!g) continue;
        bestGain = Math.max(bestGain, g.gain);
        if (g.gain < params.minGain) continue;
        const cand = { team: team.team, give, get, need, copies: h.copies, freshAt: h.freshAt, ...g, spare: h.copies >= 2 };
        if (!best || Number(cand.spare) - Number(best.spare) > 0 || (cand.spare === best.spare && cand.gain > best.gain)) best = cand;
      }
      if (best) fresh.push(best);
      else notes.push(`${TAG} skip give ${give} → ${team.team} (${need}): ${holds.size ? `best gain ${Number.isFinite(bestGain) ? r1(bestGain) : "?"} < ${params.minGain} over ${holds.size} card(s) seen fresh (or backoff)` : "no card seen with the team within the staleness window"}`);
    }
  }
  // Spares first (they can give one up), then the most value gained.
  fresh.sort((a, b) => Number(b.spare) - Number(a.spare) || b.gain - a.gain || a.give.localeCompare(b.give) || a.team.localeCompare(b.team));
  const givesThisTick = new Set<string>();
  const chosen = new Set<number>();
  for (const p of fresh) {
    if (teamsOpen.has(p.team) || getsOpen.has(p.get) || givesThisTick.has(p.give)) continue;
    if (open >= params.maxOpen) {
      notes.push(`${TAG} skip ${describe(p)}: ${open}/${params.maxOpen} swaps open`);
      continue;
    }
    const goneNow = new Set([...gone, ...chosen]);
    const copy = trade.held.filter((a) => a.ref === p.give && usable(a.id) && !chosen.has(a.id)).sort((x, y) => y.id - x.id)[0];
    if (!copy || isLastFreeCopy(copy.id, trade.held, goneNow, trade.reserved)) {
      notes.push(`${TAG} skip give ${p.give} → ${p.team}: last free copy`);
      continue;
    }
    const key = swapKey(p.give, p.team, p.get);
    const post: RivalSwapPost = {
      intentId: `markets:rivalswap:post:${p.team}:${copy.id}`,
      key,
      team: p.team,
      give: p.give,
      get: p.get,
      assetId: copy.id,
      body: { venue: "rastro", to: p.team, give: { assets: [copy.id] }, want: { cards: [p.get] }, expires_in_ticks: params.expiresInTicks },
    };
    plan.posts.push(post);
    const summary = `${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`;
    intents.push({ id: post.intentId, route: "markets", kind: "listing", ev: r1(p.gain), ref: p.give, locks: [`asset:${copy.id}`, `sell:${p.give}`, `buy:${p.get}`], summary });
    notes.push(summary);
    chosen.add(copy.id);
    teamsOpen.add(p.team);
    getsOpen.add(p.get);
    givesThisTick.add(p.give);
    open += 1;
  }
  if (!plan.posts.length && !plan.cancels.length && !notes.length) notes.push(`${TAG} no rival seen needing one of our spares (${spares.length} spare card(s))`);
  return { intents, notes, plan };
}

/**
 * Sends the selected cancels and directed swaps. `dryRun` (also when `--rival-swap` is off) only prints "would" lines.
 * A sent swap backs off its (X, team, Y) until it expires plus `backoffTicks`; a cancel with backoff, `backoffTicks`.
 */
export async function executeRivalSwap(client: Pick<BazaarClient, "postOffer" | "cancelOffer">, selected: readonly Intent[], plan: RivalSwapPlan, dryRun: boolean, params: RivalSwapParams = RIVAL_SWAP_PARAMS, memo: RivalSwapMemo = defaultMemo, tick = 0): Promise<string[]> {
  const lines: string[] = [];
  const ids = new Set(selected.map((i) => i.id));
  for (const c of plan.cancels.filter((x) => ids.has(x.intentId))) {
    if (dryRun) {
      lines.push(`${TAG} would cancel #${c.offerId} (${c.reason})`);
      continue;
    }
    try {
      await client.cancelOffer(c.offerId);
      if (c.backoff) memo.set(c.key, { backoffUntil: tick + params.backoffTicks });
      lines.push(`${TAG} cancelled #${c.offerId} (${c.reason})`);
    } catch (e) {
      lines.push(`${TAG} cancel #${c.offerId} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  for (const p of plan.posts.filter((x) => ids.has(x.intentId))) {
    const what = `POST rastro to=${p.team} give ${p.give} (asset ${p.assetId}) want ${p.get} exp ${params.expiresInTicks}`;
    if (dryRun) {
      lines.push(`${TAG} would ${what}`);
      continue;
    }
    try {
      await client.postOffer(p.body);
      memo.set(p.key, { backoffUntil: tick + params.expiresInTicks + params.backoffTicks });
      lines.push(`${TAG} sent ${what}`);
    } catch (e) {
      lines.push(`${TAG} ${what} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
