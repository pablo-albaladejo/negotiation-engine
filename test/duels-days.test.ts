import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DuelsAgent } from "../src/duels/agent.js";
import { DAYS_MAX, DAYS_MIN, DEFAULT_DUEL_PARAMS, daysDirection, daysValueFrom, decideDuel, surplusOf, textMatchesOffer, withinLimit, type DuelState } from "../src/duels/duels.js";
import { DuelSchema, type DuelsApi, type StructuredOffer } from "../src/duels/schemas.js";

// Shapes `your_days_weight` might take on the live server (none seen yet: every recorded duel was price-only).
const readable = fc.oneof(
  fc.integer({ min: -10, max: 10 }),
  fc.array(fc.integer({ min: -20, max: 20 }), { minLength: 11, maxLength: 11 }),
  fc.array(fc.integer({ min: -20, max: 20 }), { minLength: 11, maxLength: 11 }).map((a) => Object.fromEntries(a.map((v, d) => [String(d), v]))),
  fc.integer({ min: -10, max: 10 }).map((weight) => ({ weight })),
);
const unreadable = fc.oneof(
  fc.constant(undefined),
  fc.constant("high"),
  fc.constant({ direction: "earlier" }),
  fc.array(fc.integer(), { minLength: 3, maxLength: 5 }),
);

