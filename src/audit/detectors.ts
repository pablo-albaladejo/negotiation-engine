import { nextCopyValue } from "../dealers/planning/plan.js";
import { valueDelta, type ValueModel } from "../trades/trades.js";
import type { Ledger, Lot, OurTrade } from "./ledger.js";
import type { PlanLine, PlayTick } from "./sources.js";
import { VALUE_WINDOW_TICKS, type ValueHistory } from "./value-history.js";

/**
 * Inefficiency detectors over the replayed ledger and the per-tick view of the coordinator (`plan.jsonl`, or `play.log`
 * where there is no plan line for that tick). Each alert carries an estimated loss when it can be computed, the evidence
 * (settlement, offer, thread, tick) and a stable `key` so it is never written twice.
 */

export const DETECTORS = [
  "dup-buy",
  "round-trip-loss",
  "buy-back",
  "below-best-bid",
  "above-best-ask",
  "album-copy-lost",
  "cash-floor",
  "reserve-breach",
  "max-spend",
  "double-act",
  "repeat-failure",
  "churn",
  "repeated-price",
  "duel-unanswered",
  "dealer-spam",
  "stale-source",
] as const;
export type Detector = (typeof DETECTORS)[number];

export interface Alert {
  v: 1;
  ts: string;
  tick: number;
  detector: Detector;
  severity: "high" | "medium" | "low";
  lossP?: number;
  refs: string[];
  assets: number[];
  summary: string;
  evidence: Record<string, unknown>;
  key: string;
  /** Keys of other alerts that count a loss on the same trade (set by the report; the deduplicated total keeps the largest). */
  overlaps?: string[];
}

/** Window (ticks) for a buy and its resale to count as one round trip. */
export const ROUND_TRIP_TICKS = 30;
/** Window (ticks) for a sale and the later purchase of the same card to count as buying it back. */
export const BUY_BACK_TICKS = 120;
/** Minimum gap (P) against the best quote elsewhere for a below-best-bid / above-best-ask alert. */
export const BOOK_GAP_P = 1;
export const CHURN_COUNT = 3;
export const CHURN_TICKS = 20;
export const REPEAT_FAILURES = 3;
/** Day-2 hint 6: a 429 means "wait for the next tick", it is not an error (nor are the client's retry codes). */
export const NOT_A_FAILURE = new Set(["rate_limited", "too_many_failures", "wait_for_tick", "http_429", "429"]);

const round = (x: number): number => Math.round(x * 10) / 10;
const severityOf = (loss: number | undefined): Alert["severity"] => (loss === undefined ? "medium" : loss >= 10 ? "high" : loss >= 3 ? "medium" : "low");

export function alert(a: Omit<Alert, "v" | "ts" | "severity"> & { severity?: Alert["severity"] }): Alert {
  return { v: 1, ts: new Date().toISOString(), severity: a.severity ?? severityOf(a.lossP), ...a, ...(a.lossP !== undefined ? { lossP: round(a.lossP) } : {}) };
}

const where = (t: OurTrade): string => (t.persona ? `dealer ${t.persona}${t.thread !== undefined ? ` (thread ${t.thread})` : ""}` : `venue ${t.venue ?? "?"}`);
/** Trade id used to group alerts that count the same loss (`evidence.trades`). */
export const tradeId = (t: Pick<OurTrade, "settlement" | "assetId">): string => `${t.settlement}:${t.assetId}`;
const tradeEvidence = (t: OurTrade): Record<string, unknown> => ({
  trades: [tradeId(t)],
  settlement: t.settlement,
  tick: t.tick,
  price: t.price,
  fee: t.fee,
  ...(t.venue ? { venue: t.venue } : {}),
  ...(t.persona ? { persona: t.persona } : {}),
  ...(t.counterparty ? { counterparty: t.counterparty } : {}),
  ...(t.thread !== undefined ? { thread: t.thread } : {}),
  ...(t.reservation !== undefined ? { reservation: t.reservation } : {}),
});

/** A bought copy resold within the round-trip window at or above its cost was a deliberate flip, not a kept duplicate. */
function flippedAtProfit(lot: Lot | undefined): boolean {
  return !!lot && lot.inPrice !== undefined && lot.outPrice !== undefined && lot.outTick !== undefined && lot.outTick - lot.inTick <= ROUND_TRIP_TICKS && lot.outPrice - (lot.outFee ?? 0) >= lot.inPrice;
}

