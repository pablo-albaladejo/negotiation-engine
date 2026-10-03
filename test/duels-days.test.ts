import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DuelsAgent } from "../src/duels/agent.js";
import { DAYS_MAX, DAYS_MIN, DEFAULT_DUEL_PARAMS, daysDirection, daysValueFrom, decideDuel, textMatchesOffer, type DuelState } from "../src/duels/duels.js";
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
