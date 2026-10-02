import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { DEFAULT_NEGOTIATOR_PARAMS, LEGACY_NEGOTIATOR_PARAMS, type NegotiatorParams } from "../negotiator.js";
import { ABUELA_SCENARIOS, formatTable, runGrid, summarize } from "./harness.js";
import { ABUELA_FIXTURE, deriveParams, loadDealerProfile, type SimParams } from "./model.js";
import { naivePolicy, oursPolicy } from "./policies.js";

/**
 * `pnpm bazaar:sim`: nuestro negociador (nuevo, adaptativo), el anterior (`legacy`, ancla lejana + Boulware) y el
 * starter ingenuo contra la Abuela simulada (SIMULATED: modelo calibrado con los hilos 56 y 125).
 * Imprime tablas por artículo y por hipótesis de suelo y escribe
 * `results/bazaar-sim/<timestamp>/summary.json`. Sin red: nunca toca el servidor.
 */

/** `k=v,k2=v2` → objeto numérico (solo claves conocidas de `base`). */
function overrides<T extends object>(spec: string | undefined, base: T, what: string): Partial<T> {
  const out: Record<string, number> = {};
  for (const kv of spec?.split(",").filter(Boolean) ?? []) {
    const [k, v] = kv.split("=");
    if (!k || v === undefined || !(k in base) || !Number.isFinite(Number(v))) throw new Error(`${what}: bad override "${kv}"`);
    out[k] = Number(v);
  }
  return out as Partial<T>;
}

export async function runSimCli(argv: string[], log: (line: string) => void = console.log) {
  const { values } = parseArgs({
    args: argv,
    options: {
      seeds: { type: "string", default: "200" },
      floors: { type: "string", default: "0.15,0.2,0.25,0.3,0.35" },
      dealer: { type: "string", default: ABUELA_FIXTURE },
      scenarios: { type: "string" },
      ours: { type: "string" },
      sim: { type: "string" },
      "max-ticks": { type: "string", default: "40" },
      out: { type: "string", default: "results/bazaar-sim" },
      "no-write": { type: "boolean", default: false },
    },
    strict: true,
  });
  const profile = loadDealerProfile(values.dealer);
  const floors = values.floors.split(",").map(Number);
  const seeds = Number(values.seeds);
  const simParams = overrides<SimParams>(values.sim, deriveParams(profile), "--sim");
  const ours: NegotiatorParams = { ...DEFAULT_NEGOTIATOR_PARAMS, ...overrides(values.ours, DEFAULT_NEGOTIATOR_PARAMS, "--ours") };
  const wanted = values.scenarios?.split(",");
  const scenarios = wanted ? ABUELA_SCENARIOS.filter((s) => wanted.includes(s.name)) : ABUELA_SCENARIOS;
  const episodes = await runGrid({ profile, policies: [oursPolicy(ours), oursPolicy(LEGACY_NEGOTIATOR_PARAMS, "legacy"), naivePolicy()], scenarios, floors, seeds, simParams, maxTicks: Number(values["max-ticks"]) });

  const byScenario = summarize(episodes, "scenario");
  const byFloor = summarize(episodes, "floorFrac");
  const all = summarize(episodes, "all");
  log(`SIMULATED (offline model, not live data) · policies: ours = adaptive negotiator, legacy = previous (far anchor + Boulware), naive = starter`);
  log(`Abuela sim · ${seeds} seeds × floors [${floors.join(", ")}] × ${scenarios.length} items · ${episodes.length} episodes`);
  log("");
  log(formatTable(byScenario, "item"));
  log("");
  log(formatTable(byFloor, "floorFrac"));
  log("");
  log(formatTable(all, "all"));
  const opening = episodes.filter((e) => e.policy === "ours" && e.atOpening).length;
  if (opening) log(`\nWARNING: ours dealt at the opening price ${opening} times (those deals do not count).`);

  const summary = {
    createdAt: new Date().toISOString(),
    dealer: profile.id,
    seeds,
    floors,
    scenarios,
    simParams: deriveParams(profile, simParams),
    oursParams: ours,
    legacyParams: LEGACY_NEGOTIATOR_PARAMS,
    byScenario,
    byFloor,
    all,
  };
  if (!values["no-write"]) {
    const dir = join(values.out, new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    log(`\nwrote ${join(dir, "summary.json")}`);
  }
  return summary;
}

if (process.argv[1]?.endsWith("sim-main.ts")) {
  runSimCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
