import { describe, expect, it } from "vitest";
import { hindsightOptimum, maxWeightAssignment, pairKey } from "../server/bazaar/market-test/optimum.js";

/** Best total weight over every partial matching, by brute force (small sizes only). */
function bruteBest(w: number[][]): number {
  const cols = w[0]?.length ?? 0;
  const go = (i: number, used: Set<number>): number => {
    if (i === w.length) return 0;
    let best = go(i + 1, used);
    for (let j = 0; j < cols; j++) {
      if (used.has(j) || w[i]![j]! === 0) continue;
      used.add(j);
      best = Math.max(best, w[i]![j]! + go(i + 1, used));
      used.delete(j);
    }
    return best;
  };
  return go(0, new Set());
}

describe("market test hindsight optimum", () => {
  it("max-weight assignment matches brute force on random matrices", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let n = 0; n < 200; n++) {
      const rows = 1 + Math.floor(rnd() * 5);
      const cols = 1 + Math.floor(rnd() * 5);
      const w = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rnd() < 0.4 ? 0 : Math.floor(rnd() * 20))));
      const pick = maxWeightAssignment(w);
      const cols_ = pick.filter((j) => j >= 0);
      expect(new Set(cols_).size).toBe(cols_.length);
      const total = pick.reduce((a, j, i) => a + (j >= 0 ? w[i]![j]! : 0), 0);
      expect(total).toBe(bruteBest(w));
    }
  });

  it("picks the best common tick, keeps zero-surplus pairs and prefers ours on a tie", () => {
    const lines = [
      { tick: 1, bench: [{ id: "a1", side: "ask", quote: 50 }, { id: "b1", side: "bid", quote: 52 }, { id: "b2", side: "bid", quote: 52 }] },
      { tick: 2, bench: [{ id: "a1", side: "ask", quote: 48 }, { id: "a2", side: "ask", quote: 60 }, { id: "b1", side: "bid", quote: 53 }, { id: "b3", side: "bid", quote: 60 }] },
      { tick: 3, bench: [{ id: "a3", side: "ask", quote: 70 }, { id: "b4", side: "bid", quote: 70 }] },
    ];
    const opt = hindsightOptimum(lines);
    expect(opt.map((p) => [p.ask_id, p.bid_id, p.tick, p.surplus])).toEqual([
      ["a1", "b3", 2, 12],
      ["a3", "b4", 3, 0],
    ]);
    // Through tick 1: a1×b1 and a1×b2 tie at 2; the preferred one wins.
    expect(hindsightOptimum(lines, 1).map((p) => p.surplus)).toEqual([2]);
    expect(hindsightOptimum(lines, 1, new Set([pairKey("a1", "b2")]))[0]?.bid_id).toBe("b2");
  });
});
