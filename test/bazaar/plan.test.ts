import { describe, expect, it } from "vitest";
import { applyOnly, formatPlan, parseOnly, previewPath, rankCandidates, selectCandidates } from "../../src/bazaar/plan.js";
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

describe("plan: riesgo de repetida, carta concreta y puja desconocida", () => {
  it("rareza+set con P(repetida) > 0,34 y pérdida en el peor caso > 3 P: se descarta aunque el valor esperado supere su lista", async () => {
    // AAA uncommon: tenemos AAA-06 (vale 8 como repetida), AAA-07 vale 60 → media 34, límite 34 > lista 25, pero P(rep) 0,5 y peor caso 34 − 8 = 26.
    const values: Record<string, number> = { "AAA-01": 1, "AAA-02": 1, "AAA-06": 8, "AAA-07": 60, "BBB-01": 1, "BBB-02": 1, "BBB-06": 1 };
    const cands = await rankCandidates({ me: me([asset(1, "AAA-06", "uncommon", 8)]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, safety: 1, budget: 60, cardTopic: false });
    const aaa = cands.find((c) => c.key === "buy:AAA:uncommon")!;
    expect(aaa.duplicateP).toBe(0.5);
    expect(aaa.worstCaseLoss).toBe(26);
    expect(aaa.room).toBe(false);
    expect(aaa.why).toContain("SKIP: duplicate risk");
    expect(selectCandidates(cands, { maxThreads: 2, maxSpend: 60 }).some((s) => s.candidate.key === "buy:AAA:uncommon")).toBe(false);
  });

  it("rareza+set sin repetidas pero con valor esperado justo por encima de la lista: exige el margen (≥ 2 P o 10 %)", async () => {
    const values: Record<string, number> = { "AAA-01": 11, "AAA-02": 11, "AAA-06": 26, "AAA-07": 26, "BBB-01": 1, "BBB-02": 1, "BBB-06": 1 };
    const cands = await rankCandidates({ me: me([]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, safety: 1, budget: 60, cardTopic: false });
    const unc = cands.find((c) => c.key === "buy:AAA:uncommon")!;
    expect(unc.duplicateP).toBe(0);
    expect(unc.room).toBe(false);
    expect(unc.why).toContain("margin");
  });

  it("propone cartas concretas que nos faltan sobre su entrada de rareza+set (topic {buy:{card}}, sin probar) y las ordena primero", async () => {
    const values: Record<string, number> = { "AAA-01": 1, "AAA-02": 1, "AAA-06": 8, "AAA-07": 40, "BBB-01": 1, "BBB-02": 1, "BBB-06": 1 };
    const cands = await rankCandidates({ me: me([asset(1, "AAA-06", "uncommon", 8)]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, safety: 1, budget: 60 });
    const first = cands[0]!;
    expect(first.key).toBe("buy:AAA-07");
    expect(first.topic).toEqual({ buy: { card: "AAA-07" } });
    expect(first.cardTopicUntested).toBe(true);
    expect(first.room).toBe(true);
    expect(cands.some((c) => c.key === "buy:AAA-06")).toBe(false);
    const text = formatPlan(me([]), ABUELA, cands, selectCandidates(cands, { maxThreads: 1, maxSpend: 60 }), { maxDeals: 1, maxSpend: 60, maxThreads: 1, safety: 1 }).join("\n");
    expect(text).toContain('card topic: {buy:{card:"AAA-07"}} not yet tried live');
  });

  it("venta: su puja es desconocida; solo se abre si su techo plausible (lista × 1,3) alcanza nuestro mínimo", async () => {
    const assets = [asset(1, "AAA-01", "common", 6), asset(2, "BBB-01", "common", 14), asset(3, "BBB-01", "common", 2)];
    const cands = await rankCandidates({ me: me(assets), catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, safety: 1, budget: 50, cardTopic: false });
    const sells = cands.filter((c) => c.side === "sell");
    expect(sells.every((c) => c.bidUnknown)).toBe(true);
    expect(sells.find((c) => c.key === "sell:1")!.room).toBe(true);
    expect(sells.find((c) => c.key === "sell:3")!.room).toBe(true);
    // Repetida BBB-01 de 2 se ofrece; la copia de 14 se queda (y 14 > 13 no sería plausible).
    expect(sells.some((c) => c.key === "sell:2")).toBe(false);
    const hi = await rankCandidates({ me: me([asset(9, "AAA-02", "common", 14)]), catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, safety: 1, budget: 50, cardTopic: false });
    const s = hi.find((c) => c.key === "sell:9")!;
    expect(s.room).toBe(false);
    expect(s.why).toContain("not opened");
  });
});

describe("plan: candidatos por menú", () => {
  it("rareza+set: valor esperado sobre las cartas de esa rareza y set (repetidas valen poco); reserva = valor × 0,9; margen solo si supera su lista", async () => {
    const values: Record<string, number> = { "AAA-01": 14, "AAA-02": 14, "AAA-06": 40, "AAA-07": 30, "BBB-01": 3, "BBB-02": 13, "BBB-06": 20, "ZZZ-01": 99 };
    const cands = await rankCandidates({ me: me([asset(1, "BBB-01", "common", 13)]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, budget: 50, cardTopic: false });
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

  it("página casi completa (9/10): nuestra única copia nunca se ofrece; una repetida sí", async () => {
    const m = {
      cash: 413,
      level: 1,
      assets: [asset(1, "AAA-01", "common", 5), asset(2, "AAA-02", "common", 3), asset(3, "AAA-02", "common", 1)],
      album: { pages: [{ set: "AAA", have: 9, of: 10 }, { set: "BBB", have: 6, of: 10 }] },
      score: { deals: 1 },
    } as Me;
    const cands = await rankCandidates({ me: m, catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, budget: 50 });
    const sells = cands.filter((c) => c.side === "sell");
    const onlyCopy = sells.find((c) => c.key === "sell:1")!;
    expect(onlyCopy.copy).toBe("only");
    expect(onlyCopy.room).toBe(false);
    expect(onlyCopy.why).toContain("NEVER");
    const duplicate = sells.find((c) => c.key === "sell:3")!;
    expect(duplicate.copy).toBe("duplicate");
    expect(duplicate.room).toBe(true);
    expect(selectCandidates(cands, { maxThreads: 2, maxSpend: 50 }).map((s) => s.candidate.key)).toEqual(["sell:3"]);
  });

  it("camino previsto contra su puja fija de 13: ancla tope lista × 1,3 = 14 (no 26), y acepta 13 (precio fijo)", async () => {
    const cands = await rankCandidates({ me: me([asset(1, "AAA-01", "common", 5)]), catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, budget: 50 });
    const sell = cands.find((c) => c.key === "sell:1")!;
    expect(sell.herList).toBe(10);
    const path = previewPath(sell);
    expect(path.prices).toEqual([14]);
    expect(path.rule).toBe("stuck-accept-within-limit");
    expect(path.outcome).toContain("accept her 13");
    expect(path.firstText).toContain("14 P");
  });

  it("formatPlan lista estado, candidatos, elegidos y primer mensaje con su precio", async () => {
    const m = me([asset(1, "AAA-01", "common", 5)]);
    const cands = await rankCandidates({ me: m, catalog: CATALOG, dealer: ABUELA, valueOf: async () => 1, budget: 50 });
    const chosen = selectCandidates(cands, { maxThreads: 2, maxSpend: 50 });
    const text = formatPlan(m, ABUELA, cands, chosen, { maxDeals: 2, maxSpend: 50, maxThreads: 2 }).join("\n");
    expect(text).toContain("cash 413 P · level 1 · deals 1 (next level unlocks early at 3 deals: 2 to go)");
    expect(text).toContain("[no room] BUY common AAA");
    expect(text).toContain("[ROOM] SELL AAA-01 (common, ONLY copy)");
    expect(text).toContain('first message (price 14): "');
    expect(text).not.toMatch(/sobre_barrio/);
  });

  it("--only: solo esos objetivos, en ese orden, con límite = valor (safety 1) aunque no dejen margen sobre su lista", async () => {
    const values: Record<string, number> = { "AAA-01": 9, "AAA-02": 9.4, "AAA-06": 24, "AAA-07": 24.8, "BBB-01": 30, "BBB-02": 30, "BBB-06": 60 };
    const only = parseOnly("buy:uncommon:AAA, buy:common:AAA");
    expect(only).toEqual([
      { raw: "buy:uncommon:AAA", side: "buy", tokens: ["uncommon", "aaa"] },
      { raw: "buy:common:AAA", side: "buy", tokens: ["common", "aaa"] },
    ]);
    expect(() => parseOnly("swap:common:AAA")).toThrow(/buy: o sell:/);
    expect(() => parseOnly("buy")).toThrow();
    const ranked = await rankCandidates({ me: me([]), catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, safety: 1, budget: 40, cardTopic: false });
    const cands = applyOnly(ranked, only);
    expect(cands.map((c) => [c.key, c.reservation, c.room])).toEqual([
      ["buy:AAA:uncommon", 24, false],
      ["buy:AAA:common", 9, false],
    ]);
    // Sin --only no abriría nada de AAA (sin margen) y elegiría las de BBB.
    expect(selectCandidates(ranked, { maxThreads: 2, maxSpend: 40 }).some((s) => s.candidate.set === "AAA")).toBe(false);
    const chosen = selectCandidates(cands, { maxThreads: 2, maxSpend: 40, only: true });
    expect(chosen.map((s) => [s.candidate.key, s.candidate.reservation])).toEqual([
      ["buy:AAA:uncommon", 24],
      ["buy:AAA:common", 9],
    ]);
    expect(chosen[0]!.reason).toContain("needs her below list");
    expect(selectCandidates(cands, { maxThreads: 2, maxSpend: 30, only: true }).map((s) => s.candidate.reservation)).toEqual([24, 6]);
    expect(applyOnly(ranked, parseOnly("sell:common:AAA"))).toEqual([]);
  });

  it("formatPlan con --only: valor, límite, lista/apertura, ancla, camino en la paciencia y primer mensaje", async () => {
    const values: Record<string, number> = { "AAA-01": 9, "AAA-02": 9.4, "AAA-06": 24, "AAA-07": 24.8, "BBB-01": 3, "BBB-02": 3, "BBB-06": 3 };
    const m = me([]);
    const ranked = await rankCandidates({ me: m, catalog: CATALOG, dealer: ABUELA, valueOf: async (c) => values[c]!, safety: 1, budget: 40, cardTopic: false });
    const cands = applyOnly(ranked, parseOnly("buy:uncommon:AAA,buy:common:AAA"));
    const chosen = selectCandidates(cands, { maxThreads: 2, maxSpend: 40, only: true });
    const text = formatPlan(m, ABUELA, cands, chosen, { maxDeals: 2, maxSpend: 40, maxThreads: 2, safety: 1 }).join("\n");
    expect(text).toContain("our value 24.4 · our limit 24 (value × 1, capped by spend/cash) · her list 25 · her opening 29");
    expect(text).toContain("anchor 22 · planned path within 6 exchanges (step mode adaptive, max step 3): 22 → 23 → 24");
    expect(text).toContain("our value 9.2 · our limit 9");
    expect(text).toContain("anchor 8 · planned path within 6 exchanges (step mode adaptive, max step 3): 8 → 9");
    expect(text).toMatch(/first message \(price 22\): "[^"]*22 P/);
  });
});