describe("two-issue duels: days weight", () => {
  it("any readable weight gives an 11-day table, and every decided offer has days in 0..10, text = structure, inside the limit", () => {
    fc.assert(
      fc.property(readable, fc.constantFrom("buyer" as const, "seller" as const), fc.integer({ min: 20, max: 200 }), fc.integer({ min: 0, max: 10 }), (raw, role, limit, rivalDays) => {
        const { table, unreadable: bad } = daysValueFrom(raw, DEFAULT_DUEL_PARAMS);
        expect(bad).toBeUndefined();
        expect(table).toHaveLength(DAYS_MAX - DAYS_MIN + 1);
        const rival: StructuredOffer = { price: role === "seller" ? Math.max(1, Math.round(limit * 0.7)) : Math.round(limit * 1.3), days: rivalDays };
        const state: DuelState = { role, limit, withDays: true, daysValue: table, ourOffers: [], rivalOffers: [rival], rivalMovedSinceOurLast: true };
        const d = decideDuel(state, DEFAULT_DUEL_PARAMS);
        if (d.action !== "counter") return;
        const o = d.offer!;
        expect(Number.isInteger(o.days)).toBe(true);
        expect(o.days!).toBeGreaterThanOrEqual(DAYS_MIN);
        expect(o.days!).toBeLessThanOrEqual(DAYS_MAX);
        expect(textMatchesOffer(d.text!, o)).toBe(true);
        expect((role === "seller" ? 1 : -1) * (o.price - limit)).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it("an unreadable weight is flagged (the duel pauses) instead of silently becoming 0", () => {
    fc.assert(
      fc.property(unreadable, (raw) => {
        expect(daysValueFrom(raw, DEFAULT_DUEL_PARAMS).unreadable).toBe(true);
      }),
    );
  });

  it("days_meaning sets the direction of a single weight", () => {
    expect(daysDirection("Each day of delay costs you this many primas")).toBe("fewer");
    expect(daysDirection("Later delivery: later is better for you")).toBe("more");
    expect(daysDirection(undefined)).toBeUndefined();
    const fewer = daysValueFrom(2, DEFAULT_DUEL_PARAMS, "earlier is better").table;
    expect(fewer[0]).toBeGreaterThan(fewer[10]!);
  });

  it("the agent sends nothing for a two-issue duel with an unreadable weight, even without `issues`", async () => {
    const said: unknown[] = [];
    const duel = DuelSchema.parse({ duel: 7, role: "seller", your_limit: 50, your_days_weight: { direction: "earlier" }, days_meaning: "fewer days" });
    const api = {
      clock: async () => ({ tick: 10 }),
      duels: async () => ({ duels: [duel] }),
      say: async (...a: unknown[]) => void said.push(a),
      accept: async (...a: unknown[]) => void said.push(a),
    } as unknown as DuelsApi;
    const agent = new DuelsAgent(api, { dryRun: false });
    const report = await agent.step();
    expect(said).toHaveLength(0);
    expect(report.entries[0]!.decision.rule).toBe("days-unreadable");
  });
});

describe("days value is the real score, never shifted (Duels II: 'each delivery day costs you this much cash')", () => {
  it("a buyer's surplus is limit − price − w·days, so a day-10 offer at the limit is a loss, never accepted", () => {
    fc.assert(
      fc.property(fc.integer({ min: 30, max: 200 }), fc.double({ min: 0.5, max: 8, noNaN: true }), fc.integer({ min: 0, max: 10 }), (limit, w, days) => {
        const table = daysValueFrom(w, DEFAULT_DUEL_PARAMS, "each delivery day costs you this much cash").table;
        expect(table[days]).toBeCloseTo(-w * days, 6);
        const st = { role: "buyer" as const, limit, withDays: true, daysValue: table };
        const price = limit - 1;
        expect(surplusOf(st, { price, days })).toBeCloseTo(1 - w * days, 6);
        if (1 - w * days < DEFAULT_DUEL_PARAMS.minSurplus) {
          const d = decideDuel({ ...st, ourOffers: [{ price: Math.round(limit / 2), days: 0 }], rivalOffers: [{ price, days }], rivalMovedSinceOurLast: true, ticksLeft: 1 }, DEFAULT_DUEL_PARAMS);
          expect(d.action).not.toBe("accept");
        }
      }),
    );
  });
});

describe("day deadlock: offer our best day when the rival's day leaves no room (Duels II 5659, 5679, 6029)", () => {
  it("a day-stand offer stays within the limit, keeps the minimum surplus and never asks more than our previous offer", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("buyer" as const, "seller" as const),
        fc.integer({ min: 30, max: 200 }),
        fc.double({ min: 0.5, max: 8, noNaN: true }),
        fc.integer({ min: -60, max: 60 }),
        fc.integer({ min: -40, max: 40 }),
        fc.integer({ min: 1, max: 12 }),
        (role, limit, w, rivalShift, ourShift, ticksLeft) => {
          const meaning = role === "buyer" ? "each delivery day costs you this much cash" : "each delivery day adds this much cash to your side";
          const table = daysValueFrom(w, DEFAULT_DUEL_PARAMS, meaning).table;
          const rivalDay = role === "buyer" ? 10 : 0;
          const rivalPrice = Math.max(1, limit + rivalShift);
          const previous: StructuredOffer = { price: Math.max(1, limit + ourShift), days: rivalDay };
          const state: DuelState = {
            role,
            limit,
            withDays: true,
            daysValue: table,
            ourOffers: [previous],
            rivalOffers: [{ price: rivalPrice + (role === "buyer" ? 3 : -3), days: rivalDay }, { price: rivalPrice, days: rivalDay }],
            rivalMovedSinceOurLast: true,
            ticksLeft,
          };
          const d = decideDuel(state, DEFAULT_DUEL_PARAMS);
          if (d.rule !== "day-stand" && d.rule !== "day-hold") return;
          const offer = d.offer!;
          expect(withinLimit(state, offer)).toBe(true);
          expect(surplusOf(state, offer)).toBeGreaterThanOrEqual(DEFAULT_DUEL_PARAMS.minSurplus);
          const prev = surplusOf(state, previous);
          if (prev >= DEFAULT_DUEL_PARAMS.minSurplus) expect(surplusOf(state, offer)).toBeLessThanOrEqual(prev + 1e-9);
          expect(textMatchesOffer(d.text!, offer)).toBe(true);
        },
      ),
    );
  });
});

describe("endgame with the rival outside the limit on price only", () => {
  it("offers our limit price on the rival's day, never a worse price for them nor a loss (Grand Final 15824)", () => {
    fc.assert(
      fc.property(fc.constantFrom("buyer" as const, "seller" as const), fc.integer({ min: 20, max: 200 }), fc.double({ min: -8, max: 8, noNaN: true }), fc.integer({ min: 0, max: 10 }), fc.integer({ min: 1, max: 3 }), (role, limit, w, rivalDays, ticksLeft) => {
        const daysValue = Array.from({ length: 11 }, (_, d) => w * d);
        const s = role === "seller" ? 1 : -1;
        const rival: StructuredOffer = { price: Math.max(1, limit - s * Math.round(limit * 0.4)), days: rivalDays };
        const previous: StructuredOffer = { price: limit + s, days: 5 };
        const state: DuelState = { role, limit, withDays: true, daysValue, ourOffers: [previous], rivalOffers: [rival], rivalMovedSinceOurLast: true, ticksLeft };
        const d = decideDuel(state, DEFAULT_DUEL_PARAMS);
        expect(d.action).not.toBe("accept");
        if (d.action !== "counter") return;
        const o = d.offer!;
        expect(withinLimit(state, o)).toBe(true);
        expect(surplusOf(state, o)).toBeGreaterThanOrEqual(DEFAULT_DUEL_PARAMS.minSurplus - 1e-9);
        expect(textMatchesOffer(d.text!, o)).toBe(true);
      }),
    );
    const daysValue = Array.from({ length: 11 }, (_, d) => 6.66 * d);
    const state: DuelState = {
      role: "seller", limit: 100, withDays: true, daysValue, ticksLeft: 3, rivalMovedSinceOurLast: true,
      ourOffers: [{ price: 102, days: 5 }, { price: 100, days: 5 }], rivalOffers: [{ price: 59, days: 10 }, { price: 62, days: 10 }],
    };
    const d = decideDuel(state, DEFAULT_DUEL_PARAMS);
    expect(d.action).toBe("counter");
    expect(d.offer).toEqual({ price: 100, days: 10 });
  });
});
