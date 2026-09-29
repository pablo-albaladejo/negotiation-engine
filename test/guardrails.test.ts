import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { enforceGuardrails, withinMandate, type Mandate } from "../src/engine/guardrails.js";

const price = fc.double({ min: 0, max: 1e6, noNaN: true, noDefaultInfinity: true });
const mandate: fc.Arbitrary<Mandate> = fc.record({
  role: fc.constantFrom("buyer" as const, "seller" as const),
  reservation: price,
});

describe("guardarraíles", () => {
  it("nunca cruza el mandato", () => {
    fc.assert(
      fc.property(mandate, fc.array(price, { minLength: 1, maxLength: 30 }), (m, proposals) => {
        let previous: number | undefined;
        for (const p of proposals) {
          previous = enforceGuardrails(m, p, previous);
          expect(withinMandate(m, previous)).toBe(true);
        }
      }),
    );
  });

  it("las ofertas son monótonas (nunca retrocedemos)", () => {
    fc.assert(
      fc.property(mandate, fc.array(price, { minLength: 2, maxLength: 30 }), (m, proposals) => {
        const offers: number[] = [];
        for (const p of proposals) offers.push(enforceGuardrails(m, p, offers.at(-1)));
        for (let i = 1; i < offers.length; i++) {
          const [prev, curr] = [offers[i - 1]!, offers[i]!];
          if (m.role === "buyer") expect(curr).toBeGreaterThanOrEqual(prev);
          else expect(curr).toBeLessThanOrEqual(prev);
        }
      }),
    );
  });

  it("rechaza ofertas no finitas", () => {
    expect(() => enforceGuardrails({ role: "buyer", reservation: 100 }, Number.NaN)).toThrow();
  });
});
