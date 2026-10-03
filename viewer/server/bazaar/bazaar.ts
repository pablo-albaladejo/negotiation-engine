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
 * Bazaar de solo lectura: `/api/bazaar/score` lee los `score.jsonl` escritos por el agente
 * (`VIEWER_BAZAAR_DIR`, por defecto `<repo>/results/bazaar-live`); `/api/bazaar/live` llama
 * `GET /api/me` + `GET /api/clock` del Bazaar en vivo; `/api/bazaar/threads` llama
 * `GET /api/me/threads` + `GET /api/threads/{id}` (las 6 más recientes / abiertas) y las combina con
 * nuestra traza local (`thread-<id>.jsonl`); `/api/bazaar/duels` llama `GET /api/duels` (abiertos y
 * cerrados). Todo solo si `BAZAAR_KEY` está en el entorno del servidor del visor, y nunca devuelve
 * la clave, assets/your_value del equipo, ni rarest/luck/luck_private.
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

/** Snapshots de todas las fechas bajo `dir`, en orden cronológico (más recientes al final). */
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

/** `GET /api/bazaar/live`: cachea ~5 s para no reventar el límite de tasa del Bazaar con pollers
 * del visor; la clave vive solo en este proceso (nunca en la respuesta ni en un log). */
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

/** Una entrada de `thread-<id>.jsonl` (`src/shared/trace.ts`): nuestro precio/límite/regla por tic y el
 * log de paciencia. Tolerante (`looseObject`): es nuestra traza local, no una respuesta del Bazaar. */
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

/** Nuestra traza local de un hilo (`thread-<id>.jsonl`), buscada en todas las fechas de `dir`; vacía
 * si no existe (el agente aún no ha trazado ese hilo, o el visor mira otro directorio). */
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

/** Referencias de carta en un lado de oferta: de `assets[].ref` (objetos) y de `types` ("card:REF"). */
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

/** Hasta 6 hilos: todos los abiertos primero, luego los más recientes (id más alto = más reciente). */
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

/** `GET /api/bazaar/threads`: hilos de `/api/me/threads` + detalle de `/api/threads/{id}` para las
 * 6 más recientes/abiertas, con nuestra traza local si existe. Cachea ~5 s. */
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

/** `GET /api/bazaar/duels`: `/api/duels` (abiertos) + `/api/duels?done=true` (si el servidor lo
 * soporta), etiquetados con `done`. Cachea ~5 s. */
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
