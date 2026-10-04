import { mkdir, open, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { venueBooksOf, type VenueBooksOut } from "./venues/venue-books.js";
import { offerOriginsOf, PlanLineSchema, type OfferOrigin } from "./venues/offer-origins.js";
import { directedOffersOf, type DirectedOffer } from "./venues/directed-offers.js";
import { readOurThreadEvents } from "./profile/egg-flow.js";
import { eggsOf, type EggsOut } from "./profile/eggs.js";
import { grantsOf, type Grant } from "./profile/grants.js";
import { marketTestOf, type MarketTestOut } from "./market-test/market-test.js";
import { forexOf, type ForexOut } from "./forex/forex.js";
import { forexThreadsOf } from "./forex/forex-threads.js";
import { TokenBucket } from "../../../src/shared/client.js";
import { loadBazaarEnv } from "../../../src/shared/env.js";
import type { ApiResponse } from "../api.js";
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
  ScoreAuditSchema,
  DuelPointsSchema,
  OUR_TEAM_FALLBACK,
  feedSettlements,
  otherTradeRows,
  StreamLineSchema,
  streamSettlements,
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
import { agentStatuses, playMode, type AgentStatus } from "./bazaar-agents.js";
import { albumOf, holdingsOf, missingWithoutValue, scheduleOf, scoreNumbers, scorePartsOf, ScorePartsLineSchema, offerExpiriesOf, teamDeskOf, TeamDeskLineSchema, type TeamDeskTeam, type AlbumOut, type ScheduleOut, type ScorePartsLine, type ScorePartsOut } from "./bazaar-cockpit-core.js";
import { isSafeId, resolveInside } from "../paths.js";
import { readJsonl } from "../read.js";
import { workshopOf, type WorkshopOut } from "./bazaar-workshop.js";

/**
 * `GET /api/bazaar/board`: the unified Bazaar view. One cycle per game tick (scheduled
 * with `next_tick_in` from `/api/clock`, never tight polling) makes only GETs to the Bazaar through
 * a token bucket of ≤ 2 req/s for the whole cycle; browsers get the cached copy.
 * The team key lives only in this process: it is sent only on private routes and never appears
 * in the response or in a log. It writes a single file, `verdicts.json` under today's date in
 * `VIEWER_BAZAAR_DIR`, so each deal's value (computed once) survives restarts.
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
  /** Settlements between other parties (we are not in them), newest first. */
  others: BoardRow[];
  market: { leaderboard: LeaderLine[]; feed: FeedLine[]; rastro: BookLine[]; venue: BoardVenueOut | null };
  /** Album pages with the missing cards (cockpit). */
  album: AlbumOut | null;
  /** Copies we hold of each card (to tell whether an offer sells a duplicate or the only one). */
  holdings: Record<string, number>;
  schedule: ScheduleOut | null;
  agents: AgentStatus[];
  /** Mode of the running `bazaar:play` (up-status.json): "live" sends, "dry-run" does not; null if not running. */
  play_mode: "live" | "dry-run" | null;
  /** The Workshop (El Taller): spares by rarity under the sale guardrails and public crafts. Read-only. */
  workshop: WorkshopOut;
  /** Every score part now, at the day's first snapshot and at the previous tick (Δ day / Δ tick). */
  score_parts: ScorePartsOut;
  /** Team desk (`team-desk.jsonl`, today): offers other teams make to us, our counters and outcomes, per team. */
  team_desk: TeamDeskTeam[];
  /** Every open venue's book as play read it (venue-books.json), marked against our hand; null without the file. */
  venue_books: VenueBooksOut | null;
  /** Forex chains A → B → C as play found them this tick (forex.json); null without the file. */
  forex: ForexOut | null;
  /** Where each of our open offers comes from (plan.jsonl), by offer id. */
  offer_origins: Record<string, OfferOrigin>;
  /** Directed offers between other teams, last ~60 ticks (public stream; structure only). */
  directed: DirectedOffer[];
  /** Easter eggs: ours (probe, prize) and every find per persona (public stream + personas.json). */
  eggs: EggsOut;
  /** Organiser grants to us (admin.grant: allowance, top-ups, news prizes), oldest first: a cash jump that is not a trade. */
  grants: Grant[];
  /** Market test: bench sessions in auto (v04) vs board (v26), official result, book per tick, our matches, live line. */
  market_test: MarketTestOut;
}

