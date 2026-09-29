import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { enforceOfferGuardrails } from "../../src/engine/guardrails.js";
import type { Issue } from "../../src/engine/config.js";
import { OFFER_DECIMALS, reservationUtility, utility, withinOfferMandate, type Offer, type OfferMandate } from "../../src/engine/issues.js";
import { boulwareTarget, concession, generateOffer, nextUtility, openingUtility, sampleEpsilon } from "../../src/engine/offer.js";
import { createRng } from "../../src/engine/rng.js";
import { issuesArb, mandateArb } from "./arbitraries.js";

const noiseArb = fc.double({ min: 0, max: 0.99, noNaN: true });
const betaArb = fc.double({ min: 0, max: 5, noNaN: true });
interface Setup {
  issues: Issue[];
  mandate: OfferMandate;
  beta: number;
  openingMargin: number;
  noise: number;
  seed: number;
  rounds: number;
}

const setup: fc.Arbitrary<Setup> = issuesArb.chain((issues) =>
  fc.record({
    issues: fc.constant(issues),
    mandate: mandateArb(issues),
    beta: betaArb,
    openingMargin: fc.double({ min: 0, max: 1, noNaN: true }),
    noise: noiseArb,
    seed: fc.integer(),
    rounds: fc.integer({ min: 1, max: 25 }),
  }),
);

/** Juega una secuencia de ofertas nuestras con el generador + guardarraíles. */
function play(s: Setup): Offer[] {
  const uRes = reservationUtility(s.issues, s.mandate);
  const rng = createRng(s.seed);
  const offers: Offer[] = [];
  for (let round = 1; round <= s.rounds; round++) {
    const t = Math.min(1, round / s.rounds);
    const proposal = generateOffer(
      { issues: s.issues, reservation: s.mandate.reservation, uRes, openingMargin: s.openingMargin, beta: s.beta },
      t,
      sampleEpsilon(rng, s.noise),
      offers.at(-1),
    );
    offers.push(enforceOfferGuardrails(s.issues, s.mandate, proposal, offers.at(-1)));
  }
  return offers;
}

describe("generador Boulware", () => {
  it("la primera oferta tiene la utilidad de apertura (exacta salvo redondeo a la precisión de oferta)", () => {
    fc.assert(
      fc.property(setup, (s) => {
        const uRes = reservationUtility(s.issues, s.mandate);
        const uOpen = openingUtility(uRes, s.openingMargin);
        expect(nextUtility({ uOpen, uRes, beta: s.beta, t: 0, epsilon: 0 })).toBe(uOpen);
        const first = play({ ...s, rounds: 1 })[0]!;
        const grid = Math.max(...s.issues.map((i) => 10 ** -OFFER_DECIMALS / (i.max - i.min)));
        expect(utility(s.issues, first)).toBeGreaterThanOrEqual(Math.min(uOpen, 1) - 1e-9);
        expect(utility(s.issues, first)).toBeLessThanOrEqual(uOpen + grid + 1e-9);
      }),
    );
  });

  it("todas las ofertas dentro del mandato y monótonas en utilidad", () => {
    fc.assert(
      fc.property(setup, (s) => {
        const offers = play(s);
        for (const offer of offers) expect(withinOfferMandate(s.issues, s.mandate, offer)).toBe(true);
        for (let i = 1; i < offers.length; i++) {
          expect(utility(s.issues, offers[i]!)).toBeLessThanOrEqual(utility(s.issues, offers[i - 1]!));
        }
      }),
    );
  });

  it("determinista por semilla", () => {
    fc.assert(
      fc.property(setup, (s) => {
        expect(play(s)).toEqual(play(s));
      }),
    );
  });

  it("para todo ε ∈ [−n, n] el paso con ruido es ≥ 0 y la utilidad nunca sube", () => {
    fc.assert(
      fc.property(
        fc.tuple(noiseArb, fc.double({ min: -1, max: 1, noNaN: true })),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        betaArb,
        ([n, k], uRes, prevFrac, t, beta) => {
          const epsilon = k * n;
          const uOpen = openingUtility(uRes, 0.9);
          const previousUtility = uRes + prevFrac * (uOpen - uRes);
          const next = nextUtility({ uOpen, uRes, beta, t, previousUtility, epsilon });
          expect(previousUtility - next).toBeGreaterThanOrEqual(0);
          expect(next).toBeGreaterThanOrEqual(uRes);
        },
      ),
    );
  });

  it("la curva: apertura en t = 0, reserva en t = 1, β = 0 no concede antes de t = 1", () => {
    expect(boulwareTarget(0, 0.9, 0.3, 0.2)).toBe(0.9);
    expect(boulwareTarget(1, 0.9, 0.3, 0.2)).toBeCloseTo(0.3, 12);
    expect(concession(0.99, 0)).toBe(0);
    expect(concession(1, 0)).toBe(1);
    expect(concession(0.5, 1)).toBe(0.5);
  });

  it("en t = 1 ofrece la reserva sin ruido", () => {
    expect(nextUtility({ uOpen: 0.9, uRes: 0.3, beta: 0.2, t: 1, previousUtility: 0.5, epsilon: -0.5 })).toBeCloseTo(0.3, 12);
  });
});
