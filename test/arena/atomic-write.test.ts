import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeFileAtomic } from "../../src/arena/atomic-write.js";

const json = (fill: string, n: number) => `${JSON.stringify({ fill, rows: Array.from({ length: n }, (_, k) => ({ k, v: fill.repeat(40) })) }, null, 2)}\n`;

describe("writeFileAtomic (gate.json)", () => {
  it("un lector concurrente solo ve el contenido anterior o el nuevo completo, nunca un fichero a medias, y no quedan temporales", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomic-"));
    const path = join(dir, "gate.json");
    const before = json("a", 10);
    const after = json("b", 120_000);
    expect(after.length).toBeGreaterThan(4 * 1024 * 1024);
    writeFileSync(path, before);

    let done = false;
    const seen: string[] = [];
    const reader = (async () => {
      while (!done) seen.push(await readFile(path, "utf8"));
    })();
    await writeFileAtomic(path, after);
    done = true;
    await reader;

    expect(seen.length).toBeGreaterThan(1);
    for (const text of seen) expect(text === before || text === after, `lectura de ${text.length} bytes`).toBe(true);
    expect(readFileSync(path, "utf8")).toBe(after);
    expect(readdirSync(dir)).toEqual(["gate.json"]);
  });

  it("si el renombrado falla, relanza el error y borra el temporal", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomic-"));
    const path = join(dir, "gate.json");
    mkdirSync(join(path, "occupied"), { recursive: true });
    await expect(writeFileAtomic(path, json("c", 1))).rejects.toThrow();
    expect(readdirSync(dir)).toEqual(["gate.json"]);
  });
});
