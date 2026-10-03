#!/usr/bin/env node
// `pnpm bazaar:up`: a single command for the day. Runs the doctor and starts four processes with prefixed, colored output,
// each also logged to results/logs/<date>/<name>.log:
//   recorder → pnpm bazaar:record (records the stream; the only thing that keeps the feed's full history)
//   viewer   → pnpm viewer (if the port already serves the viewer, it is reused and no other is started)
//   play     → pnpm bazaar:play in a loop, in DRY RUN by default
//   broker   → pnpm bazaar:broker --shadow in a loop (Market Test shadow; always dry-run; not started without .env.broker)
// Live only with `--live --confirm` and typing LIVE in the terminal. Ctrl-C stops all. A child that dies is
// restarted with growing backoff (at most 5 times in 10 min). Heartbeat in results/logs/up-status.json.
// In dry-run, play waits while doors are closed or the clock is paused (--no-gate to run it anyway).
// --detach: launches it with nohup in the background; stop it with `pnpm bazaar:down`.
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { apiGet, clockLine, DEFAULT_VIEWER_PORT, loadEnv, localDate, probeViewer, ROOT, STATUS_FILE } from "./lib.mjs";

const { values } = parseArgs({
  options: {
    fast: { type: "boolean", default: false },
    live: { type: "boolean", default: false },
    confirm: { type: "boolean", default: false },
    detach: { type: "boolean", default: false },
    "skip-doctor": { type: "boolean", default: false },
    "no-gate": { type: "boolean", default: false },
    "no-broker": { type: "boolean", default: false },
    "viewer-port": { type: "string" },
    "play-args": { type: "string", default: "" },
  },
});

const MAX_RESTARTS = 5;
const RESTART_WINDOW_MS = 10 * 60_000;
const CLOCK_EVERY_MS = 30_000;
const LIVE_CONFIRMED_ENV = "BAZAAR_UP_LIVE_CONFIRMED";
const useColor = process.stdout.isTTY;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const say = (s) => console.log(`${paint(1, "[up]")} ${s}`);

// ---------- mode: dry-run unless --live --confirm + LIVE typed ----------
if (values.live && !values.confirm) {
  console.error("--live also requires --confirm (pnpm bazaar:up --live --confirm). Starting nothing.");
  process.exit(2);
}
if (values.confirm && !values.live) say("--confirm without --live: staying in DRY RUN.");
let live = false;
if (values.live && values.confirm) {
  if (process.env[LIVE_CONFIRMED_ENV] === "1") live = true; // already confirmed by the process that did --detach
  else {
    const bar = "!".repeat(72);
    console.log(paint(41, `\n${bar}\n  LIVE MODE: bazaar:play will send real POSTs (offers, acceptances, messages)\n  with the team key. Only with the team's approval.\n${bar}\n`));
    if (!process.stdin.isTTY) {
      console.error("A terminal is needed to confirm live mode. Starting nothing.");
      process.exit(2);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((r) => rl.question('Type LIVE to confirm (anything else cancels): ', r));
    rl.close();
    if (answer.trim() !== "LIVE") {
      say("Cancelled: nothing is started.");
      process.exit(1);
    }
    live = true;
  }
}

// ---------- doctor ----------
let noBroker = values["no-broker"] || !existsSync(join(ROOT, ".env.broker"));
if (!values["skip-doctor"]) {
  const args = ["scripts/ops/doctor.mjs", ...(values.fast ? ["--fast"] : []), ...(values["viewer-port"] ? ["--viewer-port", values["viewer-port"]] : [])];
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status === 3 && !noBroker) {
    noBroker = true;
    say("Missing .env.broker: starting without the shadow broker.");
  } else if (r.status !== 0 && r.status !== 3) {
    say("The doctor failed: starting nothing. Fix what is marked ✗ (or run pnpm bazaar:doctor).");
    process.exit(1);
  }
}

// ---------- --detach: nohup in the background ----------
const date = localDate();
const logDir = join(ROOT, "results", "logs", date);
mkdirSync(logDir, { recursive: true });
if (values.detach) {
  const out = openSync(join(logDir, "up.log"), "a");
  const argv = process.argv.slice(2).filter((a) => a !== "--detach" && a !== "--no-broker");
  const child = spawn("nohup", [process.execPath, fileURLToPath(import.meta.url), ...argv, "--skip-doctor", ...(noBroker ? ["--no-broker"] : [])], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", out, out],
    env: { ...process.env, ...(live ? { [LIVE_CONFIRMED_ENV]: "1" } : {}) },
  });
  child.unref();
  say(`In the background (pid ${child.pid}, ${live ? "LIVE" : "dry-run"}). Output: ${relative(ROOT, join(logDir, "up.log"))}`);
  say(`Status: ${relative(ROOT, STATUS_FILE)} · stop: pnpm bazaar:down`);
  process.exit(0);
}

