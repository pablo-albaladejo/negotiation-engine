import { ModeBadge, Root, Tabs } from "@negotiation-ring/design-system";
import { useEffect, useRef, useState } from "react";
import { SecondaryButton } from "./ui/buttons.js";
import { initialTheme, storeTheme, watchSystemTheme, type Theme } from "./theme.js";
import type { GateFile, Summary, TranscriptLine } from "../../src/arena/results-schema.js";
import type { TraceLine } from "../../src/pipeline/trace.js";
import { fetchApi, type ApiError } from "./api.js";
import { arenaReplayModel, filterGames, gateModel, isChampionRun, isTwoIssue, liveModel, queryToFilters, queryToPage, queryWithPage, runsModel, splitTrace, tournamentReplayModel, twoIssueModel, type MatchFilters, type RunEntry, type ScenarioRef } from "./model/index.js";
import { parseRoute, routeTo, type Route } from "./route.js";
import { ArenaReplayScreen } from "./screens/ArenaReplayScreen.js";
import { useLiveFeed } from "./live.js";
import { GateScreen } from "./screens/GateScreen.js";
import { LiveScreen } from "./screens/LiveScreen.js";
import { MatchesScreen } from "./screens/MatchesScreen.js";
import { RunsScreen } from "./screens/RunsScreen.js";
import { StatesScreen } from "./screens/StatesScreen.js";
import { TournamentReplayScreen } from "./screens/TournamentReplayScreen.js";
import { TwoIssueScreen } from "./screens/TwoIssueScreen.js";
import { InvalidLogBanner, LoadingCard } from "./ui/states.js";

const TABS = [
  { id: "runs", label: "Runs" },
  { id: "states", label: "States" },
  { id: "live", label: "Live" },
];

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
const SCREEN_TITLE: Record<Route["screen"], string> = {
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
  const open = (runId: string) => {
    const kind = state.entries.find((e) => e.runId === runId)?.kind;
    navigate(kind === "promotion" ? routeTo.compare(runId) : routeTo.matches(runId));
  };
  return (
    <RunsScreen
      rows={runsModel(state.entries)}
      errors={[...state.errors, ...champion.errors]}
      onOpenRun={open}
      onOpenLive={() => navigate(routeTo.live())}
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
  if (!state) return <LoadingCard label={`Reading results/${runId}`} />;
  if (!state.summary) return <LoadingCard label={`results/${runId}/summary.json is not available`} />;
  const isChampion = isChampionRun(state.summary.config, championVersion);
  return (
    <MatchesScreen
      runId={runId}
      summary={state.summary}
      games={state.games}
      onOpenGame={(gameId) => navigate(routeTo.arenaReplay(runId, gameId, currentQuery.current))}
      onBack={() => navigate(routeTo.runs())}
      initialFilters={initialFilters}
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
  const [games, setGames] = useState<TranscriptLine[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setGames(null);
    fetchApi<{ runId: string; summary: Summary | null; games: TranscriptLine[] }>(`runs/${encodeURIComponent(runId)}`).then((run) => {
      if (!cancelled) setGames(run.data?.games ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [runId]);
  const [trace, setTrace] = useState<TraceLine[] | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    setTrace(undefined);
    fetchApi<TraceLine[]>(`runs/${encodeURIComponent(runId)}/games/${encodeURIComponent(gameId)}`).then((res) => {
      if (!cancelled) setTrace(res.data && res.data.length > 0 ? res.data : null);
    });
    return () => {
      cancelled = true;
    };
  }, [runId, gameId]);
  if (!games || trace === undefined) return <LoadingCard label={`Reading ${gameId}`} />;
  const line = games.find((g) => g.gameId === gameId) ?? null;
  if (!line) return <LoadingCard label={`${gameId} is not available`} />;
  // MatchSelector shows the same games Matches would, under the filters carried in `query` (L14).
  const filteredGames = filterGames(games, queryToFilters(query));
  const onBack = () => navigate(routeTo.matches(runId, query));
  const onSelectGame = (newGameId: string) => navigate(routeTo.arenaReplay(runId, newGameId, query));
  if (isTwoIssue(line)) return <TwoIssueScreen runId={runId} model={twoIssueModel(line, trace)} onBack={onBack} games={filteredGames} onSelectGame={onSelectGame} />;
  return <ArenaReplayScreen runId={runId} model={arenaReplayModel(line, trace)} onBack={onBack} games={filteredGames} onSelectGame={onSelectGame} />;
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
  if (!state.gate) return <LoadingCard label={`results/${runId}/gate.json is not available${state.errors[0] ? `: ${state.errors[0].message}` : ""}`} />;
  return <GateScreen model={gateModel(runId, state.gate)} onBack={() => navigate(routeTo.runs())} />;
}


function TournamentReplayContainer({ runId, session }: { runId: string; session: string }) {
  const [state, setState] = useState<{ trace: TraceLine[]; ref: ScenarioRef | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setState(null);
    fetchApi<TraceLine[]>(`tournament/${encodeURIComponent(runId)}/${encodeURIComponent(session)}`).then(async (res) => {
      const trace = res.data ?? [];
      const { header } = splitTrace(trace);
      let ref: ScenarioRef | null = null;
      if (header && header.mode === "tournament") {
        const scenarioRes = await fetchApi<ScenarioRef>(`scenario-ref?id=${encodeURIComponent(header.scenario.id)}&hash=${encodeURIComponent(header.scenario.hash)}`);
        ref = scenarioRes.data;
      }
      if (!cancelled) setState({ trace, ref });
    });
    return () => {
      cancelled = true;
    };
  }, [runId, session]);
  if (!state) return <LoadingCard label={`Reading tournament session ${session}`} />;
  return <TournamentReplayScreen model={tournamentReplayModel(state.trace, state.ref)} onBack={() => navigate(routeTo.runs())} />;
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
        <Root theme="dark">
          <InvalidLogBanner errors={errors} validCount={feed.lines.length} />
        </Root>
      ) : null}
    </>
  );
}

