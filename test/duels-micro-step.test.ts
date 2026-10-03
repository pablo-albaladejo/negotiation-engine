import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DEFAULT_DUEL_PARAMS, decideDuel, textMatchesOffer, type DuelState } from "../src/duels/duels.js";
import type { StructuredOffer } from "../src/duels/schemas.js";

const daysTable = Array.from({ length: 11 }, (_, k) => k);

describe("duel micro-concession (repeating a price earns no concession)", () => {
  it("while the rival moves every round, our offers never repeat with >= 1 P of room and never cross the limit", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("buyer" as const, "seller" as const),
        fc.integer({ min: 20, max: 200 }),
        fc.boolean(),
        fc.integer({ min: 4, max: 20 }),
        (role, limit, withDays, rounds) => {
          const s = role === "seller" ? 1 : -1;
          const ours: StructuredOffer[] = [];
          const theirs: StructuredOffer[] = [];
          for (let r = 0; r < rounds; r++) {
            // The rival moves every round but its offers stay outside our limit: never accepted.
            const rivalPrice = role === "seller" ? Math.max(1, limit - 1 - r) : limit + 1 + r;
            theirs.push(withDays ? { price: rivalPrice, days: r % 11 } : { price: rivalPrice });
            const state: DuelState = {
              role,
              limit,
              withDays,
              daysValue: daysTable.map(() => 0),
              ourOffers: ours,
              rivalOffers: theirs,
              rivalMovedSinceOurLast: true,
            };
            const d = decideDuel(state, DEFAULT_DUEL_PARAMS);
            expect(d.action).toBe("counter");
            const offer = d.offer!;
            expect(s * (offer.price - limit)).toBeGreaterThanOrEqual(0);
            expect(textMatchesOffer(d.text!, offer)).toBe(true);
            const last = ours.at(-1);
            if (last && s * (last.price - limit) >= DEFAULT_DUEL_PARAMS.minSurplus + 1) expect(offer.price).not.toBe(last.price);
            ours.push(offer);
          }
        },
      ),
    );
  });
});

describe("duel ladder to a silent rival (never offered)", () => {
  it("concedes at most silentLadder times plus one endgame step, monotonic and never past the limit", () => {
    fc.assert(
      fc.property(fc.constantFrom("buyer" as const, "seller" as const), fc.integer({ min: 20, max: 200 }), fc.integer({ min: 4, max: 30 }), (role, limit, ticks) => {
        const s = role === "seller" ? 1 : -1;
        const ours: StructuredOffer[] = [];
        let sinceOurs = 0;
        for (let t = 0; t < ticks; t++) {
          const concessions = Math.max(0, ours.length - 1);
          const d = decideDuel(
            {
              role,
              limit,
              withDays: false,
              daysValue: daysTable.map(() => 0),
              ourOffers: ours,
              rivalOffers: [],
              rivalMovedSinceOurLast: false,
              concessionsSinceRival: concessions,
              ticksSinceOurLast: sinceOurs,
              ticksLeft: ticks - t,
            },
            DEFAULT_DUEL_PARAMS,
          );
          expect(d.action).not.toBe("accept");
          sinceOurs++;
          if (d.action !== "counter") continue;
          const offer = d.offer!;
          expect(s * (offer.price - limit)).toBeGreaterThanOrEqual(DEFAULT_DUEL_PARAMS.minSurplus);
          const last = ours.at(-1);
          if (last) expect(s * (offer.price - last.price)).toBeLessThan(0);
          ours.push(offer);
          sinceOurs = 0;
        }
        expect(ours.length).toBeLessThanOrEqual(1 + DEFAULT_DUEL_PARAMS.silentLadder + 1);
      }),
    );
  });
});
