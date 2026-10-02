import { describe, expect, it } from "vitest";
import { BazaarAgent, type BazaarApi } from "../../src/dealers/agent.js";
import { menuBlocks } from "../../src/dealers/plan.js";
import { CatalogSchema, DealerInfoSchema } from "../../src/shared/schemas.js";
import type { TraceRecord } from "../../src/shared/trace.js";

/** Menús reales de `/api/dealers/{id}` (2 oct, tick 132). */
const CHATO = DealerInfoSchema.parse({
  id: "chato",
  menu: {
    sells: [{ pack: "sobre_plata", name: "Silver pack", list_price: 150, opening_ask: 188, per_team_per_hour: 2 }, { rarity: "uncommon", sets: "released", list_price: 26 }, { rarity: "rare", sets: "released", list_price: 77 }],
    buys: [{ rarity: "uncommon", sets: "released" }, { rarity: "rare", sets: "released" }],
  },
});
const ABUELA = DealerInfoSchema.parse({
  id: "abuela",
  menu: {
    sells: [{ pack: "sobre_barrio", list_price: 26 }, { rarity: "common", sets: "released", list_price: 10 }, { rarity: "uncommon", sets: "released", list_price: 25 }],
    buys: [{ rarity: "common", sets: "released" }, { rarity: "uncommon", sets: "released" }],
  },
});
const CATALOG = CatalogSchema.parse({ sets: [{ id: "SAL", released: true, cards: [] }, { id: "NEW", released: false, cards: [] }] });

describe("menú del dealer: vender solo lo que compra, comprar solo lo que vende", () => {
  it("El Chato compra uncommon y rare de sets publicados; no comunes ni sets sin publicar", () => {
    expect(menuBlocks(CHATO, CATALOG, { side: "sell", rarity: "uncommon", set: "SAL" })).toBeUndefined();
    expect(menuBlocks(CHATO, CATALOG, { side: "sell", rarity: "rare", set: "SAL" })).toBeUndefined();
    expect(menuBlocks(CHATO, CATALOG, { side: "sell", rarity: "common", set: "SAL" })).toBe("chato does not buy common SAL (menu.buys)");
    expect(menuBlocks(CHATO, CATALOG, { side: "sell", rarity: "uncommon", set: "NEW" })).toMatch(/does not buy/);
    expect(menuBlocks(CHATO, CATALOG, { side: "sell", rarity: undefined, set: "SAL" })).toMatch(/does not buy/);
  });

  it("Abuela no compra raras; vende comunes y uncommon, no raras", () => {
    expect(menuBlocks(ABUELA, CATALOG, { side: "sell", rarity: "rare", set: "SAL" })).toMatch(/does not buy rare/);
    expect(menuBlocks(ABUELA, CATALOG, { side: "buy", rarity: "uncommon", set: "SAL", card: "SAL-07" })).toBeUndefined();
    expect(menuBlocks(ABUELA, CATALOG, { side: "buy", rarity: "rare", set: "SAL" })).toBe("abuela does not sell rare SAL (menu.sells)");
    // Un sobre en su menú no habilita comprar cartas sueltas por él.
    expect(menuBlocks(DealerInfoSchema.parse({ id: "x", menu: { sells: [{ pack: "sobre_plata", list_price: 150 }] } }), CATALOG, { side: "buy", rarity: "rare", set: "SAL" })).toMatch(/does not sell/);
  });
});

describe("modo serio sin ficha del dealer: no abre nada (el planificador antiguo vende sin mirar el menú)", () => {
  it("requireMenu: con una repetida para vender, sin menú no hay objetivo", async () => {
    const posts: string[] = [];
    const assets = [1, 2].map((id) => ({ id, kind: "card", ref: "SAL-01", rarity: "common", set: "SAL", your_value: 3 }));
    const api: BazaarApi = {
      me: async () => ({ id: "t02", cash: 400, assets, score: { team: "t02" } }) as never,
      catalog: async () => CATALOG as never,
      value: async () => 3,
      myThreads: async () => ({ threads: [] }),
      myOffers: async () => ({ offers: [] }),
      thread: async () => Promise.reject(new Error("no thread")),
      openThread: async (_w, topic) => {
        posts.push(`open ${JSON.stringify(topic)}`);
        return Promise.reject(new Error("stop"));
      },
      say: async () => ({}),
      closeThread: async () => ({}),
      accept: async () => ({}),
    };
    const run = async (requireMenu: boolean) => {
      const records: TraceRecord[] = [];
      const a = new BazaarAgent(api, { dealer: { id: "chato", aliases: [] }, dryRun: false, maxSpendPerHour: 0, requireMenu, trace: { write: (r) => records.push(r) }, now: () => 1_700_000_000_000 });
      await a.step({ tick: 1, tick_seconds: 60 });
      return records.map((r) => r.rule);
    };
    expect(await run(true)).toEqual(["no-target"]);
    expect(posts).toEqual([]);
    await run(false);
    expect(posts).toEqual(['open {"sell":{"assets":[2]}}']);
  });
});
