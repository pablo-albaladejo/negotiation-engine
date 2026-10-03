import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { freeCounts, isLastFreeCopy, takesLastFreeCopy } from "../src/shared/last-copy.js";
import { acceptLockedIds, buildValueModel, DEFAULT_TRADE_PARAMS, planTick, type HeldAsset, type TradeOffer, type TradeState } from "../src/trades/trades.js";

/** Last-free-copy guardrail: no sale or payment leaves 0 free copies of a card (free = held − locked − reserved). */

const REFS = ["SAL-01", "SAL-02", "SAL-03"];
const CATALOG = { sets: [{ id: "SAL", released: true, cards: REFS.map((id) => ({ id, rarity: "common", book: 10 })) }], packs: [] } as never;
const copyArb = fc.record({ ref: fc.constantFrom(...REFS), locked: fc.boolean(), reserved: fc.boolean(), listed: fc.boolean(), value: fc.integer({ min: 1, max: 30 }) });

describe("last free copy", () => {
  it("the helper never allows giving away the last free copy, nor a copy that is not free", () => {
    fc.assert(
      fc.property(fc.array(copyArb, { maxLength: 10 }), fc.array(fc.integer({ min: 100, max: 112 }), { maxLength: 4 }), (copies, give) => {
        const held = copies.map((c, i) => ({ id: 100 + i, ref: c.ref }));
        const locked = new Set(held.filter((_, i) => copies[i]!.locked).map((a) => a.id));
        const reserved = new Set(held.filter((_, i) => copies[i]!.reserved).map((a) => a.id));
        const free = freeCounts(held, locked, reserved);
        if (!takesLastFreeCopy(give, held, locked, reserved)) {
          const ids = new Set(give);
          for (const id of ids) {
            const a = held.find((h) => h.id === id);
            expect(a).toBeDefined();
            expect(locked.has(id) || reserved.has(id)).toBe(false);
            const given = [...ids].filter((x) => held.find((h) => h.id === x)?.ref === a!.ref).length;
            expect((free.get(a!.ref) ?? 0) - given).toBeGreaterThanOrEqual(1);
          }
        }
        for (const a of held) {
          const n = free.get(a.ref) ?? 0;
          if (!locked.has(a.id) && !reserved.has(a.id)) expect(isLastFreeCopy(a.id, held, locked, reserved)).toBe(n <= 1);
          else expect(isLastFreeCopy(a.id, held, locked, reserved)).toBe(true);
        }
      }),
    );
  });

  it("the El Rastro accept never pays with the last free copy, and a free unlisted copy of what it gives stays", () => {
    const offerArb = fc.record({ ref: fc.constantFrom(...REFS), byAsset: fc.option(fc.integer({ min: 0, max: 7 }), { nil: undefined }), cash: fc.integer({ min: 0, max: 80 }) });
    fc.assert(
      fc.property(fc.array(copyArb, { minLength: 1, maxLength: 8 }), fc.array(offerArb, { minLength: 1, maxLength: 4 }), (copies, offers) => {
        const held: HeldAsset[] = copies.map((c, i) => ({ id: 100 + i, ref: c.ref, value: c.value, locked: c.locked || c.listed }));
        const reserved = new Set(held.filter((_, i) => copies[i]!.reserved).map((a) => a.id));
        const mine: TradeOffer[] = held
          .filter((_, i) => copies[i]!.listed)
          .map((a, k) => ({ id: 9000 + k, maker: "t02", venue: "rastro", thread: null, status: "open", give: { assets: [{ id: a.id, ref: a.ref }] }, want: { cash: 5 }, created_tick: 0 }));
        const board: TradeOffer[] = offers.map((o, k) => ({
          id: 5000 + k,
          maker: "t09",
          venue: k % 2 ? "rastro" : "v20",
          thread: null,
          status: "open",
          give: { cash: o.cash },
          want: o.byAsset !== undefined && held[o.byAsset] ? { assets: [{ id: held[o.byAsset]!.id, ref: held[o.byAsset]!.ref }] } : { types: [`card:${o.ref}`] },
        }));
        const state: TradeState = {
          tick: 50,
          myId: "t02",
          cash: 500,
          held,
          pageSets: ["SAL"],
          board,
          mine,
          toMe: [],
          settlements: [],
          model: buildValueModel(CATALOG, held, new Map()),
          limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 },
          spent: 0,
          reserved,
          venueFees: new Map([["v20", { bps: 0, perCard: 0 }]]),
        };
        const plan = planTick(state, DEFAULT_TRADE_PARAMS);
        const a = plan.accept;
        if (!a) return;
        const locked = acceptLockedIds(state);
        expect(takesLastFreeCopy(a.payAssets, held, locked, reserved)).toBe(false);
        // Our own listings still open after this tick (not cancelled) plus new posts: those copies may sell too.
        const cancelled = new Set(plan.cancels.map((c) => c.id));
        const listedAfter = new Set([
          ...mine.filter((o) => !cancelled.has(o.id)).map((o) => (o.give!.assets![0] as { id: number }).id),
          ...plan.posts.flatMap((p) => ("assets" in p.body.give ? p.body.give.assets : [])),
        ]);
        for (const ref of a.giveCards) {
          const kept = held.filter((h) => h.ref === ref && !a.payAssets.includes(h.id) && !locked.has(h.id) && !reserved.has(h.id) && !listedAfter.has(h.id));
          expect(kept.length).toBeGreaterThanOrEqual(1);
        }
      }),
    );
  });
});
