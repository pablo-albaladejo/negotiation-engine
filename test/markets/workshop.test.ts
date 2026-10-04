import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arbitrate, type Budget, type Intent } from "../../src/coordinator/coordinator.js";
import type { BazaarClient } from "../../src/shared/client.js";
import { buildWorkshop, executeWorkshop, nearPageDemand, proposeWorkshop, RARITY_LADDER } from "../../src/workshop/workshop.js";

const REFS = ["LAT-01", "LAT-02", "LAT-06", "LAT-07", "LAT-09", "SAL-01", "SAL-06", "SAL-09", "LAT-13"];
const rarityOf = (ref: string) => (ref === "LAT-13" ? "uncommon" : Number(ref.split("-")[1]) <= 5 ? "common" : Number(ref.split("-")[1]) <= 8 ? "uncommon" : "rare");

/** Random hand: copies per ref, and per copy where it is (free, our plain El Rastro ask, a thread, another venue). */
const hand = fc.array(fc.record({ ref: fc.constantFrom(...REFS), where: fc.constantFrom("free", "ask", "thread", "venue"), value: fc.double({ min: 0, max: 30, noNaN: true }) }), { maxLength: 24 });

function world(h: { ref: string; where: string; value: number }[]) {
  const assets = h.map((x, k) => ({ id: 100 + k, kind: "card", ref: x.ref, rarity: rarityOf(x.ref), your_value: x.value }));
  const offers = h.flatMap((x, k) =>
    x.where === "ask" ? [{ id: 900 + k, maker: "t02", status: "open", venue: "rastro", thread: null, to: null, give: { assets: [{ id: 100 + k }] }, want: { cash: 9 } }] : x.where === "venue" ? [{ id: 900 + k, maker: "t02", status: "open", venue: "v15", give: { assets: [{ id: 100 + k }] }, want: { cash: 9 } }] : [],
  );
  const threads = h.flatMap((x, k) => (x.where === "thread" ? [{ id: 500 + k, status: "open", with: "abuela", topic: { sell: { assets: [100 + k] } } }] : []));
  const prices = REFS.map((ref) => ({ ref, set: ref.slice(0, 3), rarity: rarityOf(ref), hidden: ref === "LAT-13", dealers: { sells: [], buys: [] }, byVenue: {}, holdings: 0, nextValue: 20, completesPage: false }));
  return { assets, offers, threads, prices };
}

