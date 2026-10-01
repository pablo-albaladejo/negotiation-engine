import { readFileSync } from "node:fs";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { loadConfig } from "../engine/config.js";
import { createRng } from "../engine/rng.js";
import { createContext, runBox } from "../pipeline/box.js";
import { TraceHeaderSchema, TraceRecordSchema, type TraceHeader } from "../pipeline/trace.js";
import type { CliIo } from "./box.js";
import { getBox, listBoxes } from "./registry.js";

const consoleIo: CliIo = { out: (l) => console.log(l), err: (l) => console.error(l) };

export interface ReplayDifference {
  round: number;
  expected: unknown;
  actual: unknown;
}

export interface ReplayResult {
  replayed: number;
  skipped: number;
  differences: ReplayDifference[];
}

export interface ReplayOptions {
  box: string;
  /** Parámetros del motor de otra configuración; sin ella, los registrados en la traza. */
  config?: string;
  /** Mandato `{ role, reservation }` para trazas de torneo, que no lo guardan. */
  scenario?: string;
}

interface TraceFile {
  header: TraceHeader;
  records: { round: number; box: string; input: unknown; output: unknown; result: string }[];
}

export function readTrace(file: string): TraceFile {
  const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
  if (lines.length === 0) throw new Error(`traza vacía: ${file}`);
  const header = TraceHeaderSchema.parse(JSON.parse(lines[0]!));
  const records = lines.slice(1).map((l) => TraceRecordSchema.parse(JSON.parse(l)));
  return { header, records };
}

function mandateOf(header: TraceHeader, scenario?: string): unknown {
  if (header.mode === "arena") return header.mandate;
  if (!scenario) throw new Error("la traza de torneo no guarda el mandato: indica --scenario <fichero con role y reservation>");
  const raw = JSON.parse(readFileSync(scenario, "utf8")) as { role?: unknown; reservation?: unknown };
  return { role: raw.role, reservation: raw.reservation };
}

/**
 * Reproduce los registros `ok` de una caja con sus mismas entradas y compara la salida. Para el
 * motor reconstruye la entrada completa: issues, parámetros, estado y semilla de la traza, mandato
 * de la cabecera (o de `--scenario`) y, con `--config`, los parámetros de esa configuración.
 */
export async function replayTrace(file: string, options: ReplayOptions): Promise<ReplayResult> {
  const box = getBox(options.box);
  if (!box) throw new Error(`caja desconocida: ${options.box} (disponibles: ${listBoxes().join(", ")})`);
  const { header, records } = readTrace(file);
  const config = options.config ? loadConfig(options.config) : undefined;
  const mandate = options.box === "engine" ? mandateOf(header, options.scenario) : undefined;
  const differences: ReplayDifference[] = [];
  let replayed = 0;
  let skipped = 0;
  for (const record of records) {
    if (record.box !== options.box || record.result !== "ok") continue;
    // Saltar registros con entrada sanitizada (sin `text`, solo `textLength`)
    const inputObj = record.input as Record<string, unknown> | null;
    if (inputObj && typeof inputObj === "object" && "textLength" in inputObj && !("text" in inputObj)) {
      skipped++;
      continue;
    }
    let input = record.input;
    if (options.box === "engine") {
      const recorded = record.input as { issues?: unknown; params: Record<string, unknown>; state: unknown; seed: number };
      const params = config
        ? Object.fromEntries(
            Object.entries({
              beta: config.beta,
              openingMargin: config.openingMargin,
              acceptMargin: config.acceptMargin,
              acTimeThreshold: config.acTimeThreshold,
              noise: config.noise,
              defaultHorizon: config.defaultHorizon,
              reciprocity: config.reciprocity,
              acCombiThreshold: config.acCombiThreshold,
            }).filter(([, v]) => v !== undefined),
          )
        : recorded.params;
      const issues = recorded.issues ?? config?.issues;
      if (!issues) throw new Error("la traza no guarda los issues del motor: indica --config");
      input = { issues, mandate, params, state: recorded.state, seed: recorded.seed };
    }
    replayed++;
    let actual: unknown;
    try {
      actual = await runBox(box, input, createContext({ rng: createRng(0), now: () => 0 }));
    } catch (error) {
      actual = { error: error instanceof Error ? error.message : String(error) };
    }
    if (!isDeepStrictEqual(actual, record.output)) differences.push({ round: record.round, expected: record.output, actual });
  }
  return { replayed, skipped, differences };
}

/** `pnpm replay <trace.jsonl> --box <name> [--config <file>] [--scenario <file>]`: 0 sin diferencias, 1 con ellas, 2 error. */
export async function runReplayCli(argv: readonly string[], io: CliIo = consoleIo): Promise<number> {
  try {
    const { values, positionals } = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: { box: { type: "string" }, config: { type: "string" }, scenario: { type: "string" } },
      strict: true,
    });
    if (positionals.length !== 1 || !values.box) throw new Error("uso: pnpm replay <trace.jsonl> --box <name> [--config <file>] [--scenario <file>]");
    const options: ReplayOptions = { box: values.box };
    if (values.config) options.config = values.config;
    if (values.scenario) options.scenario = values.scenario;
    const { replayed, skipped, differences } = await replayTrace(positionals[0]!, options);
    for (const d of differences) io.out(`ronda ${d.round}: esperado ${JSON.stringify(d.expected)} · obtenido ${JSON.stringify(d.actual)}`);
    const skipMsg = skipped > 0 ? ` · ${skipped} no reproducibles (texto no guardado)` : "";
    io.out(`${replayed} registros de ${values.box} reproducidos${skipMsg} · ${differences.length} diferencias`);
    return differences.length === 0 ? 0 : 1;
  } catch (error) {
    io.err(error instanceof Error ? error.message : String(error));
    return 2;
  }
}
