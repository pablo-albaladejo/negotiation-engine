import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { assessRivalPage, proposeRivalPage, RIVAL_PAGE_PARAMS, type RivalPageInput, type RivalPageMemo } from "../src/markets/rival-page.js";
import type { RivalsState, RivalTeam } from "../src/state/rivals.js";
import { DEFAULT_TRADE_PARAMS, DEFAULT_VALUE_RULES, MAKER_FEES, planTick, tradeFee, type HeldAsset, type TradeOffer, type TradeState, type ValueModel } from "../src/trades/trades.js";

/** Rival-page guardrails: the floor holds, protected assets and pages never go, stale or impossible data posts nothing. */

const TICK = 100;
const SETS = ["RET", "AAA", "BBB", "CCC", "DDD", "EEE"];
const page = (set: string) => Array.from({ length: 10 }, (_, k) => `${set}-${String(k + 1).padStart(2, "0")}`);

function model(book: number, mult: number): ValueModel {
  const m: ValueModel = { rules: DEFAULT_VALUE_RULES, base: new Map(), meta: new Map(), pages: new Map(), sets: new Map() };
  for (const s of SETS) {
    m.pages.set(s, page(s));
    m.sets.set(s, page(s));
    for (const r of page(s)) {
      m.meta.set(r, { ref: r, set: s, rarity: "common", book });
      m.base.set(r, book * mult);
    }
  }
  return m;
}

const held = (id: number, ref: string, locked = false): HeldAsset => ({ id, ref, value: 10, locked });

function tradeState(over: Partial<TradeState> & { model: ValueModel }): TradeState {
  return {
    tick: TICK,
    myId: "t02",
    cash: 500,
    // Two copies: rival-page never sells our last free copy of a card.
    held: [held(100, "RET-07"), held(101, "RET-07")],
    pageSets: ["RET"],
    board: [],
    mine: [],
    toMe: [],
    settlements: [],
    limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 },
    spent: 0,
    reserved: new Set(),
    ...over,
  };
}

function team(id: string, o: { albumFilled: number; pagesComplete: number; rank?: number; boardTick?: number; wants?: string[] }): RivalTeam {
  return {
    team: id,
    seen: [],
    distinct: 9,
    spares: [],
    board: { tick: o.boardTick ?? TICK, albumFilled: o.albumFilled, pagesComplete: o.pagesComplete, ...(o.rank !== undefined ? { rank: o.rank } : {}) },
    unseen: Math.max(0, o.albumFilled - 9),
    pages: [{ set: "RET", have: 9, of: 10, missing: ["RET-07"] }],
    wants: (o.wants ?? []).map((ref) => ({ ref, tick: TICK - 1 })),
  };
}

const rivals = (...teams: RivalTeam[]): RivalsState => ({ teams, byRef: {}, seenAssets: 0, lastEventId: 0 });

const input = (trade: TradeState, r: RivalsState | undefined, over: Partial<RivalPageInput> = {}): RivalPageInput => ({ tick: TICK, trade, rivals: r, pageTargets: ["SAL-09"], cashFloor: 20, ...over });

const posts = (i: RivalPageInput, memo: RivalPageMemo = new Map()) => proposeRivalPage(i, RIVAL_PAGE_PARAMS, memo).intents.filter((x) => x.kind === "listing");

const arb = {
  book: fc.integer({ min: 4, max: 60 }),
  mult: fc.double({ min: 0.3, max: 3, noNaN: true }),
  rank: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
  albumFilled: fc.integer({ min: 9, max: 80 }),
  pagesComplete: fc.integer({ min: 0, max: 4 }),
  wants: fc.subarray(["RET-07", "RET-02", "AAA-01"]),
};

