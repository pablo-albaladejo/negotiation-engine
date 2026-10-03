import { readdir } from "node:fs/promises";
import { z } from "zod";
import { BazaarClient } from "../../../src/shared/client.js";
import { duelsApi } from "../../../src/duels/schemas.js";
import { loadBazaarEnv } from "../../../src/shared/env.js";
import { extractScoreFields, ScoreFieldsSchema } from "../../../src/shared/score.js";
import type { Thread } from "../../../src/shared/schemas.js";

type StandingOffer = Thread["standing_offers"][number];
type OfferSide = NonNullable<StandingOffer["give"]>;
type ThreadSummary = Awaited<ReturnType<BazaarClient["myThreads"]>>["threads"][number];
import type { ApiResponse } from "../api.js";
import { isSafeId, resolveInside } from "../paths.js";
import { readJsonl, type ReadError } from "../read.js";

/**
 * Read-only Bazaar: `/api/bazaar/score` reads the `score.jsonl` files written by the agent
 * (`VIEWER_BAZAAR_DIR`, default `<repo>/results/bazaar-live`); `/api/bazaar/live` calls the live
 * Bazaar's `GET /api/me` + `GET /api/clock`; `/api/bazaar/threads` calls
 * `GET /api/me/threads` + `GET /api/threads/{id}` (the 6 most recent / open) and merges them with
 * our local trace (`thread-<id>.jsonl`); `/api/bazaar/duels` calls `GET /api/duels` (open and
 * closed). All only if `BAZAAR_KEY` is in the viewer server's environment, and it never returns
 * the key, the team's assets/your_value, or rarest/luck/luck_private.
 */

const ok = (data: unknown, errors: ReadError[] = []): ApiResponse => ({ status: 200, body: { data, errors } });

const CauseEntrySchema = z.looseObject({
  thread: z.number().optional(),
  dealer: z.string().optional(),
  action: z.string().optional(),
  price: z.number().optional(),
});

const ScoreSnapshotSchema = ScoreFieldsSchema.extend({
  ts: z.string().optional(),
  tick: z.number().optional(),
  round: z.string().optional(),
  delta: z.record(z.string(), z.number()).optional(),
  cause: z.array(CauseEntrySchema).optional(),
});

/** Snapshots from all dates under `dir`, in chronological order (most recent last). */
export async function bazaarScore(dir: string): Promise<ApiResponse> {
  let dates: string[];
  try {
    dates = (await readdir(dir)).filter(isSafeId).sort();
  } catch {
    return ok([]);
  }
  const data: unknown[] = [];
  const errors: ReadError[] = [];
  for (const date of dates) {
    const file = await resolveInside(dir, date, "score.jsonl");
    if (!file) continue;
    const read = await readJsonl(file, `${date}/score.jsonl`, ScoreSnapshotSchema);
    data.push(...read.data);
    errors.push(...read.errors);
  }
  return ok(data, errors);
}

export interface BazaarLiveApi {
  me: BazaarClient["me"];
  clock: BazaarClient["clock"];
}

export interface BazaarLiveDeps {
  loadEnv?: typeof loadBazaarEnv;
  makeClient?: (env: { url: string; key: string }) => BazaarLiveApi;
  now?: () => number;
  cacheMs?: number;
}

/** `GET /api/bazaar/live`: caches ~5 s so viewer pollers don't blow the Bazaar's rate limit;
 * the key lives only in this process (never in the response or a log). */
export class BazaarLive {
  private cache: { at: number; data: unknown } | null = null;

  constructor(private readonly deps: BazaarLiveDeps = {}) {}

  async get(): Promise<ApiResponse> {
    const loadEnv = this.deps.loadEnv ?? loadBazaarEnv;
    const env = loadEnv();
    if (!env.key) return ok(null);
    const now = this.deps.now ?? Date.now;
    const cacheMs = this.deps.cacheMs ?? 5_000;
    if (this.cache && now() - this.cache.at < cacheMs) return ok(this.cache.data);
    const makeClient = this.deps.makeClient ?? ((e) => new BazaarClient({ url: e.url, key: e.key }));
    try {
      const client = makeClient({ url: env.url, key: env.key });
      const [me, clock] = await Promise.all([client.me(), client.clock()]);
      const score = extractScoreFields(me) ?? null;
      const round = clock.round_name ?? (typeof clock.round === "number" ? String(clock.round) : null);
      const data = { team: me.name ?? null, round, tick: clock.tick, score };
      this.cache = { at: now(), data };
      return ok(data);
    } catch {
      return ok(this.cache?.data ?? null);
    }
  }
}

