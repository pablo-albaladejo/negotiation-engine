import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EPIC_BUY_PARAMS, proposeRivalBuy, RIVAL_BUY_PARAMS, type RivalBuyInput } from "../../src/markets/rival-buy.js";
import { COUNTERPARTY_CAP, counterpartyRoom, MIN_ROOM } from "../../src/markets/room.js";
import { scanDecision } from "../../src/markets/scanner.js";
import type { RivalsState, RivalTeam } from "../../src/state/rivals.js";
import { DEFAULT_VALUE_RULES, type TradeOffer, type TradeState } from "../../src/trades/trades.js";

/** Payday cap per counterparty (measured 4 Oct: t05 +50 then 0): no bid to a team without score room, no edge above it. */

const TICK = 500;
const EPIC = EPIC_BUY_PARAMS;

const team = (id: string): RivalTeam => ({ team: id, seen: [{ assetId: 9000 + Number(id.slice(1)), ref: EPIC.ref, tick: TICK - 5, source: "board" as never }], distinct: 1, spares: [], pages: [], wants: [] });

function tradeState(cash: number, mine: TradeOffer[]): TradeState {
  return {
    tick: TICK, myId: "t02", cash, held: [], pageSets: [], board: [], mine, toMe: [], settlements: [],
    limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 }, spent: 0, reserved: new Set(),
    model: { rules: DEFAULT_VALUE_RULES, base: new Map(), meta: new Map(), pages: new Map(), sets: new Map() },
  } as unknown as TradeState;
}

describe("counterparty score room", () => {
  it("measured case: t05 +50 then 0 leaves no room; room stays within [0, cap]", () => {
    const r = counterpartyRoom([
      { delta: 50, deals: [{ source: "team", counterparty: "t05", expected: 61 }] },
      { delta: 0, deals: [{ source: "team", counterparty: "t05", expected: 48 }] },
      { delta: 2.2, deals: [{ source: "team", counterparty: "t08", expected: 3.3 }] },
    ]);
    expect(r.get("t05")).toBe(0);
    expect(r.get("t08")).toBe(47.8);
    fc.assert(
      fc.property(fc.array(fc.record({ delta: fc.double({ min: -100, max: 200, noNaN: true }), team: fc.constantFrom("t01", "t05", "t08") })), (xs) => {
        const room = counterpartyRoom(xs.map((x) => ({ delta: x.delta, deals: [{ source: "team", counterparty: x.team, expected: x.delta }] })));
        for (const v of room.values()) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(COUNTERPARTY_CAP);
        }
      }),
    );
  });

  it("the epic lane never posts to, nor keeps a bid with, a team below MIN_ROOM", () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.constantFrom(...EPIC.teams), fc.integer({ min: 0, max: COUNTERPARTY_CAP })),
        fc.array(fc.record({ to: fc.constantFrom(...EPIC.teams), age: fc.integer({ min: 0, max: 30 }) }), { maxLength: 2 }),
        (roomObj, bids) => {
          const room = new Map(Object.entries(roomObj));
          const mine: TradeOffer[] = bids.map((b, k) => ({ id: 1000 + k, to: b.to, venue: "rastro", status: "open", give: { cash: EPIC.start }, want: { cards: [EPIC.ref] }, created_tick: TICK - b.age, expires_tick: TICK + 10 }));
          const rivals: RivalsState = { teams: EPIC.teams.map(team), byRef: { [EPIC.ref]: { holders: [...EPIC.teams], wantedBy: [] } }, seenAssets: EPIC.teams.length, lastEventId: 0 };
          const input: RivalBuyInput = { tick: TICK, trade: tradeState(1000, mine), rivals, maxSpend: 0, cashFloor: 20, epic: EPIC, apiValues: new Map([[EPIC.ref, 300]]), room };
          const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, new Map(), []);
          const low = (t: string) => (room.get(t) ?? COUNTERPARTY_CAP) < MIN_ROOM;
          for (const p of plan.posts) expect(low(p.team)).toBe(false);
          const cancelled = new Set(plan.cancels.map((c) => c.offerId));
          for (const o of mine) if (low(o.to!)) expect(cancelled.has(o.id)).toBe(true);
        },
      ),
    );
  });

  it("the scanner's edge never exceeds the room left with the counterparty", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 300 }), fc.integer({ min: 0, max: 400 }), fc.integer({ min: 0, max: COUNTERPARTY_CAP }), fc.constantFrom("buy" as const, "sell" as const), (price, marginal, room, side) => {
        const d = scanDecision({ side, price, fee: 1, penalty: 0, marginal, cash: 1000, cashFloor: 0, spentThisHour: 0, committedThisTick: 0, spendPerHour: 1000, dealsWithCounterparty: 0, room });
        expect(d.edge).toBeLessThanOrEqual(room);
      }),
    );
  });
});
