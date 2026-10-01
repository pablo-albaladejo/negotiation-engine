import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { SummarySchema, TranscriptLineSchema } from "../../../src/arena/results-schema.js";
import { TraceLineSchema } from "../../../src/pipeline/trace.js";
import { readJson, readJsonl } from "../../server/read.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
let dir: string;
beforeAll(async () => {
  fx = await generateFixtures();
  dir = mkdtempSync(join(tmpdir(), "viewer-read-"));
});

const write = (name: string, text: string) => {
  const file = join(dir, name);
  writeFileSync(file, text);
  return file;
};
const jsonl = (rows: readonly unknown[]) => rows.map((r) => `${JSON.stringify(r)}\n`).join("");

describe("readJsonl: validación por línea sin caídas", () => {
  it("una línea inválida trae su número (desde 1) y la ruta del campo; las válidas se cargan", async () => {
    const games = fx.games.map((g) => structuredClone(g) as Record<string, unknown>);
    const bad = fx.games.findIndex((g) => g.transcript.some((t) => "offer" in t && t.offer));
    expect(bad).toBeGreaterThanOrEqual(0);
    const transcript = games[bad]!.transcript as { offer?: Record<string, unknown> }[];
    const entry = transcript.findIndex((t) => t.offer);
    const issue = Object.keys(transcript[entry]!.offer!)[0]!;
    transcript[entry]!.offer![issue] = "one hundred four";

    const file = write("transcripts.jsonl", jsonl(games));
    const read = await readJsonl(file, "run/transcripts.jsonl", TranscriptLineSchema);

    expect(read.data).toHaveLength(fx.games.length - 1);
    expect(read.data.map((g) => g.gameId)).not.toContain(fx.games[bad]!.gameId);
    expect(read.errors).toEqual([
      { file: "run/transcripts.jsonl", line: bad + 1, path: `transcript.${entry}.offer.${issue}`, message: expect.any(String) },
    ]);
  });

  it("JSON truncado en la última línea de una traza: error de esa línea y el resto cargado", async () => {
    const trace = fx.traces.values().next().value!;
    const text = jsonl(trace);
    const cut = text.slice(0, text.length - 20);
    const read = await readJsonl(write("trace.jsonl", cut), "run/traces/g.jsonl", TraceLineSchema);
    expect(read.data).toHaveLength(trace.length - 1);
    expect(read.errors).toEqual([{ file: "run/traces/g.jsonl", line: trace.length, path: "", message: expect.stringMatching(/JSON/) }]);
  });

  it("en una unión (TraceLineSchema) señala el campo más profundo, no la raíz", async () => {
    const [header, record] = [fx.tournament.trace[0]!, fx.tournament.trace[1]!];
    const broken = { ...record, round: "three" };
    const badHeader = { ...header, createdAt: "yesterday" };
    const read = await readJsonl(write("union.jsonl", jsonl([header, broken, badHeader])), "t.jsonl", TraceLineSchema);
    expect(read.data).toHaveLength(1);
    expect(read.errors).toMatchObject([
      { line: 2, path: "round" },
      { line: 3, path: "createdAt" },
    ]);
  });

  it("fichero vacío, solo saltos de línea, ausente o directorio: sin datos y sin lanzar", async () => {
    expect(await readJsonl(write("empty.jsonl", ""), "e.jsonl", TraceLineSchema)).toEqual({ data: [], errors: [] });
    expect(await readJsonl(write("blank.jsonl", "\n\n"), "b.jsonl", TraceLineSchema)).toEqual({ data: [], errors: [] });
    const missing = await readJsonl(join(dir, "nope.jsonl"), "nope.jsonl", TraceLineSchema);
    expect(missing).toEqual({ data: [], errors: [{ file: "nope.jsonl", line: null, path: "", message: "cannot read file (ENOENT)" }] });
    const isDir = await readJsonl(dir, "dir", TraceLineSchema);
    expect(isDir.errors[0]?.message).not.toContain(dir);
  });

  it("basura binaria y JSON que no es objeto: errores por línea", async () => {
    const read = await readJsonl(write("junk.jsonl", '\u0000\u0001garbage\n42\nnull\n"x"\n'), "j.jsonl", TraceLineSchema);
    expect(read.data).toEqual([]);
    expect(read.errors.map((e) => e.line)).toEqual([1, 2, 3, 4]);
  });
});

describe("readJson", () => {
  it("summary.json válido, inválido (con campo), truncado y vacío", async () => {
    expect((await readJson(write("s.json", JSON.stringify(fx.summary)), "s.json", SummarySchema)).data).toEqual(fx.summary);
    const bad = await readJson(write("s2.json", JSON.stringify({ ...fx.summary, runId: 7 })), "s2.json", SummarySchema);
    expect(bad).toMatchObject({ data: null, errors: [{ file: "s2.json", line: null, path: "runId" }] });
    const cut = await readJson(write("s3.json", JSON.stringify(fx.summary).slice(0, 30)), "s3.json", SummarySchema);
    expect(cut).toMatchObject({ data: null, errors: [{ message: expect.stringMatching(/JSON/) }] });
    expect((await readJson(write("s4.json", ""), "s4.json", SummarySchema)).data).toBeNull();
  });
});
