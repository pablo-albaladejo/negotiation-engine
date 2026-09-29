import { describe, expect, it } from "vitest";
import { byCluster, computeMetrics, summarize, surplusShare } from "../../src/arena/metrics.js";
import type { GameResult, TranscriptEntry } from "../../src/arena/runner.js";
import { loadCatalog, type Scenario } from "../../src/arena/scenario.js";

const catalog = loadCatalog();
const scenario = (id: string) => catalog.find((s) => s.id === id)!;

function game(s: Scenario, overrides: Partial<GameResult> = {}, transcript: TranscriptEntry[] = []): GameResult {
  return {
    gameId: `${s.id}-g`,
    scenarioId: s.id,
    rival: "bot",
    agent: "agent",
    role: s.role,
    mode: s.mode,
    seed: 1,
    endReason: "limit",
    wrongAgreement: false,
    rounds: 1,
    transcript,
    agentLatencyMs: [],
    records: [],
    ...overrides,
  };
}

describe("fracción de excedente de la ZOPA", () => {
  // ZOPA amplia: comprador 3, vendedor 7 (pct: más alto es mejor para el comprador).
  it.each([
    ["price-buyer-wide", 7, 1],
    ["price-buyer-wide", 3, 0],
    ["price-buyer-wide", 5, 0.5],
    ["price-seller-wide", 4, 0.75],
    ["price-seller-wide", 7, 0],
  ])("%s con acuerdo en %d ⇒ %d", (id, pct, expected) => {
    expect(surplusShare(scenario(id), { pct })).toBeCloseTo(expected, 9);
  });

  it("sin acuerdo vale 0 y con ZOPA vacía no hay excedente (null)", () => {
    expect(surplusShare(scenario("price-buyer-wide"), undefined)).toBe(0);
    expect(surplusShare(scenario("price-buyer-empty"), { pct: 5 })).toBeNull();
  });

  it("multi-issue: media ponderada de la fracción por issue", () => {
    const s: Scenario = {
      ...scenario("price-buyer-wide"),
      issues: [
        { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 3 },
        { name: "day", min: 0, max: 60, direction: "higher-better", weight: 1 },
      ],
      mandates: { buyer: { reservation: { pct: 2, day: 20 } }, seller: { reservation: { pct: 6, day: 40 } } },
    };
    expect(surplusShare(s, { pct: 6, day: 20 })).toBeCloseTo(0.75, 9);
    expect(surplusShare({ ...s, role: "seller" }, { pct: 6, day: 20 })).toBeCloseTo(0.25, 9);
  });
});

describe("métricas por partida y resumen", () => {
  const agentOffer = (pct: number): TranscriptEntry => ({ round: 1, from: "agent", action: "counter", offer: { pct }, text: "" });

  it("cuenta violaciones de nuestras ofertas fuera del mandato", () => {
    const s = scenario("price-buyer-wide");
    const m = computeMetrics(s, game(s, {}, [agentOffer(4), agentOffer(2.5), agentOffer(2)]));
    expect(m.violations).toBe(2);
  });

  it("ZOPA vacía: correcta sin acuerdo ni violaciones y excluida de la media de excedente", () => {
    const empty = scenario("price-buyer-empty");
    const wide = scenario("price-buyer-wide");
    const metrics = [
      computeMetrics(empty, game(empty, { endReason: "agent-walk" }, [agentOffer(7)])),
      computeMetrics(wide, game(wide, { endReason: "agreement", agreement: { pct: 5 } }, [agentOffer(5)])),
      computeMetrics(wide, game(wide, { endReason: "limit" })),
    ];
    expect(metrics[0]).toMatchObject({ zopaEmpty: true, correct: true, surplusShare: null });
    const summary = summarize(metrics);
    expect(summary.meanSurplus).toBeCloseTo(0.25, 9);
    expect(summary.emptyZopaCorrect).toBe(1);
    expect(summary.agreementRate).toBeCloseTo(1 / 3, 9);
  });

  it("un acuerdo con ZOPA vacía no es correcto", () => {
    const empty = scenario("price-buyer-empty");
    expect(computeMetrics(empty, game(empty, { endReason: "agreement", agreement: { pct: 5 } })).correct).toBe(false);
  });

  it("los errores del rival no computan en excedente ni en acuerdo", () => {
    const wide = scenario("price-buyer-wide");
    const metrics = [
      computeMetrics(wide, game(wide, { endReason: "rival-error" })),
      computeMetrics(wide, game(wide, { endReason: "agreement", agreement: { pct: 7 } })),
    ];
    expect(summarize(metrics)).toMatchObject({ games: 2, rivalErrors: 1, agreementRate: 1, meanSurplus: 1 });
  });

  it("agrupa por clúster escenario × rival", () => {
    const wide = scenario("price-buyer-wide");
    const metrics = [
      computeMetrics(wide, game(wide, { rival: "a" })),
      computeMetrics(wide, game(wide, { rival: "b" })),
      computeMetrics(wide, game(wide, { rival: "a" })),
    ];
    expect(byCluster(metrics).map((c) => [c.rival, c.games])).toEqual([
      ["a", 2],
      ["b", 1],
    ]);
  });
});
