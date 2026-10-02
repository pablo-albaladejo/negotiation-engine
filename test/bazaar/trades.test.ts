import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRADE_PARAMS,
  RASTRO_FEES,
  buildValueModel,
  countHoldings,
  evaluateOffer,
  maxBid,
  minAsk,
  pageRisk,
  parseMyOffers,
  parseOffers,
  parseSettlements,
  planTick,
  portfolioValue,
  priceReference,
  slowReprice,
  tradeFee,
  valueDelta,
  type HeldAsset,
  type TradeOffer,
  type TradeParams,
  type TradeState,
} from "../../src/bazaar/trades/trades.js";
import type { Catalog } from "../../src/bazaar/shared/schemas.js";

const RARITY: [string, number][] = [
  ["common", 10], ["common", 10], ["common", 10], ["common", 10], ["common", 10],
  ["uncommon", 25], ["uncommon", 25], ["uncommon", 25], ["rare", 70], ["rare", 70], ["epic", 180], ["legendary", 450],
];
const set = (id: string) => ({ id, cards: RARITY.map(([rarity, book], i) => ({ id: `${id}-${String(i + 1).padStart(2, "0")}`, rarity, book })) });
const CATALOG = { sets: [set("SAL"), set("LAT")], packs: [], values: { copy_marginals: [1, 0.25, 0.1], page_bonus: 0.25, master_bonus: 0.1 } } as unknown as Catalog;

/** SAL vale ×1,3 para nosotros (común 13, infrecuente 32,5); LAT ×0,7. */
const SAL = 1.3;
const LAT = 0.7;
let nextId = 1;
const asset = (ref: string, value: number): HeldAsset => ({ id: nextId++, ref, value, locked: false });

function holdings(): HeldAsset[] {
  nextId = 1;
  return [
    asset("SAL-01", 13),
    asset("SAL-02", 13),
    asset("SAL-07", 32.5 * 0.25),
    asset("SAL-07", 32.5 * 0.25),
    asset("SAL-10", 91),
    asset("LAT-01", 7),
  ];
}

function zero(sets: [string, number][]): Map<string, number> {
  const m = new Map<string, number>();
  for (const [s, mult] of sets) for (const [i, [, book]] of RARITY.entries()) m.set(`${s}-${String(i + 1).padStart(2, "0")}`, book * mult);
  return m;
}

function state(over: Partial<TradeState> = {}, held = holdings()): TradeState {
  const model = buildValueModel(CATALOG, held, zero([["SAL", SAL], ["LAT", LAT]]));
  return {
    tick: 100,
    myId: "t02",
    cash: 300,
    held,
    pageSets: ["SAL"],
    board: [],
    mine: [],
    toMe: [],
    settlements: [],
    model,
    limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 },
    spent: 0,
    reserved: new Set(),
    ...over,
  };
}

let offerId = 1000;
const ask = (ref: string, price: number, extra: Partial<TradeOffer> = {}): TradeOffer =>
  ({ id: offerId++, maker: "m1", to: null, venue: "rastro", thread: null, status: "open", give: { cash: 0, assets: [{ id: 900 + offerId, ref }], types: [] }, want: { cash: price, assets: [], types: [] }, expires_tick: 200, created_tick: 90, ...extra }) as TradeOffer;
const bid = (ref: string, price: number, extra: Partial<TradeOffer> = {}): TradeOffer =>
  ({ id: offerId++, maker: "m2", to: null, venue: "rastro", thread: null, status: "open", give: { cash: price, assets: [], types: [] }, want: { cash: 0, assets: [], types: [`card:${ref}`] }, expires_tick: 200, created_tick: 90, ...extra }) as TradeOffer;

const P: TradeParams = { ...DEFAULT_TRADE_PARAMS, maxSpend: 200 };

describe("fees", () => {
  it("El Rastro: 5 % + 1 P per card, rounded up (feed: 9 P → 2 P)", () => {
    expect(tradeFee(9, 1, RASTRO_FEES)).toBe(2);
    expect(tradeFee(20, 1, RASTRO_FEES)).toBe(2);
    expect(tradeFee(21, 1, RASTRO_FEES)).toBe(3);
    expect(tradeFee(0, 0, RASTRO_FEES)).toBe(0);
  });
  it("minAsk / maxBid leave exactly the margin after fees", () => {
    const a = minAsk(8.1, 2, RASTRO_FEES);
    expect(a - tradeFee(a, 1, RASTRO_FEES) - 8.1).toBeGreaterThanOrEqual(2);
    expect(a - 1 - tradeFee(a - 1, 1, RASTRO_FEES) - 8.1).toBeLessThan(2);
    const b = maxBid(32.5, 2, RASTRO_FEES);
    expect(32.5 - b - tradeFee(b, 1, RASTRO_FEES)).toBeGreaterThanOrEqual(2);
    expect(32.5 - (b + 1) - tradeFee(b + 1, 1, RASTRO_FEES)).toBeLessThan(2);
    expect(maxBid(3, 2, RASTRO_FEES)).toBe(0);
  });
});

