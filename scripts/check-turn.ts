import { readFileSync } from "node:fs";
import { loadConfig } from "../src/engine/config.js";
import { createProtocolSchemas } from "../src/protocol/schemas.js";

// Valida por stdin una respuesta de POST /turn contra el esquema de salida de la campeona.
const config = loadConfig(process.env.AGENT_CONFIG ?? "config/champion.json");
const schemas = createProtocolSchemas(config.issues.map((i) => i.name));
const raw = readFileSync(0, "utf8");
const parsed = schemas.turnOutput.safeParse(JSON.parse(raw || "null"));
if (!parsed.success) {
  console.error(`salida inválida: ${raw}`);
  process.exit(1);
}
const out = parsed.data;
console.log(`ronda ${out.round}: ${out.action}${out.action === "walk" ? "" : ` ${JSON.stringify(out.offer)}`} — ${out.text}`);
