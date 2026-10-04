import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EPIC_BUY_PARAMS, proposeRivalBuy, RIVAL_BUY_PARAMS, type RivalBuyInput } from "../../src/markets/rival-buy.js";
import { COUNTERPARTY_CAP, counterpartyRoom, MIN_ROOM } from "../../src/markets/room.js";
import { scanDecision } from "../../src/markets/scanner.js";
import { OFFER_VENUE } from "../../src/shared/offer-venue.js";
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
          const input: RivalBuyInput = { tick: TICK, trade: tradeState(1000, mine), rivals, maxSpend: 1000, cashFloor: 20, epic: EPIC, apiValues: new Map([[EPIC.ref, 300]]), room };
          const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, new Map(), []);
          const low = (t: string) => (room.get(t) ?? COUNTERPARTY_CAP) < MIN_ROOM;
          for (const p of plan.posts) expect(low(p.team)).toBe(false);
          for (const p of plan.posts) expect(p.body.venue).toBe(OFFER_VENUE);
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

describe("rival-buy page lane (Pablo, 4 Oct: negotiable bids for missing page cards)", () => {
  it("never bids above /api/me/value − pageLaneEdge, and only for a card we lack", async () => {
    const { buildValueModel } = await import("../../src/trades/trades.js");
    const REF = "MAL-09";
    const catalog = { sets: [{ id: "MAL", released: true, cards: [{ id: "MAL-01", rarity: "common", book: 10 }, { id: REF, rarity: "rare", book: 70 }] }], packs: [] } as never;
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 150 }), fc.integer({ min: 1, max: 3 }), fc.integer({ min: 0, max: 400 }), (value, copies, cash) => {
        const held = [{ id: 1, ref: "MAL-01", value: 9, locked: false }];
        const trade = { ...tradeState(cash, []), held, pageSets: ["MAL"], model: buildValueModel(catalog, held as never, new Map()) } as unknown as TradeState;
        const holder: RivalTeam = { team: "t07", seen: Array.from({ length: copies }, (_, i) => ({ assetId: 5000 + i, ref: REF, tick: TICK - 1, source: "board" as never })), distinct: 1, spares: [], pages: [], wants: [] };
        const rivals: RivalsState = { teams: [holder], byRef: { [REF]: { holders: ["t07"], wantedBy: [] } }, seenAssets: copies, lastEventId: 0 };
        const { plan } = proposeRivalBuy({ tick: TICK, trade, rivals, maxSpend: 1000, cashFloor: 50, apiValues: new Map([[REF, value]]), room: new Map() }, RIVAL_BUY_PARAMS, new Map(), []);
        for (const p of plan.posts) {
          expect(p.price).toBeLessThanOrEqual(Math.floor(value - RIVAL_BUY_PARAMS.pageLaneEdge));
          expect(p.price + 50).toBeLessThanOrEqual(cash);
          expect(p.body.venue).toBe(OFFER_VENUE);
        }
      }),
    );
  });
});
