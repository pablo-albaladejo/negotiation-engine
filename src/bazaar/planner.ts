import type { Topic } from "./client.js";
import type { Side } from "./negotiator.js";
import type { Catalog, Me } from "./schemas.js";

/**
 * Qué negociar con el dealer: vender repetidas (reserva = nuestro your_value de esa copia) y comprar
 * cartas que faltan para completar páginas (reserva = your_value × seguridad, recortada por el
 * presupuesto de la hora y la caja). Sin red: los valores privados llegan por `valueOf`.
 */

export interface Target {
  key: string;
  side: Side;
  topic: Topic;
  /** Reserva privada (compra: máximo; venta: mínimo). Solo para el motor y la traza local. */
  reservation: number;
  label: string;
}

const PAGE_RARITIES = new Set(["common", "uncommon", "rare"]);
const RARITY_BY_RUN: Record<number, string> = { 300: "common", 90: "uncommon", 30: "rare", 9: "epic", 3: "legendary" };

export function rarityOf(card: { rarity?: string | null | undefined; print_run?: number | null | undefined }): string | undefined {
  if (card.rarity) return card.rarity.toLowerCase();
  return card.print_run ? RARITY_BY_RUN[card.print_run] : undefined;
}

/** Repetidas: por carta, se queda la copia que más valemos; el resto se ofrece. */
export function spareTargets(me: Me): Target[] {
  const byRef = new Map<string, Me["assets"]>();
  for (const a of me.assets) {
    if (a.kind !== "card" || a.locked) continue;
    byRef.set(a.ref, [...(byRef.get(a.ref) ?? []), a]);
  }
  const out: Target[] = [];
  for (const [ref, copies] of byRef) {
    if (copies.length < 2) continue;
    const sorted = [...copies].sort((x, y) => (y.your_value ?? 0) - (x.your_value ?? 0));
    for (const spare of sorted.slice(1)) {
      if (typeof spare.your_value !== "number") continue;
      out.push({
        key: `sell:${spare.id}`,
        side: "sell",
        topic: { sell: { assets: [spare.id] } },
        reservation: Math.max(1, Math.ceil(spare.your_value)),
        label: `sell spare ${ref}`,
      });
    }
  }
  return out.sort((a, b) => b.reservation - a.reservation);
}

export interface MissingCard {
  id: string;
  set: string;
  book: number | undefined;
}

/** Cartas de página (comunes, infrecuentes, raras) que no tenemos; primero los sets a los que les faltan menos. */
export function missingPageCards(me: Me, catalog: Catalog): MissingCard[] {
  const held = new Set(me.assets.filter((a) => a.kind === "card").map((a) => a.ref));
  const perSet: MissingCard[][] = [];
  for (const set of catalog.sets) {
    const missing = set.cards
      .filter((c) => PAGE_RARITIES.has(rarityOf(c) ?? "") && !held.has(c.id))
      .map((c) => ({ id: c.id, set: set.id ?? c.id.split("-")[0] ?? "", book: c.book ?? undefined }));
    if (missing.length) perSet.push(missing);
  }
  return perSet.sort((a, b) => a.length - b.length).flat();
}

export interface BuyPlanOptions {
  /** Lo que queda del presupuesto de la hora. */
  budget: number;
  cash: number;
  /** Fracción del your_value que estamos dispuestos a pagar (conservador). */
  safety: number;
  maxLookups: number;
}

export async function buyTargets(missing: readonly MissingCard[], valueOf: (card: string) => Promise<number>, o: BuyPlanOptions): Promise<Target[]> {
  const cap = Math.floor(Math.min(o.budget, o.cash));
  if (cap < 1) return [];
  const out: (Target & { surplus: number })[] = [];
  for (const card of missing.slice(0, o.maxLookups)) {
    const value = await valueOf(card.id);
    const reservation = Math.min(cap, Math.floor(value * o.safety));
    if (reservation < 1) continue;
    // Si su precio de libro supera mucho lo que valemos la carta, no hay zona de acuerdo probable.
    if (card.book !== undefined && reservation < card.book * 0.6) continue;
    out.push({
      key: `buy:${card.id}`,
      side: "buy",
      topic: { buy: { card: card.id } },
      reservation,
      label: `buy missing ${card.id}`,
      surplus: value - (card.book ?? 0),
    });
  }
  return out.sort((a, b) => b.surplus - a.surplus).map(({ surplus: _s, ...t }) => t);
}

/**
 * Alternativa si el dealer no vende cartas concretas: `{buy: {rarity, set}}`. Puede tocarnos
 * cualquier carta de esa rareza y set (también una repetida), así que la reserva es la media de
 * nuestro valor de todas ellas × seguridad. Solo rarezas que vende el dealer y sets con huecos.
 */
export async function raritySetTargets(
  missing: readonly MissingCard[],
  catalog: Catalog,
  valueOf: (card: string) => Promise<number>,
  o: BuyPlanOptions & { rarities: readonly string[] },
): Promise<Target[]> {
  const cap = Math.floor(Math.min(o.budget, o.cash));
  if (cap < 1) return [];
  const out: (Target & { surplus: number })[] = [];
  let lookups = 0;
  for (const set of catalog.sets) {
    for (const rarity of o.rarities) {
      const cards = set.cards.filter((c) => rarityOf(c) === rarity);
      const setId = set.id ?? cards[0]?.id.split("-")[0];
      if (!setId || !cards.length || !missing.some((m) => m.set === setId && cards.some((c) => c.id === m.id))) continue;
      if (lookups + cards.length > o.maxLookups) continue;
      lookups += cards.length;
      const vals = await Promise.all(cards.map((c) => valueOf(c.id)));
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const reservation = Math.min(cap, Math.floor(mean * o.safety));
      const book = cards[0]?.book ?? undefined;
      if (reservation < 1 || (book !== undefined && reservation < book * 0.6)) continue;
      out.push({ key: `buy:${setId}:${rarity}`, side: "buy", topic: { buy: { rarity, set: setId } }, reservation, label: `buy ${rarity} ${setId}`, surplus: mean - (book ?? 0) });
    }
  }
  return out.sort((a, b) => b.surplus - a.surplus).map(({ surplus: _s, ...t }) => t);
}
