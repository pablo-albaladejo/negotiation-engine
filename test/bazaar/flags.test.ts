import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { detectFlag, detectPressure, indexCatalog, pressureTactic } from "../../src/flags/flags.js";

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

describe("pressure-line flags guardrails (closed list, counter-offers only)", () => {
  const pressure = ["Decide now, we close in a minute.", "Another buyer offered more this morning.", "It is the last one anywhere, cariño.", "Someone else already offered more."];
  const voice = ["Last chance, hurry!", "My grandchildren would pay more!", "This is my last offer.", "Take it or leave it.", "Same as a minute ago.", "No hurry, hijo."];
  const text = fc.tuple(fc.constantFrom(...pressure, ...voice), fc.integer({ min: 1, max: 999 }), fc.string({ maxLength: 20 })).map(([t, p, s]) => `${s} ${t} ${p} P.`);
  const offer = { give: { cash: 12 }, want: { types: ["card:LAT-04"] } };

  it("never flags without a closed-list match plus a dealer counter-offer", () => {
    fc.assert(
      fc.property(text, fc.boolean(), fc.boolean(), (t, counter, withOffer) => {
        const f = detectPressure({ id: 7, text: t, ...(withOffer ? { offer } : {}) }, counter);
        if (!counter || !withOffer || pressureTactic(t) === undefined) expect(f).toBeUndefined();
        else expect(f?.tactic).toBe(pressureTactic(t));
        if (f) expect(f.verifiable).toBe(false);
      }),
    );
    for (const t of voice) expect(pressureTactic(t)).toBeUndefined();
    for (const t of pressure) expect(pressureTactic(t)).toBeDefined();
    expect(detectPressure({ id: 8, text: "A little present from me, and it is the last one anywhere.", offer }, true)).toBeUndefined();
  });

  it("the detector never outputs a number", () => {
    fc.assert(
      fc.property(text, (t) => {
        const tactic = pressureTactic(t);
        expect(tactic === undefined || ["fake_deadline", "fake_rival", "false_scarcity"].includes(tactic)).toBe(true);
        const f = detectPressure({ id: 9, text: t, offer }, true);
        for (const [k, v] of Object.entries(f ?? {})) {
          if (k === "messageId") continue;
          expect(typeof v).not.toBe("number");
          if (typeof v === "string") expect(v).not.toMatch(/\d/);
        }
      }),
    );
  });
});
