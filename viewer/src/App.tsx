import { ModeBadge, Root, Tabs } from "@negotiation-ring/design-system";
import { useEffect, useRef, useState } from "react";
import type { GateFile, Summary, TranscriptLine } from "../../src/arena/results-schema.js";
import type { TraceLine } from "../../src/pipeline/trace.js";
import { fetchApi, type ApiError } from "./api.js";
import { arenaReplayModel, filtersToQuery, gateModel, isTwoIssue, liveModel, queryToFilters, runsModel, splitTrace, tournamentReplayModel, twoIssueModel, type MatchFilters, type RunEntry, type ScenarioRef } from "./model/index.js";
import { parseRoute, routeTo } from "./route.js";
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

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return parseRoute(hash);
}

function navigate(hash: string) {
  window.location.hash = hash;
}

/** `/api/champion`: solo `version`, de solo lectura (ajuste 2); `null` si el fichero no existe. */
function useChampionVersion(): number | null {
  const [version, setVersion] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchApi<{ version: number } | null>("champion").then((res) => {
      if (!cancelled) setVersion(res.data?.version ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return version;
}

function RunsContainer() {
  const [state, setState] = useState<{ entries: RunEntry[]; errors: ApiError[] } | null>(null);
  const championVersion = useChampionVersion();
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
  return <RunsScreen rows={runsModel(state.entries)} errors={state.errors} onOpenRun={open} onOpenLive={() => navigate(routeTo.live())} championVersion={championVersion} />;
}

function MatchesContainer({ runId, query }: { runId: string; query: string }) {
  const [state, setState] = useState<{ summary: Summary | null; games: TranscriptLine[] } | null>(null);
  const championVersion = useChampionVersion();
  const [initialFilters] = useState<MatchFilters>(() => queryToFilters(query));
  /** Tracks the query currently reflected in the URL (kept in sync by onFiltersChange), so opening a
   * game can carry it along and "← Matches" returns with the same filters applied (INBOX A2). */
  const currentQuery = useRef(query);
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
  const isChampion = championVersion != null && state.summary.config.version === championVersion;
  return (
    <MatchesScreen
      runId={runId}
      summary={state.summary}
      games={state.games}
      onOpenGame={(gameId) => navigate(routeTo.arenaReplay(runId, gameId, currentQuery.current))}
      onBack={() => navigate(routeTo.runs())}
      initialFilters={initialFilters}
      onFiltersChange={(filters) => {
        currentQuery.current = filtersToQuery(filters);
        window.history.replaceState(null, "", routeTo.matches(runId, currentQuery.current));
      }}
      isChampion={isChampion}
    />
  );
}

function ArenaReplayContainer({ runId, gameId, query }: { runId: string; gameId: string; query: string }) {
  const [state, setState] = useState<{ line: TranscriptLine | null; trace: TraceLine[] | null; games: TranscriptLine[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setState(null);
    Promise.all([
      fetchApi<{ runId: string; summary: Summary | null; games: TranscriptLine[] }>(`runs/${encodeURIComponent(runId)}`),
      fetchApi<TraceLine[]>(`runs/${encodeURIComponent(runId)}/games/${encodeURIComponent(gameId)}`),
    ]).then(([run, trace]) => {
      if (cancelled) return;
      const line = run.data?.games.find((g) => g.gameId === gameId) ?? null;
      const games = run.data?.games ?? [];
      setState({ line, trace: trace.data && trace.data.length > 0 ? trace.data : null, games });
    });
    return () => {
      cancelled = true;
    };
  }, [runId, gameId]);
  if (!state) return <LoadingCard label={`Reading ${gameId}`} />;
  if (!state.line) return <LoadingCard label={`${gameId} is not available`} />;
  const onBack = () => navigate(routeTo.matches(runId, query));
  const onSelectGame = (newGameId: string) => navigate(routeTo.arenaReplay(runId, newGameId, query));
  if (isTwoIssue(state.line)) return <TwoIssueScreen runId={runId} model={twoIssueModel(state.line, state.trace)} onBack={onBack} games={state.games} onSelectGame={onSelectGame} />;
  return <ArenaReplayScreen runId={runId} model={arenaReplayModel(state.line, state.trace)} onBack={onBack} games={state.games} onSelectGame={onSelectGame} />;
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
  const route = useHashRoute();
  if (route.screen === "live") return <LiveContainer />;
  const activeTab = route.screen === "states" ? "states" : "runs";
  return (
    <Root theme="light">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px var(--gutter)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <header>
          <h1 className="nr-title">Arena viewer</h1>
          <Tabs items={TABS} selectedId={activeTab} onSelect={(id) => navigate(id === "states" ? routeTo.states() : id === "live" ? routeTo.live() : routeTo.runs())} />
        </header>
        <main>
          {route.screen === "runs" ? <RunsContainer /> : null}
          {route.screen === "matches" ? <MatchesContainer key={route.runId} runId={route.runId} query={route.query} /> : null}
          {route.screen === "arena-replay" ? <ArenaReplayContainer runId={route.runId} gameId={route.gameId} query={route.query} /> : null}
          {route.screen === "tournament-replay" ? <TournamentReplayContainer runId={route.runId} session={route.session} /> : null}
          {route.screen === "compare" ? <CompareContainer runId={route.runId} /> : null}
          {route.screen === "states" ? <StatesScreen /> : null}
        </main>
      </div>
    </Root>
  );
}