/** Base value (first copy) of a card as of a past tick, or today's when no historical value is near (`hindsight`). */
interface ValueAt {
  base: number;
  source: string;
  tick?: number;
  hindsight: boolean;
}

function valueAt(ref: string, tick: number, ledger: Ledger, model: ValueModel | undefined, history: ValueHistory | undefined): ValueAt | undefined {
  const marg = model?.rules.marginals ?? [1, 0.25, 0.1];
  const p = history?.at(ref, tick, ledger.lots);
  if (p) {
    // The point values the copy at stake then: the last held copy (its marginal) or the first one if we held none.
    const m = p.held > 0 ? (marg[p.held - 1] ?? 0) : 1;
    if (m > 0) return { base: p.value / m, source: p.source, tick: p.tick, hindsight: false };
  }
  const base = model?.base.get(ref);
  return base === undefined ? undefined : { base, source: "current (hindsight)", hindsight: true };
}

const valueEvidence = (v: ValueAt): Record<string, unknown> => ({ valueSource: v.source, ...(v.tick !== undefined ? { valueTick: v.tick } : {}) });
const HINDSIGHT_NOTE = ` (today's value: no historical value within ±${VALUE_WINDOW_TICKS} ticks, so no loss is counted)`;

/**
 * `dup-buy`: a copy bought while we already held one, worth less than it cost. The next copy is valued as of the
 * trade's tick (ValueHistory); with only today's value the alert is low and counts no loss.
 */
export function dupBuy(ledger: Ledger, model: ValueModel | undefined, history?: ValueHistory): Alert[] {
  const marg = model?.rules.marginals ?? [1, 0.25, 0.1];
  return ledger.trades.flatMap((t) => {
    if (t.side !== "buy" || t.copiesBefore < 1) return [];
    const lot = ledger.lots.find((l) => l.id === t.assetId && l.inSettlement === t.settlement);
    if (flippedAtProfit(lot)) return [];
    const v = valueAt(t.ref, t.tick, ledger, model, history);
    const next = v === undefined ? undefined : nextCopyValue(v.base, t.copiesBefore, v.base * (marg[t.copiesBefore - 1] ?? 0), marg);
    const cost = t.price + (t.venue ? t.fee : 0);
    const loss = next === undefined ? undefined : cost - next;
    if (loss !== undefined && loss <= 0) return [];
    const counted = v?.hindsight ? undefined : loss;
    const heldIds = ledger.lots.filter((l) => l.ref === t.ref && l.inTick <= t.tick && (l.outTick === undefined || l.outTick >= t.tick) && l.id !== t.assetId).map((l) => l.id);
    return [
      alert({
        tick: t.tick,
        detector: "dup-buy",
        ...(v?.hindsight ? { severity: "low" as const } : {}),
        ...(counted !== undefined ? { lossP: counted } : {}),
        refs: [t.ref],
        assets: [t.assetId],
        summary: `Bought ${t.ref} #${t.assetId} for ${t.price} P from ${where(t)} while holding ${t.copiesBefore} cop${t.copiesBefore === 1 ? "y" : "ies"}; next copy worth ${next === undefined ? "?" : round(next)} P${v?.hindsight ? HINDSIGHT_NOTE : ""}.`,
        evidence: {
          ...tradeEvidence(t),
          copiesBefore: t.copiesBefore,
          heldAssets: heldIds,
          ...(next !== undefined && v ? { nextCopyValue: round(next), baseValue: round(v.base), ...valueEvidence(v) } : {}),
          ...(v?.hindsight && loss !== undefined ? { hindsightLossP: round(loss) } : {}),
        },
        key: `dup-buy:${t.settlement}:${t.assetId}`,
      }),
    ];
  });
}

/**
 * Pairs our trades of the same card in time order (the same asset first, otherwise the latest open one of that ref):
 * - `round-trip-loss`: a buy closed by a sale within ROUND_TRIP_TICKS with sale − fee − purchase < 0;
 * - `buy-back`: a sale closed by a purchase within BUY_BACK_TICKS that cost more than the sale brought in.
 * Each trade opens and closes at most one pair per direction.
 */
