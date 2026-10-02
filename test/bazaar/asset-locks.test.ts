import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { assetsInOffers, assetsInThreads, busyAssets, sellBlocked } from "../../src/shared/asset-locks.js";
import { DealerInfoSchema, ThreadSchema } from "../../src/shared/schemas.js";
import type { TraceRecord } from "../../src/shared/trace.js";

const SAL07 = { id: 438, kind: "card", ref: "SAL-07", serial: 10, rarity: "uncommon", set: "SAL", print_run: 90 };
/** `/api/me/offers` real del 2 oct (tick 132): 438 listado en El Rastro a 37 y en el hilo 260 con Abuela. */
const MY_OFFERS = {
  offers: [
    { id: 2079, maker: "t02", to: null, venue: "rastro", thread: null, status: "open", give: { cash: 0, assets: [SAL07], types: [] }, want: { cash: 37, assets: [], types: [] } },
    { id: 2081, maker: "t02", to: null, venue: "rastro", thread: null, status: "open", give: { cash: 12, assets: [], types: [] }, want: { cash: 0, assets: [], types: ["card:LAT-06"] } },
    { id: 2186, maker: "abuela", to: "t02", venue: null, thread: 260, status: "open", give: { cash: 13, assets: [], types: [] }, want: { cash: 0, assets: [SAL07], types: [] } },
    { id: 2000, maker: "t02", venue: "rastro", thread: null, status: "cancelled", give: { assets: [{ ...SAL07, id: 393 }] }, want: { cash: 10 } },
  ],
};

describe("un activo, un sitio", () => {
  it("activos en nuestras ofertas abiertas (no las del dealer ni las canceladas)", () => {
    expect([...assetsInOffers(MY_OFFERS, "t02")]).toEqual([[438, "offer 2079 on rastro"]]);
  });

  it("activos de los topics de venta de los hilos abiertos", () => {
    const threads = [
      { id: 260, status: "open", with: "abuela", topic: { sell: { assets: [438] } } },
      { id: 257, status: "closed", with: "chato", topic: { sell: { assets: [439] } } },
      { id: 261, status: "open", with: "abuela", topic: { buy: { card: "SAL-05" } } },
    ];
    expect([...assetsInThreads(threads)]).toEqual([[438, "thread 260 with abuela"]]);
  });

  it("si no se pueden leer hilos u ofertas, no se ofrece ningún activo (falla cerrado)", async () => {
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

describe("el agente de dealers no abre un hilo de venta de un activo ocupado", () => {
  const firstOpen = async (opts: { offers?: unknown; threads?: unknown[] }) => {
    const { a, posts } = api(opts);
    const records: TraceRecord[] = [];
    const agent = new BazaarAgent(a, { dealer: { id: "chato", aliases: ["El Chato"] }, dryRun: false, maxSpendPerHour: 0, menu: MENU, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000 });
    await agent.step({ tick: 130, tick_seconds: 60 });
    return { posts, records, plan: await agent.plan() };
  };

  it("438 listado en El Rastro (oferta 2079): no lo ofrece a El Chato", async () => {
    const { posts, records, plan } = await firstOpen({ offers: MY_OFFERS });
    expect(posts).toEqual([]);
    expect(records.map((r) => r.rule)).toEqual(["no-target"]);
    expect(plan.at(-1)).toBe("not opened: sell SAL-07 (asset 438 busy: offer 2079 on rastro)");
  });

  it("438 ya en un hilo abierto con Abuela: no abre otro con El Chato", async () => {
    const { posts } = await firstOpen({ threads: [{ id: 260, status: "open", with: "abuela", topic: { sell: { assets: [438] } } }] });
    expect(posts).toEqual([]);
  });

  it("control: libre en todas partes, sí lo abre", async () => {
    const { posts } = await firstOpen({});
    expect(posts).toEqual(['open {"sell":{"assets":[438]}}']);
  });
});

describe("un activo, un sitio en hilos ya abiertos", () => {
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

  it("al retomar el hilo 260 con 438 listado en El Rastro: no lo retoma, lo cierra educadamente", async () => {
    const { a, posts } = abuela(() => LISTED);
    const lines: string[] = [];
    await agentFor(a, lines).step({ tick: 149, tick_seconds: 60 });
    expect(posts.slice(0, 2)).toEqual(["say", "close 260"]);
    expect(posts.some((p) => p.startsWith("accept"))).toBe(false);
    expect(lines.some((l) => l.includes("thread 260: not resumed, asset 438 busy: offer 2079 on rastro"))).toBe(true);
  });

  it("listado justo antes de aceptar su final: no vende (asset-busy)", async () => {
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

  it("control: libre, acepta su final de 40 por 438", async () => {
    const { a, posts } = abuela(() => ({ offers: [] }));
    await agentFor(a).step({ tick: 149, tick_seconds: 60 });
    expect(posts).toEqual(["accept 2186"]);
  });
});
