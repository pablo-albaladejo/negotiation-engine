import { describe, expect, it } from "vitest";
import { heatmapBand } from "../src/components/Heatmap";

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