export function tradePairs(ledger: Ledger): Alert[] {
  const out: Alert[] = [];
  const openBuys = new Map<string, OurTrade[]>();
  const openSells = new Map<string, OurTrade[]>();
  const take = (open: Map<string, OurTrade[]>, t: OurTrade, window: number): OurTrade | undefined => {
    const list = (open.get(t.ref) ?? []).filter((o) => t.tick - o.tick <= window);
    const pick = list.find((o) => o.assetId === t.assetId) ?? list.at(-1);
    open.set(t.ref, list.filter((o) => o !== pick));
    return pick;
  };
  for (const t of ledger.trades) {
    if (t.side === "sell") {
      const b = take(openBuys, t, ROUND_TRIP_TICKS);
      openSells.set(t.ref, [...(openSells.get(t.ref) ?? []), t]);
      if (!b) continue;
      const net = t.price - t.fee - b.price;
      if (net >= 0) continue;
      const same = b.assetId === t.assetId;
      out.push(
        alert({
          tick: t.tick,
          detector: "round-trip-loss",
          lossP: -net,
          refs: [t.ref],
          assets: same ? [t.assetId] : [b.assetId, t.assetId],
          summary: `${t.ref} ${same ? `#${t.assetId}` : `#${b.assetId}`} bought for ${b.price} P (${where(b)}, tick ${b.tick}) and ${same ? "" : `#${t.assetId} `}sold for ${t.price} P − fee ${t.fee} to ${where(t)} at tick ${t.tick}: net ${round(net)} P.`,
          evidence: { trades: [tradeId(b), tradeId(t)], sameAsset: same, buySettlement: b.settlement, buyTick: b.tick, buyPrice: b.price, ...(b.thread !== undefined ? { thread: b.thread } : {}), sellSettlement: t.settlement, sellTick: t.tick, sellTo: t.counterparty, sellPrice: t.price, sellFee: t.fee },
          key: same ? `round-trip-loss:${t.assetId}:${b.settlement}:${t.settlement}` : `round-trip-loss:${b.assetId}>${t.assetId}:${b.settlement}:${t.settlement}`,
        }),
      );
    } else if (t.side === "buy") {
      const s = take(openSells, t, BUY_BACK_TICKS);
      openBuys.set(t.ref, [...(openBuys.get(t.ref) ?? []), t]);
      if (!s) continue;
      const cost = t.price + (t.venue ? t.fee : 0);
      const got = s.price - s.fee;
      if (cost - got <= 0) continue;
      const same = s.assetId === t.assetId;
      out.push(
        alert({
          tick: t.tick,
          detector: "buy-back",
          lossP: cost - got,
          refs: [t.ref],
          assets: same ? [t.assetId] : [s.assetId, t.assetId],
          summary: `${t.ref} ${same ? `#${t.assetId}` : `#${s.assetId}`} sold for ${s.price} P − fee ${s.fee} to ${where(s)} at tick ${s.tick} and ${same ? "bought back" : `#${t.assetId} bought`} for ${t.price} P from ${where(t)} at tick ${t.tick}.`,
          evidence: { trades: [tradeId(s), tradeId(t)], sameAsset: same, sellSettlement: s.settlement, sellTick: s.tick, sellPrice: s.price, sellFee: s.fee, buySettlement: t.settlement, buyTick: t.tick, buyPrice: t.price, ...(t.thread !== undefined ? { thread: t.thread } : {}) },
          key: `buy-back:${s.settlement}:${s.assetId}:${t.settlement}:${t.assetId}`,
        }),
      );
    }
  }
  return out;
}

