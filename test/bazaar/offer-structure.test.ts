import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { checkStructure, expectationOf, firstMismatch } from "../../src/dealers/negotiation/offer-structure.js";
import { nextCopyValue } from "../../src/dealers/planning/plan.js";
import { DEFAULT_VALUE_RULES } from "../../src/trades/trades.js";
import { DealerInfoSchema, StandingOfferSchema, ThreadSchema, type Thread } from "../../src/shared/schemas.js";
import type { TraceRecord } from "../../src/shared/trace.js";

const SAL07 = { id: 438, kind: "card", ref: "SAL-07", serial: 10, rarity: "uncommon", set: "SAL", print_run: 90 };
const offer = (o: object) => StandingOfferSchema.parse({ id: 1, maker: "chato", status: "open", final: false, ...o });
const SELL = { side: "sell", assetIds: [438] } as const;

describe("dealer offer shape", () => {
  it("real thread 257: Chato gives 13 cash and wants only asset 438 → valid buy shape", () => {
    const real = offer({ give: { cash: 13, assets: [], types: [] }, want: { cash: 0, assets: [SAL07], types: [] } });
    expect(checkStructure(real, SELL, { accept: true })).toEqual({ ok: true });
  });

  it("sale: if it offers us a pack and asks for cash (it sells to us), it is never accepted", () => {
    const pack = offer({ give: { cash: 0, assets: [], types: ["pack:sobre_plata"] }, want: { cash: 13, assets: [], types: [] } });
    expect(checkStructure(pack, SELL)).toEqual({ ok: false, reason: "dealer-selling" });
    expect(checkStructure(offer({ give: { cash: 13 }, want: { cash: 13, assets: [SAL07] } }), SELL, { accept: true }).reason).toBe("dealer-selling");
  });

  it("sale: wants another asset besides ours, or gives no cash → no", () => {
    const extra = offer({ give: { cash: 40 }, want: { assets: [SAL07, { ...SAL07, id: 439 }] } });
    expect(checkStructure(extra, SELL, { accept: true }).reason).toBe("wants-other-assets");
    expect(checkStructure(offer({ give: { cash: 0 }, want: { assets: [SAL07] } }), SELL, { accept: true }).reason).toBe("no-cash");
    expect(checkStructure(offer({ give: { cash: 12 }, want: { assets: [] } }), SELL, { accept: true }).reason).toBe("wants-other-assets");
    expect(checkStructure(offer({ give: { cash: 12 }, want: { types: ["card:SAL-07"] } }), SELL).reason).toBe("wants-other-assets");
    // Without accepting, it is tolerated that it does not yet repeat our asset (it is required when accepting).
    expect(checkStructure(offer({ give: { cash: 12 } }), SELL)).toEqual({ ok: true });
  });

  it("buy: exactly the requested card, cash only and within the limit", () => {
    const exp = { side: "buy", card: "SAL-05" } as const;
    expect(checkStructure(offer({ give: { types: ["card:SAL-05"] }, want: { cash: 20 } }), exp, { accept: true, maxCash: 20 })).toEqual({ ok: true });
    expect(checkStructure(offer({ give: { types: ["card:SAL-05"] }, want: { cash: 21 } }), exp, { accept: true, maxCash: 20 }).reason).toBe("over-limit");
    expect(checkStructure(offer({ give: { types: ["card:SAL-06"] }, want: { cash: 10 } }), exp, { accept: true, maxCash: 20 }).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["pack:sobre_plata"] }, want: { cash: 10 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["card:SAL-05", "card:SAL-06"] }, want: { cash: 10 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { cash: 10 }, want: { assets: [SAL07] } }), exp).reason).toBe("dealer-buying");
    // Card not yet revealed: negotiation can continue, but not accepting.
    expect(checkStructure(offer({ want: { cash: 10 } }), exp)).toEqual({ ok: true });
    expect(checkStructure(offer({ want: { cash: 10 } }), exp, { accept: true, maxCash: 20 }).reason).toBe("wrong-goods");
  });

  it("buy rarity+set: the card it gives must be of that rarity and set", () => {
    const exp = expectationOf({ buy: { rarity: "uncommon", set: "SAL" } }, "buy", (ref) => ref === "SAL-05")!;
    expect(checkStructure(offer({ give: { assets: [{ ...SAL07, ref: "SAL-05" }] }, want: { cash: 9 } }), exp, { accept: true, maxCash: 9 })).toEqual({ ok: true });
    expect(checkStructure(offer({ give: { types: ["card:LAT-01"] }, want: { cash: 9 } }), exp).reason).toBe("wrong-goods");
  });

  it("buy pack: exactly one pack of the requested type (real shape: give.types pack:sobre_barrio), cash only, within the limit", () => {
    const exp = expectationOf({ buy: { pack: "sobre_barrio" } }, "buy")!;
    expect(exp).toEqual({ side: "buy", pack: "sobre_barrio" });
    const real = offer({ maker: "abuela", give: { cash: 0, assets: [], types: ["pack:sobre_barrio"] }, want: { cash: 30, assets: [], types: [] } });
    expect(checkStructure(real, exp, { accept: true, maxCash: 30 })).toEqual({ ok: true });
    expect(checkStructure(real, exp, { accept: true, maxCash: 29 }).reason).toBe("over-limit");
    expect(checkStructure(offer({ give: { types: ["pack:sobre_plata"] }, want: { cash: 20 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["card:SAL-05"] }, want: { cash: 20 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["pack:sobre_barrio", "pack:sobre_barrio"] }, want: { cash: 20 } }), exp).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ want: { cash: 20 } }), exp)).toEqual({ ok: true });
    expect(checkStructure(offer({ want: { cash: 20 } }), exp, { accept: true, maxCash: 30 }).reason).toBe("wrong-goods");
    expect(checkStructure(offer({ give: { types: ["pack:sobre_barrio"] }, want: { cash: 0 } }), exp, { accept: true, maxCash: 30 }).reason).toBe("no-cash");
  });

  it("firstMismatch checks all its offers in the thread (messages and current ones)", () => {
    const thread = ThreadSchema.parse({
      id: 1,
      topic: { sell: { assets: [438] } },
      messages: [{ sender: "chato", offer: { id: 5, maker: "chato", give: { types: ["pack:sobre_plata"] }, want: { cash: 13 } } }],
      standing_offers: [{ id: 6, maker: "chato", status: "open", give: { cash: 13 }, want: { assets: [SAL07] } }],
    });
    expect(firstMismatch(thread, { id: "chato", aliases: [] }, SELL)).toMatchObject({ offer: { id: 5 }, reason: "dealer-selling" });
  });
});

