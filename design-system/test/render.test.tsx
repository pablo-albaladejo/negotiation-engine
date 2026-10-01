import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import {
  Root,
  Card,
  Tabs,
  MatchSelector,
  KpiStrip,
  ChatMessage,
  Flag,
  Pill,
  DataTable,
  Heatmap,
  OfferChart,
  Legend,
} from "../src/index";

describe("component rendering", () => {
  it("renders Root without throwing", () => {
    expect(() => renderToString(<Root theme="dark">hola</Root>)).not.toThrow();
  });

  it("renders Card without throwing", () => {
    expect(() =>
      renderToString(
        <Card title="Título" caption="Pie">
          Contenido
        </Card>,
      ),
    ).not.toThrow();
  });

  it("renders Tabs without throwing", () => {
    expect(() =>
      renderToString(
        <Tabs
          items={[
            { id: "a", label: "Repetición" },
            { id: "b", label: "Campeón vs candidato" },
          ]}
          selectedId="a"
          onSelect={() => {}}
        />,
      ),
    ).not.toThrow();
  });

  it("renders MatchSelector without throwing", () => {
    expect(() =>
      renderToString(
        <MatchSelector
          matches={[{ id: "m-0107", rival: "Boulware", result: "deal", label: "trato a 112 · excedente 0,97" }]}
          selectedId="m-0107"
          onSelect={() => {}}
        />,
      ),
    ).not.toThrow();
  });

  it("renders KpiStrip without throwing", () => {
    expect(() =>
      renderToString(<KpiStrip items={[{ label: "Resultado", value: "Trato", tone: "deal" }]} />),
    ).not.toThrow();
  });

  it("renders ChatMessage without throwing", () => {
    expect(() =>
      renderToString(
        <ChatMessage side="us" round={7} offer={112} text="Trato cerrado en 112." flags={[{ kind: "decision", label: "AC_next · acepta" }]} />,
      ),
    ).not.toThrow();
  });

  it("escapes rival text instead of running it as HTML", () => {
    const html = renderToString(<ChatMessage side="them" round={2} text="<script>alert(1)</script>" />);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders Flag without throwing", () => {
    expect(() => renderToString(<Flag kind="injection">inyección</Flag>)).not.toThrow();
  });

  it("renders Pill without throwing", () => {
    expect(() => renderToString(<Pill kind="verdict">challenger-v4 pasa a campeón</Pill>)).not.toThrow();
  });

  it("renders DataTable without throwing", () => {
    expect(() =>
      renderToString(
        <DataTable
          columns={[
            { key: "metric", label: "Métrica" },
            { key: "value", label: "Valor", numeric: true },
          ]}
          rows={[{ metric: "Excedente / ZOPA", value: { value: "0,64", tone: "better" } }]}
        />,
      ),
    ).not.toThrow();
  });

  it("renders Heatmap without throwing", () => {
    expect(() =>
      renderToString(
        <Heatmap
          columns={["como vendedor", "como comprador"]}
          rows={[{ rival: "Boulware", cells: [{ label: "0,71", value: 0.71 }, { label: "0,52", value: 0.52 }] }]}
        />,
      ),
    ).not.toThrow();
  });

  it("renders OfferChart and Legend without throwing", () => {
    expect(() =>
      renderToString(
        <>
          <OfferChart
            rounds={10}
            yDomain={[60, 140]}
            ourOffers={[{ round: 2, value: 124 }]}
            theirOffers={[{ round: 2, value: 81 }]}
            ourReserve={80}
            theirReserve={112}
            zopa
          />
          <Legend>leyenda</Legend>
        </>,
      ),
    ).not.toThrow();
  });
});
