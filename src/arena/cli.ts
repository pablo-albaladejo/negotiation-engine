import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { parseArgs } from "node:util";
import { createBotByName, BOTS } from "../bots/index.js";
import { loadConfig } from "../engine/config.js";
import { createAgentParticipant } from "./agent-participant.js";
import { pairByCluster, runArena, type ArenaReport } from "./arena.js";
import { createHttpParticipant } from "./external.js";
import type { Participant } from "./participant.js";
import { clusterTable, pairedTable } from "./report.js";
import { DEFAULT_CATALOG, loadCatalog } from "./scenario.js";

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

/**
 * `pnpm arena`: nuestro agente (proveedor `none`) contra los bots en código, en proceso y sin red.
 * Imprime la tabla por clúster y guarda en `results/<run>/` el resumen JSON y una transcripción
 * por partida (`transcripts.jsonl`, una línea por partida).
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
      "rival-url": { type: "string" },
      "rival-name": { type: "string", default: "external" },
      "agent-url": { type: "string" },
      "timeout-ms": { type: "string", default: "5000" },
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
  // Con --agent-url el agente es externo (p. ej. `pnpm agent`): su mandato es el de su escenario.
  const agent = values["agent-url"]
    ? createHttpParticipant({ name: "agent-http", baseUrl: values["agent-url"], kind: "agent", timeoutMs })
    : createAgentParticipant({ config });

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
    onGame: (game, metrics) => {
      const { records: _records, ...rest } = game;
      transcripts.write(`${JSON.stringify({ ...rest, metrics })}\n`);
    },
  });
  const durationMs = performance.now() - t0;
  await new Promise<void>((resolve, reject) => transcripts.end((error?: Error | null) => (error ? reject(error) : resolve())));

  let paired: ReturnType<typeof pairByCluster> | undefined;
  let candidateSummary: Record<string, unknown> | undefined;
  if (values.candidate) {
    const candidateConfig = loadConfig(values.candidate);
    const candidate = await runArena({ scenarios, rivals, agent: createAgentParticipant({ config: candidateConfig, name: "candidate" }), seeds });
    paired = pairByCluster(report.games, candidate.games);
    candidateSummary = { path: values.candidate, version: candidateConfig.version, overall: candidate.overall };
  }

  const summary: Record<string, unknown> = {
    runId,
    createdAt: new Date().toISOString(),
    llmProvider: "none",
    network: Boolean(values["rival-url"] || values["agent-url"]),
    agent: agent.name,
    config: { path: values.config, version: config.version, provenance: config.provenance },
    seeds: { start: seedStart, count: seedCount },
    scenarios: scenarios.map((s) => s.id),
    rivals: rivals.map((r) => ({ name: r.name, pool: r.pool })),
    durationMs: Math.round(durationMs),
    overall: report.overall,
    byRole: report.byRole,
    clusters: report.clusters,
    ...(paired ? { candidate: candidateSummary, paired } : {}),
  };
  writeFileSync(join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

  if (!values.quiet) {
    log(clusterTable(report.clusters));
    if (paired) log(`\nComparación pareada (candidata − campeona):\n${pairedTable(paired)}`);
    const o = report.overall;
    log(
      `\n${o.games} partidas en ${(durationMs / 1000).toFixed(1)} s · acuerdo ${(o.agreementRate * 100).toFixed(1)} % · ` +
        `excedente medio ${o.meanSurplus === null ? "—" : `${(o.meanSurplus * 100).toFixed(1)} %`} · violaciones ${o.violations} · ` +
        `ZOPA vacía correcta ${o.emptyZopaCorrect === null ? "—" : `${(o.emptyZopaCorrect * 100).toFixed(0)} %`} · errores del rival ${o.rivalErrors}`,
    );
    log(`resultados: ${runDir}`);
  }
  return { runDir, report, summary };
}
