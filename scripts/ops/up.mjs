#!/usr/bin/env node
// `pnpm bazaar:up`: un solo comando para el día. Pasa el doctor y arranca cuatro procesos con salida con prefijo y color,
// cada uno también en results/logs/<fecha>/<nombre>.log:
//   recorder → pnpm bazaar:record (graba el stream; lo único que conserva la historia completa del feed)
//   viewer   → pnpm viewer (si el puerto ya sirve el visor, se reutiliza y no se arranca otro)
//   play     → pnpm bazaar:play en bucle, en DRY RUN por defecto
//   broker   → pnpm bazaar:broker --dry-run en bucle (sombra del Market Test; siempre dry-run; sin .env.broker no se arranca)
// En vivo solo con `--live --confirm` y escribiendo LIVE en la terminal. Ctrl-C para todos. Un hijo que cae se
// reinicia con espera creciente (como mucho 5 veces en 10 min). Latido en results/logs/up-status.json.
// En dry-run, play espera con las puertas cerradas o el reloj en pausa (--no-gate para correrlo igual).
// --detach: lo lanza con nohup en segundo plano; se para con `pnpm bazaar:down`.
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

// ---------- modo: dry-run salvo --live --confirm + LIVE tecleado ----------
if (values.live && !values.confirm) {
  console.error("--live exige también --confirm (pnpm bazaar:up --live --confirm). No arranco nada.");
  process.exit(2);
}
if (values.confirm && !values.live) say("--confirm sin --live: sigue en DRY RUN.");
let live = false;
if (values.live && values.confirm) {
  if (process.env[LIVE_CONFIRMED_ENV] === "1") live = true; // ya confirmado por el proceso que hizo --detach
  else {
    const bar = "!".repeat(72);
    console.log(paint(41, `\n${bar}\n  MODO EN VIVO: bazaar:play enviará POST reales (ofertas, aceptaciones, mensajes)\n  con la clave del equipo. Solo con la aprobación del equipo.\n${bar}\n`));
    if (!process.stdin.isTTY) {
      console.error("Hace falta una terminal para confirmar el modo en vivo. No arranco nada.");
      process.exit(2);
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((r) => rl.question('Escribe LIVE para confirmar (cualquier otra cosa cancela): ', r));
    rl.close();
    if (answer.trim() !== "LIVE") {
      say("Cancelado: no se arranca nada.");
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
    say("Falta .env.broker: arranco sin el broker en sombra.");
  } else if (r.status !== 0 && r.status !== 3) {
    say("El doctor falló: no arranco nada. Arregla lo marcado con ✗ (o mira pnpm bazaar:doctor).");
    process.exit(1);
  }
}

// ---------- --detach: nohup en segundo plano ----------
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
  say(`En segundo plano (pid ${child.pid}, ${live ? "EN VIVO" : "dry-run"}). Salida: ${relative(ROOT, join(logDir, "up.log"))}`);
  say(`Estado: ${relative(ROOT, STATUS_FILE)} · parar: pnpm bazaar:down`);
  process.exit(0);
}

// ---------- puerto del visor ----------
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
    if (p !== viewerPort) say(`Puerto ${viewerPort} ocupado por otro proceso: el visor irá en ${p}.`);
    viewerPort = p;
    break;
  }
  if (p === viewerPort + 9) {
    say(`Sin puerto libre entre ${viewerPort} y ${p}: no arranco nada.`);
    process.exit(1);
  }
}