describe("valuation at our private values", () => {
  it("derives bases from your_value: a duplicate's value is the last copy's marginal", () => {
    const s = state();
    expect(s.model.base.get("SAL-07")).toBeCloseTo(32.5);
    expect(s.model.base.get("SAL-01")).toBeCloseTo(13);
    expect(s.model.base.get("SAL-06")).toBeCloseTo(32.5);
  });
  it("duplicates are worth 0.25× and 0.1×; selling a duplicate loses only that", () => {
    const s = state();
    const c = countHoldings(s.held);
    expect(-valueDelta(c, ["SAL-07"], [], s.model)).toBeCloseTo(8.125);
    expect(valueDelta(c, [], ["SAL-07"], s.model)).toBeCloseTo(3.25);
    expect(valueDelta(c, [], ["SAL-03"], s.model)).toBeCloseTo(13);
  });
  it("completing a page adds the page bonus (and the card that completes it is worth more)", () => {
    const held = ["SAL-01", "SAL-02", "SAL-03", "SAL-04", "SAL-05", "SAL-06", "SAL-07", "SAL-08", "SAL-09"].map((r, i) => ({ id: i + 1, ref: r, value: (RARITY[i]?.[1] ?? 0) * SAL, locked: false }));
    const s = state({}, held);
    const c = countHoldings(held);
    const pageSum = [10, 10, 10, 10, 10, 25, 25, 25, 70, 70].reduce((a, b) => a + b, 0) * SAL;
    expect(valueDelta(c, [], ["SAL-10"], s.model)).toBeCloseTo(70 * SAL + 0.25 * pageSum);
    expect(portfolioValue(c, s.model)).toBeCloseTo((pageSum - 70 * SAL));
  });
  it("API value of a page-completing card is not double counted (base from the set multiplier)", () => {
    const held = ["SAL-01", "SAL-02", "SAL-03", "SAL-04", "SAL-05", "SAL-06", "SAL-07", "SAL-08", "SAL-09"].map((r, i) => ({ id: i + 1, ref: r, value: (RARITY[i]?.[1] ?? 0) * SAL, locked: false }));
    const model = buildValueModel(CATALOG, held, new Map([["SAL-10", 200]]));
    expect(model.base.get("SAL-10")).toBeCloseTo(91);
  });
  it("pageRisk protects our only copy on a near-complete page", () => {
    const held = ["SAL-01", "SAL-02", "SAL-03", "SAL-04", "SAL-05", "SAL-06", "SAL-07", "SAL-08"].map((r, i) => ({ id: i + 1, ref: r, value: (RARITY[i]?.[1] ?? 0) * SAL, locked: false }));
    const s = state({}, held);
    const c = countHoldings(held);
    expect(pageRisk(c, ["SAL-01"], s.model, 8)).toBeGreaterThan(30);
    expect(pageRisk(c, ["SAL-01"], s.model, 9)).toBe(0);
    expect(pageRisk(countHoldings([...held, { id: 99, ref: "SAL-01", value: 3, locked: false }]), ["SAL-01"], s.model, 8)).toBe(0);
  });
});

