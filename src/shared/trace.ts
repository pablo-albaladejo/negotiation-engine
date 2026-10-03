import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { PatienceSummary } from "../dealers/negotiation/patience.js";
import type { ThreadSummary } from "../dealers/history/thread-log.js";

/** One JSONL line per decision: what the viewer needs to rebuild each thread. No key. */
export interface TraceRecord {
  ts: string;
  tick: number;
  dealer: string;
  dryRun: boolean;
  action: "open" | "accept" | "counter" | "hold" | "close" | "wait" | "idle" | "outcome" | "error" | "blocked";
  thread?: number;
  target?: string;
  side?: "buy" | "sell";
  herPrice?: number;
  herOpening?: number;
  herFinal?: boolean;
  ourPrice?: number;
  /** Private reservation used (local trace only; never in a message to the dealer). */
  reservation?: number;
  effectiveReservation?: number;
  rule?: string;
  text?: string;
  status?: string;
  closedReason?: string;
  settledPrice?: number;
  /** `welcome-first-deal`: its opening, measured as its limit for this dealer and this band (`target`). */
  measuredLimit?: number;
  /**
   * We accepted its opening without making an offer: the server counts it as took_opening, not as a negotiated deal
   * (it does not enter the average share; personas.md § 9).
   */
  tookOpening?: boolean;
  /** Do its steps follow ours? (`mirrorVerdict`: mirror, not-mirror, unknown). */
  mirror?: string;
  error?: string;
  /** On close/accept/finish: our messages, its replies, ticks until its end and the reply to each step. */
  patience?: PatienceSummary;
  /** On finishing a conversation: cards, copies before/after, deals with the dealer in the hour, opening/final and patience. */
  summary?: ThreadSummary;
}

export interface TraceSink {
  write(record: TraceRecord): void;
}

/** `results/bazaar-live/<date>/decisions.jsonl` + `thread-<id>.jsonl` per thread. */
export class FileTrace implements TraceSink {
  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  write(record: TraceRecord): void {
    const line = `${JSON.stringify(record)}\n`;
    appendFileSync(join(this.dir, "decisions.jsonl"), line);
    if (record.thread !== undefined) appendFileSync(join(this.dir, `thread-${record.thread}.jsonl`), line);
  }
}

export function liveTraceDir(root: string, now: Date = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10));
}
