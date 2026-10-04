import { open, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { BazaarClient, BazaarError, type BazaarClientOptions } from "../../../src/shared/client.js";
import { loadBazaarEnv } from "../../../src/shared/env.js";
import { buildGameState, type GameState } from "../../../src/state/game-state.js";
import type { ValuationState } from "../../../src/state/valuation.js";
import type { WorkshopState } from "../../../src/workshop/workshop.js";
import type { NewsSignals } from "../../../src/news/signals.js";
import { loadConversationMemos } from "../../../src/state/conversation.js";
import { loadRivalLedger, type RivalLedger } from "../../../src/state/rivals.js";
import { loadPosterior, type PersonaEstimates } from "../../../src/dealers/history/persona-fit.js";
import { ladderLevels, type LadderLevel } from "../../../src/dealers/history/ladder.js";
import type { LessonEntry } from "../../../src/dealers/history/lessons.js";
import { ACCEPT_PRIORITY, arbitrate, budgetFrom, DUEL_ACCEPT_QUOTA_ASSUMPTION, formatBudget, type Budget, type Intent } from "../../../src/coordinator/coordinator.js";
import { parseOffers, readSide } from "../../../src/trades/trades.js";
import { DealersRoute, DuelsRoute, TradesRoute, type RouteProposal } from "../../../src/coordinator/routes.js";
import { decideMechanism, DEFAULT_MECHANISM_THRESHOLDS, ticksPerHourOf } from "../../../src/venue/mechanism.js";
import { DEFAULT_HEARTBEAT_FILE, DEFAULT_SESSIONS_FILE, loadBenchSessions, loadHeartbeat, publicSession } from "../../../src/broker/shadow.js";
import { ScheduleSchema } from "../../../src/duels/schemas.js";
import type { ApiResponse } from "../api.js";
import { FeedEventSchema, feedLine, parseList, type FeedLine } from "./bazaar-board-core.js";
import { isSafeId, resolveInside } from "../paths.js";
import { arbitrationOrder, duelDeadlines, intentGoals, ourOffers, ourVenue, type NowOut } from "./bazaar-now.js";

/**
 * `GET /api/bazaar/model`: OUR internal model, not a mirror of the API. Once per tick it builds the
 * `GameState` (GET only), reads the budget from `clock.limits`, asks each coordinator route (duels, dealers,
 * El Rastro) for its intents in dry-run and arbitrates them with `arbitrate`, just like `pnpm bazaar:play --dry-run --once`.
 * It never calls `execute` or anything that sends.
 *
 * Read-only guard, in two layers:
 *  1. `ReadOnlyBazaarClient` overrides `raw` (which ALL client calls go through, including those of
 *     `duelsApi`): any method other than GET/HEAD throws `ModelPostBlocked` before touching the network.
 *  2. `readOnlyFetch` wraps the client's `fetch`: even if something bypassed `raw`, a POST/DELETE does not go out.
 * Each blocked attempt is counted and returned in `safety.blocked` (should always be 0).
 *
 * The model carries private data (private value, `your_limit`, reservations): the server only listens on 127.0.0.1
 * and checks the Host (see `http.ts`); none of this leaves the machine.
 */

export class ModelPostBlocked extends Error {
  constructor(method: string, path: string) {
    super(`viewer model is read-only: ${method} ${path} blocked`);
    this.name = "ModelPostBlocked";
  }
}

const READ_METHODS = new Set(["GET", "HEAD"]);

/** `fetch` that only lets GET/HEAD through; any other method rejects without calling the real `fetch`. */
export function readOnlyFetch(inner: typeof fetch, onBlocked: () => void = () => {}): typeof fetch {
  return ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (!READ_METHODS.has(method)) {
      onBlocked();
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      return Promise.reject(new ModelPostBlocked(method, new URL(url).pathname));
    }
    return inner(input, init);
  }) as typeof fetch;
}

/** Bazaar client that cannot write: `raw` rejects anything that is not GET/HEAD. */
export class ReadOnlyBazaarClient extends BazaarClient {
  private readonly guard: { blocked: number };
  constructor(options: BazaarClientOptions) {
    const guard = { blocked: 0 };
    super({ ...options, fetch: readOnlyFetch(options.fetch ?? fetch, () => (guard.blocked += 1)) });
    this.guard = guard;
  }
  /** Blocked write attempts (should always be 0). */
  get blocked(): number {
    return this.guard.blocked;
  }
  override async raw(method: string, path: string, body?: unknown): Promise<unknown> {
    if (!READ_METHODS.has(method.toUpperCase())) {
      this.guard.blocked += 1;
      throw new ModelPostBlocked(method, path);
    }
    return super.raw(method, path, body);
  }
}

