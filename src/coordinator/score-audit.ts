import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Me } from "../shared/schemas.js";
import type { FeedEvent } from "../state/world.js";

/**
 * Per-deal score audit (GET only). `neg_points` should move by Σ(your_value − price) on buys and Σ(price − your_value)
 * on sells (docs/bazaar/neg-points-formula.md). Each tick it reads our settlements from the feed since the last read,
 * tags each one dealer (a persona) or team (a venue), values it at OUR value seen BEFORE the deal (last `/api/me` for
 * what we sold, the private-values cache for what we bought) and compares the expected sum with the `neg_points` Δ.
 * RET-10 bought from El Chato at 91 P on tick 530 left neg_points flat: this measures whether dealer deals score.
 */

export interface AuditDeal {
  source: "dealer" | "team";
  counterparty: string;
  settlement: number;
  tick: number;
  side: "buy" | "sell";
  refs: string[];
  price: number;
  fee: number;
  /** Our value of the cards at deal time (sum); `undefined` if one of them was never seen. */
  value?: number;
  /** buy: value − price; sell: price − value (fee not subtracted). */
  expected?: number;
}

export type AuditVerdict = "match" | "dealer-unscored" | "mismatch";

export interface ScoreAuditRecord {
  v: 1;
  tick: number;
  ts: string;
  mode: "live" | "dry-run";
  negBefore: number;
  negAfter: number;
  delta: number;
  deals: AuditDeal[];
  expected: number;
  /** Some deal had no value at deal time: `expected` leaves it out. */
  missingValue?: boolean;
  verdict: AuditVerdict;
  /** Δ of every score part this tick (`/api/me` → score; dealer deals move `ladder_points`, not `neg_points`). */
  parts?: Partial<Record<ScorePart, number>>;
}

/** Score parts read from `/api/me` → score, compared tick to tick. */
export const SCORE_PARTS = ["score", "negotiating", "market", "neg_points", "ladder_points", "duel_points", "mm_points"] as const;
export type ScorePart = (typeof SCORE_PARTS)[number];

const round1 = (x: number) => Math.round(x * 10) / 10;
const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);

/** 'match' if |Δ − expected| ≤ 1; 'dealer-unscored' if only dealer deals, Δ = 0 and expected ≠ 0; 'mismatch' otherwise. */
export function auditVerdict(delta: number, expected: number, deals: readonly Pick<AuditDeal, "source">[]): AuditVerdict {
  if (Math.abs(delta - expected) <= 1) return "match";
  if (deals.length > 0 && deals.every((d) => d.source === "dealer") && round1(delta) === 0 && round1(expected) !== 0) return "dealer-unscored";
  return "mismatch";
}

/** Our settlements in `events` (parties include `team`), one deal per settlement. */
export function ourDeals(events: readonly FeedEvent[], team: string, valueOf: (side: "buy" | "sell", item: { id?: number; ref: string }) => number | undefined): AuditDeal[] {
  const out: AuditDeal[] = [];
  for (const e of events) {
    if (e.type !== "settlement") continue;
    const p = e.payload;
    const parties = Array.isArray(p.parties) ? p.parties.filter((x): x is string => typeof x === "string") : [];
    if (!parties.includes(team)) continue;
    const items = (Array.isArray(p.items) ? p.items : []).filter((i): i is Record<string, unknown> => !!i && typeof i === "object" && typeof (i as { ref?: unknown }).ref === "string");
    const bought = items.filter((i) => i.to === team);
    const sold = items.filter((i) => i.frm === team);
    if (!bought.length && !sold.length) continue;
    const side: AuditDeal["side"] = bought.length >= sold.length ? "buy" : "sell";
    const mine = side === "buy" ? bought : sold;
    const persona = typeof p.persona === "string" && p.persona ? p.persona : undefined;
    const vals = mine.map((i) => valueOf(side, { ...(num(i.id) !== undefined ? { id: num(i.id)! } : {}), ref: i.ref as string }));
    const price = num(p.price) ?? 0;
    const value = vals.every((v) => v !== undefined) ? round1(vals.reduce((s: number, v) => s + v!, 0)) : undefined;
    out.push({
      source: persona ? "dealer" : "team",
      counterparty: persona ?? parties.find((x) => x !== team) ?? "?",
      settlement: num(p.settlement) ?? e.id ?? 0,
      tick: e.tick,
      side,
      refs: mine.map((i) => i.ref as string),
      price,
      fee: num(p.fee) ?? 0,
      ...(value !== undefined ? { value, expected: round1(side === "buy" ? value - price : price - value) } : {}),
    });
  }
  return out;
}

