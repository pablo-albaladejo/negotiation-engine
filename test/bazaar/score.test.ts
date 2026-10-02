import { describe, expect, it } from "vitest";
import { causesFromRecords, computeDelta, extractScoreFields, formatScoreSummary, ScoreTracker, type ScoreSnapshot } from "../../src/bazaar/score.js";
import type { Me } from "../../src/bazaar/schemas.js";
import type { TraceRecord } from "../../src/bazaar/trace.js";

const ME = (score: unknown): Me => ({ cash: 100, assets: [], score }) as Me;

describe("extractScoreFields", () => {
  it("lee solo los campos públicos de la lista cerrada", () => {
    const fields = extractScoreFields(
      ME({ score: 3.2, neg_points: 2.1, mm_points: 0, duel_points: 0, ladder_points: 2.1, rank: 9, venue: "sat" }),
    );
    expect(fields).toEqual({ score: 3.2, neg_points: 2.1, mm_points: 0, duel_points: 0, ladder_points: 2.1, rank: 9, venue: "sat" });
  });

  it("nunca incluye rarest, luck ni luck_private aunque el servidor los mande", () => {
    const fields = extractScoreFields(ME({ score: 1, rarest: "mega-rare-card", luck: 0.9, luck_private: { seed: 42 } }));
    expect(fields).toEqual({ score: 1 });
    expect(JSON.stringify(fields)).not.toMatch(/rarest|luck/);
  });

  it("undefined si me.score no es un objeto", () => {
    expect(extractScoreFields(ME(undefined))).toBeUndefined();
    expect(extractScoreFields(ME(42))).toBeUndefined();
  });
});

describe("computeDelta", () => {
  it("0 para el primer snapshot (sin anterior)", () => {
    expect(computeDelta(undefined, { score: 3 })).toEqual({ score: 3 });
  });

  it("diferencia por campo numérico frente al anterior", () => {
    expect(computeDelta({ score: 3, neg_points: 1 }, { score: 3.2, neg_points: 1, mm_points: 2 })).toEqual({
      score: expect.closeTo(0.2, 10),
      neg_points: 0,
      mm_points: 2,
    });
  });
});

describe("causesFromRecords", () => {
  it("mapea accept y outcome(deal) a thread/dealer/action/price; ignora el resto", () => {
    const records: TraceRecord[] = [
      { ts: "t", tick: 1, dealer: "abuela", dryRun: false, action: "counter", thread: 7, ourPrice: 10 },
      { ts: "t", tick: 1, dealer: "abuela", dryRun: false, action: "accept", thread: 7, ourPrice: 12 },
      { ts: "t", tick: 1, dealer: "abuela", dryRun: false, action: "outcome", thread: 7, side: "sell", status: "deal", settledPrice: 12 },
    ];
    expect(causesFromRecords(records)).toEqual([
      { thread: 7, dealer: "abuela", action: "accept", price: 12 },
      { thread: 7, dealer: "abuela", action: "sell", price: 12 },
    ]);
  });
});

describe("ScoreTracker", () => {
  it("escribe un snapshot con delta y causa, y nunca campos privados", () => {
    const written: ScoreSnapshot[] = [];
    const tracker = new ScoreTracker({ write: (s) => written.push(s) }, () => 0);
    tracker.record(ME({ score: 3, neg_points: 3, rank: 10, luck: 1, rarest: "x" }), 5, []);
    tracker.record(
      ME({ score: 3.5, neg_points: 3.5, rank: 9 }),
      6,
      [{ ts: "t", tick: 6, dealer: "abuela", dryRun: false, action: "accept", thread: 2, ourPrice: 7 }],
    );
    expect(written).toHaveLength(2);
    expect(written[0]).toMatchObject({ tick: 5, score: 3, delta: { score: 3, neg_points: 3, rank: 10 } });
    expect(written[1]).toMatchObject({ tick: 6, score: 3.5, cause: [{ thread: 2, dealer: "abuela", action: "accept", price: 7 }] });
    expect(written[1]!.delta.score).toBeCloseTo(0.5, 10);
    for (const s of written) expect(JSON.stringify(s)).not.toMatch(/luck|rarest/);
  });

  it("devuelve undefined y no escribe si me.score no valida", () => {
    const written: ScoreSnapshot[] = [];
    const tracker = new ScoreTracker({ write: (s) => written.push(s) });
    expect(tracker.record(ME(undefined), 1, [])).toBeUndefined();
    expect(written).toHaveLength(0);
  });
});

describe("formatScoreSummary", () => {
  it("una línea con el desglose y la flecha de rank", () => {
    expect(formatScoreSummary({ score: 3.2, neg_points: 2.1, mm_points: 0, duel_points: 0, ladder_points: 2.1, rank: 9 }, 11)).toBe(
      "score 3.2 (neg 2.1 · mm 0 · duel 0 · ladder 2.1) rank 9 ↑2",
    );
  });

  it("sin flecha si el rank no cambia", () => {
    expect(formatScoreSummary({ score: 1, rank: 5 }, 5)).toBe("score 1 (neg 0 · mm 0 · duel 0 · ladder 0) rank 5");
  });
});
