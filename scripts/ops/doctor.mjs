#!/usr/bin/env node
// `pnpm bazaar:doctor [--fast]`: comprueba que todo está listo para `pnpm bazaar:up`. Solo lectura (ningún POST);
// nunca imprime la clave. Una línea ✓/✗ por comprobación; sale con 1 si alguna falla (3 si solo falta .env.broker).
// --fast se salta typecheck, test y docs:check. La prueba de `bazaar:play --dry-run --once` deshace lo que ella
// misma cambie en results/ (foto antes y después; los ficheros del grabador y results/logs/ no se tocan).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { parseArgs, parseEnv } from "node:util";
import { apiGet, clockLine, DEFAULT_VIEWER_PORT, loadEnv, probeViewer, ROOT } from "./lib.mjs";

const { values } = parseArgs({
  options: {
    fast: { type: "boolean", default: false },
    "viewer-port": { type: "string" },
    "play-timeout": { type: "string", default: "240" },
  },
});
const viewerPort = Number(values["viewer-port"] ?? process.env.VIEWER_PORT ?? DEFAULT_VIEWER_PORT);
const useColor = process.stdout.isTTY;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
let failures = 0;
const ok = (name, detail = "") => console.log(`${paint(32, "✓")} ${name}${detail ? ` — ${detail}` : ""}`);
const bad = (name, detail = "") => {
  failures++;
  console.log(`${paint(31, "✗")} ${name}${detail ? ` — ${detail}` : ""}`);
};
const info = (line) => console.log(`    ${line}`);
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts });
const tail = (s, n = 8) => (s ?? "").trim().split("\n").slice(-n);

console.log(`bazaar:doctor${values.fast ? " (--fast)" : ""} · ${new Date().toLocaleString("sv-SE")}`);

// 1. .env y la clave (nunca se imprime). .env.broker es opcional.
const env = loadEnv();
if (!env.exists) bad(".env", "no existe (copia .env.example y pon BAZAAR_KEY)");
else if (!env.key) bad(".env", "BAZAAR_KEY vacía");
else ok(".env", `BAZAAR_KEY presente (${env.key.length} caracteres) · ${env.url}`);
// .env.broker solo hace falta para el broker en sombra de bazaar:up: si falta, ✗ solo para ese hijo (salida 3).
let brokerMissing = false;
const brokerFile = join(ROOT, ".env.broker");
const brokerKey = existsSync(brokerFile) ? parseEnv(readFileSync(brokerFile, "utf8")).BAZAAR_BROKER_KEY?.trim() : undefined;
if (brokerKey) ok(".env.broker", "BAZAAR_BROKER_KEY presente: bazaar:up arranca el broker en sombra (--dry-run)");
else {
  brokerMissing = true;
  console.log(`${paint(31, "✗")} .env.broker — ${existsSync(brokerFile) ? "BAZAAR_BROKER_KEY vacía" : "no existe"}: solo el broker en sombra no arrancará (los otros tres sí)`);
}

// 2. Node ≥ 22 y pnpm.
const major = Number(process.versions.node.split(".")[0]);
if (major >= 22) ok("node", process.version);
else bad("node", `${process.version} (hace falta ≥ 22)`);
const pnpm = run("pnpm", ["--version"]);
if (pnpm.status === 0) ok("pnpm", pnpm.stdout.trim());
else bad("pnpm", "no encontrado en el PATH");

// 3. git: rama DAY2, árbol limpio o con cambios, por delante o por detrás del remoto.
const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout?.trim();
const dirty = (run("git", ["status", "--porcelain"]).stdout ?? "").split("\n").filter(Boolean).length;
const fetched = run("git", ["fetch", "--quiet", "origin", "DAY2"], { timeout: 15_000 }).status === 0;
const counts = run("git", ["rev-list", "--left-right", "--count", "HEAD...@{u}"]).stdout?.trim().split(/\s+/);
const sync = counts?.length === 2 ? `${counts[0]} por delante, ${counts[1]} por detrás de origin${fetched ? "" : " (sin fetch: dato del último)"}` : "sin rama remota";
const gitDetail = `rama ${branch} · ${dirty ? `${dirty} ficheros con cambios` : "árbol limpio"} · ${sync}`;
if (branch === "DAY2") ok("git", gitDetail);
else bad("git", `${gitDetail} (hace falta DAY2)`);

// 4. typecheck, test y docs:check (se salta con --fast).
if (values.fast) ok("typecheck · test · docs:check", "saltados (--fast)");
else
  for (const script of ["typecheck", "test", "docs:check"]) {
    const t0 = Date.now();
    const r = run("pnpm", [script]);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (r.status === 0) ok(`pnpm ${script}`, `${secs} s`);
    else {
      bad(`pnpm ${script}`, `salió con ${r.status}`);
      for (const l of tail(`${r.stdout}\n${r.stderr}`)) info(l);
    }
  }

