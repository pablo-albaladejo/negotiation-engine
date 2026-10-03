import { z } from "zod";
import type { ForexChainOut } from "./forex.js";

/**
 * The conversations behind each forex step, from data the board already reads (no extra GETs): our trace lines
 * (`decisions.jsonl` / `thread-<id>.jsonl`), the thread summaries in `docs/bazaar/lessons.json`, today's `flags.json`
 * and our assets in `/api/me`. Buy = our dealer threads today with `buy.at` buying the card; sell = threads with
 * `sell.at` selling an asset of that card; hold = the asset ids of the card we hold beyond the first. Read-only and
 * defensive: a malformed line is skipped, nothing throws.
 */

const num = z.number();
const str = z.string();
const TraceSchema = z.looseObject({
  ts: str.nullish(),
  tick: num.nullish(),
  thread: num.nullish(),
  dealer: str.nullish(),
  target: str.nullish(),
  action: str.nullish(),
  rule: str.nullish(),
  ourPrice: num.nullish(),
  herPrice: num.nullish(),
  dryRun: z.boolean().nullish(),
  summary: z
    .looseObject({
      cards: z.array(str).nullish(),
      herPrices: z.array(num).nullish(),
      ourPrices: z.array(num).nullish(),
      outcome: str.nullish(),
      rule: str.nullish(),
      openTick: num.nullish(),
      tick: num.nullish(),
    })
    .nullish(),
});
const LessonSchema = z.looseObject({
  thread: num,
  dealer: str.nullish(),
  kind: str.nullish(),
  item: str.nullish(),
  cards: z.array(str).nullish(),
  our_prices: z.array(num).nullish(),
  her_prices: z.array(num).nullish(),
  outcome: str.nullish(),
  price: num.nullish(),
  tick: num.nullish(),
  notes: str.nullish(),
});
const FlagsSchema = z.looseObject({
  flags: z
    .array(
      z.looseObject({
        messageId: num.nullish(),
        reason: str.nullish(),
        tick: num.nullish(),
        persona: str.nullish(),
        result: str.nullish(),
      }),
    )
    .nullish(),
});
const MeAssetsSchema = z.looseObject({
  assets: z.array(z.looseObject({ id: num.nullish(), ref: str.nullish(), kind: str.nullish() })).nullish(),
});

export interface ForexThreadFlag {
  message_id: number | null;
  reason: string;
  tick: number | null;
}

export interface ForexThreadOut {
  id: number;
  dealer: string;
  side: "buy" | "sell";
  card: string | null;
  status: "open" | "deal" | "closed";
  /** closed_no_deal, deal… (lessons.json or the closing trace line). */
  outcome: string | null;
  /** Rule of the closing decision (structure-mismatch, ac-next…). */
  rule: string | null;
  opened_tick: number | null;
  closed_tick: number | null;
  her_prices: number[];
  our_prices: number[];
  her_last: number | null;
  our_last: number | null;
  /** Settlement price when a deal happened. */
  price: number | null;
  flags: ForexThreadFlag[];
}

export interface ForexStepThreads {
  threads: ForexThreadOut[];
  /** Hold step: asset ids of the card we hold beyond the first. */
  assets: number[];
}

type Trace = z.infer<typeof TraceSchema>;
type Lesson = z.infer<typeof LessonSchema>;

/** A flag is logged when we read the message, up to a couple of ticks after the thread closed. */
const FLAG_LAG = 2;
const last = (xs: number[]) => (xs.length ? xs[xs.length - 1]! : null);
/** Prices a side said, consecutive repeats collapsed. */
function ladder(xs: (number | null | undefined)[]): number[] {
  const out: number[] = [];
  for (const x of xs) if (typeof x === "number" && out[out.length - 1] !== x) out.push(x);
  return out;
}

