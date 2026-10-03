import { nextCopyValue } from "../dealers/planning/plan.js";
import { valueDelta, type ValueModel } from "../trades/trades.js";
import type { Ledger, Lot, OurTrade } from "./ledger.js";
import type { PlanLine, PlayTick } from "./sources.js";

/**
 * Inefficiency detectors over the replayed ledger and the per-tick view of the coordinator (`plan.jsonl`, or `play.log`
 * where there is no plan line for that tick). Each alert carries an estimated loss when it can be computed, the evidence
 * (settlement, offer, thread, tick) and a stable `key` so it is never written twice.
 */

export const DETECTORS = [
  "dup-buy",
  "round-trip-loss",
  "below-best-bid",
  "above-best-ask",
  "album-copy-lost",
  "cash-floor",
  "double-act",
  "repeat-failure",
  "churn",
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
}

/** Window (ticks) for a buy and its resale to count as one round trip. */
export const ROUND_TRIP_TICKS = 30;
/** Minimum gap (P) against the best quote elsewhere for a below-best-bid / above-best-ask alert. */
export const BOOK_GAP_P = 1;
export const CHURN_COUNT = 3;
export const CHURN_TICKS = 20;
export const REPEAT_FAILURES = 3;

const round = (x: number): number => Math.round(x * 10) / 10;
const severityOf = (loss: number | undefined): Alert["severity"] => (loss === undefined ? "medium" : loss >= 10 ? "high" : loss >= 3 ? "medium" : "low");

function alert(a: Omit<Alert, "v" | "ts" | "severity"> & { severity?: Alert["severity"] }): Alert {
  return { v: 1, ts: new Date().toISOString(), severity: a.severity ?? severityOf(a.lossP), ...a, ...(a.lossP !== undefined ? { lossP: round(a.lossP) } : {}) };
}

