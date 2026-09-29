import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeNumbers } from "../../src/llm/numbers.js";

interface Fixture {
  name: string;
  text: string;
  expected: Record<string, unknown>[];
}

const fixtures = JSON.parse(readFileSync("test/fixtures/numbers/forms.json", "utf8")) as Fixture[];

describe("normalizador numérico: tabla por forma", () => {
  it.each(fixtures.map((f) => [f.name, f] as const))("%s", (_name, fixture) => {
    const mentions = normalizeNumbers(fixture.text);
    expect(mentions).toHaveLength(fixture.expected.length);
    fixture.expected.forEach((expected, k) => {
      const mention = mentions[k]! as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(expected)) {
        if (typeof value === "number") expect(mention[key] as number).toBeCloseTo(value, 9);
        else if (Array.isArray(value)) {
          const actual = mention[key] as number[];
          expect(actual).toHaveLength(value.length);
          value.forEach((v, i) => expect(actual[i]!).toBeCloseTo(v as number, 9));
        } else expect(mention[key]).toEqual(value);
      }
    });
  });
});

describe("normalizador numérico: escenarios de la spec", () => {
  it("formas equivalentes producen la lectura 3 y '0.03' queda ambigua", () => {
    for (const text of ["3 %", "3,0%", "tres por ciento", "three percent", "300 pb", "0.03"]) {
      const [mention] = normalizeNumbers(text);
      expect(mention?.readings.some((r) => Math.abs(r - 3) < 1e-9), text).toBe(true);
    }
    expect(normalizeNumbers("0.03")[0]).toMatchObject({ ambiguous: true, ambiguity: "fraction" });
    expect(normalizeNumbers("3 %")[0]).toMatchObject({ ambiguous: false });
  });

  it("un rango se devuelve como rango, no como número", () => {
    const mentions = normalizeNumbers("podríamos movernos entre 2 y 4 %");
    expect(mentions).toEqual([expect.objectContaining({ kind: "range", from: 2, to: 4, unit: "percent" })]);
  });

  it("las posiciones apuntan al texto original", () => {
    const text = "Te propongo un 2,5 % con pago el día 20.";
    for (const m of normalizeNumbers(text)) expect(text.slice(m.start, m.end)).toBe(m.text);
  });
});
