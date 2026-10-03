import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Intent } from "../coordinator/coordinator.js";
import { enforceGuardrails } from "../engine/guardrails.js";
import type { RivalsState, RivalTeam } from "../state/rivals.js";
import {
  countHoldings,
  median,
  minAsk,
  pageRisk,
  RASTRO_FEES,
  readSide,
  setOf,
  slowReprice,
  tradeFee,
  valueDelta,
  type TickPlan,
  type TradeOffer,
  type TradeState,
  type ValueModel,
} from "../trades/trades.js";
import { fairPrice, RIVAL_PENALTY } from "./markets.js";

/**
 * Rival page: a directed El Rastro listing (`to` = the team) of a card a rival team lacks to complete an album page.
 * Structure only (leaderboard bounds, cards seen with the team, cards it asked for); the figure comes from code:
 * floor = what the card costs us (copy + option on our own page + rank penalty) with fee and margin; their value is
 * estimated with our median set multiplier; we ask the floor plus a κ-weighted share of the estimated surplus.
 */

export const RIVAL_PAGE_PARAMS = {
  shareOfSurplus: 0.5,
  minKappa: 0.2,
  minSurplus: 5,
  optionExp: 4,
  maxOpen: 2,
  expiresInTicks: 20,
  repriceAfterTicks: 10,
  repriceFrac: 0.05,
  maxReprices: 2,
  backoffTicks: 40,
  maxStaleTicks: 15,
  maxOwnPageHave: 6,
};
export type RivalPageParams = typeof RIVAL_PAGE_PARAMS;

const MIN_MARGIN = 2;
const PROTECT_PAGE_HAVE = 8;
const TAG = "[rival-page]";

/** Our per-set multiplier: median of private base / book over the set's cards. */
export function setMultipliers(model: ValueModel): Map<string, number> {
  const out = new Map<string, number>();
  for (const [set, refs] of model.sets) {
    const m = median(
      refs.flatMap((r) => {
        const b = model.base.get(r);
        const book = model.meta.get(r)?.book ?? 0;
        return b !== undefined && book > 0 ? [b / book] : [];
      }),
    );
    if (m !== undefined) out.set(set, m);
  }
  return out;
}

export interface PageFeasibility {
  /** κ_feas: 0 if the leaderboard's complete pages cannot be explained without this page, 0.5 if tight, 1 otherwise. */
  kappa: number;
  /** Album cards we have not seen with the team. */
  unseen: number;
  /** Fewest unseen cards needed to complete `pagesComplete` pages in other sets. */
  needOther: number;
}

/** Can the team's leaderboard (pages complete, album filled) be explained while it still lacks a card of `set`? */
export function pageFeasibility(team: RivalTeam, set: string, model: ValueModel): PageFeasibility | undefined {
  const complete = team.board?.pagesComplete;
  const unseen = team.unseen;
  if (complete === undefined || unseen === undefined) return undefined;
  const gaps = [...model.pages]
    .filter(([s, page]) => s !== set && page.length > 0)
    .map(([s, page]) => page.length - (team.pages.find((p) => p.set === s)?.have ?? 0))
    .sort((a, b) => a - b);
  const needOther = complete > gaps.length ? Infinity : gaps.slice(0, complete).reduce((a, b) => a + b, 0);
  const kappa = needOther > unseen ? 0 : needOther >= 0.75 * unseen && needOther > 0 ? 0.5 : 1;
  return { kappa, unseen, needOther };
}

/** κ_want: 1 if the team asked for this card, 0.4 if only for its siblings in the set, 0.8 without such data. */
export function wantKappa(team: RivalTeam, ref: string): number {
  if (team.wants.some((w) => w.ref === ref)) return 1;
  if (team.wants.some((w) => setOf(w.ref) === setOf(ref))) return 0.4;
  return 0.8;
}

export function rankPenalty(rank: number | undefined, teams: number): number {
  if (rank === undefined) return RIVAL_PENALTY.middle;
  if (rank <= 3) return RIVAL_PENALTY.top3;
  return rank > teams / 2 ? RIVAL_PENALTY.bottomHalf : RIVAL_PENALTY.middle;
}

