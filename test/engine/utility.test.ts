import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  normalizeIssue,
  offerAtUtility,
  orientIssues,
  reservationUtility,
  roundInFavor,
  utility,
  withinOfferMandate,
} from "../../src/engine/issues.js";
import { issuesArb, offerArb, pctIssue } from "./arbitraries.js";

describe("utilidad multi-issue", () => {
  it("está en [0, 1] incluso con valores fuera de límites", () => {
    fc.assert(
      fc.property(
        issuesArb.chain((issues) => fc.tuple(fc.constant(issues), offerArb(issues, 0.5))),
        ([issues, offer]) => {
          const u = utility(issues, offer);
          expect(u).toBeGreaterThanOrEqual(0);
          expect(u).toBeLessThanOrEqual(1);
        },
      ),
    );
  });

  it("es estrictamente monótona en cada issue según su direction", () => {
    fc.assert(
      fc.property(
        issuesArb.chain((issues) =>
          fc.tuple(fc.constant(issues), offerArb(issues), fc.nat({ max: issues.length - 1 }), fc.double({ min: 0.01, max: 0.99, noNaN: true })),
        ),
        ([issues, offer, k, frac]) => {
          const issue = issues[k]!;
          const a = issue.min + (issue.max - issue.min) * frac * 0.5;
          const b = a + (issue.max - issue.min) * 0.25;
          const worse = { ...offer, [issue.name]: issue.direction === "higher-better" ? a : b };
          const better = { ...offer, [issue.name]: issue.direction === "higher-better" ? b : a };
          expect(utility(issues, better)).toBeGreaterThan(utility(issues, worse));
        },
      ),
    );
  });

  it("recorta fuera de límites: por encima del max de un higher-better vale 1", () => {
    expect(normalizeIssue(pctIssue, 15)).toBe(1);
    expect(normalizeIssue(pctIssue, -3)).toBe(0);
    expect(utility([pctIssue], { pct: 15 })).toBe(1);
  });

  it("con n = 1 depende solo del precio", () => {
    expect(utility([pctIssue], { pct: 2.5, day: 99 })).toBe(0.25);
    expect(utility([pctIssue], { pct: 2.5, day: 1 })).toBe(0.25);
  });

  it("con n ≥ 2 es la suma ponderada normalizada", () => {
    const issues = [
      { ...pctIssue, weight: 0.75 },
      { name: "day", min: 0, max: 60, direction: "lower-better" as const, weight: 0.25 },
    ];
    expect(utility(issues, { pct: 5, day: 15 })).toBeCloseTo(0.75 * 0.5 + 0.25 * 0.75, 12);
  });

  it("rechaza ofertas sin algún issue o con valores no finitos", () => {
    expect(() => utility([pctIssue], {})).toThrow(/pct/);
    expect(() => utility([pctIssue], { pct: Number.NaN })).toThrow(/pct/);
  });

  it("orientIssues invierte la dirección para el vendedor", () => {
    expect(orientIssues([pctIssue], "buyer")[0]!.direction).toBe("higher-better");
    expect(orientIssues([pctIssue], "seller")[0]!.direction).toBe("lower-better");
  });

  it("offerAtUtility es la inversa de la utilidad", () => {
    fc.assert(
      fc.property(issuesArb, fc.double({ min: 0, max: 1, noNaN: true }), (issues, u) => {
        expect(utility(issues, offerAtUtility(issues, u))).toBeCloseTo(u, 9);
      }),
    );
  });

  it("roundInFavor nunca empeora nuestra utilidad", () => {
    fc.assert(
      fc.property(
        issuesArb.chain((issues) => fc.tuple(fc.constant(issues), offerArb(issues))),
        ([issues, offer]) => {
          expect(utility(issues, roundInFavor(issues, offer))).toBeGreaterThanOrEqual(utility(issues, offer) - 1e-12);
        },
      ),
    );
    expect(roundInFavor([pctIssue], { pct: 2.31 })).toEqual({ pct: 2.31 });
    expect(roundInFavor([pctIssue], { pct: 2.301 })).toEqual({ pct: 2.31 });
  });

  it("mandato por issue y utilidad de reserva", () => {
    const mandate = { role: "buyer" as const, reservation: { pct: 3 } };
    expect(reservationUtility([pctIssue], mandate)).toBeCloseTo(0.3, 12);
    expect(withinOfferMandate([pctIssue], mandate, { pct: 3 })).toBe(true);
    expect(withinOfferMandate([pctIssue], mandate, { pct: 2.99 })).toBe(false);
  });
});
