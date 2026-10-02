// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Summary, TranscriptLine } from "../../../src/arena/results-schema.js";
import { App } from "../../src/App.js";
import { generateFixtures } from "../fixtures.js";

let fx: Awaited<ReturnType<typeof generateFixtures>>;
beforeAll(async () => {
  fx = await generateFixtures();
});
afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function mockFetch(summary: Summary, games: TranscriptLine[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/champion")) return new Response(JSON.stringify({ data: null, errors: [] }));
      if (url.includes("/api/runs/") && url.includes("/games/")) return new Response(JSON.stringify({ data: [], errors: [] }));
      if (url.includes("/api/runs/")) return new Response(JSON.stringify({ data: { runId: summary.runId, summary, games }, errors: [] }));
      if (url.endsWith("/api/runs")) return new Response(JSON.stringify({ data: [], errors: [] }));
      return new Response(JSON.stringify({ data: null, errors: [] }));
    }),
  );
}

describe("App theme toggle (B1)", () => {
  beforeEach(() => {
    mockFetch(fx.summary, fx.games);
    window.localStorage.clear();
  });

  it("toggles data-theme on the root and persists the choice", async () => {
    window.location.hash = "#/runs";
    const { container } = render(<App />);
    const root = container.querySelector(".nr-root")!;
    const button = screen.getByText(/mode$/i);
    const before = root.getAttribute("data-theme");
    fireEvent.click(button);
    const after = root.getAttribute("data-theme");
    expect(after).not.toBe(before);
    expect(window.localStorage.getItem("nr-theme")).toBe(after);
  });

  it("keeps document.documentElement's data-theme in sync with the toggle (D2)", async () => {
    window.location.hash = "#/runs";
    render(<App />);
    const button = screen.getByText(/mode$/i);
    const before = document.documentElement.dataset.theme;
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).not.toBe(before);
    expect(document.documentElement.dataset.theme).toBe(window.localStorage.getItem("nr-theme"));
  });
});

describe("App routing (C2, C3)", () => {
  beforeEach(() => {
    mockFetch(fx.summary, fx.games);
  });

  it("C2: opening a replay with a Matches query, then back, preserves the filter (role=buyer)", async () => {
    window.location.hash = `#/runs/${fx.runId}?role=buyer`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    const firstGameId = fx.games[0]!.gameId;
    fireEvent.click(screen.getByText(firstGameId));
    await waitFor(() => expect(window.location.hash).toContain(`/games/${encodeURIComponent(firstGameId)}`));
    expect(window.location.hash).toContain("role=buyer");
    const backLink = await screen.findByText("← Matches");
    fireEvent.click(backLink);
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}?role=buyer`));
  });

  it("T2: filtering via the UI updates the address bar immediately (replaceRoute keeps route state in sync)", async () => {
    window.location.hash = `#/runs/${fx.runId}`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    fireEvent.click(screen.getByRole("tab", { name: "Buyer" }));
    expect(window.location.hash).toBe(`#/runs/${fx.runId}?role=buyer`);
    const firstGameId = fx.games[0]!.gameId;
    fireEvent.click(screen.getByText(firstGameId));
    await waitFor(() => expect(window.location.hash).toContain(`/games/${encodeURIComponent(firstGameId)}`));
    expect(window.location.hash).toContain("role=buyer");
    const backLink = await screen.findByText("← Matches");
    fireEvent.click(backLink);
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}?role=buyer`));
  });

  it("T4: role filter survives opening a game and coming back; the table shows only that role", async () => {
    window.location.hash = `#/runs/${fx.runId}`;
    const { container } = render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} \u00b7 matches`))).toBeTruthy());

    fireEvent.click(screen.getByRole("tab", { name: "Buyer" }));
    expect(window.location.hash).toBe(`#/runs/${fx.runId}?role=buyer`);

    const buyerGame = fx.games.find((g) => g.role === "buyer")!;
    fireEvent.click(screen.getByText(buyerGame.gameId));
    await waitFor(() => expect(window.location.hash).toContain(`/games/${encodeURIComponent(buyerGame.gameId)}`));
    expect(window.location.hash).toContain("role=buyer");

    const backLink = await screen.findByText("\u2190 Matches");
    fireEvent.click(backLink);
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}?role=buyer`));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Buyer" }).getAttribute("aria-selected")).toBe("true"));

    const roleCells = [...container.querySelectorAll(".nr-table-wrap tbody tr")].map((row) => row.children[3]?.textContent);
    const expectedCount = fx.games.filter((g) => g.role === "buyer").length;
    expect(roleCells.length).toBe(expectedCount);
    expect(roleCells.every((text) => text === "Buyer")).toBe(true);
  });

  it("C3: switching to another run id resets Matches filters instead of keeping the previous run's (keyed container)", async () => {
    const otherRunId = `${fx.runId}-other`;
    window.location.hash = `#/runs/${fx.runId}?role=buyer`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    const buyerTab = screen.getByRole("tab", { name: "Buyer" });
    expect(buyerTab.getAttribute("aria-selected")).toBe("true");

    window.location.hash = `#/runs/${otherRunId}`;
    await waitFor(() => expect(screen.getByText(new RegExp(`${otherRunId} · matches`))).toBeTruthy());
    expect(screen.getByRole("tab", { name: "Buyer" }).getAttribute("aria-selected")).toBe("false");
  });
});

