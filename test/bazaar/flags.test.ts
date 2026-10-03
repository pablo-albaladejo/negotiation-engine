import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { detectFlag, indexCatalog } from "../../src/flags/flags.js";

// Guardarraíl del detector de flags: un flag erróneo cuesta puntos, así que solo hay candidato con una
// contradicción verificable entre el texto y la ESTRUCTURA de la oferta del mismo mensaje.
const catalog = {
  sets: [
    {
      id: "LAT",
      cards: [
        { id: "LAT-04", name: "Mercado de la Cebada", rarity: "common" },
        { id: "LAT-09", name: "Teatro Pavón", rarity: "rare" },
      ],
    },
    {
      id: "MAL",
      cards: [
        { id: "MAL-02", name: "Plaza del Dos de Mayo", rarity: "common" },
        { id: "MAL-10", name: "Café Comercial", rarity: "epic" },
      ],
    },
  ],
};
const idx = indexCatalog(catalog);
const cards = catalog.sets.flatMap((s) => s.cards);
const sells = (ref: string) => ({ give: { types: [`card:${ref}`] }, want: { cash: 10 } });

describe("flags detector guardrails", () => {
  it("never flags when the text agrees with the offer structure", () => {
    fc.assert(
      fc.property(fc.constantFrom(...cards), fc.integer({ min: 1, max: 99 }), fc.boolean(), (c, price, withRarity) => {
        const text = `Look, ${c.name}${withRarity ? `, a lovely ${c.rarity} card` : ""}, ${price} P. One card, cariño.`;
        expect(detectFlag({ id: 1, text, offer: sells(c.id) }, idx)).toBeUndefined();
      }),
    );
  });

  it("never flags without a structural contradiction (no offer, no card named, tone only)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...cards), fc.constantFrom("Last chance, hurry!", "My grandchildren would pay more!", "This is my last offer.", "Take it or leave it, 30 P."), (c, text) => {
        expect(detectFlag({ id: 2, text, offer: sells(c.id) }, idx)).toBeUndefined();
        expect(detectFlag({ id: 3, text: `${c.name}, ${text}` }, idx)).toBeUndefined();
      }),
    );
  });

  it("flags a named card that is not the one in the offer", () => {
    const f = detectFlag({ id: 4, text: "Here you are: Café Comercial, 40 P.", offer: sells("LAT-04") }, idx);
    expect(f?.verifiable).toBe(true);
    expect(f?.namedCard).toBe("MAL-10");
  });
});
