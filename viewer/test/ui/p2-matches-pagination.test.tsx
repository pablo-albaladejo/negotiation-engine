// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { TranscriptLine } from "../../../src/arena/results-schema.js";
import { MatchesScreen } from "../../src/screens/MatchesScreen.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(cleanup);

/** `n` clones of the template game, split across two rivals so filtering has something to narrow (INBOX A3). */
function manyGames(template: TranscriptLine, n: number): TranscriptLine[] {
  return Array.from({ length: n }, (_, i) => ({ ...template, gameId: `g-${i}`, rival: i % 2 === 0 ? template.rival : "other-rival" }));
}

describe("MatchesScreen pagination (INBOX A3)", () => {
  it("200 rows: no pagination controls, all 200 rows rendered", () => {
    const games = manyGames(fx.games[0]!, 200);
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={games} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.queryByText(/^Page \d+ of \d+$/)).toBeNull();
    expect(screen.getAllByRole("row")).toHaveLength(201); // header + 200
  });

  it("201 rows: 'Page 1 of 5', 50 rows on the page", () => {
    const games = manyGames(fx.games[0]!, 201);
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={games} onOpenGame={() => {}} onBack={() => {}} />);
    expect(screen.getByText("Page 1 of 5")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(51); // header + 50
  });

  it("Next moves to page 2", () => {
    const games = manyGames(fx.games[0]!, 201);
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={games} onOpenGame={() => {}} onBack={() => {}} />);
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Page 2 of 5")).toBeTruthy();
  });

  it("changing a filter resets to page 1", () => {
    // 402 rows split evenly across two rivals: filtering down to one rival (201 rows) still paginates.
    const games = manyGames(fx.games[0]!, 402);
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={games} onOpenGame={() => {}} onBack={() => {}} />);
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Page 2 of 9")).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("All opponents"), { target: { value: games[0]!.rival } });
    expect(screen.getByText("Page 1 of 5")).toBeTruthy();
  });

  it("Previous is disabled on page 1, Next is disabled on the last page", () => {
    const games = manyGames(fx.games[0]!, 201);
    render(<MatchesScreen runId={fx.runId} summary={fx.summary} games={games} onOpenGame={() => {}} onBack={() => {}} />);
    expect((screen.getByText("Previous").closest("button") as HTMLButtonElement).disabled).toBe(true);
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Page 5 of 5")).toBeTruthy();
    expect((screen.getByText("Next").closest("button") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("MatchesScreen filters reset is the App container's job via key={runId} (C3)", () => {
  it("uses initialFilters only on mount; switching runs without remounting is no longer this component's responsibility", () => {
    const rival = fx.games[0]!.rival;
    const { unmount } = render(
      <MatchesScreen runId="run-a" summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} initialFilters={{ rival }} />,
    );
    expect(screen.getByDisplayValue(rival)).toBeTruthy();
    unmount();
    render(<MatchesScreen runId="run-b" summary={fx.summary} games={fx.games} onOpenGame={() => {}} onBack={() => {}} initialFilters={{}} />);
    expect(screen.getByDisplayValue("All opponents")).toBeTruthy();
  });
});
