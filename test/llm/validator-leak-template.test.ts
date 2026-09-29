import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Issue } from "../../src/engine/config.js";
import { withinOfferMandate, type Offer } from "../../src/engine/issues.js";
import { detectLeak, type LeakContext } from "../../src/llm/leak.js";
import { formatNumber, renderTemplate } from "../../src/llm/template.js";
import { validateText, type TextCheck } from "../../src/llm/validator.js";

interface ValidatorFixture {
  name: string;
  decision: { action: TextCheck["action"]; offer?: Offer };
  text: string;
  valid: boolean;
}
interface LeakFixtures {
  context: Omit<LeakContext, "decided">;
  cases: { name: string; text: string; decided: Offer | null; leak: boolean }[];
}

const validatorFixtures = JSON.parse(readFileSync("test/fixtures/llm/validator.json", "utf8")) as ValidatorFixture[];
const leakFixtures = JSON.parse(readFileSync("test/fixtures/llm/leak.json", "utf8")) as LeakFixtures;

describe("validador de salida", () => {
  it.each(validatorFixtures.map((f) => [f.name, f] as const))("%s", (_name, fixture) => {
    const result = validateText({ ...fixture.decision, text: fixture.text });
    expect(result.ok, JSON.stringify(result)).toBe(fixture.valid);
  });
});

describe("detector de fugas", () => {
  it.each(leakFixtures.cases.map((c) => [c.name, c] as const))("%s", (_name, fixture) => {
    const ctx: LeakContext = { ...leakFixtures.context };
    if (fixture.decided) ctx.decided = fixture.decided;
    const result = detectLeak(fixture.text, ctx);
    expect(result.leak, JSON.stringify(result)).toBe(fixture.leak);
  });

  it("los motivos no contienen el valor de la reserva", () => {
    const result = detectLeak("mi máximo es 7,25 %", {
      ...leakFixtures.context,
      reservation: { pct: 7.25 },
    });
    expect(result.leak).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/7\.25/);
  });
});

describe("plantilla determinista", () => {
  const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.5 };
  const day: Issue = { name: "day", min: 0, max: 90, direction: "lower-better", weight: 0.5 };

  const scenario = fc
    .record({
      twoIssues: fc.boolean(),
      pctValue: fc.double({ min: 0, max: 10, noNaN: true }),
      dayValue: fc.integer({ min: 0, max: 90 }),
      pctRes: fc.double({ min: 0, max: 10, noNaN: true }),
      dayRes: fc.integer({ min: 0, max: 90 }),
      action: fc.constantFrom("accept" as const, "counter" as const, "walk" as const),
      confirm: fc.boolean(),
    })
    .map((s) => {
      const issues = s.twoIssues ? [pct, day] : [{ ...pct, weight: 1 }];
      // Oferta dentro del mandato: reserva del comprador no mejor que la oferta.
      const offer: Offer = s.twoIssues ? { pct: s.pctValue, day: s.dayValue } : { pct: s.pctValue };
      const reservation: Offer = s.twoIssues
        ? { pct: Math.min(s.pctRes, s.pctValue), day: Math.max(s.dayRes, s.dayValue) }
        : { pct: Math.min(s.pctRes, s.pctValue) };
      return { issues, offer, reservation, action: s.action, confirm: s.confirm };
    });

  it("la plantilla pasa validador y detector de fugas para toda decisión dentro del mandato", () => {
    fc.assert(
      fc.property(scenario, ({ issues, offer, reservation, action, confirm }) => {
        expect(withinOfferMandate(issues, { role: "buyer", reservation }, offer)).toBe(true);
        const decision = action === "walk" ? { action } : { action, offer };
        const text = renderTemplate(action === "counter" && confirm ? { ...decision, ask: "confirm-figures" } : decision);
        const validation = validateText({ ...decision, text });
        expect(validation, text).toEqual({ ok: true });
        const leakCtx: LeakContext = { issues, reservation };
        if (action !== "walk") leakCtx.decided = offer;
        expect(detectLeak(text, leakCtx), text).toEqual({ leak: false });
      }),
    );
  });

  it("accept repite los valores de cada issue", () => {
    const text = renderTemplate({ action: "accept", offer: { pct: 2, day: 20 } });
    expect(text).toContain("2 %");
    expect(text).toContain("día 20");
  });

  it("formatea con coma decimal y sin ambigüedad de miles", () => {
    expect(formatNumber(2.5)).toBe("2,5");
    expect(formatNumber(3)).toBe("3");
    expect(formatNumber(2.345)).toBe("2,3450");
    expect(formatNumber(1500)).toBe("1500");
  });
});
