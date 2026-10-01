import { describe, expect, it } from "vitest";
import { compareGolden, GOLDEN_GAMES, goldenId, loadGoldens, playGolden } from "../src/dev/golden.js";
import { loadConfig } from "../src/engine/config.js";

const champion = loadConfig("config/champion.json");
const goldens = loadGoldens();

describe("partidas doradas (test/golden/)", () => {
  it("hay una partida dorada por cada entrada de GOLDEN_GAMES", () => {
    expect(goldens.map((g) => g.id).sort()).toEqual(GOLDEN_GAMES.map(goldenId).sort());
  });

  it.each(GOLDEN_GAMES.map((spec) => [goldenId(spec), spec] as const))("%s se reproduce igual con la campeona", async (id, spec) => {
    const golden = goldens.find((g) => g.id === id)!;
    const diffs = compareGolden(golden, await playGolden(spec, champion));
    expect(diffs, diffs.join("\n")).toEqual([]);
  });

  it("alterar β cambia alguna partida e indica partida, ronda y diferencia", async () => {
    const altered = { ...champion, beta: champion.beta + 0.3 };
    const diffs: string[] = [];
    for (const spec of GOLDEN_GAMES) diffs.push(...compareGolden(goldens.find((g) => g.id === goldenId(spec))!, await playGolden(spec, altered)));
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs[0]).toMatch(/^partida [\w-]+__[\w-]+__\d+, ronda \d+ \((agent|rival)\): esperado .* · obtenido /);
  });
});
