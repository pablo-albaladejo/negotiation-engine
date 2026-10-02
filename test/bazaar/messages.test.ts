import { describe, expect, it } from "vitest";
import { closeText, counterText, holdText, textMatchesPrice } from "../../src/dealers/messages.js";

describe("plantillas de mensajes", () => {
  it("no nombran a ningún dealer (hilo 257: llamamos «Abuela Carmen» a El Chato)", () => {
    const texts: string[] = [];
    for (let round = 0; round < 12; round++) {
      texts.push(counterText("buy", round, 17), counterText("sell", round, 17), holdText(round, 17), closeText(round));
    }
    for (const t of texts) expect(t).not.toMatch(/abuela|carmen|chato/i);
  });

  it("la cifra del texto es la de la oferta", () => {
    for (let round = 0; round < 8; round++) {
      expect(textMatchesPrice(counterText("sell", round, 23), 23)).toBe(true);
      expect(textMatchesPrice(holdText(round, 23), 23)).toBe(true);
    }
  });
});
