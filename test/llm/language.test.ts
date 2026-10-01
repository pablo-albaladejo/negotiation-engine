import { describe, expect, it } from "vitest";
import { detectLanguage, turnLanguage } from "../../src/llm/language.js";
import { makeBrain } from "../pipeline/helpers.js";

describe("idioma de respaldo por escritura Unicode", () => {
  it.each([
    ["نقبل ٢٫٥٪ والدفع في اليوم ١٥", "ar"],
    ["二・五パーセントで、十五日払い", "ja"],
    ["2.5퍼센트로 하겠습니다", "ko"],
    ["Мы согласны на 3 %", "ru"],
    ["我们接受百分之三", "zh"],
    ["हम ३ % देंगे", "hi"],
    ["Te ofrezco un 3 % pagando a 30 días", "es"],
    ["We can offer 3% paying in 30 days", "en"],
    ["3 %", "und"],
  ])("%s → %s", (text, lang) => {
    expect(detectLanguage(text)).toBe(lang);
  });

  it("la etiqueta del parser manda si es válida; inválida o und ⇒ detección", () => {
    expect(turnLanguage("FR", "Nous acceptons")).toBe("fr");
    expect(turnLanguage("not a tag!", "نقبل")).toBe("ar");
    expect(turnLanguage("und", "We accept the offer")).toBe("en");
  });

  it("la sesión conserva el último idioma distinto de und y la traza lo registra", async () => {
    const broken = { name: "fake-llm", parse: async () => Promise.reject(new Error("caído")) };
    const { brain, store, trace } = makeBrain({ parser: broken });
    await brain.turn({ sessionId: "s1", round: 1, rivalAction: "message", text: "نقبل العرض" });
    expect(store.get("s1")!.language).toBe("ar");
    await brain.turn({ sessionId: "s1", round: 2, rivalAction: "message", text: "3 %" });
    expect(store.get("s1")!.language).toBe("ar");
    expect(trace.records.filter((r) => r.box === "reconcile").at(-1)!.output).toMatchObject({ language: "ar" });
  });
});
