import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { detectFlag, detectPressure, indexCatalog, pressureTactic } from "../../src/flags/flags.js";

// Flags detector guardrail: a wrong flag costs points, so there is a candidate only with a
// verifiable contradiction between the text and the STRUCTURE of the offer in the same message.
const catalog = {
  sets: [
    {
      id: "LAT",
      cards: [
        { id: "LAT-04", name: "Mercado de la Cebada", rarity: "common" },
        { id: "LAT-09", name: "Teatro Pavón", rarity: "rare" },
        { id: "LAT-06", name: "La Chulapa", rarity: "epic" },
      ],
    },
    {
      id: "MAL",
      cards: [
        { id: "MAL-02", name: "Plaza del Dos de Mayo", rarity: "common" },
        { id: "MAL-10", name: "Café Comercial", rarity: "epic" },
      ],
    },
    { id: "RET", cards: [{ id: "RET-02", name: "La Castañera", rarity: "common" }] },
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

  it("flags a named card of the same set that is not the one in the offer (the trickster's switch)", () => {
    const f = detectFlag({ id: 4, text: "Here you are: Teatro Pavón, 40 P.", offer: sells("LAT-04") }, idx);
    expect(f?.verifiable).toBe(true);
    expect(f?.namedCard).toBe("LAT-09");
  });

  it("never flags a card named from another set than the offered one", () => {
    fc.assert(
      fc.property(fc.constantFrom(...cards), fc.constantFrom(...cards), fc.integer({ min: 1, max: 99 }), (named, offered, price) => {
        fc.pre(named.id.split("-")[0] !== offered.id.split("-")[0]);
        expect(detectFlag({ id: 5, text: `Look, ${named.name}, ${price} P.`, offer: sells(offered.id) }, idx)).toBeUndefined();
      }),
    );
  });

  it("never flags a card name the dealer echoes from our own probe or an egg phrase (message 4743, tick 506)", () => {
    const egg = "Ay, qué lista eres, cariño! Let us say ten P, yes? And shh... la chulapa dorada... there was only ever one, hijo. Ask him about the Moscow gold. He will know.";
    expect(detectFlag({ id: 4743, text: egg, offer: sells("RET-02") }, idx)).toBeUndefined();
    fc.assert(
      fc.property(fc.constantFrom(...cards), fc.constantFrom(...cards), fc.constantFrom("the legend of {c}", "{c} of old", "the golden {c}"), (named, offered, tpl) => {
        const probe = tpl.replace("{c}", named.name);
        expect(detectFlag({ id: 6, text: `Ah, ${probe}... a story, cariño. 12 P.`, offer: sells(offered.id) }, idx, [probe])).toBeUndefined();
      }),
    );
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
