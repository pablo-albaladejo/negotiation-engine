import type { TranscriptLine } from "../../src/arena/results-schema.js";
import { fetchApi } from "./api.js";
import { isTwoIssue, runsModel, type RunEntry } from "./model/index.js";
import { lastViewed } from "./last-viewed.js";
import { parseRoute, routeTo, type FindTab } from "./route.js";

export interface FindResult {
  /** A real route to redirect to (the hash router swaps it in place, L1). */
  target?: string;
  /** No destination exists (never invented): the title names exactly what is missing in `results/`. */
  empty?: string;
}

const found = (target: string): FindResult => ({ target });
const empty = (title: string): FindResult => ({ empty: title });

/** Most recent run first, by the same ordering `RunsScreen` uses (`runsModel`'s `createdAt` sort). */
function newestFirst(entries: readonly RunEntry[]): RunEntry[] {
  const order = runsModel(entries).map((r) => r.runId);
  const byId = new Map(entries.map((e) => [e.runId, e]));
  return order.map((id) => byId.get(id)!).filter((e): e is RunEntry => e !== undefined);
}

async function runGames(runId: string): Promise<TranscriptLine[]> {
  const res = await fetchApi<{ games: TranscriptLine[] }>(`runs/${encodeURIComponent(runId)}`);
  return res.data?.games ?? [];
}

/**
 * X4: a remembered arena/two-issue route can go stale (its run or match no longer exists in
 * `results/`, e.g. after a re-run) -- never trust it blind. `null` when the remembered hash isn't
 * even an arena-replay route, its run is gone, or its game is gone from that run.
 */
async function validArenaRoute(hash: string, entries: readonly RunEntry[]): Promise<string | null> {
  const route = parseRoute(hash);
  if (route.screen !== "arena-replay") return null;
  if (!entries.some((e) => e.runId === route.runId)) return null;
  const games = await runGames(route.runId);
  return games.some((g) => g.gameId === route.gameId) ? hash : null;
}

/** Matches tab: last viewed run (if it still exists), else the most recent run, else empty. */
export async function resolveMatches(entries: readonly RunEntry[]): Promise<FindResult> {
  const last = lastViewed.run();
  if (last && entries.some((e) => e.runId === last)) return found(routeTo.matches(last));
  const first = newestFirst(entries)[0];
  if (first) return found(routeTo.matches(first.runId));
  return empty("No runs in results/");
}

/** Replay · arena tab: last viewed arena match, else the first match of the Matches-tab run, else empty. */
export async function resolveArenaReplay(entries: readonly RunEntry[]): Promise<FindResult> {
  const last = lastViewed.arenaMatch();
  const valid = last ? await validArenaRoute(last, entries) : null;
  if (valid) return found(valid);
  for (const run of newestFirst(entries)) {
    const games = await runGames(run.runId);
    const first = games[0];
    if (first) return found(routeTo.arenaReplay(run.runId, first.gameId));
  }
  return empty("No matches in results/");
}

/** Replay · tournament tab: the most recent run/session with a tournament log, else empty. */
export async function resolveTournamentReplay(entries: readonly RunEntry[]): Promise<FindResult> {
  const tournamentRuns = newestFirst(entries).filter((e) => e.kind === "tournament");
  for (const run of tournamentRuns) {
    const res = await fetchApi<string[]>(`tournament/${encodeURIComponent(run.runId)}`);
    const sessions = res.data ?? [];
    const session = sessions[sessions.length - 1];
    if (session) return found(routeTo.tournamentReplay(run.runId, session));
  }
  return empty("No tournament log in results/");
}

/** Two dimensions tab: last viewed two-issue match, else the first two-issue match found, else empty. */
export async function resolveTwoIssue(entries: readonly RunEntry[]): Promise<FindResult> {
  const last = lastViewed.twoIssueMatch();
  const valid = last ? await validArenaRoute(last, entries) : null;
  if (valid) return found(valid);
  for (const run of newestFirst(entries)) {
    const games = await runGames(run.runId);
    const match = games.find((g) => isTwoIssue(g));
    if (match) return found(routeTo.arenaReplay(run.runId, match.gameId));
  }
  return empty("No two-issue match in results/");
}

/** Champion vs candidate tab: the most recent run with `gate.json` (`kind: "promotion"`), else empty. */
export async function resolveCompare(entries: readonly RunEntry[]): Promise<FindResult> {
  const run = newestFirst(entries).find((e) => e.kind === "promotion");
  if (run) return found(routeTo.compare(run.runId));
  return empty("No gate.json in results/ — run the promotion gate first");
}

export function resolveFindTab(tab: FindTab, entries: readonly RunEntry[]): Promise<FindResult> {
  switch (tab) {
    case "matches":
      return resolveMatches(entries);
    case "arena-replay":
      return resolveArenaReplay(entries);
    case "tournament-replay":
      return resolveTournamentReplay(entries);
    case "two-issue":
      return resolveTwoIssue(entries);
    case "compare":
      return resolveCompare(entries);
  }
}
