import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { parseArgs } from "node:util";
import { createBotByName, BOTS } from "../bots/index.js";
import { loadConfig, type AgentConfig } from "../engine/config.js";
import { createAgentParticipant } from "./agent-participant.js";
import { pairByCluster, runArena, type ArenaReport } from "./arena.js";
import { createHttpParticipant } from "./external.js";
import type { Participant } from "./participant.js";
import { comparePaired, type PairedReport } from "./paired.js";
import { clusterTable, pairedSummaryLine, pairedTable } from "./report.js";
import { writeJsonlTrace } from "../pipeline/trace.js";
import { DEFAULT_CATALOG, loadCatalog, mandateFor, rivalRole } from "./scenario.js";
import { createLlmNarrator } from "../llm/llm-narrator.js";
import { createLlmParser } from "../llm/llm-parser.js";
import { createProviderClient, LlmProviderSchema } from "../llm/provider.js";

export interface ArenaCliResult {
  runDir: string;
  report: ArenaReport;
  summary: Record<string, unknown>;
}

function list(value: string | undefined): string[] | undefined {
  return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
}

function pick<T extends { id?: string; name?: string }>(items: T[], wanted: string[] | undefined, what: string): T[] {
  if (!wanted) return items;
  return wanted.map((w) => {
    const found = items.find((i) => (i.id ?? i.name) === w);
    if (!found) throw new Error(`${what} desconocido: ${w}`);
    return found;
  });
}

/** Parámetros del motor con los que se jugó, para `summary.config.params` (v2). */
function configParams(config: AgentConfig): Record<string, unknown> {
  const { beta, openingMargin, acceptMargin, acTimeThreshold, noise, defaultHorizon, persona, reciprocity, acCombiThreshold } = config;
  return {
    beta,
    openingMargin,
    acceptMargin,
    acTimeThreshold,
    noise,
    defaultHorizon,
    persona,
    ...(reciprocity === undefined ? {} : { reciprocity }),
    ...(acCombiThreshold === undefined ? {} : { acCombiThreshold }),
  };
}

/**
 * `pnpm arena`: nuestro agente (proveedor `none`) contra los bots en código, en proceso y sin red.
 * Imprime la tabla por clúster y guarda en `results/<run>/` el resumen JSON, una transcripción
 * por partida (`transcripts.jsonl`, una línea por partida) y la traza JSONL de cada partida
 * (`traces/<partida>.jsonl`, cabecera con el mandato en modo arena; `--no-traces` la omite).
 */