// ---------------------------------------------------------------- output

export interface ModelIntentOut extends Intent {
  selected: boolean;
  reason: string;
  /** Position in the arbitration order (accepts by `ACCEPT_PRIORITY`, messages, threads, sign-ups…). */
  order: number;
}

export interface ModelRouteOut {
  route: string;
  /** Which coordinator route this is (UI text). */
  label: string;
  status: "ok" | "failed" | "not wired";
  error?: string;
  notes: string[];
  intents: ModelIntentOut[];
}

export interface ScheduleEventOut {
  at_hours: number;
  action: string;
  note: string | null;
  params: Record<string, unknown>;
  wall: string | null;
}

export interface ModelOut {
  available: boolean;
  reason: string | null;
  tick: number | null;
  built_at: string | null;
  next_refresh_ms: number;
  /** `true` if this response is the last build and another one is already in progress (not awaited). */
  rebuilding: boolean;
  safety: { mode: "dry-run"; blocked: number; note: string };
  inputs: { ok: string[]; missing: string[] };
  /** The tick's `GameState` (with conversations completed with turn and strategy). Local only. */
  state: GameState | null;
  budget: (Budget & { lines: string[]; assumption: string }) | null;
  accept_priority: { cls: string; rank: number; why: string }[];
  routes: ModelRouteOut[];
  goals: {
    round_weights: { round: number; name: string; at_hours: number; weight: number }[];
    levers: string[];
    page_targets: string[];
    cash_floor: number;
    max_spend_hour: number;
    max_spend_total: number;
    judges: string;
  };
  schedule: { now_hours: number | null; events: ScheduleEventOut[] };
  /** Latest feed events that trigger something (levels, limits, eggs, strikes) and other teams' eggs. */
  triggers: FeedLine[];
  eggs_feed: (FeedLine & { actor: string | null; persona: string | null })[];
  persisted: { date: string | null; conversations: boolean; personas: unknown; flags: unknown };
  /** Hints corpus (`hints.jsonl`, append-only), most recent first; dealer text only as plain text. */
  hints: Record<string, unknown>[];
  /** Today's dealer ladder per level (best three negotiated shares), as `bazaar:play` computes it. */
  ladder: LadderLevel[];
  /** Prices per card: `state.markets.prices` if present; otherwise rebuilt here (origin in `source`). */
  prices: { source: "state" | "viewer" | "none"; rows: Record<string, unknown>[] };
  /** `GameState.valuation`: our value model per card and page (null until the state has it). */
  valuation: ValuationState | null;
  /** `GameState.workshop` (src/workshop/): spares per rarity, the strategy's decision and the public crafts (null until the state has it). */
  workshop: WorkshopState | null;
  /** Packs: whatever the state carries (PACKS route) and, failing that, the catalog (`packs`) and our sealed packs. */
  packs: { state: unknown; catalog: unknown[]; held: unknown[] };
  /** Venues: `state.markets.venues` if present; otherwise `/api/venues`. */
  venues: { state: unknown; api: unknown[] };
  /** «Now» tab: goal of each intent, deadlines, our published offers and our venue. */
  now: NowOut | null;
  /**
   * Per-persona curve fit: dealer-side estimates (never our values), from the saved posterior
   * (`persona-posterior.json`, read-only) plus the tick's conversations. They also go in `state.personas[].estimates`
   * and `state.conversations[].prediction`.
   */
  fit: { source: "persona-posterior.json" | "this tick only"; estimates: Record<string, PersonaEstimates>; welcome: string[]; bands: Record<string, string> } | null;
  /** `GameState.news`: the news as a hint (unverified, never a figure), from today's news-summary.json. */
  news: NewsSignals | null;
}

/**
 * Prices per card when the `GameState` does not carry them yet: book, rarity and print run from the catalog; best
 * sell offer (ask) and buy offer (bid) in El Rastro; our private value (local only); copies; margins and whether it
 * completes a page. A deal scores the value gained at our private value, uncapped (measured 3 Oct).
 */