/** An entry of `thread-<id>.jsonl` (`src/shared/trace.ts`): our price/limit/rule per tick and the
 * patience log. Tolerant (`looseObject`): it is our local trace, not a Bazaar response. */
const ThreadTraceEntrySchema = z.looseObject({
  ts: z.string().optional(),
  tick: z.number().optional(),
  action: z.string().optional(),
  ourPrice: z.number().optional(),
  herPrice: z.number().optional(),
  herOpening: z.number().optional(),
  herFinal: z.boolean().optional(),
  rule: z.string().optional(),
  reservation: z.number().optional(),
  effectiveReservation: z.number().optional(),
  status: z.string().optional(),
  closedReason: z.string().optional(),
  settledPrice: z.number().optional(),
  text: z.string().optional(),
  patience: z.unknown().optional(),
});
export type ThreadTraceEntry = z.infer<typeof ThreadTraceEntrySchema>;

/** Our local trace of a thread (`thread-<id>.jsonl`), searched across all dates of `dir`; empty
 * if it doesn't exist (the agent hasn't traced that thread yet, or the viewer looks at another directory). */
async function readThreadTrace(dir: string, id: number): Promise<ThreadTraceEntry[]> {
  let dates: string[];
  try {
    dates = (await readdir(dir)).filter(isSafeId).sort();
  } catch {
    return [];
  }
  const data: ThreadTraceEntry[] = [];
  for (const date of dates) {
    const file = await resolveInside(dir, date, `thread-${id}.jsonl`);
    if (!file) continue;
    const read = await readJsonl(file, `${date}/thread-${id}.jsonl`, ThreadTraceEntrySchema);
    data.push(...read.data);
  }
  return data;
}

/** Card references on one side of an offer: from `assets[].ref` (objects) and from `types` ("card:REF"). */
function offerAssetRefs(side: OfferSide | null | undefined): string[] {
  if (!side) return [];
  const fromAssets = (side.assets ?? []).flatMap((a) =>
    a && typeof a === "object" && "ref" in a && typeof (a as { ref?: unknown }).ref === "string" ? [(a as { ref: string }).ref] : [],
  );
  const fromTypes = (side.types ?? []).flatMap((t) => (typeof t === "string" && t.startsWith("card:") ? [t.slice("card:".length)] : []));
  return [...new Set([...fromAssets, ...fromTypes])];
}

export interface ThreadMessageOut {
  sender: string | null;
  text: string;
  ts?: number;
}

export interface ThreadOfferOut {
  maker: string | null;
  give: { cash: number | null };
  want: { cash: number | null };
  assets: string[];
  final: boolean;
}

export interface ThreadOut {
  id: number;
  with: string | null;
  topic: unknown;
  status: string;
  closed_reason: string | null;
  messages: ThreadMessageOut[];
  standing_offers: ThreadOfferOut[];
  trace: ThreadTraceEntry[];
}

const isOpenOffer = (o: StandingOffer): boolean => (o.status ?? "open") === "open";

function toThreadOut(t: Thread, trace: ThreadTraceEntry[]): ThreadOut {
  return {
    id: t.id,
    with: t.with ?? null,
    topic: t.topic ?? null,
    status: t.status,
    closed_reason: t.closed_reason ?? null,
    messages: t.messages.map((m) => ({ sender: m.sender ?? null, text: m.text ?? "", ...(m.tick !== null && m.tick !== undefined ? { ts: m.tick } : {}) })),
    standing_offers: t.standing_offers.filter(isOpenOffer).map((o) => ({
      maker: o.maker ?? null,
      give: { cash: o.give?.cash ?? null },
      want: { cash: o.want?.cash ?? null },
      assets: [...offerAssetRefs(o.give), ...offerAssetRefs(o.want)],
      final: o.final ?? false,
    })),
    trace,
  };
}

