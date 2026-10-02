import { readdir } from "node:fs/promises";
import { z } from "zod";
import { BazaarClient } from "../../src/bazaar/client.js";
import { loadBazaarEnv } from "../../src/bazaar/env.js";
import { extractScoreFields, ScoreFieldsSchema } from "../../src/bazaar/score.js";
import type { ApiResponse } from "./api.js";
import { isSafeId, resolveInside } from "./paths.js";
import { readJsonl, type ReadError } from "./read.js";

/**
 * Bazaar de solo lectura: `/api/bazaar/score` lee los `score.jsonl` escritos por el agente
 * (`VIEWER_BAZAAR_DIR`, por defecto `<repo>/results/bazaar-live`); `/api/bazaar/live` llama
 * `GET /api/me` + `GET /api/clock` del Bazaar en vivo, solo si `BAZAAR_KEY` está en el entorno del
 * servidor del visor, y solo devuelve los campos públicos de la cifra (nunca la clave, nunca
 * assets/your_value, nunca rarest/luck/luck_private).
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
