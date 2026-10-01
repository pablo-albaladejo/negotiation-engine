import fc from "fast-check";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deterministicParser, parseDeterministic } from "../../src/llm/deterministic-parser.js";
import { parserOutputSchema } from "../../src/llm/parser.js";

interface Fixture {
  name: string;
  issues: string[];
  text: string;
  offer: Record<string, number> | null;
  intent: string;
  tactics?: string[];
  injectionSuspected?: boolean;
}

const fixtures = JSON.parse(readFileSync("test/fixtures/parser/deterministic.json", "utf8")) as Fixture[];

describe("parser determinista (fixtures ES/EN)", () => {
  it.each(fixtures.map((f) => [f.name, f] as const))("%s", (_name, f) => {
    const out = parseDeterministic(f.text, f.issues);
    expect(parserOutputSchema(f.issues).safeParse(out).success).toBe(true);
    expect(out.offer ?? null).toEqual(f.offer);
    expect(out.intent).toBe(f.intent);
    if (f.tactics) expect([...out.tactics].sort()).toEqual([...f.tactics].sort());
    if (f.injectionSuspected !== undefined) expect(out.injectionSuspected).toBe(f.injectionSuspected);
  });

  it("usa los issues declarados que le pasa el pipeline", async () => {
    const out = await deterministicParser.parse("2% at day 30", new AbortController().signal, { issueNames: ["pct", "day"] });
    expect(out).toMatchObject({ offer: { pct: 2, day: 30 }, intent: "offer" });
  });

  it("para cualquier texto devuelve una salida válida contra el esquema cerrado", () => {
    const schema = parserOutputSchema(["pct", "day"]);
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (text) => {
        expect(schema.safeParse(parseDeterministic(text, ["pct", "day"])).success).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});

describe("esquema cerrado del parser", () => {
  const schema = parserOutputSchema(["pct"]);
  const valid = { intent: "offer", offer: { pct: 2 }, claims: [], tactics: [], injectionSuspected: false };

  it("acepta una salida válida", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each(["role", "identity", "mandate", "reservation", "deadline", "decision", "action"])("rechaza el campo extra %s", (field) => {
    const result = schema.safeParse({ ...valid, [field]: field === "role" ? "seller" : 8 });
    expect(result.success).toBe(false);
  });

  it("rechaza una oferta con un issue no declarado o una táctica fuera del enum", () => {
    expect(schema.safeParse({ ...valid, offer: { pct: 2, day: 3 } }).success).toBe(false);
    expect(schema.safeParse({ ...valid, tactics: ["mind-control"] }).success).toBe(false);
  });
});