/** Up to 6 threads: all open ones first, then the most recent (highest id = most recent). */
function pickThreads(summaries: readonly ThreadSummary[], max: number): ThreadSummary[] {
  const sorted = [...summaries].sort((a, b) => b.id - a.id);
  const open = sorted.filter((t) => (t.status ?? "open") === "open");
  const rest = sorted.filter((t) => (t.status ?? "open") !== "open");
  return [...open, ...rest].slice(0, max);
}

export interface BazaarThreadsApi {
  myThreads: BazaarClient["myThreads"];
  thread: BazaarClient["thread"];
}

export interface BazaarThreadsDeps {
  loadEnv?: typeof loadBazaarEnv;
  makeClient?: (env: { url: string; key: string }) => BazaarThreadsApi;
  now?: () => number;
  cacheMs?: number;
  maxThreads?: number;
}

/** `GET /api/bazaar/threads`: threads from `/api/me/threads` + detail from `/api/threads/{id}` for the
 * 6 most recent/open, with our local trace if it exists. Caches ~5 s. */
export class BazaarThreads {
  private cache: { at: number; data: unknown } | null = null;

  constructor(
    private readonly traceDir: string,
    private readonly deps: BazaarThreadsDeps = {},
  ) {}

  async get(): Promise<ApiResponse> {
    const loadEnv = this.deps.loadEnv ?? loadBazaarEnv;
    const env = loadEnv();
    if (!env.key) return ok([]);
    const now = this.deps.now ?? Date.now;
    const cacheMs = this.deps.cacheMs ?? 5_000;
    if (this.cache && now() - this.cache.at < cacheMs) return ok(this.cache.data);
    const makeClient = this.deps.makeClient ?? ((e) => new BazaarClient({ url: e.url, key: e.key }));
    try {
      const client = makeClient({ url: env.url, key: env.key });
      const list = await client.myThreads();
      const chosen = pickThreads(list.threads, this.deps.maxThreads ?? 6);
      const details = await Promise.all(
        chosen.map(async (t) => {
          try {
            return await client.thread(t.id);
          } catch {
            return null;
          }
        }),
      );
      const data: ThreadOut[] = [];
      for (const d of details) {
        if (!d) continue;
        const trace = await readThreadTrace(this.traceDir, d.id);
        data.push(toThreadOut(d, trace));
      }
      data.sort((a, b) => b.id - a.id);
      this.cache = { at: now(), data };
      return ok(data);
    } catch {
      return ok(this.cache?.data ?? []);
    }
  }
}

export interface BazaarDuelsApi {
  duels(done?: boolean): ReturnType<ReturnType<typeof duelsApi>["duels"]>;
}

export interface BazaarDuelsDeps {
  loadEnv?: typeof loadBazaarEnv;
  makeClient?: (env: { url: string; key: string }) => BazaarDuelsApi;
  now?: () => number;
  cacheMs?: number;
}

/** `GET /api/bazaar/duels`: `/api/duels` (open) + `/api/duels?done=true` (if the server
 * supports it), tagged with `done`. Caches ~5 s. */
export class BazaarDuels {
  private cache: { at: number; data: unknown } | null = null;

  constructor(private readonly deps: BazaarDuelsDeps = {}) {}

  async get(): Promise<ApiResponse> {
    const loadEnv = this.deps.loadEnv ?? loadBazaarEnv;
    const env = loadEnv();
    if (!env.key) return ok([]);
    const now = this.deps.now ?? Date.now;
    const cacheMs = this.deps.cacheMs ?? 5_000;
    if (this.cache && now() - this.cache.at < cacheMs) return ok(this.cache.data);
    const makeClient = this.deps.makeClient ?? ((e) => duelsApi(new BazaarClient({ url: e.url, key: e.key })));
    try {
      const client = makeClient({ url: env.url, key: env.key });
      const open = await client.duels(false);
      let done: Awaited<ReturnType<typeof client.duels>>;
      try {
        done = await client.duels(true);
      } catch {
        done = { duels: [] };
      }
      const data = [...open.duels.map((d) => ({ ...d, done: false })), ...done.duels.map((d) => ({ ...d, done: true }))];
      this.cache = { at: now(), data };
      return ok(data);
    } catch {
      return ok(this.cache?.data ?? []);
    }
  }
}
