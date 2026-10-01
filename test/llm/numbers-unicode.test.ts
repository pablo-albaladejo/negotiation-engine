import { describe, expect, it } from "vitest";
import { digitValue, foldText, normalizeNumbers } from "../../src/llm/numbers.js";

/** Todos los `\p{Nd}` de Unicode, por tramos contiguos. */
function allDecimalDigits(): number[] {
  const nd = /\p{Nd}/u;
  const out: number[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    if (nd.test(String.fromCodePoint(cp))) out.push(cp);
  }
  return out;
}

describe("normalizador: dígitos de cualquier escritura", () => {
  const digits = allDecimalDigits();

  it("recorre todo \\p{Nd}: cada tramo de 10 se mapea a 0–9 en orden", () => {
    expect(digits.length).toBeGreaterThan(600);
    expect(digits.length % 10).toBe(0);
    for (let k = 0; k < digits.length; k++) {
      const ch = String.fromCodePoint(digits[k]!);
      expect(digitValue(ch), `U+${digits[k]!.toString(16)}`).toBe(k % 10);
      expect(foldText(ch)).toBe(String(k % 10));
    }
  });

  it("coincide con NFKC cuando NFKC ya da un dígito ASCII", () => {
    for (const cp of digits) {
      const nfkc = String.fromCodePoint(cp).normalize("NFKC");
      if (/^[0-9]$/.test(nfkc)) expect(digitValue(String.fromCodePoint(cp))).toBe(Number(nfkc));
    }
  });

  it("ceros conocidos por bloque", () => {
    for (const zero of ["0", "٠", "۰", "०", "০", "๐", "０", "߀", "᠐"]) expect(digitValue(zero)).toBe(0);
    expect(digitValue("a")).toBeUndefined();
    expect(digitValue("二")).toBeUndefined();
  });

  it("es idempotente y las formas equivalentes de 3 % coinciden", () => {
    for (const text of ["٣٪", "３％", "3 %", "۳٪", "३%"]) {
      expect(foldText(foldText(text))).toBe(foldText(text));
      expect(normalizeNumbers(text)[0]).toMatchObject({ value: 3, unit: "percent", ambiguous: false });
    }
  });

  it("el espacio normal no agrupa: dos cifras distintas", () => {
    expect(normalizeNumbers("día 15 300 pb").map((m) => m.kind === "number" && m.value)).toEqual([15, 3]);
  });
});
