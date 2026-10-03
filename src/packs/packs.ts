import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Catalog, Me } from "../shared/schemas.js";
import { enforceGuardrails } from "../engine/guardrails.js";
import { DEFAULT_NEGOTIATOR_PARAMS, plannedSchedule } from "../dealers/negotiation/negotiator.js";
import { negotiatorForDealer, traitsOf } from "../dealers/dealer-profile.js";
import { readSide, type TradeOffer } from "../trades/trades.js";
import type { Intent } from "../coordinator/coordinator.js";
import type { FeedEvent } from "../state/world.js";

/**
 * Sobres: los que tenemos cerrados, el valor esperado de cada tipo ajustado al suministro, dónde se venden y qué
 * vale para nosotros. Ruta PACKS: comprar a un dealer (solo si el trato se negociaría, nunca al precio de apertura,
 * para que cuente en la escalera), abrir los cerrados (salvo que venderlos cerrados gane) y vender cerrado cuando
 * la mejor puja supera nuestro valor. Toda cifra sale del código y pasa por `enforceGuardrails`.
 *
 * ASSUMPTIONS: `/api/me/value` no acepta sobres (`unknown_card`, comprobado): el valor de un sobre que no tenemos
 * se estima con la media de nuestros valores por rareza; abrir un sobre (`POST /api/packs/{id}/open`) no gasta el
 * cupo de aceptaciones (sin verificar).
 */

/** Tiradas fijas (RULES.md:20): cuando una rareza se agota, el hueco da la rareza inferior. */
export const PRINT_RUNS: Record<string, number> = { common: 300, uncommon: 90, rare: 30, epic: 9, legendary: 3 };
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

export const PACK_ASSUMPTIONS = [
  "ASSUMPTION: /api/me/value rejects packs (unknown_card): value of a pack we don't hold = slots × our mean value per rarity",
  "ASSUMPTION: opening a pack does not use the accept quota (unverified)",
];

export interface PackType {
  id: string;
  name?: string;
  /** Probabilidad por rareza en cada hueco, ya ajustada al suministro. */
  slots: Record<string, number>[];
  expectedBook?: number;
  /** Valor esperado en book con el suministro actual (rarezas agotadas caen a la inferior). */
  adjustedBook?: number;
  /** Nuestro valor esperado (medias por rareza de nuestros valores conocidos). */
  ourValue?: number;
  dealers: { persona: string; list?: number; opening?: number; perHour?: number }[];
  bestAsk?: { price: number; offer: number };
  bestBid?: { price: number; offer: number };
  lastDeal?: { price: number; tick: number };
}

export interface SealedPack {
  assetId: number;
  ref: string;
  name?: string;
  /** `your_value` de `/api/me` (exacto para lo que tenemos). */
  value?: number;
}

export interface PacksState {
  sealed: SealedPack[];
  types: PackType[];
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Fracción agotada por rareza (cartas con minted ≥ tirada entre las de sets publicados). */
function exhausted(catalog: Catalog | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of RARITY_ORDER) {
    const cards = (catalog?.sets ?? []).filter((s) => (s as { released?: unknown }).released !== false).flatMap((s) => s.cards.filter((c) => c.rarity === r));
    const run = (c: (typeof cards)[number]) => num(c.print_run) ?? PRINT_RUNS[r]!;
    out[r] = cards.length ? cards.filter((c) => (num(c.minted) ?? 0) >= run(c)).length / cards.length : 0;
  }
  return out;
}

/** Huecos con el suministro actual: la parte agotada de una rareza pasa a la inferior (en cascada). */
export function adjustSlots(slots: readonly Record<string, number>[], gone: Record<string, number>): Record<string, number>[] {
  return slots.map((slot) => {
    const out: Record<string, number> = { ...slot };
    for (let k = RARITY_ORDER.length - 1; k > 0; k--) {
      const r = RARITY_ORDER[k]!;
      const p = out[r] ?? 0;
      const moved = p * (gone[r] ?? 0);
      if (moved > 0) {
        out[r] = p - moved;
        const lower = RARITY_ORDER[k - 1]!;
        out[lower] = (out[lower] ?? 0) + moved;
      }
    }
    return out;
  });
}

export interface PacksInputs {
  me?: Me;
  catalog?: Catalog;
  dealers: readonly unknown[];
  rastro: readonly TradeOffer[];
  team?: string;
  events: readonly FeedEvent[];
  /** Valores privados conocidos por carta (hoja de precios). */
  values: Readonly<Record<string, number>>;
}

