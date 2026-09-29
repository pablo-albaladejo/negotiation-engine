import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createAgent, createTournamentTrace } from "../../src/agent/agent.js";
import { runArenaCli } from "../../src/arena/cli.js";
import { silentLogger } from "../../src/pipeline/box.js";
import { sessionFileName, TraceHeaderSchema, TraceLineSchema, TraceRecordSchema } from "../../src/pipeline/trace.js";

const readLines = (file: string) => readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);

describe("trazas JSONL", () => {
  it("modo arena: cada partida produce una cabecera con el mandato y registros válidos contra el esquema", async () => {
    const out = mkdtempSync(join(tmpdir(), "trace-"));
    const { runDir, report } = await runArenaCli(["--seeds", "1", "--scenarios", "price-buyer-wide,text-seller-wide", "--out", out, "--run-id", "r", "--quiet"]);
    const files = readdirSync(join(runDir, "traces"));
    expect(files).toHaveLength(report.games.length);
    for (const file of files) {
      const [header, ...records] = readLines(join(runDir, "traces", file));
      expect(TraceHeaderSchema.parse(header)).toMatchObject({ mode: "arena", mandate: { reservation: expect.any(Object) } });
      expect(records.length).toBeGreaterThan(0);
      for (const record of records) expect(TraceRecordSchema.safeParse(record).success, JSON.stringify(record).slice(0, 200)).toBe(true);
      const boxes = new Set(records.map((r) => r.box));
      for (const box of ["input", "parser", "reconcile", "binding", "engine", "narrator", "validator", "leak", "output"]) expect(boxes).toContain(box);
    }
  });

  it("modo torneo: la cabecera lleva solo la referencia al escenario y ningún registro la reserva", async () => {
    const dir = mkdtempSync(join(tmpdir(), "trace-"));
    const scenarioPath = join(dir, "scenario.json");
    writeFileSync(scenarioPath, JSON.stringify({ role: "buyer", reservation: { pct: 3.37 } }));
    const trace = createTournamentTrace(join(dir, "traces"), scenarioPath);
    const agent = createAgent({ configPath: "config/champion.json", scenarioPath, provider: "none", logger: silentLogger, trace });
    for (const round of [1, 2, 3]) {
      const body = { sessionId: "ring/s:1", round, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: round }, text: `Te ofrezco un ${round} %.` };
      const res = await agent.app.request("/turn", { method: "POST", body: JSON.stringify(body) });
      expect(res.status).toBe(200);
    }
    const file = trace.fileFor("ring/s:1");
    expect(file.endsWith(sessionFileName("ring/s:1"))).toBe(true);
    const [header, ...records] = readLines(file);
    expect(TraceHeaderSchema.parse(header)).toMatchObject({ mode: "tournament", scenario: { id: "scenario.json" } });
    expect(header).not.toHaveProperty("mandate");
    for (const record of records) expect(TraceLineSchema.safeParse(record).success).toBe(true);
    expect(readFileSync(file, "utf8")).not.toMatch(/3\.37|337/);
    expect(trace.failures).toBe(0);
  });

  it("el esquema rechaza una cabecera de torneo con mandato", () => {
    const header = { kind: "header", mode: "tournament", sessionId: "s", configVersion: 1, createdAt: new Date().toISOString(), scenario: { id: "x", hash: "0123456789abcdef" } };
    expect(TraceHeaderSchema.safeParse(header).success).toBe(true);
    expect(TraceHeaderSchema.safeParse({ ...header, mandate: { role: "buyer", reservation: { pct: 3 } } }).success).toBe(false);
  });
});
