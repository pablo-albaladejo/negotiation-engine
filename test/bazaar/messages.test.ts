import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { closeText, counterText, DEALER_TEMPLATES, hasBlockedPhrase, holdText, isProbePhrase, numbersIn, TEMPLATE_BLOCKLIST, textMatchesPrice } from "../../src/dealers/negotiation/messages.js";
import { DUEL_TEMPLATES } from "../../src/duels/duels.js";
import { decide, DEFAULT_NEGOTIATOR_PARAMS } from "../../src/dealers/negotiation/negotiator.js";

const decideParams = { ...DEFAULT_NEGOTIATOR_PARAMS, maxHolds: 3 };

describe("message templates", () => {
  it("do not name any dealer (thread 257: we called El Chato \"Abuela Carmen\")", () => {
    const texts: string[] = [];
    for (let round = 0; round < 12; round++) {
      texts.push(counterText("buy", round, 17), counterText("sell", round, 17), holdText(round, 17), closeText(round));
    }
    for (const t of texts) expect(t).not.toMatch(/abuela|carmen|chato/i);
  });

  it("the figure in the text is the offer's", () => {
    for (let round = 0; round < 8; round++) {
      expect(textMatchesPrice(counterText("sell", round, 23), 23)).toBe(true);
      expect(textMatchesPrice(holdText(round, 23), 23)).toBe(true);
    }
  });
});

describe("egg probe riding on a counteroffer", () => {
  it("the probe carries no digits and the only figure in the message is the price", () => {
    const phrase = fc.oneof(fc.string({ maxLength: 45 }), fc.constantFrom("the blue door", "Plaza Mayor 1", "El Rastro", "SAL-09", "la gata", "año 1985"));
    fc.assert(
      fc.property(fc.constantFrom("buy" as const, "sell" as const), fc.integer({ min: 0, max: 12 }), fc.integer({ min: 1, max: 999 }), phrase, (side, round, price, x) => {
        const text = counterText(side, round, price, x);
        expect(textMatchesPrice(text, price)).toBe(true);
        expect(numbersIn(text)).toEqual([price]);
        if (/\d/.test(x)) expect(isProbePhrase(x)).toBe(false);
        if (isProbePhrase(x)) {
          expect(x).not.toMatch(/\d/);
          expect(text.endsWith(`Do you know about ${x.trim()}?`)).toBe(true);
        } else expect(text).toBe(counterText(side, round, price));
      }),
    );
  });
});

describe("courtesy and blacklist (site-map § 9.2)", () => {
  const all = [...DEALER_TEMPLATES, ...DUEL_TEMPLATES];
  it("every dealer and duel template is polite (please / thank) and carries no blacklist phrases", () => {
    for (const t of all) {
      expect(t).toMatch(/please|thank/i);
      for (const w of ["ignore", "instructions", "last one", "other offer", "deadline", "lowest price"]) expect(t.toLowerCase()).not.toContain(w);
      expect(hasBlockedPhrase(t)).toBe(false);
    }
  });

  it("a probe with a blacklist phrase is not added", () => {
    for (const w of TEMPLATE_BLOCKLIST) expect(isProbePhrase(`the ${w} thing`.replace(/\s+/g, " "))).toBe(false);
  });
});

describe("never two messages without an offer in a row", () => {
  it("after a hold (text only) the negotiator does not hold again", () => {
    fc.assert(
      fc.property(fc.constantFrom("buy" as const, "sell" as const), fc.integer({ min: 2, max: 60 }), fc.array(fc.integer({ min: 1, max: 80 }), { minLength: 1, maxLength: 8 }), fc.integer({ min: 1, max: 80 }), (side, reservation, ours, her) => {
        const d = decide({ side, reservation, herOpening: her, herPrices: [her], ourPrices: ours, herCurrent: { offerId: 1, price: her, final: false }, canMessage: true, canAccept: true, holdsUsed: 0, lastWasTextOnly: true }, { ...decideParams });
        expect(d.action.kind).not.toBe("hold");
      }),
    );
  });
});
