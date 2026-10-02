import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runArenaCli } from "./cli.js";
import { formatPlan, planEvalMatrix, type EvalCell } from "./eval-llm-plan.js";
import { loadCatalog } from "./scenario.js";

/**
 * `pnpm eval:llm`: matriz política del parser × idioma del rival × proveedor en texto completo
 * (`--text-mode full`), contra bots en código con el renderizador de lenguaje natural y el bot LLM.
 * Informa `unextracted`, `misread`, falsas aceptaciones, confirmaciones, plantilla y latencia
 * p50/p95 por celda; solo una celda con 0 falsas aceptaciones es candidata a valor por defecto.
 * Llamadas reales salvo con `LLM_PROVIDER=none`; `--dry-run` imprime el plan y la cota de
 * llamadas sin jugar. Entorno (perfil personal de Anthropic): `scripts/eval-llm.sh`.
 * Variables: EVAL_LLM_POLICIES, EVAL_LLM_LANGUAGES, EVAL_LLM_PROVIDERS, EVAL_LLM_RIVALS,
 * EVAL_LLM_LLM_BOT, EVAL_LLM_SCENARIO, EVAL_LLM_SEEDS, EVAL_LLM_MAX_CALLS, EVAL_LLM_OUT.
 */

const fmtPct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${(v * 100).toFixed(1)} %`);
const fmtMs = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toFixed(0));

interface CellResult {
  cell: Omit<EvalCell, "maxCalls">;
  overall: Awaited<ReturnType<typeof runArenaCli>>["report"]["overall"];
}

function table(results: readonly CellResult[]): string[] {
  const header = ["proveedor", "política", "idioma", "partidas", "sin-extraer", "mal-leídas", "falsas-acept", "acept-perdidas", "confirm", "plantilla", "acuerdo", "excedente", "lat p50/p95 ms", "candidata"];
  const rows = results.map(({ cell, overall: o }) => [
    cell.provider,
    cell.policy,
    cell.language,
    String(cell.games),
    String(o.unextracted),
    String(o.misExtracted),
    String(o.falseAccepts ?? 0),
    String(o.missedAccepts ?? 0),
    fmtPct(o.confirmRate),
    fmtPct(o.templateRate),
    fmtPct(o.agreementRate),
    fmtPct(o.meanSurplus),
    `${fmtMs(o.latencyP50Ms)}/${fmtMs(o.latencyP95Ms)}`,
    (o.falseAccepts ?? 0) === 0 && o.violations === 0 && o.leaks === 0 ? "sí" : "no",
  ]);
  const widths = header.map((h, k) => Math.max(h.length, ...rows.map((r) => r[k]!.length)) + 2);
  return [header, ...rows].map((r) => r.map((c, k) => c.padEnd(widths[k]!)).join("").trimEnd());
}

async function main(argv: string[]): Promise<void> {
  const dryRun = argv.includes("--dry-run");
  const scenarioId = process.env.EVAL_LLM_SCENARIO ?? "text-buyer-wide";
  const scenario = loadCatalog().find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(`EVAL_LLM_SCENARIO: escenario desconocido ${scenarioId}`);
  const plan = planEvalMatrix(process.env, scenario.rounds);
  for (const line of formatPlan(plan)) console.log(line);
  if (dryRun) {
    for (const c of plan.cells) console.log(`  ${c.provider} × ${c.policy} × ${c.language}: ${c.games} partidas, ≤ ${c.maxCalls} llamadas`);
    return;
  }
  if (plan.maxCalls > plan.budget) {
    throw new Error(`la cota de llamadas (${plan.maxCalls}) supera EVAL_LLM_MAX_CALLS = ${plan.budget}: reduce la matriz o sube el presupuesto`);
  }

  const outDir = join(process.env.EVAL_LLM_OUT ?? "results/eval-llm", process.env.EVAL_LLM_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, "").replace("Z", ""));
  mkdirSync(outDir, { recursive: true });
  const results: CellResult[] = [];
  for (const { maxCalls: _max, ...cell } of plan.cells) {
    const runId = `${cell.provider}__${cell.policy}__${cell.language}`;
    const args = ["--seeds", String(plan.seeds), "--scenarios", plan.scenario, "--rivals", cell.rivals.join(","), "--llm-provider", cell.provider, "--parser-policy", cell.policy];
    args.push("--text-mode", "full", "--languages", cell.language, "--out", outDir, "--run-id", runId, "--quiet");
    if (cell.llmBot) args.push("--llm-bot-provider", cell.provider);
    const run = await runArenaCli(args, () => {});
    results.push({ cell, overall: run.report.overall });
    console.log(`  hecho: ${runId}`);
  }
  console.log("");
  for (const line of table(results)) console.log(line);
  writeFileSync(join(outDir, "eval-llm-summary.json"), `${JSON.stringify({ plan, results }, null, 2)}\n`);
  console.log(`\nresultados: ${outDir}`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
