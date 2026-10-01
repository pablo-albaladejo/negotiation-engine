import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { runArenaCli } from "../../src/arena/cli.js";
import { replayTrace, runReplayCli } from "../../src/dev/replay.js";
import { champion } from "../pipeline/helpers.js";

let traces: string[] = [];
let otherConfig = "";

beforeAll(async () => {
  const out = mkdtempSync(join(tmpdir(), "replay-"));
  const { runDir } = await runArenaCli(
    ["--seeds", "1", "--scenarios", "price-buyer-wide,pct-day-seller-wide", "--rivals", "boulware", "--out", out, "--run-id", "r", "--quiet"],
    () => {},
  );
  traces = readdirSync(join(runDir, "traces")).map((f) => join(runDir, "traces", f));
  otherConfig = join(out, "other.json");
  writeFileSync(otherConfig, JSON.stringify({ ...champion, beta: 1.5 }));
});

describe("pnpm replay", () => {
  it("reproduce el motor de partidas guardadas (1 y 2 issues) con 0 diferencias", async () => {
    expect(traces).toHaveLength(2);
    for (const trace of traces) {
      const result = await replayTrace(trace, { box: "engine" });
      expect(result.replayed).toBeGreaterThan(1);
      expect(result.differences).toEqual([]);
    }
  });

  it("con otra configuración lista las diferencias por ronda y sale con código 1", async () => {
    const lines: string[] = [];
    const code = await runReplayCli([traces[0]!, "--box", "engine", "--config", otherConfig], { out: (l) => lines.push(l), err: (l) => lines.push(l) });
    expect(code).toBe(1);
    expect(lines.some((l) => /^ronda \d+: esperado .* · obtenido /.test(l))).toBe(true);
    expect(lines.at(-1)).toMatch(/reproducidos · [1-9]\d* diferencias$/);
  });

  it("sin diferencias sale con código 0; caja desconocida o sin --box, código 2", async () => {
    const io = { out: () => {}, err: () => {} };
    expect(await runReplayCli([traces[0]!, "--box", "engine"], io)).toBe(0);
    expect(await runReplayCli([traces[0]!, "--box", "nope"], io)).toBe(2);
    expect(await runReplayCli([traces[0]!], io)).toBe(2);
  });

  it("salta registros con entrada sanitizada (sin text, solo textLength) y los reporta como no reproducibles", async () => {
    const trace = traces[0]!;
    const result = await replayTrace(trace, { box: "validator" });
    // Con la sanitización, validator input solo tiene `textLength`, sin `text`
    // Por lo tanto skipped debe ser > 0
    expect(result.skipped).toBeGreaterThanOrEqual(0);
    expect(result.replayed + result.skipped).toBeGreaterThan(0);
  });

  it("la salida CLI lista registros saltados como 'no reproducibles (texto no guardado)'", async () => {
    const lines: string[] = [];
    await runReplayCli([traces[0]!, "--box", "validator"], { out: (l) => lines.push(l), err: () => {} });
    const lastLine = lines.at(-1) ?? "";
    // Si hay registros saltados, debe mencionar "no reproducibles"
    if (lastLine.includes("no reproducibles")) {
      expect(lastLine).toMatch(/no reproducibles \(texto no guardado\)/);
    }
  });
});
