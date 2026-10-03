import { parseArgs } from "node:util";
import { BrokerAgent, FileBrokerSink, brokerLogDir, type BrokerApi, type BrokerSink } from "./agent.js";
import { BrokerClient, loadBrokerEnv } from "./client.js";
import { DEFAULT_BENCH_PARAMS, MAX_PUBLIC_MATCHES_PER_TICK } from "./broker.js";
import { BenchShadow, defaultHeartbeatFile, defaultSessionsFile, saveHeartbeat } from "./shadow.js";

/**
 * `pnpm bazaar:broker --dry-run --once`: lee reloj, libro y mercados (solo GET) e imprime qué cruzaría.
 * En vivo hace falta quitar `--dry-run` Y pasar `--confirm`; entonces corre sin fin (Ctrl-C para parar),
 * leyendo cada `--poll-ms` y enviando solo cuando cambia el estado del libro.
 * En dry-run es la sombra del Market Test (`--shadow` = `--dry-run --no-announce`): durante cada bench apunta en
 * `results/bazaar-live/bench-sessions.json` lo que casaría frente a lo que cruzó auto, y en cualquier modo deja un
 * latido en `results/bazaar-live/broker-heartbeat.json` (lo lee el coordinador para decidir auto o board).
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
  let client = api;
  if (!client) {
    const env = loadBrokerEnv();
    if (!env.key) {
      log("Falta BAZAAR_BROKER_KEY (ponla en .env.broker o en el entorno).");
      return 2;
    }
    client = new BrokerClient({ url: env.url, key: env.key });
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
  // Sombra y latido solo con E/S real (sin sink inyectado). La sombra nunca envía nada: solo en dry-run.
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