export function fallbackPrices(input: { catalog: unknown; rastro: unknown; values: Record<string, number> }, state: GameState, pageTargets: readonly string[]): Record<string, unknown>[] {
  const sets = Array.isArray(record(input.catalog).sets) ? (record(input.catalog).sets as unknown[]) : [];
  const asks = new Map<string, number>();
  const bids = new Map<string, number>();
  for (const o of parseOffers(input.rastro)) {
    if ((o.status ?? "open") !== "open") continue;
    const give = readSide(o.give);
    const want = readSide(o.want);
    const sold = give.assets.map((a) => a.ref).filter((r): r is string => !!r);
    if (sold.length === 1 && give.cash === 0 && want.cash > 0 && want.assets.length + want.cards.length === 0) asks.set(sold[0]!, Math.min(asks.get(sold[0]!) ?? Infinity, want.cash));
    const wanted = [...want.cards, ...want.assets.map((a) => a.ref).filter((r): r is string => !!r)];
    if (wanted.length === 1 && give.cash > 0 && give.assets.length === 0) bids.set(wanted[0]!, Math.max(bids.get(wanted[0]!) ?? 0, give.cash));
  }
  const holdings = state.ours.holdings.byRef;
  const pages = state.ours.album.pages;
  const out: Record<string, unknown>[] = [];
  for (const set of sets) {
    const st = record(set);
    if (st.released === false) continue;
    for (const card of Array.isArray(st.cards) ? st.cards : []) {
      const c = record(card);
      const ref = typeof c.id === "string" ? c.id : null;
      if (!ref || c.hidden === true) continue;
      const book = typeof c.book === "number" ? c.book : null;
      const value = state.ours.values[ref] ?? input.values[ref] ?? null;
      const ask = asks.get(ref) ?? null;
      const bid = bids.get(ref) ?? null;
      const held = holdings[ref] ?? 0;
      const page = pages.find((p) => p.set === ref.split("-")[0]);
      const printRun = typeof c.print_run === "number" ? c.print_run : null;
      const minted = typeof c.minted === "number" ? c.minted : null;
      out.push({
        ref,
        name: typeof c.name === "string" ? c.name : null,
        set: typeof st.id === "string" ? st.id : ref.split("-")[0],
        rarity: typeof c.rarity === "string" ? c.rarity : null,
        book,
        print_run: printRun,
        minted,
        scarcity: printRun && minted !== null ? Math.round((minted / printRun) * 1000) / 1000 : null,
        best_ask: ask,
        best_bid: bid,
        last_trade: null,
        value,
        holdings: held,
        buy_edge: value !== null && ask !== null ? Math.round((value - ask) * 10) / 10 : null,
        sell_edge: value !== null && bid !== null && held > 0 ? Math.round((bid - value) * 10) / 10 : null,
        completes_page: pageTargets.includes(ref) || (!!page && page.have === page.of - 1 && held === 0),
      });
    }
  }
  return out;
}

export interface BazaarModelDeps {
  loadEnv?: typeof loadBazaarEnv;
  fetch?: typeof fetch;
  now?: () => number;
  /** Requests per second of the model (default 1.5; the board uses 2: the viewer stays < 4 req/s). */
  ratePerSec?: number;
  minRefreshMs?: number;
  /** Recent feed events the board already reads (the GET is not repeated). */
  feed?: () => unknown;
  /** Catalog, El Rastro book and missing-card values the board already has (for `prices`). */
  market?: () => { catalog: unknown; rastro: unknown; values: Record<string, number>; me?: unknown };
  /** `docs/bazaar/lessons.json`: our closed dealer conversations, for the ladder. */
  lessonsFile?: string;
}

/** Default parameters of `pnpm bazaar:play` (src/coordinator/main.ts). */
const PLAY_DEFAULTS = { maxSpendPerHour: 60, maxSpendTotal: 150, cashFloor: 20, pageTargets: ["SAL-09"], leaderboardEvery: 5 };

const LEVERS = [
  "1. Duels (Duels I h 6.5, Duels II h 13 with price and days): their value decays every round",
  "2. Market Test on our venue with the board mechanism + broker (auto earns half)",
  "3. SAL-09 in El Rastro (≤ 130 P, +50…+77 with the page bonus)",
  "4. Dealer ladder (best three negotiated deals per level; more deals do not add)",
];

const INPUTS = ["clock", "me", "schedule", "dealers", "duels", "threads", "rastro", "my offers", "leaderboard"];

const TRIGGER = /^(level\.|limit|limits|egg\.|strike|cooloff|warning|anti_cheat|flag)/i;