export function bookGaps(ledger: Ledger): Alert[] {
  return ledger.trades.flatMap((t) => {
    if (t.side === "sell" && t.bestBid) {
      const ours = t.price - t.fee;
      const gap = t.bestBid.net - ours;
      if (gap < BOOK_GAP_P) return [];
      return [
        alert({
          tick: t.tick,
          detector: "below-best-bid",
          lossP: gap,
          refs: [t.ref],
          assets: [t.assetId],
          summary: `Sold ${t.ref} #${t.assetId} to ${where(t)} for ${t.price} P (net ${round(ours)}) while ${t.bestBid.maker} bid ${t.bestBid.price} P on ${t.bestBid.venue} (net ${round(t.bestBid.net)}).`,
          evidence: { ...tradeEvidence(t), bestBid: t.bestBid },
          key: `below-best-bid:${t.settlement}:${t.assetId}`,
        }),
      ];
    }
    if (t.side === "buy" && t.bestAsk) {
      const ours = t.price + (t.venue ? t.fee : 0);
      const gap = ours - t.bestAsk.net;
      if (gap < BOOK_GAP_P) return [];
      return [
        alert({
          tick: t.tick,
          detector: "above-best-ask",
          lossP: gap,
          refs: [t.ref],
          assets: [t.assetId],
          summary: `Bought ${t.ref} #${t.assetId} from ${where(t)} for ${t.price} P while ${t.bestAsk.maker} asked ${t.bestAsk.price} P on ${t.bestAsk.venue} (with fee ${round(t.bestAsk.net)}).`,
          evidence: { ...tradeEvidence(t), bestAsk: t.bestAsk },
          key: `above-best-ask:${t.settlement}:${t.assetId}`,
        }),
      ];
    }
    return [];
  });
}

/**
 * `album-copy-lost`: our only copy of a page card left and what we got does not cover its value to us, valued as of the
 * trade's tick (a page that progressed later makes the card worth more today, which we could not have collected). High
 * if it breaks a complete page. With only today's value: low (medium if it breaks a complete page) and no loss counted.
 */
export function albumCopyLost(ledger: Ledger, model: ValueModel | undefined, history?: ValueHistory): Alert[] {
  if (!model || model.pages.size === 0) return [];
  return ledger.trades.flatMap((t) => {
    if (t.side === "buy" || t.copiesBefore !== 1) return [];
    const set = model.meta.get(t.ref)?.set;
    const page = set ? model.pages.get(set) : undefined;
    if (!page?.includes(t.ref)) return [];
    const complete = page.every((r) => (t.countsBefore.get(r) ?? 0) > 0);
    const v = valueAt(t.ref, t.tick, ledger, model, history);
    const asOf: ValueModel = v ? { ...model, base: new Map(model.base).set(t.ref, v.base) } : model;
    const lost = -valueDelta(t.countsBefore, [t.ref], [], asOf);
    const loss = lost - (t.price - t.fee);
    if (!complete && loss <= 0) return [];
    const have = page.filter((r) => (t.countsBefore.get(r) ?? 0) > 0).length;
    const hindsight = v?.hindsight ?? true;
    return [
      alert({
        tick: t.tick,
        detector: "album-copy-lost",
        severity: hindsight ? (complete ? "medium" : "low") : complete ? "high" : severityOf(loss),
        ...(hindsight ? {} : { lossP: Math.max(0, loss) }),
        refs: [t.ref],
        assets: [t.assetId],
        summary: `${t.side === "swap" ? "Swapped" : "Sold"} our only ${t.ref} #${t.assetId} to ${where(t)} for ${t.price} P${complete ? `, breaking the complete ${set} page` : ` (${set} page ${have}/${page.length})`}; it was worth ${round(lost)} P to us${hindsight ? HINDSIGHT_NOTE : v?.tick !== undefined ? ` at tick ${v.tick}` : ""}.`,
        evidence: { ...tradeEvidence(t), pageHave: have, pageSize: page.length, pageComplete: complete, valueLost: round(lost), ...(v ? valueEvidence(v) : { valueSource: "none" }), ...(hindsight ? { hindsightLossP: round(Math.max(0, loss)) } : {}) },
        key: `album-copy-lost:${t.settlement}:${t.assetId}`,
      }),
    ];
  });
}

// ---------------------------------------------------------------- coordinator view per tick

export interface TickView {
  tick: number;
  source: "plan" | "play.log";
  cash?: number;
  cashFloor?: number;
  maxSpend?: number;
  acts: { route: string; side: "buy" | "sell"; ref?: string; assetId?: number; id: string }[];
  failures: { shape: string; id?: string; line: string }[];
}

const REF_RE = /\b([A-Z]{3}-\d{2})\b/;
const ACT_KINDS = new Set(["accept", "open", "listing"]);