export interface BazaarBoardDeps {
  loadEnv?: typeof loadBazaarEnv;
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** Requests per second to the Bazaar for the whole viewer (default 2; the game allows 5). */
  ratePerSec?: number;
  minRefreshMs?: number;
  lessonsFile?: string | null;
  /** `snapshots.jsonl` from the causa-prima monitor (`{ts, endpoint, status, body}`), read-only and only as a fallback. */
  snapshotsFile?: string | null;
  feedLimit?: number;
}

const PRIVATE = /^\/api\/(me|duels|threads)(\/|\?|$)/;
const MAX_VALUE_LOOKUPS = 4;
/** Private values of missing cards queried per cycle (the rest, in following cycles). */
const MAX_MISSING_LOOKUPS = 3;
/** The catalog barely changes: re-read at most once per hour. */
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

/** Our counts per card from play's values.json (`hand`). */
function handOf(valuesRaw: unknown): Record<string, number> {
  const hand = (valuesRaw as { hand?: unknown } | null)?.hand;
  return hand && typeof hand === "object" ? (hand as Record<string, number>) : {};
}

async function readJsonFile(path: string | null | undefined): Promise<unknown> {
  if (!path) return null;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

/** Last body per endpoint from the monitor's `snapshots.jsonl` (reads only the file tail). */
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
          // partial line (start of the tail) or corrupt
        }
      }
    } finally {
      await fh.close();
    }
  } catch {
    // no file: no fallback
  }
  return out;
}

export class BazaarBoard {
  private cache: { refreshAt: number; data: BoardOut } | null = null;
  private inflight: Promise<BoardOut> | null = null;
  private bucket: TokenBucket;
  private last = new Map<string, unknown>();
  private catalog: { at: number; raw: unknown } | null = null;
  /** Private value of cards we are missing; invalidated when what we hold changes (`filled`). */
  private missingValues = new Map<string, number>();
  private missingValuesKey: string | null = null;