const ok = (data: unknown): ApiResponse => ({ status: 200, body: { data, errors: [] } });

const record = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

function emptyModel(reason: string, nextMs: number): ModelOut {
  return {
    available: false,
    reason,
    tick: null,
    built_at: null,
    next_refresh_ms: nextMs,
    rebuilding: false,
    safety: { mode: "dry-run", blocked: 0, note: "GET only; the model never calls execute" },
    inputs: { ok: [], missing: [] },
    state: null,
    budget: null,
    accept_priority: acceptPriority(),
    routes: [],
    goals: goals([]),
    schedule: { now_hours: null, events: [] },
    triggers: [],
    eggs_feed: [],
    persisted: { date: null, conversations: false, personas: null, flags: null },
    hints: [],
    ladder: [],
    prices: { source: "none", rows: [] },
    valuation: null,
    workshop: null,
    packs: { state: null, catalog: [], held: [] },
    venues: { state: null, api: [] },
    now: null,
    fit: null,
    news: null,
  };
}

function acceptPriority(): ModelOut["accept_priority"] {
  return Object.entries(ACCEPT_PRIORITY)
    .map(([cls, p]) => ({ cls, rank: p.rank, why: p.why }))
    .sort((a, b) => a.rank - b.rank);
}

function goals(events: ScheduleEventOut[]): ModelOut["goals"] {
  // R1 weighs 0.5 (spec); R2 and R3 carry their weight in `/api/schedule` (action `round`).
  const rounds = events
    .filter((e) => e.action === "round")
    .map((e, k) => ({ round: k + 2, name: typeof e.params.name === "string" ? e.params.name : `Round ${k + 2}`, at_hours: e.at_hours, weight: typeof e.params.weight === "number" ? e.params.weight : 1 }));
  return {
    round_weights: [{ round: 1, name: "Friday · El Rastro", at_hours: 0, weight: 0.5 }, ...rounds],
    levers: LEVERS,
    page_targets: PLAY_DEFAULTS.pageTargets,
    cash_floor: PLAY_DEFAULTS.cashFloor,
    max_spend_hour: PLAY_DEFAULTS.maxSpendPerHour,
    max_spend_total: PLAY_DEFAULTS.maxSpendTotal,
    judges: "Judges' note (40): ideas and craft, relative to the leader; not in the API (format still to confirm with the organisers)",
  };
}

function scheduleEvents(raw: unknown): ScheduleOut {
  const r = record(raw);
  const events = (Array.isArray(r.upcoming) ? r.upcoming : []).flatMap((u): ScheduleEventOut[] => {
    const e = record(u);
    return typeof e.at_hours === "number" && typeof e.action === "string"
      ? [{ at_hours: e.at_hours, action: e.action, note: typeof e.note === "string" ? e.note : null, params: record(e.params), wall: typeof e.wall === "string" ? e.wall : null }]
      : [];
  });
  return { now_hours: typeof r.now_hours === "number" ? r.now_hours : null, events: events.sort((a, b) => a.at_hours - b.at_hours) };
}
type ScheduleOut = ModelOut["schedule"];

function pricesOf(state: GameState, market: { catalog: unknown; rastro: unknown; values: Record<string, number> } | undefined): ModelOut["prices"] {
  const own = record(record((state as GameState & { markets?: unknown }).markets).prices ?? null);
  const list = (state as GameState & { markets?: { prices?: unknown } }).markets?.prices;
  if (Array.isArray(list) && list.length > 0) return { source: "state", rows: list.map(record) };
  if (Object.keys(own).length > 0) return { source: "state", rows: Object.entries(own).map(([ref, v]) => ({ ref, ...record(v) })) };
  if (!market || !market.catalog) return { source: "none", rows: [] };
  return { source: "viewer", rows: fallbackPrices(market, state, PLAY_DEFAULTS.pageTargets) };
}

const ROUTE_LABEL: Record<string, string> = {
  duels: "Duels",
  dealers: "Dealers",
  trades: "Markets (El Rastro)",
  venue: "Our venue",
  eggs: "Eggs",
  flags: "Flags",
};

export class BazaarModel {
  private cache: { refreshAt: number; data: ModelOut } | null = null;
  private inflight: Promise<ModelOut> | null = null;
  private client: ReadOnlyBazaarClient | null = null;
  private routes: { duels: DuelsRoute; dealers: DealersRoute; trades: TradesRoute } | null = null;
  private lastLeaderboard = -Infinity;
  /** Other teams' ledger: read once (play's `rivals.json` or the recorder), then updated in memory; never saved here. */
  private rivals: RivalLedger | null = null;