// ---------- hijos ----------
const playArgs = [live ? "--confirm" : "--dry-run", ...values["play-args"].split(/\s+/).filter(Boolean)];
if (!live && playArgs.includes("--confirm")) {
  say("--play-args no puede llevar --confirm en dry-run.");
  process.exit(2);
}
const specs = [
  { name: "recorder", color: 36, cmd: "pnpm", args: ["bazaar:record"] },
  ...(reuseViewer ? [] : [{ name: "viewer", color: 35, cmd: "pnpm", args: ["viewer"], env: { VIEWER_PORT: String(viewerPort) } }]),
  { name: "play", color: live ? 31 : 33, cmd: "pnpm", args: ["bazaar:play", ...playArgs], gated: !live && !values["no-gate"] },
  // Broker en sombra: SIEMPRE dry-run (también con --live), observa el bench para comparar con auto en el Market Test.
  // Carga .env.broker él mismo (loadBrokerEnv). Lee cada 5 s (no cada 1 s) para no gastar cupo de la API.
  ...(noBroker ? [] : [{ name: "broker", color: 34, cmd: "pnpm", args: ["bazaar:broker", "--dry-run", "--poll-ms", "5000"] }]),
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
  // Grupo de procesos propio (detached): pnpm → tsx → node se paran juntos con kill(-pid).
  const proc = spawn(spec.cmd, spec.args, { cwd: ROOT, detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0", ...(spec.env ?? {}) } });
  c.proc = proc;
  c.pid = proc.pid;
  c.status = "running";
  c.startedAt = new Date().toISOString();
  appendFileSync(c.log, `${stamp()} ---- start pid ${proc.pid}: ${spec.cmd} ${spec.args.join(" ")}\n`);
  event(`${spec.name}: arrancado (pid ${proc.pid})`);
  createInterface({ input: proc.stdout }).on("line", (l) => logLine(c, l));
  createInterface({ input: proc.stderr }).on("line", (l) => logLine(c, l, "err"));
  proc.on("error", (e) => event(`${spec.name}: error al arrancar: ${e.message}`));
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
    // Caída: reinicio con espera creciente, como mucho MAX_RESTARTS en RESTART_WINDOW_MS.
    const now = Date.now();
    c.restarts = c.restarts.filter((t) => now - t < RESTART_WINDOW_MS);
    if (c.restarts.length >= MAX_RESTARTS) {
      c.status = "failed";
      event(`${spec.name}: salió (code ${code}, signal ${signal}); ${MAX_RESTARTS} reinicios en 10 min: me rindo con este proceso. Mira ${relative(ROOT, c.log)}`);
      writeStatus();
      return;
    }
    c.restarts.push(now);
    c.restartsTotal++;
    const wait = Math.min(60_000, 2000 * 2 ** (c.restarts.length - 1));
    c.status = "restarting";
    event(`${spec.name}: salió (code ${code}, signal ${signal}); reinicio ${c.restarts.length}/${MAX_RESTARTS} en ${wait / 1000} s`);
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
    // ya no existe
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
  event(`${c.spec.name}: parado (${why})`);
}

// ---------- reloj: latido y puerta de play en dry-run ----------
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
    event(`play: puertas abiertas (${clockLine(clockState)}); arranco`);
    play.status = "starting";
    start(play);
  } else if (!open && gateOpen) {
    gateOpen = false;
    event(`play: en espera (${clockLine(clockState)}); dry-run no consulta la API con las puertas cerradas`);
    play.status = "held";
    await stopChild(play, "puertas cerradas o reloj en pausa");
    play.status = "held";
  }
}

let shutdownPromise;
function shutdown(sig) {
  if (shutdownPromise) {
    if (sig === "SIGINT") say("Ya estoy parando; espera (los hijos tienen 10 s antes de SIGKILL).");
    return shutdownPromise;
  }
  stopping = true;
  event(`${sig}: paro los procesos`);
  shutdownPromise = (async () => {
    clearInterval(clockTimer);
    clearInterval(statusTimer);
    await Promise.all([...children.values()].map((c) => stopChild(c, sig)));
    for (const c of children.values()) c.status = c.status === "failed" ? "failed" : "stopped";
    writeStatus({ stopped: new Date().toISOString() });
    event("todo parado");
    process.exit(0);
  })();
  return shutdownPromise;
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGHUP", () => void shutdown("SIGHUP"));

// ---------- arranque ----------
say(`${live ? paint(41, "EN VIVO") : "DRY RUN (solo GET, ningún POST)"} · logs en ${relative(ROOT, logDir)}/ · estado en ${relative(ROOT, STATUS_FILE)}`);
say(reuseViewer ? `Visor ya en marcha: reutilizo http://127.0.0.1:${viewerPort}/#bazaar` : `Visor: http://127.0.0.1:${viewerPort}/#bazaar`);
await pollClock();
if (clockState) say(clockLine(clockState));
if (!gateOpen) say("play arrancará solo cuando abran las puertas (--no-gate para correrlo igual).");
for (const c of children.values()) if (c.status !== "held") start(c);
clockTimer = setInterval(() => void pollClock(), CLOCK_EVERY_MS);
statusTimer = setInterval(() => writeStatus(), 10_000);
writeStatus();
say("Ctrl-C para parar todos los procesos.");
