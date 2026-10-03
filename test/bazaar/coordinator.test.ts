import { describe, expect, it } from "vitest";
import { arbitrate, type Budget, type Intent } from "../../src/coordinator/coordinator.js";
import { DEFAULT_DUEL_PARAMS, decideDuel, type DuelState } from "../../src/duels/duels.js";

/** Guardarraíles del coordinador (cupos de `clock.limits`, un activo en un solo sitio) y de los duelos v2. */

const budget = (over: Partial<Budget> = {}): Budget => ({
  accepts: 1,
  messagesPerConversation: 1,
  maxOpenThreads: 6,
  openThreadsNow: 0,
  offersPerTick: 12,
  maxOpenOffers: 30,
  openOffersNow: 0,
  missing: [],
  ...over,
});

const accept = (id: string, cls: NonNullable<Intent["acceptClass"]>, ev: number, locks?: string[]): Intent => ({ id, route: "trades", kind: "accept", acceptClass: cls, ev, conversation: id, summary: id, ...(locks ? { locks } : {}) });

describe("coordinator arbitration", () => {
  it("never selects more accepts than accepts_per_team_per_tick, across all routes, duel first", () => {
    const intents = [accept("trade", "other", 90), accept("ladder", "dealer-ladder", 50), accept("duel", "duel", 5), accept("page", "page-completing", 60)];
    const v = arbitrate(intents, budget());
    expect(v.filter((x) => x.selected).map((x) => x.intent.id)).toEqual(["duel"]);
    expect(arbitrate(intents, budget({ accepts: 2 })).filter((x) => x.selected).map((x) => x.intent.id).sort()).toEqual(["duel", "page"]);
    expect(arbitrate(intents, budget({ accepts: 0 })).some((x) => x.selected)).toBe(false);
  });

  it("never sends more messages per conversation than messages_per_side_per_tick, nor next to a selected accept", () => {
    const msg = (id: string, conversation: string): Intent => ({ id, route: "duels", kind: "message", conversation, summary: id });
    const v = arbitrate([msg("a1", "duel:1"), msg("a2", "duel:1"), msg("b1", "duel:2"), accept("duel:3", "duel", 1), msg("c1", "duel:3")], budget());
    expect(v.filter((x) => x.selected).map((x) => x.intent.id).sort()).toEqual(["a1", "b1", "duel:3"]);
  });

  it("one asset, one place: two routes never commit the same asset in one tick", () => {
    const open = (id: string): Intent => ({ id, route: "dealers", kind: "open", locks: ["asset:29"], summary: id });
    const v = arbitrate([open("abuela"), open("chato"), accept("rastro", "other", 10, ["asset:29"])], budget());
    expect(v.filter((x) => x.selected).map((x) => x.intent.id)).toEqual(["rastro"]);
  });

  it("respects open threads and listing caps", () => {
    const open = (id: string): Intent => ({ id, route: "dealers", kind: "open", summary: id });
    const list = (id: string): Intent => ({ id, route: "trades", kind: "listing", summary: id });
    const v = arbitrate([open("o1"), open("o2"), list("l1"), list("l2"), list("l3")], budget({ maxOpenThreads: 6, openThreadsNow: 5, offersPerTick: 2, openOffersNow: 29 }));
    expect(v.filter((x) => x.selected).map((x) => x.intent.id)).toEqual(["o1", "l1"]);
  });
});

const duel = (over: Partial<DuelState> = {}): DuelState => ({
  role: "seller",
  limit: 80,
  withDays: false,
  daysValue: Array.from({ length: 11 }, () => 0),
  ourOffers: [{ price: 120 }],
  rivalOffers: [],
  rivalMovedSinceOurLast: false,
  concessionsSinceRival: 0,
  ticksSinceOurLast: 5,
  ticksLeft: 10,
  ...over,
});

describe("duels v2 guardrails", () => {
  it("never accepts an offer outside our limit, not even on the last move", () => {
    for (const ticksLeft of [10, 1, 0]) {
      const d = decideDuel(duel({ rivalOffers: [{ price: 79 }], rivalMovedSinceOurLast: true, ticksLeft }), DEFAULT_DUEL_PARAMS);
      expect(d.action).not.toBe("accept");
      if (d.offer) expect(d.offer.price).toBeGreaterThanOrEqual(80);
    }
    const buyer = decideDuel(duel({ role: "buyer", limit: 100, ourOffers: [{ price: 60 }], rivalOffers: [{ price: 101 }], rivalMovedSinceOurLast: true, ticksLeft: 0 }), DEFAULT_DUEL_PARAMS);
    expect(buyer.action).not.toBe("accept");
  });

  it("never concedes twice without a rival counter", () => {
    const d = decideDuel(duel({ ourOffers: [{ price: 120 }, { price: 105 }], concessionsSinceRival: 1, ticksSinceOurLast: 9, ticksLeft: 2, rivalOffers: [{ price: 85 }] }), DEFAULT_DUEL_PARAMS);
    expect(d.action).toBe("wait");
  });

  it("always sends days when the duel negotiates them", () => {
    const d = decideDuel(duel({ withDays: true, daysValue: Array.from({ length: 11 }, (_, k) => k), ourOffers: [] }), DEFAULT_DUEL_PARAMS);
    expect(d.action).toBe("counter");
    expect(Number.isInteger(d.offer?.days)).toBe(true);
  });
});
