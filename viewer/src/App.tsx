import { Root, WarningBanner } from "@negotiation-ring/design-system";
import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { SecondaryButton } from "./ui/buttons.js";
import { initialTheme, storeTheme, watchSystemTheme, type Theme } from "./theme.js";
import { boardQuery, parseBoardQuery } from "./model/index.js";
import { parseRoute, routeTo, type Route } from "./route.js";
import { BazaarScreen } from "./screens/BazaarScreen.js";
import { useBazaarBoard } from "./bazaarBoardLive.js";

function useHashRoute(): { route: Route; replaceRoute: (hash: string) => void } {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  /** `history.replaceState` (filtros sin entrada nueva en el historial) no dispara `hashchange`:
   * se actualiza el estado local en la misma llamada para que la ruta siga a la barra de direcciones. */
  const replaceRoute = (next: string) => {
    window.history.replaceState(null, "", next);
    setHash(next);
  };
  return { route: parseRoute(hash), replaceRoute };
}

function BazaarContainer({ query, replaceRoute }: { query: string; replaceRoute: (hash: string) => void }) {
  const { board, model } = useBazaarBoard();
  return <BazaarScreen board={board} model={model} filters={parseBoardQuery(query)} onFiltersChange={(f) => replaceRoute(routeTo.bazaar(boardQuery(f)))} />;
}

function AppContent() {
  const { route, replaceRoute } = useHashRoute();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.title = "Bazaar · Viewer";
  }, []);
  /** Mantiene <html data-theme> (puesto antes del primer pintado en index.html) igual que el estado. */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => watchSystemTheme(setTheme), []);
  /** La altura real de la cabecera fija alimenta `--header-height` (scroll-padding del sistema de diseño). */
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  });
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    storeTheme(next);
  };
  return (
    <Root theme={theme}>
      <header ref={headerRef} style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "var(--space-4) var(--gutter)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <h1 className="nr-title">Bazaar Viewer</h1>
          <SecondaryButton onClick={toggleTheme} aria-pressed={theme === "dark"}>{theme === "dark" ? "Theme: dark" : "Theme: light"}</SecondaryButton>
        </div>
      </header>
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "var(--space-5) var(--gutter) 48px", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <BazaarContainer query={route.query} replaceRoute={replaceRoute} />
      </main>
    </Root>
  );
}

/**
 * C11: a render error anywhere below (a screen throwing on malformed data the API layer didn't
 * already turn into an `ApiError`, a future regression, etc.) used to blank the whole page -- React
 * unmounts the tree above the nearest boundary. Catches it and renders the DS error state instead,
 * with enough theme/layout to not look broken itself.
 */
class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Viewer crashed while rendering", error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <Root theme="dark">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px var(--gutter)" }}>
          <WarningBanner tone="warn" title="Something went wrong rendering this screen">
            <span className="nr-muted">{this.state.error.message || "not logged"}</span>
          </WarningBanner>
        </div>
      </Root>
    );
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}
