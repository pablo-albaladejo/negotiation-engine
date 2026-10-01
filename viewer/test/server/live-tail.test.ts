import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Espías sobre `fs.watch` y `resolveInside`: el segundo permite cerrar la cola a mitad de un escaneo. */
const hooks = vi.hoisted(() => ({ watch: 0, afterResolve: null as ((name: string) => void) | null, reads: [] as number[] }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    open: async (...args: Parameters<typeof actual.open>) => {
      const handle = await actual.open(...args);
      return new Proxy(handle, {
        get(target, prop) {
          if (prop === "read") {
            return (buffer: Buffer, offset: number, length: number, position: number) => {
              hooks.reads.push(length);
              return target.read(buffer, offset, length, position);
            };
          }
          const value = Reflect.get(target, prop, target) as unknown;
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    },
  };
});
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    watch: (...args: Parameters<typeof actual.watch>) => {
      hooks.watch += 1;
      return actual.watch(...args);
    },
  };
});
vi.mock("../../server/paths.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../server/paths.js")>();
  return {
    ...actual,
    resolveInside: async (root: string, name: string) => {
      const real = await actual.resolveInside(root, name);
      hooks.afterResolve?.(name);
      return real;
    },
  };
});

const { activeTails, startLiveTail } = await import("../../server/live.js");
type LiveEvent = Parameters<Parameters<typeof startLiveTail>[1]>[0];

const RUN = "agent-2026-10-01T000000000";
const header = { kind: "header", mode: "tournament", sessionId: "s", configVersion: 1, createdAt: "2026-10-01T00:00:00.000Z", traceVersion: 2, scenario: { id: "scenario.json", hash: "0123456789abcdef" }, role: "buyer" };
const box = (round: number, pad = "") => ({ kind: "box", sessionId: "s", round, box: "parser", input: { textLength: 3, pad }, output: {}, result: "ok", latencyMs: 1 });
const line = (value: unknown) => `${JSON.stringify(value)}\n`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until(pred: () => boolean, ms = 3000): Promise<void> {
  const t0 = Date.now();
  while (!pred()) {
    if (Date.now() - t0 > ms) throw new Error("timeout");
    await wait(10);
  }
}

let results: string;
let file: string;
beforeEach(() => {
  results = join(mkdtempSync(join(tmpdir(), "viewer-tail-")), "results");
  mkdirSync(join(results, RUN), { recursive: true });
  file = join(results, RUN, "s-00000000.jsonl");
  hooks.watch = 0;
  hooks.afterResolve = null;
  hooks.reads = [];
});

describe("startLiveTail: cierre durante el primer escaneo", () => {
  it("cliente que se desconecta mientras se resuelve el run: activeTails() vuelve a 0 y no se crea ningún watcher", async () => {
    writeFileSync(file, line(header));
    const events: LiveEvent[] = [];
    let runResolutions = 0;
    let tail: { close: () => void } | undefined;
    // 1.ª resolución del run: latestAgentRun; 2.ª: scan, justo antes de watchDir. Se cierra entre ambas.
    hooks.afterResolve = (name) => {
      if (name === RUN && ++runResolutions === 2) tail!.close();
    };
    tail = startLiveTail(results, (e) => events.push(e), 60_000);
    expect(activeTails()).toBe(1);
    await until(() => runResolutions >= 2);
    await wait(100);
    expect(activeTails()).toBe(0);
    expect(hooks.watch).toBe(0);
    expect(events).toEqual([]);
  });
});

describe("startLiveTail: límites de memoria", () => {
  it("una línea sin salto de más de 256 KiB emite invalid, descarta el búfer y la cola sigue con la línea siguiente", async () => {
    writeFileSync(file, line(header) + "x".repeat(300 * 1024));
    const events: LiveEvent[] = [];
    const tail = startLiveTail(results, (e) => events.push(e), 50);
    try {
      await until(() => events.some((e) => e.event === "invalid"));
      const invalid = events.filter((e) => e.event === "invalid");
      expect(invalid).toHaveLength(1);
      expect(invalid[0]!.data).toMatchObject({ file: `${RUN}/s-00000000.jsonl`, line: 2, path: "" });
      expect((invalid[0]!.data as { message: string }).message).toMatch(/256 KiB/);

      // El resto de la línea gigante sigue llegando: se descarta hasta su salto, sin un invalid JSON espurio.
      appendFileSync(file, "y".repeat(64 * 1024));
      await wait(200);
      appendFileSync(file, "zzz\n" + line(box(1)));
      await until(() => events.some((e) => e.event === "record" && e.data.record.kind === "box"));
      await wait(150);
      const records = events.flatMap((e) => (e.event === "record" ? [e.data] : []));
      expect(records.map((r) => [r.line, r.record.kind])).toEqual([
        [1, "header"],
        [3, "box"],
      ]);
      expect(events.filter((e) => e.event === "invalid")).toHaveLength(1);
    } finally {
      tail.close();
    }
  });

  it("un fichero de varios MiB se entrega en lecturas de como mucho 1 MiB sin perder ni duplicar líneas", async () => {
    const pad = "p".repeat(997);
    const lines = [line(header), ...Array.from({ length: 3200 }, (_, k) => line(box(k + 1, pad)))];
    const text = lines.join("");
    const size = Buffer.byteLength(text);
    expect(size).toBeGreaterThan(3 * 1024 * 1024);
    writeFileSync(file, text);
    const events: LiveEvent[] = [];
    const tail = startLiveTail(results, (e) => events.push(e), 20);
    try {
      await until(() => events.filter((e) => e.event === "record").length === lines.length, 10_000);
      await wait(100);
      expect(Math.max(...hooks.reads)).toBeLessThanOrEqual(1024 * 1024);
      expect(hooks.reads.length).toBeGreaterThanOrEqual(Math.ceil(size / (1024 * 1024)));
      expect(hooks.reads.reduce((s, n) => s + n, 0)).toBe(size);
      const got = events.flatMap((e) => (e.event === "record" ? [e.data.line] : []));
      expect(got).toEqual(lines.map((_, k) => k + 1));
      expect(events.some((e) => e.event === "invalid")).toBe(false);
    } finally {
      tail.close();
    }
  });
});
