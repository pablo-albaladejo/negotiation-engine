import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { APR_STEP_MESSAGE, AprBandSchema, aprOf, aprOffer, offerApr, offerGuardrails, pctForApr, withinAprBand, withinAprReservation } from "../../src/engine/apr.js";
import type { Issue } from "../../src/engine/config.js";
import { decide, openingOffer, type EngineInput } from "../../src/engine/engine.js";
import type { AprBand, Offer } from "../../src/engine/issues.js";

const issuesFor = (baseDays: number): Issue[] => [
  { name: "pct", min: 0, max: 20, direction: "higher-better", weight: 0.5 },
  { name: "day", min: 0, max: baseDays - 1, direction: "higher-better", weight: 0.5 },
];

describe("conversión pct/día ↔ TAE", () => {
  it("2/10 net 30 → 37,24 %", () => {
    expect(aprOf(2, 10, 30)).toBeCloseTo(37.24, 2);
    expect(pctForApr(aprOf(2, 10, 30), 10, 30)).toBeCloseTo(2, 10);
  });

  it("estrictamente creciente en pct y en día", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(30, 45, 60, 90),
        fc.double({ min: 0, max: 50, noNaN: true }),
        fc.double({ min: 0.01, max: 40, noNaN: true }),
        fc.double({ min: 0, max: 0.95, noNaN: true }),
        fc.double({ min: 0.001, max: 0.04, noNaN: true }),
        (baseDays, pct, dPct, dayFrac, dDayFrac) => {
          const day = dayFrac * baseDays;
          expect(aprOf(pct + dPct, day, baseDays)).toBeGreaterThan(aprOf(pct, day, baseDays));
          if (pct >= 0.01) expect(aprOf(pct, day + dDayFrac * baseDays, baseDays)).toBeGreaterThan(aprOf(pct, day, baseDays));
        },
      ),
    );
  });

  it("aprOffer queda dentro de la banda", () => {
    fc.assert(
      fc.property(fc.constantFrom(30, 60), fc.integer({ min: 1, max: 60 }), fc.integer({ min: 2, max: 60 }), fc.double({ min: -50, max: 200, noNaN: true }), fc.constantFrom("buyer" as const, "seller" as const), (baseDays, min, width, target, role) => {
        const band: AprBand = { min, max: min + width, baseDays, day: baseDays - 20 };
        expect(withinAprBand(band, aprOffer(band, role, target))).toBe(true);
      }),
    );
  });
});

const bandArb = fc.constantFrom(30, 60).chain((baseDays) =>
  fc.record({
    min: fc.integer({ min: 1, max: 60 }),
    width: fc.integer({ min: 2, max: 60 }),
    day: fc.integer({ min: 0, max: baseDays - 10 }),
    baseDays: fc.constant(baseDays),
  }),
);

