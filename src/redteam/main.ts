import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { startRedteamServer } from "./harness.js";
import { markdownReport, summarizePromptfoo, summaryLine, type PromptfooRow } from "./report.js";

export const PROMPTFOO = "promptfoo@0.123.1";

/**
 * `pnpm redteam`: arranca el agente real en 127.0.0.1 (proveedor `none`) con el arnés de
 * aserciones, ejecuta `npx promptfoo@0.123.1 eval` con un número de casos acotado y deja en
 * `results/redteam-*` el JSON de promptfoo, `summary.json` y `report.md`. Sale con 1 si hay
 * algún fallo real. `--broken` sirve un agente que filtra la reserva (la suite debe fallar);
 * `--extended` usa la configuración con plugins de promptfoo (necesita evaluador LLM y red).
 */
async function main(): Promise<number> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "max-cases": { type: "string", default: "40" },
      broken: { type: "boolean", default: false },
      extended: { type: "boolean", default: false },
      out: { type: "string", default: "results" },
    },
  });
  const config = resolve(values.extended ? "redteam/redteam-extended.yaml" : "redteam/promptfooconfig.yaml");
  const runId = `redteam-${new Date().toISOString().replace(/[:.]/g, "").replace("Z", "")}`;
  const runDir = resolve(values.out, runId);
  mkdirSync(runDir, { recursive: true });
  const server = await startRedteamServer({ broken: values.broken });
  const output = join(runDir, "promptfoo.json");
  // El extendido genera los ataques (`redteam run`); su tope de casos es `numTests` en la configuración.
  const args = values.extended
    ? ["-y", PROMPTFOO, "redteam", "run", "-c", config, "-o", output, "--no-cache", "--max-concurrency", "1"]
    : ["-y", PROMPTFOO, "eval", "-c", config, "-o", output, "--no-cache", "--no-progress-bar", "--no-table", "--max-concurrency", "1", "--filter-first-n", values["max-cases"]];
  const code = await new Promise<number>((done) => {
    const child = spawn("npx", args, {
      stdio: ["ignore", "inherit", "inherit"],
      env: {
        ...process.env,
        REDTEAM_AGENT_URL: server.url,
        LLM_PROVIDER: values.extended ? (process.env.LLM_PROVIDER ?? "none") : "none",
        PROMPTFOO_DISABLE_TELEMETRY: "1",
        PROMPTFOO_DISABLE_UPDATE: "1",
        PROMPTFOO_DISABLE_SHARING: "1",
        PROMPTFOO_DISABLE_REMOTE_GENERATION: values.extended ? (process.env.PROMPTFOO_DISABLE_REMOTE_GENERATION ?? "") : "1",
      },
    });
    child.on("exit", (c) => done(c ?? 1));
  });
  await server.close();
  if (!existsSync(output)) {
    console.error(`promptfoo no dejó resultados (código ${code})`);
    return 1;
  }
  const raw = JSON.parse(readFileSync(output, "utf8")) as { results?: { results?: PromptfooRow[] } };
  const summary = summarizePromptfoo(raw.results?.results ?? []);
  writeFileSync(join(runDir, "summary.json"), `${JSON.stringify({ runId, config, broken: values.broken, promptfooExit: code, ...summary }, null, 2)}\n`);
  writeFileSync(join(runDir, "report.md"), markdownReport(summary, { runId, config, broken: values.broken }));
  console.log(`${summaryLine(summary)}\ninforme: ${join(runDir, "report.md")}`);
  return summary.realFailures.length > 0 || summary.cases === 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
