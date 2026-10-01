import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/engine/config.js";
import { assertTuningOnly, comparePaired, heldOutRivals, runPaired, SEED_RANGES, seedPhase, seedsFor, tuningRivals } from "../../src/arena/paired.js";
import { loadCatalog } from "../../src/arena/scenario.js";

const champion = loadConfig("config/champion.json");
const scenarios = loadCatalog().slice(0, 3);

describe("rivales y semillas reservados", () => {
  it("los rangos de ajuste y revalidación son disjuntos", () => {
    expect(SEED_RANGES.tuning.end).toBeLessThan(SEED_RANGES.revalidation.start);
    expect(seedsFor("tuning", 3)).toEqual([1, 2, 3]);
    expect(seedsFor("revalidation", 2).every((s) => seedPhase(s) === "revalidation")).toBe(true);
    expect(() => seedsFor("tuning", 10, SEED_RANGES.tuning.end)).toThrow(/solo llega/);
  });

  it("los bots en código son de ajuste y la campeona anterior es reservada", () => {
    expect(tuningRivals().every((r) => r.pool === "tuning")).toBe(true);
    const [previous] = heldOutRivals({ previousChampion: champion });
    expect(previous).toMatchObject({ name: `champion-v${champion.version}`, pool: "heldOut" });
    expect(heldOutRivals({})).toEqual([]);
  });

  it("el ajuste se niega con un rival heldOut o una semilla de revalidación", () => {
    expect(() => assertTuningOnly(heldOutRivals({ previousChampion: champion }), [1])).toThrow(/champion-v1/);
    expect(() => assertTuningOnly(tuningRivals(["boulware"]), [1, SEED_RANGES.revalidation.start])).toThrow(/100000/);
    expect(() => assertTuningOnly(tuningRivals(["boulware"]), [1, 2])).not.toThrow();
  });
});

describe("runner pareado", () => {
  it("dos configuraciones idénticas dan diferencia 0 en cada clúster", async () => {
    const run = await runPaired({ scenarios, rivals: tuningRivals(["boulware", "conceder"]), seeds: seedsFor("tuning", 3), champion, candidate: { ...champion } });
    const report = comparePaired(run, { roleWeights: champion.roleWeights, bootstrap: { resamples: 200 } });
    expect(report.games).toBe(scenarios.length * 2 * 3);
    expect(report.meanDiffPp).toBe(0);
    expect(report.clusters.every((c) => c.diff === null || c.diff === 0)).toBe(true);
    expect(report.sign).toMatchObject({ positive: 0, negative: 0, pValue: 1 });
    expect(report.bootstrap).toMatchObject({ lowPp: 0, highPp: 0 });
    expect(report.violations).toEqual([]);
    expect(report.byRival.map((r) => r.rival)).toEqual(["boulware", "conceder"]);
  });

  it("una candidata distinta cambia la diferencia y reutiliza las partidas de la campeona", async () => {
    const rivals = tuningRivals(["boulware"]);
    const seeds = seedsFor("tuning", 2);
    const base = await runPaired({ scenarios, rivals, seeds, champion, candidate: champion });
    const run = await runPaired({ scenarios, rivals, seeds, champion, candidate: { ...champion, beta: 1.5 }, championGames: base.championGames });
    expect(run.championGames).toBe(base.championGames);
    expect(comparePaired(run, { roleWeights: champion.roleWeights }).meanDiffPp).not.toBe(0);
  });
});
