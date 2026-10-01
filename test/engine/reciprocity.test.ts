import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { decide, type EngineInput } from "../../src/engine/engine.js";
import { orientIssues, utility } from "../../src/engine/issues.js";
import { nextUtility, reciprocityFactor } from "../../src/engine/offer.js";
import { mandateArb, offerArb, issuesArb } from "./arbitraries.js";

describe("factor de reciprocidad Tit-for-Tat (12.2)", () => {
  it.each([
    ["sin peso de reciprocidad ⇒ 1", 0, 0, 0.1, 1],
    ["sin concesión nuestra previa ⇒ 1", 1, 0, undefined, 1],
    ["sin concesión conocida del rival ⇒ 1", 1, undefined, 0.1, 1],
    ["el rival no concede, peso 1 ⇒ 0", 1, 0, 0.1, 0],
    ["el rival no concede, peso 0,5 ⇒ 0,5", 0.5, 0, 0.1, 0.5],
    ["el rival concede la mitad, peso 1 ⇒ 0,5", 1, 0.05, 0.1, 0.5],
    ["el rival concede más que nosotros ⇒ 1", 1, 0.3, 0.1, 1],
    ["el rival retrocede ⇒ como no conceder", 1, -0.2, 0.1, 0],
  ])("%s", (_name, weight, rival, ours, expected) => {
    expect(reciprocityFactor(weight, rival, ours)).toBeCloseTo(expected, 12);
  });

  it("propiedad: el factor está en [0, 1]", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.option(fc.double({ min: -1, max: 1, noNaN: true }), { nil: undefined }),
        fc.option(fc.double({ min: -1, max: 1, noNaN: true }), { nil: undefined }),
        (w, rival, ours) => {
          const f = reciprocityFactor(w, rival, ours);
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThanOrEqual(1);
        },
      ),
    );
  });

  it("propiedad: nunca concede más que la curva Boulware con el mismo ε", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 5, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: -0.99, max: 0.99, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (a, b, beta, t, prevFrac, epsilon, factor) => {
          const uRes = Math.min(a, b);
          const uOpen = Math.max(a, b);
          const previousUtility = uRes + prevFrac * (uOpen - uRes);
          const step = { uOpen, uRes, beta, t, previousUtility, epsilon };
          const boulware = nextUtility(step);
          const tft = nextUtility({ ...step, reciprocity: factor });
          expect(tft).toBeGreaterThanOrEqual(boulware);
          expect(tft).toBeLessThanOrEqual(previousUtility);
        },
      ),
    );
  });

  it("propiedad en el motor: con reciprocidad nuestra contraoferta nunca vale menos (para nosotros) que sin ella", () => {
    fc.assert(
      fc.property(
        issuesArb.chain((issues) =>
          fc.record({
            issues: fc.constant(issues),
            mandate: mandateArb(issues),
            round: fc.integer({ min: 1, max: 12 }),
            ourOffers: fc.array(offerArb(issues), { maxLength: 4 }),
            rivalOffers: fc.array(offerArb(issues), { maxLength: 5 }),
            reciprocity: fc.double({ min: 0, max: 1, noNaN: true }),
            seed: fc.integer(),
          }),
        ),
        (g) => {
          const base: EngineInput = {
            issues: g.issues,
            mandate: g.mandate,
            params: { beta: 0.5, openingMargin: 0.9, acceptMargin: 0, acTimeThreshold: 1, noise: 0.3, defaultHorizon: 10 },
            state: { round: g.round, roundLimit: 12, ourOffers: g.ourOffers, rivalOffers: g.rivalOffers, rivalAcceptedOurLast: false, rivalWalked: false, rivalCanRespond: true },
            seed: g.seed,
          };
          const plain = decide(base);
          const tft = decide({ ...base, params: { ...base.params, reciprocity: g.reciprocity } });
          if (plain.action !== "counter" || tft.action !== "counter") return;
          const oriented = orientIssues(g.issues, g.mandate.role);
          expect(utility(oriented, tft.offer)).toBeGreaterThanOrEqual(utility(oriented, plain.offer) - 1e-12);
        },
      ),
      { numRuns: 500 },
    );
  });

  it("escenario: el rival no concede entre dos turnos ⇒ con reciprocidad 1 no concedemos", () => {
    const input: EngineInput = {
      issues: [{ name: "pct", min: 0, max: 10, direction: "higher-better", weight: 1 }],
      mandate: { role: "buyer", reservation: { pct: 3 } },
      params: { beta: 1, openingMargin: 0.9, acceptMargin: 0.02, acTimeThreshold: 0.9, noise: 0, defaultHorizon: 10, reciprocity: 1 },
      state: { round: 4, roundLimit: 10, ourOffers: [{ pct: 9.3 }, { pct: 8.8 }], rivalOffers: [{ pct: 1 }, { pct: 1 }], rivalAcceptedOurLast: false, rivalWalked: false },
      seed: 1,
    };
    expect(decide(input)).toMatchObject({ action: "counter", offer: { pct: 8.8 } });
    const boulware = decide({ ...input, params: { ...input.params, reciprocity: 0 } });
    expect(boulware.action === "counter" && boulware.offer.pct).toBeLessThan(8.8);
  });
});
