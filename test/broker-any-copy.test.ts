import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseBrokerBook, planAnyCopy, planPublic, venueFee, type BrokerBook } from "../src/broker/broker.js";

const REFS = ["LAV-03", "LAV-09", "SAL-07"];

// Raw `/api/broker/book` with real offer shapes: sales give one asset {id, kind, ref, serial}; bids give cash for any copy
// (`want.cards`) or for one exact asset (`want.assets`). Asset ids repeat on purpose (one asset listed in two sales).
const rawBook = fc
  .record({
    feeBps: fc.integer({ min: 0, max: 1000 }),
    feePerCard: fc.integer({ min: 0, max: 5 }),
    sells: fc.array(fc.record({ maker: fc.integer({ min: 0, max: 3 }), ref: fc.integer({ min: 0, max: 2 }), asset: fc.integer({ min: 1, max: 8 }), ask: fc.integer({ min: 1, max: 100 }) }), { maxLength: 12 }),
    buys: fc.array(
      fc.record({ maker: fc.integer({ min: 0, max: 3 }), ref: fc.integer({ min: 0, max: 2 }), asset: fc.option(fc.integer({ min: 1, max: 8 })), bid: fc.integer({ min: 1, max: 120 }), cards: fc.boolean() }),
      { maxLength: 12 },
    ),
  })
  .map(({ feeBps, feePerCard, sells, buys }) => {
    // One asset id always carries the same card.
    const refOf = (asset: number) => REFS[asset % REFS.length];
    let id = 1;
    const offers = [
      ...sells.map((s) => ({ id: id++, maker: `m${s.maker}`, give: { cash: 0, assets: [{ id: s.asset, kind: "card", ref: refOf(s.asset), serial: s.asset }], types: [] }, want: { cash: s.ask, assets: [], types: [] } })),
      ...buys.map((b) => ({
        id: id++,
        maker: `m${b.maker}`,
        give: { cash: b.bid, assets: [], types: [] },
        want:
          b.asset !== null
            ? { cash: 0, assets: [{ id: b.asset, kind: "card", ref: refOf(b.asset) }], types: [] }
            : b.cards
              ? { cash: 0, assets: [], cards: [REFS[b.ref]] }
              : { cash: 0, assets: [], types: [`card:${REFS[b.ref]}`] },
      })),
    ];
    return { venue: "v04", fee_bps: feeBps, fee_per_card: feePerCard, offers, bench_offers: [] };
  });

function check(book: BrokerBook, matches: ReturnType<typeof planPublic>) {
  const sells = new Map(book.sells.map((s) => [s.id, s]));
  const buys = new Map(book.buys.map((b) => [b.id, b]));
  const seenOffers = new Set<string>();
  const seenAssets = new Set<string>();
  for (const m of matches) {
    const s = sells.get(m.sell)!;
    const b = buys.get(m.buy)!;
    expect(s && b).toBeTruthy();
    expect(s.card).toBe(b.card);
    if (b.asset !== undefined) expect(String(s.asset)).toBe(String(b.asset));
    expect(s.ask).toBeLessThanOrEqual(b.bid);
    expect(m.price).toBeGreaterThanOrEqual(s.ask);
    expect(m.price + venueFee(m.price, book.feeBps, book.feePerCard)).toBeLessThanOrEqual(b.bid);
    expect(s.maker).not.toBe(b.maker);
    for (const k of [`s${m.sell}`, `b${m.buy}`]) {
      expect(seenOffers.has(k)).toBe(false);
      seenOffers.add(k);
    }
    expect(seenAssets.has(String(s.asset))).toBe(false);
    seenAssets.add(String(s.asset));
  }
}

describe("broker any-copy matching", () => {
  it("never pairs different cards, never ask > bid, never reuses an offer or an asset", () => {
    fc.assert(
      fc.property(rawBook, fc.integer({ min: 0, max: 12 }), (raw, max) => {
        const book = parseBrokerBook(raw);
        expect(book.errors).toEqual([]);
        check(book, planAnyCopy(book));
        const pub = planPublic(book, max);
        expect(pub.length).toBeLessThanOrEqual(max);
        check(book, pub);
      }),
    );
  });

  it("pairs a want.cards bid with a sale of any serial of that card at the midpoint", () => {
    const book = parseBrokerBook({
      offers: [
        { id: 1, maker: "a", give: { cash: 0, assets: [{ id: 341, kind: "card", ref: "LAV-03", serial: 16 }] }, want: { cash: 10 } },
        { id: 2, maker: "b", give: { cash: 30 }, want: { cards: ["LAV-03"] } },
        { id: 3, maker: "c", give: { cash: 90 }, want: { cards: ["SAL-07"] } },
      ],
    });
    expect(planAnyCopy(book).map((m) => [m.sell, m.buy, m.price])).toEqual([[1, 2, 20]]);
  });
});
