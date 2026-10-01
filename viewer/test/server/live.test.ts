import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { request, type ClientRequest, type IncomingMessage, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { startViewerServer } from "../../server/http.js";
import { activeTails } from "../../server/live.js";

interface SseEvent {
  event: string;
  data: any;
  at: number;
}

const header = (sessionId: string) => ({
  kind: "header",
  mode: "tournament",
  sessionId,
  configVersion: 1,
  createdAt: new Date().toISOString(),
  traceVersion: 2,
  scenario: { id: "scenario.json", hash: "0123456789abcdef" },
  role: "buyer",
});
const box = (sessionId: string, round: number, extra: Record<string, unknown> = {}) => ({
  kind: "box",
  sessionId,
  round,
  box: "parser",
  input: { textLength: 3 },
  output: { injectionSuspected: true },
  result: "ok",
  latencyMs: 1,
  ...extra,
});
const line = (value: unknown) => `${JSON.stringify(value)}\n`;

/** Cliente SSE mínimo sobre `node:http`: acumula los eventos y permite esperar uno concreto. */
function connect(port: number): Promise<{ events: SseEvent[]; next: (pred: (e: SseEvent) => boolean, ms?: number) => Promise<SseEvent>; req: ClientRequest; res: IncomingMessage }> {
  return new Promise((resolve, reject) => {
    const events: SseEvent[] = [];
    const waiters: { pred: (e: SseEvent) => boolean; resolve: (e: SseEvent) => void }[] = [];
    let buffer = "";
    const req = request({ host: "127.0.0.1", port, path: "/api/live", headers: { host: `127.0.0.1:${port}` } }, (res) => {
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        buffer += chunk;
        let cut: number;
        while ((cut = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          const event = /^event: (.+)$/m.exec(block)?.[1];
          const data = /^data: (.+)$/m.exec(block)?.[1];
          if (!event || data === undefined) continue;
          const e = { event, data: JSON.parse(data), at: Date.now() };
          events.push(e);
          for (const w of [...waiters]) if (w.pred(e)) {
            waiters.splice(waiters.indexOf(w), 1);
            w.resolve(e);
          }
        }
      });
      const next = (pred: (e: SseEvent) => boolean, ms = 3000) => {
        const found = events.find(pred);
        if (found) return Promise.resolve(found);
        return new Promise<SseEvent>((ok, ko) => {
          const timer = setTimeout(() => ko(new Error(`timeout; got ${JSON.stringify(events.map((x) => x.event))}`)), ms);
          waiters.push({ pred, resolve: (e) => (clearTimeout(timer), ok(e)) });
        });
      };
      resolve({ events, next, req, res });
    });
    req.on("error", reject);
    req.end();
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let root: string;
let agentDir: string;
let server: Server;
let port: number;
const open: ClientRequest[] = [];

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), "viewer-live-"));
  mkdirSync(join(root, "results", "agent-2026-01-01T000000000"), { recursive: true });
  agentDir = join(root, "results", "agent-2026-10-01T000000000");
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(agentDir, "old-00000000.jsonl"), line(header("old")) + line(box("old", 1)));
  ({ server, port } = await startViewerServer({ repoRoot: root, env: { VIEWER_PORT: "0" } }));
});
afterEach(() => {
  for (const req of open.splice(0)) req.destroy();
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

async function client() {
  const c = await connect(port);
  open.push(c.req);
  return c;
}

describe("GET /api/live (SSE, solo lectura)", () => {
  it("responde text/event-stream y reproduce la sesión más reciente del agent-* más reciente", async () => {
    const c = await client();
    expect(c.res.statusCode).toBe(200);
    expect(c.res.headers["content-type"]).toMatch(/^text\/event-stream/);
    const session = await c.next((e) => e.event === "session");
    expect(session.data).toEqual({ runId: "agent-2026-10-01T000000000", session: "old-00000000" });
    const head = await c.next((e) => e.event === "record");
    expect(head.data).toMatchObject({ session: "old-00000000", line: 1, record: { kind: "header", mode: "tournament" } });
    const record = await c.next((e) => e.event === "record" && e.data.line === 2);
    expect(record.data).toMatchObject({ session: "old-00000000", line: 2, record: { box: "parser", round: 1 } });
  });

  it("una línea añadida llega al cliente en menos de 1 s", async () => {
    const c = await client();
    await c.next((e) => e.event === "record" && e.data.line === 2);
    const t0 = Date.now();
    appendFileSync(join(agentDir, "old-00000000.jsonl"), line(box("old", 2, { box: "binding" })));
    const got = await c.next((e) => e.event === "record" && e.data.record.box === "binding");
    expect(got.at - t0).toBeLessThan(1000);
    expect(got.data.line).toBe(3);
  });

  it("una escritura partida se retiene hasta su salto de línea y llega como un único registro", async () => {
    const c = await client();
    await c.next((e) => e.event === "record" && e.data.line === 3);
    const text = line(box("old", 3, { box: "engine" }));
    const half = Math.floor(text.length / 2);
    appendFileSync(join(agentDir, "old-00000000.jsonl"), text.slice(0, half));
    await wait(1200);
    expect(c.events.filter((e) => e.event !== "session" && e.data.line === 4)).toEqual([]);
    appendFileSync(join(agentDir, "old-00000000.jsonl"), text.slice(half));
    const got = await c.next((e) => e.event === "record" && e.data.line === 4);
    expect(got.data.record.box).toBe("engine");
    await wait(600);
    expect(c.events.filter((e) => e.data.line === 4)).toHaveLength(1);
    expect(c.events.some((e) => e.event === "invalid")).toBe(false);
  });

  it("un fichero de sesión nuevo emite `session` y sus registros desde el principio", async () => {
    const c = await client();
    await c.next((e) => e.event === "record" && e.data.line === 4);
    writeFileSync(join(agentDir, "new-11111111.jsonl"), line(header("new")) + line(box("new", 1)));
    const session = await c.next((e) => e.event === "session" && e.data.session === "new-11111111");
    expect(session.data.runId).toBe("agent-2026-10-01T000000000");
    const record = await c.next((e) => e.event === "record" && e.data.session === "new-11111111" && e.data.line === 2);
    expect(record.data.record.sessionId).toBe("new");
  });

  it("una línea inválida emite `invalid` con fichero, línea y campo, y la cola sigue", async () => {
    const c = await client();
    await c.next((e) => e.event === "session");
    const file = join(agentDir, "new-11111111.jsonl");
    appendFileSync(file, line(box("new", 0)) + "{not json\n" + line(box("new", 2, { box: "leak", output: { leak: true } })));
    const bad = await c.next((e) => e.event === "invalid" && e.data.line === 3);
    expect(bad.data).toMatchObject({ file: "agent-2026-10-01T000000000/new-11111111.jsonl", line: 3, path: "round" });
    const truncated = await c.next((e) => e.event === "invalid" && e.data.line === 4);
    expect(truncated.data.message).toMatch(/invalid JSON/);
    const after = await c.next((e) => e.event === "record" && e.data.line === 5);
    expect(after.data.record.box).toBe("leak");
  });

  it("al desconectar el cliente se cierran su vigilancia y su conexión", async () => {
    await wait(200);
    const before = activeTails();
    const c = await client();
    await c.next((e) => e.event === "session");
    expect(activeTails()).toBe(before + 1);
    c.req.destroy();
    await wait(200);
    expect(activeTails()).toBe(before);
    const connections = await new Promise<number>((resolve) => server.getConnections((_e, n) => resolve(n)));
    expect(connections).toBe(0);
  });
});
