import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decide, type Decision, type EngineInput } from "../../src/engine/engine.js";

/**
 * Decisiones del motor con mandato por issue guardadas antes de añadir el mandato `apr`
 * (400 entradas aleatorias, semilla fija): deben seguir siendo idénticas byte a byte.
 */
const cases = JSON.parse(readFileSync("test/fixtures/engine-baseline/decisions.json", "utf8")) as { input: EngineInput; decision: Decision }[];

describe("decisiones de referencia sin mandato apr", () => {
  it("cubre aceptaciones, contraofertas y retiradas", () => {
    const actions = new Set(cases.map((c) => c.decision.action));
    expect(actions).toEqual(new Set(["accept", "counter", "walk"]));
  });

  it("decide produce la misma serialización JSON", () => {
    for (const { input, decision } of cases) expect(JSON.stringify(decide(input))).toBe(JSON.stringify(decision));
  });
});