  constructor(
    private readonly bazaarDir: string,
    private readonly deps: BazaarModelDeps = {},
  ) {}

  async get(): Promise<ApiResponse> {
    const now = this.deps.now ?? Date.now;
    if (this.cache && now() < this.cache.refreshAt) return ok({ ...this.cache.data, rebuilding: this.inflight !== null, next_refresh_ms: Math.max(1_000, this.cache.refreshAt - now()) });
    this.inflight ??= this.cycle().finally(() => {
      this.inflight = null;
    });
    // With a previous build, serve that one without waiting (14–47 s) and flag that another is in progress.
    if (this.cache) {
      this.inflight.catch(() => {});
      return ok({ ...this.cache.data, rebuilding: true, next_refresh_ms: 10_000 });
    }
    return ok(await this.inflight);
  }

  /** Accumulated client blocks (for tests and for `safety.blocked`). */
  get blocked(): number {
    return this.client?.blocked ?? 0;
  }

  private ensure(url: string, key: string): { client: ReadOnlyBazaarClient; routes: NonNullable<BazaarModel["routes"]> } {
    if (!this.client || !this.routes) {
      const client = new ReadOnlyBazaarClient({ url, key, ratePerSec: this.deps.ratePerSec ?? 1.5, burst: 2, retries: 1, ...(this.deps.fetch ? { fetch: this.deps.fetch } : {}) });
      this.client = client;
      // Always dry-run and with no trace or state file: no route writes to results/.
      this.routes = {
        duels: new DuelsRoute(client, true),
        dealers: new DealersRoute(client, { dryRun: true, maxSpendPerHour: PLAY_DEFAULTS.maxSpendPerHour, maxSpendTotal: PLAY_DEFAULTS.maxSpendTotal, cashFloor: PLAY_DEFAULTS.cashFloor, pageTargets: PLAY_DEFAULTS.pageTargets }),
        trades: new TradesRoute(client, true),
      };
    }
    return { client: this.client, routes: this.routes };
  }