describe("parsing (structure only)", () => {
  it("reads {offers} and {open, queued, to_me}", () => {
    const o = bid("SAL-07", 18, { maker: "t02" });
    const t = bid("SAL-07", 18, { to: "t02", maker: "t09" });
    expect(parseMyOffers({ offers: [o, t] }, "t02")).toEqual({ mine: [o], toMe: [t] });
    expect(parseMyOffers({ open: [o], queued: [], to_me: [t] }, "t02").toMe).toEqual([t]);
    expect(parseOffers({ offers: [{ junk: true }, o] })).toEqual([o]);
  });
  it("settlements: only single-card team trades on a venue", () => {
    const ev = (venue: string | null, persona: string | null, items: number, price: number) => ({ type: "settlement", payload: { venue, persona, price, items: Array.from({ length: items }, () => ({ ref: "LAV-04", rarity: "common" })) } });
    const s = parseSettlements({ events: [ev("rastro", null, 1, 9), ev(null, "abuela", 1, 6), ev("rastro", null, 2, 30), { type: "thread.message" }] });
    expect(s).toEqual([{ ref: "LAV-04", rarity: "common", price: 9 }]);
  });
  it("price reference: settled card > settled rarity > asks > book", () => {
    const s = state();
    const settled = [{ ref: "LAT-02", rarity: "common", price: 9 }, { ref: "LAT-03", rarity: "common", price: 10 }];
    expect(priceReference("SAL-03", s.model, settled, [])?.price).toBe(9.5);
    expect(priceReference("LAT-02", s.model, settled, [])?.price).toBe(9);
    expect(priceReference("SAL-07", s.model, settled, [{ ref: "SAL-06", rarity: "uncommon", price: 24 }])?.source).toMatch(/asks uncommon/);
    expect(priceReference("SAL-07", s.model, [], [])).toEqual({ price: 25, source: "book" });
  });
});

describe("accept decisions", () => {
  it("sells a duplicate into a bid when cash − our loss − fee clears the margin", () => {
    const s = state({ board: [bid("SAL-07", 18)] });
    const e = evaluateOffer(s.board[0]!, "board", s, P, new Set());
    expect(e.kind).toBe("sell");
    expect(e.valueCreated).toBeCloseTo(18 - 8.125 - 2);
    expect(e.ok).toBe(true);
    expect(e.payAssets).toEqual([4]);
  });
  it("refuses to sell our only copy cheaply and refuses offers we cannot fill", () => {
    const s = state({ board: [bid("SAL-10", 80), bid("SAL-09", 50)] });
    expect(evaluateOffer(s.board[0]!, "board", s, P, new Set()).reason).toBe("below-margin");
    expect(evaluateOffer(s.board[1]!, "board", s, P, new Set()).reason).toBe("missing-card");
  });
  it("buys a missing page card below our value net of fees; not a duplicate at the same price", () => {
    const s = state({ board: [ask("SAL-08", 25), ask("SAL-07", 25)] });
    const [good, dup] = s.board.map((o) => evaluateOffer(o, "board", s, P, new Set()));
    expect(good!.valueCreated).toBeCloseTo(32.5 - 25 - 3);
    expect(good!.ok).toBe(true);
    expect(dup!.ok).toBe(false);
  });
  it("ignores own, expired, addressed-to-other, dealer-thread and generic-type offers", () => {
    const s = state();
    const mine = new Set([1]);
    expect(evaluateOffer(bid("SAL-07", 18, { id: 1 }), "board", s, P, mine).reason).toBe("own");
    expect(evaluateOffer(bid("SAL-07", 18, { expires_tick: 100 }), "board", s, P, mine).reason).toBe("expired");
    expect(evaluateOffer(bid("SAL-07", 18, { to: "t09" }), "board", s, P, mine).reason).toBe("addressed-to-other");
    expect(evaluateOffer(bid("SAL-07", 18, { venue: null, thread: 5 }), "board", s, P, mine).reason).toBe("not-a-venue-offer");
    expect(evaluateOffer({ ...bid("SAL-07", 18), want: { cash: 0, types: ["rarity:rare"] } } as TradeOffer, "board", s, P, mine).reason).toBe("unsupported");
  });
  it("one accept per tick: the best value that fits the budget", () => {
    const s = state({ board: [ask("SAL-08", 25), bid("SAL-07", 30), ask("SAL-06", 20)] });
    const plan = planTick(s, P);
    expect(plan.accept?.offer.id).toBe(s.board[1]!.id);
    expect(planTick({ ...s, limits: { ...s.limits, acceptsPerTick: 0 } }, P).accept).toBeUndefined();
  });
  it("a buy that does not fit --max-spend is not accepted", () => {
    const s = state({ board: [ask("SAL-08", 25)] });
    expect(planTick(s, { ...P, maxSpend: 20 }).accept).toBeUndefined();
    expect(planTick({ ...s, spent: 190 }, P).accept).toBeUndefined();
  });
});

