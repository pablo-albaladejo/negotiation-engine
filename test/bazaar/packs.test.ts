import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { proposePacks, type PackType } from "../../src/packs/packs.js";

// Guardarraíles de la ruta de sobres: nunca vender cerrado por debajo de nuestro valor, nunca comprar a un
// precio que no esté por debajo de la apertura (no contaría para la escalera) ni bajo el suelo de caja.
const type = (over: Partial<PackType> = {}): PackType => ({ id: "sobre_x", slots: [], dealers: [{ persona: "d1", list: 26, opening: 30 }], ourValue: 40, ...over });
const base = { cashFloor: 20, unlocked: ["d1"], dealers: [], incoming: [] };

describe("packs route guardrails", () => {
  it("never lists a sealed pack below our value", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 300 }), fc.integer({ min: 1, max: 300 }), (bid, value) => {
        const p = proposePacks({ ...base, packs: { sealed: [{ assetId: 1, ref: "sobre_x", value }], types: [type({ bestBid: { price: bid, offer: 9 } })] } });
        for (const i of p.intents.filter((x) => x.kind === "listing")) expect(i.price!).toBeGreaterThanOrEqual(value);
      }),
    );
  });

  it("never proposes a dealer pack buy at or above the opening price, nor below the cash floor", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 60 }), fc.integer({ min: 0, max: 200 }), (deal, cash) => {
        const p = proposePacks({ ...base, cash, packs: { sealed: [], types: [type({ lastDeal: { price: deal, tick: 1 } })] } });
        const buys = p.intents.filter((x) => x.id.startsWith("packs:buy"));
        if (deal >= 30 || cash - 20 <= deal) expect(buys).toEqual([]);
      }),
    );
  });
});
