import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import type { ThreadSummary } from "./thread-log.js";

/**
 * `docs/bazaar/lessons.json` (schema "bazaar-lessons/v1"): one entry per closed conversation with what was measured
 * and automatically derived lessons. Appended without rewriting existing entries (insertion in the
 * text, validated with JSON.parse) and with atomic rename. Only our values; never keys or anything private of others.
 */

export const LESSONS_SCHEMA = "bazaar-lessons/v1";

export interface LessonEntry {
  thread: number;
  dealer: string;
  kind: "buy" | "sell";
  item: string;
  our_value: number | null;
  our_limit: number | null;
  her_opening: number | null;
  her_final: number | null;
  /** `welcome_first_deal`: its accepted opening, measured as its limit for this dealer and this band (`item`). */
  measured_limit?: number;
  final_flag: boolean;
  our_prices: number[];
  her_prices: number[];
  messages_until_final: number | null;
  ticks_until_final?: number;
  ticks_until_close?: number;
  outcome: ThreadSummary["outcome"];
  price: number | null;
  received?: string[];
  value_created: number;
  ladder_points_after?: number;
  neg_points_delta?: number;
  tick: number;
  ts: string;
  cards: string[];
  copies_before: Record<string, number>;
  copies_after: Record<string, number>;
  deals_with_dealer_last_hour: number;
  notes: string;
  lessons: string[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Lessons deduced only from what was measured (without interpreting its text). */
export function deriveLessons(s: ThreadSummary, lowballFrac = 0.7): string[] {
  const L: string[] = [];
  const her = s.herPrices;
  if (s.measuredLimit !== undefined) L.push(`welcome_first_deal: first conversation with ${s.dealer}, her opening ${s.measuredLimit} is her limit for ${s.target}.`);
  if (her.length >= 2 && her.every((p) => p === her[0])) L.push(`She did not move: ${her.length} prices at ${her[0]}.`);
  else if (her.length >= 2) {
    const moved = Math.abs(her[her.length - 1]! - her[0]!);
    if (moved > 0) L.push(`She conceded ${moved} P from her opening (${her[0]} → ${her[her.length - 1]}).`);
  }
  if (s.outcome === "deal" && s.price !== undefined && s.herList !== undefined) {
    if (s.kind === "buy" && s.price < s.herList) L.push(`Accepted below her list (${s.price} < list ${s.herList}).`);
    if (s.kind === "buy" && s.price > s.herList) L.push(`Paid above her list (${s.price} > list ${s.herList}).`);
    if (s.kind === "sell" && s.price > s.herList) L.push(`She paid above her own sell list (${s.price} > list ${s.herList}).`);
  }
  for (const r of s.received ?? []) {
    const before = s.copiesBefore[r] ?? 0;
    if (before > 0) L.push(`Duplicate received: ${r} (we already had ${before}).`);
  }
  if (s.finalFlag) L.push(`Her final came after ${s.patience.msgs} of our messages (${s.patience.ticks} ticks).`);
  if (s.rule === "lowball-bid" && s.herOpening !== undefined && s.ourLimit !== undefined)
    L.push(`Her first bid ${s.herOpening} was below ${lowballFrac} × our minimum ${s.ourLimit}: closed after one counter.`);
  if (s.outcome === "deal" && s.valueCreated !== undefined && s.valueCreated < 0) L.push(`Negative value at our private values (${s.valueCreated} P): scores as negative neg_points.`);
  if (s.outcome === "walked") L.push("She walked away: patience exhausted before agreement.");
  if (s.outcome === "cooloff") L.push("Cool-off imposed: wait until_tick before reopening with her.");
  return L;
}

export function lessonFromSummary(s: ThreadSummary, settle?: { negDelta?: number; ladderAfter?: number }): LessonEntry {
  const item = s.cards.length ? `${s.cards.join(", ")} (${s.target})` : s.target;
  const notes = [`auto: ${s.rule ? `last rule ${s.rule}; ` : ""}${s.closedReason ? `closed_reason ${s.closedReason}; ` : ""}patience ${s.patience.msgs} msgs, her replies ${s.patience.herReplies}`];
  if (settle && settle.negDelta === undefined && s.outcome === "deal") notes.push("neg_points had not moved when the entry was written");
  return {
    thread: s.thread,
    dealer: s.dealer,
    kind: s.kind,
    item,
    our_value: s.ourValue !== undefined ? round1(s.ourValue) : null,
    our_limit: s.ourLimit ?? null,
    her_opening: s.herOpening ?? null,
    her_final: s.finalFlag ? (s.herFinal ?? null) : null,
    ...(s.measuredLimit !== undefined ? { measured_limit: s.measuredLimit } : {}),
    final_flag: s.finalFlag,
    our_prices: s.ourPrices,
    her_prices: s.herPrices,
    messages_until_final: s.finalFlag ? s.patience.msgs : null,
    ...(s.patience.untilFinal ? { ticks_until_final: s.patience.ticks } : { ticks_until_close: s.patience.ticks }),
    outcome: s.outcome,
    price: s.outcome === "deal" ? (s.price ?? null) : null,
    ...(s.received?.length ? { received: s.received } : {}),
    value_created: s.outcome === "deal" ? (s.valueCreated ?? 0) : 0,
    ...(settle?.ladderAfter !== undefined ? { ladder_points_after: settle.ladderAfter } : {}),
    ...(settle?.negDelta !== undefined ? { neg_points_delta: settle.negDelta } : {}),
    tick: s.tick,
    ts: s.ts,
    cards: s.cards,
    copies_before: s.copiesBefore,
    copies_after: s.copiesAfter,
    deals_with_dealer_last_hour: s.dealsWithDealerLastHour,
    notes: notes.join("; "),
    lessons: deriveLessons(s),
  };
}

function emptyFile(): string {
  return `${JSON.stringify({ schema: LESSONS_SCHEMA, description: "Lessons learned per Bazaar conversation.", updated: "", conversations: [], global_lessons: [], open_hypotheses: [] }, null, 2)}\n`;
}

/** Index of the `]` that closes the array starting at `open` (respects strings and escapes). */
function closingBracket(text: string, open: number): number {
  let depth = 0;
  let inStr = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i]!;
    if (inStr) {
      if (ch === "\\") i += 1;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[" || ch === "{") depth += 1;
    else if (ch === "]" || ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Appends the entry at the end of `conversations` without touching the text of existing ones. Does nothing if there is already
 * an entry for that thread and dealer. Returns whether it wrote. Throws if the file is not valid JSON.
 */
export function appendLesson(file: string, entry: LessonEntry, today: string = new Date().toISOString().slice(0, 10)): boolean {
  let text = existsSync(file) ? readFileSync(file, "utf8") : emptyFile();
  const data = JSON.parse(text) as { schema?: string; conversations?: { thread?: number; dealer?: string }[] };
  if (data.schema !== undefined && data.schema !== LESSONS_SCHEMA) throw new Error(`lessons: schema ${data.schema} ≠ ${LESSONS_SCHEMA}`);
  if (!Array.isArray(data.conversations)) throw new Error("lessons: missing conversations[]");
  if (data.conversations.some((c) => c.thread === entry.thread && c.dealer === entry.dealer)) return false;
  const key = text.search(/"conversations"\s*:\s*\[/);
  const open = text.indexOf("[", key);
  const close = closingBracket(text, open);
  if (key < 0 || close < 0) throw new Error("lessons: cannot locate conversations[]");
  const body = JSON.stringify(entry, null, 2).replace(/\n/g, "\n    ");
  let head = text.slice(0, close).replace(/\s*$/, "");
  head += data.conversations.length ? `,\n    ${body}` : `\n    ${body}`;
  text = `${head}\n  ${text.slice(close)}`;
  text = text.replace(/("updated"\s*:\s*)"[^"]*"/, `$1"${today}"`);
  JSON.parse(text);
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
  return true;
}

interface Pending {
  summary: ThreadSummary;
  closedTick: number;
}

/**
 * Lessons for a deal wait for its effect on the figure to settle (neg_points may arrive a few ticks
 * later): they are written when neg_points changes relative to the opening or after `settleTicks`. Without a deal, immediately.
 */
export class PendingLessons {
  private readonly pending: Pending[] = [];
  constructor(
    private readonly write: (entry: LessonEntry) => void,
    private readonly settleTicks = 5,
  ) {}

  add(summary: ThreadSummary): void {
    if (summary.outcome !== "deal" || summary.negPointsBefore === undefined) this.write(lessonFromSummary(summary));
    else this.pending.push({ summary, closedTick: summary.tick });
  }

  /** Each tick with the public figure (`me.score`): writes those that have already settled. */
  observe(score: { neg_points?: unknown; ladder_points?: unknown } | undefined, tick: number): void {
    const neg = typeof score?.neg_points === "number" ? score.neg_points : undefined;
    const ladder = typeof score?.ladder_points === "number" ? score.ladder_points : undefined;
    for (const p of [...this.pending]) {
      const before = p.summary.negPointsBefore;
      const moved = neg !== undefined && before !== undefined && round1(neg - before) !== 0;
      if (!moved && tick - p.closedTick < this.settleTicks) continue;
      this.pending.splice(this.pending.indexOf(p), 1);
      this.write(lessonFromSummary(p.summary, { ...(moved ? { negDelta: Math.round((neg! - before!) * 100) / 100 } : {}), ...(ladder !== undefined ? { ladderAfter: ladder } : {}) }));
    }
  }

  /** On stop: write whatever is pending as is. */
  flush(): void {
    for (const p of this.pending.splice(0)) this.write(lessonFromSummary(p.summary, {}));
  }

  get size(): number {
    return this.pending.length;
  }
}
