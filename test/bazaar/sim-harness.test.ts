import { describe, expect, it } from "vitest";
import { ABUELA_SCENARIOS, runEpisode, runGrid, stats, summarize, formatTable, type EpisodeResult } from "../../src/bazaar/sim/harness.js";
import { loadDealerProfile } from "../../src/bazaar/sim/model.js";
import { naivePolicy, oursPolicy } from "../../src/bazaar/sim/policies.js";
import { runSimCli } from "../../src/bazaar/sim/main.js";

const profile = loadDealerProfile();
const pack = ABUELA_SCENARIOS.find((s) => s.name === "buy-pack")!;

describe("arnés bazaar:sim", () => {
  it("un episodio es determinista por semilla", async () => {
    const run = () => runEpisode({ profile, scenario: pack, policy: oursPolicy(), seed: 3, floorFrac: 0.25 });
    expect(await run()).toEqual(await run());
  });

  it("nuestro negociador nunca compra a su precio de apertura ni provoca errores de protocolo", async () => {
    const rs = await runGrid({ profile, policies: [oursPolicy()], floors: [0.15, 0.35], seeds: 15 });
    // Al venderle, si no se mueve tras 2 concesiones la regla de precio fijo acepta su puja (hilo 56): cuenta como trato.
    expect(rs.filter((r) => r.atOpening && r.scenario.startsWith("buy"))).toEqual([]);
    expect(rs.flatMap((r) => r.errors)).toEqual([]);
    // El simulador aún da su final tras aguantes largos; en vivo (hilo 184) aguantar provocó no_progress, así que
    // ahora se aguanta una vez como mucho y en el simulador se pierden algunos de esos finales.
    expect(stats(rs).dealRate).toBeGreaterThan(0.4);
  });

  it("el starter ingenuo sube 2 P por ronda desde 0,6 × presupuesto", async () => {
    const r = await runEpisode({ profile, scenario: pack, policy: naivePolicy(), seed: 1, floorFrac: 0.25 });
    expect(r.rounds).toBeGreaterThan(1);
    expect(r.status).toBe("deal");
  });

  it("stats: parte del tramo solo sobre tratos que cuentan; tasas sobre episodios", () => {
    const base: EpisodeResult = { policy: "p", scenario: "s", floorFrac: 0.2, seed: 0, status: "deal", opening: 30, limit: 20, share: 0.5, counts: true, atOpening: false, rounds: 4, ticks: 4, finalOffered: false, finalTaken: false, errors: [] };
    const s = stats([
      base,
      { ...base, share: 0, counts: false, atOpening: true },
      { ...base, status: "walked", share: 0, counts: false, finalOffered: true, rounds: 10 },
    ]);
    expect(s.dealRate).toBeCloseTo(2 / 3);
    expect(s.shareOfDeals).toBeCloseTo(0.5);
    expect(s.shareAll).toBeCloseTo(0.5 / 3);
    expect(s.atOpeningPct).toBeCloseTo(0.5);
    expect(s.walkPct).toBeCloseTo(1 / 3);
    expect(s.finalTakenPct).toBe(0);
    expect(s.medianRounds).toBe(4);
    expect(formatTable(summarize([base], "scenario"), "item")).toContain("share/deal");
  });

  it("la CLI devuelve filas por artículo, suelo y total para las tres políticas (SIMULATED)", async () => {
    const lines: string[] = [];
    const summary = await runSimCli(["--seeds", "3", "--floors", "0.2,0.3", "--no-write"], (l) => lines.push(l));
    expect(summary.byScenario).toHaveLength(3 * ABUELA_SCENARIOS.length);
    expect(summary.byFloor).toHaveLength(6);
    expect(summary.all.map((r) => r.policy)).toEqual(["ours", "legacy", "naive"]);
    expect(lines.join("\n")).toContain("buy-pack");
    expect(lines[0]).toContain("SIMULATED");
  });

  it("la CLI rechaza overrides desconocidos", async () => {
    await expect(runSimCli(["--seeds", "1", "--no-write", "--ours", "nope=1"], () => {})).rejects.toThrow(/bad override/);
  });
});
