import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import type { Me } from "../shared/schemas.js";
import { ACCEPT_PRIORITY, type Intent } from "./coordinator.js";

/**
 * `plan.jsonl`: one structured line per coordinator tick, written after execution. Cash and holdings at the start of
 * the tick, every route's intents, the arbitration verdicts and the execution results (what `play.log` shows as text).
 * Read by the auditor (`src/audit/`). Local trace only: no key.
 */

export const PlanIntentSchema = z.object({
  id: z.string(),
  route: z.string(),
  kind: z.string(),
  ref: z.string().optional(),
  assetIds: z.array(z.number()).optional(),
  price: z.number().optional(),
  value: z.number().optional(),
  ev: z.number().optional(),
  rank: z.number().optional(),
  conversation: z.string().optional(),
  summary: z.string().optional(),
});

export const PlanVerdictSchema = z.object({
  id: z.string(),
  verdict: z.enum(["selected", "dropped"]),
  reason: z.string().optional(),
});

/** `id` is the selected intent the line refers to when it can be matched; otherwise the route name. */
export const PlanExecutionSchema = z.object({
  id: z.string(),
  route: z.string(),
  ok: z.boolean(),
  error: z.string().optional(),
  detail: z.string().optional(),
});

export const PlanLineSchema = z.object({
  v: z.literal(1),
  tick: z.number(),
  ts: z.string(),
  mode: z.enum(["live", "dry-run"]),
  cash: z.number().optional(),
  cashFloor: z.number().optional(),
  maxSpend: z.number().optional(),
  /** Card copies by ref; sealed packs as `pack:<asset id>`. */
  holdings: z.record(z.string(), z.number()),
  intents: z.array(PlanIntentSchema),
  arbitration: z.array(PlanVerdictSchema),
  execution: z.array(PlanExecutionSchema),
  /** Routes whose `propose` threw this tick (`route: error`). */
  routeErrors: z.array(z.string()).optional(),
});

export type PlanIntent = z.infer<typeof PlanIntentSchema>;
export type PlanVerdict = z.infer<typeof PlanVerdictSchema>;
export type PlanExecution = z.infer<typeof PlanExecutionSchema>;
export type PlanLine = z.infer<typeof PlanLineSchema>;

export function defaultPlanLogFile(root: string, now: Date = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10), "plan.jsonl");
}

export function holdingsOf(me: Me | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of me?.assets ?? []) {
    const key = (a.kind ?? "card") === "card" ? a.ref : `${a.kind}:${a.id}`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export function planIntent(i: Intent): PlanIntent {
  const assetIds = (i.locks ?? []).filter((l) => l.startsWith("asset:")).map((l) => Number(l.slice(6))).filter(Number.isFinite);
  const ref = i.ref ?? (i.locks ?? []).find((l) => l.startsWith("sell:") || l.startsWith("buy:"))?.split(":")[1];
  return {
    id: i.id,
    route: i.route,
    kind: i.kind,
    ...(ref ? { ref } : {}),
    ...(assetIds.length ? { assetIds } : {}),
    ...(i.price !== undefined ? { price: i.price } : {}),
    ...(i.ev !== undefined ? { ev: i.ev } : {}),
    ...(i.acceptClass ? { rank: ACCEPT_PRIORITY[i.acceptClass].rank } : {}),
    ...(i.conversation ? { conversation: i.conversation } : {}),
    summary: i.summary,
  };
}

/**
 * Execution lines are text, so failures are read from their shape (the same ones the auditor reads in play.log):
 * `markets: #4230 failed: offer_not_open`, `El Rastro error: post list SAL-03 @8: asset_locked` (or `…: skipped, …`),
 * `dealer abuela: [tick 406] · error · buy:RET-02 · error persona_quota`. A line is tied to the selected intent of its
 * route whose last id segment (offer, asset, message, duel, thread) it mentions; El Rastro posts by ref and price.
 */
export function planExecution(route: string, line: string, selected: readonly Intent[]): PlanExecution {
  const error =
    /\bfailed: ([^\s,;)]+)/.exec(line)?.[1] ??
    /^El Rastro error: .*: ([\w-]+)$/.exec(line)?.[1] ??
    (/^El Rastro error: .*: skipped\b/.test(line) ? "skipped" : undefined) ??
    /^dealer \w+: \[tick \d+\] · error · .*error ([\w-]+)/.exec(line)?.[1];
  const post = /\bpost (?:list|bid) ([A-Z]+-\d+) @ ?(\d+(?:\.\d+)?)/.exec(line);
  const match = selected.find((i) => {
    if (i.route !== route) return false;
    if (post && i.id.startsWith("trades:post:")) return i.ref === post[1] && i.price === Number(post[2]);
    const tail = i.id.split(":").at(-1);
    return !!tail && new RegExp(`(^|[^\\w])#?${escape(tail)}(?![\\w])`).test(line);
  });
  return { id: match?.id ?? route, route, ok: !error, ...(error ? { error } : {}), detail: line };
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Appends one line; a failed write only warns (the tick goes on). */
export function writePlanLine(file: string, line: PlanLine): void {
  try {
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${JSON.stringify(line)}\n`);
  } catch (e) {
    console.log(`  plan: not written (${e instanceof Error ? e.message : "error"})`);
  }
}
