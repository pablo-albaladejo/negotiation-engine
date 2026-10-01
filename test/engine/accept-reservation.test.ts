import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { decideAcceptance, type TimeInfo } from "../../src/engine/acceptance.js";
import type { Issue } from "../../src/engine/config.js";
import { decide, type EngineInput } from "../../src/engine/engine.js";
import { orientIssues, reservationUtility, utility } from "../../src/engine/issues.js";
import { mandateArb, offerArb } from "./arbitraries.js";

/** Exactamente `n` issues con pesos normalizados. */
function issuesOf(n: number): fc.Arbitrary<Issue[]> {
  return fc
    .array(
      fc.record({
        min: fc.integer({ min: 0, max: 100 }),
        span: fc.integer({ min: 1, max: 100 }),
        direction: fc.constantFrom("higher-better" as const, "lower-better" as const),
        weight: fc.double({ min: 0.01, max: 1, noNaN: true }),
      }),
      { minLength: n, maxLength: n },
    )
    .map((raw) => {
      const total = raw.reduce((s, r) => s + r.weight, 0);
      return raw.map((r, i) => ({ name: `i${i}`, min: r.min, max: r.min + r.span, direction: r.direction, weight: r.weight / total }));
    });
}

const timeArb: fc.Arbitrary<TimeInfo> = fc.oneof(
  fc.double({ min: 0, max: 1, noNaN: true }).map((t) => ({ t, source: "ring-rounds" as const, isLastMove: false, defaultHorizonReached: false })),
  fc.constant({ t: 1, source: "ring-rounds" as const, isLastMove: true, defaultHorizonReached: false }),
  fc.constant({ t: 1, source: "default-horizon" as const, isLastMove: false, defaultHorizonReached: true }),
);

const paramsArb = fc.record({
  beta: fc.double({ min: 0, max: 5, noNaN: true }),
  openingMargin: fc.double({ min: 0, max: 1, noNaN: true }),
  acceptMargin: fc.double({ min: 0, max: 1, noNaN: true }),
  acTimeThreshold: fc.double({ min: 0, max: 1, noNaN: true }),
  noise: fc.double({ min: 0, max: 0.99, noNaN: true }),
  defaultHorizon: fc.integer({ min: 1, max: 20 }),
  reciprocity: fc.double({ min: 0, max: 1, noNaN: true }),
  acCombiThreshold: fc.double({ min: 0, max: 1, noNaN: true }),
});

describe.each([1, 2])("toda decisión accept cumple u ≥ u(reserva) con %i issue(s)", (n) => {
  it("en la caja de aceptación (AC_next, AC_combi, AC_time, último movimiento, horizonte)", () => {
    fc.assert(
      fc.property(
        issuesOf(n).chain((issues) =>
          fc.record({
            issues: fc.constant(issues),
            mandate: mandateArb(issues),
            rivalCurrent: offerArb(issues, 0.2),
            ourNextUtility: fc.double({ min: 0, max: 1, noNaN: true }),
            time: timeArb,
            acceptMargin: fc.double({ min: 0, max: 1, noNaN: true }),
            acTimeThreshold: fc.double({ min: 0, max: 1, noNaN: true }),
            rivalCanRespond: fc.boolean(),
            rivalPrevious: fc.array(offerArb(issues, 0.2), { maxLength: 6 }),
            acCombiThreshold: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
        ),
        (input) => {
          const { verdict } = decideAcceptance(input);
          if (verdict === "accept") {
            expect(utility(input.issues, input.rivalCurrent)).toBeGreaterThanOrEqual(reservationUtility(input.issues, input.mandate));
          }
        },
      ),
      { numRuns: 2000 },
    );
  });

  it("en el motor completo, con cualquier historial", () => {
    fc.assert(
      fc.property(
        issuesOf(n).chain((issues) =>
          fc.record({
            issues: fc.constant(issues),
            mandate: mandateArb(issues),
            params: paramsArb,
            round: fc.integer({ min: 1, max: 15 }),
            roundLimit: fc.option(fc.integer({ min: 1, max: 15 }), { nil: undefined }),
            ourOffers: fc.array(offerArb(issues), { maxLength: 4 }),
            rivalOffers: fc.array(offerArb(issues, 0.2), { maxLength: 6 }),
            rivalAcceptedOurLast: fc.boolean(),
            rivalCanRespond: fc.option(fc.boolean(), { nil: undefined }),
            seed: fc.integer(),
          }),
        ),
        (g) => {
          const state: EngineInput["state"] = {
            round: g.round,
            ourOffers: g.ourOffers,
            rivalOffers: g.rivalOffers,
            rivalAcceptedOurLast: g.rivalAcceptedOurLast,
            rivalWalked: false,
          };
          if (g.roundLimit !== undefined) state.roundLimit = g.roundLimit;
          if (g.rivalCanRespond !== undefined) state.rivalCanRespond = g.rivalCanRespond;
          const decision = decide({ issues: g.issues, mandate: g.mandate, params: g.params, state, seed: g.seed });
          if (decision.action === "accept") {
            const oriented = orientIssues(g.issues, g.mandate.role);
            expect(utility(oriented, decision.offer)).toBeGreaterThanOrEqual(reservationUtility(oriented, g.mandate));
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});
