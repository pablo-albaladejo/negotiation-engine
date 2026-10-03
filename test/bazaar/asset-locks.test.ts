import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { assetsInOffers, assetsInThreads, busyAssets, isKeepsake, rememberHiddenCards, sellBlocked } from "../../src/shared/asset-locks.js";
import { DealerInfoSchema, ThreadSchema } from "../../src/shared/schemas.js";
import type { TraceRecord } from "../../src/shared/trace.js";
import { DEFAULT_TRADE_PARAMS, buildValueModel, heldAssets, planTick, type HeldAsset, type TradeOffer, type TradeState } from "../../src/trades/trades.js";

const SAL07 = { id: 438, kind: "card", ref: "SAL-07", serial: 10, rarity: "uncommon", set: "SAL", print_run: 90 };
/** `/api/me/offers` real from 2 Oct (tick 132): 438 listed in El Rastro at 37 and in thread 260 with Abuela. */
const MY_OFFERS = {
  offers: [
    { id: 2079, maker: "t02", to: null, venue: "rastro", thread: null, status: "open", give: { cash: 0, assets: [SAL07], types: [] }, want: { cash: 37, assets: [], types: [] } },
    { id: 2081, maker: "t02", to: null, venue: "rastro", thread: null, status: "open", give: { cash: 12, assets: [], types: [] }, want: { cash: 0, assets: [], types: ["card:LAT-06"] } },
    { id: 2186, maker: "abuela", to: "t02", venue: null, thread: 260, status: "open", give: { cash: 13, assets: [], types: [] }, want: { cash: 0, assets: [SAL07], types: [] } },
    { id: 2000, maker: "t02", venue: "rastro", thread: null, status: "cancelled", give: { assets: [{ ...SAL07, id: 393 }] }, want: { cash: 10 } },
  ],
};

describe("one asset, one place", () => {
  it("assets in our open offers (not the dealer's nor cancelled ones)", () => {
    expect([...assetsInOffers(MY_OFFERS, "t02")]).toEqual([[438, "offer 2079 on rastro"]]);
  });

  it("assets of the sale topics of open threads", () => {
    const threads = [
      { id: 260, status: "open", with: "abuela", topic: { sell: { assets: [438] } } },
      { id: 257, status: "closed", with: "chato", topic: { sell: { assets: [439] } } },
      { id: 261, status: "open", with: "abuela", topic: { buy: { card: "SAL-05" } } },
    ];
    expect([...assetsInThreads(threads)]).toEqual([[438, "thread 260 with abuela"]]);
  });

  it("if threads or offers cannot be read, no asset is offered (fails closed)", async () => {
    const busy = await busyAssets({ myThreads: async () => ({ threads: [] }), myOffers: async () => Promise.reject(new Error("network")) });
    expect(busy).toBeUndefined();
    expect(sellBlocked({ sell: { assets: [1] } }, busy)).toMatch(/unknown/);
    expect(sellBlocked({ buy: { card: "SAL-05" } }, busy)).toBeUndefined();
  });
});

const MENU = DealerInfoSchema.parse({ id: "chato", name: "El Chato", menu: { sells: [{ rarity: "uncommon", sets: "released", list_price: 26 }], buys: [{ rarity: "uncommon", sets: "released" }] } });

function api(opts: { offers?: unknown; threads?: unknown[] }) {
  const posts: string[] = [];
  const a: BazaarApi = {
    me: async () => ({ id: "t02", cash: 400, assets: [{ ...SAL07, your_value: 9 }], score: { team: "t02" } }) as never,
    catalog: async () => ({ sets: [{ id: "SAL", released: true, cards: [{ id: "SAL-07", rarity: "uncommon", book: 20 }] }], packs: [] }) as never,
    value: async () => 9,
    myThreads: async () => ({ threads: (opts.threads ?? []) as never }),
    myOffers: async () => opts.offers ?? { offers: [] },
    thread: async () => Promise.reject(new Error("no thread")),
    openThread: async (_w, topic) => {
      posts.push(`open ${JSON.stringify(topic)}`);
      return Promise.reject(new Error("stop"));
    },
    say: async () => ({}),
    closeThread: async () => ({}),
    accept: async () => ({}),
  };
  return { a, posts };
}