const MENU = DealerInfoSchema.parse({ id: "chato", name: "El Chato", menu: { sells: [{ rarity: "uncommon", sets: "released", list_price: 26 }], buys: [{ rarity: "uncommon", sets: "released" }] } });

/** Dealer that, in a sale thread, answers with an offer of shape `herOffer` at a very good price. */
function dealerWith(herOffer: (asset: number) => object) {
  const posts: string[] = [];
  const threads = new Map<number, Thread>();
  let nextOffer = 500;
  const api: BazaarApi = {
    me: async () => ({ id: "t02", cash: 400, assets: [{ ...SAL07, your_value: 9 }], score: { team: "t02" } }) as never,
    catalog: async () => ({ sets: [{ id: "SAL", released: true, cards: [{ id: "SAL-07", rarity: "uncommon", book: 20 }] }], packs: [] }) as never,
    value: async () => 9,
    myThreads: async () => ({ threads: [...threads.values()].filter((t) => t.status === "open").map((t) => ({ id: t.id, status: t.status, with: "chato" })) }),
    myOffers: async () => ({ offers: [] }),
    thread: async (id) => structuredClone(threads.get(id)!),
    openThread: async (_with, topic) => {
      posts.push("open");
      const t = ThreadSchema.parse({ id: 257, status: "open", team: "t02", with: "chato", topic, messages: [], standing_offers: [{ id: nextOffer++, maker: "chato", to: "t02", status: "open", final: false, ...herOffer(438) }] });
      threads.set(t.id, t);
      return structuredClone(t);
    },
    say: async (_id, _text, price) => {
      posts.push(price === undefined ? "say" : `say ${price}`);
      return {};
    },
    closeThread: async (id) => {
      posts.push("close");
      threads.get(id)!.status = "closed";
      return {};
    },
    accept: async (offerId) => {
      posts.push(`accept ${offerId}`);
      return {};
    },
  };
  return { api, posts };
}

