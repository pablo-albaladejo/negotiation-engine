import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { loadConfig } from "../engine/config.js";
import { tuningRivals } from "../arena/paired.js";
import { DEFAULT_CATALOG, loadCatalog } from "../arena/scenario.js";
import { crossEntropy, gridSearch, randomSearch, successiveHalving, type Generator } from "./generators.js";
import { PARAM_SPACE, paramsOf, TUNABLE, type TunableParam } from "./space.js";
import { arenaEvaluator, runSweep, sweepTable, writeCandidates } from "./sweep.js";

/**
 * `pnpm tune`: barrido sembrado contra la campeona, solo con rivales `tuning` y semillas de
 * ajuste. Escribe las mejores candidatas en `config/candidates/` y la tabla en `results/`;
 * nunca toca `config/champion.json` (eso es `pnpm promote`, con revalidación).
 */
export async function runTuneCli(argv: string[], log: (line: string) => void = console.log) {
  const { values } = parseArgs({
    args: argv,
    options: {
      generator: { type: "string", default: "random" },
      n: { type: "string", default: "20" },
      seed: { type: "string", default: "1" },
      seeds: { type: "string", default: "5" },
      "max-seeds": { type: "string", default: "21" },
      params: { type: "string" },
      levels: { type: "string", default: "3" },
      scenarios: { type: "string" },
      rivals: { type: "string" },
      champion: { type: "string", default: "config/champion.json" },
      catalog: { type: "string", default: DEFAULT_CATALOG },
      keep: { type: "string", default: "3" },
      "candidates-dir": { type: "string", default: "config/candidates" },
      out: { type: "string", default: "results" },
      "sweep-id": { type: "string" },
    },
    strict: true,
  });
  const list = (v: string | undefined) => v?.split(",").map((s) => s.trim()).filter(Boolean);
  const n = Number(values.n);
  const seed = Number(values.seed);
  const seedCount = Number(values.seeds);
  const wantedParams = list(values.params);
  for (const p of wantedParams ?? []) if (!TUNABLE.includes(p as TunableParam)) throw new Error(`parámetro no ajustable: ${p} (${TUNABLE.join(", ")})`);
  const space = wantedParams ? PARAM_SPACE.filter((r) => wantedParams.includes(r.name)) : PARAM_SPACE;
  const champion = loadConfig(values.champion);
  const catalog = loadCatalog(values.catalog);
  const wantedScenarios = list(values.scenarios);
  const scenarios = wantedScenarios ? catalog.filter((s) => wantedScenarios.includes(s.id)) : catalog;
  const rivals = tuningRivals(list(values.rivals));

  const generators: Record<string, () => Generator> = {
    random: () => randomSearch({ space, n, seed }),
    grid: () => gridSearch({ space, levels: Number(values.levels), n }),
    halving: () => successiveHalving({ space, n, seed, minBudget: seedCount, maxBudget: Number(values["max-seeds"]) }),
    cem: () => crossEntropy({ space, seed, population: Math.max(2, Math.ceil(n / 3)), iterations: 3, start: paramsOf(champion) }),
  };
  const make = generators[values.generator];
  if (!make) throw new Error(`generador desconocido: ${values.generator} (${Object.keys(generators).join(", ")})`);

  const sweepId = values["sweep-id"] ?? `sweep-${values.generator}-s${seed}-${new Date().toISOString().replace(/[:.]/g, "").replace("Z", "")}`;
  const result = await runSweep({ sweepId, base: champion, generator: make(), evaluate: arenaEvaluator({ champion, scenarios, rivals }), seedCount, rivals });
  const written = writeCandidates(result, champion, values["candidates-dir"], Number(values.keep));
  const runDir = join(values.out, sweepId);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "sweep.json"), `${JSON.stringify({ ...result, champion: champion.version, scenarios: scenarios.map((s) => s.id), rivals: rivals.map((r) => r.name), candidates: written }, null, 2)}\n`);
  log(sweepTable(result));
  log(`\n${result.evaluations} evaluaciones (${result.generator}) · candidatas: ${written.join(", ") || "ninguna"} · tabla: ${runDir}`);
  return { result, written, runDir };
}

if (process.argv[1]?.endsWith("tune-main.ts")) {
  runTuneCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
