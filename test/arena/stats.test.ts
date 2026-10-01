import { describe, expect, it } from "vitest";
import { createRng } from "../../src/engine/rng.js";
import type { GameMetrics } from "../../src/arena/metrics.js";
import { clusterBootstrap, clusterDiffs, signTest, weightedMeanDiff } from "../../src/arena/stats.js";

function game(scenarioId: string, rival: string, seed: number, role: "buyer" | "seller", share: number | null): GameMetrics {
  return {
    gameId: `${scenarioId}__${rival}__${seed}`, scenarioId, rival, role, seed, endReason: "agreement", agreement: true,
    zopaEmpty: share === null, surplusShare: share, violations: 0, correct: true, rivalError: false, rounds: 3, leaks: 0,
    templateFallbacks: 0, latencyMeanMs: 0, latencyMaxMs: 0, misExtracted: 0, unextracted: 0, wrongAgreement: false,
  };
}

describe("test de signos", () => {
  it("da los p bilaterales exactos de casos conocidos", () => {
    expect(signTest([1, 1, 1, 1, 1]).pValue).toBeCloseTo(0.0625, 10);
    expect(signTest([1, 1, 1, 1, 1, 1]).pValue).toBeCloseTo(0.03125, 10);
    expect(signTest(Array(10).fill(0.01)).pValue).toBeCloseTo(2 / 1024, 10);
    expect(signTest([...Array(8).fill(1), -1, -1]).pValue).toBeCloseTo(112 / 1024, 10);
    expect(signTest([...Array(2).fill(1), ...Array(8).fill(-1)]).pValue).toBeCloseTo(112 / 1024, 10);
  });

  it("descarta los empates y sin clústeres no es significativo", () => {
    expect(signTest([0.2, -0.1, 0])).toEqual({ positive: 1, negative: 1, ties: 1, pValue: 1 });
    expect(signTest([]).pValue).toBe(1);
    expect(signTest([0, 0, 0]).ties).toBe(3);
  });
});

describe("agregación por clúster", () => {
  it("empareja por escenario, rival y semilla y excluye ZOPA vacía", () => {
    const champion = [game("a", "x", 1, "buyer", 0.4), game("a", "x", 2, "buyer", 0.6), game("e", "x", 1, "seller", null)];
    const candidate = [game("a", "x", 2, "buyer", 0.7), game("a", "x", 1, "buyer", 0.5), game("e", "x", 1, "seller", null)];
    const [a, e] = clusterDiffs(champion, candidate);
    expect(a).toMatchObject({ scenarioId: "a", rival: "x", role: "buyer", pairs: 2 });
    expect(a!.diff).toBeCloseTo(0.1, 12);
    expect(e).toMatchObject({ pairs: 0, diff: null });
  });

  it("pondera los roles con roleWeights, no el número de clústeres", () => {
    const clusters = [
      { role: "buyer" as const, diff: 0.1 },
      { role: "buyer" as const, diff: 0.3 },
      { role: "seller" as const, diff: 0 },
    ];
    expect(weightedMeanDiff(clusters, { buyer: 1, seller: 1 })).toBeCloseTo(0.1, 12);
    expect(weightedMeanDiff(clusters, { buyer: 3, seller: 1 })).toBeCloseTo(0.15, 12);
    expect(weightedMeanDiff(clusters, { buyer: 1, seller: 0 })).toBeCloseTo(0.2, 12);
    expect(weightedMeanDiff([], { buyer: 1, seller: 1 })).toBeNull();
  });
});

describe("bootstrap por clústeres", () => {
  const w = { buyer: 1, seller: 1 };

  it("es reproducible con la semilla y degenera con diferencias constantes", () => {
    const clusters = [0.01, 0.03, -0.02, 0.05, 0.02].map((diff, k) => ({ role: k % 2 ? ("seller" as const) : ("buyer" as const), diff }));
    expect(clusterBootstrap(clusters, w, { seed: 7 })).toEqual(clusterBootstrap(clusters, w, { seed: 7 }));
    expect(clusterBootstrap(clusters, w)!.resamples).toBe(2000);
    const flat = clusterBootstrap([{ role: "buyer", diff: 0.02 }, { role: "buyer", diff: 0.02 }], w)!;
    expect(flat.low).toBeCloseTo(0.02, 12);
    expect(flat.high).toBeCloseTo(0.02, 12);
  });

  it("cubre la media real en torno al 95 % con datos sintéticos", () => {
    const rng = createRng(2024);
    const normal = () => Math.sqrt(-2 * Math.log(1 - rng.float())) * Math.cos(2 * Math.PI * rng.float());
    const trials = 150;
    const truth = 0.01;
    let covered = 0;
    for (let t = 0; t < trials; t++) {
      const clusters = Array.from({ length: 30 }, (_, k) => ({ role: k % 2 ? ("seller" as const) : ("buyer" as const), diff: truth + 0.03 * normal() }));
      const ci = clusterBootstrap(clusters, w, { seed: t + 1 })!;
      if (ci.low <= truth && truth <= ci.high) covered++;
    }
    expect(covered / trials).toBeGreaterThan(0.86);
    expect(covered / trials).toBeLessThan(0.99);
  });
});