export function App() {
  const { route, hash, replaceRoute, navKey } = useHashRoute();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const mainRef = useRef<HTMLElement | null>(null);
  const skipFocus = useRef(true);
  /** L27: title per screen on every hash change; focus moves to the page h2 so screen readers and
   * keyboard users land on the new content, but not on the very first paint (no screen to leave).
   * Runs before the `live` early return so this hook is called on every render (rules of hooks). */
  useEffect(() => {
    document.title = `${SCREEN_TITLE[route.screen]} · Arena viewer`;
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    const heading = mainRef.current?.querySelector<HTMLElement>("h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
  }, [hash]);
  /** D2: keep <html data-theme> (set pre-paint by the inline script in index.html) in sync with
   * React state, so color-scheme and the html/body background track every toggle too. */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  /** D9: once the user picks a theme explicitly, OS changes stop overriding it (watchSystemTheme
   * checks for a stored choice on every change event). */
  useEffect(() => watchSystemTheme(setTheme), []);
  if (route.screen === "live") return <LiveContainer />;
  const activeTab = route.screen === "states" ? "states" : "runs";
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    storeTheme(next);
  };
  return (
    <Root theme={theme}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px var(--gutter)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <h1 className="nr-title">Arena viewer</h1>
            <Tabs items={TABS} selectedId={activeTab} onSelect={(id) => navigate(id === "states" ? routeTo.states() : id === "live" ? routeTo.live() : routeTo.runs())} />
          </div>
          <SecondaryButton onClick={toggleTheme} aria-pressed={theme === "dark"}>Dark mode</SecondaryButton>
        </header>
        <main ref={mainRef}>
          {route.screen === "runs" ? <RunsContainer /> : null}
          {route.screen === "matches" ? <MatchesContainer key={`${route.runId}-${navKey}`} runId={route.runId} query={route.query} replaceRoute={replaceRoute} /> : null}
          {route.screen === "arena-replay" ? <ArenaReplayContainer runId={route.runId} gameId={route.gameId} query={route.query} /> : null}
          {route.screen === "tournament-replay" ? <TournamentReplayContainer runId={route.runId} session={route.session} /> : null}
          {route.screen === "compare" ? <CompareContainer runId={route.runId} /> : null}
          {route.screen === "states" ? <StatesScreen /> : null}
        </main>
      </div>
    </Root>
  );
}