describe("rival page", () => {
  it("ask ≥ floor and the sale nets at least minMargin after the fee we pay (none as maker)", () => {
    fc.assert(
      fc.property(arb.book, arb.mult, arb.rank, arb.albumFilled, arb.pagesComplete, arb.wants, (book, mult, rank, albumFilled, pagesComplete, wants) => {
        const m = model(book, mult);
        const t = team("t18", { albumFilled, pagesComplete, wants, ...(rank !== undefined ? { rank } : {}) });
        const i = input(tradeState({ model: m }), rivals(t));
        const a = assessRivalPage(t, "RET-07", i);
        for (const p of posts(i)) {
          expect(a.ok).toBe(true);
          if (!a.ok) return;
          expect(p.price).toBe(a.p.ask);
          expect(a.p.ask).toBeGreaterThanOrEqual(a.p.floor);
          expect(a.p.ask).toBeLessThanOrEqual(a.p.theirValue);
          expect(a.p.ask - tradeFee(a.p.ask, 1, MAKER_FEES) - (a.p.cost + a.p.option + a.p.rankPen)).toBeGreaterThanOrEqual(2 - 1e-9);
        }
      }),
    );
  });

  it("never lists from a page-target set, a page we nearly have, our last free copy, or a locked, reserved or busy asset", () => {
    fc.assert(
      fc.property(fc.constantFrom("target", "have", "locked", "reserved", "busy", "trades", "last"), arb.book, arb.mult, (why, book, mult) => {
        const m = model(book, mult);
        const t = team("t18", { albumFilled: 40, pagesComplete: 1, wants: ["RET-07"] });
        const base = tradeState({ model: m, held: why === "last" ? [held(100, "RET-07")] : [held(100, "RET-07", why === "locked"), held(101, "RET-07", why === "locked")] });
        const trade: TradeState =
          why === "have"
            ? { ...base, held: [held(100, "RET-07"), ...page("RET").slice(0, 6).map((r, k) => held(200 + k, r))] }
            : why === "reserved"
              ? { ...base, reserved: new Set([100]) }
              : why === "busy"
                ? { ...base, mine: [{ id: 9, maker: "t02", venue: "rastro", status: "open", give: { assets: [100] }, want: { cash: 99 } }] }
                : base;
        const tradePlan = why === "trades" ? ({ posts: [{ key: "list:100", kind: "list", ref: "RET-07", price: 50, value: 1, limit: 1, reference: undefined, why: "new", body: { venue: "rastro", give: { assets: [100] }, want: { cash: 50 }, expires_in_ticks: 40 } }] } as unknown as RivalPageInput["tradePlan"]) : undefined;
        const i = input(trade, rivals(t), { ...(why === "target" ? { pageTargets: ["RET-03"] } : {}), ...(tradePlan ? { tradePlan } : {}) });
        expect(posts(i)).toEqual([]);
      }),
    );
  });

  it("κ = 0 when the team's complete pages need more unseen cards than it has (t05 → skip)", () => {
    const m = model(20, 0.8);
    // 2 pages complete elsewhere need 20 unseen cards; only 6 are unseen.
    const t05 = team("t05", { albumFilled: 15, pagesComplete: 2, wants: ["RET-07"] });
    const i = input(tradeState({ model: m }), rivals(t05));
    const a = assessRivalPage(t05, "RET-07", i);
    expect(a.ok).toBe(false);
    expect(a.p?.kappa).toBe(0);
    expect(posts(i)).toEqual([]);
    const ok = team("t18", { albumFilled: 40, pagesComplete: 1, wants: ["RET-07"] });
    expect(posts(input(tradeState({ model: m }), rivals(ok))).length).toBe(1);
  });

  it("no listing when the rivals view is missing or its leaderboard row is stale", () => {
    fc.assert(
      fc.property(fc.integer({ min: RIVAL_PAGE_PARAMS.maxStaleTicks + 1, max: 500 }), (age) => {
        const m = model(20, 0.8);
        expect(proposeRivalPage(input(tradeState({ model: m }), undefined)).intents).toEqual([]);
        expect(proposeRivalPage(input(undefined as unknown as TradeState, rivals(team("t18", { albumFilled: 40, pagesComplete: 1 })))).intents).toEqual([]);
        const stale = team("t18", { albumFilled: 40, pagesComplete: 1, wants: ["RET-07"], boardTick: TICK - age });
        expect(posts(input(tradeState({ model: m }), rivals(stale)))).toEqual([]);
      }),
    );
  });

  it("reprices are monotone non-increasing and never below the floor", () => {
    fc.assert(
      fc.property(arb.book, arb.mult, fc.integer({ min: 0, max: 80 }), (book, mult, extra) => {
        const m = model(book, mult);
        const t = team("t18", { albumFilled: 40, pagesComplete: 1, wants: ["RET-07"] });
        const probe = assessRivalPage(t, "RET-07", input(tradeState({ model: m }), rivals(t)));
        const floor = probe.p?.floor;
        if (floor === undefined) return;
        const memo: RivalPageMemo = new Map();
        let price = floor + extra;
        for (let n = 0; n < 4; n++) {
          const mine: TradeOffer[] = [{ id: 50 + n, maker: "t02", to: "t18", venue: "rastro", status: "open", give: { assets: [{ id: 100, ref: "RET-07" }] }, want: { cash: price }, created_tick: TICK - RIVAL_PAGE_PARAMS.repriceAfterTicks, expires_tick: TICK + 10 }];
          const out = posts(input(tradeState({ model: m, mine }), rivals(t)), memo);
          if (!out.length) break;
          const next = out[0]!.price!;
          expect(next).toBeLessThanOrEqual(price);
          expect(next).toBeGreaterThanOrEqual(floor);
          memo.set("t18:RET-07", { reprices: n + 1, pagesComplete: 1 });
          price = next;
        }
      }),
    );
  });

  it("planTick never cancels one of our directed offers (`to` set)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), fc.integer({ min: 1, max: 3 }), (price, copies) => {
        const m = model(20, 0.8);
        const assets = Array.from({ length: copies }, (_, k) => held(100 + k, "RET-07"));
        const directed: TradeOffer = { id: 77, maker: "t02", to: "t18", venue: "rastro", status: "open", give: { assets: [{ id: 100, ref: "RET-07" }] }, want: { cash: price }, created_tick: TICK - 30, expires_tick: TICK + 5 };
        const plan = planTick(tradeState({ model: m, held: assets, mine: [directed] }), DEFAULT_TRADE_PARAMS);
        expect(plan.cancels.map((c) => c.id)).not.toContain(77);
        expect(plan.posts.some((p) => "assets" in p.body.give && p.body.give.assets.includes(100))).toBe(false);
      }),
    );
  });
});
