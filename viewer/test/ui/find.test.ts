import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TranscriptLine } from "../../../src/arena/results-schema.js";
import type { RunEntry } from "../../src/model/index.js";

const fetchApiMock = vi.fn();
vi.mock("../../src/api.js", () => ({ fetchApi: (...args: unknown[]) => fetchApiMock(...args) }));

const lastViewedMock = {
  run: vi.fn(() => null as string | null),
  rememberRun: vi.fn(),
  arenaMatch: vi.fn(() => null as string | null),
  rememberArenaMatch: vi.fn(),
  twoIssueMatch: vi.fn(() => null as string | null),
  rememberTwoIssueMatch: vi.fn(),
};
vi.mock("../../src/last-viewed.js", () => ({ lastViewed: lastViewedMock }));

const { resolveMatches, resolveArenaReplay, resolveTournamentReplay, resolveTwoIssue, resolveCompare } = await import("../../src/find.js");

function entry(runId: string, kind: RunEntry["kind"], createdAt: string | null = null): RunEntry {
  return { runId, kind, summary: createdAt ? ({ createdAt, config: { path: "x", version: 1 }, overall: {} } as never) : null };
}

const game = (gameId: string, issues: number): TranscriptLine =>
  ({
    gameId,
    transcript: [{ offer: Object.fromEntries(Array.from({ length: issues }, (_v, i) => [`i${i}`, 1])) }],
  } as unknown as TranscriptLine);

beforeEach(() => {
  fetchApiMock.mockReset();
  lastViewedMock.run.mockReturnValue(null);
  lastViewedMock.arenaMatch.mockReturnValue(null);
  lastViewedMock.twoIssueMatch.mockReturnValue(null);
});
afterEach(() => vi.clearAllMocks());

describe("resolveMatches", () => {
  it("uses the last viewed run when it still exists", async () => {
    lastViewedMock.run.mockReturnValue("r-2");
    const res = await resolveMatches([entry("r-1", "arena", "2026-01-01"), entry("r-2", "arena", "2026-01-02")]);
    expect(res.target).toBe("#/runs/r-2");
  });

  it("falls back to the most recent run when nothing was last viewed", async () => {
    const res = await resolveMatches([entry("r-1", "arena", "2026-01-01"), entry("r-2", "arena", "2026-01-02")]);
    expect(res.target).toBe("#/runs/r-2");
  });

  it("empty state when there are no runs", async () => {
    const res = await resolveMatches([]);
    expect(res.empty).toBe("No runs in results/");
  });
});

describe("resolveArenaReplay", () => {
  it("uses the last viewed arena match when set", async () => {
    lastViewedMock.arenaMatch.mockReturnValue("#/runs/r-1/games/g-1");
    const res = await resolveArenaReplay([entry("r-1", "arena", "2026-01-01")]);
    expect(res.target).toBe("#/runs/r-1/games/g-1");
  });

  it("falls back to the first match of the most recent run", async () => {
    fetchApiMock.mockResolvedValue({ data: { games: [game("g-1", 1), game("g-2", 1)] }, errors: [] });
    const res = await resolveArenaReplay([entry("r-1", "arena", "2026-01-01")]);
    expect(res.target).toBe("#/runs/r-1/games/g-1");
  });

  it("empty state when the run has no matches", async () => {
    fetchApiMock.mockResolvedValue({ data: { games: [] }, errors: [] });
    const res = await resolveArenaReplay([entry("r-1", "arena", "2026-01-01")]);
    expect(res.empty).toBe("No matches in results/");
  });
});

describe("resolveTournamentReplay", () => {
  it("most recent run of kind tournament with a non-empty session list", async () => {
    fetchApiMock.mockResolvedValue({ data: ["s-1", "s-2"], errors: [] });
    const res = await resolveTournamentReplay([entry("r-1", "arena", "2026-01-01"), entry("agent-1", "tournament", "2026-01-02")]);
    expect(res.target).toBe("#/tournament/agent-1/s-2");
  });

  it("empty state naming what's missing when no run has a tournament log", async () => {
    const res = await resolveTournamentReplay([entry("r-1", "arena", "2026-01-01")]);
    expect(res.empty).toBe("No tournament log in results/");
  });
});

describe("resolveTwoIssue", () => {
  it("uses the last viewed two-issue match when set", async () => {
    lastViewedMock.twoIssueMatch.mockReturnValue("#/runs/r-1/games/g-2");
    const res = await resolveTwoIssue([entry("r-1", "arena", "2026-01-01")]);
    expect(res.target).toBe("#/runs/r-1/games/g-2");
  });

  it("finds the first two-issue match across runs", async () => {
    fetchApiMock.mockResolvedValue({ data: { games: [game("g-1", 1), game("g-2", 2)] }, errors: [] });
    const res = await resolveTwoIssue([entry("r-1", "arena", "2026-01-01")]);
    expect(res.target).toBe("#/runs/r-1/games/g-2");
  });

  it("empty state when no run has a two-issue match", async () => {
    fetchApiMock.mockResolvedValue({ data: { games: [game("g-1", 1)] }, errors: [] });
    const res = await resolveTwoIssue([entry("r-1", "arena", "2026-01-01")]);
    expect(res.empty).toBe("No two-issue match in results/");
  });
});

describe("resolveCompare", () => {
  it("most recent run with gate.json (kind: promotion)", async () => {
    const res = await resolveCompare([entry("r-1", "arena", "2026-01-01"), entry("r-2", "promotion", "2026-01-02")]);
    expect(res.target).toBe("#/compare/r-2");
  });

  it("empty state naming gate.json when missing", async () => {
    const res = await resolveCompare([entry("r-1", "arena", "2026-01-01")]);
    expect(res.empty).toBe("No gate.json in results/ — run the promotion gate first");
  });
});
