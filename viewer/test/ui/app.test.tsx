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

  it("C3: switching to another run id resets Matches filters instead of keeping the previous run's (keyed container)", async () => {
    const otherRunId = `${fx.runId}-other`;
    window.location.hash = `#/runs/${fx.runId}?role=buyer`;
    render(<App />);
    await waitFor(() => expect(screen.getByText(new RegExp(`${fx.runId} · matches`))).toBeTruthy());
    const buyerTab = screen.getByRole("tab", { name: "Buyer" });
    expect(buyerTab.getAttribute("aria-selected")).toBe("true");

    window.location.hash = `#/runs/${otherRunId}`;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await waitFor(() => expect(screen.getByText(new RegExp(`${otherRunId} · matches`))).toBeTruthy());
    expect(screen.getByRole("tab", { name: "Buyer" }).getAttribute("aria-selected")).toBe("false");
  });
});
