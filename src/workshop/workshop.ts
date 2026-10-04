import type { Intent } from "../coordinator/coordinator.js";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import { assetsInOffers, assetsInThreads, isKeepsake, teamOfferedAssets } from "../shared/asset-locks.js";
import { takesLastFreeCopy } from "../shared/last-copy.js";
import type { Asset } from "../shared/schemas.js";
import type { FeedEvent } from "../state/world.js";
import type { PriceEntry } from "../state/prices.js";
import type { CardValuation } from "../state/valuation.js";

/**
 * The Workshop (El Taller, `POST /api/taller {assets: [a, b, c]}`): three spare copies of one rarity become one random
 * card of the next rarity. The pull is shown and never scored (no neg_points, no ladder), so a craft only pays through
 * what the new card is worth to us (a missing page card is worth much more than a duplicate) against what the three
 * spares are worth (losing a copy, or the best bid we could sell it at now). Same guardrails as any sale: never the last
 * free copy, nothing in an open thread or offer, never a hidden or keepsake card. Duplicates go to teams first (Pablo,
 * 4 Oct, as the dealers route): no copy of a card we offer to teams (El Rastro, a venue, directed) or that an intros pair
 * of the last 6 h names us as holder of is crafted, and no listing is cancelled for a craft. Offers unreadable: nothing.
 */

export const RARITY_LADDER = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export const WORKSHOP_PARAMS = {
  /** Spare copies per craft. */
  needed: 3,
  /** Craft only if the expected card beats the spares by at least max(minNet, minNetFrac × cost). */
  minNet: 2,
  minNetFrac: 0.1,
} as const;
export const WORKSHOP_ASSUMPTIONS = [
  "ASSUMPTION: the pull is uniform over the released, non-hidden cards of the next rarity (the real draw is not published)",
  "ASSUMPTION: a craft does not use the accept quota (unverified)",
];

export interface WorkshopCopy {
  id: number;
  ref: string;
  /** What handing it in costs: max(losing the copy at our values, best bid we could sell it at). */
  cost: number;
}

export interface WorkshopRarity {
  rarity: string;
  next: string | null;
  /** Usable spare copies, cheapest first. */
  spares: WorkshopCopy[];
  ready: boolean;
  /** The three copies a craft would hand in. */
  pick: number[];
  cost: number;
  /** Mean of what one more copy adds over the cards the pull can give (released, non-hidden, next rarity). */
  expected: number;
  /** Cards the pull can give, and how many of them we miss (a new album slot). */
  pool: number;
  missing: number;
  net: number;
  decision: "craft" | "hold" | "short";
  reason: string;
}

export interface WorkshopCraft {
  id: number;
  tick?: number;
  team: string;
  from?: string;
  to?: string;
  card?: string;
  us: boolean;
}

export interface WorkshopState {
  rarities: WorkshopRarity[];
  /** The craft the strategy would do this tick (best net), if any. */
  best?: string;
  /** Copies held but busy (thread or offer), with where: never handed in. */
  busy: { id: number; ref: string; where: string }[];
  /** Cards with team demand (our offers to teams, intros): none of their copies is crafted. */
  demand: string[];
  /** Our offers could not be read: nothing is crafted (fails closed). */
  blocked?: string;
  crafts: WorkshopCraft[];
}