describe("mandato apr: propiedad de banda", () => {
  it("ninguna oferta sale de la banda, ninguna aceptación cruza la reserva y concede monótonamente en TAE", () => {
    fc.assert(
      fc.property(
        bandArb,
        fc.constantFrom("buyer" as const, "seller" as const),
        fc.integer({ min: 2, max: 12 }),
        fc.record({ beta: fc.constantFrom(0, 0.3, 1, 3), openingMargin: fc.constantFrom(0.6, 0.9, 1), acceptMargin: fc.constantFrom(0, 0.03), noise: fc.constantFrom(0, 0.1) }),
        fc.array(fc.record({ pct: fc.integer({ min: 0, max: 1500 }), day: fc.integer({ min: 0, max: 29 }) }), { minLength: 12, maxLength: 12 }),
        fc.boolean(),
        fc.integer(),
        (b, role, roundLimit, p, rivalRaw, rivalCanRespond, seed) => {
          const band: AprBand = { min: b.min, max: b.min + b.width, baseDays: b.baseDays, day: b.day };
          const issues = issuesFor(b.baseDays);
          const mandate = { role, reservation: { pct: 0, day: b.day }, apr: band };
          const rival: Offer[] = rivalRaw.map((r) => ({ pct: r.pct / 100, day: r.day }));
          const ourOffers: Offer[] = [];
          for (let round = 1; round <= roundLimit; round++) {
            const input: EngineInput = {
              issues,
              mandate,
              params: { ...p, acTimeThreshold: 0.9, defaultHorizon: 10 },
              state: { round, roundLimit, ourOffers: [...ourOffers], rivalOffers: rival.slice(0, round - 1), rivalAcceptedOurLast: false, rivalWalked: false, rivalCanRespond },
              seed,
            };
            const decision = decide(input);
            if (decision.action === "walk") break;
            // Aceptar: nunca cruza el lado de la reserva (sí puede ser mejor que nuestro ancla).
            expect(withinAprReservation(role, band, decision.offer)).toBe(true);
            if (decision.action === "accept") break;
            expect(withinAprBand(band, decision.offer)).toBe(true);
            // El pipeline repite el guardarraíl antes de enviar: no cambia una oferta ya válida.
            expect(offerGuardrails(issues, mandate, decision.offer, ourOffers.at(-1))).toEqual(decision.offer);
            const last = ourOffers.at(-1);
            if (last) {
              const [a, l] = [offerApr(band, decision.offer), offerApr(band, last)];
              expect(role === "buyer" ? a <= l : a >= l).toBe(true);
            }
            ourOffers.push(decision.offer);
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  it("apertura en el lado favorable de la banda", () => {
    const band: AprBand = { min: 15, max: 45, baseDays: 30, day: 10 };
    const buyer = openingOffer(issuesFor(30), { role: "buyer", reservation: { pct: 0, day: 10 }, apr: band }, { openingMargin: 0.9, beta: 0.3 });
    const seller = openingOffer(issuesFor(30), { role: "seller", reservation: { pct: 0, day: 10 }, apr: band }, { openingMargin: 0.9, beta: 0.3 });
    expect(offerApr(band, buyer)).toBeGreaterThan(40);
    expect(offerApr(band, seller)).toBeLessThan(20);
    expect(buyer.day).toBe(10);
  });
});

const params = { beta: 0.3, openingMargin: 0.9, acceptMargin: 0.02, acTimeThreshold: 0.9, noise: 0, defaultHorizon: 10 };
const band30: AprBand = { min: 15, max: 45, baseDays: 30, day: 10 };
const inputAt = (role: "buyer" | "seller", rivalOffers: Offer[], ourOffers: Offer[] = []): EngineInput => ({
  issues: issuesFor(30),
  mandate: { role, reservation: { pct: 0, day: 10 }, apr: band30 },
  params,
  state: { round: 3, roundLimit: 8, ourOffers, rivalOffers, rivalAcceptedOurLast: false, rivalWalked: false, rivalCanRespond: true },
  seed: 1,
});

describe("mandato apr: revisión", () => {
  it("acepta una oferta mejor que nuestro ancla y nunca una que cruce la reserva", () => {
    const better = { pct: 3.5, day: 10 }; // ≈ 66 % TAE > 45 (ancla del comprador)
    expect(decide(inputAt("buyer", [better]))).toMatchObject({ action: "accept", offer: better });
    const cheap = { pct: 0.2, day: 10 }; // ≈ 3,7 % TAE < 8: mejor que el ancla del vendedor
    expect(decide(inputAt("seller", [cheap]))).toMatchObject({ action: "accept", offer: cheap });
    const crossing = { pct: 0.7, day: 10 }; // ≈ 12,9 % < 15 = reserva del comprador
    expect(decide(inputAt("buyer", [crossing])).action).not.toBe("accept");
  });

  it("contraoferta en el día del rival si está en el rango del issue; si no, en el día de referencia", () => {
    const atRival = decide(inputAt("buyer", [{ pct: 0.3, day: 20 }]));
    expect(atRival).toMatchObject({ action: "counter", offer: { day: 20 } });
    expect(withinAprBand(band30, (atRival as { offer: Offer }).offer)).toBe(true);
    const outside = decide(inputAt("buyer", [{ pct: 0.01, day: 29.5 }]));
    expect(outside).toMatchObject({ action: "counter", offer: { day: 10 } });
  });

  it("rechaza al cargar una banda más estrecha que un paso de 0,01 de pct", () => {
    const parsed = AprBandSchema.safeParse({ min: 20, max: 20.05, baseDays: 30, day: 10 });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => i.message)).toContain(APR_STEP_MESSAGE);
    expect(AprBandSchema.safeParse(band30).success).toBe(true);
  });
});
