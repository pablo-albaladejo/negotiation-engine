import { describe, expect, it } from "vitest";
import type { GameSetup } from "../../src/arena/participant.js";
import { createTextOnlyBot, DAY_FORMS, numberToWords, PCT_FORMS, renderDay, renderOfferText, renderPct } from "../../src/bots/text-only.js";
import type { Issue } from "../../src/engine/config.js";
import { createRng } from "../../src/engine/rng.js";
import { normalizeNumbers, type NumberMention } from "../../src/llm/numbers.js";

const numbers = (text: string) => normalizeNumbers(text);

describe("bot de solo texto: formas del normalizador", () => {
  const values = [0.5, 1, 2.5, 3.37, 4.05, 7.25, 9.9, 10];

  it.each(PCT_FORMS.filter((f) => f !== "range" && f !== "fraction"))("pct en forma %s se normaliza al valor real", (form) => {
    for (const value of values) {
      for (let seed = 0; seed < 4; seed++) {
        const text = renderPct(value, form, createRng(seed));
        const mentions = numbers(text);
        expect(mentions, text).toHaveLength(1);
        const m = mentions[0] as NumberMention;
        expect(m.kind, text).toBe("number");
        expect(m.ambiguous, text).toBe(false);
        expect(m.unit, text).not.toBe("none");
        expect(m.value, text).toBeCloseTo(value, 9);
      }
    }
  });

  it("los rangos se leen como rango y las fracciones como cifra ambigua (no son ofertas)", () => {
    for (const value of values) {
      expect(numbers(renderPct(value, "range"))[0]!.kind).toBe("range");
      const fraction = numbers(renderPct(value, "fraction"))[0] as NumberMention;
      expect(fraction.ambiguous).toBe(true);
      expect(fraction.readings.some((r) => Math.abs(r - value) < 1e-9)).toBe(true);
    }
  });

  it.each(DAY_FORMS)("día en forma %s se normaliza al valor real", (form) => {
    for (const day of [5, 15, 21, 30, 45, 60]) {
      const mentions = numbers(renderDay(day, form));
      expect(mentions).toHaveLength(1);
      expect((mentions[0] as NumberMention).value).toBe(day);
    }
  });

  it("palabras en ES y EN, con medio y decimales cifra a cifra", () => {
    expect(numberToWords(2.5, "es")).toBe("dos y medio");
    expect(numberToWords(3.37, "es")).toBe("tres coma tres siete");
    expect(numberToWords(21, "es")).toBe("veintiuno");
    expect(numberToWords(45, "es")).toBe("cuarenta y cinco");
    expect(numberToWords(2.5, "en")).toBe("two and a half");
    expect(numberToWords(4.05, "en")).toBe("four point zero five");
  });

  it("con muchas semillas aparecen todas las formas", () => {
    const seen = new Set<string>();
    const rng = createRng(3);
    for (let k = 0; k < 300; k++) for (const f of renderOfferText({ pct: 2.5, day: 30 }, rng).forms) seen.add(f);
    for (const f of PCT_FORMS) expect(seen).toContain(f);
    for (const f of DAY_FORMS) expect(seen).toContain(`day-${f}`);
  });
});

describe("bot de solo texto: mensajes de la partida", () => {
  const issues: Issue[] = [{ name: "pct", min: 0, max: 10, direction: "higher-better", weight: 1 }];
  const setup: GameSetup = { sessionId: "t", scenarioId: "x", issues, mandate: { role: "seller", reservation: { pct: 7 } }, seed: 9, mode: "text-only" };

  it("expone su oferta real en la salida canónica y la escribe solo en el texto", async () => {
    const session = await createTextOnlyBot().start(setup);
    for (let round = 1; round <= 5; round++) {
      const out = await session.respond({ sessionId: "t", round, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 10 } });
      expect(out.action).toBe("counter");
      if (out.action !== "counter") continue;
      const readings = numbers(out.text).flatMap((m) => (m.kind === "range" ? [m.from, m.to] : m.readings));
      expect(readings.some((r) => Math.abs(r - out.offer.pct!) < 1e-9), out.text).toBe(true);
    }
  });

  it("acepta sin cifras", async () => {
    const session = await createTextOnlyBot().start(setup);
    const out = await session.respond({ sessionId: "t", round: 2, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 1 } });
    expect(out.action).toBe("accept");
    expect(numbers(out.text)).toHaveLength(0);
  });

  it("es determinista por semilla", async () => {
    const play = async () => {
      const session = await createTextOnlyBot().start(setup);
      const texts: string[] = [];
      for (let round = 1; round <= 5; round++) {
        texts.push((await session.respond({ sessionId: "t", round, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 10 } })).text);
      }
      return texts;
    };
    expect(await play()).toEqual(await play());
  });
});