describe("listings and bids", () => {
  it("lists the spare duplicate above the reference, never below value + fees", () => {
    const s = state({ settlements: [{ ref: "SAL-06", rarity: "uncommon", price: 20 }] });
    const plan = planTick(s, { ...P, maxBids: 0 });
    const l = plan.posts.filter((p) => p.kind === "list");
    expect(l).toHaveLength(1);
    expect(l[0]!.ref).toBe("SAL-07");
    expect(l[0]!.price).toBe(21);
    expect(l[0]!.body).toEqual({ venue: "rastro", give: { assets: [4] }, want: { cash: 21 }, expires_in_ticks: 40 });
    const cheap = planTick({ ...s, settlements: [{ ref: "SAL-07", rarity: "uncommon", price: 3 }] }, { ...P, maxBids: 0 }).posts[0]!;
    expect(cheap.price).toBe(cheap.limit);
    expect(cheap.price - tradeFee(cheap.price, 1, RASTRO_FEES) - 8.125).toBeGreaterThanOrEqual(2);
  });
  it("bids for missing page cards at most value − fees, outbidding the best bid by 1", () => {
    const s = state({ board: [bid("SAL-06", 20), bid("SAL-09", 200)] });
    const bids = planTick(s, P).posts.filter((p) => p.kind === "bid");
    const s6 = bids.find((b) => b.ref === "SAL-06")!;
    expect(s6.price).toBe(21);
    const s9 = bids.find((b) => b.ref === "SAL-09");
    if (s9) expect(s9.price).toBe(maxBid(91, 2, RASTRO_FEES));
    for (const b of bids) expect((s.model.base.get(b.ref) ?? 0) - b.price - tradeFee(b.price, 1, RASTRO_FEES)).toBeGreaterThanOrEqual(2);
  });
  it("respects --max-offers, --max-bids, --max-spend and the per-tick limit", () => {
    const s = state();
    const capped = planTick(s, { ...P, maxOffers: 2 });
    expect(capped.posts.length).toBeLessThanOrEqual(2);
    expect(planTick(s, { ...P, maxBids: 1 }).posts.filter((p) => p.kind === "bid")).toHaveLength(1);
    const spend = planTick(s, { ...P, maxSpend: 30 });
    const committed = spend.posts.filter((p) => p.kind === "bid").reduce((a, p) => a + p.price + tradeFee(p.price, 1, RASTRO_FEES), 0);
    expect(committed).toBeLessThanOrEqual(30);
    expect(planTick({ ...s, limits: { ...s.limits, offersPerTick: 1 } }, P).posts).toHaveLength(1);
    expect(planTick({ ...s, limits: { ...s.limits, maxOpenOffers: 0 } }, P).posts).toHaveLength(0);
  });
  it("keeps fresh offers, re-prices old ones slowly, fixes unsafe ones at once, cancels invalid ones", () => {
    expect(slowReprice(30, 20, 0.05)).toBe(28);
    expect(slowReprice(10, 11, 0.05)).toBe(11);
    const s0 = state({ settlements: [{ ref: "SAL-07", rarity: "uncommon", price: 20 }] });
    const listing = (price: number, created: number) => ({ ...ask("SAL-07", price, { maker: "t02", created_tick: created }), give: { cash: 0, assets: [{ id: 4, ref: "SAL-07" }], types: [] } }) as TradeOffer;
    const fresh = listing(30, 95);
    const p1 = planTick({ ...s0, mine: [fresh] }, { ...P, maxBids: 0 });
    expect(p1.cancels).toEqual([]);
    expect(p1.posts).toEqual([]);
    const old = listing(30, 80);
    const p2 = planTick({ ...s0, mine: [old] }, { ...P, maxBids: 0 });
    expect(p2.cancels.map((c) => c.id)).toEqual([old.id]);
    expect(p2.posts[0]).toMatchObject({ price: 28, why: "reprice", replaces: old.id });
    const unsafe = listing(5, 99);
    expect(planTick({ ...s0, mine: [unsafe] }, { ...P, maxBids: 0 }).posts[0]).toMatchObject({ why: "safety" });
    const ownedBid = bid("SAL-01", 5, { maker: "t02" });
    expect(planTick({ ...s0, mine: [ownedBid] }, { ...P, maxBids: 0 }).cancels.map((c) => c.id)).toEqual([ownedBid.id]);
  });
  it("an accepted sale's asset is not listed again in the same tick", () => {
    const s = state({ board: [bid("SAL-07", 30)] });
    const plan = planTick(s, P);
    expect(plan.accept?.payAssets).toEqual([4]);
    expect(plan.posts.some((p) => p.kind === "list" && p.ref === "SAL-07")).toBe(false);
  });
});