describe("App back/forward across routes (B3)", () => {
  beforeEach(() => {
    mockFetch(fx.summary, fx.games);
  });

  it("browser back/forward re-render the right screen after Runs -> Matches -> Replay (T3)", async () => {
    window.location.hash = "#/runs";
    render(<App />);
    expect(window.location.hash).toBe("#/runs");
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Runs" })).toBeTruthy());

    window.location.hash = `#/runs/${fx.runId}`;
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}`));
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());

    const firstGameId = fx.games[0]!.gameId;
    fireEvent.click(screen.getByText(firstGameId));
    await waitFor(() => expect(window.location.hash).toContain(`/games/${encodeURIComponent(firstGameId)}`));
    await screen.findByText("← Matches");

    window.history.back();
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}`));
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());

    window.history.back();
    await waitFor(() => expect(window.location.hash).toBe("#/runs"));
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Runs" })).toBeTruthy());

    window.history.forward();
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}`));
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());

    window.history.forward();
    await waitFor(() => expect(window.location.hash).toContain(`/games/${encodeURIComponent(firstGameId)}`));
    await screen.findByText("← Matches");
  });
});


describe("App routing: Matches page persists through replay and back (T7)", () => {
  it("page 2 -> open game -> back -> 'Page 2 of N'", async () => {
    const games = Array.from({ length: 201 }, (_, i) => ({ ...fx.games[0]!, gameId: `g-${i}` }));
    mockFetch(fx.summary, games);
    window.location.hash = `#/runs/${fx.runId}`;
    render(<App />);
    await waitFor(() => expect(screen.getByText("Page 1 of 5")).toBeTruthy());
    fireEvent.click(screen.getByText("Next"));
    await waitFor(() => expect(screen.getByText("Page 2 of 5")).toBeTruthy());
    expect(window.location.hash).toBe(`#/runs/${fx.runId}?p=2`);
    fireEvent.click(screen.getByText("g-50"));
    await waitFor(() => expect(window.location.hash).toContain("/games/g-50"));
    const backLink = await screen.findByText("← Matches");
    fireEvent.click(backLink);
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}?p=2`));
    expect(screen.getByText("Page 2 of 5")).toBeTruthy();
  });
});

describe("App Runs: invalid config/champion.json shows the InvalidLogBanner (L11)", () => {
  it("renders the schema-failure banner on Runs when /api/champion reports errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/champion")) {
          return new Response(
            JSON.stringify({ data: null, errors: [{ file: "config/champion.json", line: null, path: "version", message: "invalid" }] }),
          );
        }
        if (url.endsWith("/api/runs")) return new Response(JSON.stringify({ data: [], errors: [] }));
        return new Response(JSON.stringify({ data: null, errors: [] }));
      }),
    );
    window.location.hash = "#/runs";
    render(<App />);
    await screen.findByText("schema fails");
  });
});

describe("App routing: switching games in a replay caches the run payload (T9)", () => {
  it("only refetches the trace, not the run summary/games list, when the game changes", async () => {
    expect(fx.games.length).toBeGreaterThan(1);
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("/api/champion")) return new Response(JSON.stringify({ data: null, errors: [] }));
        if (url.includes("/api/runs/") && url.includes("/games/")) return new Response(JSON.stringify({ data: [], errors: [] }));
        if (url.includes("/api/runs/")) return new Response(JSON.stringify({ data: { runId: fx.summary.runId, summary: fx.summary, games: fx.games }, errors: [] }));
        return new Response(JSON.stringify({ data: null, errors: [] }));
      }),
    );
    const [firstGame, secondGame] = fx.games;
    window.location.hash = `#/runs/${fx.runId}/games/${encodeURIComponent(firstGame!.gameId)}`;
    render(<App />);
    await waitFor(() => expect(calls.some((u) => u.includes(`/games/${encodeURIComponent(firstGame!.gameId)}`))).toBe(true));
    const runCallsAfterFirst = calls.filter((u) => u.includes("/api/runs/") && !u.includes("/games/")).length;
    expect(runCallsAfterFirst).toBe(1);

    window.location.hash = `#/runs/${fx.runId}/games/${encodeURIComponent(secondGame!.gameId)}`;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await waitFor(() => expect(calls.some((u) => u.includes(`/games/${encodeURIComponent(secondGame!.gameId)}`))).toBe(true));

    const runCallsAfterSecond = calls.filter((u) => u.includes("/api/runs/") && !u.includes("/games/")).length;
    expect(runCallsAfterSecond).toBe(1);
    const traceCalls = calls.filter((u) => u.includes("/games/")).length;
    expect(traceCalls).toBe(2);
  });
});

