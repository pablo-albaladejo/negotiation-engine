import { appendFileSync } from "node:fs";
import type { Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startViewerServer } from "../../server/http.js";
import { arenaReplayModel, runsModel, tournamentReplayModel, type RunEntry, type ScenarioRef } from "../../src/model/index.js";
import type { TranscriptLine } from "../../../src/arena/results-schema.js";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";
import { get, makeRepo } from "./helpers.js";

let fx: ViewerFixtures;
let repo: ReturnType<typeof makeRepo>;
let server: Server;
let port: number;

beforeAll(async () => {
  fx = await generateFixtures();
  repo = makeRepo(fx);
  ({ server, port } = await startViewerServer({ repoRoot: repo.root, env: { VIEWER_PORT: "0" } }));
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("API { data, errors } sobre los esquemas y adaptadores", () => {
  it("/api/runs: entradas para runsModel, con summary validado y tipo por directorio", async () => {
    const res = await get(port, "/api/runs");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.json.errors).toEqual([]);
    const entries = res.json.data as RunEntry[];
    expect(entries).toEqual([
      { runId: "agent-test", kind: "tournament", summary: null },
      { runId: fx.runId, kind: "arena", summary: fx.summary },
    ]);
    expect(runsModel(entries).find((r) => r.runId === fx.runId)?.games).toBe(fx.summary.overall.games);
  });

  it("/api/runs/:runId: summary y partidas de transcripts.jsonl", async () => {
    const res = await get(port, `/api/runs/${fx.runId}`);
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: { runId: fx.runId, summary: fx.summary, games: fx.games }, errors: [] });
  });

  it("/api/runs/:runId/games/:gameId: traza de arena que acepta arenaReplayModel", async () => {
    const game = fx.games[0]!;
    const res = await get(port, `/api/runs/${fx.runId}/games/${encodeURIComponent(game.gameId)}`);
    expect(res.status).toBe(200);
    const trace = res.json.data as TraceLine[];
    expect(trace).toEqual(fx.traces.get(game.gameId));
    expect(arenaReplayModel(game, trace).game.gameId).toBe(game.gameId);
  });

  it("/api/tournament/:runId lista sesiones y /:session devuelve la traza para tournamentReplayModel", async () => {
    const sessions = await get(port, "/api/tournament/agent-test");
    expect(sessions.json.data).toContain(repo.sessionId);
    const res = await get(port, `/api/tournament/agent-test/${repo.sessionId}`);
    expect(res.status).toBe(200);
    const trace = res.json.data as TraceLine[];
    expect(trace).toEqual(fx.tournament.trace);
    const ref = (await get(port, `/api/scenario-ref?id=${fx.tournament.ref.id}&hash=${fx.tournament.ref.hash}`)).json.data as ScenarioRef;
    expect(tournamentReplayModel(trace, ref).ourReserve).toEqual(fx.tournament.ref.mandate.reservation);
  });

  it("/api/champion: solo expone version, de solo lectura", async () => {
    const res = await get(port, "/api/champion");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: { version: 1, path: "config/champion.json" }, errors: [] });
  });

  it("una línea inválida y una truncada no tumban la respuesta: errores con fichero relativo y línea", async () => {
    const file = join(repo.root, "results", fx.runId, "transcripts.jsonl");
    appendFileSync(file, `${JSON.stringify({ ...fx.games[0], seed: "x" })}\n{"gameId":"cut`);
    const res = await get(port, `/api/runs/${fx.runId}`);
    expect(res.status).toBe(200);
    expect((res.json.data as { games: TranscriptLine[] }).games).toEqual(fx.games);
    expect(res.json.errors).toEqual([
      { file: `${fx.runId}/transcripts.jsonl`, line: fx.games.length + 1, path: "seed", message: expect.any(String) },
      { file: `${fx.runId}/transcripts.jsonl`, line: fx.games.length + 2, path: "", message: expect.stringMatching(/JSON/) },
    ]);
    expect(res.text).not.toContain(repo.root);
    expect((await get(port, "/api/runs")).status).toBe(200);
  });
});
