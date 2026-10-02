import { z } from "zod";

/**
 * Núcleo puro de la cabina del Bazaar: álbum (páginas, cartas que faltan y copias que tenemos) y
 * calendario, a partir de `/api/me`, `/api/catalog` y `/api/schedule`. Sin E/S ni cálculo de la
 * cifra: el servidor del juego la da hecha.
 */

const num = z.number();
const str = z.string();

const CatalogCardSchema = z.looseObject({ id: str, name: str.nullish(), rarity: str.nullish(), book: num.nullish(), page: z.boolean().nullish() });
const CatalogSchema = z.looseObject({
  sets: z.array(z.looseObject({ id: str, name: str.nullish(), released: z.boolean().nullish(), cards: z.array(CatalogCardSchema).nullish() })).nullish(),
});
const AlbumSchema = z.looseObject({
  pages: z.array(z.looseObject({ set: str, name: str.nullish(), have: num.nullish(), of: num.nullish(), complete: z.boolean().nullish() })).nullish(),
  filled: num.nullish(),
  slots: num.nullish(),
});
const MeAlbumSchema = z.looseObject({
  album: AlbumSchema.nullish(),
  assets: z.array(z.looseObject({ ref: str.nullish(), kind: str.nullish() })).nullish(),
});
const ScheduleSchema = z.looseObject({
  now_hours: num.nullish(),
  upcoming: z.array(z.looseObject({ at_hours: num, action: str.nullish(), note: str.nullish(), wall: str.nullish() })).nullish(),
});

export interface MissingCard {
  ref: string;
  name: string;
  rarity: string | null;
  /** Precio de referencia del catálogo (`book`). */
  book: number | null;
  /** Nuestro valor privado (`/api/me/value`), si ya se consultó. */
  value: number | null;
}

export interface AlbumPage {
  set: string;
  name: string;
  have: number;
  of: number;
  complete: boolean;
  missing: MissingCard[];
}

export interface AlbumOut {
  filled: number | null;
  slots: number | null;
  pages: AlbumPage[];
}

export interface ScheduleItem {
  at_hours: number;
  action: string;
  note: string;
  wall: string | null;
}

export interface ScheduleOut {
  now_hours: number | null;
  upcoming: ScheduleItem[];
}

/** Copias que tenemos de cada carta (`/api/me` → assets de tipo carta). */
export function holdingsOf(meRaw: unknown): Record<string, number> {
  const p = MeAlbumSchema.safeParse(meRaw);
  const out: Record<string, number> = {};
  if (!p.success) return out;
  for (const a of p.data.assets ?? []) {
    if (a.ref && (a.kind ?? "card") === "card") out[a.ref] = (out[a.ref] ?? 0) + 1;
  }
  return out;
}

/**
 * Páginas del álbum, de la más completa a la menos, con las cartas de página que nos faltan según
 * el catálogo. `values` trae nuestro valor privado de las cartas ya consultadas.
 */
export function albumOf(meRaw: unknown, catalogRaw: unknown, values: ReadonlyMap<string, number>): AlbumOut | null {
  const me = MeAlbumSchema.safeParse(meRaw);
  if (!me.success || !me.data.album) return null;
  const catalog = CatalogSchema.safeParse(catalogRaw);
  const sets = new Map((catalog.success ? (catalog.data.sets ?? []) : []).map((s) => [s.id, s]));
  const held = holdingsOf(meRaw);
  const pages: AlbumPage[] = (me.data.album.pages ?? []).map((p) => {
    const cards = (sets.get(p.set)?.cards ?? []).filter((c) => c.page !== false);
    const missing = cards
      .filter((c) => !held[c.id])
      .map((c) => ({ ref: c.id, name: c.name ?? c.id, rarity: c.rarity ?? null, book: c.book ?? null, value: values.get(c.id) ?? null }));
    return { set: p.set, name: p.name ?? p.set, have: p.have ?? 0, of: p.of ?? cards.length, complete: p.complete ?? false, missing };
  });
  pages.sort((a, b) => b.have / Math.max(1, b.of) - a.have / Math.max(1, a.of));
  return { filled: me.data.album.filled ?? null, slots: me.data.album.slots ?? null, pages };
}

/** Cartas que faltan cuyo valor privado aún no sabemos, empezando por las páginas más completas. */
export function missingWithoutValue(album: AlbumOut | null, max: number): string[] {
  if (!album) return [];
  return album.pages.flatMap((p) => p.missing.filter((m) => m.value === null).map((m) => m.ref)).slice(0, max);
}

/** Calendario: solo lo que aún no ha pasado, en orden. */
export function scheduleOf(raw: unknown): ScheduleOut | null {
  const p = ScheduleSchema.safeParse(raw);
  if (!p.success) return null;
  const now = p.data.now_hours ?? null;
  const upcoming = (p.data.upcoming ?? [])
    .filter((u) => now === null || u.at_hours >= now)
    .sort((a, b) => a.at_hours - b.at_hours)
    .map((u) => ({ at_hours: u.at_hours, action: u.action ?? "?", note: u.note ?? "", wall: u.wall ?? null }));
  return { now_hours: now, upcoming };
}
