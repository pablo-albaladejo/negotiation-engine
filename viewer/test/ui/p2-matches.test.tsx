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

  it("filtrar por rival deja solo sus partidas", () => {
    const rival = fx.games[0]!.rival;
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    fireEvent.change(screen.getByDisplayValue("All opponents"), { target: { value: rival } });
    const expected = fx.games.filter((g) => g.rival === rival);
    for (const g of expected) expect(screen.getAllByText(g.gameId).length).toBeGreaterThan(0);
    const other = fx.games.find((g) => g.rival !== rival);
    if (other) expect(screen.queryByText(other.gameId)).toBeNull();
  });

  it("h2 \'{run} \u00b7 matches\' con Pill champion si corresponde", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} isChampion />);
    expect(screen.getByText(`${fx.runId} \u00b7 matches`)).toBeTruthy();
    expect(screen.getByText("champion")).toBeTruthy();
  });

  it("opciones de rol en ingl\u00e9s (Buyer/Seller) y \'All opponents\' para el rival", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByDisplayValue("All opponents")).toBeTruthy();
    expect(screen.getAllByRole("tab").map((el) => el.textContent)).toContain("Buyer");
    expect(screen.getAllByRole("tab").map((el) => el.textContent)).toContain("Seller");
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

  it("sin resultados para los filtros: estado vac\u00edo con \'Clear filters\'", () => {
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} initialFilters={{ rival: "no-such-rival" }} />);
    expect(screen.getByText("No matches for these filters")).toBeTruthy();
    fireEvent.click(screen.getByText("Clear filters"));
    expect(screen.getAllByText(fx.games[0]!.gameId).length).toBeGreaterThan(0);
  });

  it("run vacío: 'has no matches'", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, games: 0 } };
    render(<MatchesScreen runId={fx.runId} summary={summary} games={[]} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByText(`${fx.runId} has no matches`)).toBeTruthy();
  });
});
