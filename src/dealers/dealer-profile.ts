import type { NegotiatorParams } from "./negotiation/negotiator.js";
import type { DealerInfo, Me } from "../shared/schemas.js";

/**
 * Per-dealer negotiation profile from its public traits (`/api/dealers`): patience in our messages,
 * anchors and holds. Abuela (patience 0.85) gets 6 messages, as measured in threads 56 and 125;
 * El Chato (0.35, strict and with memory) gets 3, with a moderate anchor and no long holds.
 */

export interface DealerTraits {
  patience?: number;
  generosity?: number;
  shrewdness?: number;
  memory?: number;
  strictness?: number;
  /** Nivel de la persona (1 Friendly … 5 Banker), de `/api/dealers`. */
  level?: number;
}

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);

export function traitsOf(info: unknown): DealerTraits {
  const t = (info as { traits?: Record<string, unknown> } | undefined)?.traits ?? {};
  if (typeof t !== "object") return {};
  const out: DealerTraits = {};
  for (const k of ["patience", "generosity", "shrewdness", "memory", "strictness"] as const) {
    const v = num(t[k]);
    if (v !== undefined) out[k] = v;
  }
  const level = num((info as { level?: unknown } | undefined)?.level);
  if (level !== undefined) out.level = level;
  return out;
}

/**
 * Niveles 3–5: the `patience` trait is just a prompt phrase; its walk-away is decided by walk_after_rounds ± jitter
 * (site-map § 8.5, personas.md § 10). Its patience is unknown and is measured (`PatienceLog`), not derived from the trait.
 */
export const PATIENCE_FROM_TRAIT_MAX_LEVEL = 2;

/** Paciencia en mensajes nuestros: ⌊1 + 6 × patience⌉ entre 2 y 8 (0,85 → 6; 0,35 → 3). Desconocida (undefined) en niveles 3–5. */
export function patienceBudgetFor(traits: DealerTraits): number | undefined {
  if (traits.patience === undefined || (traits.level ?? 0) > PATIENCE_FROM_TRAIT_MAX_LEVEL) return undefined;
  return Math.min(8, Math.max(2, Math.round(1 + 6 * traits.patience)));
}

/** Impatient or strict dealer: moderate anchor (close to its price), no long holds or tricks. */
export function isShortFuse(traits: DealerTraits): boolean {
  return (patienceBudgetFor(traits) !== undefined && traits.patience! < 0.5) || (traits.strictness ?? 0) >= 0.7;
}

/**
 * Per-dealer adjustments that do not come from its traits (MEASURED, public feed: 16 deals, 44 threads, 9 teams).
 * El Chato, selling to us: opens at 13 (0.5× list 26) and stays 3–5 messages, then yields ~1 P per message
 * (13→14→15→16, best bid seen 16); final mark between messages 5 and 9 (mean ≈ 8), never seen at 17.
 * Hence: `patienceBudget` 8 (not 3: the traits alone underestimate its real patience), `maxStep` 1 (steps of
 * 1 P, never a 3 P drop like thread 257) and `maxHolds` 0 (repeating a price makes it more impatient, seen
 * in the simulator). `sellAnchorMult` 1.7 ≈ anchor 22 over its opening of 13, the top of the measured
 * ladder ("starts around 22, drops 1 per message"). `buyAnchorFrac`/`sellFloorAnchorMult` stay as in the
 * generic strict-dealer profile: there is no better data for buying from it or for when its bid falls
 * below our minimum.
 */
export const DEALER_OVERRIDES: Record<string, Partial<NegotiatorParams>> = {
  chato: { patienceBudget: 8, maxStep: 1, maxHolds: 0, sellAnchorMult: 1.7 },
};

/**
 * Dealers with which the team has already had its first conversation: `welcome_first_deal` (its opening = its limit in
 * each team's first conversation, site-map § 8.2) no longer applies to them.
 */
export const WELCOME_FIRST_DEAL_PAST: ReadonlySet<string> = new Set(["abuela", "chato"]);

export function negotiatorForDealer(traits: DealerTraits, dealerId?: string): Partial<NegotiatorParams> {
  const budget = patienceBudgetFor(traits);
  const out: Partial<NegotiatorParams> = budget !== undefined ? { patienceBudget: budget } : {};
  if (isShortFuse(traits)) Object.assign(out, { buyAnchorFrac: 0.85, sellAnchorMult: 1.5, sellFloorAnchorMult: 1.15, maxHolds: 1 });
  if (dealerId && DEALER_OVERRIDES[dealerId]) Object.assign(out, DEALER_OVERRIDES[dealerId]);
  return out;
}

/** Deals per team per hour the dealer allows (`menu.deals_per_team_per_hour`). */
export function dealsPerHourOf(info: DealerInfo | undefined): number | undefined {
  return num(info?.menu.deals_per_team_per_hour ?? undefined);
}

/** Dealers we can deal with: `me.unlocked` (or `unlocked_dealers`); if absent, those open to everyone. */
export function unlockedDealerIds(me: Me, dealers: readonly { id: string; open_to_all?: unknown; enabled?: unknown }[]): string[] {
  const listed = [...(me.unlocked ?? []), ...(me.unlocked_dealers ?? [])];
  const known = new Set(dealers.map((d) => d.id));
  if (listed.length) return [...new Set(listed)].filter((id) => !known.size || known.has(id));
  return dealers.filter((d) => d.open_to_all === true && d.enabled !== false).map((d) => d.id);
}

/** Game hours on the clock (`t_hours`; if absent, tick ÷ ticks per hour). */
export function gameHours(clock: { tick: number; tick_seconds?: number | undefined; t_hours?: unknown }): number {
  const t = num(clock.t_hours);
  if (t !== undefined) return t;
  return clock.tick / Math.max(1, Math.round(3600 / (clock.tick_seconds ?? 60)));
}
