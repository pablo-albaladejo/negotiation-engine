export type Theme = "light" | "dark";

const STORAGE_KEY = "nr-theme";

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/** B1: default follows `prefers-color-scheme`; an explicit choice is persisted (best-effort; storage may be unavailable). */
export function initialTheme(): Theme {
  return readStoredTheme() ?? (prefersDark() ? "dark" : "light");
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode, quota, disabled): the viewer still renders fine, just without persistence.
  }
}
