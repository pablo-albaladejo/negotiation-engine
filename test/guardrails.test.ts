import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { enforceGuardrails, enforceOfferGuardrails, withinMandate, type Mandate } from "../src/engine/guardrails.js";
import { reservationUtility, utility, withinOfferMandate, type Offer } from "../src/engine/issues.js";
import { issuesArb, mandateArb, offerArb } from "./engine/arbitraries.js";

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

describe("guardarraíles multi-issue", () => {
  const scenario = issuesArb.chain((issues) =>
    fc.tuple(fc.constant(issues), mandateArb(issues), fc.array(offerArb(issues, 0.5), { minLength: 1, maxLength: 30 })),
  );

  it("nunca cruza el mandato en ningún issue ni en utilidad", () => {
    fc.assert(
      fc.property(scenario, ([issues, m, proposals]) => {
        let previous: Offer | undefined;
        for (const p of proposals) {
          previous = enforceOfferGuardrails(issues, m, p, previous);
          expect(withinOfferMandate(issues, m, previous)).toBe(true);
          expect(utility(issues, previous)).toBeGreaterThanOrEqual(reservationUtility(issues, m) - 1e-12);
        }
      }),
    );
  });

  it("monotonía en utilidad: nuestra utilidad nunca sube", () => {
    fc.assert(
      fc.property(scenario, ([issues, m, proposals]) => {
        const offers: Offer[] = [];
        for (const p of proposals) offers.push(enforceOfferGuardrails(issues, m, p, offers.at(-1)));
        for (let i = 1; i < offers.length; i++) {
          expect(utility(issues, offers[i]!)).toBeLessThanOrEqual(utility(issues, offers[i - 1]!) + 1e-12);
        }
      }),
    );
  });

  it("con un issue coincide con los guardarraíles 1D (sobre la rejilla de oferta)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 20 }), (res, ps) => {
        const issue = { name: "price", min: 0, max: 1000, direction: "lower-better" as const, weight: 1 };
        let prev1d: number | undefined;
        let prevMulti: Offer | undefined;
        for (const p of ps) {
          prev1d = enforceGuardrails({ role: "buyer", reservation: res }, p, prev1d);
          prevMulti = enforceOfferGuardrails([issue], { role: "buyer", reservation: { price: res } }, { price: p }, prevMulti);
          expect(prevMulti.price).toBe(prev1d);
        }
      }),
    );
  });

  it("rechaza no finitos, issues ausentes e issues no declarados", () => {
    const issues = [{ name: "pct", min: 0, max: 10, direction: "higher-better" as const, weight: 1 }];
    const m = { role: "buyer" as const, reservation: { pct: 3 } };
    expect(() => enforceOfferGuardrails(issues, m, { pct: Number.NaN })).toThrow();
    expect(() => enforceOfferGuardrails(issues, m, { pct: Number.POSITIVE_INFINITY })).toThrow();
    expect(() => enforceOfferGuardrails(issues, m, {})).toThrow();
    expect(() => enforceOfferGuardrails(issues, m, { pct: 4, day: 3 })).toThrow(/day/);
  });
});
