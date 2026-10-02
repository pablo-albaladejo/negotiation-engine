/**
 * "Last viewed" pointers for the nav tabs that have no route of their own (Matches, Replay ·
 * arena, Two dimensions): remembered in `sessionStorage` (best-effort; storage may be
 * unavailable in private mode, in which case the tab falls back to "most recent") so switching
 * tabs and coming back lands where the user left off, not always on the newest run.
 */
const PREFIX = "nr-viewer:last-viewed:";

function safeGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(`${PREFIX}${key}`);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(`${PREFIX}${key}`, value);
  } catch {
    // Storage unavailable: the viewer still works, just without "last viewed" memory.
  }
}

export const lastViewed = {
  run: (): string | null => safeGet("run"),
  rememberRun: (runId: string): void => safeSet("run", runId),
  arenaMatch: (): string | null => safeGet("arena-match"),
  rememberArenaMatch: (hash: string): void => safeSet("arena-match", hash),
  twoIssueMatch: (): string | null => safeGet("two-issue-match"),
  rememberTwoIssueMatch: (hash: string): void => safeSet("two-issue-match", hash),
};