export interface WorkshopInput {
  assets: readonly Asset[];
  team?: string;
  threads: readonly unknown[];
  /** Our offers; `undefined` when they could not be read (nothing is crafted). */
  myOffers: unknown;
  /** Refs with team demand from intros (`introDemand`). */
  teamDemand?: ReadonlySet<string>;
  prices: readonly PriceEntry[];
  valuation?: readonly CardValuation[];
  events: readonly FeedEvent[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const rec = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const isHiddenRef = (ref: string) => Number(ref.split("-")[1]) > 12;

/** Busy assets: open threads and every open offer of ours. */
function busyOf(threads: readonly unknown[], myOffers: unknown, team: string | undefined): Map<number, string> {
  const list = Array.isArray(myOffers) ? myOffers : ["offers", "open", "queued"].flatMap((k) => (Array.isArray(rec(myOffers)[k]) ? (rec(myOffers)[k] as unknown[]) : []));
  return new Map([...assetsInThreads(threads), ...assetsInOffers(list, team ?? null)]);
}

/** Refs with team demand: every card we offer to a team now (venue or directed), plus the intros refs. */
function demandOf(assets: readonly { id: number; ref: string }[], myOffers: unknown, team: string | undefined, intros: ReadonlySet<string> | undefined): Set<string> {
  const offered = teamOfferedAssets(myOffers, team ?? null);
  return new Set([...(intros ?? []), ...assets.filter((a) => offered.has(a.id)).map((a) => a.ref)]);
}

export function buildWorkshop(i: WorkshopInput): WorkshopState {
  const cards = i.assets.filter((a) => (a.kind ?? "card") === "card" && typeof a.ref === "string");
  const blocked = i.myOffers === undefined ? "our offers unreadable: nothing is crafted" : undefined;
  const busy = busyOf(i.threads, i.myOffers, i.team);
  const demand = demandOf(cards, i.myOffers, i.team, i.teamDemand);
  const val = new Map((i.valuation ?? []).map((v) => [v.ref, v]));
  const price = new Map(i.prices.map((p) => [p.ref, p]));

  const byRef = new Map<string, Asset[]>();
  for (const a of cards) byRef.set(a.ref, [...(byRef.get(a.ref) ?? []), a]);
  const byRarity = new Map<string, WorkshopCopy[]>();
  for (const [ref, copies] of byRef) {
    const a0 = copies[0]!;
    // Pablo, 3 Oct: hidden cards are never sold, and handing one to the Workshop gives it away too.
    if (blocked || isHiddenRef(ref) || copies.some((a) => isKeepsake(a))) continue;
    // Duplicates go to teams first: a card with team demand keeps all its copies for that sale.
    if (demand.has(ref)) continue;
    const rarity = a0.rarity ?? val.get(ref)?.rarity;
    if (!rarity) continue;
    const free = copies.filter((a) => !busy.has(a.id));
    // Keep one free copy (the album copy).
    if (free.length < 2) continue;
    const bid = price.get(ref)?.bestBid?.price ?? 0;
    const lose = val.get(ref)?.loseCopy ?? a0.your_value ?? 0;
    const spares = free.slice(1).map((a) => ({ id: a.id, ref, cost: r1(Math.max(lose, bid)) }));
    byRarity.set(rarity, [...(byRarity.get(rarity) ?? []), ...spares]);
  }

  const rarities: WorkshopRarity[] = [];
  for (const [rarity, list] of byRarity) {
    const k = RARITY_LADDER.indexOf(rarity as (typeof RARITY_LADDER)[number]);
    const next = k >= 0 && k < RARITY_LADDER.length - 1 ? RARITY_LADDER[k + 1]! : null;
    const spares = list.sort((a, b) => a.cost - b.cost);
    const chosen = spares.slice(0, WORKSHOP_PARAMS.needed);
    const pool = next ? i.prices.filter((p) => p.rarity === next && !p.hidden && !isHiddenRef(p.ref)) : [];
    const worth = pool.map((p) => val.get(p.ref)?.nextCopy ?? p.nextValue ?? p.value ?? 0);
    const expected = worth.length ? r1(worth.reduce((s, x) => s + x, 0) / worth.length) : 0;
    const cost = r1(chosen.reduce((s, c) => s + c.cost, 0));
    const net = r1(expected - cost);
    const ready = next !== null && chosen.length === WORKSHOP_PARAMS.needed;
    const bar = r1(Math.max(WORKSHOP_PARAMS.minNet, WORKSHOP_PARAMS.minNetFrac * cost));
    const decision = !ready ? "short" : pool.length > 0 && net >= bar ? "craft" : "hold";
    const reason = !next
      ? "top rarity: nothing to craft"
      : !ready
        ? `${chosen.length}/${WORKSHOP_PARAMS.needed} spares`
        : pool.length === 0
          ? `no released ${next} known`
          : `expected ${expected} P (${pool.filter((p) => !p.holdings).length}/${pool.length} ${next} missing) vs spares ${cost} P: net ${net} ${decision === "craft" ? "≥" : "<"} ${bar}`;
    rarities.push({ rarity, next, spares, ready, pick: ready ? chosen.map((c) => c.id) : [], cost, expected, pool: pool.length, missing: pool.filter((p) => !p.holdings).length, net, decision, reason });
  }
  rarities.sort((a, b) => RARITY_LADDER.indexOf(a.rarity as never) - RARITY_LADDER.indexOf(b.rarity as never));
  const best = rarities.filter((r) => r.decision === "craft").sort((a, b) => b.net - a.net)[0]?.rarity;

  const refOf = new Map(cards.map((a) => [a.id, a.ref]));
  const seen = new Set<number>();
  const crafts: WorkshopCraft[] = [];
  for (const e of [...i.events].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))) {
    if (e.type !== "taller.crafted" || e.id === undefined || seen.has(e.id)) continue;
    seen.add(e.id);
    const p = rec(e.payload);
    if (typeof p.team !== "string") continue;
    crafts.push({ id: e.id, tick: e.tick, team: p.team, ...(typeof p.from === "string" ? { from: p.from } : {}), ...(typeof p.to === "string" ? { to: p.to } : {}), ...(typeof p.card === "string" ? { card: p.card } : {}), us: !!i.team && p.team === i.team });
  }
  return {
    rarities,
    ...(best ? { best } : {}),
    busy: [...busy].flatMap(([id, where]) => (refOf.has(id) ? [{ id, ref: refOf.get(id)!, where }] : [])),
    demand: [...demand].sort(),
    ...(blocked ? { blocked } : {}),
    crafts: crafts.reverse(),
  };
}

