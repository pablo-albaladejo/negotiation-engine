import { BazaarAgent, type BazaarApi } from "./agent.js";
import type { BazaarClient } from "../shared/client.js";
import { dealsPerHourOf, negotiatorForDealer, traitsOf, unlockedDealerIds } from "./dealer-profile.js";
import { appendLesson, PendingLessons } from "./history/lessons.js";
import type { NegotiatorParams } from "./negotiation/negotiator.js";
import type { Clock, DealerInfo, Me } from "../shared/schemas.js";
import { formatScoreSummary, type ScoreTracker } from "../shared/score.js";
import { Backoff, classifyThrown, clockGate, dealerState, statusLine, worstError } from "./serious.js";
import { TeamBudget } from "./team.js";
import type { TraceRecord, TraceSink } from "../shared/trace.js";

/**
 * Continuous loop of serious mode: all value-creating deals with the unlocked dealers (no `--only`),
 * shared limits (`TeamBudget`: hourly and total spending, cash floor = market + reserve), waits while the
 * clock is paused or outside hours, retries transient errors with growing backoff and stops on an
 * unknown one. One status line per tick; one summary per conversation (and its entry in lessons.json).
 */

export type SeriousApi = BazaarApi & Pick<BazaarClient, "clock" | "dealers" | "dealer">;

export interface SeriousOptions {
  dryRun: boolean;
  once: boolean;
  maxSpendPerHour: number;
  maxSpendTotal: number;
  cashFloor: number;
  safety: number;
  /** Base negotiator parameters (flags); each dealer's profile adjusts them (patience, anchors, holds). */
  negotiator: Partial<NegotiatorParams>;
  trace: TraceSink;
  scoreTracker?: ScoreTracker;
  /** Lessons file (`docs/bazaar/lessons.json`); only written live. */
  lessonsFile?: string;
  /** Re-read which dealers are unlocked every N ticks (El Chato opens mid-game). */
  refreshDealersEvery?: number;
  log: (line: string) => void;
  sleep: (ms: number) => Promise<void>;
  now?: () => number;
  shouldStop?: () => boolean;
}

export interface SeriousResult {
  ticks: number;
  stoppedBy: "once" | "signal" | "unknown-error";
  error?: string;
  deals: number;
  spent: number;
}

interface DealerSlot {
  id: string;
  agent: BazaarAgent;
  state: string;
}

