import type { NegotiatorParams } from "./negotiator.js";
import type { DealerInfo, Me } from "./schemas.js";

/**
 * Perfil de negociación por dealer a partir de sus rasgos públicos (`/api/dealers`): paciencia en mensajes
 * nuestros, anclas y aguantes. Abuela (paciencia 0,85) queda en 6 mensajes, lo medido en los hilos 56 y 125;
 * El Chato (0,35, estricto y con memoria) en 3, con ancla moderada y sin aguantes largos.
 */

export interface DealerTraits {
  patience?: number;
  generosity?: number;
  shrewdness?: number;
  memory?: number;
  strictness?: number;
}

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);

export function traitsOf(info: unknown): DealerTraits {
  const t = (info as { traits?: Record<string, unknown> } | undefined)?.traits;
  if (!t || typeof t !== "object") return {};
  const out: DealerTraits = {};
  for (const k of ["patience", "generosity", "shrewdness", "memory", "strictness"] as const) {
    const v = num(t[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Paciencia en mensajes nuestros: ⌊1 + 6 × patience⌉ entre 2 y 8 (0,85 → 6; 0,35 → 3). */
export function patienceBudgetFor(traits: DealerTraits): number | undefined {
  if (traits.patience === undefined) return undefined;
  return Math.min(8, Math.max(2, Math.round(1 + 6 * traits.patience)));
}

/** Dealer impaciente o estricto: ancla moderada (cerca de su precio), sin aguantes largos ni trucos. */
export function isShortFuse(traits: DealerTraits): boolean {
  return (traits.patience !== undefined && traits.patience < 0.5) || (traits.strictness ?? 0) >= 0.7;
}

export function negotiatorForDealer(traits: DealerTraits): Partial<NegotiatorParams> {
  const budget = patienceBudgetFor(traits);
  const out: Partial<NegotiatorParams> = budget !== undefined ? { patienceBudget: budget } : {};
  if (isShortFuse(traits)) Object.assign(out, { buyAnchorFrac: 0.85, sellAnchorMult: 1.5, sellFloorAnchorMult: 1.15, maxHolds: 1 });
  return out;
}

/** Tratos por equipo y hora que admite el dealer (`menu.deals_per_team_per_hour`). */
export function dealsPerHourOf(info: DealerInfo | undefined): number | undefined {
  return num(info?.menu.deals_per_team_per_hour ?? undefined);
}

/** Dealers con los que podemos tratar: `me.unlocked` (o `unlocked_dealers`); si no viene, los abiertos a todos. */
export function unlockedDealerIds(me: Me, dealers: readonly { id: string; open_to_all?: unknown; enabled?: unknown }[]): string[] {
  const listed = [...(me.unlocked ?? []), ...(me.unlocked_dealers ?? [])];
  const known = new Set(dealers.map((d) => d.id));
  if (listed.length) return [...new Set(listed)].filter((id) => !known.size || known.has(id));
  return dealers.filter((d) => d.open_to_all === true && d.enabled !== false).map((d) => d.id);
}

/** Horas de juego del reloj (`t_hours`; si no viene, tick ÷ ticks por hora). */
export function gameHours(clock: { tick: number; tick_seconds?: number | undefined; t_hours?: unknown }): number {
  const t = num(clock.t_hours);
  if (t !== undefined) return t;
  return clock.tick / Math.max(1, Math.round(3600 / (clock.tick_seconds ?? 60)));
}