/** Teams in the game (for the rank tiers): the highest leaderboard rank seen, at least the rivals plus us. */
export const teamCount = (rivals: RivalsState | undefined): number => Math.max((rivals?.teams.length ?? 0) + 1, ...(rivals?.teams ?? []).map((t) => t.board?.rank ?? 0));

export interface RivalPageInput {
  tick: number;
  trade: TradeState | undefined;
  /** El Rastro plan this tick: the assets it posts are not used here. */
  tradePlan?: TickPlan;
  rivals: RivalsState | undefined;
  /** Card refs we are completing (`--page-targets`): their sets are never sold from. */
  pageTargets: readonly string[];
  cashFloor: number;
  /** Agenda freeze: no new listings and open ones are cancelled. */
  opensBlocked?: string;
}

export interface RivalPagePricing {
  team: string;
  ref: string;
  set: string;
  rank: number | undefined;
  haveSeen: number;
  of: number;
  kappa: number;
  feas: PageFeasibility;
  want: number;
  cost: number;
  option: number;
  rankPen: number;
  floor: number;
  theirValue: number;
  mHat: number;
  ask: number;
  fee: number;
}

export type Assessment = { ok: true; p: RivalPagePricing } | { ok: false; reason: string; p?: Partial<RivalPagePricing> };

/** Memory across ticks per `team:ref`: reprices done, leaderboard complete pages when posted, backoff. */
export interface RivalPageMemoEntry {
  reprices: number;
  pagesComplete?: number;
  backoffUntil?: number;
}
export type RivalPageMemo = Map<string, RivalPageMemoEntry>;
const defaultMemo: RivalPageMemo = new Map();

export interface RivalPagePost {
  intentId: string;
  team: string;
  ref: string;
  assetId: number;
  price: number;
  pagesComplete?: number;
  replaces?: number;
  /** n-th reprice (0 for a new listing). */
  reprice: number;
  body: { venue: "rastro"; to: string; give: { assets: number[] }; want: { cash: number }; expires_in_ticks: number };
}

export interface RivalPageCancel {
  intentId: string;
  offerId: number;
  key: string;
  /** Set the backoff for `key` once the cancel goes through. */
  backoff: boolean;
  reason: string;
}

