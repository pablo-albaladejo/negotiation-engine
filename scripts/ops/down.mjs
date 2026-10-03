#!/usr/bin/env node
// `pnpm bazaar:down`: stops what `pnpm bazaar:up` started (also with --detach). Reads the pids from
// results/logs/up-status.json, sends SIGTERM to up (which stops its children) and, if it has not stopped in 20 s,
// SIGKILL to the children's groups and to up. Only touches pids whose command is the expected one.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { alive, STATUS_FILE } from "./lib.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!existsSync(STATUS_FILE)) {
  console.log("No results/logs/up-status.json: bazaar:up is not running.");
  process.exit(0);
}
const status = JSON.parse(readFileSync(STATUS_FILE, "utf8"));
const command = (pid) => spawnSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).stdout.trim();
const upPid = status.pid;
if (!upPid || !alive(upPid) || !command(upPid).includes("scripts/ops/up.mjs")) {
  console.log(`bazaar:up (pid ${upPid ?? "?"}) is not running${status.stopped ? ` (stopped ${status.stopped})` : ""}.`);
  process.exit(0);
}
console.log(`Stopping bazaar:up (pid ${upPid}, ${status.mode})…`);
process.kill(upPid, "SIGTERM");
for (let i = 0; i < 40 && alive(upPid); i++) await sleep(500);
if (alive(upPid)) {
  console.log("Did not stop within 20 s: SIGKILL to the children and to up.");
  for (const c of Object.values(status.children ?? {})) {
    if (!c.pid) continue;
    try {
      process.kill(-c.pid, "SIGKILL");
    } catch {
      // no longer exists
    }
  }
  process.kill(upPid, "SIGKILL");
}
console.log("Stopped.");