export async function runSerious(api: SeriousApi, o: SeriousOptions): Promise<SeriousResult> {
  const now = o.now ?? Date.now;
  const team = new TeamBudget({ maxSpendPerHour: o.maxSpendPerHour, maxSpendTotal: o.maxSpendTotal, cashFloor: o.cashFloor, now });
  const pending = new PendingLessons((entry) => {
    if (!o.lessonsFile) return;
    try {
      if (appendLesson(o.lessonsFile, entry)) o.log(`  lessons: thread ${entry.thread} appended (${entry.lessons.length} lesson(s))`);
    } catch (e) {
      o.log(`  lessons: could not append thread ${entry.thread}: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
  const slots = new Map<string, DealerSlot>();
  const locked = new Set<string>();
  const backoff = new Backoff();
  let lastRank: number | undefined;
  let ticks = 0;
  let lastRefresh = -Infinity;
  let lastTick = -1;

  const addDealers = async (tick: number) => {
    const [list, me] = await Promise.all([api.dealers(), api.me()]);
    const all = list.dealers as (typeof list.dealers[number] & { open_to_all?: unknown; enabled?: unknown })[];
    const open = unlockedDealerIds(me, all);
    locked.clear();
    for (const d of all) if (!open.includes(d.id)) locked.add(d.id);
    for (const id of open) {
      const existing = slots.get(id);
      if (existing) {
        // The menu rules (what it buys and sells): re-read on every refresh.
        const fresh = await api.dealer(id).catch(() => undefined);
        if (fresh) existing.agent.setMenu(fresh);
        continue;
      }
      const menu: DealerInfo | undefined = await api.dealer(id).catch(() => undefined);
      const summary = all.find((d) => d.id === id);
      const profile = negotiatorForDealer(traitsOf(menu ?? summary), id);
      const dealsPerHour = dealsPerHourOf(menu);
      const agent = new BazaarAgent(api, {
        dealer: { id, aliases: [...(summary?.name ? [summary.name] : []), ...(menu?.name ? [menu.name] : []), "persona", "dealer"] },
        dryRun: o.dryRun,
        maxSpendPerHour: o.maxSpendPerHour,
        requireMenu: true,
        team,
        safety: o.safety,
        negotiator: { ...o.negotiator, ...profile },
        ...(menu ? { menu } : {}),
        ...(dealsPerHour !== undefined ? { dealsPerHour } : {}),
        trace: o.trace,
        now,
        log: o.log,
        onThreadSummary: (s) => {
          if (!o.dryRun) pending.add(s);
        },
      });
      slots.set(id, { id, agent, state: "new" });
      o.log(`dealer ${id}${menu?.name ? ` (${menu.name})` : ""}: unlocked · quota ${dealsPerHour ?? "?"} deals/hour · negotiator ${JSON.stringify(profile)}${menu ? "" : " · no menu: nothing opened until it can be read"}`);
      if (o.dryRun) for (const line of await agent.plan()) o.log(line);
    }
    lastRefresh = tick;
  };

  const finish = (stoppedBy: SeriousResult["stoppedBy"], error?: string): SeriousResult => {
    pending.flush();
    const stats = [...slots.values()].map((s) => s.agent.runStats());
    const res: SeriousResult = { ticks, stoppedBy, ...(error ? { error } : {}), deals: stats.reduce((n, s) => n + s.deals, 0), spent: team.spentTotal() };
    o.log(`serious mode stopped (${stoppedBy}${error ? `: ${error}` : ""}) after ${res.ticks} tick(s): ${res.deals} deal(s), ${res.spent} P spent`);
    return res;
  };

  for (;;) {
    if (o.shouldStop?.()) return finish("signal");
    let clock: Clock;
    try {
      clock = await api.clock();
      if (!slots.size || clock.tick - lastRefresh >= (o.refreshDealersEvery ?? 10)) await addDealers(clock.tick);
    } catch (e) {
      const { cls, code } = classifyThrown(e);
      if (cls === "unknown") return finish("unknown-error", `${code}: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
      const wait = backoff.next();
      o.log(`transient error (${code}); retry in ${Math.round(wait / 1000)} s`);
      if (o.once) return finish("once");
      await o.sleep(wait);
      continue;
    }
    const gate = clockGate(clock, now());
    if (!gate.run && !o.dryRun) {
      o.log(`${statusLine({ clock, cashFloor: o.cashFloor, spentHour: team.spentThisHour(), maxSpendHour: o.maxSpendPerHour, spentTotal: team.spentTotal(), maxSpendTotal: o.maxSpendTotal, dealers: [] })} · waiting (${gate.reason}) ${Math.round(gate.waitMs / 1000)} s`);
      if (o.once) return finish("once");
      await o.sleep(gate.waitMs);
      continue;
    }
    if (clock.tick === lastTick && !o.once) {
      await o.sleep(Math.max(200, (clock.next_tick_in ?? 1) * 1000 + 300));
      continue;
    }
    lastTick = clock.tick;
    ticks += 1;
    const maxOpen = typeof clock.limits?.max_open_threads_per_team === "number" ? clock.limits.max_open_threads_per_team : Infinity;
    const records: TraceRecord[] = [];
    for (const slot of slots.values()) {
      const busy = [...slots.values()].filter((s) => s.agent.busy()).length;
      if (!slot.agent.busy() && busy >= maxOpen) {
        slot.state = "waiting max_open_threads";
        continue;
      }
      const recs = await slot.agent.step(clock);
      slot.state = dealerState(recs);
      records.push(...recs);
    }
    const me: Me | undefined = await api.me().catch(() => undefined);
    const score = (me?.score ?? undefined) as { deals?: unknown; neg_points?: unknown; rank?: unknown } | undefined;
    if (me && !o.dryRun) pending.observe(score, clock.tick);
    o.log(
      statusLine({
        clock,
        ...(me ? { cash: me.cash } : {}),
        cashFloor: o.cashFloor,
        spentHour: team.spentThisHour(),
        maxSpendHour: o.maxSpendPerHour,
        spentTotal: team.spentTotal(),
        maxSpendTotal: o.maxSpendTotal,
        dealers: [...[...slots.values()].map((s) => ({ id: s.id, state: s.state })), ...[...locked].map((id) => ({ id, state: "locked" }))],
        ...(typeof score?.deals === "number" ? { deals: score.deals } : {}),
        ...(typeof score?.neg_points === "number" ? { negPoints: score.neg_points } : {}),
        ...(typeof score?.rank === "number" ? { rank: score.rank } : {}),
      }),
    );
    if (me && o.scoreTracker) {
      const snap = o.scoreTracker.record(me, clock.tick, records);
      if (snap && lastRank !== undefined && snap.rank !== lastRank) o.log(formatScoreSummary(snap, lastRank));
      if (snap) lastRank = snap.rank;
    }
    const worst = worstError(records);
    if (worst?.cls === "unknown") return finish("unknown-error", worst.code);
    if (o.once) return finish("once");
    if (worst?.cls === "transient") {
      const wait = backoff.next();
      o.log(`transient error (${worst.code}); retry in ${Math.round(wait / 1000)} s`);
      await o.sleep(wait);
      continue;
    }
    backoff.reset();
    const after = await api.clock().catch(() => undefined);
    await o.sleep(after && after.tick === clock.tick ? Math.max(200, (after.next_tick_in ?? 1) * 1000 + 300) : 200);
  }
}