export interface RivalPagePlan {
  posts: RivalPagePost[];
  cancels: RivalPageCancel[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/** Prices one card for one team; `ok: false` with the reason when it must not be listed. */
export function assessRivalPage(team: RivalTeam, ref: string, input: RivalPageInput, params: RivalPageParams = RIVAL_PAGE_PARAMS): Assessment {
  const trade = input.trade!;
  const teams = teamCount(input.rivals);
  const model = trade.model;
  const set = model.meta.get(ref)?.set ?? setOf(ref);
  const page = model.pages.get(set) ?? [];
  const counts = countHoldings(trade.held);
  if ((counts.get(ref) ?? 0) === 0) return { ok: false, reason: `we do not hold ${ref}` };
  if (input.pageTargets.some((t) => setOf(t) === set)) return { ok: false, reason: `${set} is a page target` };
  const haveS = page.filter((r) => (counts.get(r) ?? 0) > 0).length;
  if (haveS > params.maxOwnPageHave) return { ok: false, reason: `our ${set} ${haveS}/${page.length} > ${params.maxOwnPageHave}` };
  const risk = pageRisk(counts, [ref], model, PROTECT_PAGE_HAVE);
  if (risk > 0) return { ok: false, reason: `page risk ${r1(risk)}` };
  if (input.rivals?.byRef[ref]?.holders.includes(team.team)) return { ok: false, reason: `${team.team} seen holding ${ref}` };
  const board = team.board;
  if (!board || input.tick - board.tick > params.maxStaleTicks) return { ok: false, reason: board ? `leaderboard row stale (tick ${board.tick})` : "no leaderboard row" };
  const tp = team.pages.find((p) => p.set === set);
  if (!tp || tp.missing.length !== 1 || tp.missing[0] !== ref) return { ok: false, reason: `${team.team} does not lack exactly ${ref} in ${set}` };
  const feas = pageFeasibility(team, set, model);
  if (!feas) return { ok: false, reason: "no pages-complete / unseen data" };
  const want = wantKappa(team, ref);
  const kappa = feas.kappa * want;
  const rank = board.rank;

  const cost = -valueDelta(counts, [ref], [], model) + risk;
  const pageBases = page.reduce((s, r) => s + (model.base.get(r) ?? 0), 0);
  const option = model.rules.pageBonus * pageBases * (haveS / Math.max(1, page.length)) ** params.optionExp;
  const rankPen = rankPenalty(rank, teams);
  const floor = minAsk(cost + option + rankPen, MIN_MARGIN, RASTRO_FEES);
  const mults = setMultipliers(model);
  const mHat = median([...mults].filter(([s]) => s !== set).map(([, m]) => m)) ?? 0;
  const book = (r: string) => model.meta.get(r)?.book ?? 0;
  const theirValue = Math.floor(mHat * (book(ref) + model.rules.pageBonus * page.reduce((s, r) => s + book(r), 0)));
  const base: Partial<RivalPagePricing> = { team: team.team, ref, set, rank, haveSeen: tp.have, of: tp.of, kappa, feas, want, cost, option, rankPen, floor, theirValue, mHat };
  if (kappa < params.minKappa) return { ok: false, reason: `κ ${kappa.toFixed(2)} < ${params.minKappa}`, p: base };
  if (theirValue - floor < params.minSurplus) return { ok: false, reason: `their est ${theirValue} − floor ${floor} < ${params.minSurplus}`, p: base };
  const raw = Math.min(theirValue, floor + Math.round(params.shareOfSurplus * kappa * (theirValue - floor)));
  const ask = enforceGuardrails({ role: "seller", reservation: floor }, raw);
  const fee = tradeFee(ask, 1, RASTRO_FEES);
  if (!fairPrice("sell", ask, book(ref) || undefined)) return { ok: false, reason: `ask ${ask} below fair play (half the book)`, p: base };
  if (trade.cash - input.cashFloor < fee) return { ok: false, reason: `cash ${trade.cash} − floor ${input.cashFloor} < fee ${fee}`, p: base };
  return { ok: true, p: { ...(base as RivalPagePricing), ask, fee } };
}

/** Our directed one-card-for-cash listings on El Rastro (open, not expired). */
export function directedListings(trade: TradeState): { offer: TradeOffer; team: string; assetId: number; ref: string; price: number }[] {
  return trade.mine.flatMap((o) => {
    if (!o.to || o.venue !== "rastro" || o.thread != null || (o.status ?? "open") !== "open" || (o.expires_tick != null && o.expires_tick <= trade.tick)) return [];
    const g = readSide(o.give);
    const w = readSide(o.want);
    if (g.assets.length !== 1 || g.cash !== 0 || w.cash <= 0 || w.cards.length || w.assets.length) return [];
    const id = g.assets[0]!.id;
    const ref = g.assets[0]!.ref ?? trade.held.find((a) => a.id === id)?.ref;
    return ref ? [{ offer: o, team: o.to, assetId: id, ref, price: w.cash }] : [];
  });
}

function describe(p: RivalPagePricing): string {
  const f = p.feas;
  return `${p.ref} → ${p.team} (rank ${p.rank ?? "?"} · ${p.set} ${p.haveSeen}/${p.of} seen · κ ${p.kappa.toFixed(2)} = feas ${f.kappa} [need ${Number.isFinite(f.needOther) ? f.needOther : "∞"}/${f.unseen} unseen] × want ${p.want}) · cost ${r1(p.cost)} + option ${r1(p.option)} + rank ${p.rankPen} · fee ${p.fee} · floor ${p.floor} · their est ${p.theirValue} (m̂ ${p.mHat.toFixed(2)}) · ask ${p.ask}`;
}

/**
 * Proposes directed listings (new, reprices) and cancels. Pure except for reading `memo`. Safe by default: missing or
 * stale data → no new listings and an `off:` note.
 */
export function proposeRivalPage(input: RivalPageInput, params: RivalPageParams = RIVAL_PAGE_PARAMS, memo: RivalPageMemo = defaultMemo): { intents: Intent[]; notes: string[]; plan: RivalPagePlan } {
  const intents: Intent[] = [];
  const notes: string[] = [];
  const plan: RivalPagePlan = { posts: [], cancels: [] };
  const trade = input.trade;
  if (!trade) {
    notes.push(`${TAG} off: no El Rastro state this tick`);
    return { intents, notes, plan };
  }
  const existing = directedListings(trade);
  // A key cancelled or kept this tick is not listed again as new in the same tick.
  const listed = new Set<string>();
  const cancel = (offerId: number, key: string, reason: string, backoff = false) => {
    listed.add(key);
    const intentId = `markets:rival:cancel:${offerId}`;
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
  const heldById = new Map(trade.held.map((a) => [a.id, a]));
  // Assets El Rastro posts or already lists (non-directed), and assets in our other open offers.
  const tradeAssets = new Set((input.tradePlan?.posts ?? []).flatMap((p) => ("assets" in p.body.give ? p.body.give.assets : [])));
  const busy = new Set<number>();
  for (const o of trade.mine) {
    if ((o.status ?? "open") !== "open" || existing.some((e) => e.offer.id === o.id)) continue;
    for (const a of readSide(o.give).assets) busy.add(a.id);
  }
  const usable = (id: number) => {
    const a = heldById.get(id);
    return !!a && !a.locked && !trade.reserved.has(id) && !busy.has(id) && !tradeAssets.has(id);
  };

  // Existing directed listings: cancel, reprice or keep.
  let open = 0;
  for (const e of existing) {
    const key = `${e.team}:${e.ref}`;
    const team = byTeam.get(e.team);
    // A listing from before a restart: its baseline is today's leaderboard row.
    if (!memo.has(key) && team?.board?.pagesComplete !== undefined) memo.set(key, { reprices: 0, pagesComplete: team.board.pagesComplete });
    const entry = memo.get(key);
    const a = heldById.get(e.assetId);
    if (!a || trade.reserved.has(e.assetId) || busy.has(e.assetId) || tradeAssets.has(e.assetId)) {
      cancel(e.offer.id, key, `asset ${e.assetId} busy elsewhere`);
      continue;
    }
    if (!team) {
      cancel(e.offer.id, key, `${e.team} not in the rivals view`);
      continue;
    }
    const asm = assessRivalPage(team, e.ref, input, params);
    const pc = team.board?.pagesComplete;
    if (pc !== undefined && entry?.pagesComplete !== undefined && pc > entry.pagesComplete) {
      cancel(e.offer.id, key, `${e.team} pages complete ${entry.pagesComplete} → ${pc}`);
      continue;
    }
    const floor = asm.p?.floor;
    // A thinner surplus or a short cash for the fee keeps the listing; any other reason cancels it.
    if (!asm.ok && !/^(their est|cash )/.test(asm.reason)) {
      cancel(e.offer.id, key, asm.reason);
      continue;
    }
    if (floor === undefined || floor > e.price) {
      cancel(e.offer.id, key, floor === undefined ? "no floor" : `floor ${floor} > ask ${e.price}`);
      continue;
    }
    const age = trade.tick - (e.offer.created_tick ?? trade.tick);
    if (age >= params.repriceAfterTicks) {
      const n = entry?.reprices ?? 0;
      const next = enforceGuardrails({ role: "seller", reservation: floor }, Math.max(floor, slowReprice(e.price, floor, params.repriceFrac)), e.price);
      if (n >= params.maxReprices || next >= e.price) {
        cancel(e.offer.id, key, `no fill after ${n} reprice(s); backoff ${params.backoffTicks} ticks`, true);
        continue;
      }
      cancel(e.offer.id, key, `reprice ${e.price} → ${next}`);
      const post = makePost(e.team, e.ref, e.assetId, next, params, n + 1, e.offer.id, pc ?? entry?.pagesComplete);
      plan.posts.push(post);
      intents.push(postIntent(post, `${TAG} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${params.maxReprices})`, next - tradeFee(next, 1, RASTRO_FEES) - floor));
      notes.push(`${TAG} reprice #${e.offer.id} ${e.price} → ${next} (${n + 1}/${params.maxReprices})`);
    }
    open += 1;
    listed.add(key);
  }

  // New candidates: a team lacks exactly one card of a page, and we hold it.
  const counts = countHoldings(trade.held);
  const fresh: { asm: RivalPagePricing; assetId: number }[] = [];
  for (const team of rivals!.teams) {
    for (const p of team.pages) {
      const ref = p.missing.length === 1 ? p.missing[0]! : undefined;
      if (!ref || (counts.get(ref) ?? 0) === 0) continue;
      const key = `${team.team}:${ref}`;
      if (listed.has(key)) continue;
      const until = memo.get(key)?.backoffUntil;
      if (until !== undefined && until > trade.tick) {
        notes.push(`${TAG} skip ${ref} → ${team.team}: backoff until tick ${until}`);
        continue;
      }
      const asm = assessRivalPage(team, ref, input, params);
      if (!asm.ok) {
        const f = asm.p?.feas;
        notes.push(`${TAG} skip ${ref} → ${team.team}: ${asm.reason}${f ? ` (feas ${f.kappa} [need ${Number.isFinite(f.needOther) ? f.needOther : "∞"}/${f.unseen} unseen] × want ${asm.p?.want})` : ""}`);
        continue;
      }
      // The copy El Rastro is not listing (highest id first among the usable ones).
      const copy = trade.held.filter((a) => a.ref === ref && usable(a.id) && !fresh.some((f) => f.assetId === a.id)).sort((x, y) => y.id - x.id)[0];
      if (!copy) {
        notes.push(`${TAG} skip ${ref} → ${team.team}: every copy is locked, reserved or busy`);
        continue;
      }
      fresh.push({ asm: asm.p, assetId: copy.id });
    }
  }
  fresh.sort((a, b) => b.asm.ask - b.asm.floor - (a.asm.ask - a.asm.floor) || a.asm.team.localeCompare(b.asm.team));
  for (const f of fresh) {
    const p = f.asm;
    if (open >= params.maxOpen) {
      notes.push(`${TAG} skip ${p.ref} → ${p.team}: ${open}/${params.maxOpen} directed listings open`);
      continue;
    }
    const post = makePost(p.team, p.ref, f.assetId, p.ask, params, 0, undefined, (byTeam.get(p.team)?.board?.pagesComplete));
    plan.posts.push(post);
    intents.push(postIntent(post, `${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`, p.ask - p.fee - (p.cost + p.option + p.rankPen)));
    notes.push(`${TAG} ${describe(p)} · POST rastro to=${p.team} exp ${params.expiresInTicks}`);
    open += 1;
  }
  if (!plan.posts.length && !plan.cancels.length && !notes.some((n) => n.includes(" skip "))) notes.push(`${TAG} no team lacks exactly one page card we hold`);
  return { intents, notes, plan };
}

function makePost(team: string, ref: string, assetId: number, price: number, params: RivalPageParams, reprice: number, replaces: number | undefined, pagesComplete: number | undefined): RivalPagePost {
  return {
    intentId: `markets:rival:post:${team}:${assetId}`,
    team,
    ref,
    assetId,
    price,
    reprice,
    ...(replaces !== undefined ? { replaces } : {}),
    ...(pagesComplete !== undefined ? { pagesComplete } : {}),
    body: { venue: "rastro", to: team, give: { assets: [assetId] }, want: { cash: price }, expires_in_ticks: params.expiresInTicks },
  };
}

function postIntent(p: RivalPagePost, summary: string, ev: number): Intent {
  return { id: p.intentId, route: "markets", kind: "listing", ev: r1(ev), price: p.price, locks: [`asset:${p.assetId}`], summary };
}

/**
 * Sends the selected cancels and directed listings. `dryRun` (also when `--rival-page` is off) only prints "would" lines.
 * A reprice is posted only if its cancel went through.
 */
export async function executeRivalPage(client: Pick<BazaarClient, "postOffer" | "cancelOffer">, selected: readonly Intent[], plan: RivalPagePlan, dryRun: boolean, params: RivalPageParams = RIVAL_PAGE_PARAMS, memo: RivalPageMemo = defaultMemo, tick = 0): Promise<string[]> {
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
    const what = `POST rastro to=${p.team} ${p.ref} (asset ${p.assetId}) @ ${p.price} P exp ${params.expiresInTicks}${p.replaces !== undefined ? ` (replaces #${p.replaces})` : ""}`;
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
      memo.set(`${p.team}:${p.ref}`, { reprices: p.reprice, ...(p.pagesComplete !== undefined ? { pagesComplete: p.pagesComplete } : {}) });
      lines.push(`${TAG} sent ${what}`);
    } catch (e) {
      lines.push(`${TAG} ${what} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