  private async cycle(): Promise<ModelOut> {
    const now = this.deps.now ?? Date.now;
    const minMs = this.deps.minRefreshMs ?? 30_000;
    const env = (this.deps.loadEnv ?? loadBazaarEnv)();
    if (!env.key) {
      const data = emptyModel("BAZAAR_KEY not set on the viewer server", 60_000);
      this.cache = { refreshAt: now() + 60_000, data };
      return data;
    }
    const { client, routes } = this.ensure(env.url, env.key);
    const persisted = await this.readPersisted();
    // Per-persona fit posterior: read and refit in memory; the viewer never saves it.
    const posteriorPath = await resolveInside(this.bazaarDir, "persona-posterior.json");
    const posterior = posteriorPath ? loadPosterior(posteriorPath) : { observations: {}, estimates: {} };
    // Team's first conversation with that dealer (`welcome: true` in the saved observation); before the refit,
    // which rewrites the observations in memory.
    const welcome = Object.values(posterior.observations).flatMap((o) => ((o as unknown as Record<string, unknown>).welcome === true ? [o.id] : []));
    let state: GameState;
    try {
      const clock = await client.clock();
      const withLb = clock.tick - this.lastLeaderboard >= PLAY_DEFAULTS.leaderboardEvery;
      this.rivals ??= loadRivalLedger(join(this.bazaarDir, "rivals.json"), this.bazaarDir);
      state = await buildGameState(client, { leaderboard: withLb, pageTargets: PLAY_DEFAULTS.pageTargets, memos: persisted.memos, posterior, rivals: this.rivals, newsDir: join(this.bazaarDir, new Date().toLocaleDateString("sv-SE")) });
      if (withLb && !state.missing.some((m) => m.startsWith("leaderboard"))) this.lastLeaderboard = state.tick;
    } catch (e) {
      const reason = `GameState failed: ${e instanceof BazaarError ? e.code : e instanceof Error ? e.name : "error"}`;
      if (this.cache) return { ...this.cache.data, reason };
      const data = emptyModel(reason, minMs);
      this.cache = { refreshAt: now() + minMs, data };
      return data;
    }
    const budget = budgetFrom(state);
    const clock = await client.clock();
    const me = await client.me().catch(() => undefined);

    const proposals: { route: string; p?: RouteProposal; error?: string }[] = [];
    for (const [route, run] of [
      ["duels", () => routes.duels.propose()],
      ["dealers", () => routes.dealers.propose(clock, state)],
      ["trades", () => routes.trades.propose(state, me, PLAY_DEFAULTS.pageTargets)],
    ] as const) {
      try {
        proposals.push({ route, p: await run() });
      } catch (e) {
        proposals.push({ route, error: e instanceof ModelPostBlocked ? e.message : e instanceof BazaarError ? e.code : e instanceof Error ? e.message.slice(0, 200) : String(e) });
      }
    }
    const intents: Intent[] = proposals.flatMap((x) => x.p?.intents ?? []);
    const verdicts = arbitrate(intents, budget);
    const byId = new Map(verdicts.map((v) => [v.intent.id, v]));
    const orderOf = arbitrationOrder(intents);

    // Same as `bazaar:play`: tick turn, strategy and last decision of each route in its conversation.
    const acceptedConv = new Set(verdicts.filter((v) => v.selected && v.intent.kind === "accept").map((v) => v.intent.conversation));
    const acceptsLeft = budget.accepts - acceptedConv.size;
    for (const c of state.conversations) {
      if (c.phase === "done") continue;
      c.turn = {
        canMessage: c.kind !== "rastro" && budget.messagesPerConversation > 0 && !acceptedConv.has(c.id),
        canAccept: acceptedConv.has(c.id) || (c.kind !== "rastro" && acceptsLeft > 0),
      };
      for (const { p } of proposals) {
        const strategy = p?.strategies.get(c.id);
        if (strategy) c.strategy = strategy;
        const decision = p?.decisions.get(c.id);
        if (decision) c.strategy = { ...c.strategy, lastDecision: decision };
      }
    }

    const routeOut: ModelRouteOut[] = proposals.map(({ route, p, error }) => ({
      route,
      label: ROUTE_LABEL[route] ?? route,
      status: error ? "failed" : "ok",
      ...(error ? { error } : {}),
      notes: p?.notes ?? [],
      intents: (p?.intents ?? []).map((i) => ({ ...i, selected: byId.get(i.id)?.selected ?? false, reason: byId.get(i.id)?.reason ?? "-", order: orderOf.get(i.id) ?? 999 })),
    }));
    // Model routes the coordinator does not have yet: shown so the gap is visible.
    const venue = state.ours.venue;
    routeOut.push({
      route: "venue",
      label: ROUTE_LABEL.venue!,
      status: "not wired",
      notes: [
        venue ? `our venue ${venue.id ?? "?"} · mechanism ${venue.mechanism ?? "?"} · ${venue.status ?? "?"}` : "no venue of ours",
        "the broker (pnpm bazaar:broker) matches other teams' offers and the Market Test bench with its own key; it never spends our accept",
      ],
      intents: [],
    });
    for (const route of ["eggs", "flags"]) if (!routeOut.some((r) => r.route === route)) routeOut.push({ route, label: ROUTE_LABEL[route]!, status: "not wired", notes: ["not in the coordinator yet (dry-run only when it lands)"], intents: [] });

    const market = this.deps.market?.();
    const stateAny = state as GameState & Record<string, unknown>;
    const venuesRaw = record(stateAny.markets).venues ? null : await client.raw("GET", "/api/venues").catch(() => null);
    const nowOut = await this.nowOf(client, state, me, market?.rastro ?? null, Array.isArray(record(stateAny.markets).venues) ? (record(stateAny.markets).venues as unknown[]) : Array.isArray(record(venuesRaw).venues) ? (record(venuesRaw).venues as unknown[]) : [], intents);
    const schedRaw = await client.raw("GET", "/api/schedule").catch(() => null);
    const sched = scheduleEvents(schedRaw);
    // auto or board? Same rule as `bazaar:play`: sessions and heartbeat of the shadow broker (disk, read-only).
    const schedParsed = ScheduleSchema.safeParse(schedRaw);
    const nowHours = state.time.gameHour ?? state.clock.tHours;
    const heartbeat = loadHeartbeat(join(this.bazaarDir, DEFAULT_HEARTBEAT_FILE));
    state.venue = {
      mechanismDecision: decideMechanism(
        {
          ...(state.ours.venue?.mechanism ? { current: state.ours.venue.mechanism } : {}),
          sessions: loadBenchSessions(join(this.bazaarDir, DEFAULT_SESSIONS_FILE)).map(publicSession),
          ...(state.ours.cash !== undefined ? { cash: state.ours.cash } : {}),
          ...(nowHours !== undefined ? { nowHours } : {}),
          ticksPerHour: ticksPerHourOf(state.tick, state.clock.tHours, state.clock.tickSeconds),
          ...(schedParsed.success ? { schedule: schedParsed.data } : {}),
          ...(heartbeat ? { heartbeat } : {}),
          now: new Date(),
        },
        { ...DEFAULT_MECHANISM_THRESHOLDS, cashFloor: PLAY_DEFAULTS.cashFloor },
      ),
    };
    const feed = parseList(FeedEventSchema, record(this.deps.feed?.() ?? null).events ?? this.deps.feed?.());
    const triggers = feed.filter((e) => TRIGGER.test(e.type ?? "")).slice(-15).reverse().map(feedLine);
    const eggsFeed = feed
      .filter((e) => /^egg\./.test(e.type ?? ""))
      .slice(-30)
      .reverse()
      .map((e) => {
        const p = record(e.payload);
        const persona = [p.persona, p.dealer, p.with, p.from].find((x): x is string => typeof x === "string") ?? null;
        return { ...feedLine(e), actor: e.actor ?? null, persona };
      });

    const missingNames = state.missing.map((m) => m.split(":")[0]!);
    const leaderboardRead = state.env.leaderboard !== undefined;
    const tickMs = (clock.next_tick_in ?? 30) * 1000 + 1_500;
    const refreshIn = Math.max(minMs, tickMs);
    const data: ModelOut = {
      available: true,
      reason: null,
      tick: state.tick,
      built_at: state.builtAt,
      next_refresh_ms: refreshIn,
      rebuilding: false,
      safety: { mode: "dry-run", blocked: client.blocked, note: "GET only through a read-only client; routes propose in dry-run and nothing is executed" },
      inputs: { ok: INPUTS.filter((n) => !missingNames.includes(n) && (n !== "leaderboard" || leaderboardRead)), missing: state.missing },
      state,
      budget: { ...budget, lines: formatBudget(budget), assumption: DUEL_ACCEPT_QUOTA_ASSUMPTION },
      accept_priority: acceptPriority(),
      routes: routeOut,
      goals: goals(sched.events),
      schedule: sched,
      triggers,
      eggs_feed: eggsFeed,
      persisted: { date: persisted.date, conversations: persisted.memos.size > 0, personas: persisted.personas, flags: persisted.flags },
      hints: await this.readHints(),
      ladder: await this.ladderOf(state),
      prices: pricesOf(state, market),
      valuation: state.valuation ?? null,
      workshop: state.workshop ?? null,
      packs: {
        state: stateAny.packs ?? record(stateAny.markets).packs ?? null,
        catalog: Array.isArray(record(market?.catalog).packs) ? (record(market?.catalog).packs as unknown[]) : [],
        held: (Array.isArray(record(market?.me).assets) ? (record(market?.me).assets as unknown[]) : []).filter((a) => record(a).kind === "pack"),
      },
      venues: { state: record(stateAny.markets).venues ?? null, api: Array.isArray(record(venuesRaw).venues) ? (record(venuesRaw).venues as unknown[]) : [] },
      now: nowOut,
      fit: {
        source: posteriorPath ? "persona-posterior.json" : "this tick only",
        estimates: posterior.estimates,
        welcome,
        // Band of each observed conversation (`sells|buys:<rarity>`), also when the GameState does not know the rarity.
        bands: Object.fromEntries(Object.values(posterior.observations).map((o) => [o.id, o.band])),
      },
      news: state.news ?? null,
    };
    this.cache = { refreshAt: now() + refreshIn, data };
    return data;
  }

