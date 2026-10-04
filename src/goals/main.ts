import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { extractScoreFields } from "../shared/score.js";
import { AUTO_CHANGE, isRoundReset, WINDOW_EVENT, windowEndTick, type ClockView, type ScheduleEvent, refreshGaps, refreshGoals, type GoalsFile, type Metrics, type StrategiesFile } from "./goals.js";

/**
 * `pnpm bazaar:goals`: keeps results/state/goals.json and strategies.json alive. Read-only: one GET /api/me per
 * --interval seconds (30), never a POST. It refreshes the measured fields and the automatic gaps; the goals
 * session edits the rest by hand in the same files.
 *   --once   one refresh and exit
 *   --dir    state folder (results/state)
 */

const { values: args } = parseArgs({
  options: {
    once: { type: "boolean", default: false },
    interval: { type: "string", default: "30" },
    dir: { type: "string", default: join(process.cwd(), "results", "state") },
  },
});

const goalsFile = join(args.dir, "goals.json");
const strategiesFile = join(args.dir, "strategies.json");
const dayStartFile = join(args.dir, "goals-day-start.json");

interface DayStart {
  date: string;
  /** `/api/clock` round when the snapshot was taken; a new round resets the score parts. */
  round?: number | undefined;
  tick: number;
  metrics: Metrics;
}

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, "utf8")) as T;

/** Atomic write: a .tmp next to the target, then rename. */
function writeJson(file: string, data: unknown): void {
  writeFileSync(`${file}.tmp`, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(`${file}.tmp`, file);
}

const env = loadBazaarEnv();
if (!env.key) {
  console.error("BAZAAR_KEY missing (.env)");
  process.exit(2);
}
const client = new BazaarClient({ url: env.url, key: env.key, ratePerSec: 1, burst: 1, retries: 1 });

let prev: Metrics | null = null;

/**
 * Current round and the window end tick per goal from /api/clock and /api/schedule; each is undefined (round
 * detection falls back to `deals`, hand windows stay) if its GET fails.
 */
async function clockInfo(): Promise<{ round?: number | undefined; until?: Record<string, number | null> | undefined }> {
  try {
    const clock = (await client.raw("GET", "/api/clock")) as ClockView & { round?: unknown };
    const round = typeof clock?.round === "number" ? clock.round : undefined;
    const schedule = (await client.raw("GET", "/api/schedule").catch(() => null)) as { upcoming?: ScheduleEvent[] } | null;
    if (typeof clock?.tick !== "number" || typeof clock.t_hours !== "number" || !Array.isArray(schedule?.upcoming)) return { round };
    const upcoming = [...schedule.upcoming].sort((a, b) => a.at_hours - b.at_hours);
    return { round, until: Object.fromEntries(Object.entries(WINDOW_EVENT).map(([id, match]) => [id, windowEndTick(clock, upcoming, match)])) };
  } catch {
    return {};
  }
}

async function refresh(): Promise<void> {
  if (!existsSync(goalsFile) || !existsSync(strategiesFile)) throw new Error(`missing ${goalsFile} or ${strategiesFile}`);
  const me = await client.me();
  const score = extractScoreFields(me);
  if (!score) throw new Error("/api/me has no score");
  const numeric = Object.entries(score).filter((e): e is [string, number] => typeof e[1] === "number");
  const metrics: Metrics = { ...Object.fromEntries(numeric), cash: me.cash };
  const rawTick = (me as Record<string, unknown>).tick;
  const tick = typeof rawTick === "number" ? rawTick : 0;
  const date = new Date().toLocaleDateString("sv-SE");

  const { round, until } = await clockInfo();
  let dayStart = existsSync(dayStartFile) ? readJson<DayStart>(dayStartFile) : null;
  const newRound = round !== undefined ? dayStart?.round !== round : isRoundReset(prev, metrics);
  if (!dayStart || dayStart.date !== date || newRound) {
    dayStart = { date, round, tick, metrics };
    writeJson(dayStartFile, dayStart);
    console.log(`day start set at t${tick}${round !== undefined ? ` (round ${round})` : ""}`);
  }

  const goals = refreshGoals(readJson<GoalsFile>(goalsFile), readJson<StrategiesFile>(strategiesFile), {
    tick,
    at: new Date().toISOString(),
    metrics,
    prev,
    dayStart: dayStart.metrics,
    until,
  });
  writeJson(goalsFile, goals);
  // Re-read just before writing: the goals session edits this file by hand.
  const strategies = readJson<StrategiesFile>(strategiesFile);
  const gaps = refreshGaps(strategies, goals);
  if (JSON.stringify(gaps) !== JSON.stringify(strategies.gaps)) writeJson(strategiesFile, { ...strategies, gaps, updated_at: goals.updated_at });
  prev = metrics;
  const moved = goals.changes.filter((c) => c.startsWith(AUTO_CHANGE));
  console.log(`t${tick} goals refreshed${moved.length ? ` · ${moved.join(" · ")}` : ""}`);
}

for (;;) {
  try {
    await refresh();
  } catch (err) {
    console.error(`refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    if (args.once) process.exit(1);
  }
  if (args.once) break;
  await new Promise((r) => setTimeout(r, Number(args.interval) * 1000));
}
