import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runArenaCli } from "../../src/arena/cli.js";
import { replayTrace } from "../../src/dev/replay.js";
import { TraceHeaderSchema } from "../../src/pipeline/trace.js";

describe("pnpm replay con mandato apr", () => {
  it("la cabecera v3 lleva la banda apr y el motor se reproduce con 0 diferencias", async () => {
    const out = mkdtempSync(join(tmpdir(), "replay-apr-"));
    const { runDir } = await runArenaCli(["--seeds", "1", "--scenarios", "apr-seller-wide", "--rivals", "causa-prima-engine", "--out", out, "--run-id", "r", "--quiet"], () => {});
    const [file] = readdirSync(join(runDir, "traces"));
    const trace = join(runDir, "traces", file!);
    const header = TraceHeaderSchema.parse(JSON.parse(readFileSync(trace, "utf8").split("\n")[0]!));
    expect(header).toMatchObject({ mode: "arena", traceVersion: 3, mandate: { role: "seller", apr: { min: 8, max: 30, baseDays: 30, day: 10 } } });
    const result = await replayTrace(trace, { box: "engine" });
    expect(result.replayed).toBeGreaterThan(1);
    expect(result.differences).toEqual([]);
  });
});