// ---------- viewer port ----------
const env = loadEnv();
let viewerPort = Number(values["viewer-port"] ?? process.env.VIEWER_PORT ?? DEFAULT_VIEWER_PORT);
let reuseViewer = false;
for (let p = viewerPort; p < viewerPort + 10; p++) {
  const state = await probeViewer(p);
  if (state === "viewer") {
    reuseViewer = true;
    viewerPort = p;
    break;
  }
  if (state === "free") {
    if (p !== viewerPort) say(`Port ${viewerPort} taken by another process: the viewer will go on ${p}.`);
    viewerPort = p;
    break;
  }
  if (p === viewerPort + 9) {
    say(`No free port between ${viewerPort} and ${p}: starting nothing.`);
    process.exit(1);
  }
}

// ---------- children ----------
const playArgs = [live ? "--confirm" : "--dry-run", ...values["play-args"].split(/\s+/).filter(Boolean)];
if (!live && playArgs.includes("--confirm")) {
  say("--play-args cannot carry --confirm in dry-run.");
  process.exit(2);
}
const specs = [
  { name: "recorder", color: 36, cmd: "pnpm", args: ["bazaar:record"] },
  ...(reuseViewer ? [] : [{ name: "viewer", color: 35, cmd: "pnpm", args: ["viewer"], env: { VIEWER_PORT: String(viewerPort) } }]),
  { name: "play", color: live ? 31 : 33, cmd: "pnpm", args: ["bazaar:play", ...playArgs], gated: !live && !values["no-gate"] },
  // Shadow broker: ALWAYS --shadow (dry-run without announcing; also with --live), watches the bench to compare against auto in the Market Test.
  // Loads .env.broker itself (loadBrokerEnv). Reads every 5 s (not every 1 s) so as not to spend API quota.
  ...(noBroker ? [] : [{ name: "broker", color: 34, cmd: "pnpm", args: ["bazaar:broker", "--shadow", "--poll-ms", "5000"] }]),
];
const children = new Map(
  specs.map((s) => [s.name, { spec: s, proc: undefined, status: "starting", pid: undefined, startedAt: undefined, restarts: [], restartsTotal: 0, lastExit: undefined, timer: undefined, log: join(logDir, `${s.name}.log`) }]),
);
const started = new Date().toISOString();
let stopping = false;
let lastTick;
let clockState;
let gateOpen = true;
let clockTimer;
let statusTimer;

const stamp = () => new Date().toLocaleTimeString("sv-SE");
function logLine(c, line, stream = "out") {
  appendFileSync(c.log, `${stamp()} ${stream === "err" ? "! " : ""}${line}\n`);
  const width = 8;
  console.log(`${paint(c.spec.color, `[${c.spec.name.padEnd(width)}]`)} ${line}`);
  if (c.spec.name === "play") {
    const m = /== tick (\d+)/.exec(line);
    if (m) lastTick = Number(m[1]);
  }
}
const upLog = join(logDir, "up-events.log");
function event(line) {
  appendFileSync(upLog, `${new Date().toISOString()} ${line}\n`);
  say(line);
}

function writeStatus(extra = {}) {
  const status = {
    pid: process.pid,
    mode: live ? "live" : "dry-run",
    started,
    updated: new Date().toISOString(),
    running: !stopping,
    logDir: relative(ROOT, logDir),
    viewer: { port: viewerPort, url: `http://127.0.0.1:${viewerPort}/#bazaar`, reused: reuseViewer },
    lastTick: lastTick ?? clockState?.tick ?? null,
    clock: clockState ? { tick: clockState.tick, hours: clockState.t_hours, doors: clockState.doors, paused: clockState.paused, at: clockState.at } : null,
    playGate: specs.find((s) => s.name === "play")?.gated ? (gateOpen ? "open" : "waiting") : "off",
    children: Object.fromEntries(
      [...children].map(([name, c]) => [name, { pid: c.pid ?? null, status: c.status, startedAt: c.startedAt ?? null, restarts: c.restartsTotal, lastExit: c.lastExit ?? null, log: relative(ROOT, c.log) }]),
    ),
    ...extra,
  };
  mkdirSync(dirname(STATUS_FILE), { recursive: true });
  writeFileSync(STATUS_FILE, `${JSON.stringify(status, null, 2)}\n`);
}

