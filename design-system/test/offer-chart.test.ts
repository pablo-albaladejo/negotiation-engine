import { describe, expect, it } from "vitest";
import { offerChartXScale, offerChartYScale, endLabelPlacement } from "../src/components/OfferChart";

describe("OfferChart scales", () => {
  it("maps a known value to the expected y coordinate", () => {
    // yDomain [60, 140], margin.top=16, innerHeight=278
    // value=140 (yMax) -> y = 16
    // value=60 (yMin) -> y = 16 + 278 = 294
    // value=100 (midpoint) -> y = 16 + 139 = 155
    expect(offerChartYScale(140, [60, 140])).toBeCloseTo(16);
    expect(offerChartYScale(60, [60, 140])).toBeCloseTo(294);
    expect(offerChartYScale(100, [60, 140])).toBeCloseTo(155);
  });

  it("maps a known round to the expected x coordinate", () => {
    // margin.left=48, innerWidth=576, rounds=10
    // round=0 -> x=48, round=10 -> x=624, round=5 -> x=336
    expect(offerChartXScale(0, 10)).toBeCloseTo(48);
    expect(offerChartXScale(10, 10)).toBeCloseTo(624);
    expect(offerChartXScale(5, 10)).toBeCloseTo(336);
  });
});

describe("endLabelPlacement", () => {
  it("places the label above-left when the line rises into the end point", () => {
    expect(endLabelPlacement(100, 112)).toEqual({ dx: -13, dy: -13, anchor: "end" });
  });

  it("places the label below-right when the line descends into the end point", () => {
    expect(endLabelPlacement(112, 100)).toEqual({ dx: 13, dy: 18, anchor: "start" });
  });

  it("defaults to above-left with no previous point", () => {
    expect(endLabelPlacement(undefined, 100)).toEqual({ dx: -13, dy: -13, anchor: "end" });
  });
});