/** Selected intents that buy or sell, from a plan line; side and ref are inferred from the intent's id and summary. */
export function planView(line: PlanLine): TickView {
  const selected = new Set(line.arbitration.filter((a) => a.verdict === "selected").map((a) => a.id));
  const acts: TickView["acts"] = [];
  for (const i of line.intents) {
    if (!selected.has(i.id) || (i.kind !== undefined && !ACT_KINDS.has(i.kind))) continue;
    const text = `${i.summary ?? ""} ${i.id}`;
    const side = /\b(SELL|sell|list|ask)\b/.test(text) ? "sell" : /\b(BUY|buy|bid)\b/.test(text) ? "buy" : undefined;
    if (!side) continue;
    const ref = i.ref ?? REF_RE.exec(text)?.[1];
    const assetId = i.assetIds?.[0];
    if (!ref && assetId === undefined) continue;
    acts.push({ route: i.route, side, ...(ref ? { ref } : {}), ...(assetId !== undefined ? { assetId } : {}), id: i.id });
  }
  // The coordinator only reads `failed: <code>`; a dealer line `· error · … error <code>` comes as ok but is a failure too.
  const failures = line.execution.flatMap((e) => {
    const dealerErr = /· error · .*\berror ([\w-]+)/.exec(e.detail ?? "");
    if (e.ok && !dealerErr) return [];
    return [{ shape: `${e.route}:${e.error ?? dealerErr?.[1] ?? "failed"}`, id: e.id, line: e.detail ?? "" }];
  });
  return {
    tick: line.tick,
    source: "plan",
    ...(line.cash !== undefined ? { cash: line.cash } : {}),
    ...(line.cashFloor !== undefined ? { cashFloor: line.cashFloor } : {}),
    ...(line.maxSpend !== undefined ? { maxSpend: line.maxSpend } : {}),
    acts,
    failures,
  };
}

export function playView(t: PlayTick): TickView {
  return {
    tick: t.tick,
    source: "play.log",
    ...(t.cash !== undefined ? { cash: t.cash } : {}),
    ...(t.cashFloor !== undefined ? { cashFloor: t.cashFloor } : {}),
    acts: t.acts.map((a, k) => ({ ...a, id: `${a.route}:${k}` })),
    failures: t.failures,
  };
}

export function cashFloor(views: TickView[]): Alert[] {
  const out: Alert[] = [];
  let episode: number | undefined;
  for (const v of views) {
    const below = v.cash !== undefined && v.cashFloor !== undefined && v.cash < v.cashFloor;
    if (below && episode === undefined) {
      episode = v.tick;
      out.push(
        alert({
          tick: v.tick,
          detector: "cash-floor",
          severity: "high",
          refs: [],
          assets: [],
          summary: `Cash ${v.cash} P below the cash floor ${v.cashFloor} P at tick ${v.tick}.`,
          evidence: { tick: v.tick, cash: v.cash, cashFloor: v.cashFloor, source: v.source },
          key: `cash-floor:${v.tick}`,
        }),
      );
    } else if (!below) episode = undefined;
  }
  return out;
}

/** Cash after a buy: the first coordinator view after its tick, at most this many ticks later. */
const CASH_AFTER_TICKS = 3;

/**
 * `reserve-breach` (commit 0ac4757): a buy of a card that is not a reserve target, leaving cash below cash floor +
 * page reserve. As in the coordinator, only the reserve's own refs may use it; a buy that completes another page is
 * still flagged, with `completesPage` in the evidence (live, the coordinator puts such a card in the reserve once a
 * dealer prices it) (the cash kept for the page-completing card a dealer already priced). The
 * reserve per tick comes from play.log `page reserve: N P kept for <refs>` (plan.jsonl does not carry it); from the
 * first such line on, a tick without one kept nothing. Buys before that line are a backtest with the first logged
 * reserve: low, since the reserve did not exist yet. Cash after = the next view's cash; no loss in P is counted.
 */
