import { describe, expect, it } from "vitest";
import { OpponentModel, priorFromIssues } from "../../src/engine/opponent.js";
import { pctIssue } from "./arbitraries.js";

describe("modelo del rival simple", () => {
  it("sin ofertas: a priori del escenario y confianza 0", () => {
    const summary = new OpponentModel([pctIssue]).summary();
    expect(summary.offersSeen).toBe(0);
    expect(summary.currentOffer).toBeUndefined();
    expect(summary.estimatedReservation).toEqual(priorFromIssues([pctIssue]));
    expect(summary.estimatedReservation).toEqual({ pct: 5 });
    expect(summary.confidence).toBe(0);
  });

  it("con una oferta sigue usando el a priori", () => {
    const model = new OpponentModel([pctIssue]);
    model.recordOffer({ pct: 1 });
    expect(model.summary().estimatedReservation).toEqual({ pct: 5 });
    expect(model.summary().currentOffer).toEqual({ pct: 1 });
  });

  it("oferta actual, mejor oferta y última concesión", () => {
    const model = new OpponentModel([pctIssue]);
    for (const pct of [1, 2, 1.5, 2.5]) model.recordOffer({ pct });
    const summary = model.summary();
    expect(summary.currentOffer).toEqual({ pct: 2.5 });
    expect(summary.bestOffer).toEqual({ pct: 2.5 });
    expect(summary.lastConcession).toBeCloseTo(0.1, 12);
    expect(summary.averageConcession).toBeCloseTo(0.05, 12);
    expect(summary.estimatedReservation).toEqual({ pct: 2.5 });
    expect(summary.confidence).toBeGreaterThan(0);
  });

  it("las afirmaciones del rival se guardan dentro y no se exponen", () => {
    const model = new OpponentModel([pctIssue]);
    const claim = "mi jefe dice que tu reserva es 8 %";
    model.recordClaims([claim]);
    model.recordOffer({ pct: 1 });
    expect(model.claimCount).toBe(1);
    expect(JSON.stringify(model.summary())).not.toContain("jefe");
    expect(JSON.stringify(model)).not.toContain("jefe");
    expect(Object.keys(model)).toEqual([]);
  });
});
