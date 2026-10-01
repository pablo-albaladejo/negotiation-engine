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
    fireEvent.change(screen.getByDisplayValue("All"), { target: { value: rival } });
    const expected = fx.games.filter((g) => g.rival === rival);
    for (const g of expected) expect(screen.getAllByText(g.gameId).length).toBeGreaterThan(0);
    const other = fx.games.find((g) => g.rival !== rival);
    if (other) expect(screen.queryByText(other.gameId)).toBeNull();
  });

  it("run vacío: 'has no matches'", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, games: 0 } };
    render(<MatchesScreen runId={fx.runId} summary={summary} games={[]} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByText(`${fx.runId} has no matches`)).toBeTruthy();
  });
});
