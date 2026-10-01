import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { seedsFor, type PairedReport } from "../../src/arena/paired.js";
import { promote, type PhaseEvaluator } from "../../src/arena/promote.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { loadConfig } from "../../src/engine/config.js";

function setup(candidatePatch: Record<string, unknown> = { beta: 0.3 }) {
  const dir = mkdtempSync(join(tmpdir(), "promote-"));
  const championPath = join(dir, "champion.json");
  copyFileSync("config/champion.json", championPath);
  const candidatePath = join(dir, "candidate.json");
  const raw = JSON.parse(readFileSync("config/champion.json", "utf8"));
  writeFileSync(candidatePath, JSON.stringify({ ...raw, ...candidatePatch, provenance: { source: "tune", parent: 1, sweepId: "sweep-test" } }));
  const lines: string[] = [];
  return { dir, championPath, candidatePath, lines, log: (l: string) => lines.push(l), original: readFileSync(championPath, "utf8") };
}

const fake = (diff: number): PhaseEvaluator => async (plan) =>
  ({
    clusters: [], meanDiffPp: plan.phase === "heldOut" ? 0 : diff, sign: { positive: 10, negative: 0, ties: 0, pValue: 0.002 },
    byRival: [], champion: { agreementRate: 0.7, meanSurplus: 0.4 }, candidate: { agreementRate: 0.7, meanSurplus: 0.42 },
    violations: [], leaks: [], games: 10, seeds: [...plan.seeds], rivals: plan.rivals.map((r) => r.name),
  }) satisfies PairedReport;

describe("pnpm promote", () => {
  it("con la puerta aprobada escribe la campeona v2 con procedencia y propone el commit", async () => {
    const s = setup();
    const phases: string[] = [];
    const evaluate: PhaseEvaluator = async (plan, a, b) => {
      phases.push(`${plan.phase}:${plan.rivals.map((r) => r.pool).join("/")}`);
      return fake(2)(plan, a, b);
    };
    const result = await promote({ ...s, env: {}, evaluate, resultsDir: s.dir });
    expect(result).toMatchObject({ promoted: true, version: 2 });
    expect(phases[0]).toMatch(/^tuning:tuning/);
    expect(phases[2]).toBe("heldOut:heldOut");
    const written = loadConfig(s.championPath);
    expect(written).toMatchObject({ version: 2, beta: 0.3, provenance: { source: "promote", parent: 1, sweepId: "sweep-test" } });
    expect(written.provenance.metrics).toMatchObject({ tuningDiffPp: 2, heldOutDiffPp: 0 });
    expect(s.lines.join("\n")).toMatch(/commit sugerido: champion v2/);
  });

  it("con la puerta rechazada explica el chequeo fallido y no toca la campeona", async () => {
    const s = setup();
    const result = await promote({ ...s, env: {}, evaluate: fake(0.4), resultsDir: s.dir });
    expect(result.promoted).toBe(false);
    expect(result.reason).toMatch(/tuning\/effect/);
    expect(s.lines.join("\n")).toMatch(/FALLA tuning\/effect/);
    expect(readFileSync(s.championPath, "utf8")).toBe(s.original);
  });

  it("con CHAMPION_FROZEN=1 se niega a sobrescribir sin jugar", async () => {
    const s = setup();
    let played = false;
    const result = await promote({ ...s, env: { CHAMPION_FROZEN: "1" }, evaluate: async (p, a, b) => ((played = true), fake(5)(p, a, b)), resultsDir: s.dir });
    expect(result).toMatchObject({ promoted: false, reason: expect.stringMatching(/congelación/) });
    expect(played).toBe(false);
    expect(readFileSync(s.championPath, "utf8")).toBe(s.original);
  });

  it("con frozen: true en la campeona también se niega", async () => {
    const s = setup();
    writeFileSync(s.championPath, JSON.stringify({ ...JSON.parse(s.original), frozen: true }));
    const result = await promote({ ...s, env: {}, evaluate: fake(5), resultsDir: s.dir });
    expect(result.reason).toMatch(/frozen: true/);
  });

  it("la campeona vigente no está congelada (la congelación es la tarea 18.1)", () => {
    expect(loadConfig("config/champion.json").frozen).toBeUndefined();
  });

  it("en la arena real una candidata idéntica no pasa por efecto insuficiente", async () => {
    const s = setup({});
    const result = await promote({ ...s, env: {}, seeds: 2, scenarios: loadCatalog().slice(0, 2), tuningRivalNames: ["boulware"], resultsDir: s.dir });
    expect(result.promoted).toBe(false);
    expect(result.gate!.failed.map((c) => `${c.phase}/${c.check}`)).toEqual(["tuning/effect", "tuning/significance", "revalidation/effect", "revalidation/significance"]);
    expect(readFileSync(s.championPath, "utf8")).toBe(s.original);
    expect(seedsFor("revalidation", 1)[0]).toBeGreaterThan(seedsFor("tuning", 2).at(-1)!);
  });
});
