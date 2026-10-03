import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Me } from "./schemas.js";
import type { TraceRecord } from "./trace.js";

/**
 * The figure we maximize: weighted average over 3 days (Fri 0.5, Sat 1, Sun 1) of Negotiating 30 +
 * Trading 30 + Judges 40. `/api/me` returns it in `score`; here the public fields listed below are only extracted, traced and
 * summarized. `rarest`, `luck` and `luck_private` never count nor are
 * stored: they are not even read (closed list of fields).
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
  bench_efficiency: z.number().nullish(),
  bench_points: z.number().nullish(),
  bench_venue: z.string().nullish(),
  level: z.number().optional(),
  album_filled: z.number().optional(),
  album_slots: z.number().optional(),
  pages_complete: z.number().optional(),
  deals: z.number().optional(),
  badges: z.array(z.unknown()).optional(),
  adjustments: z.unknown().optional(),
  frozen: z.boolean().optional(),
  venue: z.string().nullish(),
  rank: z.number().optional(),
});
export type ScoreFields = z.infer<typeof ScoreFieldsSchema>;

/** Numeric fields for which computing a delta makes sense. */
const NUMERIC_KEYS = ["score", "negotiating", "market", "neg_points", "mm_points", "duel_points", "ladder_points", "bench_efficiency", "bench_points", "level", "album_filled", "album_slots", "pages_complete", "deals", "rank"] as const satisfies readonly (keyof ScoreFields)[];

/**
 * Reads `me.score` with a closed list of fields (allowlist): even if the server includes
 * `rarest`/`luck`/`luck_private` or another private field, they never reach `picked` and so are never
 * returned, traced or served. `undefined` if `me.score` is not an object or fails validation.
 */
export function extractScoreFields(me: Me): ScoreFields | undefined {
  const raw = me.score;
  if (!raw || typeof raw !== "object") return undefined;
  const picked: Record<string, unknown> = {};
  for (const key of SCORE_KEYS) if (key in raw) picked[key] = (raw as Record<string, unknown>)[key];
  const parsed = ScoreFieldsSchema.safeParse(picked);
  return parsed.success ? parsed.data : undefined;
}

/** Per-numeric-field difference against the previous snapshot; 0 if there is none or it does not change. */
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

/** Agent trace actions since the previous snapshot that probably moved the figure:
 * acceptances and settled outcomes (`deal`). Never includes private reservation or text. */
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
  /** Day of the event (Fri/Sat/Sun), if the server gives it in `venue`; otherwise absent. */
  round?: string;
  delta: Record<string, number>;
  cause: CauseEntry[];
}

export interface ScoreSink {
  write(snapshot: ScoreSnapshot): void;
}

/**
 * Accumulates the previous snapshot to compute `delta` and builds the cause from the agent's traces
 * since the last call. Pure apart from the injectable clock; the sink decides where it is stored.
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
      ...(fields.venue ? { round: fields.venue } : {}),
      ...fields,
      delta,
      cause,
    };
    this.prev = fields;
    this.sink.write(snapshot);
    return snapshot;
  }
}

/** `results/bazaar-live/<date>/score.jsonl`, one line per snapshot. */
export class FileScoreTrace implements ScoreSink {
  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  write(snapshot: ScoreSnapshot): void {
    appendFileSync(join(this.dir, "score.jsonl"), `${JSON.stringify(snapshot)}\n`);
  }
}

/** Single-line summary for the CLI: `score 3.2 (neg 2.1 · mm 0 · duel 0 · ladder 2.1) rank 9 ↑2`. */
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

/** Multi-line breakdown for `pnpm bazaar:status`. */
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
