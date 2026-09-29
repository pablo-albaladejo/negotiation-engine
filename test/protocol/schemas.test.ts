import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProtocolSchemas } from "../../src/protocol/schemas.js";

const root = "test/fixtures/ring";
const schemas = createProtocolSchemas(["pct"]);

function fixtures(dir: string): [string, unknown][] {
  const path = join(root, dir);
  return readdirSync(path)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f, JSON.parse(readFileSync(join(path, f), "utf8"))]);
}

describe("esquemas canónicos del ring", () => {
  it.each(fixtures("input/valid"))("entrada válida: %s", (_name, fixture) => {
    const parsed = schemas.turnInput.parse(fixture);
    expect(parsed).toEqual(fixture);
  });

  it.each(fixtures("input/invalid"))("entrada inválida: %s", (_name, fixture) => {
    expect(schemas.turnInput.safeParse(fixture).success).toBe(false);
  });

  it.each(fixtures("output/valid"))("salida válida: %s", (_name, fixture) => {
    expect(schemas.turnOutput.parse(fixture)).toEqual(fixture);
  });

  it.each(fixtures("output/invalid"))("salida inválida: %s", (_name, fixture) => {
    expect(schemas.turnOutput.safeParse(fixture).success).toBe(false);
  });

  it("con dos issues la oferta exige ambos", () => {
    const two = createProtocolSchemas(["pct", "day"]);
    const base = { sessionId: "s", round: 1, rivalAction: "offer" };
    expect(two.turnInput.safeParse({ ...base, rivalOffer: { pct: 2, day: 10 } }).success).toBe(true);
    expect(two.turnInput.safeParse({ ...base, rivalOffer: { pct: 2 } }).success).toBe(false);
  });

  it("la oferta estructurada y el texto contradictorio se conservan por separado", () => {
    const parsed = schemas.turnInput.parse({
      sessionId: "s",
      round: 1,
      rivalAction: "offer",
      rivalOffer: { pct: 2 },
      text: "te ofrezco 5 %",
    });
    expect(parsed.rivalOffer).toEqual({ pct: 2 });
    expect(parsed.text).toBe("te ofrezco 5 %");
  });
});
