import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Catalog } from "../shared/schemas.js";
import type { RivalSignals } from "../trades/trades.js";
import { parseFeed, type FeedEvent } from "./world.js";

/**
 * What other teams hold and want, estimated from public structure only (never from text):
 * - a card is SEEN with a team when it receives it in a settlement, offers it (El Rastro, another venue or a
 *   thread with a dealer: `give.assets` carries the asset id) or gets it as the best card of a pack;
 * - a card is WANTED by a team when it asks for it (`want.assets`, `want.types` "card:REF") or opens a thread to buy it;
 * - the leaderboard bounds each collection (`album_filled`, `pages_complete`, `rarest`).
 * The ledger accumulates across ticks (`results/bazaar-live/rivals.json`); the first time it is seeded from the
 * recorder (`stream-public.jsonl`), since the feed only carries the latest events.
 */

const SCHEMA = "rivals-ledger/v1";
const TEAM_ID = /^t\d+$/;

/** `card`: the asset's history (`/api/cards/{id}`) placed it after the last public sighting. */
export type SightingSource = "settlement" | "offer" | "pack" | "card";

export interface AssetSighting {
  ref: string;
  /** Who held it at `tick` (a team id, a dealer or `burned`). */
  holder: string;
  tick: number;
  source: SightingSource;
  /** Last tick `/api/cards/{id}` showed no move since the sighting (the holder is still the same). */
  confirmedTick?: number;
}

export interface BoardSnapshot {
  tick: number;
  albumFilled?: number;
  albumSlots?: number;
  pagesComplete?: number;
  rarest?: string;
  deals?: number;
  score?: number;
  rank?: number;
}

export interface RivalLedger {
  schema: typeof SCHEMA;
  /** Highest feed event id already ingested (events are applied once). */
  lastEventId: number;
  /** Latest sighting per asset id. */
  assets: Record<string, AssetSighting>;
  /** Cards each team asked for: team → ref → last tick seen. */
  wants: Record<string, Record<string, number>>;
  /** Latest leaderboard row per team. */
  boards: Record<string, BoardSnapshot>;
  /** Every leaderboard row read per team, oldest first (at most `MAX_HISTORY`). */
  history: Record<string, BoardSnapshot[]>;
}

export const emptyRivalLedger = (): RivalLedger => ({ schema: SCHEMA, lastEventId: 0, assets: {}, wants: {}, boards: {}, history: {} });

/** Leaderboard rows kept per team (one every 5 ticks: a whole game day and more). */
export const MAX_HISTORY = 400;

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" && x !== "" ? x : undefined);
const list = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);

function see(ledger: RivalLedger, assetId: unknown, ref: unknown, holder: unknown, tick: number, source: SightingSource): void {
  const id = num(assetId);
  const r = str(ref);
  const h = str(holder);
  if (id === undefined || !r || !h) return;
  const prev = ledger.assets[String(id)];
  // A settlement at the same tick beats an offer (the offer is what it was traded from).
  if (prev && (prev.tick > tick || (prev.tick === tick && prev.source === "settlement" && source !== "settlement"))) return;
  ledger.assets[String(id)] = { ref: r, holder: h, tick, source };
}

function want(ledger: RivalLedger, team: unknown, ref: unknown, tick: number): void {
  const t = str(team);
  const r = str(ref);
  if (!t || !r || !TEAM_ID.test(t)) return;
  const byRef = (ledger.wants[t] ??= {});
  if ((byRef[r] ?? -1) < tick) byRef[r] = tick;
}

/** Cards an offer gives (seen with its maker) and asks for (wanted by its maker). */
function readOffer(ledger: RivalLedger, raw: unknown, tick: number): void {
  const o = obj(raw);
  const maker = str(o.maker);
  if (!maker) return;
  for (const a of list(obj(o.give).assets)) see(ledger, obj(a).id, obj(a).ref, maker, tick, "offer");
  const w = obj(o.want);
  for (const a of list(w.assets)) want(ledger, maker, obj(a).ref, tick);
  for (const t of list(w.types)) if (typeof t === "string" && t.startsWith("card:")) want(ledger, maker, t.slice(5), tick);
}

