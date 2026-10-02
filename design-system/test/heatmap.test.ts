import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Heatmap, heatmapBand } from "../src/components/Heatmap";

describe("Heatmap thresholds", () => {
  it("classifies good as >= 0.60", () => {
    expect(heatmapBand(0.6)).toBe("good");
    expect(heatmapBand(0.71)).toBe("good");
  });

  it("classifies mid as 0.45 - 0.60", () => {
    expect(heatmapBand(0.45)).toBe("mid");
    expect(heatmapBand(0.52)).toBe("mid");
    expect(heatmapBand(0.599)).toBe("mid");
  });

  it("classifies bad as < 0.45", () => {
    expect(heatmapBand(0.44)).toBe("bad");
    expect(heatmapBand(0.38)).toBe("bad");
  });
});

describe("Heatmap rowHeader (B4)", () => {
  it("defaults to 'Opponent'", () => {
    const html = renderToString(createElement(Heatmap, { columns: ["seller"], rows: [{ rival: "Boulware", cells: [{ label: "0.5", value: 0.5 }] }] }));
    expect(html).toContain("<th>Opponent</th>");
  });

  it("accepts a custom header", () => {
    const html = renderToString(createElement(Heatmap, { columns: ["seller"], rows: [{ rival: "Boulware", cells: [{ label: "0.5", value: 0.5 }] }], rowHeader: "Rival" }));
    expect(html).toContain("<th>Rival</th>");
    expect(html).not.toContain("<th>Opponent</th>");
  });
});

describe("Heatmap cells without a value", () => {
  it("heatmapBand returns 'none' for null, undefined and NaN, never a good/mid/bad band", () => {
    expect(heatmapBand(null)).toBe("none");
    expect(heatmapBand(undefined)).toBe("none");
    expect(heatmapBand(Number.NaN)).toBe("none");
  });

  it("renders a neutral cell labelled n/a", () => {
    const html = renderToString(
      createElement(Heatmap, {
        columns: ["seller", "buyer"],
        rows: [{ rival: "Boulware", cells: [{ label: "0.71", value: 0.71 }, { label: "", value: null }, { label: "x" }] }],
      }),
    );
    const cells = [...html.matchAll(/<td class="nr-heat-cell ([a-z]+)">([^<]*)<\/td>/g)].map((m) => [m[1], m[2]]);
    expect(cells).toEqual([
      ["good", "0.71"],
      ["none", "n/a"],
      ["none", "n/a"],
    ]);
  });
});
