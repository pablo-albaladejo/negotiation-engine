import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isLastFreeCopy } from "../../src/shared/last-copy.js";
import { OFFER_VENUE } from "../../src/shared/offer-venue.js";
import { proposeTeamDesk, TEAM_DESK_PARAMS } from "../../src/teamdesk/counter.js";
import { buildValueModel, tradeFee, RASTRO_FEES, type HeldAsset, type TradeOffer, type TradeState } from "../../src/trades/trades.js";

/**
 * CHA lane (P7, coordinator OK 4 Oct): team-desk may sell our last copy only when a dealer sells it back at ≤ our value,
 * the gain counted with the per-counterparty cap is ≥ 20, and always at the team's own offer.
 */

const REF = "CHA-05";
const CATALOG = { sets: [{ id: "CHA", released: true, cards: [{ id: REF, rarity: "common", book: 10 }, { id: "CHA-06", rarity: "common", book: 10 }] }], packs: [] } as never;
const FULL = { sets: [{ id: "CHA", released: true, cards: [{ id: REF, rarity: "common", book: 10 }] }], packs: [] } as never;

function state(held: HeldAsset[], offered: number, catalog: never = CATALOG): TradeState {
  const toMe: TradeOffer[] = [{ id: 21210, maker: "t08", to: "t02", venue: "rastro", thread: null, status: "open", give: { cash: offered }, want: { types: [`card:${REF}`] }, created_tick: 40, expires_tick: 70 }];
  return {
    tick: 50, myId: "t02", cash: 500, held, pageSets: ["CHA"], board: [], mine: [], toMe, settlements: [],
    model: buildValueModel(catalog, held, new Map()), limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 },
    spent: 0, reserved: new Set(),
  } as TradeState;
}

describe("team desk · CHA lane", () => {
  it("measured case: one copy (value 11), t08 offers 72, dealer rebuy at 10 → one counter at 72 to t08", () => {
    const held: HeldAsset[] = [{ id: 1, ref: REF, value: 11, locked: false }];
    const { plan } = proposeTeamDesk({ tick: 50, trade: state(held, 72), room: new Map([["t08", 47.8]]), rebuyable: new Map([[REF, 10]]) }, TEAM_DESK_PARAMS, new Map());
    expect(plan.posts.map((p) => [p.team, p.ref, p.price])).toEqual([["t08", REF, 72]]);
    expect(plan.posts.every((p) => p.venue === OFFER_VENUE && p.body.venue === OFFER_VENUE)).toBe(true);
  });

  it("a last copy only goes with a dealer rebuy ≤ value, scored gain ≥ laneMinGain, at ≥ value + laneMinGain", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 0, max: 120 }),
        fc.integer({ min: 0, max: 50 }),
        fc.option(fc.integer({ min: 1, max: 80 }), { nil: undefined }),
        (copies, value, offered, room, quote) => {
          const held: HeldAsset[] = Array.from({ length: copies }, (_, i) => ({ id: 1 + i, ref: REF, value, locked: false }));
          const input = { tick: 50, trade: state(held, offered), room: new Map([["t08", room]]), ...(quote !== undefined ? { rebuyable: new Map([[REF, quote]]) } : {}) };
          const { plan } = proposeTeamDesk(input, TEAM_DESK_PARAMS, new Map());
          for (const p of plan.posts) {
            const last = isLastFreeCopy(p.assetId, held, new Set(), new Set());
            if (!last) continue;
            expect(quote).toBeDefined();
            expect(quote!).toBeLessThanOrEqual(value);
            const gain = p.price - tradeFee(p.price, 1, RASTRO_FEES) - value;
            expect(Math.min(gain, room)).toBeGreaterThanOrEqual(TEAM_DESK_PARAMS.laneMinGain);
            expect(p.price).toBeGreaterThanOrEqual(value + TEAM_DESK_PARAMS.laneMinGain);
            expect(p.price).toBe(offered);
          }
        },
      ),
    );
  });

  it("never sells the last copy of a complete page (CHA 10/10, 4 Oct)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 60 }), fc.integer({ min: 0, max: 200 }), fc.integer({ min: 0, max: 50 }), fc.integer({ min: 1, max: 80 }), (value, offered, room, quote) => {
        const held: HeldAsset[] = [{ id: 1, ref: REF, value, locked: false }];
        const { plan } = proposeTeamDesk({ tick: 50, trade: state(held, offered, FULL), room: new Map([["t08", room]]), rebuyable: new Map([[REF, quote]]) }, TEAM_DESK_PARAMS, new Map());
        expect(plan.posts).toEqual([]);
      }),
    );
  });
});