const where = (t: OurTrade): string => (t.persona ? `dealer ${t.persona}${t.thread !== undefined ? ` (thread ${t.thread})` : ""}` : `venue ${t.venue ?? "?"}`);
const tradeEvidence = (t: OurTrade): Record<string, unknown> => ({
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

export function dupBuy(ledger: Ledger, model: ValueModel | undefined): Alert[] {
  const marg = model?.rules.marginals ?? [1, 0.25, 0.1];
  return ledger.trades.flatMap((t) => {
    if (t.side !== "buy" || t.copiesBefore < 1) return [];
    const lot = ledger.lots.find((l) => l.id === t.assetId && l.inSettlement === t.settlement);
    if (flippedAtProfit(lot)) return [];
    const base = model?.base.get(t.ref);
    const next = base === undefined ? undefined : nextCopyValue(base, t.copiesBefore, base * (marg[t.copiesBefore - 1] ?? 0), marg);
    const cost = t.price + (t.venue ? t.fee : 0);
    const loss = next === undefined ? undefined : cost - next;
    if (loss !== undefined && loss <= 0) return [];
    const heldIds = ledger.lots.filter((l) => l.ref === t.ref && l.inTick <= t.tick && (l.outTick === undefined || l.outTick >= t.tick) && l.id !== t.assetId).map((l) => l.id);
    return [
      alert({
        tick: t.tick,
        detector: "dup-buy",
        ...(loss !== undefined ? { lossP: loss } : {}),
        refs: [t.ref],
        assets: [t.assetId],
        summary: `Bought ${t.ref} #${t.assetId} for ${t.price} P from ${where(t)} while holding ${t.copiesBefore} cop${t.copiesBefore === 1 ? "y" : "ies"}; next copy worth ${next === undefined ? "?" : round(next)} P.`,
        evidence: { ...tradeEvidence(t), copiesBefore: t.copiesBefore, heldAssets: heldIds, ...(next !== undefined ? { nextCopyValue: round(next), baseValue: base } : {}) },
        key: `dup-buy:${t.settlement}:${t.assetId}`,
      }),
    ];
  });
}

export function roundTripLoss(ledger: Ledger): Alert[] {
  return ledger.lots.flatMap((l) => {
    if (l.inPrice === undefined || l.outPrice === undefined || l.outTick === undefined || l.outTick - l.inTick > ROUND_TRIP_TICKS) return [];
    const net = l.outPrice - (l.outFee ?? 0) - l.inPrice;
    if (net >= 0) return [];
    return [
      alert({
        tick: l.outTick,
        detector: "round-trip-loss",
        lossP: -net,
        refs: [l.ref],
        assets: [l.id],
        summary: `${l.ref} #${l.id} bought for ${l.inPrice} P (${l.inFrom}, tick ${l.inTick}) and sold for ${l.outPrice} P − fee ${l.outFee ?? 0} to ${l.outTo ?? "?"} at tick ${l.outTick}: net ${round(net)} P.`,
        evidence: { buySettlement: l.inSettlement, buyTick: l.inTick, buyFrom: l.inFrom, buyPrice: l.inPrice, ...(l.inThread !== undefined ? { thread: l.inThread } : {}), sellSettlement: l.outSettlement, sellTick: l.outTick, sellTo: l.outTo, sellPrice: l.outPrice, sellFee: l.outFee ?? 0 },
        key: `round-trip-loss:${l.id}:${l.inSettlement}:${l.outSettlement}`,
      }),
    ];
  });
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

export function albumCopyLost(ledger: Ledger, model: ValueModel | undefined): Alert[] {
  if (!model || model.pages.size === 0) return [];
  return ledger.trades.flatMap((t) => {
    if (t.side === "buy" || t.copiesBefore !== 1) return [];
    const set = model.meta.get(t.ref)?.set;
    const page = set ? model.pages.get(set) : undefined;
    if (!page?.includes(t.ref)) return [];
    const complete = page.every((r) => (t.countsBefore.get(r) ?? 0) > 0);
    const lost = -valueDelta(t.countsBefore, [t.ref], [], model);
    const loss = lost - (t.price - t.fee);
    if (!complete && loss <= 0) return [];
    const have = page.filter((r) => (t.countsBefore.get(r) ?? 0) > 0).length;
    return [
      alert({
        tick: t.tick,
        detector: "album-copy-lost",
        severity: complete ? "high" : severityOf(loss),
        lossP: Math.max(0, loss),
        refs: [t.ref],
        assets: [t.assetId],
        summary: `${t.side === "swap" ? "Swapped" : "Sold"} our only ${t.ref} #${t.assetId} to ${where(t)} for ${t.price} P${complete ? `, breaking the complete ${set} page` : ` (${set} page ${have}/${page.length})`}; it was worth ${round(lost)} P to us.`,
        evidence: { ...tradeEvidence(t), pageHave: have, pageSize: page.length, pageComplete: complete, valueLost: round(lost) },
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
  const failures = line.execution.filter((e) => !e.ok).map((e) => ({ shape: `${e.route}:${e.error ?? "failed"}`, id: e.id, line: e.detail ?? "" }));
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

export function cashFloor(views: TickView[], ledger: Ledger): Alert[] {
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
    const spent = ledger.spendByTick.get(v.tick) ?? 0;
    if (v.maxSpend !== undefined && spent > v.maxSpend) {
      out.push(
        alert({
          tick: v.tick,
          detector: "cash-floor",
          lossP: spent - v.maxSpend,
          refs: [],
          assets: [],
          summary: `Spent ${spent} P at tick ${v.tick}, above --max-spend ${v.maxSpend} P.`,
          evidence: { tick: v.tick, spent, maxSpend: v.maxSpend, source: v.source },
          key: `max-spend:${v.tick}`,
        }),
      );
    }
  }
  return out;
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
    const shapes = new Map(v.failures.map((f) => [f.id && !/^\w+$/.test(f.id) ? f.id : f.shape, f.line]));
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
