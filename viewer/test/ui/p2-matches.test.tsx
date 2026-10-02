// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { MatchesScreen } from "../../src/screens/MatchesScreen.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

describe("MatchesScreen (P2)", () => {
  it("KPIs y tabla de partidas con Filters", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getAllByText("Opponent").length).toBeGreaterThan(0);
    expect(screen.getAllByText(fx.games[0]!.gameId).length).toBeGreaterThan(0);
  });

  it("checkbox 'with injection' solo aparece si alguna partida trae metrics.injectionSuspected", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByText("with injection")).toBeTruthy();
    cleanup();
    const withoutField = fx.games.map((g) => ({ ...g, metrics: { ...g.metrics, injectionSuspected: undefined } }));
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={withoutField} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.queryByText("with injection")).toBeNull();
  });

  it("T8: injection=true is dropped from filters/URL once the run has no injection data", () => {
    const withoutField = fx.games.map((g) => ({ ...g, metrics: { ...g.metrics, injectionSuspected: undefined } }));
    const onFiltersChange: unknown[] = [];
    render(
      <MatchesScreen
        runId={fx.runId}
        summary={fx.summary}
        games={withoutField}
        onOpenGame={() => {}}
        onBack={() => {}}
        initialFilters={{ injection: true }}
        onFiltersChange={(f) => onFiltersChange.push(f)}
      />,
    );
    expect(onFiltersChange).toEqual([{}]);
    expect(screen.queryByText("with injection")).toBeNull();
  });

  it("filtrar por rival deja solo sus partidas", () => {
    const rival = fx.games[0]!.rival;
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("All opponents"), { target: { value: rival } });
    const expected = fx.games.filter((g) => g.rival === rival);
    for (const g of expected) expect(screen.getAllByText(g.gameId).length).toBeGreaterThan(0);
    const other = fx.games.find((g) => g.rival !== rival);
    if (other) expect(screen.queryByText(other.gameId)).toBeNull();
  });

  it("h2 '{run} · matches' con Pill champion si corresponde", () => {
    const { container } = render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} isChampion />);
    expect(screen.getByText(`${fx.runId} · matches`)).toBeTruthy();
    expect(screen.getByText("champion")).toBeTruthy();
    const titleRow = screen.getByText(`${fx.runId} · matches`).closest("div")!;
    expect(titleRow.getAttribute("style")).toContain("flex-wrap: wrap");
    expect(container.querySelector(".nr-pill.champion")).toBeTruthy();
  });

  it("opciones de rol en inglés (Buyer/Seller) y 'All opponents' para el rival", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByDisplayValue("All opponents")).toBeTruthy();
    expect(screen.getAllByRole("button").map((el) => el.textContent)).toContain("Buyer");
    expect(screen.getAllByRole("button").map((el) => el.textContent)).toContain("Seller");
  });

  it("filtros iniciales desde la URL (initialFilters) y onFiltersChange al cambiar", () => {
    const rival = fx.games[0]!.rival;
    let lastFilters: unknown = null;
    render(
      <MatchesScreen
        runId={fx.runId}
        summary={fx.summary}
        games={fx.games}
        onOpenGame={() => {}}
        onBack={() => {}}
        initialFilters={{ rival }}
        onFiltersChange={(f) => (lastFilters = f)}
      />,
    );
    expect(screen.getByDisplayValue(rival)).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue(rival), { target: { value: "" } });
    expect(lastFilters).toEqual({});
  });

  it("sin resultados para los filtros: estado vacío con 'Clear filters'", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} initialFilters={{ rival: "no-such-rival" }} />);
    expect(screen.getAllByText("No matches for these filters").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Clear filters"));
    expect(screen.getAllByText(fx.games[0]!.gameId).length).toBeGreaterThan(0);
  });

  it("clicking the inner TableLink opens the game exactly once (INBOX A1)", () => {
    let opens = 0;
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => opens++} onBack={() => {}} />);
    fireEvent.click(screen.getAllByText(fx.games[0]!.gameId)[0]!);
    expect(opens).toBe(1);
  });

  it("clicking a row cell (not the link) opens the game once (INBOX A1)", () => {
    let opens = 0;
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => opens++} onBack={() => {}} />);
    const cell = screen.getAllByText(fx.games[0]!.rival).find((el) => el.closest("tr") !== null)!;
    fireEvent.click(cell);
    expect(opens).toBe(1);
  });

  it("run vacío: 'has no matches'", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, games: 0 } };
    render(<MatchesScreen runId={fx.runId} summary={summary} games={[]} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByText(`${fx.runId} has no matches`)).toBeTruthy();
  });
});

describe("MatchesScreen Price, Outcome, Incidents, KPIs, cfg (T11)", () => {
  it("Price shows em-dash (—) on a walk, never the last offer", () => {
    const walks = fx.games.filter((g) => g.endReason !== "agreement");
    if (walks.length > 0) {
      render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={[walks[0]!]} onOpenGame={() => {}} onBack={() => {}} />);
      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    }
  });

  it("Outcome column shows 'Deal' Flag with decision tone for agreements", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    const dealGames = fx.games.filter((g) => g.endReason === "agreement");
    if (dealGames.length > 0) {
      expect(screen.getAllByText("Deal").length).toBeGreaterThan(0);
    }
  });

  it("Incidents column shows no flags when no incidents apply", () => {
    const clean = fx.games.filter((g) => !g.metrics || (!g.metrics.zopaEmpty && (g.metrics.injectionSuspected ?? 0) === 0 && (g.metrics.leaks ?? 0) === 0));
    if (clean.length > 0) {
      render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={[clean[0]!]} onOpenGame={() => {}} onBack={() => {}} />);
      expect(screen.queryByText("clean")).toBeNull();
    }
  });

  it("KPI 'Empty ZOPA detected' shows percentage or 'not logged'", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    const emptyZopaKpi = screen.getByText("Empty ZOPA detected").closest(".nr-kpi");
    expect(emptyZopaKpi).toBeTruthy();
    const value = emptyZopaKpi!.querySelector(".nr-kpi-value");
    expect(value!.textContent).toMatch(/not logged|%/);
  });

  it("KPI 'Duration' shows formatted duration in seconds", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    const durationKpi = screen.getByText("Duration").closest(".nr-kpi");
    expect(durationKpi).toBeTruthy();
    const value = durationKpi!.querySelector(".nr-kpi-value");
    expect(value!.textContent).toMatch(/\d+\.\d+ s/);
  });

  it("cfg line includes run info, match count, and duration", () => {
    const { container } = render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    const cfgLine = container.querySelector(".nr-cfg");
    expect(cfgLine).toBeTruthy();
    expect(cfgLine!.textContent).toContain(fx.runId);
    expect(cfgLine!.textContent).toContain("matches");
    expect(cfgLine!.textContent).toMatch(/\d+\.\d+ s/);
  });
});
