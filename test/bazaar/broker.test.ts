import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_BENCH_PARAMS,
  benchRun,
  bookStateKey,
  estimatedLimit,
  fairPrice,
  isUrgent,
  observeBench,
  parseBrokerBook,
  planBench,
  planPublic,
  temperOf,
  type QuoteTrack,
} from "../../src/bazaar/broker/broker.js";

const ask = (id: string, cash: number) => ({ id, give: { assets: [{ kind: "card", ref: "X" }] }, want: { cash } });
const bid = (id: string, cash: number) => ({ id, give: { cash }, want: { types: ["card:X"] } });
const sell = (id: number, maker: string, ref: string, cash: number) => ({ id, maker, give: { assets: [{ kind: "card", ref }], cash: 0 }, want: { cash, types: [] } });
const buy = (id: number, maker: string, ref: string, cash: number) => ({ id, maker, give: { assets: [], cash }, want: { cash: 0, types: [`card:${ref}`] } });

/** Máximo excedente posible entre cotizaciones (fuerza bruta sobre asignaciones). */
function bestSurplus(asks: number[], bids: number[]): number {
  let best = 0;
  const go = (i: number, used: boolean[], acc: number) => {
    best = Math.max(best, acc);
    if (i >= bids.length) return;
    go(i + 1, used, acc);
    asks.forEach((a, j) => {
      if (!used[j] && bids[i]! >= a) {
        used[j] = true;
        go(i + 1, used, acc + bids[i]! - a);
        used[j] = false;
      }
    });
  };
  go(0, asks.map(() => false), 0);
  return best;
}

describe("benchRun", () => {
  it("reads the run from bench ids and rejects other shapes", () => {
    expect(benchRun("b3-7")).toBe("b3");
    expect(benchRun("b12-0")).toBe("b12");
    expect(benchRun("b3")).toBeUndefined();
    expect(benchRun("123")).toBeUndefined();
    expect(benchRun("b3-x")).toBeUndefined();
  });
});

describe("fairPrice", () => {
  it("is the integer midpoint inside [ask, bid]", () => {
    expect(fairPrice(10, 20)).toBe(15);
    expect(fairPrice(10, 11)).toBe(10);
    expect(fairPrice(10, 10)).toBe(10);
    expect(fairPrice(11, 10)).toBeUndefined();
  });
  it("lowers the price until the buyer can also pay the fee", () => {
    expect(fairPrice(10, 20, (p) => Math.ceil(p * 0.1) + 1)).toBe(15);
    expect(fairPrice(10, 13, () => 3)).toBe(10);
    expect(fairPrice(10, 12, () => 3)).toBeUndefined();
  });
  it("never leaves [ask, bid] (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), fc.integer({ min: 0, max: 10_000 }), (a, d) => {
        const p = fairPrice(a, a + d)!;
        return Number.isInteger(p) && p >= a && p <= a + d;
      }),
    );
  });
});

describe("parseBrokerBook", () => {
  it("parses the live empty book", () => {
    const b = parseBrokerBook({ venue: "v04", status: "open", fee_bps: 0, fee_per_card: 0, offers: [], bench_offers: [], recent: [] });
    expect(b).toMatchObject({ venue: "v04", status: "open", feeBps: 0, bench: [], sells: [], buys: [], errors: [] });
  });
  it("splits bench asks and bids and logs bad shapes instead of throwing", () => {
    const b = parseBrokerBook({
      bench_offers: [ask("b1-0", 30), bid("b1-1", 40), { id: "weird" }, { id: "b1-2", give: {}, want: {} }, 7],
      offers: [sell(1, "m1", "LAV-03", 20), buy(2, "m2", "LAV-03", 25), { id: 3, give: { assets: [{ ref: "A" }, { ref: "B" }] }, want: { cash: 5 } }, { nope: 1 }],
    });
    expect(b.bench.map((x) => [x.id, x.run, x.side, x.quote])).toEqual([
      ["b1-0", "b1", "ask", 30],
      ["b1-1", "b1", "bid", 40],
    ]);
    expect(b.sells).toEqual([{ id: 1, maker: "m1", card: "card:LAV-03", ask: 20, index: 0 }]);
    expect(b.buys).toEqual([{ id: 2, maker: "m2", card: "card:LAV-03", bid: 25, index: 1 }]);
    expect(b.unsupported).toBe(1);
    expect(b.errors).toHaveLength(4);
    expect(parseBrokerBook(null).errors).toEqual(["book: not an object"]);
  });
});

