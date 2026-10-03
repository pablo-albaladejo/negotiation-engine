import { parseArgs } from "node:util";
import { BrokerAgent, FileBrokerSink, brokerLogDir, type BrokerApi, type BrokerSink } from "./agent.js";
import { BrokerClient, loadBrokerEnv } from "./client.js";
import { ANNOUNCEMENT, DEFAULT_BENCH_PARAMS, MAX_PUBLIC_MATCHES_PER_TICK } from "./broker.js";
import { BenchShadow, defaultHeartbeatFile, defaultSessionsFile, saveHeartbeat } from "./shadow.js";

/**
 * `pnpm bazaar:broker --dry-run --once`: reads clock, book and markets (GET only) and prints what it would cross.
 * Live requires dropping `--dry-run` AND passing `--confirm`; then it runs endlessly (Ctrl-C to stop),
 * reading every `--poll-ms` and sending only when the book state changes.
 * In dry-run it is the Market Test shadow (`--shadow` = `--dry-run --no-announce`): during each bench it records in
 * `results/bazaar-live/bench-sessions.json` what it would match versus what auto crossed, and in any mode it leaves a
 * heartbeat in `results/bazaar-live/broker-heartbeat.json` (read by the coordinator to decide auto or board).
 * `--announce-only` posts the venue announcement once and exits (`--dry-run` only prints it; live needs `--confirm`).
 */
export async function runBrokerCli(
  argv: string[],
  log: (line: string) => void = console.log,
  api?: BrokerApi,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  sink?: BrokerSink,
): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "dry-run": { type: "boolean", default: false },
      once: { type: "boolean", default: false },
      shadow: { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      steps: { type: "string" },
      "poll-ms": { type: "string", default: "1000" },
      "hold-ticks": { type: "string" },
      "firm-shade": { type: "string" },
      "max-age-ticks": { type: "string" },
      "max-public": { type: "string" },
      "no-announce": { type: "boolean", default: false },
      "announce-only": { type: "boolean", default: false },
    },
  });
  const n = (flag: string, v: string | undefined, fallback: number): number => {
    if (v === undefined) return fallback;
    const x = Number(v);
    if (!Number.isFinite(x) || x < 0) throw new Error(`--${flag} must be a non-negative number`);
    return x;
  };
  const dryRun = values["dry-run"] || values.shadow;
  if (!dryRun && !values.confirm) {
    log("REFUSED: the live broker sends matches and an announcement; run with --dry-run, or without it AND with --confirm (only with the user's approval).");
    return 2;
  }
  if (values["announce-only"] && dryRun) {
    log(`broker: would announce (${ANNOUNCEMENT.length} chars): ${ANNOUNCEMENT}`);
    log("DRY-RUN: nothing sent.");
    return 0;
  }
  let client = api;
  if (!client) {
    const env = loadBrokerEnv();
    if (!env.key) {
      log("Missing BAZAAR_BROKER_KEY (set it in .env.broker or in the environment).");
      return 2;
    }
    client = new BrokerClient({ url: env.url, key: env.key });
  }
  if (values["announce-only"]) {
    // One venue announcement and exit: no book read, no matches.
    try {
      await client.announce(ANNOUNCEMENT);
      log("broker: announced the venue");
      return 0;
    } catch (e) {
      log(`broker: announce refused (${e instanceof Error ? e.message : String(e)})`);
      return 1;
    }
  }
  const bench = {
    holdTicks: n("hold-ticks", values["hold-ticks"], DEFAULT_BENCH_PARAMS.holdTicks),
    firmShade: n("firm-shade", values["firm-shade"], DEFAULT_BENCH_PARAMS.firmShade),
    maxAgeTicks: n("max-age-ticks", values["max-age-ticks"], DEFAULT_BENCH_PARAMS.maxAgeTicks),
  };
  const maxPublic = n("max-public", values["max-public"], MAX_PUBLIC_MATCHES_PER_TICK);
  const pollMs = Math.max(250, n("poll-ms", values["poll-ms"], 1000));
  const out = sink ?? new FileBrokerSink(brokerLogDir());
  log(
    `broker: ${dryRun ? "DRY-RUN" : "LIVE"} · hold ${bench.holdTicks} ticks · firm shade ${bench.firmShade} · max age ${bench.maxAgeTicks} ticks · max public ${maxPublic}/tick · poll ${pollMs} ms`,
  );
  // Shadow and heartbeat only with real I/O (no injected sink). The shadow never sends anything: dry-run only.
  const files = sink ? {} : { ...(dryRun ? { shadow: new BenchShadow(defaultSessionsFile(), bench) } : {}), heartbeat: (hb: Parameters<typeof saveHeartbeat>[1]) => saveHeartbeat(defaultHeartbeatFile(), hb) };
  const agent = new BrokerAgent(client, { dryRun, log, sink: out, bench, maxPublic, announce: !values["no-announce"] && !values.shadow, ...files });
  const maxSteps = values.once ? 1 : values.steps !== undefined ? n("steps", values.steps, 1) : Infinity;
  for (let i = 0; i < maxSteps; i++) {
    await agent.step();
    if (i + 1 >= maxSteps) break;
    await sleep(pollMs);
  }
  if (dryRun) log("DRY-RUN: nothing sent.");
  return 0;
}

if (process.argv[1] && /broker\/main\.[cm]?[jt]s$/.test(process.argv[1])) {
  runBrokerCli(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    },
  );
}
