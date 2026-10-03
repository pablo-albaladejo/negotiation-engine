import { z } from "zod";

/**
 * Pure core of the Bazaar cockpit: album (pages, missing cards and copies we hold) and
 * schedule, built from `/api/me`, `/api/catalog` and `/api/schedule`. No I/O and no figure
 * computation: the game server provides it ready-made.
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
  /** Catalog reference price (`book`). */
  book: number | null;
  /** Our private value (`/api/me/value`), if already queried. */
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

/** Copies we hold of each card (`/api/me` → card-type assets). */
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
 * Album pages, from most to least complete, with the page cards we are missing according to
 * the catalog. `values` carries our private value for the cards already queried.
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

/** Missing cards whose private value we don't know yet, starting with the most complete pages. */
export function missingWithoutValue(album: AlbumOut | null, max: number): string[] {
  if (!album) return [];
  return album.pages.flatMap((p) => p.missing.filter((m) => m.value === null).map((m) => m.ref)).slice(0, max);
}

/** Schedule: only what hasn't happened yet, in order. */
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

/** One snapshot of `/api/me` → score per tick (`score-parts.jsonl`, written by the viewer server). */
export const ScorePartsLineSchema = z.looseObject({ tick: num, parts: z.record(str, num) });
export type ScorePartsLine = z.infer<typeof ScorePartsLineSchema>;

export interface ScorePartsOut {
  tick: number | null;
  now: Record<string, number>;
  /** First snapshot of the day (Δ day = now − this). */
  day_start: ScorePartsLine | null;
  /** Last snapshot from an earlier tick (Δ tick = now − this). */
  prev: ScorePartsLine | null;
}

/** Numeric fields of `/api/me` → score (score, negotiating, market, neg_points, ladder_points, duel_points, mm_points, bench_*). */
export function scoreNumbers(score: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!score || typeof score !== "object") return out;
  for (const [k, v] of Object.entries(score as Record<string, unknown>)) if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  return out;
}

export function scorePartsOf(now: Record<string, number>, tick: number | null, history: readonly ScorePartsLine[]): ScorePartsOut {
  const earlier = tick === null ? [...history] : history.filter((h) => h.tick < tick);
  return { tick, now, day_start: history[0] ?? null, prev: earlier.at(-1) ?? null };
}

// ---------------------------------------------------------------- team desk

/** One line of `team-desk.jsonl` (written by `bazaar:play`): offers other teams make to us and our counter (structure only). */
export const TeamDeskLineSchema = z.looseObject({
  ts: str.nullish(),
  tick: num.nullish(),
  event: str,
  team: str,
  venue: str.nullish(),
  incoming: z.looseObject({ id: num.nullish(), weGet: str.nullish(), weGive: str.nullish(), kind: str.nullish(), value: num.nullish(), verdict: str.nullish() }).nullish(),
  counter: z
    .looseObject({ offerId: num.nullish(), ref: str.nullish(), assetId: num.nullish(), price: num.nullish(), floor: num.nullish(), anchor: num.nullish(), serverValue: num.nullish(), negIfFilled: num.nullish(), replaces: num.nullish() })
    .nullish(),
  status: str.nullish(),
  negDelta: num.nullish(),
  reason: str.nullish(),
});
export type TeamDeskLine = z.infer<typeof TeamDeskLineSchema>;

export interface TeamDeskStep {
  tick: number | null;
  event: string;
  status: string | null;
  offerId: number | null;
  ref: string | null;
  price: number | null;
  anchor: number | null;
  floor: number | null;
  serverValue: number | null;
  negIfFilled: number | null;
  reason: string | null;
}

export interface TeamDeskChain {
  key: string;
  venue: string | null;
  incoming: NonNullable<TeamDeskLine["incoming"]> | null;
  incomingTick: number | null;
  steps: TeamDeskStep[];
  outcome: { tick: number | null; status: string | null; negDelta: number | null; reason: string | null } | null;
  /** Status of the latest event (would, sent, filled, expired…). */
  status: string | null;
}

export interface TeamDeskTeam {
  team: string;
  chains: TeamDeskChain[];
  /** Σ negDelta of filled counters. */
  negWon: number;
  /** Σ negIfFilled of the latest counter of each chain still open. */
  negOpen: number;
}

/**
 * Chains per team: incoming → counter → steps → outcome. A chain is keyed by the to-me offer id; events without one
 * join the chain of the offer they replace (`counter.replaces`), else of the same team and card.
 */
export function teamDeskOf(lines: readonly TeamDeskLine[]): TeamDeskTeam[] {
  const chains = new Map<string, TeamDeskChain & { team: string }>();
  const byOffer = new Map<number, string>();
  const byRef = new Map<string, string>();
  for (const l of lines) {
    const c = l.counter ?? null;
    const key =
      l.incoming?.id != null
        ? `${l.team}|in:${l.incoming.id}`
        : (c?.replaces != null ? byOffer.get(c.replaces) : undefined) ?? (c?.offerId != null ? byOffer.get(c.offerId) : undefined) ?? byRef.get(`${l.team}|${c?.ref ?? ""}`) ?? `${l.team}|ref:${c?.ref ?? "?"}`;
    let ch = chains.get(key);
    if (!ch) {
      ch = { key, team: l.team, venue: l.venue ?? null, incoming: null, incomingTick: null, steps: [], outcome: null, status: null };
      chains.set(key, ch);
    }
    if (l.venue) ch.venue = l.venue;
    if (l.incoming && !ch.incoming) {
      ch.incoming = l.incoming;
      ch.incomingTick = l.tick ?? null;
    }
    if (c?.ref) byRef.set(`${l.team}|${c.ref}`, key);
    if (c?.offerId != null) byOffer.set(c.offerId, key);
    if (l.event === "outcome") ch.outcome = { tick: l.tick ?? null, status: l.status ?? null, negDelta: l.negDelta ?? null, reason: l.reason ?? null };
    else if (l.event !== "incoming" || c)
      ch.steps.push({
        tick: l.tick ?? null,
        event: l.event,
        status: l.status ?? null,
        offerId: c?.offerId ?? null,
        ref: c?.ref ?? null,
        price: c?.price ?? null,
        anchor: c?.anchor ?? null,
        floor: c?.floor ?? null,
        serverValue: c?.serverValue ?? null,
        negIfFilled: c?.negIfFilled ?? null,
        reason: l.reason ?? null,
      });
    ch.status = l.status ?? ch.status;
  }
  const teams = new Map<string, TeamDeskTeam>();
  for (const ch of chains.values()) {
    const t = teams.get(ch.team) ?? { team: ch.team, chains: [], negWon: 0, negOpen: 0 };
    const { team: _team, ...chain } = ch;
    t.chains.push(chain);
    if (ch.outcome?.status === "filled") t.negWon += ch.outcome.negDelta ?? 0;
    else if (!ch.outcome && ch.status !== "cancelled") t.negOpen += [...ch.steps].reverse().find((s) => s.negIfFilled !== null)?.negIfFilled ?? 0;
    teams.set(ch.team, t);
  }
  const r2 = (x: number) => Math.round(x * 10) / 10;
  return [...teams.values()]
    .map((t) => ({ ...t, negWon: r2(t.negWon), negOpen: r2(t.negOpen), chains: t.chains.reverse() }))
    .sort((a, b) => b.negWon - a.negWon || b.negOpen - a.negOpen || a.team.localeCompare(b.team));
}
