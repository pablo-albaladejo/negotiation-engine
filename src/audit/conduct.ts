import { DEFAULT_DUEL_PARAMS } from "../duels/duels.js";
import { alert, NOT_A_FAILURE, type Alert } from "./detectors.js";
import type { DealerEvent, DuelMemory, DuelSend, StreamEvent } from "./sources.js";

/**
 * Conduct detectors from the official Day-2 hints (hint 3: answer your duels; hint 5: dealers notice spam, the same price
 * is not a move). They read how we talk, not what we traded: our dealer messages and opens in the recorder stream, the
 * dealer agent's decisions (rules and errors), the duel counters we sent (play.log / plan.jsonl) and the rival's duel
 * messages and results in the stream.
 */

/** A dealer that answered with any of these stopped talking to us for a while (quota, cooloff, judge strikes). */
const REFUSAL_RE = /^(persona_quota|cooloff)$|warn|strike|anti_cheat|spam/i;
/**
 * Burst: this many of our opens + messages to one dealer inside DEALER_BURST_TICKS, i.e. above our designed cadence (one
 * thread per dealer, one message per conversation and tick). On 2026-10-03 that cadence never broke, and a sliding
 * window over it was noise: 1 per tick for up to 25 ticks in a row is a normal negotiation, ≥ 18 in 20 happened seven
 * times and only two (abuela, before the persona_quota refusals at t186 and t376) were followed by a refusal; a
 * per-game-hour count did not explain them either (abuela 43 actions in hour 3, no refusal). Refusals are caught below.
 */
export const DEALER_BURST_COUNT = 2;
export const DEALER_BURST_TICKS = 1;
/** The same dealer + target failing with the same code this many times inside DEALER_RETRY_TICKS: we keep knocking. */
export const DEALER_RETRY_COUNT = 3;
export const DEALER_RETRY_TICKS = 60;
/** A refusal more than this many ticks after the previous one of the same dealer and code opens a new episode. */
const EPISODE_GAP_TICKS = 60;
/** An open duel whose rival offer has waited this many ticks without an answer of ours. */
export const DUEL_REPLY_TICKS = 3;
/** Duels count from 11:30 local time (hint 3); earlier ones (and practice sessions) are reported as low. */
export const DUEL_SCORING_FROM = "11:30";

export interface ConductInput {
  team: string;
  events: StreamEvent[];
  dealerEvents: DealerEvent[];
  duelSends: DuelSend[];
  duelMemory: Map<number, DuelMemory>;
  date: string;
  clock: number;
}

interface OurMessage {
  message: number;
  tick: number;
  dealer: string;
  thread: number;
  cash?: number;
  final: boolean;
}

const asNum = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const asStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const cashOf = (side: unknown): number => asNum((side as { cash?: unknown } | undefined)?.cash) ?? 0;

/** Our persona-thread messages, once each (the team and public streams carry the same message under two event ids). */
function ourMessages(input: ConductInput): OurMessage[] {
  const out = new Map<number, OurMessage>();
  for (const e of input.events) {
    if (e.type !== "thread.message") continue;
    const p = e.payload;
    const message = asNum(p.message);
    const thread = asNum(p.thread);
    const dealer = asStr(p.with);
    if (p.sender !== input.team || p.kind !== "persona" || message === undefined || thread === undefined || !dealer || out.has(message)) continue;
    const offer = p.offer as { give?: unknown; want?: unknown; final?: unknown } | undefined;
    // We pay cash when buying and ask for it when selling: the figure is whichever side carries it.
    const cash = offer ? cashOf(offer.give) || cashOf(offer.want) || undefined : undefined;
    out.set(message, { message, tick: e.tick, dealer, thread, ...(cash !== undefined ? { cash } : {}), final: offer?.final === true });
  }
  return [...out.values()].sort((a, b) => a.message - b.message);
}

/** Runs of ≥ 2 equal consecutive figures: [start index, length]. */
function equalRuns(xs: (number | undefined)[]): [number, number][] {
  const out: [number, number][] = [];
  let i = 0;
  while (i < xs.length) {
    let j = i + 1;
    while (j < xs.length && xs[i] !== undefined && xs[j] === xs[i]) j++;
    if (j - i >= 2) out.push([i, j - i]);
    i = j;
  }
  return out;
}

