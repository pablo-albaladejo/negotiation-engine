import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { ScenarioSchema as MandateFileSchema } from "../../src/agent/agent.js";
import { GateFileSchema, SummarySchema, TranscriptLineSchema } from "../../src/arena/results-schema.js";
import { scenarioHash } from "../../src/arena/scenario.js";
import { TraceLineSchema } from "../../src/pipeline/trace.js";
import type { RunEntry, RunKind, ScenarioRef } from "../src/model/index.js";
import { isSafeId, resolveInside } from "./paths.js";
import { readJson, readJsonl, type ReadError } from "./read.js";

/**
 * API de solo lectura del visor. Únicas raíces: `results/` y, de `config/`, solo el fichero de
 * escenario cuyo nombre y hash pide una cabecera de torneo. El contenido de los ficheros se valida
 * y se devuelve como datos; nunca se ejecuta ni se renderiza aquí.
 */
export interface Roots {
  results: string;
  config: string;
}

export interface ApiResponse {
  status: number;
  body: { data: unknown; errors: ReadError[] };
}

const ok = (data: unknown, errors: ReadError[] = []): ApiResponse => ({ status: 200, body: { data, errors } });
const fail = (status: 400 | 404, message: string): ApiResponse => ({ status, body: { data: null, errors: [{ file: null, line: null, path: "", message }] } });
const badRequest = () => fail(400, "invalid identifier");
const notFound = () => fail(404, "not found");

/** Solo expone la versión de `config/champion.json`, de solo lectura (ajuste 2): ni el resto de campos ni el mandato. */
const ChampionVersionSchema = z.looseObject({ version: z.number() }).transform(({ version }) => ({ version }));

function kindOf(name: string, files: ReadonlySet<string>): RunKind {
  if (files.has("gate.json")) return "promotion";
  if (name.startsWith("agent-")) return "tournament";
  return "arena";
}

async function listRuns(roots: Roots): Promise<ApiResponse> {
  let names: string[];
  try {
    names = (await readdir(roots.results)).filter(isSafeId).sort();
  } catch {
    return ok([]);
  }
  const runs: RunEntry[] = [];
  const errors: ReadError[] = [];
  for (const name of names) {
    const dir = await resolveInside(roots.results, name);
    if (!dir) continue;
    let files: Set<string>;
    try {
      files = new Set(await readdir(dir));
    } catch {
      continue;
    }
    let summary: RunEntry["summary"] = null;
    const summaryPath = files.has("summary.json") ? await resolveInside(roots.results, name, "summary.json") : null;
    if (summaryPath) {
      const read = await readJson(summaryPath, `${name}/summary.json`, SummarySchema);
      summary = read.data;
      errors.push(...read.errors);
    }
    runs.push({ runId: name, kind: kindOf(name, files), summary });
  }
  return ok(runs, errors);
}

async function runDetail(roots: Roots, runId: string): Promise<ApiResponse> {
  if (!(await resolveInside(roots.results, runId))) return notFound();
  const summaryPath = await resolveInside(roots.results, runId, "summary.json");
  const transcriptsPath = await resolveInside(roots.results, runId, "transcripts.jsonl");
  const summary = summaryPath ? await readJson(summaryPath, `${runId}/summary.json`, SummarySchema) : { data: null, errors: [] };
  const games = transcriptsPath ? await readJsonl(transcriptsPath, `${runId}/transcripts.jsonl`, TranscriptLineSchema) : { data: [], errors: [] };
  return ok({ runId, summary: summary.data, games: games.data }, [...summary.errors, ...games.errors]);
}

/** `gate.json` de un run de promoción, tal como lo escribió `pnpm promote`; el visor nunca promueve. */
async function promoteGate(roots: Roots, runId: string): Promise<ApiResponse> {
  const path = await resolveInside(roots.results, runId, "gate.json");
  if (!path) return notFound();
  const read = await readJson(path, `${runId}/gate.json`, GateFileSchema);
  return ok(read.data, read.errors);
}

async function traceFile(roots: Roots, parts: [string, ...string[]]): Promise<ApiResponse> {
  const path = await resolveInside(roots.results, ...parts);
  if (!path) return notFound();
  const read = await readJsonl(path, parts.join("/"), TraceLineSchema);
  return ok(read.data, read.errors);
}

async function tournamentSessions(roots: Roots, runId: string): Promise<ApiResponse> {
  const dir = await resolveInside(roots.results, runId);
  if (!dir) return notFound();
  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".jsonl") && isSafeId(f)).sort();
  } catch {
    return notFound();
  }
  return ok(files.map((f) => f.slice(0, -".jsonl".length)));
}

/** `config/champion.json`: solo expone `version`, de solo lectura (ajuste 2, §1 Runs). `null` si no existe. */
async function championVersion(roots: Roots): Promise<ApiResponse> {
  const path = await resolveInside(roots.config, "champion.json");
  if (!path) return ok(null);
  const read = await readJson(path, "config/champion.json", ChampionVersionSchema);
  return ok(read.data, read.errors);
}

async function scenarioRef(roots: Roots, query: URLSearchParams): Promise<ApiResponse> {
  const id = query.get("id");
  const hash = query.get("hash");
  if (!id || !hash) return fail(400, "id and hash are required");
  if (!isSafeId(id) || !id.endsWith(".json")) return notFound();
  const path = await resolveInside(roots.config, id);
  if (!path) return notFound();
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    return notFound();
  }
  if (scenarioHash(text) !== hash) return notFound();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return notFound();
  }
  const parsed = MandateFileSchema.safeParse(raw);
  if (!parsed.success) return notFound();
  const ref: ScenarioRef = { id, hash, mandate: { role: parsed.data.role, reservation: parsed.data.reservation } };
  return ok(ref);
}

/**
 * Router de `/api/*`. `segments` ya vienen decodificados y sin el prefijo `api`. Todo identificador
 * pasa `isSafeId` (400) y toda ruta `resolveInside` (404), así que no se abre nada fuera de las raíces.
 */
export async function handleApi(roots: Roots, segments: readonly string[], query: URLSearchParams): Promise<ApiResponse> {
  const [head, ...ids] = segments;
  if (head === "scenario-ref" && ids.length === 0) return scenarioRef(roots, query);
  if (head === "champion" && ids.length === 0) return championVersion(roots);
  if (!ids.every(isSafeId)) return badRequest();
  if (head === "runs") {
    const [runId, games, gameId] = ids;
    if (runId === undefined) return listRuns(roots);
    if (ids.length === 1) return runDetail(roots, runId);
    if (ids.length === 3 && games === "games" && gameId !== undefined) return traceFile(roots, [runId, "traces", `${gameId}.jsonl`]);
  }
  if (head === "promote" && ids.length === 1) return promoteGate(roots, ids[0]!);
  if (head === "tournament") {
    const [runId, session] = ids;
    if (runId !== undefined && session === undefined) return tournamentSessions(roots, runId);
    if (runId !== undefined && session !== undefined && ids.length === 2) return traceFile(roots, [runId, `${session}.jsonl`]);
  }
  return notFound();
}

export const rootsFor = (repoRoot: string): Roots => ({ results: join(repoRoot, "results"), config: join(repoRoot, "config") });
