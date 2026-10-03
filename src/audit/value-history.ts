import type { Lot } from "./ledger.js";
import type { DecisionNote, PlanLine } from "./sources.js";

/**
 * Our private value of each card AS OF a past tick, so a detector never judges an old trade with today's value (a page
 * that progressed later makes the same card worth far more now: RET-02 was 16 P when we sold it at t230 and 122 P by the
 * end of the day). Sources, best first:
 * - `plan.jsonl` intents and `play.log` `[trades] listing:` lines: `POST list <ref> @ P P (…, value V)` (value created
 *   by selling = P − value of the copy, maker fee 0) and `POST bid <ref> @ P P (…, value V)` (gain of the card = P + V);
 * - `play.log` price sheet: `top sell edges (bid − value, held)` (value = bid − edge) and `top buy edges (value − ask)`
 *   (value = ask + edge);
 * - `decisions.jsonl` reservation of a dealer thread (a limit, not the value: used only when nothing else is near).
 * Every value is the one of the copy at stake at that tick (the last held copy, or the first one if we held none).
 */

/** A historical value farther than this from the trade tick does not count: the detector falls back to today's value. */
export const VALUE_WINDOW_TICKS = 10;

export interface ValuePoint {
  tick: number;
  value: number;
  source: string;
  /** 0 = trades listing/bid or price sheet, 1 = dealer reservation (a limit). */
  rank: 0 | 1;
}

const REF = "([A-Z]{3}-\\d{2})";
const NUM = "(-?\\d+(?:\\.\\d+)?)";
const POST_RE = new RegExp(`POST (list|bid) ${REF} @ ${NUM} P \\([^()]*?value ${NUM}\\)`);
const SHEET_RE = new RegExp(`${REF} ([+-]?\\d+(?:\\.\\d+)?) \\((bid|ask) ${NUM}@`, "g");

export class ValueHistory {
  readonly points = new Map<string, ValuePoint[]>();
  private tick: number | undefined;

  add(ref: string, p: ValuePoint): void {
    if (!Number.isFinite(p.value)) return;
    const list = this.points.get(ref) ?? [];
    if (!list.some((q) => q.tick === p.tick && q.value === p.value && q.source === p.source)) list.push(p);
    this.points.set(ref, list);
  }

  /** A trades listing or bid summary (plan.jsonl intent or play.log line). */
  addPost(text: string, tick: number, source: string): void {
    const m = POST_RE.exec(text);
    if (!m) return;
    const price = Number(m[3]);
    const v = Number(m[4]);
    this.add(m[2]!, { tick, value: m[1] === "list" ? price - v : price + v, source: `${source} POST ${m[1]} ${m[2]} @ ${price} (value created ${v})`, rank: 0 });
  }

  addPlan(line: PlanLine): void {
    for (const i of line.intents) if (i.summary) this.addPost(i.summary, line.tick, "plan.jsonl");
  }

  /** One play.log line; `== tick N` sets the tick of the following lines. */
  pushPlayLog(raw: string): void {
    const line = raw.replace(/^\d\d:\d\d:\d\d\s+/, "").trim();
    const t = /^== tick (\d+)/.exec(line);
    if (t) {
      this.tick = Number(t[1]);
      return;
    }
    if (this.tick === undefined) return;
    if (/^\[trades\] listing: /.test(line)) this.addPost(line, this.tick, "play.log");
    const sheet = /^top (sell|buy) edges /.exec(line);
    if (!sheet) return;
    for (const m of line.matchAll(SHEET_RE)) {
      const edge = Number(m[2]);
      const quote = Number(m[4]);
      const value = m[3] === "bid" ? quote - edge : quote + edge;
      this.add(m[1]!, { tick: this.tick, value: Math.round(value * 10) / 10, source: `play.log top ${sheet[1]} edges (${m[3]} ${quote}, edge ${edge})`, rank: 0 });
    }
  }

  /** Dealer reservations: `buy:<ref>` directly, `sell:<asset id>` through the ledger's book. */
  addDecisions(decisions: DecisionNote[], lots: Lot[]): void {
    const refOf = new Map(lots.map((l) => [l.id, l.ref]));
    for (const d of decisions) {
      if (d.reservation === undefined || !d.target) continue;
      const m = /^(buy|sell):(.+)$/.exec(d.target);
      const ref = m?.[1] === "buy" ? (/^[A-Z]{3}-\d{2}$/.test(m[2]!) ? m[2]! : undefined) : m ? refOf.get(Number(m[2])) : undefined;
      if (ref) this.add(ref, { tick: d.tick, value: d.reservation, source: `decisions.jsonl reservation (${d.dealer} thread ${d.thread}, a limit)`, rank: 1 });
    }
  }

  /**
   * The value nearest to `tick` within VALUE_WINDOW_TICKS with the copies we held then: listings, bids and the price
   * sheet first, a reservation only if none of them is near; at equal distance the earlier point. A point logged in a
   * tick where that card also settled is skipped: whether its state saw the trade is unknown, and the value of a copy
   * depends on how many we held (the API gives every copy the marginal of the last one).
   */
  at(ref: string, tick: number, lots: Lot[]): (ValuePoint & { held: number }) | undefined {
    const near = (this.points.get(ref) ?? []).filter((p) => Math.abs(p.tick - tick) <= VALUE_WINDOW_TICKS);
    for (const rank of [0, 1]) {
      const sorted = near.filter((p) => p.rank === rank).sort((a, b) => Math.abs(a.tick - tick) - Math.abs(b.tick - tick) || a.tick - b.tick);
      for (const p of sorted) {
        const held = heldAt(lots, ref, p.tick);
        if (held === heldAt(lots, ref, p.tick, "end")) return { ...p, held };
      }
    }
    return undefined;
  }
}

/** Copies of `ref` held at the start of `tick` (before that tick's settlements) or at its end, from the ledger's book. */
export function heldAt(lots: Lot[], ref: string, tick: number, when: "start" | "end" = "start"): number {
  return lots.filter((l) => l.ref === ref && (when === "start" ? l.inTick < tick && (l.outTick === undefined || l.outTick >= tick) : l.inTick <= tick && (l.outTick === undefined || l.outTick > tick))).length;
}