export function buildPacks(i: PacksInputs): PacksState {
  const gone = exhausted(i.catalog);
  const released = (i.catalog?.sets ?? []).filter((s) => (s as { released?: unknown }).released !== false).flatMap((s) => s.cards);
  const byRarity = (r: string, f: (c: (typeof released)[number]) => number | undefined) => mean(released.filter((c) => c.rarity === r).flatMap((c) => (f(c) !== undefined ? [f(c)!] : [])));
  const sealed: SealedPack[] = (i.me?.assets ?? [])
    .filter((a) => a.kind === "pack")
    .map((a) => ({ assetId: a.id, ref: a.ref, ...((a as { name?: unknown }).name ? { name: String((a as { name?: unknown }).name) } : {}), ...(typeof a.your_value === "number" ? { value: a.your_value } : {}) }));
  const types: PackType[] = (i.catalog?.packs ?? []).map((p) => {
    const raw = obj(p);
    const slots = adjustSlots(Array.isArray(raw.slots) ? raw.slots.map((s) => Object.fromEntries(Object.entries(obj(s)).flatMap(([k, v]) => (num(v) !== undefined ? [[k, num(v)!]] : [])))) : [], gone);
    const ev = (f: (r: string) => number | undefined) => {
      let total = 0;
      for (const slot of slots) for (const [r, prob] of Object.entries(slot)) {
        const v = f(r);
        if (v === undefined) return undefined;
        total += prob * v;
      }
      return r1(total);
    };
    const adjustedBook = ev((r) => byRarity(r, (c) => num(c.book)));
    const ourValue = ev((r) => byRarity(r, (c) => i.values[c.id]));
    const dealers = i.dealers.flatMap((d) => {
      const menu = obj(obj(d).menu);
      const e = (Array.isArray(menu.sells) ? menu.sells : []).map(obj).find((x) => x.pack === p.id);
      return e ? [{ persona: String(obj(d).id), ...(num(e.list_price) !== undefined ? { list: num(e.list_price)! } : {}), ...(num(e.opening_ask) !== undefined ? { opening: num(e.opening_ask)! } : {}), ...(num(e.per_team_per_hour) !== undefined ? { perHour: num(e.per_team_per_hour)! } : {}) }] : [];
    });
    let bestAsk: PackType["bestAsk"];
    let bestBid: PackType["bestBid"];
    for (const o of i.rastro) {
      if ((o.status ?? "open") !== "open" || o.maker === i.team) continue;
      const give = readSide(o.give);
      const want = readSide(o.want);
      if (give.assets.length === 1 && give.assets[0]!.ref === p.id && want.cash > 0 && !want.assets.length && (!bestAsk || want.cash < bestAsk.price)) bestAsk = { price: want.cash, offer: o.id };
      if (want.assets.length === 1 && want.assets[0]!.ref === p.id && give.cash > 0 && !give.assets.length && (!bestBid || give.cash > bestBid.price)) bestBid = { price: give.cash, offer: o.id };
    }
    let lastDeal: PackType["lastDeal"];
    for (const e of i.events) {
      const items = e.type === "settlement" && Array.isArray(e.payload.items) ? e.payload.items.map(obj) : [];
      const price = num(e.payload.price);
      if (items.length === 1 && items[0]!.ref === p.id && price !== undefined && (!lastDeal || e.tick >= lastDeal.tick)) lastDeal = { price, tick: e.tick };
    }
    return {
      id: p.id,
      ...(p.name ? { name: p.name } : {}),
      slots,
      ...(num(p.expected_book) !== undefined ? { expectedBook: num(p.expected_book)! } : {}),
      ...(adjustedBook !== undefined ? { adjustedBook } : {}),
      ...(ourValue !== undefined ? { ourValue } : {}),
      dealers,
      ...(bestAsk ? { bestAsk } : {}),
      ...(bestBid ? { bestBid } : {}),
      ...(lastDeal ? { lastDeal } : {}),
    };
  });
  return { sealed, types };
}

export function formatPacks(s: PacksState): string[] {
  return [
    `packs sealed: ${s.sealed.map((p) => `#${p.assetId} ${p.name ?? p.ref} (value ${p.value ?? "?"})`).join(", ") || "none"}`,
    ...s.types.map(
      (t) =>
        `  ${t.id}: book ${t.expectedBook ?? "?"} → adj ${t.adjustedBook ?? "?"} · our value ~${t.ourValue ?? "?"} · dealers ${t.dealers.map((d) => `${d.persona} list ${d.list ?? "?"}/open ${d.opening ?? "?"}`).join(", ") || "-"} · Rastro ask ${t.bestAsk?.price ?? "-"} bid ${t.bestBid?.price ?? "-"}${t.lastDeal ? ` · last deal ${t.lastDeal.price} (t${t.lastDeal.tick})` : ""}`,
    ),
  ];
}

// ---------------------------------------------------------------- ruta

export interface PacksRouteInput {
  packs: PacksState;
  cash?: number;
  cashFloor: number;
  /** Personas con las que podemos tratar. */
  unlocked: readonly string[];
  /** Rasgos por persona (para el plan del negociador). */
  dealers: readonly unknown[];
  /** Sobres que llegarán por la agenda (grant_all) o por un desbloqueo: se abrirán cuando aparezcan. */
  incoming: readonly string[];
}

