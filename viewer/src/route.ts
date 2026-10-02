export type Route =
  | { screen: "runs" }
  | { screen: "matches"; runId: string; query: string }
  | { screen: "arena-replay"; runId: string; gameId: string }
  | { screen: "tournament-replay"; runId: string; session: string }
  | { screen: "promote"; runId: string }
  | { screen: "states" }
  | { screen: "live" };

/** Separa la parte de ruta de la de query string (p. ej. "runs/r-1?role=buyer" -> ["runs/r-1", "role=buyer"]). */
function splitQuery(path: string): [string, string] {
  const i = path.indexOf("?");
  return i === -1 ? [path, ""] : [path.slice(0, i), path.slice(i + 1)];
}

/** Router mínimo por hash: sin dependencias, suficiente para P1–P6 y P8 (P5 comparte ruta con P3). */
export function parseRoute(hash: string): Route {
  const [pathPart, query] = splitQuery(hash.replace(/^#\/?/, ""));
  const parts = pathPart.split("/").filter(Boolean).map(decodeURIComponent);
  const [head, a, mid, b] = parts;
  if (head === "states") return { screen: "states" };
  if (head === "live") return { screen: "live" };
  if (head === "promote" && a !== undefined) return { screen: "promote", runId: a };
  if (head === "tournament" && a !== undefined && mid !== undefined) return { screen: "tournament-replay", runId: a, session: mid };
  if (head === "runs" && a !== undefined && mid === "games" && b !== undefined) return { screen: "arena-replay", runId: a, gameId: b };
  if (head === "runs" && a !== undefined) return { screen: "matches", runId: a, query };
  return { screen: "runs" };
}

export const routeTo = {
  runs: (): string => "#/runs",
  matches: (runId: string, query?: string): string => `#/runs/${encodeURIComponent(runId)}${query ? `?${query}` : ""}`,
  arenaReplay: (runId: string, gameId: string): string => `#/runs/${encodeURIComponent(runId)}/games/${encodeURIComponent(gameId)}`,
  tournamentReplay: (runId: string, session: string): string => `#/tournament/${encodeURIComponent(runId)}/${encodeURIComponent(session)}`,
  promote: (runId: string): string => `#/promote/${encodeURIComponent(runId)}`,
  states: (): string => "#/states",
  live: (): string => "#/live",
};
