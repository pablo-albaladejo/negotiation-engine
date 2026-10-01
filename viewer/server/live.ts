import { watch, type FSWatcher } from "node:fs";
import { open, readdir, stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { TraceLineSchema, type TraceLine } from "../../src/pipeline/trace.js";
import { isSafeId, resolveInside } from "./paths.js";
import { parseLine, type ReadError } from "./read.js";

/**
 * Cola en directo (design.md §6): sigue la traza de torneo del `results/agent-*` más reciente con
 * `fs.watch` y un sondeo de respaldo de 500 ms (en macOS `fs.watch` puede perder eventos). Solo
 * lectura: guarda un desplazamiento y un búfer de línea parcial por fichero y valida cada línea
 * completa con el esquema del escritor. Al conectar reproduce la sesión modificada más
 * recientemente desde el principio; el resto de ficheros existentes se sigue desde su final.
 */
export type LiveEvent =
  | { event: "session"; data: { runId: string; session: string } }
  | { event: "record"; data: { runId: string; session: string; line: number; record: TraceLine } }
  | { event: "invalid"; data: ReadError };

interface Tail {
  offset: number;
  partial: Buffer;
  line: number;
  /** La línea en curso superó `MAX_PARTIAL_BYTES`: ya se emitió `invalid`; se descarta hasta su salto. */
  discarding: boolean;
}

export const LIVE_POLL_MS = 500;
const NEWLINE = 0x0a;
/** Bytes leídos como mucho por fichero y sondeo. */
export const MAX_READ_BYTES = 1024 * 1024;
/** Tope de la línea parcial retenida; una línea más larga se reporta como inválida y se descarta. */
export const MAX_PARTIAL_BYTES = 256 * 1024;
let tails = 0;

/** Colas abiertas ahora mismo (una por cliente conectado); solo para tests y diagnóstico. */
export const activeTails = () => tails;

async function latestAgentRun(results: string): Promise<string | null> {
  try {
    const runs = (await readdir(results)).filter((n) => n.startsWith("agent-") && isSafeId(n)).sort();
    for (const run of runs.reverse()) if (await resolveInside(results, run)) return run;
  } catch {
    // sin results/: nada que seguir todavía
  }
  return null;
}

async function sessionFiles(dir: string): Promise<{ name: string; mtimeMs: number; size: number }[]> {
  const out: { name: string; mtimeMs: number; size: number }[] = [];
  let names: string[];
  try {
    names = (await readdir(dir)).filter((n) => n.endsWith(".jsonl") && isSafeId(n)).sort();
  } catch {
    return out;
  }
  for (const name of names) {
    const real = await resolveInside(dir, name);
    if (!real) continue;
    try {
      const s = await stat(real);
      if (s.isFile()) out.push({ name, mtimeMs: s.mtimeMs, size: s.size });
    } catch {
      // borrado entre readdir y stat
    }
  }
  return out;
}

export function startLiveTail(resultsDir: string, emit: (e: LiveEvent) => void, pollMs = LIVE_POLL_MS): { close: () => void } {
  let closed = false;
  let runId: string | null = null;
  let files = new Map<string, Tail>();
  let watcher: FSWatcher | undefined;
  let scanning = false;
  let again = false;
  tails++;

  const watchDir = (dir: string) => {
    watcher?.close();
    try {
      watcher = watch(dir, { persistent: false }, () => void schedule());
      watcher.on("error", () => watcher?.close());
    } catch {
      watcher = undefined;
    }
  };

  async function readNew(dir: string, name: string, tail: Tail): Promise<void> {
    const session = name.slice(0, -".jsonl".length);
    const real = await resolveInside(dir, name);
    if (!real) return;
    let handle;
    try {
      handle = await open(real, "r");
      const { size } = await handle.stat();
      if (size < tail.offset) Object.assign(tail, { offset: 0, partial: Buffer.alloc(0), line: 0, discarding: false });
      if (size === tail.offset) return;
      const bytesToRead = Math.min(size - tail.offset, MAX_READ_BYTES);
      const chunk = Buffer.alloc(bytesToRead);
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, tail.offset);
      tail.offset += bytesRead;
      let buffer = Buffer.concat([tail.partial, chunk.subarray(0, bytesRead)]);
      let cut: number;
      if (tail.discarding) {
        cut = buffer.indexOf(NEWLINE);
        if (cut < 0) {
          tail.partial = Buffer.alloc(0);
          return;
        }
        buffer = buffer.subarray(cut + 1);
        tail.discarding = false;
      }
      while ((cut = buffer.indexOf(NEWLINE)) >= 0) {
        const text = buffer.subarray(0, cut).toString("utf8");
        buffer = buffer.subarray(cut + 1);
        tail.line += 1;
        if (closed || text.trim() === "") continue;
        const parsed = parseLine(text, `${runId}/${name}`, tail.line, TraceLineSchema);
        if (parsed.ok) emit({ event: "record", data: { runId: runId!, session, line: tail.line, record: parsed.data } });
        else emit({ event: "invalid", data: parsed.error });
      }
      if (buffer.length > MAX_PARTIAL_BYTES) {
        tail.line += 1;
        if (!closed) emit({ event: "invalid", data: { file: `${runId}/${name}`, line: tail.line, path: "", message: "line exceeds 256 KiB without a newline; skipped" } });
        tail.partial = Buffer.alloc(0);
        tail.discarding = true;
      } else {
        tail.partial = Buffer.from(buffer);
      }
    } catch {
      // fichero rotado o borrado: se reintenta en el siguiente sondeo
    } finally {
      await handle?.close();
    }
  }

  async function scan(first: boolean): Promise<void> {
    const latest = await latestAgentRun(resultsDir);
    if (!latest || closed) return;
    const dir = await resolveInside(resultsDir, latest);
    if (!dir) return;
    const switched = latest !== runId;
    if (switched) {
      runId = latest;
      files = new Map();
      if (!closed) watchDir(dir);
    }
    const found = await sessionFiles(dir);
    const replay = first ? ([...found].sort((a, b) => a.mtimeMs - b.mtimeMs).at(-1)?.name ?? null) : null;
    for (const f of found) {
      if (closed) return;
      let tail = files.get(f.name);
      if (!tail) {
        const fromStart = !first || f.name === replay;
        tail = { offset: fromStart ? 0 : f.size, partial: Buffer.alloc(0), line: 0, discarding: false };
        files.set(f.name, tail);
        if (!fromStart) continue;
        emit({ event: "session", data: { runId: latest, session: f.name.slice(0, -".jsonl".length) } });
      }
      await readNew(dir, f.name, tail);
    }
  }

  let first = true;
  async function schedule(): Promise<void> {
    if (closed) return;
    if (scanning) {
      again = true;
      return;
    }
    scanning = true;
    try {
      do {
        again = false;
        await scan(first);
        first = false;
      } while (again && !closed);
    } finally {
      scanning = false;
    }
  }

  const timer = setInterval(() => void schedule(), pollMs);
  void schedule();
  return {
    close() {
      if (closed) return;
      closed = true;
      tails--;
      clearInterval(timer);
      watcher?.close();
    },
  };
}

/** `GET /api/live`: Server-Sent Events con `session`, `record` e `invalid`; se cierra con el cliente. */
export function serveLive(req: IncomingMessage, res: ServerResponse, resultsDir: string, pollMs?: number): void {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store",
    connection: "keep-alive",
    "x-content-type-options": "nosniff",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.write("retry: 1000\n\n");
  const tail = startLiveTail(resultsDir, ({ event, data }) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`), pollMs);
  const ping = setInterval(() => res.write(": ping\n\n"), 15_000);
  const stop = () => {
    clearInterval(ping);
    tail.close();
  };
  req.on("close", stop);
  res.on("close", stop);
}