function start(c) {
  if (stopping) return;
  const { spec } = c;
  // Own process group (detached): pnpm → tsx → node are stopped together with kill(-pid).
  const proc = spawn(spec.cmd, spec.args, { cwd: ROOT, detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0", ...(spec.env ?? {}) } });
  c.proc = proc;
  c.pid = proc.pid;
  c.status = "running";
  c.startedAt = new Date().toISOString();
  appendFileSync(c.log, `${stamp()} ---- start pid ${proc.pid}: ${spec.cmd} ${spec.args.join(" ")}\n`);
  event(`${spec.name}: started (pid ${proc.pid})`);
  createInterface({ input: proc.stdout }).on("line", (l) => logLine(c, l));
  createInterface({ input: proc.stderr }).on("line", (l) => logLine(c, l, "err"));
  proc.on("error", (e) => event(`${spec.name}: failed to start: ${e.message}`));
  proc.on("exit", (code, signal) => {
    c.proc = undefined;
    c.pid = undefined;
    c.lastExit = { code, signal, at: new Date().toISOString() };
    appendFileSync(c.log, `${stamp()} ---- exit code ${code} signal ${signal}\n`);
    if (stopping || c.status === "held") {
      if (c.status !== "held") c.status = "stopped";
      writeStatus();
      return;
    }
    // Crash: restart with growing backoff, at most MAX_RESTARTS in RESTART_WINDOW_MS.
    const now = Date.now();
    c.restarts = c.restarts.filter((t) => now - t < RESTART_WINDOW_MS);
    if (c.restarts.length >= MAX_RESTARTS) {
      c.status = "failed";
      event(`${spec.name}: exited (code ${code}, signal ${signal}); ${MAX_RESTARTS} restarts in 10 min: giving up on this process. See ${relative(ROOT, c.log)}`);
      writeStatus();
      return;
    }
    c.restarts.push(now);
    c.restartsTotal++;
    const wait = Math.min(60_000, 2000 * 2 ** (c.restarts.length - 1));
    c.status = "restarting";
    event(`${spec.name}: exited (code ${code}, signal ${signal}); restart ${c.restarts.length}/${MAX_RESTARTS} in ${wait / 1000} s`);
    writeStatus();
    c.timer = setTimeout(() => {
      c.timer = undefined;
      if (spec.gated && !gateOpen) {
        c.status = "held";
        writeStatus();
        return;
      }
      start(c);
    }, wait);
  });
  writeStatus();
}

function signalGroup(c, sig) {
  if (!c.pid) return;
  try {
    process.kill(-c.pid, sig);
  } catch {
    // no longer exists
  }
}
async function stopChild(c, why) {
  if (c.timer) clearTimeout(c.timer);
  c.timer = undefined;
  if (!c.proc) return;
  const proc = c.proc;
  const exited = new Promise((r) => proc.once("exit", r));
  signalGroup(c, "SIGINT");
  const t1 = setTimeout(() => signalGroup(c, "SIGTERM"), 5000);
  const t2 = setTimeout(() => signalGroup(c, "SIGKILL"), 10_000);
  await exited;
  clearTimeout(t1);
  clearTimeout(t2);
  event(`${c.spec.name}: stopped (${why})`);
}

// ---------- clock: heartbeat and play gate in dry-run ----------
async function pollClock() {
  if (!env.key) return;
  try {
    const c = await apiGet(env, "/api/clock");
    clockState = { ...c, at: new Date().toISOString() };
  } catch (e) {
    clockState = clockState ? { ...clockState, error: e instanceof Error ? e.message : String(e) } : undefined;
    return;
  }
  const play = children.get("play");
  if (!play?.spec.gated) return;
  const open = !clockState.paused && clockState.doors === "open";
  if (open && !gateOpen) {
    gateOpen = true;
    event(`play: doors open (${clockLine(clockState)}); starting`);
    play.status = "starting";
    start(play);
  } else if (!open && gateOpen) {
    gateOpen = false;
    event(`play: waiting (${clockLine(clockState)}); dry-run does not query the API while doors are closed`);
    play.status = "held";
    await stopChild(play, "doors closed or clock paused");
    play.status = "held";
  }
}

let shutdownPromise;
function shutdown(sig) {
  if (shutdownPromise) {
    if (sig === "SIGINT") say("Already stopping; wait (children get 10 s before SIGKILL).");
    return shutdownPromise;
  }
  stopping = true;
  event(`${sig}: stopping the processes`);
  shutdownPromise = (async () => {
    clearInterval(clockTimer);
    clearInterval(statusTimer);
    await Promise.all([...children.values()].map((c) => stopChild(c, sig)));
    for (const c of children.values()) c.status = c.status === "failed" ? "failed" : "stopped";
    writeStatus({ stopped: new Date().toISOString() });
    event("all stopped");
    process.exit(0);
  })();
  return shutdownPromise;
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGHUP", () => void shutdown("SIGHUP"));

// ---------- startup ----------
say(`${live ? paint(41, "LIVE") : "DRY RUN (GET only, no POST)"} · logs in ${relative(ROOT, logDir)}/ · status in ${relative(ROOT, STATUS_FILE)}`);
say(reuseViewer ? `Viewer already running: reusing http://127.0.0.1:${viewerPort}/#bazaar` : `Viewer: http://127.0.0.1:${viewerPort}/#bazaar`);
await pollClock();
if (clockState) say(clockLine(clockState));
if (!gateOpen) say("play will start only when the doors open (--no-gate to run it anyway).");
for (const c of children.values()) if (c.status !== "held") start(c);
clockTimer = setInterval(() => void pollClock(), CLOCK_EVERY_MS);
statusTimer = setInterval(() => writeStatus(), 10_000);
writeStatus();
say("Ctrl-C to stop all processes.");
