import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Issue } from "../../src/engine/config.js";
import { withinOfferMandate, type Offer } from "../../src/engine/issues.js";
import { detectLeak, type LeakContext } from "../../src/llm/leak.js";
import { formatNumber, renderTemplate, templateLanguage, templateVariant, TEMPLATE_PACKS } from "../../src/llm/template.js";
import { validateText, type TextCheck } from "../../src/llm/validator.js";

interface ValidatorFixture {
  name: string;
  decision: { action: TextCheck["action"]; offer?: Offer };
  text: string;
  valid: boolean;
}
interface LeakFixtures {
  context: Omit<LeakContext, "decided">;
  cases: { name: string; text: string; decided: Offer | null; leak: boolean }[];
}

const validatorFixtures = JSON.parse(readFileSync("test/fixtures/llm/validator.json", "utf8")) as ValidatorFixture[];
const leakFixtures = JSON.parse(readFileSync("test/fixtures/llm/leak.json", "utf8")) as LeakFixtures;

describe("validador de salida", () => {
  it.each(validatorFixtures.map((f) => [f.name, f] as const))("%s", (_name, fixture) => {
    const result = validateText({ ...fixture.decision, text: fixture.text });
    expect(result.ok, JSON.stringify(result)).toBe(fixture.valid);
  });
});

describe("detector de fugas", () => {
  it.each(leakFixtures.cases.map((c) => [c.name, c] as const))("%s", (_name, fixture) => {
    const ctx: LeakContext = { ...leakFixtures.context };
    if (fixture.decided) ctx.decided = fixture.decided;
    const result = detectLeak(fixture.text, ctx);
    expect(result.leak, JSON.stringify(result)).toBe(fixture.leak);
  });

  it("los motivos no contienen el valor de la reserva", () => {
    const result = detectLeak("mi máximo es 7,25 %", {
      ...leakFixtures.context,
      reservation: { pct: 7.25 },
    });
    expect(result.leak).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/7\.25/);
  });
});

