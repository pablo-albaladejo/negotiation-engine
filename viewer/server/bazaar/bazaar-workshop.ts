import { z } from "zod";
import { assetsInOffers, assetsInThreads } from "../../../src/shared/asset-locks.js";
import { freeCounts } from "../../../src/shared/last-copy.js";
import type { FeedEvent } from "./bazaar-board-core.js";

/**
 * The Workshop (El Taller, `POST /api/taller {assets: [a, b, c]}`): three spare copies of one rarity become one card
 * of the next rarity, drawn at random (shown, never scored). Read-only: what we could hand in now under the same
 * guardrails as any sale (never the last free copy, nothing in an open thread or offer), and who crafted what
 * (`taller.crafted` on the public stream). Nothing here sends.
 */

const num = z.number();
const str = z.string();
const HeldSchema = z.looseObject({ id: num, ref: str, kind: str.nullish(), name: str.nullish(), rarity: str.nullish(), your_value: num.nullish() });
const MeSchema = z.looseObject({ id: str.nullish(), assets: z.array(z.unknown()).nullish() });
const CatalogSchema = z.looseObject({ sets: z.array(z.looseObject({ cards: z.array(z.looseObject({ id: str, name: str.nullish(), rarity: str.nullish() })).nullish() })).nullish() });
const CraftedSchema = z.looseObject({ team: str.nullish(), name: str.nullish(), from: str.nullish(), to: str.nullish(), card: str.nullish() });
const LevelSchema = z.looseObject({ level: str.nullish(), teaser: str.nullish(), how: str.nullish() });

export const RARITY_LADDER = ["common", "uncommon", "rare", "epic", "legendary"] as const;
const NEEDED = 3;

export interface WorkshopSpare {
  ref: string;
  name: string | null;
  /** Free copies (held, not locked). */
  free: number;
  /** Free copies beyond the one we keep. */
  spare: number;
  your_value: number | null;
}

export interface WorkshopRarity {
  rarity: string;
  next: string | null;
  spares: WorkshopSpare[];
  /** Spare copies of this rarity in total. */
  count: number;
  ready: boolean;
}

export interface WorkshopCraft {
  id: number;
  tick: number | null;
  team: string;
  name: string | null;
  from: string | null;
  to: string | null;
  card: string | null;
  us: boolean;
}

export interface WorkshopOut {
  /** `level.activated` with `how` seen (the teaser alone does not open it). */
  open: boolean;
  opened_tick: number | null;
  teaser: string | null;
  how: string | null;
  needed: number;
  rarities: WorkshopRarity[];
  /** Copies held but busy (open thread or offer), with where. */
  locked: { id: number; ref: string; where: string }[];
  crafts: WorkshopCraft[];
}

function rarityByRef(catalogRaw: unknown): Map<string, { name: string | null; rarity: string | null }> {
  const out = new Map<string, { name: string | null; rarity: string | null }>();
  const p = CatalogSchema.safeParse(catalogRaw);
  if (!p.success) return out;
  for (const s of p.data.sets ?? []) for (const c of s.cards ?? []) out.set(c.id, { name: c.name ?? null, rarity: c.rarity ?? null });
  return out;
}

/** `events`: feed and recorder events (any order, duplicates allowed). */
export function workshopOf(meRaw: unknown, threadsRaw: unknown, offersRaw: unknown, catalogRaw: unknown, events: readonly FeedEvent[], team: string): WorkshopOut {
  const me = MeSchema.safeParse(meRaw);
  const held = (me.success ? (me.data.assets ?? []) : []).flatMap((a) => {
    const p = HeldSchema.safeParse(a);
    return p.success && (p.data.kind ?? "card") === "card" ? [p.data] : [];
  });
  const threads = (threadsRaw as { threads?: unknown } | null)?.threads;
  const busy = new Map([...assetsInThreads(Array.isArray(threads) ? threads : []), ...assetsInOffers(offersRaw, me.success ? me.data.id : null)]);
  const free = freeCounts(held, new Set(busy.keys()), new Set());
  const catalog = rarityByRef(catalogRaw);

  const byRarity = new Map<string, WorkshopSpare[]>();
  for (const [ref, n] of free) {
    if (n < 2) continue;
    const a = held.find((h) => h.ref === ref);
    const rarity = a?.rarity ?? catalog.get(ref)?.rarity ?? "?";
    const list = byRarity.get(rarity) ?? [];
    list.push({ ref, name: a?.name ?? catalog.get(ref)?.name ?? null, free: n, spare: n - 1, your_value: a?.your_value ?? null });
    byRarity.set(rarity, list);
  }
  const rarities = [...byRarity]
    .map(([rarity, spares]) => {
      const i = RARITY_LADDER.indexOf(rarity as (typeof RARITY_LADDER)[number]);
      const count = spares.reduce((s, x) => s + x.spare, 0);
      const next = i >= 0 && i < RARITY_LADDER.length - 1 ? RARITY_LADDER[i + 1]! : null;
      return { rarity, next, spares: spares.sort((a, b) => (a.your_value ?? Infinity) - (b.your_value ?? Infinity)), count, ready: next !== null && count >= NEEDED };
    })
    .sort((a, b) => RARITY_LADDER.indexOf(a.rarity as never) - RARITY_LADDER.indexOf(b.rarity as never));

  const seen = new Set<number>();
  const crafts: WorkshopCraft[] = [];
  let opened: { tick: number | null; teaser: string | null; how: string | null } | null = null;
  let teaser: string | null = null;
  for (const e of [...events].sort((a, b) => a.id - b.id)) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    if (e.type === "level.activated") {
      const p = LevelSchema.safeParse(e.payload);
      if (!p.success || p.data.level !== "taller") continue;
      teaser = p.data.teaser ?? teaser;
      if (p.data.how) opened = { tick: e.tick ?? null, teaser, how: p.data.how };
    } else if (e.type === "taller.crafted") {
      const p = CraftedSchema.safeParse(e.payload);
      if (!p.success || !p.data.team) continue;
      crafts.push({ id: e.id, tick: e.tick ?? null, team: p.data.team, name: p.data.name ?? null, from: p.data.from ?? null, to: p.data.to ?? null, card: p.data.card ?? null, us: p.data.team === team });
    }
  }
  const refOf = new Map(held.map((h) => [h.id, h.ref]));
  return {
    open: opened !== null,
    opened_tick: opened?.tick ?? null,
    teaser,
    how: opened?.how ?? null,
    needed: NEEDED,
    rarities,
    locked: [...busy].flatMap(([id, where]) => (refOf.has(id) ? [{ id, ref: refOf.get(id)!, where }] : [])),
    crafts: crafts.reverse(),
  };
}
