// E2E: viewer on a temp results dir, SSE curl for 2 s while appending a line, then smoke.sh into a newer agent-* dir.
import { spawn, execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, rmSync, writeFileSync, openSync } from "node:fs";
import { join } from "node:path";

const repo = "/Users/pablo/development/hackathon/negotiation-ring.worktrees/arena-viewer";
const scr = "/private/tmp/claude-501/-Users-pablo-development-hackathon-causa-prima/4328c728-5ba0-4af5-b8fe-2a085aa33646/scratchpad/e2e";
const results = join(scr, "results");
const port = 5299;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const t = () => new Date().toISOString().slice(11, 23);

rmSync(scr, { recursive: true, force: true });
const runDir = join(results, "agent-2026-10-01T170000000");
mkdirSync(runDir, { recursive: true });
const file = join(runDir, "demo-0000aaaa.jsonl");
writeFileSync(file, JSON.stringify({ kind: "header", mode: "tournament", sessionId: "demo", configVersion: 1, createdAt: "2026-10-01T17:00:00.000Z", traceVersion: 2, scenario: { id: "scenario.json", hash: "0123456789abcdef" }, role: "buyer" }) + "\n");

const log = openSync(join(scr, "viewer.log"), "w");
spawn("pnpm", ["viewer"], { cwd: repo, env: { ...process.env, VIEWER_RESULTS_DIR: results, VIEWER_PORT: String(port) }, detached: true, stdio: ["ignore", log, log] }).unref();
for (let i = 0; i < 80; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/api/runs`)).ok) break;
  } catch {}
  await wait(250);
}
console.log(`[${t()}] viewer up`);

const curl = (secs) => spawn("curl", ["-sN", "--max-time", String(secs), `http://127.0.0.1:${port}/api/live`]);
const c1 = curl(2);
let out1 = "";
c1.stdout.on("data", (d) => (out1 += d.toString().split("\n").map((l) => (l ? `[${t()}] ${l}` : l)).join("\n")));
await wait(700);
console.log(`[${t()}] append parser line`);
appendFileSync(file, JSON.stringify({ kind: "box", sessionId: "demo", round: 1, box: "parser", input: { textLength: 5 }, output: { intent: "offer", injectionSuspected: true }, result: "ok", latencyMs: 2, provider: "none" }) + "\n");
await new Promise((r) => c1.on("close", r));
console.log("--- SSE (curl --max-time 2) ---\n" + out1);

// smoke.sh: the real agent writes into a newer agent-* dir under the temp results.
const c2 = curl(25);
let out2 = "";
c2.stdout.on("data", (d) => (out2 += d.toString()));
await wait(300);
try {
  execFileSync("bash", ["scripts/smoke.sh"], { cwd: repo, env: { ...process.env, TRACE_DIR: join(results, "agent-2026-10-01T180000000"), SMOKE_PORT: "8797", SMOKE_RING_PORT: "8798" }, stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });
  console.log("smoke.sh OK");
} catch (e) {
  console.log("smoke.sh FAILED", String(e.stdout ?? "").slice(-400), String(e.stderr ?? "").slice(-400));
}
await wait(1500);
c2.kill();
const events = out2.split("\n").filter((l) => l.startsWith("event: "));
const counts = events.reduce((m, l) => ((m[l] = (m[l] ?? 0) + 1), m), {});
console.log("--- SSE during smoke.sh ---", JSON.stringify(counts));
console.log(out2.split("\n").filter((l) => l.startsWith("data: {\"runId\":\"agent-2026-10-01T18")).slice(0, 2).join("\n").slice(0, 600));
const page = await fetch(`http://127.0.0.1:${port}/`);
console.log("GET / ->", page.status);
