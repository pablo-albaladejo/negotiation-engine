import { mkdir, open, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { TokenBucket } from "../../src/bazaar/client.js";
import { loadBazaarEnv } from "../../src/bazaar/env.js";
import type { ApiResponse } from "./api.js";
import {
  BoardClockSchema,
  BoardDuelSchema,
  BoardMeSchema,
  BoardThreadSchema,
  bookLines,
  buildRows,
  DecisionSchema,
  emptyCache,
  FeedEventSchema,
  feedLine,
  headerOf,
  leaderLines,
  LessonSchema,
  OUR_TEAM_FALLBACK,
  ourSettlements,
  parseCache,
  parseList,
  parseOffers,
  pendingValueRequests,
  ScoreLineSchema,
  type BoardInput,
  type BoardRow,
  type BookLine,
  type Decision,
  type FeedLine,
  type LeaderLine,
  type ScoreLine,
  type VerdictCache,
} from "./bazaar-board-core.js";
import { agentStatuses, type AgentStatus } from "./bazaar-agents.js";
import { albumOf, holdingsOf, missingWithoutValue, scheduleOf, type AlbumOut, type ScheduleOut } from "./bazaar-cockpit-core.js";
import { isSafeId, resolveInside } from "./paths.js";
import { readJsonl } from "./read.js";

/**
 * `GET /api/bazaar/board`: la vista unificada del Bazaar. Un ciclo por tick del juego (programado
 * con `next_tick_in` de `/api/clock`, nunca un sondeo apretado) hace solo GET al Bazaar a través
 * de un cubo de fichas de ≤ 2 req/s para todo el ciclo; los navegadores reciben la copia cacheada.
 * La clave del equipo vive solo en este proceso: se envía solo en las rutas privadas y nunca sale
 * en la respuesta ni en un log. Escribe un único fichero, `verdicts.json` en la fecha de hoy bajo
 * `VIEWER_BAZAAR_DIR`, para que el valor de cada trato (calculado una vez) sobreviva a reinicios.
 */

const ok = (data: unknown): ApiResponse => ({ status: 200, body: { data, errors: [] } });

export interface BoardClockOut {
  tick: number;
  round: number | null;
  round_name: string | null;
  next_tick_in: number | null;
  tick_seconds: number | null;
  doors: string | null;
  today_name: string | null;
}

export interface BoardVenueOut {
  venue: string;
  name: string | null;
  status: string | null;
  trades: number | null;
  volume: number | null;
  book: BookLine[];
}

export interface BoardOut {
  team: string;
  live: boolean;
  source: "api" | "snapshot" | "none";
  fetched_tick: number | null;
  next_refresh_ms: number;
  clock: BoardClockOut | null;
  header: ReturnType<typeof headerOf>;
  rows: BoardRow[];
  market: { leaderboard: LeaderLine[]; feed: FeedLine[]; rastro: BookLine[]; venue: BoardVenueOut | null };
  /** Páginas del álbum con las cartas que faltan (cabina). */
  album: AlbumOut | null;
  /** Copias que tenemos de cada carta (para saber si una oferta vende una repetida o la única). */
  holdings: Record<string, number>;
  schedule: ScheduleOut | null;
  agents: AgentStatus[];
}

export interface BazaarBoardDeps {
  loadEnv?: typeof loadBazaarEnv;
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** Peticiones por segundo al Bazaar para todo el visor (por defecto 2; el juego permite 5). */
  ratePerSec?: number;
  minRefreshMs?: number;
  lessonsFile?: string | null;
  /** `snapshots.jsonl` del monitor de causa-prima (`{ts, endpoint, status, body}`), solo lectura y solo como respaldo. */
  snapshotsFile?: string | null;
  feedLimit?: number;
}

const PRIVATE = /^\/api\/(me|duels|threads)(\/|\?|$)/;
const MAX_VALUE_LOOKUPS = 4;
/** Valores privados de cartas que faltan consultados por ciclo (el resto, en ciclos siguientes). */
const MAX_MISSING_LOOKUPS = 3;
/** El catálogo apenas cambia: se relee como mucho una vez por hora. */
const CATALOG_TTL_MS = 3_600_000;

async function datesOf(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((d) => isSafeId(d) && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  } catch {
    return [];
  }
}

async function readAllJsonl<S extends z.ZodType>(dir: string, name: (f: string) => boolean, schema: S): Promise<z.infer<S>[]> {
  const out: z.infer<S>[] = [];
  for (const date of await datesOf(dir)) {
    let files: string[];
    try {
      files = (await readdir(join(dir, date))).filter((f) => isSafeId(f) && name(f)).sort();
    } catch {
      continue;
    }
    for (const f of files) {
      const path = await resolveInside(dir, date, f);
      if (!path) continue;
      out.push(...(await readJsonl(path, `${date}/${f}`, schema)).data);
    }
  }
  return out;
}

async function readJsonFile(path: string | null | undefined): Promise<unknown> {
  if (!path) return null;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

/** Último cuerpo por endpoint del `snapshots.jsonl` del monitor (lee solo la cola del fichero). */
export async function readSnapshotTail(file: string | null | undefined, bytes = 2_000_000): Promise<Map<string, unknown>> {
  const out = new Map<string, unknown>();
  if (!file) return out;
  try {
    const fh = await open(file, "r");
    try {
      const size = (await fh.stat()).size;
      const start = Math.max(0, size - bytes);
      const buf = Buffer.alloc(size - start);
      await fh.read(buf, 0, buf.length, start);
      for (const line of buf.toString("utf8").split("\n")) {
        try {
          const j = JSON.parse(line) as { endpoint?: unknown; status?: unknown; body?: unknown };
          if (typeof j.endpoint === "string" && j.status === 200) out.set(j.endpoint, j.body);
        } catch {
          // línea parcial (inicio de la cola) o corrupta
        }
      }
    } finally {
      await fh.close();
    }
  } catch {
    // sin fichero: sin respaldo
  }
  return out;
}

export class BazaarBoard {
  private cache: { refreshAt: number; data: BoardOut } | null = null;
  private inflight: Promise<BoardOut> | null = null;
  private bucket: TokenBucket;
  private last = new Map<string, unknown>();
  private catalog: { at: number; raw: unknown } | null = null;
  /** Valor privado de cartas que nos faltan; se invalida cuando cambia lo que tenemos (`filled`). */
  private missingValues = new Map<string, number>();
  private missingValuesKey: string | null = null;

  constructor(
    private readonly bazaarDir: string,
    private readonly deps: BazaarBoardDeps = {},
  ) {
    // El cubo usa siempre el reloj real (`now` inyectable solo afecta a la caché y a la fecha).
    const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    this.bucket = new TokenBucket(deps.ratePerSec ?? 2, 2, Date.now, sleep);
  }

  async get(): Promise<ApiResponse> {
    const now = this.deps.now ?? Date.now;
    if (this.cache && now() < this.cache.refreshAt) return ok({ ...this.cache.data, next_refresh_ms: Math.max(1_000, this.cache.refreshAt - now()) });
    this.inflight ??= this.cycle().finally(() => {
      this.inflight = null;
    });
    return ok(await this.inflight);
  }

  /** GET al Bazaar (cubo compartido). La clave solo va en rutas privadas; un fallo devuelve el último
   * cuerpo bueno de esa ruta (o `null`), sin volcar nada de la respuesta. */
  private async getJson(url: string, key: string | undefined, path: string): Promise<unknown> {
    const isPrivate = PRIVATE.test(path);
    if (isPrivate && !key) return null;
    const fetchFn = this.deps.fetch ?? fetch;
    try {
      await this.bucket.take();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (isPrivate && key) headers["X-Team-Key"] = key;
      const res = await fetchFn(url + path, { method: "GET", headers, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const body: unknown = await res.json();
      this.last.set(path, body);
      return body;
    } catch {
      return this.last.get(path) ?? null;
    }
  }

  private async cycle(): Promise<BoardOut> {
    const now = this.deps.now ?? Date.now;
    const env = (this.deps.loadEnv ?? loadBazaarEnv)();
    const get = (path: string) => this.getJson(env.url, env.key, path);
    const field = (raw: unknown, k: string): unknown => (raw && typeof raw === "object" ? (raw as Record<string, unknown>)[k] : undefined);

    let clockRaw = await get("/api/clock");
    let leaderRaw = await get("/api/leaderboard");
    let feedRaw = await get(`/api/feed?limit=${this.deps.feedLimit ?? 200}`);
    let rastroRaw = await get("/api/venues/rastro/offers");
    let source: BoardOut["source"] = clockRaw ? "api" : "none";
    if (!clockRaw || !leaderRaw || !feedRaw || !rastroRaw) {
      const snap = await readSnapshotTail(this.deps.snapshotsFile);
      if (!clockRaw && snap.has("clock")) source = "snapshot";
      clockRaw ??= snap.get("clock") ?? null;
      leaderRaw ??= snap.get("leaderboard") ?? null;
      feedRaw ??= snap.get("feed") ?? null;
      rastroRaw ??= snap.get("rastro_offers") ?? null;
    }
    const clockP = BoardClockSchema.safeParse(clockRaw);
    const clock = clockP.success ? clockP.data : null;

    const meRaw = await get("/api/me");
    const meP = BoardMeSchema.safeParse(meRaw);
    const me = meP.success ? meP.data : null;
    const team = me?.id ?? OUR_TEAM_FALLBACK;
    const threadsRaw = await get("/api/me/threads");
    const duelsOpen = await get("/api/duels");
    const duelsDone = await get("/api/duels?done=true");
    const offersRaw = await get("/api/me/offers");
    const venueId = me?.venue?.venue ?? null;
    const venueRaw = venueId && isSafeId(venueId) ? await get(`/api/venues/${encodeURIComponent(venueId)}/offers`) : null;

    const events = parseList(FeedEventSchema, field(feedRaw, "events"));
    const cache = await this.readCache();
    let dirty = false;
    for (const s of ourSettlements(events, team)) {
      if (!cache.settlements[String(s.settlement)]) {
        cache.settlements[String(s.settlement)] = s;
        dirty = true;
      }
    }

    const duelMap = new Map<number, z.infer<typeof BoardDuelSchema>>();
    for (const d of [...parseList(BoardDuelSchema, field(duelsDone, "duels")), ...parseList(BoardDuelSchema, field(duelsOpen, "duels"))]) duelMap.set(d.duel, d);

    const decisions: Decision[] = await readAllJsonl(this.bazaarDir, (f) => f === "decisions.jsonl" || /^thread-\d+\.jsonl$/.test(f), DecisionSchema);
    const scoreLines: ScoreLine[] = await readAllJsonl(this.bazaarDir, (f) => f === "score.jsonl", ScoreLineSchema);
    const lessons = parseList(LessonSchema, field(await readJsonFile(this.deps.lessonsFile), "conversations"));

    const apiValues = new Map<string, number>();
    const input: BoardInput = {
      team,
      nowTick: clock?.tick ?? null,
      me,
      threads: parseList(BoardThreadSchema, field(threadsRaw, "threads")),
      duels: [...duelMap.values()],
      myOffers: parseOffers(field(offersRaw, "offers")),
      settlements: Object.values(cache.settlements),
      decisions,
      scoreLines,
      lessons,
      cache,
      apiValues,
    };
    for (const req of pendingValueRequests(input).slice(0, MAX_VALUE_LOOKUPS)) {
      if (apiValues.has(req.ref)) continue;
      const v = field(await get(`/api/me/value?card=${encodeURIComponent(req.ref)}`), "your_value");
      if (typeof v === "number") apiValues.set(req.ref, v);
    }
    const { rows, newValues } = buildRows(input);
    if (Object.keys(newValues).length > 0) {
      Object.assign(cache.values, newValues);
      dirty = true;
    }
    if (dirty) await this.writeCache(cache);

    if (!this.catalog || now() - this.catalog.at > CATALOG_TTL_MS) {
      const raw = await get("/api/catalog");
      if (raw) this.catalog = { at: now(), raw };
    }
    const holdings = holdingsOf(meRaw);
    const holdingsKey = JSON.stringify(holdings);
    if (holdingsKey !== this.missingValuesKey) {
      this.missingValues.clear();
      this.missingValuesKey = holdingsKey;
    }
    for (const ref of missingWithoutValue(albumOf(meRaw, this.catalog?.raw ?? null, this.missingValues), MAX_MISSING_LOOKUPS)) {
      const v = field(await get(`/api/me/value?card=${encodeURIComponent(ref)}`), "your_value");
      if (typeof v === "number") this.missingValues.set(ref, v);
    }
    const album = albumOf(meRaw, this.catalog?.raw ?? null, this.missingValues);
    const schedule = scheduleOf(await get("/api/schedule"));
    const myOffers = parseOffers(field(offersRaw, "offers")).filter((o) => o.maker === team);
    const ourIds = new Set(myOffers.map((o) => o.id));
    const tradesTick = myOffers.reduce<number | null>((m, o) => (o.created_tick != null && (m === null || o.created_tick > m) ? o.created_tick : m), null);
    const agents: AgentStatus[] = [
      ...(await agentStatuses(this.bazaarDir)),
      { agent: "trades", last_at: null, last_tick: tradesTick, detail: `${myOffers.length} open offers` },
    ];

    const refreshIn = Math.max(this.deps.minRefreshMs ?? 5_000, clock?.next_tick_in != null ? clock.next_tick_in * 1000 + 2_000 : 30_000);
    const venue: BoardVenueOut | null = venueId
      ? { venue: venueId, name: me?.venue?.name ?? null, status: me?.venue?.status ?? null, trades: me?.venue?.trades ?? null, volume: me?.venue?.volume ?? null, book: bookLines(field(venueRaw, "offers"), 40, ourIds) }
      : null;
    const data: BoardOut = {
      team,
      live: Boolean(env.key) && me !== null,
      source,
      fetched_tick: clock?.tick ?? null,
      next_refresh_ms: refreshIn,
      clock: clock
        ? { tick: clock.tick, round: clock.round ?? null, round_name: clock.round_name ?? null, next_tick_in: clock.next_tick_in ?? null, tick_seconds: clock.tick_seconds ?? null, doors: clock.doors ?? null, today_name: clock.today_name ?? null }
        : null,
      header: headerOf(me, team),
      rows,
      market: { leaderboard: leaderLines(leaderRaw, team), feed: events.slice(-20).reverse().map(feedLine), rastro: bookLines(field(rastroRaw, "offers"), 40, ourIds), venue },
      album,
      holdings,
      schedule,
      agents,
    };
    this.cache = { refreshAt: now() + refreshIn, data };
    return data;
  }

  private today(): string {
    return new Date((this.deps.now ?? Date.now)()).toISOString().slice(0, 10);
  }

  /** Caché de veredictos: se fusionan las de todas las fechas (la de hoy manda). */
  private async readCache(): Promise<VerdictCache> {
    const merged = emptyCache();
    for (const date of await datesOf(this.bazaarDir)) {
      const path = await resolveInside(this.bazaarDir, date, "verdicts.json");
      if (!path) continue;
      const c = parseCache(await readJsonFile(path));
      Object.assign(merged.values, c.values);
      Object.assign(merged.settlements, c.settlements);
    }
    return merged;
  }

  private async writeCache(cache: VerdictCache): Promise<void> {
    try {
      const dir = join(this.bazaarDir, this.today());
      await mkdir(dir, { recursive: true });
      const file = join(dir, "verdicts.json");
      const tmp = `${file}.tmp`;
      await writeFile(tmp, JSON.stringify({ ...cache, updated: new Date((this.deps.now ?? Date.now)()).toISOString() }, null, 2) + "\n");
      await rename(tmp, file);
    } catch {
      // sin permiso de escritura: el veredicto se recalcula en el siguiente ciclo
    }
  }
}