  /**
   * Data for the «Now» tab (GET only): `/api/me/offers`, `/api/duels` (deadlines) and the book of each venue where
   * we have offers (the board already brings El Rastro; at most 3 more venues). If a GET fails, that data is missing.
   */
  private async nowOf(client: ReadOnlyBazaarClient, state: GameState, me: unknown, rastro: unknown, venues: unknown[], intents: Intent[]): Promise<NowOut> {
    const team = typeof record(me).id === "string" ? (record(me).id as string) : (state.ours.team ?? "");
    const myOffers = await client.raw("GET", "/api/me/offers").catch(() => null);
    const duels = await client.raw("GET", "/api/duels").catch(() => null);
    const books = new Map<string, unknown>();
    const rastroBook = rastro ?? (await client.raw("GET", "/api/venues/rastro/offers").catch(() => null));
    if (rastroBook) books.set("rastro", rastroBook);
    const others = [...new Set(parseOffers(record(myOffers).offers ?? myOffers).map((o) => o.venue).filter((v): v is string => !!v && v !== "rastro" && isSafeId(v)))].slice(0, 3);
    for (const v of others) {
      const raw = await client.raw("GET", `/api/venues/${encodeURIComponent(v)}/offers`).catch(() => null);
      if (raw) books.set(v, raw);
    }
    const deadlines = duelDeadlines(duels);
    const offers = myOffers ? ourOffers({ myOffers, team, tick: state.tick, books, venues, state }) : [];
    for (const o of offers) if (o.expires_tick !== null) deadlines[`rastro:${o.id}`] = o.expires_tick;
    return { goals: intentGoals(intents, state, PLAY_DEFAULTS.pageTargets), deadlines, offers, venue: ourVenue(me, state.tick) };
  }

