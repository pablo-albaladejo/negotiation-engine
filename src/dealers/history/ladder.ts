import type { LessonEntry } from "./lessons.js";

/**
 * Dealer ladder (RULES.md:118, personas.md § 9): per persona level, the best three negotiated deal shares of the day
 * count (a missing one counts zero) and higher levels weigh more. Share = part of her range (her opening → her limit)
 * we captured: selling to her, (price − opening) ÷ (limit − opening); buying from her, (opening − price) ÷ (opening − limit).
 * Read from `docs/bazaar/lessons.json` (our closed conversations) and the persona model (level, band limits). Pure.
 */

export const LADDER_SLOTS = 3;
/**
 * Ladder points of one slot at share 1.0, per persona level. Measured on 3 Oct: Pilar (L3) thread 901 at her limit
 * (share 1.0) gave ladder +0.033 and thread 894 (share ≈ 0.46) +0.014, so ≈ 0.011 × level per full slot.
 */
export const LADDER_SLOT_POINTS_PER_LEVEL = 0.011;
/**
 * P-equivalent of one ladder point to rank opens against value created (EV in P). Assumption, tunable: a full empty
 * L3 slot (0.033) ≈ 10 P, an L1 slot ≈ 3.3 P; 1.0 ladder gave ≈ 19 negotiating points live (0.098 → 0.145: +0.89).
 */
export const LADDER_P_PER_POINT = 300;
/** Share assumed for a deal whose limit is unknown, and for a dealer with no negotiated deal yet. */
export const DEFAULT_SHARE = 0.5;

export interface LadderDeal {
  thread: number;
  dealer: string;
  level: number;
  share: number;
  /** The share is assumed (`DEFAULT_SHARE`): her limit for that band is unknown. */
  assumed: boolean;
}

export interface LadderLevel {
  level: number;
  dealers: string[];
  /** Best shares, highest first, at most `LADDER_SLOTS`. */
  top: number[];
  /** Share a new deal must beat to count: 0 while a slot is empty. */
  weakest: number;
  deals: LadderDeal[];
}

export interface DealerLadderInfo {
  level?: number;
  /** Her limit in P for a band (`sells:<rarity>` when she sells, `buys:<rarity>` when she buys), if measured. */
  limit: (band: string) => number | undefined;
}

/** Share captured by one closed deal, 0–1; `undefined` if her range is unknown. */
export function dealShare(kind: "buy" | "sell", open: number, price: number, limit: number | undefined): number | undefined {
  if (limit === undefined) return undefined;
  const span = kind === "sell" ? limit - open : open - limit;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (kind === "sell" ? price - open : open - price) / span));
}

/**
 * Today's ladder per level from the lessons: only deals of `day` (UTC date of `ts`, same as Madrid during opening hours)
 * that were negotiated (we made an offer: took_opening doesn't count). Her limit: her final if she gave one, otherwise
 * the persona model's band limit for the card's rarity (`rarityOf`).
 */
export function ladderLevels(
  entries: readonly LessonEntry[],
  day: string,
  dealerInfo: (dealer: string) => DealerLadderInfo | undefined,
  rarityOf: (card: string) => string | undefined,
): LadderLevel[] {
  const byLevel = new Map<number, LadderLevel>();
  for (const e of entries) {
    if (e.outcome !== "deal" || !e.ts?.startsWith(day) || e.price === null || e.her_opening === null || !e.our_prices.length) continue;
    const info = dealerInfo(e.dealer);
    if (info?.level === undefined) continue;
    const rarity = e.cards[0] ? rarityOf(e.cards[0]) : undefined;
    const band = `${e.kind === "sell" ? "buys" : "sells"}:${rarity ?? ""}`;
    const limit = e.final_flag && e.her_final !== null ? e.her_final : rarity ? info.limit(band) : undefined;
    const share = dealShare(e.kind, e.her_opening, e.price, limit);
    const lvl = byLevel.get(info.level) ?? { level: info.level, dealers: [], top: [], weakest: 0, deals: [] };
    if (!lvl.dealers.includes(e.dealer)) lvl.dealers.push(e.dealer);
    lvl.deals.push({ thread: e.thread, dealer: e.dealer, level: info.level, share: share ?? DEFAULT_SHARE, assumed: share === undefined });
    byLevel.set(info.level, lvl);
  }
  for (const l of byLevel.values()) {
    l.top = l.deals.map((d) => d.share).sort((a, b) => b - a).slice(0, LADDER_SLOTS);
    l.weakest = l.top.length < LADDER_SLOTS ? 0 : l.top[LADDER_SLOTS - 1]!;
  }
  return [...byLevel.values()].sort((a, b) => b.level - a.level);
}

/** Mean share of a dealer's negotiated deals in `levels`, or `DEFAULT_SHARE` without any. */
export function expectedShare(levels: readonly LadderLevel[], dealer: string): number {
  const deals = levels.flatMap((l) => l.deals.filter((d) => d.dealer === dealer));
  return deals.length ? deals.reduce((s, d) => s + d.share, 0) / deals.length : DEFAULT_SHARE;
}

/**
 * Ladder points one more deal with a level-`level` dealer would add at `share`: it fills an empty slot (weakest 0) or
 * replaces the weakest of the top three only if it beats it. Higher levels weigh more (`LADDER_SLOT_POINTS_PER_LEVEL`).
 */
export function ladderGain(levels: readonly LadderLevel[], level: number, share: number): number {
  const weakest = levels.find((l) => l.level === level)?.weakest ?? 0;
  return LADDER_SLOT_POINTS_PER_LEVEL * level * Math.max(0, share - weakest);
}

/** One line per level: `L3 pilar 2/3 [1.00, 0.46] weakest 0.00`. */
export function formatLadder(levels: readonly LadderLevel[]): string {
  if (!levels.length) return "ladder: no negotiated dealer deal today";
  return `ladder: ${levels.map((l) => `L${l.level} ${l.dealers.join("+")} ${Math.min(l.deals.length, LADDER_SLOTS)}/${LADDER_SLOTS} [${l.top.map((s) => s.toFixed(2)).join(", ")}]${l.deals.some((d) => d.assumed) ? "~" : ""} weakest ${l.weakest.toFixed(2)}`).join(" · ")} (~ = some limit unknown, share ${DEFAULT_SHARE} assumed)`;
}