export function reserveBreach(ledger: Ledger, views: TickView[], reserves: Map<number, { amount: number; refs: string[] }>, reserveFrom: number | undefined, model: ValueModel | undefined): Alert[] {
  if (reserveFrom === undefined) return [];
  const first = reserves.get(reserveFrom)!;
  const bySettlement = new Map<number, OurTrade[]>();
  for (const t of ledger.trades) if (t.side === "buy") bySettlement.set(t.settlement, [...(bySettlement.get(t.settlement) ?? []), t]);
  const completesPage = (t: OurTrade): boolean => {
    const page = model?.pages.get(model.meta.get(t.ref)?.set ?? "");
    return !!page?.includes(t.ref) && t.copiesBefore === 0 && page.every((r) => r === t.ref || (t.countsBefore.get(r) ?? 0) > 0);
  };
  const out: Alert[] = [];
  for (const [settlement, ts] of bySettlement) {
    const tick = ts[0]!.tick;
    const live = tick >= reserveFrom;
    const r = live ? (reserves.get(tick) ?? { amount: 0, refs: [] }) : first;
    if (r.amount <= 0 || ts.some((t) => r.refs.includes(t.ref))) continue;
    const before = views.filter((v) => v.tick <= tick && v.cash !== undefined).at(-1);
    const after = views.find((v) => v.tick > tick && v.tick - tick <= CASH_AFTER_TICKS && v.cash !== undefined);
    const floor = after?.cashFloor ?? before?.cashFloor;
    if (after?.cash === undefined || floor === undefined || after.cash >= floor + r.amount) continue;
    const paid = ts.reduce((sum, t) => sum + t.price + (t.venue ? t.fee : 0), 0);
    const refs = [...new Set(ts.map((t) => t.ref))];
    const completing = ts.filter(completesPage).map((t) => t.ref);
    out.push(
      alert({
        tick,
        detector: "reserve-breach",
        severity: live ? "high" : "low",
        refs,
        assets: ts.map((t) => t.assetId),
        summary: `Bought ${refs.join(", ")} for ${round(paid)} P from ${where(ts[0]!)} leaving cash ${after.cash} P (tick ${after.tick}) below floor ${floor} + page reserve ${r.amount} P for ${r.refs.join(", ")}${completing.length ? ` (it completed the ${completing.map((x) => model?.meta.get(x)?.set ?? x).join(", ")} page)` : ""}${live ? "" : " (backtest: the reserve did not exist yet)"}.`,
        evidence: {
          settlement,
          tick,
          paid: round(paid),
          ...(before?.cash !== undefined ? { cashBefore: before.cash, cashBeforeTick: before.tick } : {}),
          cashAfter: after.cash,
          cashAfterTick: after.tick,
          cashFloor: floor,
          reserve: r.amount,
          reserveRefs: r.refs,
          shortfallP: round(floor + r.amount - after.cash),
          ...(completing.length ? { completesPage: completing } : {}),
          reserveSource: live ? `play.log page reserve line at tick ${tick}${reserves.has(tick) ? "" : " (none logged: 0)"}` : `backtest: first logged reserve (play.log tick ${reserveFrom}) applied to an earlier tick`,
        },
        key: `reserve-breach:${settlement}`,
      }),
    );
  }
  return out;
}

/** Our spend in a tick (buys plus venue fees, from settlements) above that tick's `--max-spend` (plan.jsonl only). */
export function maxSpend(views: TickView[], ledger: Ledger): Alert[] {
  return views.flatMap((v) => {
    const spent = ledger.spendByTick.get(v.tick) ?? 0;
    if (v.maxSpend === undefined || spent <= v.maxSpend) return [];
    return [
      alert({
        tick: v.tick,
        detector: "max-spend",
        lossP: spent - v.maxSpend,
        refs: [],
        assets: [],
        summary: `Spent ${spent} P at tick ${v.tick}, above --max-spend ${v.maxSpend} P.`,
        evidence: { tick: v.tick, spent, maxSpend: v.maxSpend, source: v.source },
        key: `max-spend:${v.tick}`,
      }),
    ];
  });
}

