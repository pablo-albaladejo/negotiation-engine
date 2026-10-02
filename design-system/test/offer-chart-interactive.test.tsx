import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { OfferChart, clampOfferChartIndex } from "../src/components/OfferChart";

describe("clampOfferChartIndex", () => {
  it("clamps within bounds without wraparound", () => {
    expect(clampOfferChartIndex(0, -1, 4)).toBe(0);
    expect(clampOfferChartIndex(3, 1, 4)).toBe(3);
    expect(clampOfferChartIndex(1, 1, 4)).toBe(2);
  });

  it("returns 0 for an empty point list", () => {
    expect(clampOfferChartIndex(0, 1, 0)).toBe(0);
  });
});

describe("OfferChart roving tabindex (D4)", () => {
  const baseProps = {
    rounds: 3,
    yDomain: [0, 100] as [number, number],
    ourOffers: [
      { round: 1, value: 20 },
      { round: 2, value: 40 },
    ],
    theirOffers: [
      { round: 1, value: 80 },
      { round: 2, value: 60 },
    ],
  };

  it("keeps role=img on the svg when onPointClick is not given", () => {
    const html = renderToString(<OfferChart {...baseProps} />);
    expect(html).toMatch(/<svg[^>]*role="img"/);
    expect(html).not.toContain('role="button"');
  });

  it("uses role=group and makes only one point the tab stop when onPointClick is given", () => {
    const html = renderToString(<OfferChart {...baseProps} onPointClick={() => {}} />);
    expect(html).toMatch(/<svg[^>]*role="group"/);
    const tabStops = html.match(/tabindex="0"/g) ?? [];
    expect(tabStops).toHaveLength(1);
    expect(html).toContain('aria-label="Our offer, round 1"');
    expect(html).toContain('aria-label="Opponent offer, round 1"');
  });

  it("uses a larger transparent hit circle for the interactive target", () => {
    const html = renderToString(<OfferChart {...baseProps} onPointClick={() => {}} />);
    expect(html).toMatch(/class="hit"[^>]*r="12"/);
  });

  it("A2: selectedRound starts the tab stop on that round and marks it aria-pressed", () => {
    const html = renderToString(<OfferChart {...baseProps} onPointClick={() => {}} selectedRound={2} />);
    expect(html).toContain('tabindex="0" aria-label="Our offer, round 2" aria-pressed="true"');
    expect(html).toContain('aria-label="Opponent offer, round 2" aria-pressed="true"');
    expect(html).toContain('tabindex="-1" aria-label="Our offer, round 1" aria-pressed="false"');
  });

  it("omits aria-pressed entirely when selectedRound is not given", () => {
    const html = renderToString(<OfferChart {...baseProps} onPointClick={() => {}} />);
    expect(html).not.toContain("aria-pressed");
  });
  it("D4: selectedRound changes update which point has tabIndex=0", () => {
    // Verify that with selectedRound=1, round 1 is the tab stop
    const html1 = renderToString(<OfferChart {...baseProps} onPointClick={() => {}} selectedRound={1} />);
    const tabStopsR1 = html1.match(/tabindex="0"[^>]*aria-label="Our offer, round 1"/g) ?? [];
    expect(tabStopsR1).toHaveLength(1);
    
    // Verify that with selectedRound=2, round 2 is the tab stop
    const html2 = renderToString(<OfferChart {...baseProps} onPointClick={() => {}} selectedRound={2} />);
    const tabStopsR2 = html2.match(/tabindex="0"[^>]*aria-label="Our offer, round 2"/g) ?? [];
    expect(tabStopsR2).toHaveLength(1);
    
    // Verify round 1 is now -1
    expect(html2).toContain('tabindex="-1" aria-label="Our offer, round 1"');
  });

});
