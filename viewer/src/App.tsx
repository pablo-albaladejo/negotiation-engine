import { ModeBadge, Root, Tabs, WarningBanner } from "@negotiation-ring/design-system";
import { Component, useEffect, useLayoutEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { SecondaryButton } from "./ui/buttons.js";
import { initialTheme, storeTheme, watchSystemTheme, type Theme } from "./theme.js";
import { requestPageFocus } from "./focus.js";
import type { GateFile, Summary, TranscriptLine } from "../../src/arena/results-schema.js";
import type { TraceLine } from "../../src/pipeline/trace.js";
import { fetchApi, type ApiError } from "./api.js";
import { arenaReplayModel, filterGames, gateModel, isChampionRun, isTwoIssue, liveModel, queryToFilters, queryToPage, queryWithPage, runsModel, splitTrace, tournamentReplayModel, twoIssueModel, type MatchFilters, type RunEntry, type ScenarioRef } from "./model/index.js";
import { parseRoute, routeTo, type FindTab, type Route } from "./route.js";
import { resolveFindTab } from "./find.js";
import { lastViewed } from "./last-viewed.js";
import { ArenaReplayScreen } from "./screens/ArenaReplayScreen.js";
import { useLiveFeed } from "./live.js";
import { GateScreen } from "./screens/GateScreen.js";
import { LiveScreen } from "./screens/LiveScreen.js";
import { MatchesScreen } from "./screens/MatchesScreen.js";
import { RunsScreen } from "./screens/RunsScreen.js";
import { StatesScreen } from "./screens/StatesScreen.js";
import { TournamentReplayScreen } from "./screens/TournamentReplayScreen.js";
import { TwoIssueScreen } from "./screens/TwoIssueScreen.js";
import { EmptyStateCard, InvalidLogBanner, LoadingCard } from "./ui/states.js";
import { PageTitle } from "./ui/page-title.js";

const TABS = [
  { id: "runs", label: "Runs" },
  { id: "matches", label: "Matches" },
  { id: "arena-replay", label: "Replay · arena" },
  { id: "tournament-replay", label: "Replay · tournament" },
  { id: "two-issue", label: "Two dimensions" },
  { id: "compare", label: "Champion vs candidate" },
  { id: "live", label: "Live" },
  { id: "states", label: "States" },
];

/** Human label per `FindTab`, for the resolver screen's `PageTitle`/document title (spec item 1). */
const FIND_TAB_LABEL: Record<FindTab, string> = {
  matches: "Matches",
  "arena-replay": "Replay · arena",
  "tournament-replay": "Replay · tournament",
  "two-issue": "Two dimensions",
  compare: "Champion vs candidate",
};

function useHashRoute(): { route: Route; hash: string; replaceRoute: (hash: string) => void; navKey: number } {
  const [hash, setHash] = useState(() => window.location.hash);
  /** Bumped only by a real `hashchange` (actual navigation), never by `replaceRoute`: Matches uses
   * it, not `route.query`, to key its container, so filtering (which calls `replaceRoute`) never
   * remounts it (L7) while a genuine navigation to a new query for the same run still does. */
  const [navKey, setNavKey] = useState(0);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      setNavKey((n) => n + 1);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  /** T2: `history.replaceState` (filters persisted without a new history entry) does not fire
   * `hashchange`, so `route` would go stale after it. Update the local `hash` state in the same
   * call so `route` always matches the address bar (`navKey` is deliberately left untouched). */
  const replaceRoute = (next: string) => {
    window.history.replaceState(null, "", next);
    setHash(next);
  };
  return { route: parseRoute(hash), hash, replaceRoute, navKey };
}

/** L27: document title per screen, English, suffixed with the app name. */
const SCREEN_TITLE: Record<Exclude<Route["screen"], "find">, string> = {
  runs: "Runs",
  matches: "Matches",
  "arena-replay": "Replay",
  "tournament-replay": "Tournament replay",
  compare: "Compare",
  states: "States",
  live: "Live",
};

function navigate(hash: string) {
  window.location.hash = hash;
}

/** `/api/champion`: solo `version` (+ `path` fijo), de solo lectura (ajuste 2); `null` si el fichero
 * no existe. `errors` trae el fallo de esquema/lectura cuando `config/champion.json` es inválido, para
 * que Runs lo muestre (ajuste 2, L11): ausente no es un error, inválido sí. */
function useChampionVersion(): { version: number | null; errors: ApiError[] } {
  const [state, setState] = useState<{ version: number | null; errors: ApiError[] }>({ version: null, errors: [] });
  useEffect(() => {
    let cancelled = false;
    fetchApi<{ version: number; path: string } | null>("champion")
      .then((res) => {
        if (!cancelled) setState({ version: res.data?.version ?? null, errors: res.errors });
      })
      /** T5: a rejecting fetch (network down, etc.) must not surface as an unhandled rejection;
       * Runs still renders, just without the champion pill. */
      .catch(() => {
        if (!cancelled) setState({ version: null, errors: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

/** `/api/info#resultsFolder`: solo el nombre de la carpeta de `results/`, de solo lectura, para la
 * cabecera ("pnpm viewer · results/<folder>", ajuste 2). `null` mientras carga o si falla. */
function useResultsFolder(): string | null {
  const [folder, setFolder] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchApi<{ resultsFolder: string } | null>("info")
      .then((res) => {
        if (!cancelled) setFolder(res.data?.resultsFolder ?? null);
      })
      .catch(() => {
        if (!cancelled) setFolder(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return folder;
}

function RunsContainer() {
  const [state, setState] = useState<{ entries: RunEntry[]; errors: ApiError[] } | null>(null);
  const champion = useChampionVersion();
  useEffect(() => {
    let cancelled = false;
    fetchApi<RunEntry[]>("runs").then((res) => {
      if (!cancelled) setState({ entries: res.data ?? [], errors: res.errors });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!state) return <LoadingCard label="Reading results/" />;
  return (
    <RunsScreen
      rows={runsModel(state.entries)}
      errors={[...state.errors, ...champion.errors]}
      onOpenRun={(runId) => navigate(routeTo.matches(runId))}
      onOpenLive={() => navigate(routeTo.live())}
      onCompareRun={(runId) => navigate(routeTo.compare(runId))}
      championVersion={champion.version}
    />
  );
}

function MatchesContainer({ runId, query, replaceRoute }: { runId: string; query: string; replaceRoute: (hash: string) => void }) {
  const [state, setState] = useState<{ summary: Summary | null; games: TranscriptLine[] } | null>(null);
  const championVersion = useChampionVersion().version;
  const [initialFilters] = useState<MatchFilters>(() => queryToFilters(query));
  const [initialPage] = useState<number>(() => queryToPage(query));
  /** Tracks the query currently reflected in the URL (kept in sync by onFiltersChange/onPageChange),
   * so opening a game can carry it along and "← Matches" returns with the same filters and page
   * applied (INBOX A2, T7). `currentFilters` lets a page-only change rebuild the full query. */
  const currentQuery = useRef(query);
  const currentFilters = useRef<MatchFilters>(initialFilters);
  useEffect(() => {
    let cancelled = false;
    setState(null);
    fetchApi<{ runId: string; summary: Summary | null; games: TranscriptLine[] }>(`runs/${encodeURIComponent(runId)}`).then((res) => {
      if (!cancelled) setState({ summary: res.data?.summary ?? null, games: res.data?.games ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, [runId]);
  /** C5: `injection` is meaningless (and its checkbox hidden) once the run has no injection data at
   * all; `MatchesScreen` would drop it itself, but only via its own effect, and that goes through
   * `onFiltersChange`, which always resets the page to 0 — losing a `p=` carried over e.g. from a
   * replay's "← Matches". Stripping it here, before `MatchesScreen` ever mounts with it, keeps the
   * page intact; the ref mutation is pure/idempotent (safe during render), the actual URL is scrubbed
   * once in the effect below, without touching the page. */
  if (state?.games && currentFilters.current.injection && !state.games.some((l) => l.metrics.injectionSuspected !== undefined)) {
    const { injection: _injection, ...rest } = currentFilters.current;
    currentFilters.current = rest;
    currentQuery.current = queryWithPage(rest, initialPage);
  }
  useEffect(() => {
    if (currentQuery.current !== query) replaceRoute(routeTo.matches(runId, currentQuery.current));
  }, [state]);
  useEffect(() => {
    if (state?.summary) lastViewed.rememberRun(runId);
  }, [runId, state?.summary]);
  if (!state) return <LoadingCard label={`Reading results/${runId}`} />;
  if (!state.summary) return <EmptyStateCard title={`results/${runId}/summary.json is not available`} />;
  const isChampion = isChampionRun(state.summary.config, championVersion);
  return (
    <MatchesScreen
      runId={runId}
      summary={state.summary}
      games={state.games}
      onOpenGame={(gameId) => navigate(routeTo.arenaReplay(runId, gameId, currentQuery.current))}
      onBack={() => navigate(routeTo.runs())}
      initialFilters={currentFilters.current}
      initialPage={initialPage}
      onFiltersChange={(filters) => {
        currentFilters.current = filters;
        currentQuery.current = queryWithPage(filters, 0);
        replaceRoute(routeTo.matches(runId, currentQuery.current));
      }}
      onPageChange={(page) => {
        currentQuery.current = queryWithPage(currentFilters.current, page);
        replaceRoute(routeTo.matches(runId, currentQuery.current));
      }}
      isChampion={isChampion}
    />
  );
}

function ArenaReplayContainer({ runId, gameId, query }: { runId: string; gameId: string; query: string }) {
  /** T9: the run payload (summary + every game) is cached per `runId` and only refetched when it
   * changes; switching games via the MatchSelector/onSelectGame only changes `gameId`, so only the
   * trace is refetched below instead of the whole run again. */
  const [games, setGames] = useState<{ runId: string; data: TranscriptLine[]; summary: Summary | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchApi<{ runId: string; summary: Summary | null; games: TranscriptLine[] }>(`runs/${encodeURIComponent(runId)}`).then((run) => {
      if (!cancelled) setGames({ runId, data: run.data?.games ?? [], summary: run.data?.summary ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [runId]);
  /** C4: tagged with the `gameId` it was fetched for, so a render right after `gameId` changes but
   * before this effect's fetch resolves (still showing the previous trace) is caught below instead
   * of pairing the new game with the previous trace. */
  const [trace, setTrace] = useState<{ gameId: string; data: TraceLine[] | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchApi<TraceLine[]>(`runs/${encodeURIComponent(runId)}/games/${encodeURIComponent(gameId)}`).then((res) => {
      if (!cancelled) setTrace({ gameId, data: res.data && res.data.length > 0 ? res.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [runId, gameId]);
  useEffect(() => {
    if (!games || games.runId !== runId) return;
    const found = games.data.find((g) => g.gameId === gameId);
    if (!found) return;
    const hash = routeTo.arenaReplay(runId, gameId, query);
    lastViewed.rememberArenaMatch(hash);
    if (isTwoIssue(found)) lastViewed.rememberTwoIssueMatch(hash);
  }, [games, runId, gameId, query]);
  if (!games || games.runId !== runId || !trace || trace.gameId !== gameId) return <LoadingCard label={`Reading ${gameId}`} />;
  const line = games.data.find((g) => g.gameId === gameId) ?? null;
  if (!line) return <EmptyStateCard title={`${gameId} is not available`} />;
  // MatchSelector shows the same games Matches would, under the filters carried in `query` (L14).
  const filteredGames = filterGames(games.data, queryToFilters(query));
  const onBack = () => navigate(routeTo.matches(runId, query));
  const onSelectGame = (newGameId: string) => navigate(routeTo.arenaReplay(runId, newGameId, query));
  if (isTwoIssue(line)) return <TwoIssueScreen runId={runId} summary={games.summary} model={twoIssueModel(line, trace.data)} onBack={onBack} games={filteredGames} onSelectGame={onSelectGame} />;
  return <ArenaReplayScreen runId={runId} summary={games.summary} model={arenaReplayModel(line, trace.data)} onBack={onBack} games={filteredGames} onSelectGame={onSelectGame} />;
}

function CompareContainer({ runId }: { runId: string }) {
  const [state, setState] = useState<{ gate: GateFile | null; errors: ApiError[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setState(null);
    fetchApi<GateFile | null>(`promote/${encodeURIComponent(runId)}`).then((res) => {
      if (!cancelled) setState({ gate: res.data, errors: res.errors });
    });
    return () => {
      cancelled = true;
    };
  }, [runId]);
  if (!state) return <LoadingCard label={`Reading results/${runId}/gate.json`} />;
  if (!state.gate) return <EmptyStateCard title={`results/${runId}/gate.json is not available`} {...(state.errors[0] ? { body: state.errors[0].message } : {})} />;
  return <GateScreen model={gateModel(runId, state.gate)} onBack={() => navigate(routeTo.runs())} />;
}


function TournamentReplayContainer({ runId, session }: { runId: string; session: string }) {
  const [state, setState] = useState<{ trace: TraceLine[]; ref: ScenarioRef | null; summary: Summary | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setState(null);
    void (async () => {
      // X6: the trace and the summary are fetched independently -- a summary fetch failure (e.g. a
      // malformed summary.json) must not hide an otherwise good trace; it just leaves `summary` null.
      let trace: TraceLine[] = [];
      try {
        const traceRes = await fetchApi<TraceLine[]>(`tournament/${encodeURIComponent(runId)}/${encodeURIComponent(session)}`);
        trace = traceRes.data ?? [];
      } catch {
        trace = [];
      }
      const { header } = splitTrace(trace);
      let ref: ScenarioRef | null = null;
      if (header && header.mode === "tournament") {
        try {
          const scenarioRes = await fetchApi<ScenarioRef>(`scenario-ref?id=${encodeURIComponent(header.scenario.id)}&hash=${encodeURIComponent(header.scenario.hash)}`);
          ref = scenarioRes.data;
        } catch {
          ref = null;
        }
      }
      let summary: Summary | null = null;
      try {
        const runRes = await fetchApi<{ runId: string; summary: Summary | null; games: TranscriptLine[] }>(`runs/${encodeURIComponent(runId)}`);
        summary = runRes.data?.summary ?? null;
      } catch {
        summary = null;
      }
      if (!cancelled) setState({ trace, ref, summary });
    })();
    return () => {
      cancelled = true;
    };
  }, [runId, session]);
  if (!state) return <LoadingCard label={`Reading tournament session ${session}`} />;
  return <TournamentReplayScreen model={tournamentReplayModel(state.trace, state.ref)} summary={state.summary} onBack={() => navigate(routeTo.runs())} />;
}

/** P7 a pantalla completa (sin cabecera del visor): el proyector solo ve el lienzo oscuro. */
function LiveContainer() {
  const { feed, errors } = useLiveFeed();
  useEffect(() => {
    document.title = `${SCREEN_TITLE.live} · Arena viewer`;
  }, []);
  return (
    <>
      <LiveScreen model={liveModel(feed)} />
      {errors.length > 0 ? (
        <Root theme="dark" className="nr-live-overlay">
          <InvalidLogBanner errors={errors} validCount={feed.lines.length} />
        </Root>
      ) : null}
    </>
  );
}

/** Resolver screen for the 5 tabs with no route of their own (L1): fetches `/api/runs`, resolves
 * last-viewed / most-recent / empty, then swaps itself for the real route in place (`replaceRoute`,
 * same mechanism `MatchesContainer` uses for filters) so back/forward never stops on this screen. */
function FindContainer({ tab, replaceRoute }: { tab: FindTab; replaceRoute: (hash: string) => void }) {
  const [emptyTitle, setEmptyTitle] = useState<{ tab: FindTab; title: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setEmptyTitle(null);
    void (async () => {
      // X6: a failed /api/runs (or any fetch resolveFindTab makes while resolving) used to leave
      // this screen loading forever -- fall back to a named empty state instead.
      try {
        const res = await fetchApi<RunEntry[]>("runs");
        const result = await resolveFindTab(tab, res.data ?? []);
        if (cancelled) return;
        if (result.target) replaceRoute(result.target);
        else setEmptyTitle({ tab, title: result.empty ?? "Not available" });
      } catch {
        if (!cancelled) setEmptyTitle({ tab, title: "Could not read results/" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);
  if (!emptyTitle || emptyTitle.tab !== tab) return <LoadingCard label="Reading results/" />;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <PageTitle>{FIND_TAB_LABEL[tab]}</PageTitle>
      <EmptyStateCard title={emptyTitle.title} />
    </section>
  );
}

function AppContent() {
  const { route, replaceRoute, navKey } = useHashRoute();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  /** L27: document title per screen; kept on `route.screen` alone (not `navKey`/`hash`) so a
   * filter/page change (which only touches the query via `replaceRoute`) never re-triggers it.
   * Runs before the `live` early return so this hook is called on every render (rules of hooks). */
  // X5: an arena-replay route is shared by the "Replay · arena" and "Two dimensions" tabs; the
  // `view` query param (set by the Find resolver) says which one actually led here, so the
  // title (and `activeTab` below) doesn't always default to "Replay · arena".
  const arenaReplayView = route.screen === "arena-replay" && new URLSearchParams(route.query).get("view") === "two-issue" ? "two-issue" : "arena-replay";
  useEffect(() => {
    document.title = `${route.screen === "find" ? FIND_TAB_LABEL[route.tab] : route.screen === "arena-replay" ? FIND_TAB_LABEL[arenaReplayView] : SCREEN_TITLE[route.screen]} · Arena viewer`;
  }, [route.screen, route.screen === "find" ? route.tab : arenaReplayView]);
  /** C1: flags a real navigation (`navKey`, bumped only by an actual `hashchange`, never by
   * `replaceRoute`) so the screen's own `PageTitle` heading focuses itself once it has actually
   * rendered — it may still be behind a `LoadingCard` right after this fires. Not on the very
   * first paint (no screen to leave), and never on a filter/page change (L24's own focus move on
   * "Clear filters" must not be fought over). */
  useLayoutEffect(() => {
    if (navKey === 0) return;
    requestPageFocus();
  }, [navKey]);
  /** D2: keep <html data-theme> (set pre-paint by the inline script in index.html) in sync with
   * React state, so color-scheme and the html/body background track every toggle too. */
  useEffect(() => {
    document.documentElement.dataset.theme = route.screen === "live" ? "dark" : theme;
  }, [theme, route.screen]);
  /** D9: once the user picks a theme explicitly, OS changes stop overriding it (watchSystemTheme
   * checks for a stored choice on every change event). */
  useEffect(() => watchSystemTheme(setTheme), []);
  /**
   * F1 (WCAG 2.4.11): the sticky header's real height -- it can wrap to a second line on narrow
   * screens -- drives `--header-height` (read by DS's `html{scroll-padding-top}`) so a keyboard
   * jump to an anchor/skip-link target never lands underneath it.
   */
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    update();
    window.addEventListener("resize", update);
    // jsdom (tests) has no ResizeObserver; window resize still covers real narrow-screen wrapping.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(header);
    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  });
  const resultsFolder = useResultsFolder();
  if (route.screen === "live") return <LiveContainer />;
  const activeTab = route.screen === "find" ? route.tab : route.screen === "arena-replay" ? arenaReplayView : route.screen;
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    storeTheme(next);
  };
  return (
    <Root theme={theme}>
      <header ref={headerRef} style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--space-4) var(--gutter) 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
              <h1 className="nr-title">Arena Viewer</h1>
              {resultsFolder ? <span className="nr-cfg">{`pnpm viewer · results/${resultsFolder}`}</span> : null}
            </div>
            <SecondaryButton onClick={toggleTheme} aria-pressed={theme === "dark"}>{theme === "dark" ? "Theme: dark" : "Theme: light"}</SecondaryButton>
          </div>
          <Tabs
            variant="nav"
            aria-label="Viewer"
            items={TABS}
            selectedId={activeTab}
            onSelect={(id) =>
              navigate(
                id === "runs" ? routeTo.runs() : id === "states" ? routeTo.states() : id === "live" ? routeTo.live() : routeTo.find(id as FindTab),
              )
            }
          />
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px var(--gutter)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {route.screen === "runs" ? <RunsContainer /> : null}
        {route.screen === "matches" ? <MatchesContainer key={`${route.runId}-${navKey}`} runId={route.runId} query={route.query} replaceRoute={replaceRoute} /> : null}
        {route.screen === "arena-replay" ? <ArenaReplayContainer runId={route.runId} gameId={route.gameId} query={route.query} /> : null}
        {route.screen === "tournament-replay" ? <TournamentReplayContainer runId={route.runId} session={route.session} /> : null}
        {route.screen === "compare" ? <CompareContainer runId={route.runId} /> : null}
        {route.screen === "find" ? <FindContainer tab={route.tab} replaceRoute={replaceRoute} /> : null}
        {route.screen === "states" ? <StatesScreen /> : null}
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
    console.error("Arena viewer crashed while rendering", error, info.componentStack);
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
