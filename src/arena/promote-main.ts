import { parseArgs } from "node:util";
import { createProviderClient, currentProvider } from "../llm/provider.js";
import type { Criterion } from "./gate.js";
import type { HeldOutOptions } from "./paired.js";
import { promote } from "./promote.js";
import { DEFAULT_CATALOG, loadCatalog } from "./scenario.js";

// `pnpm promote <candidata.json>`: puerta de promoción y, si pasa, config/champion.json con versión N+1.
async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      champion: { type: "string", default: "config/champion.json" },
      seeds: { type: "string", default: "21" },
      "reval-seeds": { type: "string" },
      scenarios: { type: "string" },
      rivals: { type: "string" },
      criterion: { type: "string", default: "sign" },
      catalog: { type: "string", default: DEFAULT_CATALOG },
      "llm-bot": { type: "string" },
      "rival-url": { type: "string" },
      "rival-name": { type: "string", default: "external" },
      out: { type: "string", default: "results" },
    },
  });
  const candidatePath = positionals[0];
  if (!candidatePath) throw new Error("uso: pnpm promote <candidata.json> [--seeds N] [--reval-seeds N] [--criterion sign|bootstrap]");
  if (values.criterion !== "sign" && values.criterion !== "bootstrap") throw new Error("--criterion debe ser sign o bootstrap");
  const list = (v: string | undefined) => v?.split(",").map((s) => s.trim()).filter(Boolean);
  const wanted = list(values.scenarios);
  const catalog = loadCatalog(values.catalog);
  const scenarios = wanted ? catalog.filter((s) => wanted.includes(s.id)) : catalog;
  const heldOut: Omit<HeldOutOptions, "previousChampion"> = {};
  if (values["llm-bot"]) {
    const client = createProviderClient(currentProvider());
    if (!client) throw new Error("--llm-bot necesita LLM_PROVIDER distinto de none");
    heldOut.llmBot = { client, persona: values["llm-bot"] };
  }
  if (values["rival-url"]) heldOut.external = [{ name: values["rival-name"], baseUrl: values["rival-url"] }];
  const result = await promote({
    candidatePath,
    championPath: values.champion,
    seeds: Number(values.seeds),
    ...(values["reval-seeds"] ? { revalidationSeeds: Number(values["reval-seeds"]) } : {}),
    scenarios,
    ...(list(values.rivals) ? { tuningRivalNames: list(values.rivals)! } : {}),
    heldOut,
    criterion: values.criterion as Criterion,
    resultsDir: values.out,
  });
  if (!result.promoted) console.error(`no se promueve: ${result.reason}`);
  return result.promoted ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
