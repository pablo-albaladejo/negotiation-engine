import { describe, expect, it } from "vitest";
import { arbitrate, type Budget, type Intent } from "../../src/coordinator/coordinator.js";
import { DEFAULT_DUEL_PARAMS, decideDuel, type DuelState } from "../../src/duels/duels.js";

/** Coordinator guardrails (`clock.limits` quotas, one asset in one place) and duels v2. */

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
  it("agenda intents never go out, and the agenda can block new conversations", () => {
    const intents: Intent[] = [
      { id: "agenda:bench:3", route: "agenda", kind: "agenda", summary: "venue" },
      { id: "dealers:open:abuela:sell:1", route: "dealers", kind: "open", summary: "open" },
      { id: "dealers:open:chato:sell:2", route: "dealers", kind: "open", summary: "open" },
      { id: "eggs:probe:abuela", route: "eggs", kind: "probe", conversation: "dealer:9", summary: "probe" },
      { id: "dealers:counter:abuela:9", route: "dealers", kind: "message", conversation: "dealer:9", summary: "counter" },
    ];
    const sel = (b: Budget) => arbitrate(intents, b).filter((x) => x.selected).map((x) => x.intent.id);
    expect(sel(budget())).not.toContain("agenda:bench:3");
    expect(sel(budget())).not.toContain("eggs:probe:abuela");
    expect(sel(budget({ opensBlocked: "finale" })).some((id) => id.startsWith("dealers:open"))).toBe(false);
    expect(sel(budget({ closedPersonas: ["chato"] }))).toEqual(expect.not.arrayContaining(["dealers:open:chato:sell:2"]));
  });

  it("one sale of a card per tick: a selected market accept of RET-06 blocks the El Rastro listing of another copy", () => {
    const market: Intent = { id: "markets:accept:v02:4230", route: "markets", kind: "accept", acceptClass: "other", ev: 8, conversation: "market:v02:4230", summary: "sell RET-06 @22", locks: ["offer:4230", "asset:11", "sell:RET-06"] };
    const listing: Intent = { id: "trades:post:0", route: "trades", kind: "listing", ev: 2, summary: "list RET-06 @14", locks: ["asset:12", "sell:RET-06"] };
    const v = arbitrate([listing, market], budget());
    expect(v.find((x) => x.intent.id === "trades:post:0")).toMatchObject({ selected: false, reason: expect.stringContaining("sell:RET-06") });
    // If the market accept does not get the quota, the listing is the only sale and goes out.
    const busy = arbitrate([accept("page", "page-completing", 60), listing, market], budget());
    expect(busy.find((x) => x.intent.id === "trades:post:0")?.selected).toBe(true);
  });

  it("never selects more team accepts than accepts_per_team_per_tick; duel accepts have their own limit (one per duel)", () => {
    const intents = [accept("trade", "other", 90), accept("ladder", "dealer-ladder", 50), accept("duel", "duel", 5), accept("page", "page-completing", 60)];
    const sel = (b: ReturnType<typeof budget>) => arbitrate(intents, b).filter((x) => x.selected).map((x) => x.intent.id).sort();
    expect(sel(budget())).toEqual(["duel", "page"]);
    expect(sel(budget({ accepts: 2 }))).toEqual(["duel", "ladder", "page"]);
    expect(sel(budget({ accepts: 0 }))).toEqual(["duel"]);
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
    const d = decideDuel(duel({ ourOffers: [{ price: 120 }, { price: 105 }], concessionsSinceRival: 1, ticksSinceOurLast: 9, ticksLeft: 3, rivalOffers: [{ price: 85 }] }), DEFAULT_DUEL_PARAMS);
    expect(d.action).toBe("wait");
  });

  it("always sends days when the duel negotiates them", () => {
    const d = decideDuel(duel({ withDays: true, daysValue: Array.from({ length: 11 }, (_, k) => k), ourOffers: [] }), DEFAULT_DUEL_PARAMS);
    expect(d.action).toBe("counter");
    expect(Number.isInteger(d.offer?.days)).toBe(true);
  });
});