/** Applies feed events newer than the last one ingested (events without an id are applied always: idempotent). */
export function ingestEvents(ledger: RivalLedger, events: readonly FeedEvent[]): void {
  const sorted = [...events].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  for (const e of sorted) {
    if (e.id !== undefined && e.id <= ledger.lastEventId) continue;
    const p = e.payload;
    if (e.type === "settlement") {
      for (const i of list(p.items)) see(ledger, obj(i).id, obj(i).ref, obj(i).to, num(p.tick) ?? e.tick, "settlement");
    } else if (e.type === "offer.listed") {
      readOffer(ledger, p.offer, e.tick);
    } else if (e.type === "thread.message") {
      readOffer(ledger, p.offer, e.tick);
    } else if (e.type === "thread.opened") {
      want(ledger, p.team, obj(obj(obj(p.topic).buy)).card, e.tick);
    } else if (e.type === "pack.opened") {
      const best = obj(p.best);
      see(ledger, best.id, best.ref, p.team, e.tick, "pack");
    }
    if (e.id !== undefined) ledger.lastEventId = Math.max(ledger.lastEventId, e.id);
  }
}

/** Latest leaderboard row per team (`/api/leaderboard`, read every few ticks). */
export function ingestLeaderboard(ledger: RivalLedger, raw: unknown, tick: number): void {
  const lb = obj(raw);
  const at = num(lb.tick) ?? tick;
  for (const t of list(lb.teams)) {
    const r = obj(t);
    const team = str(r.team);
    if (!team) continue;
    const rarest = obj(r.rarest);
    const snap: BoardSnapshot = { tick: at };
    const set = <K extends keyof BoardSnapshot>(k: K, v: BoardSnapshot[K] | undefined) => {
      if (v !== undefined) snap[k] = v;
    };
    set("albumFilled", num(r.album_filled));
    set("albumSlots", num(r.album_slots));
    set("pagesComplete", num(r.pages_complete));
    set("rarest", str(rarest.ref));
    set("deals", num(r.deals));
    set("score", num(r.score));
    set("rank", num(r.rank));
    ledger.boards[team] = snap;
    const h = (ledger.history[team] ??= []);
    if (h.at(-1)?.tick !== snap.tick) h.push(snap);
    if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY);
  }
}

// ---------------------------------------------------------------- confirmation with /api/cards

/** Ticks a confirmation stays fresh: the asset is not asked for again before. */
export const CONFIRM_FRESH_TICKS = 10;

/**
 * Assets worth confirming this tick: held by another team and of a card in `refs` (page cards we lack), least
 * recently confirmed first. The caller asks `/api/cards/{id}` for at most `max` of them.
 */
export function confirmCandidates(ledger: RivalLedger, us: string | undefined, refs: ReadonlySet<string>, tick: number, max: number): number[] {
  return Object.entries(ledger.assets)
    .filter(([, a]) => TEAM_ID.test(a.holder) && a.holder !== us && refs.has(a.ref) && tick - (a.confirmedTick ?? -Infinity) >= CONFIRM_FRESH_TICKS)
    .sort(([, a], [, b]) => (a.confirmedTick ?? a.tick) - (b.confirmedTick ?? b.tick))
    .slice(0, Math.max(0, max))
    .map(([id]) => Number(id));
}

/**
 * Applies an asset's `/api/cards/{id}` body: with no move after the sighting, the holder is confirmed at `tick`; with a
 * later move, the asset goes to its new owner (a dealer, `burned`, us) or, if the API hides it ("a team"), to nobody we
 * can name (it leaves every rival's list). Returns what happened, for the log.
 */
export function applyCardHistory(ledger: RivalLedger, assetId: number, raw: unknown, tick: number): "confirmed" | "moved" | "unknown" {
  const a = ledger.assets[String(assetId)];
  const body = obj(obj(raw).data ?? raw);
  if (!a) return "unknown";
  const moves = list(body.history).map(obj);
  const last = moves.reduce<number | undefined>((m, h) => (num(h.tick) !== undefined && (m === undefined || num(h.tick)! > m) ? num(h.tick) : m), undefined);
  if (last === undefined) return "unknown";
  if (last <= a.tick) {
    a.confirmedTick = tick;
    return "confirmed";
  }
  const owner = str(body.owner) ?? "a team";
  ledger.assets[String(assetId)] = { ref: a.ref, holder: owner, tick: last, source: "card" };
  return "moved";
}