/**
 * `repeated-price`: we sent the same cash figure in ≥ 2 consecutive offers of ours in one dealer thread or duel (hint 5:
 * 20 → 20 → 20 earns no concession). Low for 2 in a row, medium for ≥ 3. A deliberate hold (`final`, the agent's rule)
 * is still flagged, with the rule in the evidence; a duel run held at our floor (limit ± minSurplus, from the duel header
 * line) is not: there was no room to move. Dealer threads come from the stream (decisions.jsonl `ourPrice` for
 * threads the stream lacks); duels from the `[sent]` counters (duels-state.json prices for duels without them).
 */
export function repeatedPrice(input: ConductInput): Alert[] {
  const out: Alert[] = [];
  const live = input.dealerEvents.filter((d) => !d.dryRun);
  const ruleAt = new Map(live.filter((d) => d.thread !== undefined && d.rule).map((d) => [`${d.thread}:${d.tick}`, d.rule!]));
  const push = (where: string, label: string, seq: { tick: number; price?: number; rule?: string; final?: boolean; floor?: number; role?: string }[], source: string, extra: Record<string, unknown> = {}): void => {
    for (const [i, n] of equalRuns(seq.map((s) => s.price))) {
      const run = seq.slice(i, i + n);
      const price = run[0]!.price!;
      // A duel held at our floor (limit ± minSurplus) had no room to move: holding there is not a missed concession.
      if (run.every((s) => s.floor !== undefined && (s.role === "seller" ? s.price! <= s.floor : s.price! >= s.floor))) continue;
      const rules = [...new Set(run.flatMap((s) => (s.rule ? [s.rule] : [])))];
      const final = run.some((s) => s.final);
      out.push(
        alert({
          tick: run.at(-1)!.tick,
          detector: "repeated-price",
          severity: n >= 3 ? "medium" : "low",
          refs: [],
          assets: [],
          summary: `${label}: we sent ${price} P ${n} times in a row (ticks ${run.map((s) => s.tick).join(", ")})${rules.length ? `, rule ${rules.join("/")}` : ""}${final ? ", marked final" : ""}: a repeated price is not a move.`,
          evidence: { ...extra, price, count: n, ticks: run.map((s) => s.tick), ...(rules.length ? { rules } : {}), ...(final ? { final } : {}), sequence: seq.map((s) => s.price ?? null), source },
          key: `repeated-price:${where}:${price}:${run[0]!.tick}`,
        }),
      );
    }
  };

  const byThread = new Map<number, OurMessage[]>();
  for (const m of ourMessages(input)) byThread.set(m.thread, [...(byThread.get(m.thread) ?? []), m]);
  for (const [thread, msgs] of byThread) {
    const seq = msgs.map((m) => ({ tick: m.tick, ...(m.cash !== undefined ? { price: m.cash } : {}), ...(ruleAt.has(`${thread}:${m.tick}`) ? { rule: ruleAt.get(`${thread}:${m.tick}`)! } : {}), final: m.final }));
    push(`thread:${thread}`, `Dealer ${msgs[0]!.dealer} thread ${thread}`, seq, "stream", { dealer: msgs[0]!.dealer, thread });
  }
  const fromDecisions = new Map<number, DealerEvent[]>();
  for (const d of live) {
    if (d.thread === undefined || d.ourPrice === undefined || d.action !== "counter" || byThread.has(d.thread)) continue;
    fromDecisions.set(d.thread, [...(fromDecisions.get(d.thread) ?? []), d]);
  }
  for (const [thread, ds] of fromDecisions) {
    push(`thread:${thread}`, `Dealer ${ds[0]!.dealer} thread ${thread}`, ds.map((d) => ({ tick: d.tick, price: d.ourPrice!, ...(d.rule ? { rule: d.rule } : {}) })), "decisions.jsonl", { dealer: ds[0]!.dealer, thread });
  }

  const byDuel = new Map<number, Map<number, DuelSend>>();
  for (const s of input.duelSends) {
    if (s.action !== "counter") continue;
    const ticks = byDuel.get(s.duel) ?? new Map<number, DuelSend>();
    ticks.set(s.tick, s); // one message per duel and tick
    byDuel.set(s.duel, ticks);
  }
  for (const [duel, ticks] of byDuel) {
    const floorOf = (s: DuelSend): number | undefined => (s.limit === undefined ? undefined : s.role === "seller" ? s.limit + DEFAULT_DUEL_PARAMS.minSurplus : s.limit - DEFAULT_DUEL_PARAMS.minSurplus);
    const seq = [...ticks.values()]
      .sort((a, b) => a.tick - b.tick)
      .map((s) => ({ tick: s.tick, ...(s.price !== undefined ? { price: s.price } : {}), ...(s.rule ? { rule: s.rule } : {}), ...(floorOf(s) !== undefined ? { floor: floorOf(s)!, role: s.role! } : {}) }));
    push(`duel:${duel}`, `Duel ${duel}`, seq, "play.log/plan.jsonl", { duel });
  }
  for (const [duel, mem] of input.duelMemory) {
    if (byDuel.has(duel)) continue;
    // No ticks in the duel memory: every offer is stamped with the tick of our last one.
    const tick = mem.lastOurTick ?? input.clock;
    const seq = mem.ourPrices.map((price) => ({ tick, price }));
    push(`duel:${duel}:state`, `Duel ${duel}`, seq, "duels-state.json", { duel });
  }
  return out;
}