describe("the dealers agent does not open a sale thread for a busy asset", () => {
  const firstOpen = async (opts: { offers?: unknown; threads?: unknown[] }) => {
    const { a, posts } = api(opts);
    const records: TraceRecord[] = [];
    const agent = new BazaarAgent(a, { dealer: { id: "chato", aliases: ["El Chato"] }, dryRun: false, maxSpendPerHour: 0, menu: MENU, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000 });
    await agent.step({ tick: 130, tick_seconds: 60 });
    return { posts, records, plan: await agent.plan() };
  };

  it("438 listed in El Rastro (offer 2079): does not offer it to El Chato", async () => {
    const { posts, records, plan } = await firstOpen({ offers: MY_OFFERS });
    expect(posts).toEqual([]);
    expect(records.map((r) => r.rule)).toEqual(["no-target"]);
    expect(plan.at(-1)).toBe("not opened: sell SAL-07 (asset 438 busy: offer 2079 on rastro)");
  });

  it("438 already in an open thread with Abuela: does not open another with El Chato", async () => {
    const { posts } = await firstOpen({ threads: [{ id: 260, status: "open", with: "abuela", topic: { sell: { assets: [438] } } }] });
    expect(posts).toEqual([]);
  });

  it("control: free everywhere, it does open it", async () => {
    const { posts } = await firstOpen({});
    expect(posts).toEqual(['open {"sell":{"assets":[438]}}']);
  });
});

describe("one asset, one place in already open threads", () => {
  const THREAD_260 = { id: 260, status: "open", team: "t02", with: "abuela", topic: { sell: { assets: [438] } } };
  const LISTED = { offers: [MY_OFFERS.offers[0]] };
  const herBid = (status = "open") => ({ id: 2186, maker: "abuela", to: "t02", thread: 260, status, give: { cash: 40 }, want: { assets: [SAL07] }, final: true });

  function abuela(offers: () => unknown) {
    const posts: string[] = [];
    const a: BazaarApi = {
      me: async () => ({ id: "t02", cash: 40, assets: [{ ...SAL07, your_value: 9 }], score: { team: "t02" } }) as never,
      catalog: async () => ({ sets: [{ id: "SAL", released: true, cards: [{ id: "SAL-07", rarity: "uncommon", book: 20 }] }], packs: [] }) as never,
      value: async () => 9,
      myThreads: async () => ({ threads: [THREAD_260] as never }),
      myOffers: async () => offers(),
      thread: async () => ThreadSchema.parse({ ...THREAD_260, messages: [], standing_offers: [herBid()] }),
      openThread: async () => Promise.reject(new Error("no open expected")),
      say: async () => {
        posts.push("say");
        return {};
      },
      closeThread: async (id) => {
        posts.push(`close ${id}`);
        return {};
      },
      accept: async (id) => {
        posts.push(`accept ${id}`);
        return {};
      },
    };
    return { a, posts };
  }
  const agentFor = (a: BazaarApi, lines: string[] = []) =>
    new BazaarAgent(a, { dealer: { id: "abuela", aliases: [] }, dryRun: false, maxSpendPerHour: 0, menu: MENU, trace: { write: () => {} }, now: () => 1_700_000_000_000, log: (l) => lines.push(l) });

  it("when resuming thread 260 with 438 listed in El Rastro: does not resume it, closes it politely", async () => {
    const { a, posts } = abuela(() => LISTED);
    const lines: string[] = [];
    await agentFor(a, lines).step({ tick: 149, tick_seconds: 60 });
    expect(posts.slice(0, 2)).toEqual(["say", "close 260"]);
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(lines.some((l) => l.includes("thread 260: not resumed, asset 438 busy: offer 2079 on rastro"))).toBe(true);
  });

  it("listed right before accepting its final: does not sell (asset-busy)", async () => {
    let listed = false;
    const { a, posts } = abuela(() => (listed ? LISTED : { offers: [] }));
    const agent = agentFor(a);
    const original = a.thread;
    a.thread = async (id) => {
      listed = true;
      return original(id);
    };
    await agent.step({ tick: 149, tick_seconds: 60 });
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(posts).toContain("close 260");
  });

  it("control: free, accepts its final of 40 for 438", async () => {
    const { a, posts } = abuela(() => ({ offers: [] }));
    await agentFor(a).step({ tick: 149, tick_seconds: 60 });
    expect(posts).toEqual(["accept 2186"]);
  });
});

