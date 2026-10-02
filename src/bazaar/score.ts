import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Me } from "./schemas.js";
import type { TraceRecord } from "./trace.js";

/**
 * La cifra que maximizamos: media ponderada de 3 días (vie 0.5, sáb 1, dom 1) de Negociando 30 +
 * Compraventa 30 + Jueces 40. `/api/me` la devuelve en `score`; aquí solo se extraen, trazan y
 * resumen los campos públicos listados abajo. `rarest`, `luck` y `luck_private` nunca cuentan ni
 * se guardan: ni siquiera se leen (lista cerrada de campos).
 */
const SCORE_KEYS = [
  "score",
  "negotiating",
  "market",
  "neg_points",
  "mm_points",
  "duel_points",
  "ladder_points",
  "bench_efficiency",
  "bench_points",
  "bench_venue",
  "level",
  "album_filled",
  "album_slots",
  "pages_complete",
  "deals",
  "badges",
  "adjustments",
  "frozen",
  "venue",
  "rank",
] as const;

export const ScoreFieldsSchema = z.looseObject({
  score: z.number().optional(),
  negotiating: z.number().optional(),
  market: z.number().optional(),
  neg_points: z.number().optional(),
  mm_points: z.number().optional(),
  duel_points: z.number().optional(),
  ladder_points: z.number().optional(),
  bench_efficiency: z.number().optional(),
  bench_points: z.number().optional(),
  bench_venue: z.string().optional(),
  level: z.number().optional(),
  album_filled: z.number().optional(),
  album_slots: z.number().optional(),
  pages_complete: z.number().optional(),
  deals: z.number().optional(),
  badges: z.array(z.unknown()).optional(),
  adjustments: z.unknown().optional(),
  frozen: z.boolean().optional(),
  venue: z.string().optional(),
  rank: z.number().optional(),
});
export type ScoreFields = z.infer<typeof ScoreFieldsSchema>;

/** Campos numéricos sobre los que tiene sentido calcular un delta. */
const NUMERIC_KEYS = ["score", "negotiating", "market", "neg_points", "mm_points", "duel_points", "ladder_points", "bench_efficiency", "bench_points", "level", "album_filled", "album_slots", "pages_complete", "deals", "rank"] as const satisfies readonly (keyof ScoreFields)[];

/**
 * Lee `me.score` con una lista cerrada de campos (allowlist): aunque el servidor incluya
 * `rarest`/`luck`/`luck_private` u otro campo privado, nunca llegan a `picked` y por tanto nunca
 * se devuelven, se trazan ni se sirven. `undefined` si `me.score` no es un objeto o no valida.
 */
export function extractScoreFields(me: Me): ScoreFields | undefined {
  const raw = me.score;
  if (!raw || typeof raw !== "object") return undefined;
  const picked: Record<string, unknown> = {};
  for (const key of SCORE_KEYS) if (key in raw) picked[key] = (raw as Record<string, unknown>)[key];
  const parsed = ScoreFieldsSchema.safeParse(picked);
  return parsed.success ? parsed.data : undefined;
}

/** Diferencia por campo numérico frente al snapshot anterior; 0 si no hay anterior o no cambia. */
export function computeDelta(prev: ScoreFields | undefined, curr: ScoreFields): Record<string, number> {
  const delta: Record<string, number> = {};
  for (const key of NUMERIC_KEYS) {
    const a = prev?.[key];
    const b = curr[key];
    if (typeof b !== "number") continue;
    delta[key] = b - (typeof a === "number" ? a : 0);
  }
  return delta;
}

export interface CauseEntry {
  thread?: number;
  dealer?: string;
  action: "accept" | "deal" | "buy" | "sell";
  price?: number;
}

/** Acciones de la traza del agente desde el snapshot anterior que probablemente movieron la cifra:
 * aceptaciones y resultados liquidados (`deal`). Nunca incluye reserva privada ni texto. */