/**
 * `duel-unanswered` (hint 3: a duel nobody answers scores 0 for both sides): a duel of ours that ended without a deal
 * while the rival's last offer was newer than ours (or we never sent one), or an open duel whose rival offer has waited
 * DUEL_REPLY_TICKS without an answer. A duel the rival left unanswered is not ours to fix and is not flagged. High when
 * it counts (from DUEL_SCORING_FROM local, not a practice session), low before.
 */
export function duelUnanswered(input: ConductInput): Alert[] {
  interface Duel { id: number; rival: number[]; ours: number[]; deadline?: number; session?: number; result?: { tick: number; status: string }; firstRecv?: string; rivalName?: string; role?: string }
  const duels = new Map<number, Duel>();
  const get = (id: number): Duel => duels.get(id) ?? (duels.set(id, { id, rival: [], ours: [] }).get(id) as Duel);
  const practice = new Set<number>();
  for (const e of [...input.events].sort((a, b) => a.id - b.id)) {
    const p = e.payload;
    if (e.type === "duels.finished" && /practice/i.test(asStr(p.name) ?? "")) practice.add(asNum(p.session) ?? -1);
    const id = asNum(p.duel);
    // duel.closed is public (every duel of the day); only the team-scoped duel events are ours.
    if (id === undefined || !e.scope.startsWith("team:") || !e.type.startsWith("duel.")) continue;
    const d = get(id);
    if (e.recv) d.firstRecv ??= e.recv;
    if (e.type === "duel.started") {
      if (asNum(p.deadline_tick) !== undefined) d.deadline = asNum(p.deadline_tick)!;
      if (asNum(p.session) !== undefined) d.session = asNum(p.session)!;
      if (asStr(p.role)) d.role = asStr(p.role)!;
    } else if (e.type === "duel.message") {
      d.rival.push(e.tick);
      if (asStr(p.from)) d.rivalName = asStr(p.from)!;
    } else if (e.type === "duel.result") d.result = { tick: e.tick, status: asStr(p.status) ?? "?" };
  }
  for (const s of input.duelSends) if (duels.has(s.duel)) get(s.duel).ours.push(s.tick);
  for (const [id, mem] of input.duelMemory) if (duels.has(id) && mem.lastOurTick !== undefined) get(id).ours.push(mem.lastOurTick);

  const scoringFrom = new Date(`${input.date}T${DUEL_SCORING_FROM}:00`).getTime();
  const out: Alert[] = [];
  for (const d of duels.values()) {
    const lastRival = d.rival.length ? Math.max(...d.rival) : undefined;
    const lastOur = d.ours.length ? Math.max(...d.ours) : undefined;
    const ended = d.result !== undefined || (d.deadline !== undefined && input.clock > d.deadline);
    const counts = (d.session === undefined || !practice.has(d.session)) && (d.firstRecv === undefined || Date.parse(d.firstRecv) >= scoringFrom);
    const who = `Duel ${d.id}${d.rivalName ? ` with ${d.rivalName}` : ""}${d.role ? ` (we ${d.role === "seller" ? "sell" : "buy"})` : ""}`;
    const evidence = { duel: d.id, rivalTicks: d.rival, ourTicks: [...new Set(d.ours)].sort((a, b) => a - b), ...(d.deadline !== undefined ? { deadline: d.deadline } : {}), ...(d.session !== undefined ? { session: d.session } : {}), ...(d.result ? { result: d.result } : {}), scored: counts };
    if (ended) {
      if (d.result?.status === "deal") continue;
      const silent = lastOur === undefined;
      if (!silent && (lastRival === undefined || lastRival <= lastOur!)) continue;
      out.push(
        alert({
          tick: d.result?.tick ?? d.deadline ?? input.clock,
          detector: "duel-unanswered",
          severity: counts ? "high" : "low",
          refs: [],
          assets: [],
          summary: `${who} ended without a deal: ${silent ? "we never sent an offer" : `the rival's last offer (tick ${lastRival}) was newer than ours (tick ${lastOur})`}${counts ? "" : " (before scoring / practice)"}.`,
          evidence,
          key: `duel-unanswered:${d.id}:ended`,
        }),
      );
    } else if (lastRival !== undefined && (lastOur === undefined || lastRival > lastOur) && input.clock - lastRival >= DUEL_REPLY_TICKS) {
      out.push(
        alert({
          tick: input.clock,
          detector: "duel-unanswered",
          severity: counts ? "medium" : "low",
          refs: [],
          assets: [],
          summary: `${who}: the rival's offer at tick ${lastRival} has waited ${input.clock - lastRival} ticks without an answer of ours${d.deadline !== undefined ? ` (deadline tick ${d.deadline})` : ""}.`,
          evidence,
          key: `duel-unanswered:${d.id}:waiting:${lastRival}`,
        }),
      );
    }
  }
  return out;
}

