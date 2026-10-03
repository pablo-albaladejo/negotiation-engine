import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { DEFAULT_DUEL_PARAMS, type DuelParams } from "./duels.js";
import { DuelsAgent, defaultDuelsStateFile, formatDuelEntry, formatNextDuels, ticksLeft } from "./agent.js";
import { duelsApi, type DuelsApi } from "./schemas.js";
import { loadBazaarEnv } from "../shared/env.js";

/**
 * `pnpm bazaar:duels [--dry-run] [--once] [--max-rounds 4] [--beta 2] [--anchor-margin 0.5] [--floor-share 0.3] [--assumed-days-weight 0] [--state-file path]`:
 * one step per tick until Ctrl-C. `--dry-run` only does GETs (clock, duels, schedule) and prints what it would do; no POSTs.
 * Live, it persists per-duel memory in `--state-file` (default `results/bazaar-live/<date>/duels-state.json`,
 * atomic rename) so a restart neither reopens nor repeats offers. Never prints the key.
 * `--restart-check [--restart-ticks 5]`: GET only; exits 1 if a live duel ends within that many ticks (2402 lost ~11 P
 * while the coordinator was down for 5 ticks at its deadline), 0 if restarting the coordinator now is safe for duels.
 */

function num(raw: string, name: string, min: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min) throw new Error(`${name} must be a number ≥ ${min}`);
  return n;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      once: { type: "boolean", default: false },
      "max-rounds": { type: "string", default: String(DEFAULT_DUEL_PARAMS.maxRounds) },
      beta: { type: "string", default: String(DEFAULT_DUEL_PARAMS.beta) },
      "anchor-margin": { type: "string", default: String(DEFAULT_DUEL_PARAMS.anchorMargin) },
      "floor-share": { type: "string", default: String(DEFAULT_DUEL_PARAMS.floorShare) },
      "assumed-days-weight": { type: "string", default: String(DEFAULT_DUEL_PARAMS.assumedDaysWeight) },
      "state-file": { type: "string" },
      "restart-check": { type: "boolean", default: false },
      "restart-ticks": { type: "string", default: "5" },
    },
  });
  const params: Partial<DuelParams> = {
    maxRounds: num(values["max-rounds"], "--max-rounds", 1),
    beta: num(values.beta, "--beta", 0.1),
    anchorMargin: num(values["anchor-margin"], "--anchor-margin", 0),
    floorShare: num(values["floor-share"], "--floor-share", 0),
    assumedDaysWeight: Number(values["assumed-days-weight"]),
  };
  if (!Number.isFinite(params.assumedDaysWeight)) throw new Error("--assumed-days-weight must be a number");
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("Missing BAZAAR_KEY (set it in .env or in the environment).");
    process.exit(2);
  }
  const dryRun = values["dry-run"];
  const api = duelsApi(new BazaarClient({ url: env.url, key: env.key }));
  if (values["restart-check"]) process.exit(await restartCheck(api, num(values["restart-ticks"], "--restart-ticks", 0)));
  const stateFile = dryRun ? undefined : (values["state-file"] ?? defaultDuelsStateFile(process.cwd()));
  const agent = new DuelsAgent(api, { dryRun, params, ...(stateFile ? { stateFile } : {}) });
  console.log(`bazaar:duels · ${dryRun ? "DRY RUN (GET only, no POST)" : "LIVE"} · params ${JSON.stringify({ ...DEFAULT_DUEL_PARAMS, ...params })}${stateFile ? ` · state ${stateFile}` : ""}`);
  for (;;) {
    const report = await agent.step();
    const clock = await api.clock();
    if (report.entries.length === 0) {
      console.log(`tick ${report.tick} · ${formatNextDuels(await api.schedule(), clock)}`);
    } else {
      console.log(`tick ${report.tick} · ${report.entries.length} live duel(s)`);
      for (const e of report.entries) console.log(formatDuelEntry(e));
    }
    if (values.once) break;
    await sleep(Math.max(1, clock.next_tick_in ?? 5) * 1000 + 300);
  }
}

/** Live duels close to their deadline: a coordinator restart now could miss their last ticks. */
async function restartCheck(api: DuelsApi, within: number): Promise<number> {
  const [clock, { duels }] = await Promise.all([api.clock(), api.duels()]);
  const live = duels.map((d) => ({ id: d.id, left: ticksLeft(d.deadline, clock, Date.now()) }));
  const close = live.filter((d) => d.left !== undefined && d.left <= within);
  const list = live.map((d) => `${d.id} (${d.left ?? "?"} ticks left)`).join(", ") || "none";
  if (close.length > 0) {
    console.log(`NOT SAFE to restart: duel(s) ${close.map((d) => d.id).join(", ")} end within ${within} ticks · live: ${list}`);
    return 1;
  }
  console.log(`safe to restart for duels · tick ${clock.tick} · live: ${list}`);
  return 0;
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
