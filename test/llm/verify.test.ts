import { describe, expect, it } from "vitest";
import type { Issue } from "../../src/engine/config.js";
import { spanAppears, verifyFigure, verifyFigures } from "../../src/llm/verify.js";

const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.7 };
const day: Issue = { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.3 };
const price: Issue = { name: "price", min: 0, max: 5000, direction: "lower-better", weight: 1 };
const issues = [pct, day];
const confirm = { acceptWordNumbers: "confirm" as const };
const llmOnly = { acceptWordNumbers: "llm-only" as const };
const fig = (issue: string, value: number, evidence: string) => ({ issue, value, evidence });

describe("verifyFigure: tabla de casos", () => {
  const cases: [string, string, ReturnType<typeof fig>, Issue, string, string?][] = [
    // [nombre, texto, cifra, issue, resultado esperado (confianza o motivo)]
    ["ASCII", "Te ofrezco 3 % a 30 días", fig("pct", 3, "3 %"), pct, "verified-digits"],
    ["arábigo-índicos", "نقبل ٢٫٥٪ والدفع في اليوم ١٥", fig("pct", 2.5, "٢٫٥٪"), pct, "verified-digits"],
    ["arábigo-índicos día", "نقبل ٢٫٥٪ والدفع في اليوم ١٥", fig("day", 15, "١٥"), day, "verified-digits"],
    ["persas", "تخفیف ۳٪", fig("pct", 3, "۳٪"), pct, "verified-digits"],
    ["devanagari", "हम ३ % देंगे", fig("pct", 3, "३ %"), pct, "verified-digits"],
    ["ancho completo", "２．５％でお願いします", fig("pct", 2.5, "２．５％"), pct, "verified-digits"],
    ["coma decimal con miles 1.234,5", "precio 1.234,5 euros", fig("price", 1234.5, "1.234,5"), price, "verified-digits"],
    ["punto decimal con miles 1,234.5", "price 1,234.5 dollars", fig("price", 1234.5, "1,234.5"), price, "verified-digits"],
    ["1.234,5 leído como 1,2345 no casa", "precio 1.234,5 euros", fig("price", 1.2345, "1.234,5"), price, "value-mismatch"],
    ["rango desambigua 2.500", "we can do 2.500 percent", fig("pct", 2.5, "2.500"), pct, "verified-digits"],
    ["pb a %", "300 pb y listo", fig("pct", 3, "300 pb"), pct, "verified-digits"],
    ["fragmento inventado", "te doy un 2 %", fig("pct", 1.5, "1,5 %"), pct, "span-not-found"],
    ["fragmento con ancho cero coincide", "te doy un 2​%", fig("pct", 2, "2%"), pct, "verified-digits"],
    ["valor que no corresponde", "te doy un 3 %", fig("pct", 0.3, "3 %"), pct, "value-mismatch"],
    ["fracción ambigua en rango", "ofrezco 0.03", fig("pct", 3, "0.03"), pct, "ambiguous"],
    ["rango no es cifra", "entre 2 y 4 %", fig("pct", 3, "entre 2 y 4 %"), pct, "ambiguous"],
    ["fuera del rango del issue", "te doy 15 %", fig("pct", 15, "15 %"), pct, "value-mismatch"],
    ["palabras es", "podríamos cerrar en dos y medio", fig("pct", 2.5, "dos y medio"), pct, "verified-words"],
    ["palabras en", "fifteen days works", fig("day", 15, "fifteen"), day, "verified-words"],
    ["palabras que no casan", "podríamos cerrar en dos y medio", fig("pct", 3, "dos y medio"), pct, "value-mismatch"],
    ["palabras ja con confirm", "二・五パーセントで、十五日払い", fig("pct", 2.5, "二・五パーセント"), pct, "words-unverifiable"],
  ];
  it.each(cases)("%s", (_name, text, figure, issue, expected) => {
    const check = verifyFigure(text, figure, issue, confirm);
    if (expected.startsWith("verified")) expect(check).toMatchObject({ ok: true, confidence: expected });
    else expect(check).toMatchObject({ ok: false, reason: expected });
  });

  it("palabras de idioma no cubierto con llm-only: aceptada con confianza llm-only", () => {
    expect(verifyFigure("二・五パーセントで", fig("pct", 2.5, "二・五パーセント"), pct, llmOnly)).toMatchObject({ ok: true, confidence: "llm-only" });
  });

  it("spanAppears: vacío nunca aparece; mayúsculas y espacios se pliegan", () => {
    expect(spanAppears("Hola", "")).toBe(false);
    expect(spanAppears("Einverstanden,  das nehmen wir", "einverstanden, das")).toBe(true);
  });
});

describe("verifyFigures: oferta derivada", () => {
  const text = "نقبل ٢٫٥٪ والدفع في اليوم ١٥";

  it("todas verificadas ⇒ oferta con la peor confianza", () => {
    const result = verifyFigures(text, [fig("pct", 2.5, "٢٫٥٪"), fig("day", 15, "١٥")], issues, confirm);
    expect(result).toMatchObject({ ok: true, offer: { pct: 2.5, day: 15 }, confidence: "verified-digits" });
    const mixed = verifyFigures("dos y medio pagando el 15", [fig("pct", 2.5, "dos y medio"), fig("day", 15, "el 15")], issues, confirm);
    expect(mixed).toMatchObject({ ok: true, confidence: "verified-words" });
  });

  it("oferta parcial ⇒ partial", () => {
    expect(verifyFigures(text, [fig("pct", 2.5, "٢٫٥٪")], issues, confirm)).toMatchObject({ ok: false, reason: "partial" });
    expect(verifyFigures(text, [], issues, confirm)).toMatchObject({ ok: false, reason: "partial" });
  });

  it("dos valores distintos para un issue ⇒ ambiguous; una cifra fallida tumba la oferta", () => {
    expect(verifyFigures("3 % o 2 % y día 15", [fig("pct", 3, "3 %"), fig("pct", 2, "2 %"), fig("day", 15, "día 15")], issues, confirm)).toMatchObject({ ok: false, reason: "ambiguous" });
    expect(verifyFigures(text, [fig("pct", 2.5, "٢٫٥٪"), fig("day", 16, "١٥")], issues, confirm)).toMatchObject({ ok: false, reason: "value-mismatch" });
  });
});
