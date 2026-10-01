import { describe, expect, it } from "vitest";
import { DEFAULT_CATALOG, loadCatalog } from "../../src/arena/scenario.js";
import { acceptFirstMove, linearMove, orientToRole, withinMandate, type OrientedIssue } from "../../src/bots/dummy-agent.js";
import type { TurnInput } from "../../src/protocol/schemas.js";

const scenario = loadCatalog(DEFAULT_CATALOG).find((s) => s.id === "price-buyer-wide")!;
const issues: OrientedIssue[] = orientToRole(scenario); // buyer, pct higher-better, reserva 3
const reservation = scenario.mandates.buyer.reservation;

function turn(partial: Partial<TurnInput> & { round: number }): TurnInput {
  return { sessionId: "s", rivalAction: "offer", ...partial };
}

describe("dummy-agent: orientToRole", () => {
  it("invierte la dirección para el vendedor", () => {
    const sellerScenario = loadCatalog(DEFAULT_CATALOG).find((s) => s.id === "price-seller-wide")!;
    const sellerIssues = orientToRole(sellerScenario);
    expect(sellerIssues[0]!.higherBetter).toBe(false); // vendedor: menos pct es mejor
  });

  it("mantiene la dirección para el comprador", () => {
    expect(issues[0]!.higherBetter).toBe(true);
  });
});

describe("dummy-agent: accept-first", () => {
  it("acepta la primera oferta del rival dentro de su mandato", () => {
    const move = acceptFirstMove(issues, reservation, turn({ round: 1, rivalOffer: { pct: 5 } }));
    expect(move).toEqual({ action: "accept", offer: { pct: 5 } });
  });

  it("contesta con su reserva si la oferta del rival está fuera de mandato", () => {
    const move = acceptFirstMove(issues, reservation, turn({ round: 1, rivalOffer: { pct: 1 } }));
    expect(move).toEqual({ action: "counter", offer: { pct: 3 } });
  });

  it("nunca cruza su reserva ni en la última ronda", () => {
    const move = acceptFirstMove(issues, reservation, turn({ round: 10, roundLimit: 10, rivalOffer: { pct: 0 } }));
    expect(move.action).toBe("counter");
    expect(withinMandate(issues, reservation, move.offer!)).toBe(true);
  });

  it("se retira si el rival se retira", () => {
    expect(acceptFirstMove(issues, reservation, { sessionId: "s", round: 1, rivalAction: "walk" })).toEqual({ action: "walk" });
  });
});

describe("dummy-agent: linear", () => {
  it("abre en el extremo que más le favorece", () => {
    const move = linearMove(issues, reservation, turn({ round: 1, roundLimit: 10, rivalOffer: { pct: 0 } }));
    expect(move).toEqual({ action: "counter", offer: { pct: 10 } });
  });

  it("concede de forma monótona y lineal hacia su reserva", () => {
    const rounds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
      (round) => (linearMove(issues, reservation, turn({ round, roundLimit: 10, rivalOffer: { pct: 0 } })).offer as { pct: number }).pct,
    );
    for (let k = 1; k < rounds.length; k++) expect(rounds[k]!).toBeLessThanOrEqual(rounds[k - 1]! + 1e-9);
    expect(rounds.at(-1)!).toBeCloseTo(3, 9); // llega exactamente a su reserva
    for (const pct of rounds) expect(pct).toBeGreaterThanOrEqual(3 - 1e-9);
  });

  it("acepta si la oferta del rival es al menos tan buena como la que iba a proponer", () => {
    const move = linearMove(issues, reservation, turn({ round: 5, roundLimit: 10, rivalOffer: { pct: 9 } }));
    expect(move).toEqual({ action: "accept", offer: { pct: 9 } });
  });

  it("en la última ronda acepta cualquier oferta dentro de su mandato", () => {
    const move = linearMove(issues, reservation, turn({ round: 10, roundLimit: 10, rivalOffer: { pct: 3 } }));
    expect(move).toEqual({ action: "accept", offer: { pct: 3 } });
  });

  it("se retira si el rival se retira", () => {
    expect(linearMove(issues, reservation, { sessionId: "s", round: 1, rivalAction: "walk" })).toEqual({ action: "walk" });
  });
});