/** Events from the recorder's public stream files (`<dir>/<date>/stream-public.jsonl`), oldest first. */
export function readRecordedEvents(bazaarDir: string): FeedEvent[] {
  let dates: string[];
  try {
    dates = readdirSync(bazaarDir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  } catch {
    return [];
  }
  const raw: unknown[] = [];
  for (const d of dates) {
    const file = join(bazaarDir, d, "stream-public.jsonl");
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const data = obj(JSON.parse(line)).data;
        if (data) raw.push(data);
      } catch {
        // truncated line (the recorder may be writing it): skipped
      }
    }
  }
  return parseFeed(raw);
}

export const defaultRivalsFile = (root: string) => join(root, "results", "bazaar-live", "rivals.json");

/** Ledger on disk; if there is none (or it is unreadable), a new one seeded from the recorder. */
export function loadRivalLedger(file: string, bazaarDir: string): RivalLedger {
  try {
    if (existsSync(file)) {
      const d = JSON.parse(readFileSync(file, "utf8")) as Partial<RivalLedger>;
      if (d.schema === SCHEMA) return { ...emptyRivalLedger(), ...d, schema: SCHEMA };
    }
  } catch {
    // unreadable: rebuilt from the recorder below
  }
  const ledger = emptyRivalLedger();
  ingestEvents(ledger, readRecordedEvents(bazaarDir));
  return ledger;
}

