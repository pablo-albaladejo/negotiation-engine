import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { parseArgs } from "node:util";
import { createBotByName, BOTS } from "../bots/index.js";
import { NL_LANGUAGES, type NlLanguage } from "../bots/nl-renderer.js";
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
import { createBoxClient, LlmProviderSchema } from "../llm/provider.js";
import { loadRuntimeConfig, type RuntimeOverrides } from "../pipeline/runtime-config.js";

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
      "runtime-config": { type: "string" },
      "ring-mode": { type: "string" },
      "parser-policy": { type: "string" },
      "acceptance-signal": { type: "string" },
      "narrator-language": { type: "string" },
      "parser-provider": { type: "string" },
      "narrator-provider": { type: "string" },
      "text-mode": { type: "string" },
      languages: { type: "string" },
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
  // Configuración de ejecución (config/runtime.json o --runtime-config) con sobrescrituras de CLI;
  // `--llm-provider` es el proveedor por defecto de cada caja.
  const overrides: RuntimeOverrides = {};
  const flag = (name: string) => values[name as keyof typeof values] as string | undefined;
  const setIf = (key: keyof typeof overrides, name: string) => {
    const v = flag(name);
    if (v !== undefined) overrides[key] = v;
  };
  setIf("ringMode", "ring-mode");
  setIf("parserPolicy", "parser-policy");
  setIf("acceptanceSignal", "acceptance-signal");
  setIf("narratorLanguage", "narrator-language");
  setIf("parserProvider", "parser-provider");
  setIf("narratorProvider", "narrator-provider");
  const runtime = loadRuntimeConfig({ ...(values["runtime-config"] ? { path: values["runtime-config"] } : {}), env: { ...process.env, LLM_PROVIDER: llmProvider }, overrides });
  const parserClient = createBoxClient(runtime.llm.parser);
  const narratorClient = values["no-narrator"] ? undefined : createBoxClient(runtime.llm.narrator);
  const agentDeps: { parser?: ReturnType<typeof createLlmParser>; narrator?: ReturnType<typeof createLlmNarrator>; runtime: typeof runtime } = { runtime };
  if (parserClient) agentDeps.parser = createLlmParser(parserClient, { timeoutMs: runtime.llm.parser.timeoutMs });
  if (narratorClient) agentDeps.narrator = createLlmNarrator(narratorClient, { timeoutMs: runtime.llm.narrator.timeoutMs });
  // Con --agent-url el agente es externo (p. ej. `pnpm agent`): su mandato es el de su escenario.
  const agent = values["agent-url"]
    ? createHttpParticipant({ name: "agent-http", baseUrl: values["agent-url"], kind: "agent", timeoutMs })
    : createAgentParticipant({ config, provider: llmProvider, ...agentDeps });

  const runId = values["run-id"] ?? `arena-${new Date().toISOString().replace(/[:.]/g, "").replace("Z", "")}`;
  const runDir = join(values.out, runId);
  mkdirSync(runDir, { recursive: true });
  const transcripts = createWriteStream(join(runDir, "transcripts.jsonl"));

  const t0 = performance.now();
  const textMode = values["text-mode"];
  if (textMode !== undefined && textMode !== "full" && textMode !== "agent-side") throw new Error("--text-mode debe ser full o agent-side");
  const languages = list(values.languages) ?? ["es", "en"];
  for (const l of languages) if (!(NL_LANGUAGES as readonly string[]).includes(l)) throw new Error(`--languages: idioma sin renderizador: ${l} (admitidos: ${NL_LANGUAGES.join(", ")})`);
  const report = await runArena({
    scenarios,
    rivals,
    agent,
    seeds,
    ...(textMode ? { textMode } : {}),
    languages: languages as NlLanguage[],
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
    const candidate = await runArena({ scenarios, rivals, agent: createAgentParticipant({ config: candidateConfig, name: "candidate", runtime }), seeds });
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
    if (textMode === "full") {
      const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${(v * 100).toFixed(1)} %`);
      log(
        `texto completo (${languages.join(",")}) · falsas aceptaciones ${o.falseAccepts ?? 0} · aceptaciones no detectadas ${o.missedAccepts ?? 0} · ` +
          `confirmación ${pct(o.confirmRate)} · plantilla ${pct(o.templateRate)} · latencia p50 ${o.latencyP50Ms?.toFixed(2) ?? "—"} ms p95 ${o.latencyP95Ms?.toFixed(2) ?? "—"} ms`,
      );
    }
    log(`resultados: ${runDir}`);
  }
  return { runDir, report, summary };
}