describe("workshop guardrails", () => {
  it("never hands in a last free copy, a busy or hidden copy, a card with team demand, or mixes rarities", () => {
    fc.assert(
      fc.property(hand, (h) => {
        const w0 = world(h);
        const w = buildWorkshop({ assets: w0.assets, team: "t02", threads: w0.threads, myOffers: { offers: w0.offers }, prices: w0.prices, events: [] });
        // Duplicates go to teams first: a card we list on El Rastro or a venue keeps every copy out of the Workshop.
        const offeredRefs = new Set(h.filter((x) => x.where === "ask" || x.where === "venue").map((x) => x.ref));
        for (const r of w.rarities) {
          expect(r.pick.length === 0 || r.pick.length === 3).toBe(true);
          for (const id of r.pick) {
            const k = id - 100;
            expect(h[k]).toBeDefined();
            expect(rarityOf(h[k]!.ref)).toBe(r.rarity);
            expect(h[k]!.ref).not.toBe("LAT-13");
            expect(h[k]!.where).toBe("free");
            expect(offeredRefs.has(h[k]!.ref)).toBe(false);
          }
          // Every ref keeps one copy that is neither handed in nor busy in a thread or another venue.
          for (const ref of new Set(r.pick.map((id) => h[id - 100]!.ref))) {
            const kept = h.filter((x, k) => x.ref === ref && !r.pick.includes(100 + k) && x.where === "free");
            expect(kept.length).toBeGreaterThanOrEqual(1);
          }
          if (r.rarity === RARITY_LADDER[RARITY_LADDER.length - 1]) expect(r.decision).not.toBe("craft");
        }
        const p = proposeWorkshop(w);
        expect(proposeWorkshop(w, false).intents).toHaveLength(0);
        expect(p.intents.length).toBeLessThanOrEqual(1);
        for (const i of p.intents) expect(i.locks).toEqual(w.rarities.find((r) => r.rarity === w.best)!.pick.map((id) => `asset:${id}`));
      }),
    );
  });

  it("an intros pair or unreadable offers keep the copies out (fails closed)", () => {
    fc.assert(
      fc.property(hand, fc.constantFrom(...REFS), (h, introRef) => {
        const w0 = world(h);
        const base = { assets: w0.assets, team: "t02", threads: w0.threads, prices: w0.prices, events: [] };
        const w = buildWorkshop({ ...base, myOffers: { offers: w0.offers }, teamDemand: new Set([introRef]) });
        for (const r of w.rarities) for (const id of r.pick) expect(h[id - 100]!.ref).not.toBe(introRef);
        const unread = buildWorkshop({ ...base, myOffers: undefined });
        expect(unread.blocked).toBeDefined();
        expect(unread.rarities).toHaveLength(0);
        expect(proposeWorkshop(unread).intents).toHaveLength(0);
      }),
    );
  });

  it("never touches the API unless sending is on", async () => {
    await fc.assert(
      fc.asyncProperty(hand, async (h) => {
        const w0 = world(h);
        const w = buildWorkshop({ assets: w0.assets, team: "t02", threads: w0.threads, myOffers: { offers: w0.offers }, prices: w0.prices, events: [] });
        const intents = proposeWorkshop(w).intents;
        const client = new Proxy({}, { get: () => () => { throw new Error("API call in dry-run"); } }) as unknown as BazaarClient;
        const lines = await executeWorkshop(client, intents, w, false);
        for (const l of lines) expect(l.startsWith("workshop: would")).toBe(true);
      }),
    );
  });

  it("live: if a picked copy is busy, gone or its card gained team demand on the fresh read, nothing is cancelled or POSTed", async () => {
    await fc.assert(
      fc.asyncProperty(hand, fc.constantFrom("thread", "gone", "venue", "directed"), async (h, change) => {
        const w0 = world(h);
        const w = buildWorkshop({ assets: w0.assets, team: "t02", threads: w0.threads, myOffers: { offers: w0.offers }, prices: w0.prices, events: [] });
        const intents = proposeWorkshop(w).intents;
        const r = w.rarities.find((x) => x.rarity === w.best);
        if (!r) return;
        const victim = r.pick[0]!;
        // The fresh read: the first picked copy changed since the plan.
        const assets = change === "gone" ? w0.assets.filter((a) => a.id !== victim) : w0.assets;
        const threads = change === "thread" ? [...w0.threads, { id: 7777, status: "open", with: "chato", topic: { sell: { assets: [victim] } } }] : w0.threads;
        // "directed": another copy of the same card is now offered to a team (team demand), the picked one untouched.
        const twin = w0.assets.find((a) => a.ref === w0.assets.find((x) => x.id === victim)!.ref && !r.pick.includes(a.id))!;
        const offers =
          change === "venue"
            ? [...w0.offers, { id: 8888, maker: "t02", status: "open", venue: "v15", give: { assets: [{ id: victim }] }, want: { cash: 9 } }]
            : change === "directed"
              ? [...w0.offers, { id: 8889, maker: "t02", status: "open", venue: null, to: "t07", thread: null, give: { assets: [{ id: twin.id }] }, want: { cash: 9 } }]
              : w0.offers;
        const calls: string[] = [];
        const client = {
          me: async () => ({ id: "t02", assets }),
          myThreads: async () => ({ threads }),
          myOffers: async () => ({ offers }),
          cancelOffer: async (id: number) => void calls.push(`cancel ${id}`),
          raw: async (m: string, path: string) => void calls.push(`${m} ${path}`),
        } as unknown as BazaarClient;
        const lines = await executeWorkshop(client, intents, w, true);
        expect(calls).toEqual([]);
        expect(lines.some((l) => l.includes("aborted"))).toBe(true);
        if (change === "directed") expect(lines.some((l) => l.includes("has team demand"))).toBe(true);
      }),
    );
  });

  // 4 Oct 10:48: a craft took three copies El Rastro was listing for teams in the same tick. Teams go first.
  it("a craft never wins over a sale or listing of the same copy or card in the same tick", () => {
    const budget: Budget = { accepts: 1, messagesPerConversation: 1, maxOpenThreads: 6, openThreadsNow: 0, offersPerTick: 12, maxOpenOffers: 30, openOffersNow: 0, missing: [] };
    fc.assert(
      fc.property(hand, fc.constantFrom("asset", "sell", "sell#n", "accept"), (h, how) => {
        const w0 = world(h.map((x) => ({ ...x, where: "free" })));
        const w = buildWorkshop({ assets: w0.assets, team: "t02", threads: [], myOffers: { offers: [] }, prices: w0.prices, events: [] });
        const craft = proposeWorkshop(w).intents[0];
        if (!craft) return;
        const id = Number(craft.locks!.find((l) => l.startsWith("asset:"))!.slice(6));
        const ref = w0.assets.find((a) => a.id === id)!.ref;
        const lock = how === "asset" || how === "accept" ? `asset:${id}` : how === "sell" ? `sell:${ref}` : `sell:${ref}#2`;
        const other: Intent = { id: "trades:post:0", route: "trades", kind: how === "accept" ? "accept" : "listing", ev: 0.1, summary: "list", locks: [lock] };
        const v = arbitrate([craft, other], budget);
        expect(v.find((x) => x.intent.id === craft.id)!.selected).toBe(false);
        // Control: an unrelated listing does not block the craft.
        const free = arbitrate([craft, { ...other, locks: ["asset:99999", "sell:ZZZ-01"] }], budget);
        expect(free.find((x) => x.intent.id === craft.id)!.selected).toBe(true);
      }),
    );
  });

  it("a card a rival lacks to finish a page is team demand: never crafted", () => {
    const teams = [{ pages: [{ have: 9, of: 10, missing: ["LAT-02"] }, { have: 7, of: 10, missing: ["SAL-01", "SAL-06", "SAL-09"] }] }];
    expect([...nearPageDemand(teams)]).toEqual(["LAT-02"]);
    fc.assert(
      fc.property(hand, (h) => {
        const w0 = world(h.map((x) => ({ ...x, where: "free" })));
        const w = buildWorkshop({ assets: w0.assets, team: "t02", threads: [], myOffers: { offers: [] }, teamDemand: nearPageDemand(teams), prices: w0.prices, events: [] });
        for (const r of w.rarities) for (const id of r.pick) expect(h[id - 100]!.ref).not.toBe("LAT-02");
      }),
    );
  });
});
