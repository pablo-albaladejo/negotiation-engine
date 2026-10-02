import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { runArenaCli } from "../../src/arena/cli.js";
import { SummarySchema, TranscriptLineSchema, type Summary, type TranscriptLine } from "../../src/arena/results-schema.js";
import { loadCatalog, rivalRole } from "../../src/arena/scenario.js";
import { loadConfig } from "../../src/engine/config.js";
import { TraceLineSchema } from "../../src/pipeline/trace.js";

describe("esquemas de resultados v2 (src/arena/results-schema.ts)", () => {
  let runDir: string;
  let lines: unknown[];
  let summary: unknown;

  beforeAll(async () => {
    const out = mkdtempSync(join(tmpdir(), "results-schema-"));
    ({ runDir } = await runArenaCli(["--seeds", "1", "--out", out, "--run-id", "r", "--quiet"]));
    lines = readFileSync(join(runDir, "transcripts.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    summary = JSON.parse(readFileSync(join(runDir, "summary.json"), "utf8"));
  });

  it("cada línea de transcripts.jsonl pasa TranscriptLineSchema con schemaVersion 3, roundLimit y reservas del catálogo", () => {
    const catalog = loadCatalog();
    expect(lines.length).toBeGreaterThan(0);
    for (const raw of lines) {
      const line: TranscriptLine = TranscriptLineSchema.parse(raw);
      const scenario = catalog.find((s) => s.id === line.scenarioId)!;
      expect(line.schemaVersion).toBe(3);
      expect(line.roundLimit).toBe(scenario.rounds);
      expect(line.reserves).toEqual({
        ours: scenario.mandates[scenario.role].reservation,
        rival: scenario.mandates[rivalRole(scenario.role)].reservation,
      });
    }
  });

  it("partida con ZOPA vacía: reservas de ambas partes y metrics.zopaEmpty", () => {
    const empty = lines.map((l) => TranscriptLineSchema.parse(l)).filter((l) => l.metrics.zopaEmpty);
    expect(empty.length).toBeGreaterThan(0);
    for (const line of empty) expect(Object.keys(line.reserves!.rival)).toEqual(Object.keys(line.reserves!.ours));
  });

  it("summary.json pasa SummarySchema con schemaVersion 2 y config.params de la campeona", () => {
    const parsed: Summary = SummarySchema.parse(summary);
    const champion = loadConfig("config/champion.json");
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.config.params).toMatchObject({ beta: champion.beta, persona: champion.persona, defaultHorizon: champion.defaultHorizon });
  });

  it("las trazas de arena llevan cabecera v2 y validan", () => {
    const traces = readdirSync(join(runDir, "traces"));
    expect(traces.length).toBeGreaterThan(0);
    const [header, ...records] = readFileSync(join(runDir, "traces", traces[0]!), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(TraceLineSchema.parse(header)).toMatchObject({ kind: "header", mode: "arena", traceVersion: 2 });
    for (const record of records) expect(TraceLineSchema.safeParse(record).success).toBe(true);
  });

  it("ficheros v1 (sin schemaVersion ni campos nuevos) siguen validando y los campos nuevos quedan sin definir", () => {
    const { schemaVersion: _v, roundLimit: _l, reserves: _r, ...v1Line } = lines[0] as Record<string, unknown>;
    const line = TranscriptLineSchema.parse(v1Line);
    expect(line.schemaVersion).toBeUndefined();
    expect(line.reserves).toBeUndefined();
    const s = summary as Record<string, unknown> & { config: Record<string, unknown> };
    const { schemaVersion: _sv, ...v1Summary } = s;
    const { params: _p, ...v1Config } = s.config;
    const parsed = SummarySchema.parse({ ...v1Summary, config: v1Config });
    expect(parsed.config.params).toBeUndefined();
  });

  it("rechaza campos desconocidos (esquema estricto)", () => {
    expect(TranscriptLineSchema.safeParse({ ...(lines[0] as object), extra: 1 }).success).toBe(false);
  });
});
