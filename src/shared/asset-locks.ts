import type { BazaarClient } from "./client.js";
import { assetIdsOf } from "../dealers/negotiation/offer-structure.js";
import { StandingOfferSchema } from "./schemas.js";

/**
 * One asset, one place: an asset that is already in an open thread with a dealer (topic `{sell: {assets}}` or an
 * offer of ours in the thread) or in an open offer of ours in any venue is not offered elsewhere. Used by
 * the dealers agent (does not open a sell thread) and the trades agent (does not list it in El Rastro). Only reads the API.
 */

export type BusyAssets = Map<number, string>;

export type LocksApi = Pick<BazaarClient, "myThreads" | "myOffers">;

const OPEN = new Set(["open", "queued", "pending"]);

function offersOf(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  return ["offers", "open", "queued"].flatMap((k) => (Array.isArray(obj[k]) ? (obj[k] as unknown[]) : []));
}

/** Assets we give in our open offers (`/api/me/offers`), with where they are. */
export function assetsInOffers(raw: unknown, selfId?: string | null, excludeThread?: number): BusyAssets {
  const out: BusyAssets = new Map();
  for (const x of offersOf(raw)) {
    const p = StandingOfferSchema.safeParse(x);
    if (!p.success) continue;
    const o = p.data as typeof p.data & { venue?: unknown; thread?: unknown };
    if (!OPEN.has(o.status ?? "open")) continue;
    if (selfId && o.maker && o.maker.toLowerCase() !== selfId.toLowerCase()) continue;
    if (excludeThread !== undefined && o.thread === excludeThread) continue;
    const where = typeof o.thread === "number" ? `offer ${o.id} in thread ${o.thread}` : `offer ${o.id}${typeof o.venue === "string" ? ` on ${o.venue}` : ""}`;
    for (const id of assetIdsOf(o.give)) if (!out.has(id)) out.set(id, where);
  }
  return out;
}

/** Assets from the sell topics of our open threads (`/api/me/threads?status=open`). */
export function assetsInThreads(threads: readonly unknown[], excludeThread?: number): BusyAssets {
  const out: BusyAssets = new Map();
  for (const t of threads) {
    const th = t as { id?: unknown; status?: unknown; with?: unknown; topic?: { sell?: { assets?: unknown } } };
    if ((typeof th.status === "string" && th.status !== "open") || (excludeThread !== undefined && th.id === excludeThread)) continue;
    const ids = Array.isArray(th.topic?.sell?.assets) ? th.topic.sell.assets : [];
    for (const id of ids) if (typeof id === "number" && !out.has(id)) out.set(id, `thread ${String(th.id)}${typeof th.with === "string" ? ` with ${th.with}` : ""}`);
  }
  return out;
}

/**
 * Busy assets (open threads + open offers), not counting `excludeThread` (our own thread when resuming or accepting).
 * If it cannot be read, `undefined`: no asset is offered.
 */
/**
 * Assets we offer to other teams right now (Pablo, 4 Oct: duplicates go to teams first): our open offers on a venue
 * (El Rastro, our board) or addressed to a team (`to` = tNN: directed sales, team-desk counters).
 */
/**
 * Card refs our own open bids want (cash given for a card: `want.cards`, `want.types` or `want.assets[].ref`).
 * Coordinator, 4 Oct (CHA-09/10 for the Chamberi page): no dealer buy of a card we already bid for, or both could fill.
 */
export function ourBidRefs(raw: unknown, selfId?: string | null): Set<string> {
  const out = new Set<string>();
  for (const x of offersOf(raw)) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    if (!OPEN.has(typeof o.status === "string" ? o.status : "open")) continue;
    if (selfId && typeof o.maker === "string" && o.maker.toLowerCase() !== selfId.toLowerCase()) continue;
    const want = (o.want && typeof o.want === "object" ? o.want : {}) as Record<string, unknown>;
    for (const k of ["cards", "types"]) for (const r of Array.isArray(want[k]) ? (want[k] as unknown[]) : []) if (typeof r === "string") out.add(r);
    for (const a of Array.isArray(want.assets) ? (want.assets as unknown[]) : []) {
      const ref = a && typeof a === "object" ? (a as Record<string, unknown>).ref : undefined;
      if (typeof ref === "string") out.add(ref);
    }
  }
  return out;
}