describe("App routing: dropping an unsupported 'injection' filter keeps the page (C5)", () => {
  it("strips injection=1 for a run without injection data without resetting p= back to the first page", async () => {
    const withoutInjectionField = fx.games.map((g) => ({ ...g, metrics: { ...g.metrics, injectionSuspected: undefined } }));
    mockFetch(fx.summary, withoutInjectionField);
    window.location.hash = `#/runs/${fx.runId}?injection=1&p=2`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}?p=2`));
    expect(screen.queryByText("With injection")).toBeNull();
  });
});

describe("App routing: switching games never pairs the new game with the previous trace (C4)", () => {
  it("shows the loading state for the new game while its trace is still in flight, not the previous game's content", async () => {
    const [firstGame, secondGame] = fx.games;
    expect(fx.traces.has(firstGame!.gameId)).toBe(true);
    expect(fx.traces.has(secondGame!.gameId)).toBe(true);
    let resolveSecondTrace: (res: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/champion")) return new Response(JSON.stringify({ data: null, errors: [] }));
        if (url.includes(`/games/${encodeURIComponent(secondGame!.gameId)}`)) {
          return new Promise<Response>((resolve) => {
            resolveSecondTrace = resolve;
          });
        }
        if (url.includes(`/games/${encodeURIComponent(firstGame!.gameId)}`)) {
          return new Response(JSON.stringify({ data: fx.traces.get(firstGame!.gameId), errors: [] }));
        }
        if (url.includes("/api/runs/")) return new Response(JSON.stringify({ data: { runId: fx.summary.runId, summary: fx.summary, games: fx.games }, errors: [] }));
        return new Response(JSON.stringify({ data: null, errors: [] }));
      }),
    );
    window.location.hash = `#/runs/${fx.runId}/games/${encodeURIComponent(firstGame!.gameId)}`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(firstGame!.gameId))).toBeTruthy());

    window.location.hash = `#/runs/${fx.runId}/games/${encodeURIComponent(secondGame!.gameId)}`;
    await waitFor(() => expect(screen.getByText(`Reading ${secondGame!.gameId}`)).toBeTruthy());
    expect(screen.queryByText(new RegExp(firstGame!.gameId))).toBeNull();

    resolveSecondTrace(new Response(JSON.stringify({ data: fx.traces.get(secondGame!.gameId), errors: [] })));
    await waitFor(() => expect(screen.getByText(new RegExp(secondGame!.gameId))).toBeTruthy());
  });
});

describe("App focus-on-navigation (C1)", () => {
  beforeEach(() => {
    mockFetch(fx.summary, fx.games);
  });

  it("clicking a filter tab keeps focus on it instead of jumping to the heading", async () => {
    window.location.hash = `#/runs/${fx.runId}`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    const buyerTab = screen.getByRole("tab", { name: "Buyer" });
    buyerTab.focus();
    fireEvent.click(buyerTab);
    await waitFor(() => expect(window.location.hash).toBe(`#/runs/${fx.runId}?role=buyer`));
    expect(document.activeElement).toBe(buyerTab);
  });

  it("Clear filters focuses the results count, not the heading", async () => {
    window.location.hash = `#/runs/${fx.runId}`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    fireEvent.click(screen.getByLabelText("With fallback"));
    await waitFor(() => expect(screen.getAllByText("No matches for these filters").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText("Clear filters"));
    await waitFor(() => expect(document.activeElement?.textContent).toContain("matches"));
    expect(document.activeElement?.textContent).toMatch(/^Showing/);
  });

  it("navigating from Runs to a run focuses its heading once data has loaded", async () => {
    window.location.hash = "#/runs";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Runs" })).toBeTruthy());
    window.location.hash = `#/runs/${fx.runId}`;
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    const heading = screen.getByRole("heading", { level: 2, name: new RegExp(`${fx.runId} · matches`) });
    expect(document.activeElement).toBe(heading);
  });
});

describe("App Runs: a rejecting /api/champion fetch (T5)", () => {
  it("renders Runs with no champion pill instead of an unhandled rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/champion")) throw new Error("network down");
        if (url.endsWith("/api/runs")) return new Response(JSON.stringify({ data: [], errors: [] }));
        return new Response(JSON.stringify({ data: null, errors: [] }));
      }),
    );
    window.location.hash = "#/runs";
    render(<App />);
    await screen.findByText("No runs yet");
    expect(screen.queryByText("champion")).toBeNull();
  });
});

describe("App top-level error boundary (C11)", () => {
  it("renders the DS warning banner instead of a blank page when a screen throws while rendering", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        // A tournament trace with no header: tournamentReplayModel throws synchronously (a real
        // production code path, not a test-only stub) instead of returning a model.
        if (url.includes("/api/tournament/")) return new Response(JSON.stringify({ data: [], errors: [] }));
        return new Response(JSON.stringify({ data: null, errors: [] }));
      }),
    );
    window.location.hash = "#/tournament/run-x/session-y";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByText("Something went wrong rendering this screen")).toBeTruthy();
    expect(screen.queryByText("Arena viewer")).toBeNull();
    consoleError.mockRestore();
  });
});
