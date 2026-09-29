import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { decide, engineBox, type EngineInput } from "../../src/engine/engine.js";
import { createContext, runBox } from "../../src/pipeline/box.js";

interface EngineFixture {
  description: string;
  input: EngineInput;
  expected: { action: string; offer?: Record<string, number>; rule: string };
}

const dir = "test/fixtures/engine";
const fixtures: [string, EngineFixture][] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => [f, JSON.parse(readFileSync(join(dir, f), "utf8")) as EngineFixture]);

describe("caja engine sobre test/fixtures/engine", () => {
  it.each(fixtures)("%s", async (_file, fixture) => {
    const decision = await runBox(engineBox, fixture.input, createContext());
    expect(decision.action).toBe(fixture.expected.action);
    expect(decision.rule).toBe(fixture.expected.rule);
    if (fixture.expected.offer) {
      expect("offer" in decision).toBe(true);
      const offer = (decision as { offer: Record<string, number> }).offer;
      for (const [name, value] of Object.entries(fixture.expected.offer)) expect(offer[name]).toBeCloseTo(value, 9);
    } else {
      expect("offer" in decision).toBe(false);
    }
  });
});

describe("motor determinista", () => {
  const base = fixtures.find(([f]) => f === "counter-boulware.json")![1].input;

  it("misma entrada y semilla ⇒ misma decisión, también con ruido", () => {
    fc.assert(
      fc.property(fc.integer(), fc.double({ min: 0, max: 0.99, noNaN: true }), (seed, noise) => {
        const input = { ...base, seed, params: { ...base.params, noise } };
        expect(decide(input)).toEqual(decide(structuredClone(input)));
      }),
    );
  });

  it("solo produce ofertas de los issues declarados", () => {
    const decision = decide(base);
    expect(decision.action).toBe("counter");
    expect(Object.keys((decision as { offer: object }).offer)).toEqual(["pct"]);
  });

  it("el motor no recibe texto: una afirmación del rival no puede forzar accept", () => {
    expect(Object.keys(base.state)).not.toContain("text");
    expect(decide(base).action).not.toBe("accept");
  });
});