export function teamOfferedAssets(raw: unknown, selfId?: string | null): Set<number> {
  const out = new Set<number>();
  for (const x of offersOf(raw)) {
    const p = StandingOfferSchema.safeParse(x);
    if (!p.success) continue;
    const o = p.data as typeof p.data & { venue?: unknown };
    if (!OPEN.has(o.status ?? "open")) continue;
    if (selfId && o.maker && o.maker.toLowerCase() !== selfId.toLowerCase()) continue;
    if (typeof o.venue !== "string" && !(typeof o.to === "string" && /^t\d+$/.test(o.to))) continue;
    for (const id of assetIdsOf(o.give)) out.add(id);
  }
  return out;
}

export async function busyAssets(api: LocksApi, selfId?: string | null, excludeThread?: number): Promise<BusyAssets | undefined> {
  try {
    const [threads, offers] = await Promise.all([api.myThreads("open"), api.myOffers()]);
    return new Map([...assetsInThreads(threads.threads, excludeThread), ...assetsInOffers(offers, selfId, excludeThread)]);
  } catch {
    return undefined;
  }
}

/**
 * Hidden cards (catalog `hidden: true`) we know of: seeded with the ones seen live and filled by `rememberHiddenCards`
 * each time the client reads `/api/catalog`, so the lock holds even before the catalog is read in this process.
 */
const HIDDEN_REFS = new Set<string>(["LAT-13"]);

/** Records the catalog's hidden cards (`hidden: true`); `BazaarClient.catalog` calls it on every read. */
export function rememberHiddenCards(catalog: unknown): void {
  const sets = (catalog as { sets?: unknown } | undefined)?.sets;
  if (!Array.isArray(sets)) return;
  for (const set of sets) {
    const cards = (set as { cards?: unknown } | undefined)?.cards;
    if (!Array.isArray(cards)) continue;
    for (const c of cards) {
      const card = c as { id?: unknown; hidden?: unknown };
      if (card.hidden === true && typeof card.id === "string") HIDDEN_REFS.add(card.id);
    }
  }
}

/**
 * Keepsake: a card no route sells, lists, swaps or offers on its own. Pablo, 3 Oct: hidden cards are never sold, so
 * any hidden card (catalog `hidden: true`) whatever its value; also a one-print card (`print_run` 1), or an epic/legendary
 * without a positive private value: the game prices it at 0 for us, so every sell rule would let it go for anything
 * (the egg gift LAT-13 «La Chulapa Dorada», hidden, legendary, print_run 1, your_value 0, was offered to banco the next tick).
 */
export function isKeepsake(a: { kind?: string | null | undefined; ref?: string | null | undefined; rarity?: string | null | undefined; print_run?: number | null | undefined; your_value?: number | null | undefined }): boolean {
  if ((a.kind ?? "card") !== "card") return false;
  if (a.ref && HIDDEN_REFS.has(a.ref)) return true;
  if (a.print_run === 1) return true;
  return (a.rarity === "epic" || a.rarity === "legendary") && !((a.your_value ?? 0) > 0);
}

/** Asset ids of a sell topic. */
export function sellAssetsOf(topic: unknown): number[] {
  const ids = (topic as { sell?: { assets?: unknown } } | undefined)?.sell?.assets;
  return Array.isArray(ids) ? ids.filter((x): x is number => typeof x === "number") : [];
}

/** The topic sells a busy asset (or we do not know which ones are busy). */
export function sellBlocked(topic: unknown, busy: BusyAssets | undefined): string | undefined {
  const ids = sellAssetsOf(topic);
  if (!ids.length) return undefined;
  if (!busy) return "busy assets unknown (could not read open threads/offers)";
  const hit = ids.find((id) => busy.has(id));
  return hit === undefined ? undefined : `asset ${hit} busy: ${busy.get(hit)}`;
}
