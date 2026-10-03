import type { Schedule } from "../duels/schemas.js";
import type { Clock, Me } from "../shared/schemas.js";
import { benchSlots, DEFAULT_MECHANISM_THRESHOLDS, ticksPerHourOf, type MechanismThresholds } from "./mechanism.js";
import { planVenue, VENUE_COST, type Mechanism, type VenueCheck, type VenueListing, type VenuePlan } from "./venue.js";

/**
 * Replace our venue with one of the other mechanism (`pnpm bazaar:venue --replace`). Pure: decides whether closing
 * the current venue and opening the new one is allowed now. The old bond only comes back after a cooldown, so the
 * new one is paid from cash (270 P) on top of the cash floor; never inside a bench or less than
 * `noSwitchWithinTicks` before one (a session with no open venue scores 0).
 */

/** Board description: any-copy matching is what the board leaders offer and the auto stall does not. */
export const BOARD_DESCRIPTION = "Zero fees. Any copy fills your card bid; our broker matches every tick.";
export const AUTO_DESCRIPTION = "Zero fees, every card welcome. Best bid and ask cross every tick.";

export interface CurrentVenue {
  id: string;
  mechanism?: string;
  status?: string;
}

export interface SwitchPlan {
  from: CurrentVenue | undefined;
  to: Mechanism;
  open: VenuePlan;
  ticksToBench: number | undefined;
  checks: VenueCheck[];
  /** Every blocking check green (switch checks and the opening plan). */
  ok: boolean;
}

type SwitchClock = Pick<Clock, "tick"> & { t_hours?: unknown; tick_seconds?: unknown };

const str = (x: unknown): string | undefined => (typeof x === "string" && x ? x : undefined);
const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);

/** Our venue from `/api/me` (`venue: {venue, status, rules: {mechanism}}`), if we run one. */
export function currentVenueOf(me: Me): CurrentVenue | undefined {
  const v = (me as { venue?: unknown }).venue;
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const id = str(o.venue) ?? str(o.id);
  if (!id) return undefined;
  const rules = o.rules && typeof o.rules === "object" ? (o.rules as Record<string, unknown>) : {};
  const mechanism = str(rules.mechanism);
  const status = str(o.status);
  return { id, ...(mechanism ? { mechanism } : {}), ...(status ? { status } : {}) };
}

/** Ticks to the next bench session, or 0 while one is running; undefined if the calendar has none ahead. */
export function ticksToNextBench(schedule: Pick<Schedule, "upcoming"> | undefined, clock: SwitchClock, t: Pick<MechanismThresholds, "benchTicks"> = DEFAULT_MECHANISM_THRESHOLDS): number | undefined {
  const now = num(clock.t_hours);
  if (now === undefined) return undefined;
  const tph = ticksPerHourOf(clock.tick, now, num(clock.tick_seconds));
  for (const b of benchSlots(schedule)) {
    const end = b.atHours + (b.ticks ?? t.benchTicks) / tph;
    if (now >= end) continue;
    return now >= b.atHours ? 0 : Math.floor((b.atHours - now) * tph);
  }
  return undefined;
}

export function planVenueSwitch(
  me: Me,
  venues: readonly VenueListing[],
  clock: SwitchClock,
  schedule: Pick<Schedule, "upcoming"> | undefined,
  o: { mechanism: Mechanism; name?: string; cashFloor?: number; thresholds?: MechanismThresholds },
): SwitchPlan {
  const t = o.thresholds ?? DEFAULT_MECHANISM_THRESHOLDS;
  const floor = o.cashFloor ?? t.cashFloor;
  const from = currentVenueOf(me);
  // The opening is planned as after the close: our venue no longer counts as "already running one".
  const meAfter = { ...me, venue: null } as Me;
  const others = venues.filter((v) => !from || v.venue !== from.id);
  const open = planVenue(meAfter, others, clock, {
    mechanism: o.mechanism,
    description: o.mechanism === "board" ? BOARD_DESCRIPTION : AUTO_DESCRIPTION,
    ...(o.name ? { name: o.name } : {}),
  });
  const ticksToBench = ticksToNextBench(schedule, clock, t);
  const checks: VenueCheck[] = [
    { name: "current venue", ok: !!from && (from.status ?? "open") === "open", detail: from ? `${from.id} (${from.mechanism ?? "?"}, ${from.status ?? "open"})` : "we run no venue: use plain --mechanism without --replace" },
    { name: "mechanism", ok: !!from && from.mechanism !== o.mechanism, detail: `${from?.mechanism ?? "?"} → ${o.mechanism}` },
    { name: "cash", ok: me.cash >= VENUE_COST + floor, detail: `cash ${me.cash} P (needs ≥ ${VENUE_COST + floor} = ${VENUE_COST} new venue + floor ${floor}; the old bond returns only after a cooldown)` },
    {
      name: "bench window",
      ok: ticksToBench === undefined || ticksToBench >= t.noSwitchWithinTicks,
      detail: ticksToBench === undefined ? "no bench ahead in /api/schedule" : ticksToBench === 0 ? "a bench is running now" : `${ticksToBench} ticks to the next bench (needs ≥ ${t.noSwitchWithinTicks})`,
    },
  ];
  const openChecks = open.checks.filter((c) => c.name !== "cash");
  return { from, to: o.mechanism, open, ticksToBench, checks: [...checks, ...openChecks], ok: checks.every((c) => c.ok) && openChecks.every((c) => c.info || c.ok) };
}

export function formatSwitchPlan(p: SwitchPlan, dryRun: boolean): string[] {
  const L = [`== VENUE SWITCH (${dryRun ? "dry-run, no POST" : "LIVE"}) ==`];
  L.push(`1. would POST /api/venues/${p.from?.id ?? "<venue>"}/close`);
  L.push(`2. would POST /api/venues ${JSON.stringify(p.open.body)}`);
  L.push(p.to === "board" ? "3. then the live broker must run: pnpm bazaar:broker --confirm (the coordinating session restarts it)" : "3. then the broker goes back to shadow: pnpm bazaar:broker --shadow");
  L.push("checks:");
  for (const c of p.checks) L.push(`  [${c.ok ? "ok" : c.info ? "info" : "FAIL"}] ${c.name}: ${c.detail}`);
  L.push(p.ok ? "verdict: allowed; would switch when run live with --confirm" : "verdict: NOT allowed now; it would refuse");
  return L;
}
