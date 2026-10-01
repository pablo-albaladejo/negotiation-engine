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
    expect(TraceHeaderSchema.parse(header)).toMatchObject({ mode: "tournament", traceVersion: 2, role: "buyer", scenario: { id: "scenario.json" } });
    expect(header).not.toHaveProperty("mandate");
    for (const record of records) expect(TraceLineSchema.safeParse(record).success).toBe(true);
    // La reserva (3,37) no aparece como valor en ningún registro. Se recorren los valores en vez de
    // buscar en el texto crudo: un timestamp o una latencia con "337" daba falsos positivos.
    const TIMING_KEY = /latency|duration|elapsed|timestamp|(^|_)ts$|At$|Ms$/i;
    const leaks: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (typeof value === "number" && Math.abs(value - 3.37) < 1e-9) leaks.push(path);
      else if (typeof value === "string" && /(?<![\d.,])3[.,]37(?!\d)/.test(value)) leaks.push(path);
      else if (value && typeof value === "object")
        for (const [key, child] of Object.entries(value)) if (!TIMING_KEY.test(key)) walk(child, `${path}.${key}`);
    };
    [header, ...records].forEach((line, i) => walk(line, `línea ${i + 1}`));
    expect(leaks).toEqual([]);
    expect(trace.failures).toBe(0);
  });

  it("el esquema rechaza una cabecera de torneo con mandato", () => {
    const header = { kind: "header", mode: "tournament", sessionId: "s", configVersion: 1, createdAt: new Date().toISOString(), scenario: { id: "x", hash: "0123456789abcdef" } };
    expect(TraceHeaderSchema.safeParse(header).success).toBe(true);
    expect(TraceHeaderSchema.safeParse({ ...header, mandate: { role: "buyer", reservation: { pct: 3 } } }).success).toBe(false);
  });

  it("una cabecera v1 (sin traceVersion ni role) sigue siendo válida", () => {
    const header = { kind: "header", mode: "tournament", sessionId: "s", configVersion: 1, createdAt: new Date().toISOString(), scenario: { id: "x", hash: "0123456789abcdef" } };
    expect("traceVersion" in header).toBe(false);
    expect(TraceLineSchema.safeParse(header).success).toBe(true);
  });

  it("v2 añade traceVersion y role en la cabecera de torneo; sigue sin mandato", () => {
    const header = { kind: "header", mode: "tournament", sessionId: "s", configVersion: 1, createdAt: new Date().toISOString(), traceVersion: 2, role: "seller", scenario: { id: "x", hash: "0123456789abcdef" } };
    expect(TraceHeaderSchema.safeParse(header).success).toBe(true);
    expect(TraceHeaderSchema.safeParse({ ...header, mandate: { role: "seller", reservation: { pct: 3 } } }).success).toBe(false);
  });

  it("narrator que filtra texto sensible: las trazas JSONL no contienen el texto completo, solo metadatos", async () => {
    const out = mkdtempSync(join(tmpdir(), "trace-sanitized-"));
    // Ejecutar con un escenario pequeño y verificar que los registros de narrator/validator/leak
    // no contienen el texto sensible sino solo longitudes y flags
    const { runDir, report } = await runArenaCli(["--seeds", "1", "--scenarios", "price-buyer-wide", "--rivals", "boulware", "--out", out, "--run-id", "r", "--quiet"]);
    const files = readdirSync(join(runDir, "traces"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const [header, ...records] = readLines(join(runDir, "traces", file));
      const content = readFileSync(join(runDir, "traces", file), "utf8");
      // Verificar que no aparece ningun texto de narrator/validator/leak sin sanitizar
      for (const record of records) {
        const box = record.box;
        if (box === "narrator" && record.input) {
          // Input solo debe tener persona, sin instrucciones completas
          const input = record.input as Record<string, unknown>;
          expect(input).not.toHaveProperty("decision");
          expect(input).not.toHaveProperty("reserves");
        }
        if (box === "narrator" && record.output) {
          // Output de narrator no debe ser el texto completo sino metadatos
          const output = record.output as Record<string, unknown>;
          expect(typeof output === "object" && output !== null).toBe(true);
          if (output && typeof output === "object" && "textLength" in output) {
            // Si se registra textLength, no debe haber un campo "text"
            expect(output).not.toHaveProperty("text");
          }
        }
        if (box === "leak" && record.output) {
          // Output de leak no debe contener las razones
          const output = record.output as Record<string, unknown>;
          expect(output).not.toHaveProperty("reasons");
        }
        if (box === "validator" && record.output) {
          // Output de validator sanitizado: solo {ok}, sin reasons con cifras
          const output = record.output as Record<string, unknown>;
          expect(output).toHaveProperty("ok");
          expect(output).not.toHaveProperty("reasons");
        }
      }
    }
  });

  it("validator output sanitizado: solo {ok}, sin reasons con cifras", async () => {
    const out = mkdtempSync(join(tmpdir(), "trace-validator-"));
    const { runDir } = await runArenaCli(["--seeds", "1", "--scenarios", "price-buyer-wide", "--rivals", "boulware", "--out", out, "--run-id", "r", "--quiet"]);
    const files = readdirSync(join(runDir, "traces"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const [header, ...records] = readLines(join(runDir, "traces", file));
      for (const record of records) {
        if (record.box === "validator" && typeof record.output === "object" && record.output) {
          const output = record.output as Record<string, unknown>;
          // Output solo debe tener `ok`, sin `reasons` que contengan cifras
          expect(output).toHaveProperty("ok");
          expect(output).not.toHaveProperty("reasons");
        }
      }
    }
  });
});
