import type { BazaarClient } from "./client.js";
import { assetIdsOf } from "../dealers/offer-structure.js";
import { StandingOfferSchema } from "./schemas.js";

/**
 * Un activo, un sitio: un activo que ya está en un hilo abierto con un dealer (topic `{sell: {assets}}` o una
 * oferta nuestra del hilo) o en una oferta abierta nuestra en cualquier venue no se ofrece en otro sitio. Lo usan
 * el agente de dealers (no abre un hilo de venta) y el de trades (no lo lista en El Rastro). Solo lee la API.
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

/** Activos que damos en ofertas abiertas nuestras (`/api/me/offers`), con dónde están. */
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

/** Activos de los topics de venta de nuestros hilos abiertos (`/api/me/threads?status=open`). */
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
 * Activos ocupados (hilos abiertos + ofertas abiertas), sin contar `excludeThread` (el hilo propio al retomarlo o aceptar).
 * Si no se puede leer, `undefined`: no se ofrece ningún activo.
 */
export async function busyAssets(api: LocksApi, selfId?: string | null, excludeThread?: number): Promise<BusyAssets | undefined> {
  try {
    const [threads, offers] = await Promise.all([api.myThreads("open"), api.myOffers()]);
    return new Map([...assetsInThreads(threads.threads, excludeThread), ...assetsInOffers(offers, selfId, excludeThread)]);
  } catch {
    return undefined;
  }
}

/** Ids de activos de un topic de venta. */
export function sellAssetsOf(topic: unknown): number[] {
  const ids = (topic as { sell?: { assets?: unknown } } | undefined)?.sell?.assets;
  return Array.isArray(ids) ? ids.filter((x): x is number => typeof x === "number") : [];
}

/** El topic vende algún activo ocupado (o no sabemos cuáles lo están). */
export function sellBlocked(topic: unknown, busy: BusyAssets | undefined): string | undefined {
  const ids = sellAssetsOf(topic);
  if (!ids.length) return undefined;
  if (!busy) return "busy assets unknown (could not read open threads/offers)";
  const hit = ids.find((id) => busy.has(id));
  return hit === undefined ? undefined : `asset ${hit} busy: ${busy.get(hit)}`;
}
