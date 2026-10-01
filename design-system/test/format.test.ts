import { describe, expect, it } from "vitest";
import { formatNumber } from "../src/format";

describe("formatNumber", () => {
  it("formats using a decimal point for the en locale", () => {
    expect(formatNumber(61.1, { locale: "en" })).toBe("61.1");
  });

  it("formats using a decimal comma for the es locale", () => {
    expect(formatNumber(61.1, { locale: "es" })).toBe("61,1");
  });

  it("respects a fixed number of decimals", () => {
    expect(formatNumber(61, { locale: "en", decimals: 1 })).toBe("61.0");
    expect(formatNumber(61, { locale: "es", decimals: 1 })).toBe("61,0");
  });
});
