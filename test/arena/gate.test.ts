import { describe, expect, it } from "vitest";
import { evaluateGate, formatGate } from "../../src/arena/gate.js";
import { seedsFor, type PairedReport } from "../../src/arena/paired.js";

interface Fake {
  diff?: number | null;
  p?: number;
  low?: number;
  violations?: string[];
  leaks?: string[];
  seeds?: number[];
}

function report(f: Fake = {}): PairedReport {
  return {
    clusters: [],
    meanDiffPp: f.diff === undefined ? 2 : f.diff,
    sign: { positive: 9, negative: 1, ties: 0, pValue: f.p ?? 0.01 },
    bootstrap: { lowPp: f.low ?? 0.5, highPp: 3, resamples: 2000 },
    byRival: [],
    champion: { agreementRate: 0.7, meanSurplus: 0.4 },
    candidate: { agreementRate: 0.7, meanSurplus: 0.42 },
    violations: (f.violations ?? []).map((gameId) => ({ gameId, count: 1 })),
    leaks: (f.leaks ?? []).map((gameId) => ({ gameId, count: 1 })),
    games: 10,
    seeds: f.seeds ?? seedsFor("tuning", 3),
    rivals: ["boulware"],
  };
}

const passing = () => ({
  tuning: report(),
  revalidation: report({ seeds: seedsFor("revalidation", 3) }),
  heldOut: report({ diff: 0, seeds: seedsFor("revalidation", 3, 3) }),
  minEffectPp: 1,
});

const failedIds = (input: Parameters<typeof evaluateGate>[0]) => evaluateGate(input).failed.map((c) => `${c.phase}/${c.check}`);

describe("puerta de promoción", () => {
  it("aprueba con efecto, significación, 0 violaciones/fugas, revalidación y reservado ≥ 0", () => {
    const result = evaluateGate(passing());
    expect(result.pass).toBe(true);
    expect(formatGate(result)).toMatch(/puerta: APROBADA/);
  });

  it("rechaza una mejora con una violación e indica la partida", () => {
    const result = evaluateGate({ ...passing(), tuning: report({ violations: ["price-buyer-wide__boulware__4"] }) });
    expect(result.pass).toBe(false);
    expect(result.failed).toEqual([expect.objectContaining({ phase: "tuning", check: "violations", detail: expect.stringContaining("price-buyer-wide__boulware__4") })]);
  });

  it("rechaza fugas", () => {
    expect(failedIds({ ...passing(), revalidation: report({ seeds: seedsFor("revalidation", 3), leaks: ["g"] }) })).toEqual(["revalidation/leaks"]);
  });

  it("rechaza un efecto significativo de 0,4 pp con minEffectPp = 1", () => {
    expect(failedIds({ ...passing(), tuning: report({ diff: 0.4 }) })).toEqual(["tuning/effect"]);
  });

  it("rechaza un efecto grande no significativo", () => {
    expect(failedIds({ ...passing(), tuning: report({ p: 0.2 }) })).toEqual(["tuning/significance"]);
  });

  it("niega la promoción sin revalidación e indica la fase que falta", () => {
    const { revalidation: _r, ...rest } = passing();
    const result = evaluateGate(rest);
    expect(result.failed).toEqual([expect.objectContaining({ phase: "revalidation", check: "present", detail: expect.stringContaining("falta la fase revalidation") })]);
  });

  it("rechaza si pasa con semillas de ajuste pero no con las de revalidación", () => {
    expect(failedIds({ ...passing(), revalidation: report({ seeds: seedsFor("revalidation", 3), diff: -0.5, p: 0.5 }) })).toEqual(["revalidation/effect", "revalidation/significance"]);
  });

  it("exige semillas de revalidación nuevas", () => {
    expect(failedIds({ ...passing(), revalidation: report({ seeds: seedsFor("tuning", 3) }) })).toEqual(["revalidation/fresh-seeds"]);
  });

  it("rechaza si empeora en el conjunto reservado", () => {
    expect(failedIds({ ...passing(), heldOut: report({ diff: -0.1 }) })).toEqual(["heldOut/non-negative"]);
    expect(failedIds({ ...passing(), heldOut: report({ diff: 0, violations: ["h"] }) })).toEqual(["heldOut/violations"]);
  });

  it("con bootstrap exige límite inferior del intervalo > 0", () => {
    const base = passing();
    expect(evaluateGate({ ...base, criterion: "bootstrap" }).pass).toBe(true);
    expect(failedIds({ ...base, criterion: "bootstrap", tuning: report({ low: -0.1, p: 0.001 }) })).toEqual(["tuning/significance"]);
  });
});