export function doubleAct(views: TickView[], ledger: Ledger): Alert[] {
  const refOfAsset = new Map(ledger.lots.map((l) => [l.id, l.ref]));
  return views.flatMap((v) => {
    const groups = new Map<string, TickView["acts"]>();
    for (const a of v.acts) {
      const ref = a.ref ?? (a.assetId !== undefined ? refOfAsset.get(a.assetId) : undefined);
      if (!ref) continue;
      const k = `${a.side}:${ref}`;
      groups.set(k, [...(groups.get(k) ?? []), a]);
    }
    return [...groups].flatMap(([k, acts]) => {
      const routes = [...new Set(acts.map((a) => a.route))];
      if (routes.length < 2) return [];
      const [side, ref] = k.split(":") as [string, string];
      return [
        alert({
          tick: v.tick,
          detector: "double-act",
          severity: side === "sell" ? "high" : "medium",
          refs: [ref],
          assets: acts.flatMap((a) => (a.assetId !== undefined ? [a.assetId] : [])),
          summary: `Tick ${v.tick}: ${routes.join(" and ")} both ${side === "sell" ? "sell" : "buy"} ${ref} in the same tick.`,
          evidence: { tick: v.tick, source: v.source, intents: acts.map((a) => a.id) },
          key: `double-act:${v.tick}:${k}`,
        }),
      ];
    });
  });
}

export function repeatFailure(views: TickView[]): Alert[] {
  const out: Alert[] = [];
  const streaks = new Map<string, { start: number; ticks: number[]; line: string; reported: boolean }>();
  for (const v of views) {
    const failures = v.failures.filter((f) => !NOT_A_FAILURE.has(f.shape.split(":").at(-1) ?? ""));
    const shapes = new Map(failures.map((f) => [f.id && !/^\w+$/.test(f.id) ? f.id : f.shape, f.line]));
    for (const [shape, s] of streaks) if (!shapes.has(shape)) streaks.delete(shape);
    for (const [shape, line] of shapes) {
      const s = streaks.get(shape) ?? { start: v.tick, ticks: [], line, reported: false };
      s.ticks.push(v.tick);
      streaks.set(shape, s);
      if (s.ticks.length >= REPEAT_FAILURES && !s.reported) {
        s.reported = true;
        out.push(
          alert({
            tick: v.tick,
            detector: "repeat-failure",
            severity: "medium",
            refs: REF_RE.test(line) ? [REF_RE.exec(line)![1]!] : [],
            assets: [],
            summary: `${shape} failed in ${s.ticks.length} consecutive ticks (${s.ticks[0]}–${v.tick}).`,
            evidence: { ticks: s.ticks, sample: line, source: v.source },
            key: `repeat-failure:${shape}:${s.start}`,
          }),
        );
      }
    }
  }
  return out;
}

/**
 * Our listing or bid for the same card withdrawn ≥ CHURN_COUNT times with all of them less than CHURN_TICKS apart
 * (strict: the trades agent's slow reprice, one step every 10 ticks, spans 21 ticks for 3 cancels and is by design).
 * One alert per episode: cancels chained less than CHURN_TICKS apart.
 */
export function churn(ledger: Ledger): Alert[] {
  const by = new Map<string, Ledger["cancels"]>();
  for (const c of ledger.cancels) by.set(`${c.side}:${c.ref}`, [...(by.get(`${c.side}:${c.ref}`) ?? []), c]);
  const out: Alert[] = [];
  for (const [k, list] of by) {
    list.sort((a, b) => a.tick - b.tick);
    const episodes: Ledger["cancels"][] = [];
    for (const c of list) {
      const ep = episodes.at(-1);
      if (ep && c.tick - ep.at(-1)!.tick < CHURN_TICKS) ep.push(c);
      else episodes.push([c]);
    }
    const [side, ref] = [k.slice(0, k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    for (const ep of episodes) {
      // The first window of CHURN_COUNT cancels inside CHURN_TICKS ticks; none → not churn.
      const hit = ep.findIndex((c, i) => i >= CHURN_COUNT - 1 && c.tick - ep[i - CHURN_COUNT + 1]!.tick < CHURN_TICKS);
      if (hit < 0) continue;
      out.push(
        alert({
          tick: ep[hit]!.tick,
          detector: "churn",
          severity: "low",
          refs: [ref],
          assets: [],
          summary: `Our ${side === "sell" ? "listing" : "bid"} for ${ref} was posted and withdrawn ${ep.length} times (ticks ${ep[0]!.tick}–${ep.at(-1)!.tick}).`,
          evidence: { offers: ep.map((c) => c.offer), ticks: ep.map((c) => c.tick) },
          key: `churn:${k}:${ep[0]!.tick}`,
        }),
      );
    }
  }
  return out;
}
