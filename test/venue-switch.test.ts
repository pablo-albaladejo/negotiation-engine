import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arbitrate, type Budget } from "../src/coordinator/coordinator.js";
import { DEFAULT_MECHANISM_THRESHOLDS, decideMechanism, type BenchSession } from "../src/venue/mechanism.js";
import { executeVenueMechanism, proposeVenueMechanism, SWITCH_TO_BOARD_ID, venueSwitchGate } from "../src/venue/route.js";
import { planVenueSwitch } from "../src/venue/switch.js";
import { VENUE_COST } from "../src/venue/venue.js";
import type { Me } from "../src/shared/schemas.js";

const N = DEFAULT_MECHANISM_THRESHOLDS.noSwitchWithinTicks;
const budget: Budget = { accepts: 1, messagesPerConversation: 1, maxOpenThreads: 5, openThreadsNow: 0, offersPerTick: 1, maxOpenOffers: 5, openOffersNow: 0, missing: [] };
const session = (benchAt: number, ratio: number, hard = false): BenchSession => ({ benchAt, hard, shadowSurplus: ratio * 100, autoSurplus: 100, ratio, pairsShadow: 5, pairsAuto: 5, autoUnknown: 0, ticks: 16 });

describe("venue mechanism switch", () => {
  it("never executes without --confirm and --allow-venue-switch (and never in dry-run)", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (dryRun, confirm, allowVenueSwitch) => {
        const flags = { dryRun, confirm, allowVenueSwitch };
        const gate = venueSwitchGate(flags);
        expect(gate.execute).toBe(!dryRun && confirm && allowVenueSwitch);
        const intent = { id: SWITCH_TO_BOARD_ID, route: "venue" as const, kind: "venue" as const, summary: "switch" };
        const lines = executeVenueMechanism([intent], "v04", flags);
        expect(lines.some((l) => l.includes("APPROVED"))).toBe(gate.execute);
      }),
    );
  });

  it(`never proposes moving to board less than ${N} ticks from a bench`, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 240 }),
        fc.array(fc.double({ min: 0.5, max: 3, noNaN: true }), { minLength: 0, maxLength: 6 }),
        fc.integer({ min: 0, max: 2000 }),
        fc.boolean(),
        (ticksBefore, ratios, cash, hb) => {
          const benchAt = 10;
          const now = new Date("2026-10-03T10:00:00Z");
          const d = decideMechanism({
            current: "auto",
            sessions: ratios.map((r, k) => session(k * 2 + 3, r, k === 0)),
            cash,
            nowHours: benchAt - ticksBefore / 60,
            ticksPerHour: 60,
            schedule: { upcoming: [{ at_hours: benchAt, action: "bench", params: { ticks: 16 } }] },
            ...(hb ? { heartbeat: { ts: now.toISOString(), mode: "shadow" as const } } : {}),
            now,
          });
          const p = proposeVenueMechanism(d, "v04");
          const proposed = p.intents.some((i) => i.id === SWITCH_TO_BOARD_ID);
          if (ticksBefore < N) expect(proposed).toBe(false);
          // And if it is proposed, arbitration selects it at most once.
          const verdicts = arbitrate([...p.intents, ...p.intents.map((i) => ({ ...i, id: `${i.id}:dup` }))], budget);
          expect(verdicts.filter((v) => v.selected && v.intent.kind === "venue").length).toBeLessThanOrEqual(1);
        },
      ),
    );
  });

  it("recommends board only with sessions, ratio, cash, time and heartbeat all green", () => {
    const now = new Date("2026-10-03T10:00:00Z");
    const base = {
      current: "auto",
      sessions: [session(3, 1.12), session(5, 1.16)],
      cash: 400,
      nowHours: 6,
      ticksPerHour: 60,
      schedule: { upcoming: [{ at_hours: 7, action: "bench" }] },
      heartbeat: { ts: now.toISOString(), mode: "shadow" as const },
      now,
    };
    expect(decideMechanism(base).recommendation).toBe("switch-to-board");
    expect(decideMechanism({ ...base, sessions: [session(3, 1.3)] }).recommendation).toBe("insufficient-data");
    expect(decideMechanism({ ...base, sessions: [session(3, 1.3), session(5, 0.94)] }).recommendation).toBe("stay-auto");
    expect(decideMechanism({ ...base, cash: 280 }).recommendation).toBe("stay-auto");
    expect(decideMechanism({ ...base, nowHours: 6.9 }).recommendation).toBe("stay-auto");
    const { heartbeat: _hb, ...noHb } = base;
    expect(decideMechanism(noHb).recommendation).toBe("stay-auto");
  });
});

describe("venue replace (bazaar:venue --replace)", () => {
  const FLOOR = DEFAULT_MECHANISM_THRESHOLDS.cashFloor;
  // 120 ticks per game hour (tick_seconds 30); the bench starts at hour 10.
  const schedule = { upcoming: [{ at_hours: 10, action: "bench", params: { ticks: 16 } }] } as never;
  it("is allowed only with cash ≥ new venue + floor, outside a bench and ≥ noSwitchWithinTicks before one", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.double({ min: 7, max: 12, noNaN: true }), fc.constantFrom("auto", "board"), (cash, tHours, mechanism) => {
        const me = { id: "t02", cash, level: 5, venue: { venue: "v04", status: "open", rules: { mechanism } } } as unknown as Me;
        const clock = { tick: Math.round(tHours * 120), t_hours: tHours, tick_seconds: 30 };
        const plan = planVenueSwitch(me, [], clock, schedule, { mechanism: "board" });
        const benchEnd = 10 + 16 / 120;
        const ticksToBench = tHours >= benchEnd ? undefined : tHours >= 10 ? 0 : Math.floor((10 - tHours) * 120);
        expect(plan.ticksToBench).toBe(ticksToBench);
        const expected = cash >= VENUE_COST + FLOOR && mechanism === "auto" && (ticksToBench === undefined || ticksToBench >= N);
        expect(plan.ok).toBe(expected);
        if (plan.ok) expect(plan.open.body.rules.mechanism).toBe("board");
      }),
    );
  });
  it("refuses without an open venue to replace", () => {
    const me = { id: "t02", cash: 1000, level: 5, venue: null } as unknown as Me;
    expect(planVenueSwitch(me, [], { tick: 0, t_hours: 20, tick_seconds: 30 }, undefined, { mechanism: "board" }).ok).toBe(false);
  });
});