/** One line per rarity with spares, for the play output. */
export function formatWorkshop(w: WorkshopState): string {
  if (w.blocked) return `workshop: ${w.blocked}`;
  const held = w.demand.length ? ` · team demand, kept for teams: ${w.demand.join(", ")}` : "";
  if (!w.rarities.length) return `workshop: no spare copies${held}`;
  return `workshop: ${w.rarities.map((r) => `${r.rarity} ${Math.min(r.spares.length, WORKSHOP_PARAMS.needed)}/${WORKSHOP_PARAMS.needed} ${r.decision} (${r.reason})`).join(" · ")}${held}`;
}

/** At most one craft intent per tick (the best net); everything else is a note. Never sends. */
export function proposeWorkshop(w: WorkshopState | undefined, enabled = true): { intents: Intent[]; notes: string[] } {
  if (!w) return { intents: [], notes: ["workshop: no state this tick"] };
  const notes = [formatWorkshop(w), ...WORKSHOP_ASSUMPTIONS];
  const r = w.rarities.find((x) => x.rarity === w.best);
  if (!r || !r.next) return { intents: [], notes };
  const copies = r.pick.map((id) => r.spares.find((s) => s.id === id)!).map((s) => `${s.ref}#${s.id} ${s.cost} P`);
  // Without --workshop no intent: an unsent craft must not take the asset locks of listings of the same copies.
  if (!enabled) return { intents: [], notes: [...notes, `workshop: would craft 3 ${r.rarity} [${copies.join(", ")}] → 1 random ${r.next} (net ${r.net}; needs --workshop)`] };
  return {
    intents: [
      {
        id: `workshop:craft:${r.rarity}`,
        route: "workshop",
        kind: "craft",
        ev: r.net,
        summary: `craft 3 ${r.rarity} [${copies.join(", ")}] → 1 random ${r.next}: expected ${r.expected} P vs ${r.cost} P (net ${r.net})`,
        locks: r.pick.map((id) => `asset:${id}`),
      },
    ],
    notes,
  };
}

/**
 * Sends the selected craft only when `send` (live, --confirm and --workshop): re-reads `/api/me`, threads and offers,
 * re-checks every guardrail (team demand included) on that one read and only then POSTs. Anything off aborts the craft.
 */
export async function executeWorkshop(client: BazaarClient, selected: readonly Intent[], w: WorkshopState | undefined, send: boolean): Promise<string[]> {
  const lines: string[] = [];
  for (const i of selected.filter((x) => x.route === "workshop")) {
    const r = w?.rarities.find((x) => i.id === `workshop:craft:${x.rarity}`);
    if (!r || r.pick.length !== WORKSHOP_PARAMS.needed) continue;
    if (!send) {
      lines.push(`workshop: would ${i.summary} (live needs --confirm and --workshop)`);
      continue;
    }
    try {
      const [me, threads, offers] = await Promise.all([client.me(), client.myThreads(), client.myOffers()]);
      const busy = busyOf(threads.threads ?? [], offers, me.id ?? undefined);
      const held = me.assets.filter((a) => (a.kind ?? "card") === "card").map((a) => ({ id: a.id, ref: a.ref, rarity: a.rarity }));
      const demand = demandOf(held, offers, me.id ?? undefined, new Set(w?.demand ?? []));
      const off = r.pick.find((id) => {
        const a = held.find((h) => h.id === id);
        return !a || a.rarity !== r.rarity || isHiddenRef(a.ref) || busy.has(id) || demand.has(a.ref);
      });
      const why =
        off !== undefined
          ? `#${off} ${busy.get(off) ?? (demand.has(held.find((h) => h.id === off)?.ref ?? "") ? "has team demand" : "not held or changed")}`
          : takesLastFreeCopy(r.pick, held, new Set(busy.keys()), new Set())
            ? "it would take a last free copy"
            : undefined;
      if (why) {
        lines.push(`workshop: craft ${r.rarity} aborted: ${why}`);
        continue;
      }
      const out = rec(await client.raw("POST", "/api/taller", { assets: r.pick }));
      const card = rec(out.card);
      lines.push(`workshop: crafted [${r.pick.join(", ")}] → #${String(card.id ?? "?")} ${String(card.ref ?? "?")} (${String(card.rarity ?? r.next)})`);
    } catch (e) {
      lines.push(`workshop: ${i.id} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
