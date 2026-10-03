#!/usr/bin/env node
// `pnpm bazaar:doctor [--fast]`: checks that everything is ready for `pnpm bazaar:up`. Read-only (no POST);
// never prints the key. One ✓/✗ line per check; exits with 1 if any fails (3 if only .env.broker is missing).
// --fast skips typecheck, test and docs:check. The `bazaar:play --dry-run --once` check undoes whatever it
// changes in results/ (snapshot before and after; the recorder's files and results/logs/ are not touched).
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

// 1. .env and the key (never printed). .env.broker is optional.
const env = loadEnv();
if (!env.exists) bad(".env", "does not exist (copy .env.example and set BAZAAR_KEY)");
else if (!env.key) bad(".env", "BAZAAR_KEY empty");
else ok(".env", `BAZAAR_KEY present (${env.key.length} characters) · ${env.url}`);
// .env.broker is only needed for bazaar:up's shadow broker: if missing, ✗ only for that child (exit 3).
let brokerMissing = false;
const brokerFile = join(ROOT, ".env.broker");
const brokerKey = existsSync(brokerFile) ? parseEnv(readFileSync(brokerFile, "utf8")).BAZAAR_BROKER_KEY?.trim() : undefined;
if (brokerKey) ok(".env.broker", "BAZAAR_BROKER_KEY present: bazaar:up starts the shadow broker (--dry-run)");
else {
  brokerMissing = true;
  console.log(`${paint(31, "✗")} .env.broker — ${existsSync(brokerFile) ? "BAZAAR_BROKER_KEY empty" : "does not exist"}: only the shadow broker will not start (the other three will)`);
}

// 2. Node ≥ 22 and pnpm.
const major = Number(process.versions.node.split(".")[0]);
if (major >= 22) ok("node", process.version);
else bad("node", `${process.version} (≥ 22 required)`);
const pnpm = run("pnpm", ["--version"]);
if (pnpm.status === 0) ok("pnpm", pnpm.stdout.trim());
else bad("pnpm", "not found in PATH");

// 3. git: DAY2 branch, clean or dirty tree, ahead of or behind the remote.
const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).stdout?.trim();
const dirty = (run("git", ["status", "--porcelain"]).stdout ?? "").split("\n").filter(Boolean).length;
const fetched = run("git", ["fetch", "--quiet", "origin", "DAY2"], { timeout: 15_000 }).status === 0;
const counts = run("git", ["rev-list", "--left-right", "--count", "HEAD...@{u}"]).stdout?.trim().split(/\s+/);
const sync = counts?.length === 2 ? `${counts[0]} ahead, ${counts[1]} behind origin${fetched ? "" : " (no fetch: data from the last one)"}` : "no remote branch";
const gitDetail = `branch ${branch} · ${dirty ? `${dirty} changed files` : "clean tree"} · ${sync}`;
if (branch === "DAY2") ok("git", gitDetail);
else bad("git", `${gitDetail} (DAY2 required)`);

// 4. typecheck, test and docs:check (skipped with --fast).
if (values.fast) ok("typecheck · test · docs:check", "skipped (--fast)");
else
  for (const script of ["typecheck", "test", "docs:check"]) {
    const t0 = Date.now();
    const r = run("pnpm", [script]);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (r.status === 0) ok(`pnpm ${script}`, `${secs} s`);
    else {
      bad(`pnpm ${script}`, `exited with ${r.status}`);
      for (const l of tail(`${r.stdout}\n${r.stderr}`)) info(l);
    }
  }

// 5. API: /api/clock and /api/me with the key.
if (env.key) {
  try {
    const clock = await apiGet(env, "/api/clock");
    ok("API /api/clock", clockLine(clock));
    info(`limits: ${Object.entries(clock.limits ?? {}).map(([k, v]) => `${k}=${v}`).join(" · ") || "(none)"}`);
  } catch (e) {
    bad("API /api/clock", e instanceof Error ? e.message : String(e));
  }
  try {
    const me = await apiGet(env, "/api/me");
    ok("API /api/me", `${me.id} ${me.name ?? ""} · cash ${me.cash} · level ${me.level} · ${me.assets?.length ?? 0} assets · unlocked ${(me.unlocked ?? []).join(", ") || "-"}${me.frozen ? " · FROZEN" : ""}`);
  } catch (e) {
    bad("API /api/me", e instanceof Error ? e.message : String(e));
  }
} else bad("API", "not checked without BAZAAR_KEY");

// 6. Viewer port: free or already serving the viewer.
const port = await probeViewer(viewerPort);
if (port === "free") ok(`port ${viewerPort}`, "free: bazaar:up will start the viewer");
else if (port === "viewer") ok(`port ${viewerPort}`, "already serving the viewer: bazaar:up reuses it");
else bad(`port ${viewerPort}`, "taken by another process (bazaar:up will look for another port)");

// 7. `pnpm bazaar:play --dry-run --once` exits with 0; only the changes it causes in results/ are undone.
if (env.key) {
  const RESULTS = join(ROOT, "results");
  const LIVE = join(RESULTS, "bazaar-live");
  // The recorder, the news watcher and bazaar:up write at the same time: their files stay out of the snapshot and are never touched.
  const foreign = (rel) => rel.startsWith("logs/") || /(^|\/)(stream-[^/]*\.jsonl|feed-poll\.jsonl|news\.jsonl|news-summary\.json(\.tmp)?)$/.test(rel);
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
  // Undo: new files removed; changed ones restored from the backup (if they are in bazaar-live).
  const after = manifest();
  const reverted = [];
  const kept = [];
  for (const [rel, sig] of after) {
    if (before.get(rel) === sig) continue;
    const abs = join(RESULTS, rel);
    if (!before.has(rel)) {
      rmSync(abs, { force: true });
      reverted.push(`${rel} (new, deleted)`);
    } else if (existsSync(join(backup, rel))) {
      cpSync(join(backup, rel), abs);
      reverted.push(`${rel} (restored)`);
    } else kept.push(rel);
  }
  for (const rel of before.keys()) if (!after.has(rel) && existsSync(join(backup, rel))) {
    cpSync(join(backup, rel), join(RESULTS, rel));
    reverted.push(`${rel} (deleted, restored)`);
  }
  // Folders the check created that were left empty.
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
    bad("pnpm bazaar:play --dry-run --once", r.error ? r.error.message : `exited with ${r.status}`);
    for (const l of tail(`${r.stdout}\n${r.stderr}`)) info(l);
  }
  info(reverted.length ? `results/ undone: ${reverted.join(", ")}` : "results/: the check changed nothing");
  if (kept.length) info(`results/ changed outside bazaar-live (left alone): ${kept.join(", ")}`);
  if (gitNew.length) info(`git status of results/ still has new changes: ${gitNew.join(", ")}`);
} else bad("pnpm bazaar:play --dry-run --once", "not tested without BAZAAR_KEY");

if (failures) console.log(paint(31, `\n${failures} check(s) failed`));
else if (brokerMissing) console.log(paint(33, "\nReady except the shadow broker: pnpm bazaar:up starts the other three"));
else console.log(paint(32, "\nAll ready: pnpm bazaar:up"));
// 1: something fails; 3: only .env.broker is missing (bazaar:up starts without the shadow broker); 0: all good.
process.exit(failures ? 1 : brokerMissing ? 3 : 0);
