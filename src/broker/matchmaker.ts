import { existsSync, readFileSync } from "node:fs";
import { ANNOUNCEMENT } from "./broker.js";

/**
 * Matchmaker announcement (Payday deck, slide 9: "it finds the missing card"): cross each team's want-list with the
 * teams seen holding a duplicate of that card, from the rivals ledger (`results/bazaar-live/rivals.json`, structure
 * only: offers, feed and `/api/cards`), and name the pairs in the v04 announcement. Pure except `loadLedgerFile`.
 * Our own team is left out on both sides: we cannot trade on our own venue.
 */

export interface LedgerLike {
  assets: Record<string, { ref: string; holder?: string; tick: number; confirmedTick?: number }>;
  wants: Record<string, Record<string, number>>;
  boards?: Record<string, { tick: number }>;
}

export interface MatchPair {
  ref: string;
  /** Teams seen holding at least two copies. */
  holders: string[];
  /** Teams that asked for it recently and are not seen holding it. */
  wanters: string[];
}

export const MATCHMAKER_PARAMS = {
  /** A want or a sighting older than this is ignored. */
  maxAgeTicks: 240,
  /** Card list stops before the announcement passes this length (the game keeps 1,200 characters). */
  maxChars: 1150,
};

const isTeam = (id: string | undefined): id is string => !!id && /^t\d+$/.test(id);

/** Want-list × duplicates, grouped by card, most wanters first. */
export function matchPairs(ledger: LedgerLike, us: string, now: number, params = MATCHMAKER_PARAMS): MatchPair[] {
  const held = new Map<string, Map<string, number>>();
  for (const a of Object.values(ledger.assets)) {
    if (!isTeam(a.holder) || a.holder === us || now - (a.confirmedTick ?? a.tick) > params.maxAgeTicks) continue;
    const m = held.get(a.holder) ?? new Map<string, number>();
    m.set(a.ref, (m.get(a.ref) ?? 0) + 1);
    held.set(a.holder, m);
  }
  const byRef = new Map<string, MatchPair>();
  for (const [team, wants] of Object.entries(ledger.wants)) {
    if (!isTeam(team) || team === us) continue;
    for (const [ref, tick] of Object.entries(wants)) {
      if (now - tick > params.maxAgeTicks || (held.get(team)?.get(ref) ?? 0) > 0) continue;
      const holders = [...held].filter(([h, m]) => h !== team && (m.get(ref) ?? 0) >= 2).map(([h]) => h).sort();
      if (!holders.length) continue;
      const p = byRef.get(ref) ?? { ref, holders, wanters: [] };
      p.wanters.push(team);
      byRef.set(ref, p);
    }
  }
  for (const p of byRef.values()) p.wanters.sort();
  return [...byRef.values()].sort((a, b) => b.wanters.length - a.wanters.length || a.ref.localeCompare(b.ref));
}

/** The announcement naming the pairs; the plain `ANNOUNCEMENT` when there are none. */
export function matchmakerAnnouncement(pairs: readonly MatchPair[], params = MATCHMAKER_PARAMS): string {
  if (!pairs.length) return ANNOUNCEMENT;
  // game text
  const head = "Team 2 · El Rastro Express (v04) found your missing cards. Want-lists matched with duplicates (spare → wanted by): ";
  // game text
  const tail =
    '. Holders: post the spare with venue "v04" (give {"assets": [id]}, want cash or a card). Buyers: bid with venue "v04" (give cash, want {"cards": ["RET-01"]}). Card-for-card swaps welcome, no cash needed. 0 % fee and 0 P per card (El Rastro: 5 % + 1 P a card); best bid and ask cross every tick.';
  const items: string[] = [];
  for (const p of pairs) {
    const item = `${p.ref} ${p.holders.join("/")} → ${p.wanters.join(",")}`;
    if ((head + [...items, item].join(" · ") + tail).length > params.maxChars) break;
    items.push(item);
  }
  return items.length ? head + items.join(" · ") + tail : ANNOUNCEMENT;
}

/** Reads the rivals ledger; undefined when it is missing or unreadable. */
export function loadLedgerFile(file: string): LedgerLike | undefined {
  if (!existsSync(file)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<LedgerLike>;
    return raw.assets && raw.wants ? (raw as LedgerLike) : undefined;
  } catch {
    return undefined;
  }
}

/** Latest tick the ledger knows (leaderboard rows, else sightings). */
export function ledgerNow(ledger: LedgerLike): number {
  const ticks = [...Object.values(ledger.boards ?? {}).map((b) => b.tick), ...Object.values(ledger.assets).map((a) => a.confirmedTick ?? a.tick)];
  return ticks.length ? Math.max(...ticks) : 0;
}
