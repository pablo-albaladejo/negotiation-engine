import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OfferChart } from "../src/components/OfferChart";

const base = { rounds: 4, yDomain: [20, 35] as [number, number], ourOffers: [{ round: 1, value: 22 }], theirOffers: [{ round: 1, value: 29 }] };

describe("OfferChart · ejes configurables", () => {
  it("por defecto: rondas numeradas y título 'round'", () => {
    const html = renderToString(<OfferChart {...base} />);
    expect(html).toContain(">round</text>");
    expect(html).toContain('aria-label="Offers from both sides by round"');
  });

  it("título, etiquetas del eje X y marcas del eje Y a medida", () => {
    const html = renderToString(<OfferChart {...base} xLabel="tick" xTickLabel={(r) => (r === 0 ? "" : String(117 + r))} yTicks={[20, 25, 30, 35]} />);
    expect(html).toContain(">tick</text>");
    expect(html).toContain(">118</text>");
    expect(html).not.toContain(">round</text>");
    expect((html.match(/<line x1="48"/g) ?? []).length).toBe(4);
    expect(html).toContain(">25</text>");
  });
});

describe("OfferChart · ronda bajo el cursor", () => {
  it("offerChartRoundAt invierte offerChartXScale y acota a [0, rounds]", async () => {
    const { offerChartRoundAt, offerChartXScale } = await import("../src/components/OfferChart");
    expect(offerChartRoundAt(offerChartXScale(3, 5), 5)).toBe(3);
    expect(offerChartRoundAt(offerChartXScale(3, 5) + 20, 5)).toBe(3);
    expect(offerChartRoundAt(0, 5)).toBe(0);
    expect(offerChartRoundAt(10_000, 5)).toBe(5);
  });

  it("sin cursor encima no hay caja", () => {
    expect(renderToString(<OfferChart {...base} describeRound={() => ["x"]} />)).not.toContain("offer-chart-hover");
  });
});