describe("planBench", () => {
  it("pairs asks ascending against bids descending while bid >= ask, at the midpoint", () => {
    const book = parseBrokerBook({ bench_offers: [ask("b1-0", 30), ask("b1-1", 10), ask("b1-2", 50), bid("b1-3", 40), bid("b1-4", 60), bid("b1-5", 20)] });
    const { matches, held } = planBench(book);
    expect(held).toEqual([]);
    expect(matches.map((m) => [m.sell, m.buy, m.price, m.surplus])).toEqual([
      ["b1-1", "b1-4", 35, 50],
      ["b1-0", "b1-3", 35, 10],
    ]);
  });
  it("never pairs offers of different runs", () => {
    const book = parseBrokerBook({ bench_offers: [ask("b1-0", 10), bid("b2-0", 50)] });
    expect(planBench(book).matches).toEqual([]);
  });
  it("realises the maximum quote surplus and uses each offer once (property)", () => {
    const quotes = fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 5 });
    fc.assert(
      fc.property(quotes, quotes, (asks, bids) => {
        const book = parseBrokerBook({ bench_offers: [...asks.map((a, i) => ask(`b7-${i}`, a)), ...bids.map((b, i) => bid(`b7-${100 + i}`, b))] });
        const { matches } = planBench(book);
        const ids = matches.flatMap((m) => [m.sell, m.buy]);
        expect(new Set(ids).size).toBe(ids.length);
        for (const m of matches) expect(m.price >= m.ask && m.price <= m.bid).toBe(true);
        expect(matches.reduce((s, m) => s + m.surplus, 0)).toBe(bestSurplus(asks, bids));
      }),
    );
  });
  it("prefers the firm ask whose estimated limit is lower when quotes tie", () => {
    const tracks = new Map<string, QuoteTrack>();
    const t0 = parseBrokerBook({ bench_offers: [ask("b1-0", 30), ask("b1-1", 32), bid("b1-2", 31)] });
    observeBench(tracks, t0.bench, 1);
    const t1 = parseBrokerBook({ bench_offers: [ask("b1-0", 30), ask("b1-1", 30), bid("b1-2", 31)] });
    observeBench(tracks, t1.bench, 2);
    expect(temperOf(tracks.get("b1-0"))).toBe("firm");
    expect(temperOf(tracks.get("b1-1"))).toBe("relaxing");
    const { matches } = planBench(t1, tracks, 2);
    expect(matches.map((m) => m.sell)).toEqual(["b1-0"]);
    expect(matches[0]!.estSurplus).toBeGreaterThan(matches[0]!.surplus);
  });
  it("holds young patient pairs with holdTicks, but not urgent ones", () => {
    const params = { ...DEFAULT_BENCH_PARAMS, holdTicks: 2 };
    const tracks = new Map<string, QuoteTrack>();
    const b = parseBrokerBook({ bench_offers: [ask("b1-0", 10), bid("b1-1", 20)] });
    observeBench(tracks, b.bench, 5);
    expect(planBench(b, tracks, 5, params)).toMatchObject({ matches: [], held: [{ sell: "b1-0", buy: "b1-1" }] });
    const relaxed = parseBrokerBook({ bench_offers: [ask("b1-0", 9), bid("b1-1", 20)] });
    observeBench(tracks, relaxed.bench, 6);
    expect(isUrgent(tracks.get("b1-0"), 6, params)).toBe(true);
    expect(planBench(relaxed, tracks, 6, params).matches).toHaveLength(1);
  });
});

describe("patience tracking", () => {
  it("estimates limits beyond the quote and forgets offers that left", () => {
    const tracks = new Map<string, QuoteTrack>();
    observeBench(tracks, parseBrokerBook({ bench_offers: [bid("b1-0", 20), bid("b1-1", 50)] }).bench, 1);
    const b = parseBrokerBook({ bench_offers: [bid("b1-0", 24)] });
    observeBench(tracks, b.bench, 2);
    expect(tracks.has("b1-1")).toBe(false);
    expect(estimatedLimit(b.bench[0]!, tracks.get("b1-0"), DEFAULT_BENCH_PARAMS)).toBe(28);
    expect(isUrgent(tracks.get("b1-0"), 2, DEFAULT_BENCH_PARAMS)).toBe(true);
    observeBench(tracks, b.bench, 3);
    expect(temperOf(tracks.get("b1-0"))).toBe("settled");
    expect(isUrgent(tracks.get("b1-0"), 3 + DEFAULT_BENCH_PARAMS.maxAgeTicks, DEFAULT_BENCH_PARAMS)).toBe(true);
  });
});

describe("planPublic", () => {
  it("matches single-card sells with single-type bids of other makers, at most max per tick", () => {
    const book = parseBrokerBook({
      offers: [sell(1, "a", "LAV-03", 20), buy(2, "a", "LAV-03", 40), buy(3, "b", "LAV-03", 30), sell(4, "c", "MAL-01", 50), buy(5, "d", "MAL-01", 45), sell(6, "e", "LAV-03", 25), buy(7, "f", "LAT-02", 99)],
    });
    expect(planPublic(book).map((m) => [m.sell, m.buy, m.price])).toEqual([
      [6, 2, 32],
      [1, 3, 25],
    ]);
    const many = parseBrokerBook({ offers: Array.from({ length: 12 }, (_, i) => [sell(100 + i, "s", `C-${i}`, 10), buy(200 + i, "b", `C-${i}`, 10 + i)]).flat() });
    const top = planPublic(many);
    expect(top).toHaveLength(10);
    expect(Math.min(...top.map((m) => m.surplus))).toBe(2);
  });
  it("requires bid >= ask + fee and keeps price + fee within the bid", () => {
    const book = parseBrokerBook({ fee_bps: 500, fee_per_card: 1, offers: [sell(1, "a", "X", 20), buy(2, "b", "X", 21), sell(3, "a", "Y", 20), buy(4, "b", "Y", 30)] });
    const [m, ...rest] = planPublic(book);
    expect(rest).toEqual([]);
    expect(m).toMatchObject({ sell: 3, buy: 4 });
    expect(m!.price + Math.ceil(m!.price * 0.05) + 1).toBeLessThanOrEqual(30);
  });
});

describe("bookStateKey", () => {
  it("changes with the tick, ids and quotes only", () => {
    const a = parseBrokerBook({ bench_offers: [ask("b1-0", 10), bid("b1-1", 20)] });
    const b = parseBrokerBook({ bench_offers: [bid("b1-1", 20), ask("b1-0", 10)] });
    expect(bookStateKey(1, a)).toBe(bookStateKey(1, b));
    expect(bookStateKey(2, a)).not.toBe(bookStateKey(1, a));
    expect(bookStateKey(1, parseBrokerBook({ bench_offers: [ask("b1-0", 9), bid("b1-1", 20)] }))).not.toBe(bookStateKey(1, a));
  });
});