export function causesFromRecords(records: readonly TraceRecord[]): CauseEntry[] {
  const out: CauseEntry[] = [];
  for (const r of records) {
    if (r.action === "accept") {
      out.push({ ...(r.thread !== undefined ? { thread: r.thread } : {}), dealer: r.dealer, action: "accept", ...(r.ourPrice !== undefined ? { price: r.ourPrice } : {}) });
    } else if (r.action === "outcome" && r.status === "deal") {
      const action: CauseEntry["action"] = r.side === "sell" ? "sell" : r.side === "buy" ? "buy" : "deal";
      out.push({ ...(r.thread !== undefined ? { thread: r.thread } : {}), dealer: r.dealer, action, ...(r.settledPrice !== undefined ? { price: r.settledPrice } : {}) });
    }
  }
  return out;
}

export interface ScoreSnapshot extends ScoreFields {
  ts: string;
  tick: number;
  /** Día de la jornada (vie/sáb/dom), si el servidor la da en `venue`; si no, ausente. */
  round?: string;
  delta: Record<string, number>;
  cause: CauseEntry[];
}

export interface ScoreSink {
  write(snapshot: ScoreSnapshot): void;
}

/**
 * Acumula el snapshot anterior para calcular `delta` y arma la causa a partir de las trazas del
 * agente desde la última llamada. Puro aparte del reloj inyectable; el sink decide dónde se guarda.
 */
export class ScoreTracker {
  private prev: ScoreFields | undefined;

  constructor(
    private readonly sink: ScoreSink,
    private readonly now: () => number = Date.now,
  ) {}

  record(me: Me, tick: number, causeRecords: readonly TraceRecord[] = []): ScoreSnapshot | undefined {
    const fields = extractScoreFields(me);
    if (!fields) return undefined;
    const delta = computeDelta(this.prev, fields);
    const cause = causesFromRecords(causeRecords);
    const snapshot: ScoreSnapshot = {
      ts: new Date(this.now()).toISOString(),
      tick,
      ...(fields.venue !== undefined ? { round: fields.venue } : {}),
      ...fields,
      delta,
      cause,
    };
    this.prev = fields;
    this.sink.write(snapshot);
    return snapshot;
  }
}

/** `results/bazaar-live/<fecha>/score.jsonl`, una línea por snapshot. */
export class FileScoreTrace implements ScoreSink {
  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  write(snapshot: ScoreSnapshot): void {
    appendFileSync(join(this.dir, "score.jsonl"), `${JSON.stringify(snapshot)}\n`);
  }
}

/** Línea de una sola línea para la CLI: `score 3.2 (neg 2.1 · mm 0 · duel 0 · ladder 2.1) rank 9 ↑2`. */
export function formatScoreSummary(curr: ScoreFields, prevRank?: number): string {
  const parts = [`neg ${curr.neg_points ?? 0}`, `mm ${curr.mm_points ?? 0}`, `duel ${curr.duel_points ?? 0}`, `ladder ${curr.ladder_points ?? 0}`].join(" · ");
  let rankPart = "";
  if (curr.rank !== undefined) {
    rankPart = ` rank ${curr.rank}`;
    if (prevRank !== undefined && prevRank !== curr.rank) {
      const diff = prevRank - curr.rank;
      rankPart += diff > 0 ? ` ↑${diff}` : ` ↓${-diff}`;
    }
  }
  return `score ${curr.score ?? "?"} (${parts})${rankPart}`;
}

/** Desglose multilínea para `pnpm bazaar:status`. */
export function formatScoreBreakdown(curr: ScoreFields): string[] {
  return [
    `score: ${curr.score ?? "?"} · rank ${curr.rank ?? "?"}${curr.venue ? ` · ${curr.venue}` : ""}`,
    `negotiating ${curr.negotiating ?? "?"} (neg_points ${curr.neg_points ?? "?"}) · market ${curr.market ?? "?"} (mm_points ${curr.mm_points ?? "?"})`,
    `duel_points ${curr.duel_points ?? "?"} · ladder_points ${curr.ladder_points ?? "?"} · bench ${curr.bench_points ?? "?"} (efficiency ${curr.bench_efficiency ?? "?"}, ${curr.bench_venue ?? "?"})`,
    `album ${curr.album_filled ?? "?"}/${curr.album_slots ?? "?"} · pages ${curr.pages_complete ?? "?"} · deals ${curr.deals ?? "?"} · level ${curr.level ?? "?"}`,
    `judges: not scored yet`,
    `frozen ${curr.frozen ?? false}`,
  ];
}

export function liveTraceDirForToday(root: string, now: Date = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10));
}
