import { describe, expect, it } from "vitest";
import type { Issue } from "../../src/engine/config.js";
import type { Offer } from "../../src/engine/issues.js";
import { concession } from "../../src/engine/offer.js";
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

describe("modelo del rival por regresión de concesiones (12.1)", () => {
  // Tolerancia: 5 % del rango del issue.
  const TOLERANCE = 0.05;
  const twoIssues = [
    { name: "pct", min: 0, max: 10, direction: "higher-better" as const, weight: 0.7 },
    { name: "days", min: 0, max: 90, direction: "lower-better" as const, weight: 0.3 },
  ];

  /** Rival sintético dependiente del tiempo con reserva conocida (misma curva que los bots). */
  function syntheticOffers(issues: Issue[], rivalRes: Offer, rivalOpen: Offer, beta: number, rounds: number, limit: number) {
    return Array.from({ length: rounds }, (_, k) => {
      const t = (k + 1) / limit;
      const c = concession(t, beta);
      const offer = Object.fromEntries(issues.map((i) => [i.name, rivalOpen[i.name]! + (rivalRes[i.name]! - rivalOpen[i.name]!) * c]));
      return { t, offer: Object.fromEntries(Object.entries(offer).map(([n, v]) => [n, Math.round(v * 100) / 100])) };
    });
  }

  it.each([
    ["Boulware β=0.5", 0.5, 6],
    ["Boulware β=0.5, 8 ofertas", 0.5, 8],
    ["lineal β=1", 1, 6],
    ["Conceder β=2", 2, 6],
    ["Conceder β=4", 4, 7],
  ])("%s, 1 issue: reserva estimada dentro de tolerancia tras ≥ 5 concesiones", (_name, beta, rounds) => {
    // Somos comprador de pct (higher-better); el rival vendedor abre en 1 y su reserva es 6.
    const model = new OpponentModel([pctIssue]);
    for (const { t, offer } of syntheticOffers([pctIssue], { pct: 6 }, { pct: 1 }, beta, rounds, 10)) model.recordOffer(offer, t);
    const summary = model.summary();
    expect(Math.abs(summary.estimatedReservation.pct! - 6)).toBeLessThanOrEqual(TOLERANCE * 10);
    expect(summary.concessionBeta).toBeDefined();
  });

  it("2 issues: cada issue dentro de tolerancia", () => {
    const model = new OpponentModel(twoIssues);
    const offers = syntheticOffers(twoIssues, { pct: 5, days: 30 }, { pct: 0.5, days: 85 }, 0.8, 7, 10);
    for (const { t, offer } of offers) model.recordOffer(offer, t);
    const est = model.summary().estimatedReservation;
    expect(Math.abs(est.pct! - 5)).toBeLessThanOrEqual(TOLERANCE * 10);
    expect(Math.abs(est.days! - 30)).toBeLessThanOrEqual(TOLERANCE * 90);
  });

  it("la estimación nunca es peor para nosotros que la mejor oferta vista y queda dentro de los límites", () => {
    const model = new OpponentModel([pctIssue]);
    for (const [t, pct] of [[0.1, 1], [0.2, 1], [0.3, 1], [0.4, 1], [0.5, 1], [0.6, 3]] as const) model.recordOffer({ pct }, t);
    const est = model.summary().estimatedReservation.pct!;
    expect(est).toBeGreaterThanOrEqual(3);
    expect(est).toBeLessThanOrEqual(10);
  });

  it("sin tiempos o con menos de 3 ofertas cae al modelo simple (mejor oferta)", () => {
    const model = new OpponentModel([pctIssue]);
    for (const pct of [1, 2, 3, 4]) model.recordOffer({ pct });
    expect(model.summary().estimatedReservation).toEqual({ pct: 4 });
    expect(model.summary().concessionBeta).toBeUndefined();
  });

  it("frecuencias: el issue que el rival no mueve pesa más para él", () => {
    const model = new OpponentModel(twoIssues);
    for (const [pct, days] of [[1, 80], [1, 70], [1, 60], [1.5, 50]]) model.recordOffer({ pct: pct!, days: days! });
    const w = model.summary().estimatedWeights;
    expect(w.pct! + w.days!).toBeCloseTo(1, 12);
    expect(w.pct!).toBeGreaterThan(w.days!);
  });
});
