import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { heldOutRivals, seedPhase, tuningRivals, type PairedReport } from "../../src/arena/paired.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { loadConfig } from "../../src/engine/config.js";
import { crossEntropy, fixedList, gridSearch, randomSearch, successiveHalving, type Generator } from "../../src/tune/generators.js";
import { PARAM_SPACE, type Params } from "../../src/tune/space.js";
import { arenaEvaluator, runSweep, writeCandidates, type Evaluator } from "../../src/tune/sweep.js";

const champion = loadConfig("config/champion.json");
const scenarios = loadCatalog().slice(0, 2);
const rivals = tuningRivals(["boulware"]);
const space = PARAM_SPACE.filter((r) => r.name === "beta" || r.name === "openingMargin");

const sweep = (generator: Generator, evaluate: Evaluator = arenaEvaluator({ champion, scenarios, rivals }), seedCount = 1) =>
  runSweep({ sweepId: "t", base: champion, generator, evaluate, seedCount, rivals });

/** Evaluador sintético: diferencia = −100·(β − 0,3)², sin violaciones. */
function fakeEvaluator(calls: { beta: number; seeds: readonly number[] }[] = []): Evaluator {
  return async (config, seeds) => {
    calls.push({ beta: config.beta, seeds });
    const diff = -100 * (config.beta - 0.3) ** 2;
    return {
      clusters: [], meanDiffPp: diff, sign: { positive: 0, negative: 0, ties: 0, pValue: 1 }, byRival: [],
      champion: { agreementRate: 0, meanSurplus: null }, candidate: { agreementRate: 0, meanSurplus: null },
      violations: [], leaks: [], games: 0, seeds: [...seeds], rivals: [],
    } satisfies PairedReport;
  };
}

describe("pnpm tune", () => {
  it("la misma semilla reproduce la tabla con solo semillas de ajuste", async () => {
    const seen: number[] = [];
    const base = arenaEvaluator({ champion, scenarios, rivals });
    const spy: Evaluator = (c, s) => (seen.push(...s), base(c, s));
    const a = await sweep(randomSearch({ space, n: 3, seed: 5 }), spy, 2);
    const b = await sweep(randomSearch({ space, n: 3, seed: 5 }), undefined, 2);
    expect(a.rows).toEqual(b.rows);
    expect(a.rows).toHaveLength(3);
    expect(seen.every((s) => seedPhase(s) === "tuning")).toBe(true);
    expect((await sweep(randomSearch({ space, n: 3, seed: 6 }))).rows).not.toEqual(a.rows);
  });

  it("un rival heldOut hace fallar el arranque sin evaluar nada", async () => {
    const calls: { beta: number; seeds: readonly number[] }[] = [];
    const run = runSweep({ sweepId: "t", base: champion, generator: randomSearch({ space, n: 2, seed: 1 }), evaluate: fakeEvaluator(calls), seedCount: 1, rivals: [...rivals, ...heldOutRivals({ previousChampion: champion })] });
    await expect(run).rejects.toThrow(/heldOut.*champion-v1/);
    expect(calls).toHaveLength(0);
  });

  it("el evaluador de la arena se niega con una semilla de revalidación", async () => {
    await expect(arenaEvaluator({ champion, scenarios, rivals })(champion, [100_000])).rejects.toThrow(/100000/);
  });

  it("escribe candidatas con procedencia en su carpeta y nunca sobre la campeona", async () => {
    const dir = mkdtempSync(join(tmpdir(), "cand-"));
    const result = await sweep(randomSearch({ space, n: 3, seed: 2 }), fakeEvaluator());
    const paths = writeCandidates(result, champion, dir, 2);
    expect(paths).toHaveLength(2);
    const top = loadConfig(paths[0]!);
    expect(top.provenance).toMatchObject({ source: "tune", parent: champion.version, sweepId: "t", seeds: { phase: "tuning", start: 1, count: 1 } });
    expect(top.provenance.metrics?.diffPp).toBe(result.rows[0]!.diffPp);
    expect(top.beta).toBe(result.rows[0]!.params.beta);
    expect(() => writeCandidates(result, champion, "config/champion.json", 1)).toThrow();
    expect(readFileSync("config/champion.json", "utf8")).toContain('"version": 1');
  });
});