describe("El Rastro never lists a busy asset nor the album copy", () => {
  const REFS = ["SAL-01", "SAL-02", "SAL-03"];
  const CATALOG = { sets: [{ id: "SAL", released: true, cards: REFS.map((id) => ({ id, rarity: "common", book: 10 })) }], packs: [] } as never;
  const copyArb = fc.record({ ref: fc.constantFrom(...REFS), locked: fc.boolean(), reserved: fc.boolean(), listed: fc.boolean(), value: fc.integer({ min: 1, max: 30 }) });

  it("every listing (new, repriced or kept) is a free surplus copy: at least one free copy of that card stays unlisted", () => {
    fc.assert(
      fc.property(fc.array(copyArb, { minLength: 1, maxLength: 8 }), fc.integer({ min: 0, max: 400 }), (copies, cash) => {
        const held: HeldAsset[] = copies.map((c, i) => ({ id: 100 + i, ref: c.ref, value: c.value, locked: c.locked }));
        const reserved = new Set(held.filter((_, i) => copies[i]!.reserved).map((a) => a.id));
        const mine: TradeOffer[] = held
          .filter((_, i) => copies[i]!.listed)
          .map((a, k) => ({ id: 9000 + k, maker: "t02", venue: "rastro", thread: null, status: "open", give: { assets: [{ id: a.id, ref: a.ref }] }, want: { cash: 5 }, created_tick: 0 }));
        const state: TradeState = {
          tick: 50,
          myId: "t02",
          cash,
          held,
          pageSets: ["SAL"],
          board: [],
          mine,
          toMe: [],
          settlements: [],
          model: buildValueModel(CATALOG, held, new Map()),
          limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 },
          spent: 0,
          reserved,
        };
        const plan = planTick(state, DEFAULT_TRADE_PARAMS);
        const cancelled = new Set(plan.cancels.map((c) => c.id));
        const listedAfter = new Set([
          ...mine.filter((o) => !cancelled.has(o.id)).map((o) => (o.give!.assets![0] as { id: number }).id),
          ...plan.posts.flatMap((p) => ("assets" in p.body.give ? p.body.give.assets : [])),
        ]);
        for (const id of listedAfter) {
          expect(reserved.has(id)).toBe(false);
          const ref = held.find((a) => a.id === id)!.ref;
          const freeUnlisted = held.filter((a) => a.ref === ref && !reserved.has(a.id) && !listedAfter.has(a.id) && (!a.locked || mine.some((o) => (o.give!.assets![0] as { id: number }).id === a.id)));
          expect(freeUnlisted.length).toBeGreaterThanOrEqual(1);
        }
      }),
    );
  });
});

describe("keepsakes never leave on their own", () => {
  it("a one-print card, or an epic/legendary without a positive value, is held as locked", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("common", "uncommon", "rare", "epic", "legendary"),
        fc.option(fc.integer({ min: 1, max: 500 }), { nil: null }),
        fc.option(fc.double({ min: -5, max: 300, noNaN: true }), { nil: null }),
        (rarity, printRun, value) => {
          const asset = { id: 2001, kind: "card", ref: "SAL-02", rarity, print_run: printRun, your_value: value };
          const keep = printRun === 1 || ((rarity === "epic" || rarity === "legendary") && !((value ?? 0) > 0));
          expect(isKeepsake(asset)).toBe(keep);
          expect(heldAssets([asset])[0]!.locked).toBe(keep);
        },
      ),
    );
  });

  it("the egg gift LAT-13 (legendary, print_run 1, your_value 0) is locked", () => {
    const [held] = heldAssets([{ id: 1056, kind: "card", ref: "LAT-13", rarity: "legendary", print_run: 1, serial: 1, your_value: 0 }]);
    expect(held!.locked).toBe(true);
  });
});

describe("hidden cards are never sold (Pablo, 3 Oct)", () => {
  it("a hidden card is locked whatever its value, rarity or print run", () => {
    rememberHiddenCards({ sets: [{ id: "ZZZ", cards: [{ id: "ZZZ-99", hidden: true }, { id: "ZZZ-01" }] }] });
    fc.assert(
      fc.property(
        fc.constantFrom("common", "uncommon", "rare", "epic", "legendary"),
        fc.integer({ min: 2, max: 500 }),
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        (rarity, printRun, value) => {
          const hidden = { id: 3001, kind: "card", ref: "ZZZ-99", rarity, print_run: printRun, your_value: value };
          expect(isKeepsake(hidden)).toBe(true);
          expect(heldAssets([hidden])[0]!.locked).toBe(true);
          // Same card, not hidden: only the other keepsake rules apply.
          const visible = { ...hidden, ref: "ZZZ-01" };
          expect(isKeepsake(visible)).toBe(false);
        },
      ),
    );
  });

  it("LAT-13 is locked even before the catalog is read, with a positive value", () => {
    expect(isKeepsake({ kind: "card", ref: "LAT-13", rarity: "legendary", print_run: 5, your_value: 450 })).toBe(true);
  });
});