  /** Latest entries of `hints.jsonl` (trace root or the most recent date), reading only the tail. */
  /** Same ladder as `DealersRoute` (src/coordinator/routes.ts): lessons of today + persona level and band limits. */
  private async ladderOf(state: GameState): Promise<LadderLevel[]> {
    let entries: LessonEntry[] = [];
    try {
      entries = (JSON.parse(await readFile(this.deps.lessonsFile ?? "", "utf8")) as { conversations?: LessonEntry[] }).conversations ?? [];
    } catch {
      // no lessons yet: every slot is empty
    }
    const rarity = new Map(state.markets.prices.map((p) => [p.ref, p.rarity]));
    return ladderLevels(entries, new Date().toISOString().slice(0, 10), (dealer) => {
      const model = state.personas.find((p) => p.id === dealer)?.model;
      const level = model?.public.level;
      return { ...(level !== undefined ? { level } : {}), limit: (band) => model?.bands[band]?.limit.value ?? undefined };
    }, (card) => rarity.get(card));
  }

  private async readHints(max = 500, bytes = 1_000_000): Promise<Record<string, unknown>[]> {
    let dates: string[] = [];
    try {
      dates = (await readdir(this.bazaarDir)).filter((d) => isSafeId(d) && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
    } catch {
      return [];
    }
    const path = (await resolveInside(this.bazaarDir, "hints.jsonl")) ?? (dates[0] ? await resolveInside(this.bazaarDir, dates[0], "hints.jsonl") : null);
    if (!path) return [];
    try {
      const fh = await open(path, "r");
      try {
        const size = (await fh.stat()).size;
        const start = Math.max(0, size - bytes);
        const buf = Buffer.alloc(size - start);
        await fh.read(buf, 0, buf.length, start);
        const out: Record<string, unknown>[] = [];
        for (const line of buf.toString("utf8").split("\n")) {
          try {
            const j: unknown = JSON.parse(line);
            if (j && typeof j === "object" && !Array.isArray(j)) out.push(j as Record<string, unknown>);
          } catch {
            // partial line (start of the tail) or empty
          }
        }
        return out.slice(-max).reverse();
      } finally {
        await fh.close();
      }
    } catch {
      return [];
    }
  }

  /** `conversations.json`, `personas.json` and `flags.json` from the most recent date (read-only). */
  private async readPersisted(): Promise<{ date: string | null; memos: ReturnType<typeof loadConversationMemos>; personas: unknown; flags: unknown }> {
    let dates: string[] = [];
    try {
      dates = (await readdir(this.bazaarDir)).filter((d) => isSafeId(d) && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
    } catch {
      dates = [];
    }
    const date = dates[0] ?? null;
    const read = async (name: string): Promise<unknown> => {
      if (!date) return null;
      const path = await resolveInside(this.bazaarDir, date, name);
      if (!path) return null;
      try {
        return JSON.parse(await readFile(path, "utf8"));
      } catch {
        return null;
      }
    };
    const convPath = date ? await resolveInside(this.bazaarDir, date, "conversations.json") : null;
    return { date, memos: convPath ? loadConversationMemos(convPath) : new Map(), personas: await read("personas.json"), flags: await read("flags.json") };
  }
}
