import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Scatter2D, clampScatterIndex, scatter2DXScale, scatter2DYScale } from "../src/components/Scatter2D";

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

describe("Scatter2D onPointClick (keyboard accessibility)", () => {
  it("marks points as focusable buttons only when onPointClick is given", () => {
    const withHandler = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[{ round: 1, x: 2, y: 3 }]}
        theirOffers={[{ round: 1, x: 4, y: 5 }]}
        onPointClick={() => {}}
      />,
    );
    expect(withHandler).toContain('role="button"');
    expect(withHandler).toContain('tabindex="0"');

    const withoutHandler = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[{ round: 1, x: 2, y: 3 }]}
        theirOffers={[{ round: 1, x: 4, y: 5 }]}
      />,
    );
    expect(withoutHandler).not.toContain('role="button"');
  });
});

describe("Scatter2D role and aria-labels", () => {
  it("uses role=group with onPointClick and labels each interactive point", () => {
    const withHandler = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[{ round: 3, x: 2, y: 3 }]}
        theirOffers={[{ round: 3, x: 4, y: 5 }]}
        onPointClick={() => {}}
      />,
    );
    expect(withHandler).toContain('role="group"');
    expect(withHandler).not.toMatch(/<svg[^>]*role="img"/);
    expect(withHandler).toContain('aria-label="Our offer, round 3"');
    expect(withHandler).toContain('aria-label="Opponent offer, round 3"');
  });

  it("keeps role=img on the svg when onPointClick is not given", () => {
    const withoutHandler = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[{ round: 1, x: 2, y: 3 }]}
        theirOffers={[{ round: 1, x: 4, y: 5 }]}
      />,
    );
    expect(withoutHandler).toMatch(/<svg[^>]*role="img"/);
  });
});


describe("clampScatterIndex", () => {
  it("clamps within bounds without wraparound", () => {
    expect(clampScatterIndex(0, -1, 4)).toBe(0);
    expect(clampScatterIndex(3, 1, 4)).toBe(3);
    expect(clampScatterIndex(1, 1, 4)).toBe(2);
  });

  it("returns 0 for an empty point list", () => {
    expect(clampScatterIndex(0, 1, 0)).toBe(0);
  });
});

describe("Scatter2D roving tabindex (D4)", () => {
  it("makes only one point the tab stop, ordered by round then side", () => {
    const html = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[
          { round: 1, x: 1, y: 1 },
          { round: 2, x: 2, y: 2 },
        ]}
        theirOffers={[
          { round: 1, x: 3, y: 3 },
          { round: 2, x: 4, y: 4 },
        ]}
        onPointClick={() => {}}
      />,
    );
    const tabStops = html.match(/tabindex="0"/g) ?? [];
    expect(tabStops).toHaveLength(1);
    // Round 1, us side is first in reading order.
    expect(html.indexOf('aria-label="Our offer, round 1"')).toBeLessThan(html.indexOf('tabindex="-1"'));
  });

  it("marks R{n} text labels as aria-hidden", () => {
    const html = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[{ round: 1, x: 1, y: 1 }]}
        theirOffers={[{ round: 1, x: 3, y: 3 }]}
      />,
    );
    expect(html).toMatch(/class="point-label us" aria-hidden="true"/);
  });

  it("uses a larger transparent hit circle for the interactive target", () => {
    const html = renderToString(
      <Scatter2D
        xDomain={[0, 10]}
        yDomain={[0, 10]}
        xLabel="x"
        yLabel="y"
        ourOffers={[{ round: 1, x: 1, y: 1 }]}
        theirOffers={[{ round: 1, x: 3, y: 3 }]}
        onPointClick={() => {}}
      />,
    );
    expect(html).toMatch(/class="hit"[^>]*r="12"/);
  });
});