export async function runArenaCli(argv: string[], log: (line: string) => void = console.log): Promise<ArenaCliResult> {
  const { values } = parseArgs({
    args: argv,
    options: {
      seeds: { type: "string", default: "21" },
      "seed-start": { type: "string", default: "1" },
      scenarios: { type: "string" },
      rivals: { type: "string" },
      config: { type: "string", default: process.env.AGENT_CONFIG ?? "config/champion.json" },
      candidate: { type: "string" },
      catalog: { type: "string", default: DEFAULT_CATALOG },
      out: { type: "string", default: "results" },
      "run-id": { type: "string" },
      quiet: { type: "boolean", default: false },
      "no-traces": { type: "boolean", default: false },
      "rival-url": { type: "string" },
      "rival-name": { type: "string", default: "external" },
      "agent-url": { type: "string" },
      "timeout-ms": { type: "string", default: "5000" },
      "llm-provider": { type: "string", default: process.env.LLM_PROVIDER ?? "none" },
      "no-narrator": { type: "boolean", default: false },
    },
    strict: true,
  });

  const seedCount = Number(values.seeds);
  const seedStart = Number(values["seed-start"]);
  if (!Number.isInteger(seedCount) || seedCount < 1 || !Number.isInteger(seedStart)) throw new Error("--seeds y --seed-start deben ser enteros");
  const seeds = Array.from({ length: seedCount }, (_, k) => seedStart + k);
  const scenarios = pick(loadCatalog(values.catalog), list(values.scenarios), "Escenario");
  const timeoutMs = Number(values["timeout-ms"]);
  const rivalNames = list(values.rivals) ?? (values["rival-url"] ? [] : Object.keys(BOTS));
  const rivals: Participant[] = rivalNames.map((name) => createBotByName(name));
  if (values["rival-url"]) rivals.push(createHttpParticipant({ name: values["rival-name"], baseUrl: values["rival-url"], timeoutMs }));
  const config = loadConfig(values.config);
  // Proveedor LLM opcional (por defecto `none`, sin red): `--llm-provider claude-cli` activa el
  // parser en cuarentena y, salvo `--no-narrator`, el narrador LLM (plantilla si no).
  const llmProvider = LlmProviderSchema.parse(values["llm-provider"]);
  const llmClient = createProviderClient(llmProvider);
  const agentDeps: { parser?: ReturnType<typeof createLlmParser>; narrator?: ReturnType<typeof createLlmNarrator> } = {};
  if (llmClient) {
    agentDeps.parser = createLlmParser(llmClient);
    if (!values["no-narrator"]) agentDeps.narrator = createLlmNarrator(llmClient);
  }
  // Con --agent-url el agente es externo (p. ej. `pnpm agent`): su mandato es el de su escenario.
  const agent = values["agent-url"]
    ? createHttpParticipant({ name: "agent-http", baseUrl: values["agent-url"], kind: "agent", timeoutMs })
    : createAgentParticipant({ config, provider: llmProvider, ...agentDeps });

  const runId = values["run-id"] ?? `arena-${new Date().toISOString().replace(/[:.]/g, "").replace("Z", "")}`;
  const runDir = join(values.out, runId);
  mkdirSync(runDir, { recursive: true });
  const transcripts = createWriteStream(join(runDir, "transcripts.jsonl"));

  const t0 = performance.now();
  const report = await runArena({
    scenarios,
    rivals,
    agent,
    seeds,
    onGame: (game, metrics, scenario) => {
      const { records, ...rest } = game;
      const reserves = { ours: mandateFor(scenario, scenario.role).reservation, rival: mandateFor(scenario, rivalRole(scenario.role)).reservation };
      transcripts.write(`${JSON.stringify({ schemaVersion: 2, ...rest, metrics, roundLimit: scenario.rounds, reserves })}\n`);
      if (values["no-traces"] || records.length === 0) return;
      writeJsonlTrace(join(runDir, "traces", `${game.gameId}.jsonl`), {
        kind: "header",
        mode: "arena",
        sessionId: game.gameId,
        runId,
        scenarioId: scenario.id,
        rival: game.rival,
        seed: game.seed,
        configVersion: config.version,
        createdAt: new Date().toISOString(),
        traceVersion: 2,
        mandate: mandateFor(scenario, scenario.role),
      }, records);
    },
  });
  const durationMs = performance.now() - t0;
  await new Promise<void>((resolve, reject) => transcripts.end((error?: Error | null) => (error ? reject(error) : resolve())));

  let paired: ReturnType<typeof pairByCluster> | undefined;
  let comparison: PairedReport | undefined;
  let candidateSummary: Record<string, unknown> | undefined;
  if (values.candidate) {
    const candidateConfig = loadConfig(values.candidate);
    const candidate = await runArena({ scenarios, rivals, agent: createAgentParticipant({ config: candidateConfig, name: "candidate" }), seeds });
    paired = pairByCluster(report.games, candidate.games);
    comparison = comparePaired({ championGames: report.games, candidateGames: candidate.games }, { roleWeights: config.roleWeights, bootstrap: {} });
    candidateSummary = { path: values.candidate, version: candidateConfig.version, overall: candidate.overall };
  }

  const summary: Record<string, unknown> = {
    schemaVersion: 2,
    runId,
    createdAt: new Date().toISOString(),
    llmProvider,
    network: Boolean(values["rival-url"] || values["agent-url"]),
    agent: agent.name,
    config: { path: values.config, version: config.version, provenance: config.provenance, params: configParams(config) },
    seeds: { start: seedStart, count: seedCount },
    scenarios: scenarios.map((s) => s.id),
    rivals: rivals.map((r) => ({ name: r.name, pool: r.pool })),
    durationMs: Math.round(durationMs),
    overall: report.overall,
    byRole: report.byRole,
    clusters: report.clusters,
    ...(paired ? { candidate: candidateSummary, paired, comparison: { ...comparison, clusters: undefined } } : {}),
  };
  writeFileSync(join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

  if (!values.quiet) {
    log(clusterTable(report.clusters));
    if (paired) log(`\nComparación pareada (candidata − campeona):\n${pairedTable(paired)}\n${pairedSummaryLine(comparison!)}`);
    const o = report.overall;
    log(
      `\n${o.games} partidas en ${(durationMs / 1000).toFixed(1)} s · acuerdo ${(o.agreementRate * 100).toFixed(1)} % · ` +
        `excedente medio ${o.meanSurplus === null ? "—" : `${(o.meanSurplus * 100).toFixed(1)} %`} · violaciones ${o.violations} · ` +
        `ZOPA vacía correcta ${o.emptyZopaCorrect === null ? "—" : `${(o.emptyZopaCorrect * 100).toFixed(0)} %`} · errores del rival ${o.rivalErrors}\n` +
        `fugas ${o.leaks} · plantilla ${o.templateFallbacks} · latencia media ${o.latencyMeanMs === null ? "—" : `${o.latencyMeanMs.toFixed(2)} ms`} (máx ${o.latencyMaxMs.toFixed(1)} ms) · ` +
        `mal extraídas ${o.misExtracted} · sin extraer ${o.unextracted} · acuerdos distintos de los reales ${o.wrongAgreements}`,
    );
    log(`resultados: ${runDir}`);
  }
  return { runDir, report, summary };
}