export function saveRivalLedger(file: string, ledger: RivalLedger): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ ...ledger, updated: new Date().toISOString() })}\n`);
  renameSync(tmp, file);
}

// ---------------------------------------------------------------- view

export interface RivalPage {
  set: string;
  /** Distinct page cards seen with the team. */
  have: number;
  of: number;
  /** Page cards not seen with the team (all of them if `have` is low: read with `have`). */
  missing: string[];
}

export interface RivalTeam {
  team: string;
  /** Cards seen with the team and not seen leaving it since (latest sighting per asset). */
  seen: { assetId: number; ref: string; tick: number; source: SightingSource; confirmedTick?: number }[];
  distinct: number;
  /** Refs seen more than once (spares they could sell). */
  spares: string[];
  board?: BoardSnapshot;
  /** Leaderboard rows over time, oldest first (score, rank, album); absent when none was read. */
  history?: BoardSnapshot[];
  /** Album cards we cannot see: `albumFilled` − distinct page cards seen (0 if the board is older or absent). */
  unseen?: number;
  /** Pages by how much of them we have seen, fullest first. */
  pages: RivalPage[];
  /** Cards the team asked for and has not been seen getting since, newest first. */
  wants: { ref: string; tick: number }[];
}

export interface RivalsState {
  teams: RivalTeam[];
  /** Per card: teams seen holding it and teams that asked for it. */
  byRef: Record<string, { holders: string[]; wantedBy: string[] }>;
  /** Assets with a known team holder (all teams but us). */
  seenAssets: number;
  lastEventId: number;
}

/** Page cards per set from the catalog (`page: true`, not hidden). */
function pageCards(catalog: Catalog | undefined): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const s of catalog?.sets ?? []) {
    const refs = s.cards.filter((c) => (c as { page?: unknown }).page !== false && (c as { hidden?: unknown }).hidden !== true).map((c) => c.id);
    if (s.id && refs.length) out.set(s.id, refs);
  }
  return out;
}

/** Per-team view of the ledger (we are left out: our holdings come from `/api/me`). */
export function rivalsView(ledger: RivalLedger, us: string | undefined, catalog: Catalog | undefined): RivalsState {
  const pages = pageCards(catalog);
  const byTeam = new Map<string, RivalTeam["seen"]>();
  for (const [id, a] of Object.entries(ledger.assets)) {
    if (!TEAM_ID.test(a.holder) || a.holder === us) continue;
    const arr = byTeam.get(a.holder) ?? [];
    arr.push({ assetId: Number(id), ref: a.ref, tick: a.tick, source: a.source, ...(a.confirmedTick !== undefined ? { confirmedTick: a.confirmedTick } : {}) });
    byTeam.set(a.holder, arr);
  }
  const teams = new Set([...byTeam.keys(), ...Object.keys(ledger.wants), ...Object.keys(ledger.boards)].filter((t) => TEAM_ID.test(t) && t !== us));
  const byRef: RivalsState["byRef"] = {};
  const slot = (ref: string) => (byRef[ref] ??= { holders: [], wantedBy: [] });
  const out: RivalTeam[] = [];
  for (const team of [...teams].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
    const seen = (byTeam.get(team) ?? []).sort((a, b) => b.tick - a.tick);
    const count = new Map<string, number>();
    for (const s of seen) count.set(s.ref, (count.get(s.ref) ?? 0) + 1);
    const refs = new Set(count.keys());
    const teamPages: RivalPage[] = [...pages].map(([set, cards]) => {
      const have = cards.filter((r) => refs.has(r));
      return { set, have: have.length, of: cards.length, missing: cards.filter((r) => !refs.has(r)) };
    });
    const board = ledger.boards[team];
    const distinctPage = [...refs].filter((r) => [...pages.values()].some((cards) => cards.includes(r))).length;
    // A want is still open unless the card was seen with the team at or after the ask.
    const lastSeen = new Map<string, number>();
    for (const x of seen) lastSeen.set(x.ref, Math.max(lastSeen.get(x.ref) ?? -1, x.tick));
    const wants = Object.entries(ledger.wants[team] ?? {})
      .filter(([ref, tick]) => (lastSeen.get(ref) ?? -1) < tick)
      .map(([ref, tick]) => ({ ref, tick }))
      .sort((a, b) => b.tick - a.tick);
    for (const r of refs) slot(r).holders.push(team);
    for (const w of wants) slot(w.ref).wantedBy.push(team);
    out.push({
      team,
      seen,
      distinct: refs.size,
      spares: [...count].filter(([, n]) => n > 1).map(([r]) => r),
      ...(board ? { board } : {}),
      history: ledger.history[team] ?? [],
      ...(board?.albumFilled !== undefined ? { unseen: Math.max(0, board.albumFilled - distinctPage) } : {}),
      pages: teamPages.filter((p) => p.have > 0).sort((a, b) => b.have / b.of - a.have / a.of),
      wants,
    });
  }
  return { teams: out, byRef, seenAssets: out.reduce((n, t) => n + t.seen.length, 0), lastEventId: ledger.lastEventId };
}

/**
 * El Rastro signals (`TradeState.rivals`): demand = cards a team asked for in the last `maxAge` ticks or that leave it
 * at most 2 from a page; supply = cards a rival was seen with (or confirmed holding) in the last `maxAge` ticks.
 */
export function tradeSignals(r: RivalsState, tick: number, maxAge = 60): RivalSignals {
  const demand = new Map<string, string[]>();
  const add = (ref: string, team: string) => {
    const arr = demand.get(ref) ?? [];
    if (!arr.includes(team)) arr.push(team);
    demand.set(ref, arr);
  };
  const supply = new Set<string>();
  for (const t of r.teams) {
    for (const w of t.wants) if (tick - w.tick <= maxAge) add(w.ref, t.team);
    for (const p of t.pages) if (p.of - p.have <= 2) for (const ref of p.missing) add(ref, t.team);
    for (const s of t.seen) if (tick - (s.confirmedTick ?? s.tick) <= maxAge) supply.add(s.ref);
  }
  return { demand, supply };
}

/** Console summary: the teams closest to a page (what they still lack is what they would pay for). */
export function formatRivals(r: RivalsState, top = 4): string[] {
  const near = r.teams
    .flatMap((t) => t.pages.filter((p) => p.have < p.of && p.of - p.have <= 3).map((p) => ({ team: t.team, p })))
    .sort((a, b) => a.p.of - a.p.have - (b.p.of - b.p.have))
    .slice(0, top)
    .map(({ team, p }) => `${team} ${p.set} ${p.have}/${p.of} (lacks ${p.missing.join(" ")})`);
  return [`rivals: ${r.teams.length} teams · ${r.seenAssets} cards seen with a team${near.length ? ` · near a page: ${near.join(" · ")}` : ""}`];
}
