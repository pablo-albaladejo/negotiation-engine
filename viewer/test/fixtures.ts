import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAgent, createTournamentTrace } from "../../src/agent/agent.js";
import { runArenaCli } from "../../src/arena/cli.js";
import { SummarySchema, TranscriptLineSchema, type Summary, type TranscriptLine } from "../../src/arena/results-schema.js";
import { scenarioHash } from "../../src/arena/scenario.js";
import { silentLogger } from "../../src/pipeline/box.js";
import { TraceLineSchema, type TraceLine } from "../../src/pipeline/trace.js";
import type { ScenarioRef } from "../src/model/index.js";

/**
 * Fixtures generados con los escritores reales en un directorio temporal (no ficheros copiados):
 * si un escritor cambia de forma, los tests de los adaptadores lo detectan.
 */
export interface ViewerFixtures {
  runId: string;
  summary: Summary;
  games: TranscriptLine[];
  /** Traza de arena por `gameId`. */
  traces: Map<string, TraceLine[]>;
  tournament: { trace: TraceLine[]; ref: ScenarioRef };
  /** Ficheros escritos: directorio del run de arena, de las trazas de torneo y escenario local. */
  dirs: { runDir: string; tournamentDir: string; scenarioPath: string };
}

/**
 * Raíz del repo: `pnpm viewer:test` corre con `cwd` en `viewer/`, así que las rutas de `config/` van
 * absolutas. Se evita `new URL(..., import.meta.url)`: bajo el entorno `jsdom` de un test de render,
 * el `URL` global resuelve contra `window.location`, no contra el fichero.
 */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../");
const CHAMPION = join(REPO_ROOT, "config/champion.json");
const CATALOG = join(REPO_ROOT, "config/arena/scenarios.json");

export const RIVAL_HTML = "<img src=x onerror=alert(1)>";
export const ARENA_SCENARIOS = ["price-buyer-wide", "price-seller-narrow", "price-buyer-empty", "pct-day-buyer-wide"];

const readJsonl = (file: string): unknown[] =>
  readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as unknown);

export async function generateFixtures(): Promise<ViewerFixtures> {
  const out = mkdtempSync(join(tmpdir(), "viewer-fixtures-"));
  const runId = "fx";
  const { runDir } = await runArenaCli(["--seeds", "1", "--scenarios", ARENA_SCENARIOS.join(","), "--out", out, "--run-id", runId, "--config", CHAMPION, "--catalog", CATALOG, "--quiet"]);
  const summary = SummarySchema.parse(JSON.parse(readFileSync(join(runDir, "summary.json"), "utf8")));
  const games = readJsonl(join(runDir, "transcripts.jsonl")).map((l) => TranscriptLineSchema.parse(l));
  const traces = new Map<string, TraceLine[]>();
  for (const file of readdirSync(join(runDir, "traces"))) {
    traces.set(file.replace(/\.jsonl$/, ""), readJsonl(join(runDir, "traces", file)).map((l) => TraceLineSchema.parse(l) as TraceLine));
  }

  const dir = mkdtempSync(join(tmpdir(), "viewer-tournament-"));
  const scenarioPath = join(dir, "scenario.json");
  const scenarioText = JSON.stringify({ role: "buyer", reservation: { pct: 3.37 } });
  writeFileSync(scenarioPath, scenarioText);
  const trace = createTournamentTrace(join(dir, "traces"), scenarioPath);
  const agent = createAgent({ configPath: CHAMPION, scenarioPath, provider: "none", logger: silentLogger, trace });
  const sessionId = "ring-session-1";
  for (const round of [1, 2, 3]) {
    const body = { sessionId, round, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: round }, text: `${RIVAL_HTML} Te ofrezco un ${round} %.` };
    const res = await agent.app.request("/turn", { method: "POST", body: JSON.stringify(body) });
    if (res.status !== 200) throw new Error(`turno ${round}: HTTP ${res.status}`);
  }
  const tournamentTrace = readJsonl(trace.fileFor(sessionId)).map((l) => TraceLineSchema.parse(l) as TraceLine);
  const ref: ScenarioRef = { id: "scenario.json", hash: scenarioHash(scenarioText), mandate: { role: "buyer", reservation: { pct: 3.37 } } };

  return {
    runId,
    summary,
    games,
    traces,
    tournament: { trace: tournamentTrace, ref },
    dirs: { runDir, tournamentDir: join(dir, "traces"), scenarioPath },
  };
}

/** Traza v1: sin `traceVersion` en la cabecera ni `explain` en el registro `engine`. */
export function asV1Trace(trace: readonly TraceLine[]): TraceLine[] {
  return trace.map((line) => {
    if (line.kind === "header") {
      const { traceVersion: _v, ...rest } = line;
      return rest as TraceLine;
    }
    if (line.box !== "engine" || typeof line.output !== "object" || line.output === null) return line;
    const { explain: _e, ...output } = line.output as Record<string, unknown>;
    return { ...line, output };
  });
}
