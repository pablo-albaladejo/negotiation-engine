import { describe, expect, it } from "vitest";
import { formatPlan, previewPath, rankCandidates, selectCandidates } from "../../src/bazaar/plan.js";
import { DealerInfoSchema, type Catalog, type Me } from "../../src/bazaar/schemas.js";

const ABUELA = DealerInfoSchema.parse({
  id: "abuela",
  name: "Abuela Carmen",
  unlock: { early_min_deals: 3 },
  menu: {
    sells: [
      { pack: "sobre_barrio", list_price: 26, opening_ask: 30 },
      { rarity: "common", sets: "released", list_price: 10 },
      { rarity: "uncommon", sets: "released", list_price: 25 },
    ],
    buys: [{ rarity: "common", sets: "released" }, { rarity: "uncommon", sets: "released" }],
  },
});

const card = (id: string, rarity: string) => ({ id, rarity, book: rarity === "common" ? 10 : 25 });
const CATALOG = {
  sets: [
    { id: "AAA", released: true, cards: [card("AAA-01", "common"), card("AAA-02", "common"), card("AAA-06", "uncommon"), card("AAA-07", "uncommon")] },
    { id: "BBB", released: true, cards: [card("BBB-01", "common"), card("BBB-02", "common"), card("BBB-06", "uncommon")] },
    { id: "ZZZ", released: false, cards: [card("ZZZ-01", "common")] },
  ],
  packs: [],
} as unknown as Catalog;

function me(assets: Me["assets"], cash = 413): Me {
  return {
    cash,
    level: 1,
    assets,
    album: { pages: [{ set: "AAA", have: 2, of: 10 }, { set: "BBB", have: 6, of: 10 }] },
    score: { deals: 1 },
  } as Me;
}
const asset = (id: number, ref: string, rarity: string, your_value: number) => ({ id, kind: "card", ref, rarity, set: ref.slice(0, 3), your_value });

describe("plan: candidatos por menú", () => {
  it("rareza+set: valor esperado sobre las cartas de esa rareza y set (repetidas valen poco); reserva = valor × 0,9; margen solo si supera su lista", async () => {
    const values: Record<string, number> = { "AAA-01": 14, "AAA-02": 14, "AAA-06": 40, "AAA-07": 30, "BBB-01": 3, "BBB-02": 13, "BBB-06": 20, "ZZZ-01": 99 };
    const cands = await rankCandidates({ me: me([asset(1, "BBB-01", "common", 13)]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, budget: 50 });
    const buys = cands.filter((c) => c.side === "buy");
    expect(buys.map((c) => [c.key, c.reservation, c.room])).toEqual([
      ["buy:AAA:uncommon", 31, true],
      ["buy:AAA:common", 12, true],
      ["buy:BBB:common", 7, false],
      ["buy:BBB:uncommon", 18, false],
    ]);
    const bbb = buys.find((c) => c.key === "buy:BBB:common")!;
    expect(bbb.value).toBe(8);
    expect(bbb.cards).toEqual([{ id: "BBB-01", value: 3, held: true }, { id: "BBB-02", value: 13, held: false }]);
    expect(bbb.herOpening).toBe(12);
    expect(buys.some((c) => c.set === "ZZZ")).toBe(false);
  });

  it("elige una común y una infrecuente si ambas tienen margen, y respeta el tope de gasto", async () => {
    const values: Record<string, number> = { "AAA-01": 14, "AAA-02": 14, "AAA-06": 40, "AAA-07": 40, "BBB-01": 16, "BBB-02": 16, "BBB-06": 45 };
    const cands = await rankCandidates({ me: me([]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, budget: 100 });
    const two = selectCandidates(cands, { maxThreads: 2, maxSpend: 100 });
    expect(two.map((s) => s.candidate.rarity).sort()).toEqual(["common", "uncommon"]);
    expect(two.map((s) => s.candidate.key)).toEqual(["buy:BBB:uncommon", "buy:BBB:common"]);
    // Con 50 P: la infrecuente (reserva 40) cabe; a la común le quedan 10, que no superan su lista de 10.
    const capped = selectCandidates(cands, { maxThreads: 2, maxSpend: 50 });
    expect(capped.map((s) => [s.candidate.key, s.candidate.reservation])).toEqual([["buy:BBB:uncommon", 40]]);
  });

  it("sin compras con margen, vende lo que ella compra: repetidas primero, luego menor impacto en la página", async () => {
    const assets = [asset(1, "AAA-01", "common", 5), asset(2, "BBB-01", "common", 4), asset(3, "BBB-02", "common", 9), asset(4, "BBB-02", "common", 2.2), asset(5, "AAA-06", "uncommon", 30)];
    const cands = await rankCandidates({ me: me(assets), catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, budget: 50 });
    const sells = cands.filter((c) => c.side === "sell");
    expect(sells.map((c) => [c.key, c.copy, c.room])).toEqual([
      ["sell:4", "duplicate", true],
      ["sell:1", "only", true],
      ["sell:2", "only", true],
      ["sell:5", "only", false],
    ]);
    expect(sells[0]!.page).toBeUndefined();
    expect(sells[1]!.page).toEqual({ set: "AAA", have: 2, of: 10, after: 1 });
    expect(sells[1]!.reservation).toBe(6);
    expect(sells[1]!.herOpening).toBe(13);
    expect(sells[1]!.why).toContain("ONLY copy");
    const chosen = selectCandidates(cands, { maxThreads: 2, maxSpend: 50 });
    expect(chosen.map((s) => s.candidate.key)).toEqual(["sell:4", "sell:1"]);
    expect(chosen[0]!.reason).toContain("fallback");
  });

  it("camino previsto contra su puja fija de 13: ancla 26, paso 3 sin respuesta → pasos de 1, y acepta 13 (precio fijo)", async () => {
    const cands = await rankCandidates({ me: me([asset(1, "AAA-01", "common", 5)]), catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, budget: 50 });
    const sell = cands.find((c) => c.key === "sell:1")!;
    const path = previewPath(sell);
    expect(path.prices).toEqual([26, 23, 22]);
    expect(path.rule).toBe("fixed-price");
    expect(path.outcome).toContain("accept her 13");
    expect(path.firstText).toContain("26 P");
  });

  it("formatPlan lista estado, candidatos, elegidos y primer mensaje con su precio", async () => {
    const m = me([asset(1, "AAA-01", "common", 5)]);
    const cands = await rankCandidates({ me: m, catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, budget: 50 });
    const chosen = selectCandidates(cands, { maxThreads: 2, maxSpend: 50 });
    const text = formatPlan(m, ABUELA, cands, chosen, { maxDeals: 2, maxSpend: 50, maxThreads: 2 }).join("\n");
    expect(text).toContain("cash 413 P · level 1 · deals 1 (next level unlocks early at 3 deals: 2 to go)");
    expect(text).toContain("[no room] BUY common AAA");
    expect(text).toContain("[ROOM] SELL AAA-01 (common, ONLY copy)");
    expect(text).toContain('first message (price 26): "');
    expect(text).not.toMatch(/sobre_barrio/);
  });
});
