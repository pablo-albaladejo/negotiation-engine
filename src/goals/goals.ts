/**
 * Team goals (WHAT) and the strategy registry, refreshed every tick. Pure: no I/O.
 *
 * The goals session writes the hand-tuned fields (weight, priority, target, why, do_not, guardrails) and the
 * strategies; `refreshGoals` only recomputes the measured ones (now, day_start, delta_tick, status rules, linked
 * strategies) and `refreshGaps` the automatic gaps. Neither file ever carries a price, a limit or an offer id.
 */

export type GoalStatus = "open" | "saturated" | "behind" | "blocked" | "done" | "no-data";
export type StrategyStatus = "proposed" | "approved" | "live" | "paused" | "retired";

export interface Goal {
  id: string;
  goal: string;
  block: "negotiating" | "market" | "instrumental";
  weight: number;
  priority: number;
  metric: string;
  now: number | null;
  day_start: number | null;
  delta_tick: number;
  status: GoalStatus;
  target: string;
  why: string;
  until_tick: number | null;
  guardrails: string[];
  do_not: string[];
  strategies: string[];
}

export interface GoalsFile {
  version: 1;
  tick: number;
  updated_at: string;
  day: string;
  goals: Goal[];
  changes: string[];
}

export interface Strategy {
  id: string;
  owner: string;
  goal: string;
  summary: string;
  status: StrategyStatus;
  commit: string;
  flag: string;
  approved_by_pablo: boolean;
  since: string;
  evidence: string;
  conflicts: string[];
}

export interface StrategiesFile {
  version: 1;
  updated_at: string;
  strategies: Strategy[];
  gaps: string[];
  conflicts: string[];
}

/** Metric values of one tick: `/api/me` score fields plus derived ones (`cash`). */
export type Metrics = Readonly<Record<string, number | null | undefined>>;

export interface TickInput {
  tick: number;
  at: string;
  metrics: Metrics;
  /** Metrics of the previous refresh, if any. */
  prev: Metrics | null;
  /** Metrics at the first tick of the current round (null until it is known). */
  dayStart: Metrics | null;
}

/** Prefix of gaps written by `refreshGaps`; hand-written gaps never start with it and are kept. */
export const AUTO_GAP = "auto: ";
/** Prefix of tick changes written by `refreshGoals`; they last one tick, hand-written changes stay. */
export const AUTO_CHANGE = "auto: ";
/** Goals at or above this priority with weight > 0 need a live strategy, otherwise they are a gap. */
export const GAP_PRIORITY = 5;

const round = (x: number): number => Math.round(x * 1000) / 1000;

/**
 * A new round has started when the deal counter of the round goes down: `/api/me` score parts are per round and
 * `deals` only grows within one (a loss can lower neg_points, so that field cannot tell).
 */
export function isRoundReset(prev: Metrics | null, curr: Metrics): boolean {
  const a = prev?.deals;
  const b = curr.deals;
  return typeof a === "number" && typeof b === "number" && b < a;
}

/** Status rules that are measurable; otherwise the hand-set status stays. */
export function ruleStatus(goal: Goal, now: number | null): GoalStatus {
  if (goal.metric !== "derived" && now === null) return "no-data";
  if (goal.status === "no-data" && now !== null) return "open";
  if (goal.id === "organic") return now === 0 ? "behind" : goal.status === "behind" ? "open" : goal.status;
  return goal.status;
}

/** Recomputes the measured fields of every goal; hand-tuned fields are copied as they are. */
export function refreshGoals(prev: GoalsFile, strategies: StrategiesFile, input: TickInput): GoalsFile {
  const changes: string[] = [];
  const goals = prev.goals.map((g): Goal => {
    const v = g.metric === "derived" ? g.now : input.metrics[g.metric];
    const now = typeof v === "number" ? round(v) : null;
    const before = input.prev?.[g.metric];
    const start = input.dayStart?.[g.metric];
    const linked = strategies.strategies.filter((s) => s.goal === g.id);
    const status = ruleStatus(g, now);
    const deltaTick = now !== null && typeof before === "number" ? round(now - before) : 0;
    if (deltaTick !== 0) changes.push(`${AUTO_CHANGE}${g.id}: ${g.metric} ${deltaTick > 0 ? "+" : ""}${deltaTick} this tick`);
    if (status !== g.status) changes.push(`${AUTO_CHANGE}${g.id}: status ${g.status} → ${status}`);
    return {
      ...g,
      now,
      day_start: typeof start === "number" ? round(start) : g.day_start,
      delta_tick: deltaTick,
      status,
      strategies: linked.map((s) => s.id),
    };
  });
  const manual = prev.changes.filter((c) => !c.startsWith(AUTO_CHANGE));
  return { ...prev, tick: input.tick, updated_at: input.at, goals, changes: [...changes, ...manual] };
}

/** Automatic gaps: high-priority scoring goals without a live strategy. Hand-written gaps are kept. */
export function refreshGaps(strategies: StrategiesFile, goals: GoalsFile): string[] {
  const manual = strategies.gaps.filter((g) => !g.startsWith(AUTO_GAP));
  const auto = goals.goals
    .filter((g) => g.weight > 0 && g.priority <= GAP_PRIORITY && g.status !== "done")
    .filter((g) => !strategies.strategies.some((s) => s.goal === g.id && s.status === "live"))
    .map((g) => `${AUTO_GAP}${g.id} (priority ${g.priority}) has no live strategy`);
  return [...auto, ...manual];
}
