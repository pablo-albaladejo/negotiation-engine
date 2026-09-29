import { serve } from "@hono/node-server";
import { parseArgs } from "node:util";
import { DEFAULT_CATALOG, loadCatalog } from "../arena/scenario.js";
import { createBotByName } from "./index.js";
import { createBotApp } from "./serve-app.js";

// `pnpm bot:serve <bot> [--port 8790] [--scenario price-buyer-wide] [--seed 1]`: un bot como agente HTTP
// para sparring. El bot juega el rol contrario al nuestro en el escenario, con su mandato.
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: "string", default: process.env.PORT ?? "8790" },
    scenario: { type: "string", default: "price-buyer-wide" },
    catalog: { type: "string", default: DEFAULT_CATALOG },
    seed: { type: "string", default: "1" },
  },
});

try {
  const name = positionals[0];
  if (!name) throw new Error("uso: pnpm bot:serve <bot> [--port N] [--scenario id] [--seed N]");
  const scenario = loadCatalog(values.catalog).find((s) => s.id === values.scenario);
  if (!scenario) throw new Error(`Escenario desconocido: ${values.scenario}`);
  const app = createBotApp({ bot: createBotByName(name), scenario, seed: Number(values.seed) });
  serve({ fetch: app.fetch, port: Number(values.port) }, (info) => {
    console.error(JSON.stringify({ level: "info", event: "bot_started", bot: name, scenario: scenario.id, port: info.port }));
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
