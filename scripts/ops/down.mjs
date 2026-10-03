#!/usr/bin/env node
// `pnpm bazaar:down`: para lo que arrancó `pnpm bazaar:up` (también con --detach). Lee los pids de
// results/logs/up-status.json, manda SIGTERM a up (que para a sus hijos) y, si en 20 s no ha parado,
// SIGKILL a los grupos de los hijos y a up. Solo toca pids cuyo comando es el esperado.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { alive, STATUS_FILE } from "./lib.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!existsSync(STATUS_FILE)) {
  console.log("No hay results/logs/up-status.json: bazaar:up no está en marcha.");
  process.exit(0);
}
const status = JSON.parse(readFileSync(STATUS_FILE, "utf8"));
const command = (pid) => spawnSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).stdout.trim();
const upPid = status.pid;
if (!upPid || !alive(upPid) || !command(upPid).includes("scripts/ops/up.mjs")) {
  console.log(`bazaar:up (pid ${upPid ?? "?"}) no está en marcha${status.stopped ? ` (parado ${status.stopped})` : ""}.`);
  process.exit(0);
}
console.log(`Paro bazaar:up (pid ${upPid}, ${status.mode})…`);
process.kill(upPid, "SIGTERM");
for (let i = 0; i < 40 && alive(upPid); i++) await sleep(500);
if (alive(upPid)) {
  console.log("No ha parado en 20 s: SIGKILL a los hijos y a up.");
  for (const c of Object.values(status.children ?? {})) {
    if (!c.pid) continue;
    try {
      process.kill(-c.pid, "SIGKILL");
    } catch {
      // ya no existe
    }
  }
  process.kill(upPid, "SIGKILL");
}
console.log("Parado.");
