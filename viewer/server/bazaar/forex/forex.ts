import { z } from "zod";
import type { ForexStepThreads } from "./forex-threads.js";

/**
 * «Forex»: the A → B → C chains `bazaar:play` finds every tick (`<day>/forex.json`, written by `writeForex` in
 * `src/forex/chains.ts`): buy a card at one place, hold it, sell it at another, net of fees. Read-only and defensive:
 * a malformed chain is dropped, a malformed file is null; nothing here throws or sends.
 */

const num = z.number();
const str = z.string();
const LegSchema = z.looseObject({
  at: str,
  kind: str.nullish(),
  price: num,
  lo: num.nullish(),
  hi: num.nullish(),
  n: num.nullish(),
  fee: num.nullish(),
  lastTick: num.nullish(),
});
const StepSchema = z.looseObject({
  kind: str,
  at: str.nullish(),
  expected: num.nullish(),
  label: str.nullish(),
});
const ChainSchema = z.looseObject({
  id: str,
  card: str,
  rarity: str.nullish(),
  buy: LegSchema,
  sell: LegSchema,
  steps: z.array(z.unknown()).nullish(),
  margin: num.nullish(),
  worst: num.nullish(),
  automated: z.boolean().nullish(),
  maxBuy: num.nullish(),
  minSell: num.nullish(),
  current: num.nullish(),
  status: str.nullish(),
  doneToday: num.nullish(),
});
const FileSchema = z.looseObject({
  tick: num.nullish(),
  chains: z.array(z.unknown()).nullish(),
  trades: num.nullish(),
  scanned: num.nullish(),
  updated: str.nullish(),
});

export interface ForexLegOut {
  at: string;
  kind: "dealer" | "venue";
  price: number;
  lo: number;
  hi: number;
  n: number;
  fee: number;
  last_tick: number | null;
}

export interface ForexStepOut {
  kind: "buy" | "hold" | "sell";
  at: string;
  /** buy = −(price + fee), hold = 0, sell = +(price − fee). */
  expected: number;
  label: string;
}

export interface ForexChainOut {
  id: string;
  card: string;
  rarity: string | null;
  buy: ForexLegOut;
  sell: ForexLegOut;
  steps: ForexStepOut[];
  margin: number;
  worst: number;
  /** Run by the dealers agent; false = shown only. */
  automated: boolean;
  max_buy: number | null;
  min_sell: number | null;
  /** Index into steps; −1 = idle. */
  current: number;
  status: string;
  done_today: number;
  /** Conversations and assets behind each step, index-aligned with steps (filled by the board; `forexThreadsOf`). */
  step_threads: ForexStepThreads[];
}

export interface ForexOut {
  tick: number | null;
  updated: string | null;
  /** Deals in the window the chains were found from. */
  trades: number;
  /** Cards scanned. */
  scanned: number;
  chains: ForexChainOut[];
}

const legOf = (l: z.infer<typeof LegSchema>): ForexLegOut => ({
  at: l.at,
  kind: l.kind === "venue" ? "venue" : "dealer",
  price: l.price,
  lo: l.lo ?? l.price,
  hi: l.hi ?? l.price,
  n: l.n ?? 0,
  fee: l.fee ?? 0,
  last_tick: l.lastTick ?? null,
});

/** The three steps when the file has none (or a malformed list). */
function defaultSteps(card: string, buy: ForexLegOut, sell: ForexLegOut): ForexStepOut[] {
  return [
    { kind: "buy", at: buy.at, expected: -(buy.price + buy.fee), label: `buy ${card} at ${buy.at} ~${buy.price}` },
    { kind: "hold", at: "us", expected: 0, label: `hold the copy (${buy.price + buy.fee} P tied up)` },
    { kind: "sell", at: sell.at, expected: sell.price - sell.fee, label: `sell to ${sell.at} ~${sell.price}` },
  ];
}

export function forexOf(raw: unknown): ForexOut | null {
  const f = FileSchema.safeParse(raw);
  if (!f.success) return null;
  const chains = (f.data.chains ?? []).flatMap((c): ForexChainOut[] => {
    const p = ChainSchema.safeParse(c);
    if (!p.success) return [];
    const x = p.data;
    const buy = legOf(x.buy);
    const sell = legOf(x.sell);
    const parsed = (x.steps ?? []).flatMap((s): ForexStepOut[] => {
      const q = StepSchema.safeParse(s);
      if (!q.success || (q.data.kind !== "buy" && q.data.kind !== "hold" && q.data.kind !== "sell")) return [];
      return [{ kind: q.data.kind, at: q.data.at ?? "", expected: q.data.expected ?? 0, label: q.data.label ?? q.data.kind }];
    });
    const steps = parsed.length ? parsed : defaultSteps(x.card, buy, sell);
    const cur = x.current ?? -1;
    const margin = x.margin ?? sell.price - sell.fee - buy.price - buy.fee;
    return [
      {
        id: x.id,
        card: x.card,
        rarity: x.rarity ?? null,
        buy,
        sell,
        steps,
        margin,
        worst: x.worst ?? margin,
        automated: x.automated ?? false,
        max_buy: x.maxBuy ?? null,
        min_sell: x.minSell ?? null,
        current: Number.isInteger(cur) && cur >= 0 && cur < steps.length ? cur : -1,
        status: x.status ?? "",
        done_today: x.doneToday ?? 0,
        step_threads: [],
      },
    ];
  });
  return {
    tick: f.data.tick ?? null,
    updated: f.data.updated ?? null,
    trades: f.data.trades ?? 0,
    scanned: f.data.scanned ?? 0,
    chains,
  };
}
