import { readFileSync } from "node:fs";
import { BoxContractError, createContext, runBox } from "../pipeline/box.js";
import { createRng } from "../engine/rng.js";
import { getBox, listBoxes } from "./registry.js";

export interface CliIo {
  out: (line: string) => void;
  err: (line: string) => void;
}

const consoleIo: CliIo = { out: (l) => console.log(l), err: (l) => console.error(l) };

const WRAPPER_KEYS = new Set(["description", "input", "expected"]);

/** Admite también fixtures envueltos `{ description?, input, expected? }` (los de test/fixtures/engine). */
function unwrap(fixture: unknown): unknown {
  if (fixture && typeof fixture === "object" && !Array.isArray(fixture) && "input" in fixture) {
    if (Object.keys(fixture).every((k) => WRAPPER_KEYS.has(k))) return (fixture as { input: unknown }).input;
  }
  return fixture;
}

/**
 * `pnpm box <name> <fixture.json> [--seed n]`: ejecuta una caja aislada sobre un fixture con su
 * contrato. Devuelve el código de salida: 0 bien, 1 contrato incumplido (con la ruta del campo),
 * 2 uso incorrecto, caja desconocida o fixture ilegible.
 */
export async function runBoxCli(argv: readonly string[], io: CliIo = consoleIo): Promise<number> {
  const args = [...argv];
  const seedAt = args.indexOf("--seed");
  const seed = seedAt >= 0 ? Number(args.splice(seedAt, 2)[1]) : 0;
  const [name, fixture] = args;
  if (!name || !fixture || args.length !== 2 || !Number.isInteger(seed)) {
    io.err("uso: pnpm box <name> <fixture.json> [--seed n]");
    return 2;
  }
  const box = getBox(name);
  if (!box) {
    io.err(`caja desconocida: ${name} (disponibles: ${listBoxes().join(", ")})`);
    return 2;
  }
  let input: unknown;
  try {
    input = JSON.parse(readFileSync(fixture, "utf8"));
  } catch (error) {
    io.err(`no se puede leer el fixture ${fixture}: ${(error as Error).message}`);
    return 2;
  }
  try {
    const output = await runBox(box, unwrap(input), createContext({ rng: createRng(seed), now: () => 0 }));
    io.out(JSON.stringify(output, null, 2));
    return 0;
  } catch (error) {
    if (error instanceof BoxContractError) {
      io.err(error.message);
      for (const path of error.paths) io.err(`campo: ${path || "(raíz)"}`);
      return 1;
    }
    io.err(`la caja ${name} falló: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
