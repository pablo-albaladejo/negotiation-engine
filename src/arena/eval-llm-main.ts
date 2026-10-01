import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createLlmBot } from "../bots/llm-bot.js";
import { loadConfig } from "../engine/config.js";
import { createProviderClient, LlmProviderSchema } from "../llm/provider.js";
import { runArenaCli } from "./cli.js";
import { createAgentParticipant } from "./agent-participant.js";
import { runArena } from "./arena.js";
import type { GameMetrics } from "./metrics.js";
import { loadCatalog } from "./scenario.js";
import type { TraceRecord } from "../pipeline/box.js";

/**
 * `pnpm eval:llm`: mide si el parser y el narrador LLM aportan valor sobre la vía determinista,
 * con llamadas reales (`LLM_PROVIDER=claude-cli`). Ver `scripts/eval-llm.sh` para el entorno
 * necesario (perfil personal, no la pasarela de Aircall) y README.md para el coste.
 */

function env(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function list(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)} %`;
}

function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx]!;
}

function byRival(games: readonly GameMetrics[]): Map<string, GameMetrics[]> {
  const map = new Map<string, GameMetrics[]>();
  for (const g of games) {
    const list = map.get(g.rival) ?? [];
    list.push(g);
    map.set(g.rival, list);
  }
  return map;
}

function meanOf(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

/** Lee todas las trazas JSONL de un run de `pnpm arena` (una línea por caja, tras la cabecera). */
function readTraces(runDir: string): TraceRecord[] {
  const tracesDir = join(runDir, "traces");
  let files: string[];
  try {
    files = readdirSync(tracesDir);
  } catch {
    return [];
  }
  const records: TraceRecord[] = [];
  for (const file of files) {
    const lines = readFileSync(join(tracesDir, file), "utf8").trim().split("\n");
    for (const line of lines.slice(1)) {
      if (!line) continue;
      records.push(JSON.parse(line) as TraceRecord);
    }
  }
  return records;
}

interface NarratorStats {
  narratorCalls: number;
  parserCalls: number;
  validatorRejectionRate: number | null;
  templateFallbackRate: number | null;
  leakBlocks: number;
  narratorLatencyP50: number | null;
  narratorLatencyP95: number | null;
  parserLatencyP50: number | null;
  parserLatencyP95: number | null;
}

/** Solo cuenta cajas con el proveedor LLM dado: con `none` el narrador es la plantilla, gratis. */
function narratorStats(records: readonly TraceRecord[], provider: string, games: number): NarratorStats {
  const llm = records.filter((r) => r.provider === provider);
  const narrator = llm.filter((r) => r.box === "narrator");
  const parser = llm.filter((r) => r.box === "parser");
  const validator = llm.filter((r) => r.box === "validator");
  const validatorRejections = validator.filter((r) => (r.output as { ok?: boolean } | null)?.ok === false);
  const leak = llm.filter((r) => r.box === "leak");
  const leakBlocks = leak.filter((r) => (r.output as { leak?: boolean } | null)?.leak === true).length;
  const template = llm.filter((r) => r.box === "template").length;
  const lat = (rs: TraceRecord[]) => rs.map((r) => r.latencyMs);
  return {
    narratorCalls: narrator.length,
    parserCalls: parser.length,
    validatorRejectionRate: validator.length ? validatorRejections.length / validator.length : null,
    templateFallbackRate: games ? template / games : null,
    leakBlocks,
    narratorLatencyP50: quantile(lat(narrator), 0.5),
    narratorLatencyP95: quantile(lat(narrator), 0.95),
    parserLatencyP50: quantile(lat(parser), 0.5),
    parserLatencyP95: quantile(lat(parser), 0.95),
  };
}

function parserTable(none: Map<string, GameMetrics[]>, llm: Map<string, GameMetrics[]>): string {
  const rivals = [...new Set([...none.keys(), ...llm.keys()])].sort();
  const rows = rivals.map((rival) => {
    const n = none.get(rival) ?? [];
    const l = llm.get(rival) ?? [];
    const sum = (arr: GameMetrics[], f: (g: GameMetrics) => number) => arr.reduce((s, g) => s + f(g), 0);
    const agreementRate = (arr: GameMetrics[]) => (arr.length ? sum(arr, (g) => (g.agreement ? 1 : 0)) / arr.length : null);
    const surplus = (arr: GameMetrics[]) => meanOf(arr.map((g) => g.surplusShare));
    return {
      rival,
      none: { unextracted: sum(n, (g) => g.unextracted), misExtracted: sum(n, (g) => g.misExtracted), agreement: agreementRate(n), surplus: surplus(n) },
      llm: { unextracted: sum(l, (g) => g.unextracted), misExtracted: sum(l, (g) => g.misExtracted), agreement: agreementRate(l), surplus: surplus(l) },
    };
  });
  const fmt = (v: number | null) => (v === null ? "—" : pct(v));
  const header = "rival".padEnd(16) + "sin-extraer(none/llm)".padEnd(24) + "mal-extraídas(none/llm)".padEnd(26) + "acuerdo(none/llm)".padEnd(22) + "excedente(none/llm)";
  const lines = rows.map(
    (r) =>
      r.rival.padEnd(16) +
      `${r.none.unextracted}/${r.llm.unextracted}`.padEnd(24) +
      `${r.none.misExtracted}/${r.llm.misExtracted}`.padEnd(26) +
      `${fmt(r.none.agreement)}/${fmt(r.llm.agreement)}`.padEnd(22) +
      `${fmt(r.none.surplus)}/${fmt(r.llm.surplus)}`,
  );
  return [header, ...lines].join("\n");
}

async function main(): Promise<void> {
  const outRoot = env("EVAL_LLM_OUT", "results/eval-llm");
  const runId = env("EVAL_LLM_RUN_ID", new Date().toISOString().replace(/[:.]/g, "").replace("Z", ""));
  const outDir = join(outRoot, runId);
  mkdirSync(outDir, { recursive: true });

  const scenario = env("EVAL_LLM_SCENARIO", "text-buyer-wide");
  const rivals = env("EVAL_LLM_RIVALS", "text-only,inject-voss,liar,hypothetical,extreme-anchor,causa-prima");
  const seeds = env("EVAL_LLM_SEEDS", "1");

  console.log(`== 1-2. parser y narrador: ${scenario} × [${rivals}] × semillas ${seeds} ==`);
  const runA = await runArenaCli(["--seeds", seeds, "--scenarios", scenario, "--rivals", rivals, "--llm-provider", "none", "--out", outDir, "--run-id", "a-none"], () => {});
  const runB = await runArenaCli(["--seeds", seeds, "--scenarios", scenario, "--rivals", rivals, "--llm-provider", "claude-cli", "--out", outDir, "--run-id", "b-claude-cli"], () => {});

  const table = parserTable(byRival(runA.report.games), byRival(runB.report.games));
  console.log(table);

  const tracesB = readTraces(runB.runDir);
  const stats = narratorStats(tracesB, "claude-cli", runB.report.games.length);
  console.log("\n== narrador (de la corrida b) ==");
  console.log(
    `validador: rechazo ${stats.validatorRejectionRate === null ? "—" : pct(stats.validatorRejectionRate)} · ` +
      `plantilla: ${stats.templateFallbackRate === null ? "—" : pct(stats.templateFallbackRate)} por partida · fugas bloqueadas: ${stats.leakBlocks}`,
  );
  console.log(
    `latencia narrador p50/p95: ${stats.narratorLatencyP50?.toFixed(0) ?? "—"}/${stats.narratorLatencyP95?.toFixed(0) ?? "—"} ms · ` +
      `latencia parser p50/p95: ${stats.parserLatencyP50?.toFixed(0) ?? "—"}/${stats.parserLatencyP95?.toFixed(0) ?? "—"} ms`,
  );
  console.log(
    `latencia de turno (motor completo) media/máx (run b): ${runB.report.overall.latencyMeanMs?.toFixed(0) ?? "—"}/${runB.report.overall.latencyMaxMs.toFixed(0)} ms ` +
      `vs turnBudgetMs = ${loadConfig("config/champion.json").turnBudgetMs} ms`,
  );
  console.log(`llamadas reales al LLM (run b): parser ${stats.parserCalls} + narrador ${stats.narratorCalls} = ${stats.parserCalls + stats.narratorCalls}`);

  let rivalSummary: { none: ReturnType<typeof summaryOf>; llm?: ReturnType<typeof summaryOf> } | undefined;
  if (env("EVAL_LLM_SKIP_RIVAL", "0") !== "1") {
    const rivalGames = Number(env("EVAL_LLM_RIVAL_GAMES", "3"));
    const rivalScenarioId = env("EVAL_LLM_RIVAL_SCENARIO", "price-buyer-wide");
    const rivalSeedStart = Number(env("EVAL_LLM_RIVAL_SEED_START", "101"));
    const rivalProvider = LlmProviderSchema.parse(env("EVAL_LLM_RIVAL_PROVIDER", "claude-cli"));
    const client = createProviderClient(rivalProvider);
    if (!client) throw new Error("EVAL_LLM_RIVAL_PROVIDER no puede ser none: el bot rival necesita LLM");
    const catalog = loadCatalog();
    const rivalScenario = catalog.find((s) => s.id === rivalScenarioId);
    if (!rivalScenario) throw new Error(`escenario desconocido: ${rivalScenarioId}`);
    const seedsList = Array.from({ length: rivalGames }, (_, k) => rivalSeedStart + k);
    const championConfig = loadConfig("config/champion.json");

    console.log(`\n== 3. rival LLM real: campeona (provider=none) vs llm-bot (${rivalProvider}), ${rivalGames} partidas ==`);
    let calls = 0;
    const counted = { ...client, complete: ((req: Parameters<typeof client.complete>[0]) => (calls++, client.complete(req))) as typeof client.complete };
    const llmBot = createLlmBot({ client: counted, persona: "negociador duro pero razonable, directo" });
    const championNone = createAgentParticipant({ config: championConfig, provider: "none" });
    const reportNone = await runArena({ scenarios: [rivalScenario], rivals: [llmBot], agent: championNone, seeds: seedsList });
    console.log(summaryLine("campeona=none", reportNone.games));
    console.log(`llamadas reales al LLM (llm-bot): ${calls}`);
    rivalSummary = { none: summaryOf(reportNone.games) };
  }

  writeFileSync(
    join(outDir, "eval-llm-summary.json"),
    `${JSON.stringify(
      {
        scenario,
        rivals: list(rivals),
        seeds,
        runA: runA.summary,
        runB: runB.summary,
        narratorStats: stats,
        rivalSummary,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`\nresultados: ${outDir}`);
}

function summaryOf(games: readonly GameMetrics[]) {
  return {
    games: games.length,
    agreementRate: games.length ? games.filter((g) => g.agreement).length / games.length : null,
    meanSurplus: meanOf(games.map((g) => g.surplusShare)),
    meanRounds: games.length ? games.reduce((s, g) => s + g.rounds, 0) / games.length : null,
    violations: games.reduce((s, g) => s + g.violations, 0),
    leaks: games.reduce((s, g) => s + g.leaks, 0),
  };
}

function summaryLine(label: string, games: readonly GameMetrics[]): string {
  const s = summaryOf(games);
  return `${label}: ${s.games} partidas · acuerdo ${s.agreementRate === null ? "—" : pct(s.agreementRate)} · excedente medio ${s.meanSurplus === null ? "—" : pct(s.meanSurplus)} · rondas medias ${s.meanRounds?.toFixed(1) ?? "—"} · violaciones ${s.violations} · fugas ${s.leaks}`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
