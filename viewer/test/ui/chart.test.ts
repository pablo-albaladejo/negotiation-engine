import { describe, it, expect } from "vitest";
import { offerDomain } from "../../src/ui/chart.js";

describe("offerDomain", () => {
  it("returns [0, 1] for empty values", () => {
    expect(offerDomain([])).toEqual([0, 1]);
    expect(offerDomain([null, undefined])).toEqual([0, 1]);
  });

  it("expands single value by 1 in each direction", () => {
    expect(offerDomain([5])).toEqual([4, 6]);
    expect(offerDomain([0])).toEqual([-1, 1]);
    expect(offerDomain([100])).toEqual([99, 101]);
  });

  it("returns nice bounds for [0.5, 9.3]", () => {
    const result = offerDomain([0.5, 9.3]);
    // Should be nice step like [0, 10] or [0, 12]
    expect(result[0]).toBe(0);
    expect([10, 12, 15, 20]).toContain(result[1]);
  });

  it("returns nice bounds for [104, 131]", () => {
    const result = offerDomain([104, 131]);
    // Should be nice step like [100, 135], [100, 140], or [100, 150]
    expect(result[0]).toBe(100);
    expect([130, 135, 140, 150]).toContain(result[1]);
  });

  it("never goes below 0 when all values >= 0", () => {
    expect(offerDomain([0, 5]).every(v => v >= 0)).toBe(true);
    expect(offerDomain([0.1, 0.2]).every(v => v >= 0)).toBe(true);
    expect(offerDomain([10, 20]).every(v => v >= 0)).toBe(true);
  });

  it("can go negative when values are negative", () => {
    const result = offerDomain([-10, 5]);
    // Should have both negative and positive bounds
    expect(result[0]).toBeLessThan(0);
    expect(result[1]).toBeGreaterThan(0);
  });

  it("uses nice steps (1, 2, 5 × 10ⁿ)", () => {
    // All results should be multiples of a nice step
    const testCases = [
      [1, 9],
      [10, 90],
      [100, 900],
      [0.1, 0.9],
    ];
    
    for (const values of testCases) {
      const [min, max] = offerDomain(values);
      const range = max - min;
      // Check that the step is a nice value
      const niceSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 0.1, 0.2, 0.5];
      const hasNiceStep = niceSteps.some(step => {
        const tolerance = step * 1e-10;
        return Math.abs((max - min) % step) < tolerance || Math.abs(range / step - Math.round(range / step)) < 0.01;
      });
      expect(hasNiceStep).toBe(true);
    }
  });

  it("filters out null and undefined", () => {
    expect(offerDomain([0.5, null, 9.3, undefined])).toEqual(offerDomain([0.5, 9.3]));
  });
});
