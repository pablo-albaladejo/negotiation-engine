export type Route =
  | { screen: "runs" }
  | { screen: "matches"; runId: string }
  | { screen: "arena-replay"; runId: string; gameId: string }
  | { screen: "tournament-replay"; runId: string; session: string }
  | { screen: "states" };

/** Router mínimo por hash: sin dependencias, suficiente para P1–P4 y P8. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [head, a, mid, b] = parts;
  if (head === "states") return { screen: "states" };
  if (head === "tournament" && a !== undefined && mid !== undefined) return { screen: "tournament-replay", runId: a, session: mid };
  if (head === "runs" && a !== undefined && mid === "games" && b !== undefined) return { screen: "arena-replay", runId: a, gameId: b };
  if (head === "runs" && a !== undefined) return { screen: "matches", runId: a };
  return { screen: "runs" };
}

export const routeTo = {
  runs: (): string => "#/runs",
  matches: (runId: string): string => `#/runs/${encodeURIComponent(runId)}`,
  arenaReplay: (runId: string, gameId: string): string => `#/runs/${encodeURIComponent(runId)}/games/${encodeURIComponent(gameId)}`,
  tournamentReplay: (runId: string, session: string): string => `#/tournament/${encodeURIComponent(runId)}/${encodeURIComponent(session)}`,
  states: (): string => "#/states",
};