describe("generadores intercambiables", () => {
  it("cambiar de generador no cambia la arena ni la puerta: las mismas candidatas dan las mismas filas", async () => {
    const random = await sweep(randomSearch({ space, n: 3, seed: 9 }));
    const replay = await sweep(fixedList(random.rows.map((r) => r.params)));
    expect(replay.rows).toEqual(random.rows);
    expect(replay.generator).toBe("fixed");
    const cem = await sweep(crossEntropy({ space, seed: 9, population: 2, iterations: 1 }));
    const again = await sweep(fixedList(cem.rows.map((r) => r.params)));
    expect(again.rows).toEqual(cem.rows);
  });

  it("la rejilla recorre el producto cartesiano en orden estable", () => {
    const points = gridSearch({ space, levels: 2 }).propose().map((p) => p.params);
    expect(points).toEqual([
      { beta: 0.05, openingMargin: 0.6 },
      { beta: 0.05, openingMargin: 1 },
      { beta: 1, openingMargin: 0.6 },
      { beta: 1, openingMargin: 1 },
    ]);
  });

  it("successive halving reevalúa la mejor fracción con más semillas", async () => {
    const calls: { beta: number; seeds: readonly number[] }[] = [];
    const result = await sweep(successiveHalving({ space, n: 9, seed: 3, eta: 3, minBudget: 1, maxBudget: 9 }), fakeEvaluator(calls));
    expect(calls.map((c) => c.seeds.length)).toEqual([...Array(9).fill(1), 3, 3, 3, 9]);
    expect(result.rows).toHaveLength(9);
    expect(result.rows[0]!.budget).toBe(9);
    const rung0 = calls.slice(0, 9).map((c) => -((c.beta - 0.3) ** 2)).sort((a, b) => b - a);
    expect(-((calls[12]!.beta - 0.3) ** 2)).toBe(rung0[0]);
  });

  it("el optimizador de caja negra mejora con las observaciones", async () => {
    const calls: { beta: number; seeds: readonly number[] }[] = [];
    await sweep(crossEntropy({ space, seed: 4, population: 8, iterations: 4, start: { beta: 0.9, openingMargin: 0.8 } as Params }), fakeEvaluator(calls));
    const dist = (xs: typeof calls) => xs.reduce((s, c) => s + Math.abs(c.beta - 0.3), 0) / xs.length;
    expect(calls.length).toBeGreaterThan(16);
    expect(dist(calls.slice(-8))).toBeLessThan(dist(calls.slice(0, 8)));
  });
});

describe("CLI de tune", () => {
  it("cada generador corre por la misma CLI y deja candidatas y tabla fuera de la campeona", async () => {
    const { runTuneCli } = await import("../../src/tune/tune-main.js");
    const dir = mkdtempSync(join(tmpdir(), "tune-"));
    for (const generator of ["random", "grid", "halving", "cem"]) {
      const { result, written } = await runTuneCli(
        ["--generator", generator, "--n", "3", "--seeds", "1", "--max-seeds", "3", "--levels", "2", "--params", "beta", "--scenarios", scenarios[0]!.id, "--rivals", "boulware", "--keep", "1", "--candidates-dir", join(dir, "c"), "--out", dir, "--sweep-id", `s-${generator}`],
        () => {},
      );
      expect(result.generator).toBe(generator === "random" ? "random" : generator);
      expect(written.every((p) => p.startsWith(join(dir, "c")))).toBe(true);
    }
    await expect(runTuneCli(["--generator", "magic", "--out", dir], () => {})).rejects.toThrow(/generador desconocido/);
    await expect(runTuneCli(["--rivals", "nadie", "--out", dir], () => {})).rejects.toThrow(/Bot desconocido/);
  });
});