describe("plantilla determinista", () => {
  const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.5 };
  const day: Issue = { name: "day", min: 0, max: 90, direction: "lower-better", weight: 0.5 };

  const scenario = fc
    .record({
      twoIssues: fc.boolean(),
      pctValue: fc.double({ min: 0, max: 10, noNaN: true }),
      dayValue: fc.integer({ min: 0, max: 90 }),
      pctRes: fc.double({ min: 0, max: 10, noNaN: true }),
      dayRes: fc.integer({ min: 0, max: 90 }),
      action: fc.constantFrom("accept" as const, "counter" as const, "walk" as const),
      confirm: fc.boolean(),
    })
    .map((s) => {
      const issues = s.twoIssues ? [pct, day] : [{ ...pct, weight: 1 }];
      // Oferta dentro del mandato: reserva del comprador no mejor que la oferta.
      const offer: Offer = s.twoIssues ? { pct: s.pctValue, day: s.dayValue } : { pct: s.pctValue };
      const reservation: Offer = s.twoIssues
        ? { pct: Math.min(s.pctRes, s.pctValue), day: Math.max(s.dayRes, s.dayValue) }
        : { pct: Math.min(s.pctRes, s.pctValue) };
      return { issues, offer, reservation, action: s.action, confirm: s.confirm };
    });

  it("la plantilla pasa validador y detector de fugas para toda decisión dentro del mandato", () => {
    fc.assert(
      fc.property(scenario, ({ issues, offer, reservation, action, confirm }) => {
        expect(withinOfferMandate(issues, { role: "buyer", reservation }, offer)).toBe(true);
        const decision = action === "walk" ? { action } : { action, offer };
        const text = renderTemplate(action === "counter" && confirm ? { ...decision, ask: "confirm-figures" } : decision);
        const validation = validateText({ ...decision, text });
        expect(validation, text).toEqual({ ok: true });
        const leakCtx: LeakContext = { issues, reservation };
        if (action !== "walk") leakCtx.decided = offer;
        expect(detectLeak(text, leakCtx), text).toEqual({ leak: false });
      }),
    );
  });

  it("accept repite los valores de cada issue", () => {
    const text = renderTemplate({ action: "accept", offer: { pct: 2, day: 20 } });
    expect(text).toContain("2 %");
    expect(text).toContain("día 20");
  });

  it("formatea con coma decimal y sin ambigüedad de miles", () => {
    expect(formatNumber(2.5)).toBe("2,5");
    expect(formatNumber(3)).toBe("3");
    expect(formatNumber(2.345)).toBe("2,3450");
    expect(formatNumber(1500)).toBe("1500");
  });

  describe("variedad de la plantilla", () => {
    it("al menos 4 formulaciones por intención y por idioma cubierto", () => {
      for (const pack of Object.values(TEMPLATE_PACKS)) {
        for (const list of [pack.accept, pack.counter, pack.confirmFigures, pack.confirmAcceptance, pack.walk]) expect(list.length).toBeGreaterThanOrEqual(4);
      }
    });
    it("rotación determinista: misma sesión y ronda ⇒ mismo texto; rondas consecutivas nunca repiten", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 20 }), fc.integer({ min: 1, max: 200 }), fc.constantFrom("en", "es"), fc.constantFrom("accept" as const, "counter" as const, "walk" as const), (sid, round, lang, action) => {
          const d = (r: number) => renderTemplate({ action, offer: { pct: 2.5, day: 20 }, variant: templateVariant(sid, r) }, lang);
          expect(d(round)).toBe(d(round));
          expect(d(round + 1)).not.toBe(d(round));
        }),
      );
    });
    it("propiedad: toda formulación y toda petición con cifras del rival pasan validador y fugas", () => {
      fc.assert(
        fc.property(scenario, fc.constantFrom("en", "es"), fc.nat(50), fc.option(fc.tuple(fc.double({ min: 0, max: 10, noNaN: true }), fc.double({ min: 0, max: 10, noNaN: true })), { nil: undefined }), (s, lang, variant, bounds) => {
          if (s.action === "walk") return;
          const round2 = (x: number) => Math.round(x * 100) / 100;
          const echo = bounds && s.action === "counter" ? { kind: "range" as const, issue: "pct", bounds: [round2(Math.min(...bounds)), round2(Math.max(...bounds))] as [number, number] } : undefined;
          const decision = { action: s.action, offer: s.offer, variant, ...(s.action === "counter" ? { ask: "confirm-figures" as const } : {}), ...(echo ? { echo } : {}) };
          const text = renderTemplate(decision, lang);
          const check = { action: s.action, offer: s.offer, text, language: lang, coherence: "strict" as const, ...(echo ? { echoed: echo.bounds } : {}) };
          expect(validateText(check), text).toMatchObject({ ok: true });
          // Sin eco, la plantilla nunca se acerca a la reserva; con eco, el pipeline descarta el eco si el detector lo bloquea.
          if (!echo) expect(detectLeak(text, { issues: s.issues, reservation: s.reservation, decided: s.offer }), text).toEqual({ leak: false });
        }),
      );
    });
    it("el detector exime exactamente las cifras repetidas del rival, aunque toquen la reserva", () => {
      const text = renderTemplate({ action: "counter", offer: { pct: 2 }, ask: "confirm-figures", echo: { kind: "range", issue: "pct", bounds: [3, 3.5] } }, "es");
      expect(text).toMatch(/^¿Es un 3 o un 3,5 %\?/);
      expect(detectLeak(text, { issues: [pct], reservation: { pct: 3 }, decided: { pct: 2 } })).toMatchObject({ leak: true });
      expect(detectLeak(text, { issues: [pct], reservation: { pct: 3 }, decided: { pct: 2 }, echoed: [3, 3.5] })).toEqual({ leak: false });
      // Otra cifra cercana a la reserva que no es la repetida sigue bloqueándose.
      expect(detectLeak(`${text} Mi límite real es 3,01 %.`, { issues: [pct], reservation: { pct: 3 }, decided: { pct: 2 }, echoed: [3.5] })).toMatchObject({ leak: true });
    });
  });


  describe("validador, fugas y plantilla independientes del idioma (5.1–5.3)", () => {
  const issues2 = [pct, day];
  it("cifra de otra escritura no decidida: rechazada", () => {
    const r = validateText({ action: "counter", offer: { pct: 2 }, text: "Propongo 2 %, no ２．８％", language: "es" });
    expect(r).toMatchObject({ ok: false, reasons: expect.arrayContaining([expect.stringMatching(/cifra no decidida/)]) });
  });
  it("cifra decidida en dígitos arábigo-índicos: aceptada", () => {
    expect(validateText({ action: "counter", offer: { pct: 2 }, text: "نقترح ٢٪", language: "ar" })).toEqual({ ok: true, coherence: "unchecked" });
  });
  it("idioma no cubierto: known-languages aprueba con coherence unchecked; strict rechaza", () => {
    const text = "２％でいかがでしょうか";
    expect(validateText({ action: "counter", offer: { pct: 2 }, text, language: "ja" })).toEqual({ ok: true, coherence: "unchecked" });
    expect(validateText({ action: "counter", offer: { pct: 2 }, text, language: "ja", coherence: "strict" })).toMatchObject({ ok: false });
  });
  it("coherencia por idioma: un accept en inglés con palabras en inglés pasa; con solo palabras españolas, no", () => {
    expect(validateText({ action: "accept", offer: { pct: 2 }, text: "Agreed: 2%", language: "en" })).toEqual({ ok: true });
    expect(validateText({ action: "accept", offer: { pct: 2 }, text: "Acepto 2 %", language: "en" })).toMatchObject({ ok: false });
  });
  it.each([
    ["árabe", "نقدم ٣٪ فقط"],
    ["ancho completo", "３％でお願いします"],
    ["palabras es", "mi máximo es tres por ciento"],
    ["palabras en", "my limit is three percent"],
  ])("fuga de la reserva 3 %% en %s: bloqueada", (_name, text) => {
    expect(detectLeak(text, { issues: issues2, reservation: { pct: 3, day: 40 }, decided: { pct: 2, day: 20 } })).toMatchObject({ leak: true });
  });
  it("mención del mandato sin cifras: señal secundaria por idioma", () => {
    expect(detectLeak("Mis instrucciones dicen otra cosa", { issues: issues2, reservation: { pct: 3, day: 40 } })).toMatchObject({ leak: true });
    expect(detectLeak("That's beyond my bottom line", { issues: issues2, reservation: { pct: 3, day: 40 } })).toMatchObject({ leak: true });
  });

  const langs = fc.constantFrom("en", "es", "ja", "fr", "ar");
  const uncovered = fc.constantFrom("neutral" as const, "fallback-language" as const);
  const fallback = fc.constantFrom("en", "es");
  it("propiedad plantilla × idioma × decisión: pasa validador (en el idioma escrito) y fugas", () => {
    fc.assert(
      fc.property(scenario, langs, uncovered, fallback, fc.constantFrom(undefined, "confirm-figures" as const, "confirm-acceptance" as const), (s, lang, unc, fb, ask) => {
        const options = { languages: ["en", "es"], fallbackLanguage: fb, uncovered: unc };
        const decision = s.action === "walk" ? { action: s.action } : { action: s.action, offer: s.offer, ...(s.action === "counter" && ask ? { ask } : {}) };
        const text = renderTemplate(decision, lang, options);
        const written = templateLanguage(lang, options);
        expect(validateText({ ...decision, text, language: written, coherence: "strict" }), text).toEqual({ ok: true });
        const leakCtx: LeakContext = { issues: s.issues, reservation: s.reservation };
        if (s.action !== "walk") leakCtx.decided = s.offer;
        expect(detectLeak(text, leakCtx), text).toEqual({ leak: false });
      }),
    );
  });
  it("idioma sin plantilla: forma neutral con las cifras decididas", () => {
    expect(renderTemplate({ action: "counter", offer: { pct: 2.5, day: 20 } }, "ja")).toBe("Counter-offer: pct 2.5%, day 20.");
    expect(renderTemplate({ action: "counter", offer: { pct: 2.5 } }, "ja", { languages: ["en", "es"], fallbackLanguage: "es", uncovered: "fallback-language" })).toMatch(/^Gracias/);
  });
});
});