/**
 * `dealer-spam` (hint 5: flood a dealer and they stop talking to you for a while):
 * - burst: ≥ DEALER_BURST_COUNT of our opens + messages to one dealer inside DEALER_BURST_TICKS, above our designed
 *   cadence (one alert per episode);
 * - refused: a dealer error that means it stopped talking (persona_quota, cooloff, judge warning or strike), once per
 *   dealer, code and episode; from decisions.jsonl, plan.jsonl execution lines and the stream's thread.closed reason;
 * - retry: the same dealer + target failing with the same code ≥ DEALER_RETRY_COUNT times inside DEALER_RETRY_TICKS.
 * 429-like codes (NOT_A_FAILURE) never count.
 */
export function dealerSpam(input: ConductInput, planErrors: { tick: number; dealer: string; target: string; code: string; line: string }[]): Alert[] {
  const out: Alert[] = [];

  const acts = new Map<string, number[]>();
  for (const m of ourMessages(input)) acts.set(m.dealer, [...(acts.get(m.dealer) ?? []), m.tick]);
  const seenOpen = new Set<number>();
  for (const e of input.events) {
    const thread = asNum(e.payload.thread);
    if (e.type !== "thread.opened" || e.payload.team !== input.team || e.payload.kind !== "persona" || thread === undefined || seenOpen.has(thread)) continue;
    seenOpen.add(thread);
    const dealer = asStr(e.payload.with);
    if (dealer) acts.set(dealer, [...(acts.get(dealer) ?? []), e.tick]);
  }
  for (const [dealer, ticks] of acts) {
    ticks.sort((a, b) => a - b);
    // One alert per episode: windows over the threshold chained less than DEALER_BURST_TICKS apart.
    let episodeEnd = -Infinity;
    for (const t of ticks) {
      const inWindow = ticks.filter((x) => x > t - DEALER_BURST_TICKS && x <= t);
      if (inWindow.length < DEALER_BURST_COUNT) continue;
      const fresh = t > episodeEnd;
      episodeEnd = t + DEALER_BURST_TICKS;
      if (!fresh) continue;
      out.push(
        alert({
          tick: t,
          detector: "dealer-spam",
          severity: "medium",
          refs: [],
          assets: [],
          summary: `${inWindow.length} opens + messages to ${dealer} in ticks ${inWindow[0]}–${t} (≥ ${DEALER_BURST_COUNT} in ${DEALER_BURST_TICKS}): at this pace dealers stop talking.`,
          evidence: { kind: "burst", dealer, count: inWindow.length, from: inWindow[0], to: t, threshold: `${DEALER_BURST_COUNT}/${DEALER_BURST_TICKS} ticks` },
          key: `dealer-spam:burst:${dealer}:${t}`,
        }),
      );
    }
  }

  // Failures, once per tick + dealer + target + code across sources.
  const failures = new Map<string, { tick: number; dealer: string; target: string; code: string; source: string; line?: string }>();
  const addFailure = (f: { tick: number; dealer: string; target: string; code: string; source: string; line?: string }): void => {
    if (NOT_A_FAILURE.has(f.code)) return;
    const k = `${f.tick}:${f.dealer}:${f.target}:${f.code}`;
    if (!failures.has(k)) failures.set(k, f);
  };
  for (const d of input.dealerEvents) if (!d.dryRun && d.action === "error" && d.error) addFailure({ tick: d.tick, dealer: d.dealer, target: d.target ?? "?", code: d.error, source: "decisions.jsonl" });
  for (const f of planErrors) addFailure({ ...f, source: "plan.jsonl" });
  const threadDealer = new Map<number, string>();
  for (const e of input.events) if (e.type === "thread.opened" && asNum(e.payload.thread) !== undefined && asStr(e.payload.with)) threadDealer.set(asNum(e.payload.thread)!, asStr(e.payload.with)!);
  for (const e of input.events) {
    const reason = asStr(e.payload.reason);
    const thread = asNum(e.payload.thread);
    if (e.type !== "thread.closed" || !reason || !REFUSAL_RE.test(reason) || thread === undefined) continue;
    if (e.payload.team !== input.team && !e.scope.endsWith(`:${input.team}`)) continue;
    addFailure({ tick: e.tick, dealer: asStr(e.payload.with) ?? threadDealer.get(thread) ?? "?", target: `thread ${thread}`, code: reason, source: "stream" });
  }
  const list = [...failures.values()].sort((a, b) => a.tick - b.tick);

  const lastRefusal = new Map<string, number>();
  for (const f of list) {
    if (!REFUSAL_RE.test(f.code)) continue;
    const k = `${f.dealer}:${f.code}`;
    const prev = lastRefusal.get(k);
    lastRefusal.set(k, f.tick);
    if (prev !== undefined && f.tick - prev <= EPISODE_GAP_TICKS) continue;
    out.push(
      alert({
        tick: f.tick,
        detector: "dealer-spam",
        severity: f.code === "persona_quota" ? "low" : "medium",
        refs: [],
        assets: [],
        summary: `${f.dealer} refused us at tick ${f.tick} (${f.code}, ${f.target}): the dealer stopped talking to us for a while.`,
        evidence: { kind: "refused", dealer: f.dealer, code: f.code, target: f.target, source: f.source, ...(f.line ? { sample: f.line } : {}) },
        key: `dealer-spam:refused:${f.dealer}:${f.code}:${f.tick}`,
      }),
    );
  }

  const byTarget = new Map<string, typeof list>();
  for (const f of list) byTarget.set(`${f.dealer}|${f.target}|${f.code}`, [...(byTarget.get(`${f.dealer}|${f.target}|${f.code}`) ?? []), f]);
  for (const [k, fs] of byTarget) {
    let start = 0;
    while (start < fs.length) {
      const window = fs.filter((f, i) => i >= start && f.tick - fs[start]!.tick <= DEALER_RETRY_TICKS);
      if (window.length < DEALER_RETRY_COUNT) {
        start++;
        continue;
      }
      // The episode runs while failures keep coming less than DEALER_RETRY_TICKS apart.
      let end = start;
      while (end + 1 < fs.length && fs[end + 1]!.tick - fs[end]!.tick <= DEALER_RETRY_TICKS) end++;
      const ep = fs.slice(start, end + 1);
      const [dealer, target, code] = k.split("|") as [string, string, string];
      out.push(
        alert({
          tick: ep[DEALER_RETRY_COUNT - 1]!.tick,
          detector: "dealer-spam",
          severity: "medium",
          refs: /\b([A-Z]{3}-\d{2})\b/.test(target) ? [/\b([A-Z]{3}-\d{2})\b/.exec(target)![1]!] : [],
          assets: [],
          summary: `${dealer} ${target} failed with ${code} ${ep.length} times (ticks ${ep.map((f) => f.tick).join(", ")}): we keep knocking on a dealer that said no.`,
          evidence: { kind: "retry", dealer, target, code, ticks: ep.map((f) => f.tick), sources: [...new Set(ep.map((f) => f.source))] },
          key: `dealer-spam:retry:${dealer}:${target}:${code}:${ep[0]!.tick}`,
        }),
      );
      start = end + 1;
    }
  }
  return out;
}
