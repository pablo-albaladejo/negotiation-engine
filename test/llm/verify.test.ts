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
    // `٬` (U+066C) es ambiguo entre 1.5 y 1500: el rango del issue decide, y una lectura fuera de él se rechaza.
    ["árabe ١٬٥٠٠ en pct [0,10] → 1.5", "نقدم ١٬٥٠٠٪", fig("pct", 1.5, "١٬٥٠٠"), pct, "verified-digits"],
    ["árabe ١٬٥٠٠ en pct leído 1500 fuera de rango", "نقدم ١٬٥٠٠٪", fig("pct", 1500, "١٬٥٠٠"), pct, "value-mismatch"],
    ["árabe ١٬٥٠٠ en price leído 1500: ambas en rango", "السعر ١٬٥٠٠", fig("price", 1500, "١٬٥٠٠"), price, "ambiguous"],
    ["árabe ١٬٥٠٠ en price leído 1.5: ambas en rango", "السعر ١٬٥٠٠", fig("price", 1.5, "١٬٥٠٠"), price, "ambiguous"],
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

  it.each<[string, string, boolean]>([
    ["1500 unidades", "500", false],
    ["1,500 unidades", "500", false],
    ["1.500 unidades", "500", false],
    ["un 1,5 %", "5 %", false],
    ["día 150", "15", false],
    ["150 días", "15", false],
    ["un 15% ya", "15", true],
    ["un 15%", "15%", true],
    ["día 15, y 500 unidades", "500", true],
    ["el 15.", "15", true],
    ["١٥٠ يوما", "١٥", false],
    ["٢٫٥٪", "٥٪", false],
    ["اليوم ١٥ ثم", "١٥", true],
    ["１５０日", "15", false],
    ["１５日", "15", true],
    ["2١٥", "١٥", false],
  ])("spanAppears en límites de cifra: %j contiene %j → %s", (text, span, expected) => {
    expect(spanAppears(text, span)).toBe(expected);
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

describe("puntos básicos y rangos (partida real b-claude-cli)", () => {
  const worseForBuyer = (_issue: string, lo: number, _hi: number) => lo;
  const conservative = { ...confirm, ranges: "conservative" as const, worse: worseForBuyer };
  it.each([
    ["133 bps", "Te ofrezco 133 bps", 1.33],
    ["512 pb", "mi oferta: 512 pb", 5.12],
    ["572 bps", "we can do 572 bps", 5.72],
    ["40 bp", "40 bp more", 0.4],
    ["25 p.b.", "subo a 25 p.b.", 0.25],
    ["150 puntos básicos", "150 puntos básicos", 1.5],
    ["75 basis points", "75 basis points", 0.75],
  ])("%s → pct en %% (valor ya convertido o en pb)", (span, text, pctValue) => {
    expect(verifyFigure(text, fig("pct", pctValue, span), pct, confirm)).toMatchObject({ ok: true, value: pctValue, confidence: "verified-digits" });
    expect(verifyFigure(text, fig("pct", pctValue * 100, span), pct, confirm)).toMatchObject({ ok: true, value: pctValue, confidence: "verified-digits" });
  });
  it("sin unidad explícita, 133 no se lee como pb", () => {
    expect(verifyFigure("Te ofrezco 133", fig("pct", 1.33, "133"), pct, confirm)).toMatchObject({ ok: false, reason: "value-mismatch" });
  });
  it("unidad de pb adicional configurada por idioma", () => {
    expect(verifyFigure("offro 120 punti base", fig("pct", 1.2, "120 punti base"), pct, confirm)).toMatchObject({ ok: false });
    expect(verifyFigure("offro 120 punti base", fig("pct", 1.2, "120 punti base"), pct, { ...confirm, bpsUnits: ["punti base"] })).toMatchObject({ ok: true, value: 1.2 });
  });
  it.each([
    ["entre 2 y 2,5 %", 2.25, [2, 2.5]],
    ["entre 3,85 y 4,35 %", 4, [3.85, 4.35]],
    ["2-2,5%", 2.5, [2, 2.5]],
  ])("rango %s con conservative: extremo peor, confianza range y ambos extremos", (span, llmValue, bounds) => {
    expect(verifyFigure(`podemos ir ${span}`, fig("pct", llmValue, span), pct, conservative)).toMatchObject({ ok: true, confidence: "range", value: bounds[0], bounds });
  });
  it("rango: con confirm es ambiguo; un valor LLM fuera del rango no se verifica", () => {
    expect(verifyFigure("entre 2 y 2,5 %", fig("pct", 2.25, "entre 2 y 2,5 %"), pct, confirm)).toMatchObject({ ok: false, reason: "ambiguous" });
    expect(verifyFigure("entre 2 y 2,5 %", fig("pct", 7, "entre 2 y 2,5 %"), pct, conservative)).toMatchObject({ ok: false, reason: "value-mismatch" });
  });
  it("una oferta con un rango tiene confianza range (nunca se acepta sobre ella)", () => {
    const text = "entre 2 y 2,5 % a 30 días";
    expect(verifyFigures(text, [fig("pct", 2.2, "entre 2 y 2,5 %"), fig("day", 30, "30 días")], issues, conservative)).toMatchObject({ ok: true, confidence: "range", offer: { pct: 2, day: 30 } });
  });
});
