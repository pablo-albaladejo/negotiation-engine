import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EPIC_BUY_LANES, EPIC_BUY_PARAMS, epicStep, proposeRivalBuy, RIVAL_BUY_PARAMS, type RivalBuyInput, type RivalBuyMemo } from "../../src/markets/rival-buy.js";
import type { RivalsState, RivalTeam } from "../../src/state/rivals.js";
import { DEFAULT_TRADE_PARAMS, DEFAULT_VALUE_RULES, MAKER_FEES, planTick, tradeFee, type HeldAsset, type TradeOffer, type TradeState, type ValueModel } from "../../src/trades/trades.js";

/** Epic test lane (Pablo, 4 Oct): never above the ceiling, never below the cash floor, only to the listed holders, one bid at a time. */

const TICK = 500;
const EPIC = EPIC_BUY_PARAMS;
const TEAMS = ["t01", "t04", "t05", "t08", "t17", "t18", "t20"];

const emptyModel = (): ValueModel => ({ rules: DEFAULT_VALUE_RULES, base: new Map(), meta: new Map(), pages: new Map(), sets: new Map() });

function tradeState(cash: number, held: HeldAsset[], mine: TradeOffer[]): TradeState {
  return {
    tick: TICK,
    myId: "t02",
    cash,
    held,
    pageSets: [],
    board: [],
    mine,
    toMe: [],
    settlements: [],
    limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 },
    spent: 0,
    reserved: new Set(),
    model: emptyModel(),
  } as unknown as TradeState;
}

const holder = (id: string): RivalTeam => ({ team: id, seen: [{ assetId: 9000 + Number(id.slice(1)), ref: EPIC.ref, tick: TICK - 5, source: "board" as never }], distinct: 1, spares: [], pages: [], wants: [] });

const rivals = (holders: string[]): RivalsState => ({ teams: holders.map(holder), byRef: { [EPIC.ref]: { holders, wantedBy: [] } }, seenAssets: holders.length, lastEventId: 0 });

const bid = (id: number, to: string, price: number, age: number): TradeOffer => ({ id, to, venue: "rastro", status: "open", give: { cash: price }, want: { cards: [EPIC.ref] }, created_tick: TICK - age, expires_tick: TICK - age + EPIC.expiresInTicks });

const arb = {
  cash: fc.integer({ min: 0, max: 1200 }),
  holders: fc.subarray(TEAMS),
  value: fc.option(fc.integer({ min: 0, max: 400 }), { nil: undefined }),
  held: fc.boolean(),
  bids: fc.array(fc.record({ to: fc.constantFrom(...TEAMS), price: fc.integer({ min: 1, max: 400 }), age: fc.integer({ min: 0, max: 30 }) }), { maxLength: 3 }),
  reprices: fc.integer({ min: 0, max: 3 }),
  committed: fc.integer({ min: 0, max: 300 }),
};