export interface PacksProposal {
  intents: Intent[];
  notes: string[];
}

/** Precio esperado del trato con el dealer: último trato visto del sobre, o su lista; nunca su apertura. */
function expectedDeal(t: PackType, d: PackType["dealers"][number]): number | undefined {
  return t.lastDeal?.price ?? d.list;
}

export function proposePacks(i: PacksRouteInput): PacksProposal {
  const out: PacksProposal = { intents: [], notes: [...PACK_ASSUMPTIONS] };
  for (const s of i.packs.sealed) {
    const t = i.packs.types.find((x) => x.id === s.ref);
    const bid = t?.bestBid;
    const value = s.value ?? t?.ourValue;
    if (bid && value !== undefined && bid.price > value) {
      // Vender cerrado: nunca por debajo de nuestro valor (guardarraíl de vendedor).
      const price = enforceGuardrails({ role: "seller", reservation: Math.ceil(value) }, bid.price);
      out.intents.push({ id: `packs:sell:${s.assetId}`, route: "packs", kind: "listing", conversation: `pack:${s.assetId}`, price, ev: r1(price - value), locks: [`asset:${s.assetId}`], summary: `sell sealed #${s.assetId} ${s.ref} in El Rastro at ${price} P (best bid ${bid.price} > our value ${value}); not opened` });
      continue;
    }
    out.intents.push({ id: `packs:open:${s.assetId}`, route: "packs", kind: "unpack", conversation: `pack:${s.assetId}`, ...(value !== undefined ? { ev: value } : {}), locks: [`asset:${s.assetId}`], summary: `open sealed #${s.assetId} ${s.name ?? s.ref} (value ${value ?? "?"}; sell edge sealed ${bid ? r1(bid.price - (value ?? 0)) : "none"} ≤ 0)` });
  }
  for (const p of i.incoming) out.notes.push(`incoming pack ${p}: will be proposed for opening when it shows up in /api/me`);
  for (const t of i.packs.types) {
    for (const d of t.dealers) {
      if (!i.unlocked.includes(d.persona)) continue;
      const price = expectedDeal(t, d);
      const value = t.ourValue;
      if (price === undefined || value === undefined) continue;
      if (d.opening !== undefined && price >= d.opening) {
        out.notes.push(`${t.id} @ ${d.persona}: expected deal ${price} not below opening ${d.opening}: would not count for the ladder`);
        continue;
      }
      if (value <= price) continue;
      const cash = i.cash ?? 0;
      const reservation = Math.floor(Math.min(value, cash - i.cashFloor));
      if (reservation <= price) {
        out.notes.push(`${t.id} @ ${d.persona}: value ${value} > deal ${price} but cash floor ${i.cashFloor} leaves ${Math.max(0, cash - i.cashFloor)} P`);
        continue;
      }
      const params = { ...DEFAULT_NEGOTIATOR_PARAMS, ...negotiatorForDealer(traitsOf(i.dealers.find((x) => obj(x).id === d.persona)), d.persona) };
      const path = plannedSchedule({ side: "buy", reservation, ...(d.opening !== undefined ? { herOpening: d.opening } : {}), ...(d.list !== undefined ? { herList: d.list } : {}) }, params).map((x) => enforceGuardrails({ role: "buyer", reservation }, x));
      out.intents.push({ id: `packs:buy:${d.persona}:${t.id}`, route: "packs", kind: "open", conversation: `pack-buy:${d.persona}:${t.id}`, ev: r1(value - price), summary: `buy ${t.id} from ${d.persona}: our value ~${value} > expected deal ${price} (< opening ${d.opening ?? "?"}), path [${path.join(", ")}] (proposal only: the dealer agent does not negotiate packs yet)` });
    }
  }
  return out;
}

/** En vivo (solo con --confirm): abrir y listar lo seleccionado. La compra de sobres aún no se ejecuta. */
export async function executePacks(client: BazaarClient, selected: readonly Intent[], dryRun: boolean): Promise<string[]> {
  const lines: string[] = [];
  for (const i of selected.filter((x) => x.route === "packs")) {
    const id = Number(i.id.split(":")[2]);
    if (dryRun) {
      lines.push(`packs: would ${i.summary}`);
      continue;
    }
    try {
      if (i.id.startsWith("packs:open:")) {
        await client.raw("POST", `/api/packs/${id}/open`);
        lines.push(`packs: opened #${id}`);
      } else if (i.id.startsWith("packs:sell:")) {
        const price = i.price;
        if (price === undefined) continue;
        await client.postOffer({ venue: "rastro", give: { assets: [id] }, want: { cash: price } });
        lines.push(`packs: listed #${id} at ${price} P`);
      } else lines.push(`packs: ${i.id} not executed (pack buys are proposal-only)`);
    } catch (e) {
      lines.push(`packs: ${i.id} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  return lines;
}
