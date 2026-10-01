import { describe, expect, it } from "vitest";
import { scatter2DXScale, scatter2DYScale } from "../src/components/Scatter2D";

describe("Scatter2D scales", () => {
  it("maps a known x value to the expected coordinate", () => {
    // xDomain [0, 60], margin.left=48, innerWidth=576
    // x=0 -> 48, x=60 -> 624, x=30 -> 336
    expect(scatter2DXScale(0, [0, 60])).toBeCloseTo(48);
    expect(scatter2DXScale(60, [0, 60])).toBeCloseTo(624);
    expect(scatter2DXScale(30, [0, 60])).toBeCloseTo(336);
  });

  it("maps a known y value to the expected coordinate (inverted axis)", () => {
    // yDomain [0, 10], margin.top=20, innerHeight=312
    // y=10 (yMax) -> 20, y=0 (yMin) -> 332, y=5 (midpoint) -> 176
    expect(scatter2DYScale(10, [0, 10])).toBeCloseTo(20);
    expect(scatter2DYScale(0, [0, 10])).toBeCloseTo(332);
    expect(scatter2DYScale(5, [0, 10])).toBeCloseTo(176);
  });
});