describe("rival buy · epic test lane", () => {
  it("steps go start → midpoint → ceiling and never pass the ceiling", () => {
    expect([0, 1, 2, 3, 9].map((n) => epicStep(EPIC, n))).toEqual([EPIC.start, Math.round((EPIC.start + EPIC.ceiling) / 2), EPIC.ceiling, EPIC.ceiling, EPIC.ceiling]);
  });

  it("every epic post is ≤ ceiling, to a listed holder, leaves cash ≥ floor, and at most one is open", () => {
    fc.assert(
      fc.property(arb.cash, arb.holders, arb.value, arb.held, arb.bids, arb.reprices, arb.committed, (cash, holders, value, held, bids, reprices, committed) => {
        const mine = bids.map((b, k) => bid(1000 + k, b.to, b.price, b.age));
        const memo: RivalBuyMemo = new Map(bids.map((b) => [`${b.to}:${EPIC.ref}`, { reprices }]));
        const input: RivalBuyInput = {
          tick: TICK,
          trade: tradeState(cash, held ? [{ id: 1, ref: EPIC.ref, value: 10, locked: false } as HeldAsset] : [], mine),
          tradePlan: { committedAfter: committed } as never,
          rivals: rivals(holders),
          maxSpend: 1000,
          cashFloor: 20,
          epic: EPIC,
          ...(value !== undefined ? { apiValues: new Map([[EPIC.ref, value]]) } : {}),
        };
        const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, memo, []);
        const epicPosts = plan.posts.filter((p) => p.ref === EPIC.ref);
        const cancelled = new Set(plan.cancels.map((c) => c.offerId));
        // Expired bids are gone server-side: only the ones still open count.
        const kept = mine.filter((o) => !cancelled.has(o.id) && (o.expires_tick ?? Infinity) > TICK);
        for (const p of epicPosts) {
          expect(p.price).toBeLessThanOrEqual(EPIC.ceiling);
          expect(p.price).toBeGreaterThanOrEqual(1);
          expect(EPIC.teams).toContain(p.team);
          expect(p.body.to).toBe(p.team);
          expect(p.body.give).toEqual({ cash: p.price });
          expect(p.body.want).toEqual({ cards: [EPIC.ref] });
          expect(cash - committed - p.price - tradeFee(p.price, 1, MAKER_FEES)).toBeGreaterThanOrEqual(EPIC.cashFloor);
        }
        // Inside --max-spend, fee included (coordinator, 4 Oct: RET-11 filled at 240 + 13 > 250).
        const tight = proposeRivalBuy({ ...input, maxSpend: 200 }, RIVAL_BUY_PARAMS, new Map(memo), []);
        for (const p of tight.plan.posts.filter((x) => x.ref === EPIC.ref)) expect(p.price + tradeFee(p.price, 1, MAKER_FEES)).toBeLessThanOrEqual(200);
        // One epic bid at a time, counting the ones that stay open.
        expect(epicPosts.length + kept.length).toBeLessThanOrEqual(1);
        // Kept bids are within the rules too: listed team, at or below the ceiling.
        for (const o of kept) {
          expect(EPIC.teams).toContain(o.to);
          expect(o.give!.cash!).toBeLessThanOrEqual(EPIC.ceiling);
        }
        // Holding the card, or a value below the ceiling, or no value: nothing new goes out.
        if (held || value === undefined || value < EPIC.ceiling) expect(epicPosts).toHaveLength(0);
      }),
      { numRuns: 400 },
    );
  });

  it("a listed holder seen with the card gets the start price when nothing is open", () => {
    const input: RivalBuyInput = { tick: TICK, trade: tradeState(600, [], []), rivals: rivals(["t08"]), maxSpend: 1000, cashFloor: 20, epic: EPIC, apiValues: new Map([[EPIC.ref, 234]]) };
    const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, new Map(), []);
    expect(plan.posts.map((p) => [p.team, p.price])).toEqual([["t08", EPIC.start]]);
  });

  it("several lanes: each post ≤ its ceiling, to its listed holders, one open per card, and all of them together leave cash ≥ floor", () => {
    const [a, b] = EPIC_BUY_LANES as [typeof EPIC, typeof EPIC];
    const lanes = [a, b];
    const laneBids = fc.array(fc.record({ lane: fc.constantFrom(0, 1), to: fc.constantFrom(...TEAMS), price: fc.integer({ min: 1, max: 400 }), age: fc.integer({ min: 0, max: 30 }) }), { maxLength: 4 });
    fc.assert(
      fc.property(arb.cash, fc.subarray(TEAMS), fc.subarray(TEAMS), laneBids, arb.reprices, arb.committed, (cash, ha, hb, bids, reprices, committed) => {
        // An open lane's bids carry no `to`.
        const mine = bids.map((x, k) => {
          const o: TradeOffer = { ...bid(2000 + k, x.to, x.price, x.age), want: { cards: [lanes[x.lane]!.ref] } };
          if (lanes[x.lane]!.open) delete o.to;
          return o;
        });
        const memo: RivalBuyMemo = new Map(bids.map((x) => [`${x.to}:${lanes[x.lane]!.ref}`, { reprices }]));
        const team = (id: string): RivalTeam => ({ team: id, seen: [...(ha.includes(id) ? [a.ref] : []), ...(hb.includes(id) ? [b.ref] : [])].map((ref, k) => ({ assetId: 9000 + Number(id.slice(1)) * 10 + k, ref, tick: TICK - 5, source: "board" as never })), distinct: 1, spares: [], pages: [], wants: [] });
        const ids = [...new Set([...ha, ...hb])];
        const input: RivalBuyInput = {
          tick: TICK,
          trade: tradeState(cash, [], mine),
          tradePlan: { committedAfter: committed } as never,
          rivals: { teams: ids.map(team), byRef: { [a.ref]: { holders: ha, wantedBy: [] }, [b.ref]: { holders: hb, wantedBy: [] } }, seenAssets: ids.length, lastEventId: 0 },
          maxSpend: 1000,
          cashFloor: 20,
          epic: EPIC_BUY_LANES,
          apiValues: new Map([[a.ref, 234], [b.ref, 288]]),
        };
        const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, memo, []);
        const cancelled = new Set(plan.cancels.map((c) => c.offerId));
        const kept = mine.filter((o) => !cancelled.has(o.id) && (o.expires_tick ?? Infinity) > TICK);
        for (const lane of lanes) {
          const posts = plan.posts.filter((p) => p.ref === lane.ref);
          for (const p of posts) {
            expect(p.price).toBeLessThanOrEqual(lane.ceiling);
            if (lane.open) expect(p.body.to).toBeUndefined();
            else expect(lane.teams).toContain(p.team);
            expect(p.body.want).toEqual({ cards: [lane.ref] });
          }
          expect(posts.length + kept.filter((o) => (o.want as { cards: string[] }).cards[0] === lane.ref).length).toBeLessThanOrEqual(1);
        }
        // Open bids hold no cash server side: every new epic post counts the bids of every lane that stay open.
        if (plan.posts.length) {
          const open = [...plan.posts.map((p) => p.price + tradeFee(p.price, 1, MAKER_FEES)), ...kept.map((o) => o.give!.cash!)].reduce((s, x) => s + x, 0);
          expect(cash - committed - open).toBeGreaterThanOrEqual(EPIC.cashFloor);
        }
      }),
      { numRuns: 400 },
    );
  });

  it("a holder that did not fill at the ceiling is not bid again in the same tick: the next listed holder gets the start price", () => {
    const at = bid(3000, "t18", EPIC.ceiling, EPIC.repriceAfterTicks);
    const input: RivalBuyInput = { tick: TICK, trade: tradeState(600, [], [at]), rivals: rivals(["t18", "t08"]), maxSpend: 1000, cashFloor: 20, epic: EPIC, apiValues: new Map([[EPIC.ref, 234]]) };
    const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, new Map([[`t18:${EPIC.ref}`, { reprices: EPIC.maxReprices }]]), []);
    expect(plan.cancels.map((c) => c.offerId)).toEqual([3000]);
    expect(plan.posts.map((p) => [p.team, p.price])).toEqual([["t08", EPIC.start]]);
  });

  it("open lane: one bid to anyone at the ceiling, never above it, and El Rastro leaves it alone", () => {
    const lane = EPIC_BUY_LANES.find((l) => l.open)!;
    const input: RivalBuyInput = { tick: TICK, trade: tradeState(600, [], []), rivals: rivals([]), maxSpend: 1000, cashFloor: 20, epic: EPIC_BUY_LANES, apiValues: new Map([[EPIC.ref, 234], [lane.ref, 288]]) };
    const { plan } = proposeRivalBuy(input, RIVAL_BUY_PARAMS, new Map(), []);
    const posts = plan.posts.filter((p) => p.ref === lane.ref);
    expect(posts.map((p) => [p.price, p.body.to])).toEqual([[lane.ceiling, undefined]]);
    // Kept while open; one above the ceiling is cancelled.
    const open = (id: number, price: number): TradeOffer => ({ id, venue: "rastro", status: "open", give: { cash: price }, want: { cards: [lane.ref] }, created_tick: TICK - 1, expires_tick: TICK + 30 });
    const again = proposeRivalBuy({ ...input, trade: tradeState(600, [], [open(5000, lane.ceiling)]) }, RIVAL_BUY_PARAMS, new Map(), []);
    expect(again.plan.posts.filter((p) => p.ref === lane.ref)).toHaveLength(0);
    expect(again.plan.cancels).toHaveLength(0);
    const over = proposeRivalBuy({ ...input, trade: tradeState(600, [], [open(5001, lane.ceiling + 1)]) }, RIVAL_BUY_PARAMS, new Map(), []);
    expect(over.plan.cancels.map((c) => c.offerId)).toContain(5001);
    // El Rastro (no passive bids) does not cancel the open lane's bid when its card is foreign to it.
    const st = { ...tradeState(600, [], [open(5000, lane.ceiling)]), foreignBidRefs: new Set([lane.ref]), pageSets: [], board: [] } as TradeState;
    const tp = planTick(st, DEFAULT_TRADE_PARAMS);
    expect(tp.cancels.map((c) => c.id)).not.toContain(5000);
    // Without the exemption El Rastro would cancel it (no passive bids): the check above is not vacuous.
    const { foreignBidRefs: _, ...plain } = st;
    expect(planTick(plain as TradeState, DEFAULT_TRADE_PARAMS).cancels.map((c) => c.id)).toContain(5000);
  });
});
