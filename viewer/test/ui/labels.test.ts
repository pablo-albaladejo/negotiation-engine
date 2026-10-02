import { describe, expect, it } from "vitest";
import { formatRunDate, configParamsLine, matchConfigLine, resultLabel } from "../../src/ui/labels.js";
import { priceLabel } from "../../src/ui/offer.js";

describe("labels utilities (T12)", () => {
  describe("formatRunDate", () => {
    it("returns 'not logged' for null", () => {
      expect(formatRunDate(null)).toBe("not logged");
    });

    it("returns 'not logged' for invalid date strings", () => {
      expect(formatRunDate("garbage")).toBe("not logged");
      expect(formatRunDate("not a date")).toBe("not logged");
      expect(formatRunDate("2024-13-45")).toBe("not logged");
      expect(formatRunDate("")).toBe("not logged");
    });

    it("formats valid ISO dates as 'Mon D, YYYY HH:mm'", () => {
      const result = formatRunDate("2026-10-01T09:42:00.000Z");
      // Oct 1, 2026 09:42 (in UTC/local time depending on timezone)
      expect(result).toMatch(/\w{3} \d{1,2}, \d{4} \d{2}:\d{2}/);
      expect(result).not.toContain("not logged");
    });
  });

  describe("configParamsLine", () => {
    it("returns 'not logged' when params is undefined", () => {
      expect(configParamsLine(undefined)).toBe("not logged");
    });

    it("returns 'not logged' when params is null", () => {
      expect(configParamsLine(null as any)).toBe("not logged");
    });

    it("formats all param fields separated by ' · ' when all present", () => {
      const params = {
        beta: 0.2,
        openingMargin: 0.1,
        acceptMargin: 0.05,
        acTimeThreshold: 2000,
        noise: 0.01,
        defaultHorizon: 100,
      };
      const result = configParamsLine(params);
      expect(result).toContain("β=0.2");
      expect(result).toContain("openingMargin 0.1");
      expect(result).toContain("acceptMargin 0.05");
      expect(result).toContain("acTimeThreshold 2000");
      expect(result).toContain("noise 0.01");
      expect(result).toContain("horizon 100");
    });
  });

  describe("matchConfigLine", () => {
    it("shows 'not logged' for each undefined field independently", () => {
      const result = matchConfigLine(undefined, null, null);
      expect(result).toContain("not logged");
      expect(result).toContain("persona not logged");
      expect(result).toContain("LLM_PROVIDER not logged");
    });

    it("formats params, persona, and provider separated by ' · '", () => {
      const params = { beta: 0.2, openingMargin: 0.1, acceptMargin: 0.05, acTimeThreshold: 2000, noise: 0.01, defaultHorizon: 100 };
      const result = matchConfigLine(params, "greedy", "openai");
      expect(result).toContain("β=0.2");
      expect(result).toContain("persona greedy");
      expect(result).toContain("LLM_PROVIDER openai");
    });

    it("shows 'not logged' only for missing fields when some are present", () => {
      const params = { beta: 0.2, openingMargin: 0.1, acceptMargin: 0.05, acTimeThreshold: 2000, noise: 0.01, defaultHorizon: 100 };
      const result = matchConfigLine(params, null, "openai");
      expect(result).toContain("β=0.2");
      expect(result).toContain("persona not logged");
      expect(result).toContain("LLM_PROVIDER openai");
    });
  });

  describe("priceLabel (from offer.ts)", () => {
    it("returns '—' (em-dash) when agreement is null", () => {
      expect(priceLabel(null)).toBe("—");
    });

    it("formats a single-issue offer as its numeric value", () => {
      expect(priceLabel({ price: 50 })).toMatch(/50/);
    });

    it("formats a multi-issue offer as 'issue value · issue value'", () => {
      const result = priceLabel({ day: 10, pct: 5 });
      expect(result).toContain("day");
      expect(result).toContain("pct");
      expect(result).toContain("·");
    });
  });
});