describe("the agent never accepts an offer with the wrong shape", () => {
  const run = async (herOffer: (asset: number) => object) => {
    const { api, posts } = dealerWith(herOffer);
    const records: TraceRecord[] = [];
    const lines: string[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "chato", aliases: ["El Chato"] }, dryRun: false, maxSpendPerHour: 50, maxThreads: 1, menu: MENU, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000, log: (l) => lines.push(l) });
    for (let tick = 1; tick < 6; tick++) await a.step({ tick, tick_seconds: 60 });
    return { posts, records, lines };
  };

  it("sale where the dealer sells us a pack for 13: closes politely after reading it (structure-mismatch)", async () => {
    const { posts, records, lines } = await run(() => ({ give: { cash: 0, types: ["pack:sobre_plata"] }, want: { cash: 13 } }));
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(posts).toEqual(["open", "say", "close"]);
    expect(records.find((r) => r.action === "close")?.rule).toBe("structure-mismatch");
    expect(lines.some((l) => l.includes("structure-mismatch (dealer-selling"))).toBe(true);
  });

  it("sale with 99 cash but also asking for another asset: never accepts", async () => {
    const { posts, records } = await run((asset) => ({ give: { cash: 99 }, want: { assets: [{ id: asset }, { id: 999 }] }, final: true }));
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(records.find((r) => r.action === "close")?.rule).toBe("structure-mismatch");
  });

  it("control: the same final bid with the right shape is accepted", async () => {
    const { posts } = await run((asset) => ({ give: { cash: 99 }, want: { assets: [{ id: asset }] }, final: true }));
    expect(posts.slice(0, 2)).toEqual(["open", "accept 500"]);
  });
});

describe("rarity+set buy: the card she names is revalued at our value of one MORE copy (thread 493)", () => {
  const RET = ["RET-06", "RET-07", "RET-08"];
  /** Thread 493 resumed: Abuela names RET-06, which we already hold; the value lookup returns the held copy's value (poisoned cache). */
  const run = async (herPrice: number, heldValue: number, missingValue: number) => {
    const posts: string[] = [];
    const thread = ThreadSchema.parse({
      id: 493,
      status: "open",
      team: "t02",
      with: "abuela",
      topic: { buy: { rarity: "uncommon", set: "RET" } },
      messages: [],
      standing_offers: [{ id: 4816, maker: "abuela", to: "t02", status: "open", final: false, give: { cash: 0, assets: [], types: ["card:RET-06"] }, want: { cash: herPrice, assets: [], types: [] } }],
    });
    const api: BazaarApi = {
      me: async () => ({ id: "t02", cash: 400, assets: [{ id: 77, kind: "card", ref: "RET-06", serial: 3, rarity: "uncommon", set: "RET", print_run: 90, your_value: heldValue }], score: { team: "t02" } }) as never,
      catalog: async () => ({ sets: [{ id: "RET", released: true, cards: RET.map((id) => ({ id, rarity: "uncommon", book: 20 })) }], packs: [] }) as never,
      value: async (card) => (card === "RET-06" ? heldValue : missingValue),
      myThreads: async () => ({ threads: thread.status === "open" ? [{ id: 493, status: "open", with: "abuela" }] : [] }),
      myOffers: async () => ({ offers: [] }),
      thread: async () => structuredClone(thread),
      openThread: async () => {
        throw new Error("no new threads in this test");
      },
      say: async (_id, _text, price) => {
        posts.push(price === undefined ? "say" : `say ${price}`);
        return {};
      },
      closeThread: async () => {
        posts.push("close");
        thread.status = "closed";
        return {};
      },
      accept: async (offerId) => {
        posts.push(`accept ${offerId}`);
        return {};
      },
    };
    const records: TraceRecord[] = [];
    const lines: string[] = [];
    const a = new BazaarAgent(api, { dealer: { id: "abuela", aliases: ["Abuela"] }, dryRun: false, maxSpendPerHour: 200, maxThreads: 1, safety: 1, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000, log: (l) => lines.push(l) });
    for (let tick = 1; tick < 5; tick++) await a.step({ tick, tick_seconds: 60 });
    return { posts, records, lines };
  };

  it("real thread 493: RET-06 held at 40, her 29 → walks (named-card-revalue), never pays 24 for a ~10 P duplicate", async () => {
    const { posts, records, lines } = await run(29, 40, 40);
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(records.find((r) => r.action === "close")?.rule).toBe("named-card-revalue");
    expect(lines.some((l) => /named-card-revalue: she offers RET-06 \(DUPLICATE, we hold 1\): our value 10 → limit 10 \(was \d+\)/.test(l))).toBe(true);
  });

  it("never accepts nor offers above the per-card value of the named duplicate", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 80 }), fc.integer({ min: 1, max: 120 }), fc.integer({ min: 1, max: 120 }), async (herPrice, heldValue, missingValue) => {
        const { posts, records } = await run(herPrice, heldValue, missingValue);
        const perCard = nextCopyValue(heldValue, 1, heldValue, DEFAULT_VALUE_RULES.marginals);
        for (const r of records) if ((r.action === "accept" || r.action === "counter") && r.ourPrice !== undefined) expect(r.ourPrice).toBeLessThanOrEqual(perCard);
        if (herPrice > perCard) expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
      }),
      { numRuns: 60 },
    );
  });
});
