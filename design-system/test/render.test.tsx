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
  Filters,
  ModeBadge,
  Scatter2D,
  Scoreboard,
  WarningBanner,
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

  it("renders Pill kind=champion with its own class", () => {
    const html = renderToString(<Pill kind="champion">champion</Pill>);
    expect(html).toContain("nr-pill champion");
  });

  it("DataTable rows get the clickable class when onRowClick is given, but are not a tab stop", () => {
    const html = renderToString(
      <DataTable columns={[{ key: "id", label: "Id" }]} rows={[{ id: "r-1" }]} onRowClick={() => {}} />,
    );
    expect(html).toContain("nr-table-row-clickable");
    expect(html).not.toContain("tabindex");
  });

  it("DataTable rows are not focusable when onRowClick is not given", () => {
    const html = renderToString(<DataTable columns={[{ key: "id", label: "Id" }]} rows={[{ id: "r-1" }]} />);
    expect(html).not.toContain("nr-table-row-clickable");
    expect(html).not.toContain("tabindex");
  });

  it("DataTable highlights the row at selectedRowIndex", () => {
    const html = renderToString(
      <DataTable columns={[{ key: "id", label: "Id" }]} rows={[{ id: "r-1" }, { id: "r-2" }]} selectedRowIndex={1} />,
    );
    const bodyRows = html.split("<tbody>")[1]!.split("<tr").slice(1);
    expect(bodyRows[0]).not.toContain("is-selected");
    expect(bodyRows[1]).toContain("is-selected");
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

  it("renders Filters without throwing", () => {
    expect(() =>
      renderToString(
        <Filters
          rivalOptions={[{ value: "all", label: "All" }]}
          rival="all"
          onRivalChange={() => {}}
          roleOptions={[{ value: "seller", label: "Seller" }]}
          role="seller"
          onRoleChange={() => {}}
          resultOptions={[{ value: "deal", label: "Deal" }]}
          result="deal"
          onResultChange={() => {}}
          checkboxes={[{ key: "injection", label: "with injection", checked: true }]}
          onCheckboxChange={() => {}}
        />,
      ),
    ).not.toThrow();
  });

  it("renders ModeBadge for arena mode", () => {
    const html = renderToString(<ModeBadge mode="arena" />);
    expect(html).toContain("ARENA");
  });

  it("renders ModeBadge for tournament mode", () => {
    const html = renderToString(<ModeBadge mode="tournament" />);
    expect(html).toContain("TOURNAMENT");
  });

  it("renders Scatter2D without throwing", () => {
    expect(() =>
      renderToString(
        <Scatter2D
          xDomain={[0, 60]}
          yDomain={[0, 10]}
          xLabel="payment day"
          yLabel="discount %"
          ourOffers={[{ round: 1, x: 10, y: 1 }]}
          theirOffers={[{ round: 1, x: 40, y: 6 }]}
          isoLines={[{ points: [{ x: 0, y: 5 }, { x: 60, y: 2 }], label: "u = 0.8" }]}
          mandate={{ points: [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 6 }, { x: 0, y: 6 }] }}
          deal={{ x: 40, y: 3.5, label: "deal at 3.5% · day 40" }}
        />,
      ),
    ).not.toThrow();
  });

  it("renders Scoreboard without throwing", () => {
    expect(() =>
      renderToString(<Scoreboard badge="LIVE" us="Team 2" rival="Team 5" round={4} rounds={10} attacksBlocked={2} />),
    ).not.toThrow();
  });

  it("renders WarningBanner without throwing", () => {
    expect(() =>
      renderToString(
        <WarningBanner tone="warn" title="results/r-1003.jsonl · line 1834">
          <span>field offer.value: expected number, got string "one hundred four"</span>
        </WarningBanner>,
      ),
    ).not.toThrow();
  });
});
