/** The 5 nav tabs that have no route of their own: clicking one goes to `#/find/<tab>`, which
 * resolves (last viewed / most recent / empty) to a real route or an in-page empty state (spec
 * "8 top-level tabs", item 1). */
export type FindTab = "matches" | "arena-replay" | "tournament-replay" | "two-issue" | "compare";
export const FIND_TABS: readonly FindTab[] = ["matches", "arena-replay", "tournament-replay", "two-issue", "compare"];

export type Route =
  | { screen: "runs" }
  | { screen: "matches"; runId: string; query: string }
  | { screen: "arena-replay"; runId: string; gameId: string; query: string }
  | { screen: "tournament-replay"; runId: string; session: string }
  | { screen: "compare"; runId: string }
  | { screen: "states" }
  | { screen: "live" }
  | { screen: "find"; tab: FindTab };

/** Separa la parte de ruta de la de query string (p. ej. "runs/r-1?role=buyer" -> ["runs/r-1", "role=buyer"]). */
function splitQuery(path: string): [string, string] {
  const i = path.indexOf("?");
  return i === -1 ? [path, ""] : [path.slice(0, i), path.slice(i + 1)];
}

/** T1: a malformed `%` sequence (e.g. a run id typed/pasted with a stray `%`) must not throw and
 * blank the whole app; fall back to the raw segment instead of crashing the router. */
function safeDecode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/** Router mínimo por hash: sin dependencias, suficiente para P1–P6 y P8 (P5 comparte ruta con P3). */
export function parseRoute(hash: string): Route {
  const [pathPart, query] = splitQuery(hash.replace(/^#\/?/, ""));
  const parts = pathPart.split("/").filter(Boolean).map(safeDecode);
  const [head, a, mid, b] = parts;
  if (head === "states") return { screen: "states" };
  if (head === "live") return { screen: "live" };
  if ((head === "compare" || head === "promote") && a !== undefined) return { screen: "compare", runId: a };
  if (head === "tournament" && a !== undefined && mid !== undefined) return { screen: "tournament-replay", runId: a, session: mid };
  if (head === "runs" && a !== undefined && mid === "games" && b !== undefined) return { screen: "arena-replay", runId: a, gameId: b, query };
  if (head === "runs" && a !== undefined) return { screen: "matches", runId: a, query };
  if (head === "find" && (FIND_TABS as readonly string[]).includes(a ?? "")) return { screen: "find", tab: a as FindTab };
  return { screen: "runs" };
}

export const routeTo = {
  runs: (): string => "#/runs",
  matches: (runId: string, query?: string): string => `#/runs/${encodeURIComponent(runId)}${query ? `?${query}` : ""}`,
  arenaReplay: (runId: string, gameId: string, query?: string): string =>
    `#/runs/${encodeURIComponent(runId)}/games/${encodeURIComponent(gameId)}${query ? `?${query}` : ""}`,
  tournamentReplay: (runId: string, session: string): string => `#/tournament/${encodeURIComponent(runId)}/${encodeURIComponent(session)}`,
  /** Primary route (INBOX B1); `routeTo.promote` is kept only so old links/bookmarks still resolve. */
  compare: (runId: string): string => `#/compare/${encodeURIComponent(runId)}`,
  promote: (runId: string): string => `#/promote/${encodeURIComponent(runId)}`,
  states: (): string => "#/states",
  live: (): string => "#/live",
  find: (tab: FindTab): string => `#/find/${tab}`,
};