// 5. API: /api/clock y /api/me con la clave.
if (env.key) {
  try {
    const clock = await apiGet(env, "/api/clock");
    ok("API /api/clock", clockLine(clock));
    info(`límites: ${Object.entries(clock.limits ?? {}).map(([k, v]) => `${k}=${v}`).join(" · ") || "(ninguno)"}`);
  } catch (e) {
    bad("API /api/clock", e instanceof Error ? e.message : String(e));
  }
  try {
    const me = await apiGet(env, "/api/me");
    ok("API /api/me", `${me.id} ${me.name ?? ""} · caja ${me.cash} · nivel ${me.level} · ${me.assets?.length ?? 0} activos · desbloqueados ${(me.unlocked ?? []).join(", ") || "-"}${me.frozen ? " · CONGELADO" : ""}`);
  } catch (e) {
    bad("API /api/me", e instanceof Error ? e.message : String(e));
  }
} else bad("API", "sin BAZAAR_KEY no se comprueba");

// 6. Puerto del visor: libre o ya sirviendo el visor.
const port = await probeViewer(viewerPort);
if (port === "free") ok(`puerto ${viewerPort}`, "libre: bazaar:up arrancará el visor");
else if (port === "viewer") ok(`puerto ${viewerPort}`, "ya sirve el visor: bazaar:up lo reutiliza");
else bad(`puerto ${viewerPort}`, "ocupado por otro proceso (bazaar:up buscará otro puerto)");

// 7. `pnpm bazaar:play --dry-run --once` sale con 0; se deshacen solo los cambios que cause en results/.
if (env.key) {
  const RESULTS = join(ROOT, "results");
  const LIVE = join(RESULTS, "bazaar-live");
  // El grabador y bazaar:up escriben a la vez: sus ficheros quedan fuera de la foto y nunca se tocan.
  const foreign = (rel) => rel.startsWith("logs/") || /(^|\/)(stream-[^/]*\.jsonl|feed-poll\.jsonl)$/.test(rel);
  const manifest = () => {
    const m = new Map();
    const walk = (dir) => {
      if (!existsSync(dir)) return;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.isFile()) {
          const rel = relative(RESULTS, p);
          if (foreign(rel)) continue;
          const s = statSync(p);
          m.set(rel, `${s.size}:${s.mtimeMs}`);
        }
      }
    };
    walk(RESULTS);
    return m;
  };
  const gitResults = () => new Set((run("git", ["status", "--porcelain", "--", "results"]).stdout ?? "").split("\n").filter(Boolean));
  const backup = mkdtempSync(join(tmpdir(), "bazaar-doctor-"));
  if (existsSync(LIVE)) cpSync(LIVE, join(backup, "bazaar-live"), { recursive: true, filter: (src) => !foreign(relative(RESULTS, src)) });
  const before = manifest();
  const gitBefore = gitResults();
  const t0 = Date.now();
  const r = run("pnpm", ["bazaar:play", "--dry-run", "--once"], { timeout: Number(values["play-timeout"]) * 1000 });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  // Deshacer: ficheros nuevos fuera; cambiados, de vuelta desde la copia (si están en bazaar-live).
  const after = manifest();
  const reverted = [];
  const kept = [];
  for (const [rel, sig] of after) {
    if (before.get(rel) === sig) continue;
    const abs = join(RESULTS, rel);
    if (!before.has(rel)) {
      rmSync(abs, { force: true });
      reverted.push(`${rel} (nuevo, borrado)`);
    } else if (existsSync(join(backup, rel))) {
      cpSync(join(backup, rel), abs);
      reverted.push(`${rel} (restaurado)`);
    } else kept.push(rel);
  }
  for (const rel of before.keys()) if (!after.has(rel) && existsSync(join(backup, rel))) {
    cpSync(join(backup, rel), join(RESULTS, rel));
    reverted.push(`${rel} (borrado, restaurado)`);
  }
  // Carpetas que creó la prueba y quedaron vacías.
  const pruneEmpty = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) pruneEmpty(join(dir, e.name));
    if (dir !== RESULTS && readdirSync(dir).length === 0 && !existsSync(join(backup, relative(RESULTS, dir)))) rmSync(dir, { recursive: true });
  };
  pruneEmpty(LIVE);
  rmSync(backup, { recursive: true, force: true });
  const gitNew = [...gitResults()].filter((l) => !gitBefore.has(l));
  const tick = /== tick (\d+)/.exec(r.stdout ?? "")?.[1];
  if (r.status === 0) ok("pnpm bazaar:play --dry-run --once", `${secs} s${tick ? ` · tick ${tick}` : ""}`);
  else {
    bad("pnpm bazaar:play --dry-run --once", r.error ? r.error.message : `salió con ${r.status}`);
    for (const l of tail(`${r.stdout}\n${r.stderr}`)) info(l);
  }
  info(reverted.length ? `results/ deshecho: ${reverted.join(", ")}` : "results/: la prueba no cambió nada");
  if (kept.length) info(`results/ cambiado fuera de bazaar-live (no se toca): ${kept.join(", ")}`);
  if (gitNew.length) info(`git status de results/ sigue con cambios nuevos: ${gitNew.join(", ")}`);
} else bad("pnpm bazaar:play --dry-run --once", "sin BAZAAR_KEY no se prueba");

if (failures) console.log(paint(31, `\n${failures} comprobación(es) fallida(s)`));
else if (brokerMissing) console.log(paint(33, "\nListo salvo el broker en sombra: pnpm bazaar:up arranca los otros tres"));
else console.log(paint(32, "\nTodo listo: pnpm bazaar:up"));
// 1: algo falla; 3: solo falta .env.broker (bazaar:up arranca sin el broker en sombra); 0: todo bien.
process.exit(failures ? 1 : brokerMissing ? 3 : 0);