function threadOf(id: number, lines: Trace[], lesson: Lesson | undefined, refOf: Map<number, string>, flags: z.infer<typeof FlagsSchema>["flags"]): ForexThreadOut | null {
  const head = lines.find((l) => l.dealer && l.target) ?? lines[0];
  const dealer = head?.dealer ?? lesson?.dealer ?? null;
  const target = head?.target ?? null;
  if (!dealer || !target) return null;
  const [kind, what] = target.split(":", 2);
  if ((kind !== "buy" && kind !== "sell") || !what) return null;
  const summary = [...lines].reverse().find((l) => l.summary)?.summary ?? null;
  const card =
    kind === "buy"
      ? what
      : (refOf.get(Number(what)) ?? summary?.cards?.[0] ?? lesson?.cards?.[0] ?? null);
  const end = [...lines].reverse().find((l) => l.action === "close" || l.action === "accept") ?? null;
  const ticks = lines.flatMap((l) => (typeof l.tick === "number" ? [l.tick] : []));
  const opened = summary?.openTick ?? (ticks.length ? Math.min(...ticks) : null);
  const herPrices = lesson?.her_prices ?? summary?.herPrices ?? ladder(lines.map((l) => l.herPrice));
  const ourPrices = lesson?.our_prices ?? summary?.ourPrices ?? ladder(lines.map((l) => l.ourPrice));
  const outcome = lesson?.outcome ?? summary?.outcome ?? (end?.action === "accept" ? "deal" : end ? "closed_no_deal" : null);
  const status: ForexThreadOut["status"] = outcome === "deal" ? "deal" : end || lesson ? "closed" : "open";
  const closed = status === "open" ? null : (end?.tick ?? summary?.tick ?? lesson?.tick ?? null);
  const price = status === "deal" ? (lesson?.price ?? end?.ourPrice ?? end?.herPrice ?? null) : null;
  const ruleFromNotes = lesson?.notes?.match(/last rule ([\w-]+)/)?.[1] ?? null;
  const from = opened ?? -Infinity;
  const to = closed ?? Infinity;
  return {
    id,
    dealer,
    side: kind,
    card,
    status,
    outcome,
    rule: end?.rule ?? summary?.rule ?? ruleFromNotes,
    opened_tick: opened,
    closed_tick: closed,
    her_prices: herPrices,
    our_prices: ourPrices,
    her_last: last(herPrices),
    our_last: last(ourPrices),
    price,
    flags: (flags ?? [])
      .filter((f) => f.persona === dealer && typeof f.tick === "number" && f.tick >= from && f.tick <= to + FLAG_LAG)
      // A flag names the card the text talked about: when it names any, it must be this thread's card.
      .filter((f) => !/[A-Z]{3}-\d{2}/.test(f.reason ?? "") || (card !== null && (f.reason ?? "").includes(card)))
      .map((f) => ({ message_id: f.messageId ?? null, reason: f.reason ?? "", tick: f.tick ?? null })),
  };
}

/**
 * Per chain id, the threads and assets of each step (index-aligned with `chain.steps`). `today` is the UTC date the
 * board uses for its day folder; only trace lines whose `ts` falls on it count.
 */
export function forexThreadsOf(
  chains: ForexChainOut[],
  decisionsRaw: readonly unknown[],
  lessonsRaw: readonly unknown[],
  flagsRaw: unknown,
  meRaw: unknown,
  today: string,
): Record<string, ForexStepThreads[]> {
  const byThread = new Map<number, Trace[]>();
  for (const d of decisionsRaw) {
    const p = TraceSchema.safeParse(d);
    if (!p.success || typeof p.data.thread !== "number" || p.data.dryRun) continue;
    if (!p.data.ts || p.data.ts.slice(0, 10) !== today) continue;
    const list = byThread.get(p.data.thread) ?? [];
    list.push(p.data);
    byThread.set(p.data.thread, list);
  }
  const lessons = new Map<number, Lesson>();
  for (const l of lessonsRaw) {
    const p = LessonSchema.safeParse(l);
    if (p.success) lessons.set(p.data.thread, p.data);
  }
  const me = MeAssetsSchema.safeParse(meRaw);
  const assets = (me.success ? me.data.assets : null) ?? [];
  // asset id → card ref: our current assets, then lessons ("LAV-08 (sell:1036)") and closing summaries.
  const refOf = new Map<number, string>();
  for (const a of assets) if (typeof a.id === "number" && a.ref) refOf.set(a.id, a.ref);
  for (const l of lessons.values()) {
    const m = l.item?.match(/sell:(\d+)/);
    if (m && l.cards?.[0] && !refOf.has(Number(m[1]))) refOf.set(Number(m[1]), l.cards[0]);
  }
  const flagsP = FlagsSchema.safeParse(flagsRaw);
  const flags = flagsP.success ? flagsP.data.flags : null;
  const threads = [...byThread.entries()].flatMap(([id, lines]) => {
    const t = threadOf(id, lines, lessons.get(id), refOf, flags);
    return t ? [t] : [];
  });
  threads.sort((a, b) => b.id - a.id);

  const out: Record<string, ForexStepThreads[]> = {};
  for (const c of chains) {
    const held = assets
      .filter((a) => a.ref === c.card && (a.kind ?? "card") === "card" && typeof a.id === "number")
      .map((a) => a.id as number)
      .sort((x, y) => x - y);
    out[c.id] = c.steps.map((s) => {
      if (s.kind === "hold") return { threads: [], assets: held.slice(1) };
      const at = s.kind === "buy" ? c.buy.at : c.sell.at;
      return { threads: threads.filter((t) => t.side === s.kind && t.dealer === at && t.card === c.card), assets: [] };
    });
  }
  return out;
}