export function defaultScoreAuditFile(root: string, now: Date = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10), "score-audit.jsonl");
}

/**
 * Keeps the last `neg_points`, the settlements already seen and our values at the previous tick. `observe` returns the
 * tick's audit line and record (none on the first call, which only sets the baseline, nor on a tick with no Δ and no deal).
 */
export class ScoreAudit {
  private lastNeg: number | undefined;
  private lastParts: Partial<Record<ScorePart, number>> = {};
  private readonly seen = new Set<number>();
  private byAsset = new Map<number, number>();
  private byRef = new Map<string, number>();

  constructor(private readonly o: { file?: string; mode: "live" | "dry-run" }) {}

  observe(input: { tick: number; me: Me; events: readonly FeedEvent[]; values: Readonly<Record<string, number>> }): { line?: string; record?: ScoreAuditRecord } {
    const score = (input.me.score ?? {}) as Record<string, unknown>;
    const neg = num(score.neg_points);
    const parts: Partial<Record<ScorePart, number>> = {};
    for (const k of SCORE_PARTS) {
      const now = num(score[k]);
      const before = this.lastParts[k];
      if (now !== undefined && before !== undefined && Math.round((now - before) * 1000) !== 0) parts[k] = Math.round((now - before) * 1000) / 1000;
    }
    const team = input.me.id;
    const fresh = input.events.filter((e) => e.type === "settlement" && !this.seen.has(num(e.payload.settlement) ?? e.id ?? -1));
    for (const e of fresh) this.seen.add(num(e.payload.settlement) ?? e.id ?? -1);
    const first = this.lastNeg === undefined;
    const out: { line?: string; record?: ScoreAuditRecord } = {};
    if (!first && neg !== undefined && team) {
      const deals = ourDeals(fresh, team, (side, item) => (side === "sell" && item.id !== undefined ? this.byAsset.get(item.id) : undefined) ?? this.byRef.get(item.ref));
      const delta = round1(neg - this.lastNeg!);
      if (delta !== 0 || deals.length || parts.ladder_points !== undefined) {
        const expected = round1(deals.reduce((s, d) => s + (d.expected ?? 0), 0));
        const missingValue = deals.some((d) => d.expected === undefined);
        const verdict = auditVerdict(delta, expected, deals);
        const record: ScoreAuditRecord = { v: 1, tick: input.tick, ts: new Date().toISOString(), mode: this.o.mode, negBefore: this.lastNeg!, negAfter: neg, delta, deals, expected, ...(missingValue ? { missingValue } : {}), verdict, ...(Object.keys(parts).length ? { parts } : {}) };
        const list = deals.map((d) => `${d.source} ${d.counterparty} ${d.side} ${d.refs.join("+")} @ ${d.price} P (${d.value !== undefined ? `v ${d.value}, exp ${d.expected! >= 0 ? "+" : ""}${d.expected}` : "v ?"}, tick ${d.tick})`).join("; ");
        out.line = `score audit: neg_points ${this.lastNeg} → ${neg} (Δ ${delta}) at tick ${input.tick}: ${verdict} · expected ${expected}${missingValue ? " (a value unknown)" : ""} · deals: ${list || "none of ours in the feed"}${Object.keys(parts).length ? ` · parts: ${Object.entries(parts).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).join(", ")}` : ""}`;
        out.record = record;
        if (this.o.file) {
          try {
            mkdirSync(dirname(this.o.file), { recursive: true });
            appendFileSync(this.o.file, `${JSON.stringify(record)}\n`);
          } catch (e) {
            out.line += ` (not written: ${e instanceof Error ? e.message : "error"})`;
          }
        }
      }
    }
    if (neg !== undefined) this.lastNeg = neg;
    for (const k of SCORE_PARTS) {
      const v = num(score[k]);
      if (v !== undefined) this.lastParts[k] = v;
    }
    // Values before the next tick's deals: what we hold (sold assets) and the private-values cache (cards we could buy).
    this.byAsset = new Map(input.me.assets.flatMap((a) => (typeof a.your_value === "number" ? [[a.id, a.your_value] as [number, number]] : [])));
    const byRef = new Map(Object.entries(input.values));
    for (const a of input.me.assets) if (typeof a.your_value === "number" && !byRef.has(a.ref)) byRef.set(a.ref, a.your_value);
    this.byRef = byRef;
    return out;
  }
}
