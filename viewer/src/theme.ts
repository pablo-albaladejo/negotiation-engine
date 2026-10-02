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

/** D9: once the user has made an explicit choice, OS changes stop driving the theme. */
export function hasStoredTheme(): boolean {
  return readStoredTheme() !== null;
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode, quota, disabled): the viewer still renders fine, just without persistence.
  }
}

/** D9: follows `prefers-color-scheme` changes live, but only while there is no stored (explicit) choice.
 * Returns an unsubscribe function; never throws even if `matchMedia` is unavailable. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  try {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      if (hasStoredTheme()) return;
      onChange(e.matches ? "dark" : "light");
    };
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  } catch {
    return () => {};
  }
}
