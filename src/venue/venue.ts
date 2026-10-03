import type { Clock, Me } from "../shared/schemas.js";

/**
 * Prepare our market (venue). Pure: decides name, fees, mechanism and checks requirements.
 * RULES.md: from level 2; refundable bond of 250 P plus 20 P; fee ≤ 10 % and ≤ 5 P per card;
 * name ≤ 40 characters; team markets start operating at +3 h.
 */

export const VENUE_BOND = 250;
export const VENUE_OPENING_FEE = 20;
export const VENUE_COST = VENUE_BOND + VENUE_OPENING_FEE;
export const VENUE_MIN_LEVEL = 2;
export const VENUE_NAME_MAX = 40;
export const VENUE_TRADING_FROM_HOURS = 3;
export const DEFAULT_VENUE_NAME = "Team 2 · El Rastro Express";

export type Mechanism = "auto" | "board";

export interface VenueBody {
  name: string;
  fee_bps: number;
  fee_per_card: number;
  rules: { mechanism: Mechanism };
  description: string;
}

export interface VenueCheck {
  name: string;
  ok: boolean;
  detail: string;
  /** Informational: does not block opening. */
  info?: boolean;
}

export interface VenuePlan {
  body: VenueBody;
  cost: number;
  checks: VenueCheck[];
  /** All blocking checks green. */
  ok: boolean;
  why: string[];
}

export interface VenueListing {
  venue?: string | null | undefined;
  name?: string | null | undefined;
  owner?: string | null | undefined;
}

const MECHANISM_WHY: Record<Mechanism, string> = {
  auto: "mechanism auto: the engine crosses our best bid and ask every tick, so the Market Test is matched without a broker (half the bench points, same as the free stall); a board venue only matches what a broker matches, and we do not run one yet",
  board: "mechanism board: only our broker matches (GET /api/broker/book, POST /api/broker/matches); can beat the auto stall in the Market Test, but scores 0 if no broker runs",
};

export function planVenue(me: Me, venues: readonly VenueListing[], clock: Pick<Clock, "tick"> & { t_hours?: unknown }, o: { name?: string; mechanism?: Mechanism } = {}): VenuePlan {
  const name = o.name ?? DEFAULT_VENUE_NAME;
  const mechanism = o.mechanism ?? "auto";
  const body: VenueBody = {
    name,
    fee_bps: 0,
    fee_per_card: 0,
    rules: { mechanism },
    description: "Zero fees, every card welcome. Best bid and ask cross every tick.",
  };
  const level = me.level ?? 0;
  const ours = (me as { venue?: unknown }).venue ?? venues.find((v) => v.owner && v.owner === me.id)?.venue ?? null;
  const hours = typeof clock.t_hours === "number" ? clock.t_hours : undefined;
  const checks: VenueCheck[] = [
    { name: "level", ok: level >= VENUE_MIN_LEVEL, detail: `level ${level} (needs ≥ ${VENUE_MIN_LEVEL})` },
    { name: "cash", ok: me.cash >= VENUE_COST, detail: `cash ${me.cash} P (needs ≥ ${VENUE_COST} = ${VENUE_BOND} bond + ${VENUE_OPENING_FEE} fee)` },
    { name: "name", ok: name.length > 0 && name.length <= VENUE_NAME_MAX, detail: `"${name}" is ${name.length} chars (max ${VENUE_NAME_MAX})` },
    { name: "no venue yet", ok: !ours, detail: ours ? `we already run venue ${String(ours)}` : "we run no venue" },
    {
      name: "trading start",
      ok: hours === undefined || hours >= VENUE_TRADING_FROM_HOURS,
      detail: hours === undefined ? "clock without t_hours" : `t = ${hours.toFixed(2)} h; team venues trade from +${VENUE_TRADING_FROM_HOURS} h (opening earlier only parks the bond)`,
      info: true,
    },
  ];
  const why = [
    "fee_bps 0 and fee_per_card 0: fees never count in the score, and low fees attract the flow that does (value created between other teams on our venue)",
    MECHANISM_WHY[mechanism],
    "opening replaces the free starter stall; a refused opening costs nothing; the bond comes back after closing (after a cooldown)",
  ];
  return { body, cost: VENUE_COST, checks, ok: checks.every((c) => c.info || c.ok), why };
}

export function formatVenuePlan(plan: VenuePlan, dryRun: boolean): string[] {
  const L = [`== VENUE PLAN (${dryRun ? "dry-run, no POST" : "LIVE"}) ==`];
  L.push(`would POST /api/venues ${JSON.stringify(plan.body)}`);
  L.push(`cost: ${plan.cost} P (${VENUE_BOND} refundable bond + ${VENUE_OPENING_FEE} fee)`);
  L.push("checks:");
  for (const c of plan.checks) L.push(`  [${c.ok ? "ok" : c.info ? "info" : "FAIL"}] ${c.name}: ${c.detail}`);
  L.push("why:");
  for (const w of plan.why) L.push(`  - ${w}`);
  L.push(plan.ok ? "verdict: requirements met; would open when run live with --confirm" : "verdict: NOT eligible yet; it would refuse to open (needs level ≥ 2 and cash ≥ 270)");
  return L;
}