  constructor(
    private readonly bazaarDir: string,
    private readonly deps: BazaarBoardDeps = {},
  ) {
    // The bucket always uses the real clock (the injectable `now` only affects the cache and the date).
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

  /** Last good body of `/api/feed` (reused by `/api/bazaar/model` for eggs and triggers). */
  recentFeed(): unknown {
    return this.last.get(`/api/feed?limit=${this.deps.feedLimit ?? 200}`) ?? null;
  }

  /** Catalog, El Rastro book and `/api/me` already read (no new GET) and private values of missing cards. Local only. */
  marketInputs(): { catalog: unknown; rastro: unknown; values: Record<string, number>; me: unknown } {
    return { catalog: this.catalog?.raw ?? null, rastro: this.last.get("/api/venues/rastro/offers") ?? null, values: Object.fromEntries(this.missingValues), me: this.last.get("/api/me") ?? null };
  }

  /** GET to the Bazaar (shared bucket). The key goes only on private routes; a failure returns the last
   * good body of that route (or `null`), without dumping anything from the response. */
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
    // Every settlement (ours and other teams'): the feed only covers recent ones, the recorder the day.
    const streamLines = await readAllJsonl(this.bazaarDir, (f) => f === "stream-public.jsonl", StreamLineSchema);
    const streamed = streamSettlements(streamLines);
    for (const s of [...streamed, ...feedSettlements(events)]) {
      if (!cache.settlements[String(s.settlement)]) {
        cache.settlements[String(s.settlement)] = s;
        dirty = true;
      }
    }

    const duelMap = new Map<number, z.infer<typeof BoardDuelSchema>>();
    for (const d of [...parseList(BoardDuelSchema, field(duelsDone, "duels")), ...parseList(BoardDuelSchema, field(duelsOpen, "duels"))]) duelMap.set(d.duel, d);

    const decisions: Decision[] = await readAllJsonl(this.bazaarDir, (f) => f === "decisions.jsonl" || /^thread-\d+\.jsonl$/.test(f), DecisionSchema);
    const scoreLines: ScoreLine[] = await readAllJsonl(this.bazaarDir, (f) => f === "score.jsonl", ScoreLineSchema);
    const audit = await readAllJsonl(this.bazaarDir, (f) => f === "score-audit.jsonl", ScoreAuditSchema);
    const duelPoints = await readAllJsonl(this.bazaarDir, (f) => f === "duel-points.jsonl", DuelPointsSchema);
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
      audit,
      duelPoints,
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
    const valuesRaw = await readJsonFile(join(this.bazaarDir, "values.json"));
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
      others: otherTradeRows(Object.values(cache.settlements), team),
      market: { leaderboard: leaderLines(leaderRaw, team), feed: events.slice(-20).reverse().map(feedLine), rastro: bookLines(field(rastroRaw, "offers"), 40, ourIds), venue },
      album,
      holdings,
      schedule,
      agents,
      play_mode: await playMode(this.bazaarDir),
      venue_books: venueBooksOf(
        await readJsonFile(join(this.bazaarDir, this.today(), "venue-books.json")),
        valuesRaw,
        await readJsonFile(join(this.bazaarDir, "rivals.json")),
        team,
        this.catalog?.raw ?? null,
      ),
      forex: await this.forex(decisions, lessons, meRaw),
      offer_origins: offerOriginsOf((await readJsonl(join(this.bazaarDir, this.today(), "plan.jsonl"), `${this.today()}/plan.jsonl`, PlanLineSchema)).data, myOffers, clock?.tick ?? null),
      directed: directedOffersOf([...streamLines.flatMap((l) => (l.data ? [l.data] : [])), ...events], clock?.tick ?? null, team, handOf(valuesRaw)),
      grants: await grantsOf(this.bazaarDir, team),
      market_test: await marketTestOf(this.bazaarDir, join(dirname(this.bazaarDir), "logs")),
      eggs: eggsOf([...streamLines.flatMap((l) => (l.data ? [l.data] : [])), ...events], team, await Promise.all((await datesOf(this.bazaarDir)).map((d) => readJsonFile(join(this.bazaarDir, d, "personas.json")))), this.catalog?.raw ?? null, await readOurThreadEvents((await datesOf(this.bazaarDir)).map((d) => join(this.bazaarDir, d, "stream-team.jsonl")), team)),
      team_desk: teamDeskOf(
        (await readJsonl(join(this.bazaarDir, this.today(), "team-desk.jsonl"), `${this.today()}/team-desk.jsonl`, TeamDeskLineSchema)).data,
        offerExpiriesOf([...streamLines.flatMap((l) => (l.data ? [l.data] : [])), ...events]),
        clock?.tick ?? null,
      ),
      score_parts: await this.scoreParts(scoreNumbers(me?.score), clock?.tick ?? null),
      workshop: workshopOf(meRaw, threadsRaw, offersRaw, this.catalog?.raw ?? null, [...streamLines.flatMap((l) => (l.data ? [l.data] : [])), ...events], team),
    };
    this.cache = { refreshAt: now() + refreshIn, data };
    return data;
  }

  /** forex.json with the conversations behind each step (trace, lessons, today's flags.json and our assets). */
  private async forex(decisions: readonly unknown[], lessons: readonly unknown[], meRaw: unknown): Promise<ForexOut | null> {
    const fx = forexOf(await readJsonFile(join(this.bazaarDir, this.today(), "forex.json")));
    if (!fx) return null;
    const flagsRaw = await readJsonFile(join(this.bazaarDir, this.today(), "flags.json"));
    const steps = forexThreadsOf(fx.chains, decisions, lessons, flagsRaw, meRaw, this.today());
    for (const c of fx.chains) c.step_threads = steps[c.id] ?? [];
    return fx;
  }

  private today(): string {
    return new Date((this.deps.now ?? Date.now)()).toISOString().slice(0, 10);
  }

  /** Verdict cache: the ones from all dates are merged (today's wins). */
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

  /** Today's `score-parts.jsonl`: one line per tick with every score part (appended here when the tick is new). */
  private async scoreParts(now: Record<string, number>, tick: number | null): Promise<ScorePartsOut> {
    const file = join(this.bazaarDir, this.today(), "score-parts.jsonl");
    let history: ScorePartsLine[] = [];
    try {
      history = (await readJsonl(file, `${this.today()}/score-parts.jsonl`, ScorePartsLineSchema)).data;
    } catch {
      // no file yet
    }
    if (tick !== null && Object.keys(now).length > 0 && history.at(-1)?.tick !== tick) {
      const line: ScorePartsLine = { tick, parts: now };
      try {
        await mkdir(join(this.bazaarDir, this.today()), { recursive: true });
        await writeFile(file, `${JSON.stringify(line)}\n`, { flag: "a" });
        history.push(line);
      } catch {
        // no write permission: Δ tick falls back to what is already on disk
      }
    }
    return scorePartsOf(now, tick, history);
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
      // no write permission: the verdict is recomputed next cycle
    }
  }
}
