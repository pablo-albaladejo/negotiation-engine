/**
 * Hindsight optimum of one bench session: the best set of (ask, bid) pairs a broker could have made given only what
 * bench.jsonl shows. A pair is feasible when, at some tick, both traders are in the book with bid quote ≥ ask quote; its
 * weight is the best quote surplus (bid − ask) over those common ticks. A maximum-weight bipartite matching (Hungarian
 * algorithm, each trader at most once) picks the pairs: most quote surplus first, then most pairs. Quote surplus only —
 * the book has no private limits, so this is not the official efficiency. Pure functions: no I/O.
 */

export interface BookLine {
  tick: number;
  bench?: { id: string; side: string; quote: number }[] | null | undefined;
}

export interface OptimalPair {
  ask_id: string;
  bid_id: string;
  /** Best common tick (most surplus; earliest on a tie). */
  tick: number;
  ask: number;
  bid: number;
  surplus: number;
}

/**
 * Maximum-weight assignment on a rows × cols weight matrix (weights ≥ 0; padded square, O(n³)). Returns, per row, the
 * column it got or -1. Callers drop the rows whose weight is 0 (infeasible).
 */
export function maxWeightAssignment(w: number[][]): number[] {
  const rows = w.length;
  const cols = rows ? Math.max(...w.map((r) => r.length)) : 0;
  const n = Math.max(rows, cols);
  if (n === 0) return [];
  const max = Math.max(0, ...w.flat());
  // Min-cost form: cost = max − weight; padding cells weigh 0.
  const cost = (i: number, j: number) => max - (w[i]?.[j] ?? 0);
  const INF = Number.POSITIVE_INFINITY;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(INF);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0]!;
      let delta = INF;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost(i0 - 1, j - 1) - u[i0]! - v[j]!;
        if (cur < minv[j]!) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j]! < delta) {
          delta = minv[j]!;
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]!] = u[p[j]!]! + delta;
          v[j] = v[j]! - delta;
        } else minv[j] = minv[j]! - delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0]!;
      p[j0] = p[j1]!;
      j0 = j1;
    } while (j0 !== 0);
  }
  const out = new Array<number>(rows).fill(-1);
  for (let j = 1; j <= n; j++) {
    const i = p[j]! - 1;
    if (i >= 0 && i < rows && j - 1 < cols) out[i] = j - 1;
  }
  return out;
}

/** Key of an (ask, bid) pair, as in `prefer`. */
export const pairKey = (askId: string | null, bidId: string | null) => `${askId}\u0000${bidId}`;

/**
 * Hindsight optimum over the book lines up to `throughTick` (inclusive; all lines when null). Among equally good
 * matchings (same surplus, same pairs) it keeps the pairs in `prefer` (ours), so a tie is not reported as a miss.
 */
export function hindsightOptimum(lines: BookLine[], throughTick: number | null = null, prefer: ReadonlySet<string> = new Set()): OptimalPair[] {
  // Book per tick: union of the re-reads of that tick, last quote per trader.
  const byTick = new Map<number, Map<string, { side: string; quote: number }>>();
  for (const l of lines) {
    if (throughTick !== null && l.tick > throughTick) continue;
    const book = byTick.get(l.tick) ?? new Map<string, { side: string; quote: number }>();
    for (const q of l.bench ?? []) book.set(q.id, { side: q.side, quote: q.quote });
    byTick.set(l.tick, book);
  }
  const ticks = [...byTick.keys()].sort((a, b) => a - b);
  const askIds = new Set<string>();
  const bidIds = new Set<string>();
  // Best common tick per feasible (ask, bid) pair.
  const best = new Map<string, OptimalPair>();
  for (const tick of ticks) {
    const book = byTick.get(tick)!;
    const asks = [...book].filter(([, q]) => q.side === "ask");
    const bids = [...book].filter(([, q]) => q.side === "bid");
    for (const [id] of asks) askIds.add(id);
    for (const [id] of bids) bidIds.add(id);
    for (const [a, qa] of asks)
      for (const [b, qb] of bids) {
        const surplus = qb.quote - qa.quote;
        if (surplus < 0) continue;
        const key = pairKey(a, b);
        const prev = best.get(key);
        if (!prev || surplus > prev.surplus) best.set(key, { ask_id: a, bid_id: b, tick, ask: qa.quote, bid: qb.quote, surplus });
      }
  }
  const asks = [...askIds].sort();
  const bids = [...bidIds].sort();
  // Feasible weight = cents × B² + B + (1 if preferred), B = pairs bound + 1: surplus first, then more pairs, then
  // ours on a tie (the lower terms of a whole matching never add up to one step of the term above); 0 = infeasible.
  const B = Math.min(asks.length, bids.length) + 2;
  const w = asks.map((a) =>
    bids.map((b) => {
      const p = best.get(pairKey(a, b));
      return p ? Math.round(p.surplus * 100) * B * B + B + (prefer.has(pairKey(a, b)) ? 1 : 0) : 0;
    }),
  );
  const pick = maxWeightAssignment(w);
  const out: OptimalPair[] = [];
  pick.forEach((j, i) => {
    if (j < 0 || (w[i]?.[j] ?? 0) === 0) return;
    const p = best.get(pairKey(asks[i]!, bids[j]!));
    if (p) out.push(p);
  });
  return out.sort((a, b) => a.tick - b.tick || b.surplus - a.surplus || a.ask_id.localeCompare(b.ask_id));
}
