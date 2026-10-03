import { parseArgs } from "node:util";
import { BazaarAgent } from "./agent.js";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { DEFAULT_NEGOTIATOR_PARAMS, type StepMode } from "./negotiation/negotiator.js";
import { parseOnly } from "./planning/plan.js";
import { FileScoreTrace, formatScoreSummary, ScoreTracker } from "../shared/score.js";
import { FileTrace, liveTraceDir } from "../shared/trace.js";
import { cashFloorOf, SERIOUS_DEFAULTS } from "./serious.js";
import { runSerious } from "./serious-run.js";
import { join } from "node:path";

/**
 * `pnpm bazaar [--dry-run] [--once] [--max-spend 120] [--max-deals N] [--max-threads N] [--dealer abuela] [--only buy:uncommon:SAL,...] [--safety 0.9]`:
 * one step per tick until Ctrl-C or until `--max-deals` is reached (or `--max-threads` conversations are exhausted).
 * `--dry-run` only reads (GET), prints the plan and logs what it would do; no POST.
 * `--serious`: continuous mode with all unlocked dealers and all value-creating deals (no --only),
 * safety 1,0, `--max-spend-hour 60 --max-spend 150`, cash never below 270 + `--cash-reserve` (10). With the market
 * already paid, `--cash-floor 20` sets the total floor (no added reserve unless `--cash-reserve` is explicit).
 */

function cap(raw: string | undefined, name: string): number {
  if (raw === undefined || raw === "") return Infinity;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${name} debe ser un entero ≥ 0`);
  return n;
}
async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      once: { type: "boolean", default: false },
      "max-spend": { type: "string" },
      "max-spend-hour": { type: "string" },
      serious: { type: "boolean", default: false },
      "cash-floor": { type: "string" },
      "cash-reserve": { type: "string" },
      lessons: { type: "string", default: join("docs", "bazaar", "lessons.json") },
      "max-deals": { type: "string" },
      "max-threads": { type: "string" },
      dealer: { type: "string", default: "abuela" },
      "buy-anchor-frac": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.buyAnchorFrac) },
      "sell-anchor-mult": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.sellAnchorMult) },
      "max-holds": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.maxHolds) },
      "sell-floor-anchor-mult": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.sellFloorAnchorMult) },
      "patience-budget": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.patienceBudget) },
      "max-step": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.maxStep) },
      "step-mode": { type: "string", default: DEFAULT_NEGOTIATOR_PARAMS.stepMode },
      "first-step-frac": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.firstStepFrac) },
      safety: { type: "string" },
      only: { type: "string" },
    },
  });
  const serious = values.serious;
  const maxSpend = Number(values["max-spend"] ?? (serious ? SERIOUS_DEFAULTS.maxSpendTotal : 120));
  if (!Number.isFinite(maxSpend) || maxSpend < 0) throw new Error("--max-spend must be a number ≥ 0");
  const maxSpendHour = Number(values["max-spend-hour"] ?? (serious ? SERIOUS_DEFAULTS.maxSpendPerHour : maxSpend));
  if (!Number.isFinite(maxSpendHour) || maxSpendHour < 0) throw new Error("--max-spend-hour must be a number ≥ 0");
  const { floor: cashFloor, venue: floorVenue, reserve: floorReserve } = cashFloorOf(values["cash-floor"], values["cash-reserve"]);
  if (!Number.isFinite(cashFloor) || cashFloor < 0) throw new Error("--cash-floor y --cash-reserve must be numbers ≥ 0");
  if (serious && values.only) throw new Error("--serious opens all value-creating deals: it does not accept --only");
  const buyAnchorFrac = Number(values["buy-anchor-frac"]);
  const sellAnchorMult = Number(values["sell-anchor-mult"]);
  const maxHolds = Number(values["max-holds"]);
  if (!Number.isFinite(buyAnchorFrac) || buyAnchorFrac <= 0) throw new Error("--buy-anchor-frac must be a number > 0");
  if (!Number.isFinite(sellAnchorMult) || sellAnchorMult <= 0) throw new Error("--sell-anchor-mult must be a number > 0");
  if (!Number.isInteger(maxHolds) || maxHolds < 0) throw new Error("--max-holds debe ser un entero ≥ 0");
  const sellFloorAnchorMult = Number(values["sell-floor-anchor-mult"]);
  const patienceBudget = Number(values["patience-budget"]);
  const maxStep = Number(values["max-step"]);
  const stepMode = values["step-mode"] as StepMode;
  const firstStepFrac = Number(values["first-step-frac"]);
  if (!Number.isFinite(firstStepFrac) || firstStepFrac < 0 || firstStepFrac > 0.5) throw new Error("--first-step-frac debe estar entre 0 y 0,5");
  if (!Number.isFinite(sellFloorAnchorMult) || sellFloorAnchorMult < 1) throw new Error("--sell-floor-anchor-mult must be a number ≥ 1");
  if (!Number.isInteger(patienceBudget) || patienceBudget < 1) throw new Error("--patience-budget debe ser un entero ≥ 1");
  if (!Number.isInteger(maxStep) || maxStep < 1) throw new Error("--max-step debe ser un entero ≥ 1");
  if (stepMode !== "adaptive" && stepMode !== "boulware") throw new Error("--step-mode debe ser adaptive o boulware");
  const safety = values.safety === undefined ? undefined : Number(values.safety);
  if (safety !== undefined && (!Number.isFinite(safety) || safety <= 0 || safety > 1)) throw new Error("--safety must be a number en (0, 1]");
  const only = values.only ? parseOnly(values.only) : undefined;
  const maxDeals = cap(values["max-deals"], "--max-deals");
  const maxThreads = cap(values["max-threads"], "--max-threads");
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("Missing BAZAAR_KEY (put it in .env or in the environment).");
    process.exit(2);
  }
  const client = new BazaarClient({ url: env.url, key: env.key });
  const negotiator = { buyAnchorFrac, sellAnchorMult, maxHolds, sellFloorAnchorMult, patienceBudget, maxStep, stepMode, firstStepFrac };
  if (serious) {
    const trace = new FileTrace(liveTraceDir(process.cwd()));
    const clock = await client.clock();
    console.log(
      `bazaar agent · SERIOUS · ${values["dry-run"] ? "DRY-RUN (no POST)" : "LIVE"} · all unlocked dealers · safety ${safety ?? SERIOUS_DEFAULTS.safety} · max-spend-hour ${maxSpendHour} P · max-spend ${maxSpend} P · cash floor ${cashFloor} P (${floorVenue} + reserve ${floorReserve}) · limits ${JSON.stringify(clock.limits ?? {})} · traces in ${trace.dir}`,
    );
    let stop = false;
    process.on("SIGINT", () => {
      stop = true;
      console.log("parando tras este paso…");
    });
    const res = await runSerious(client, {
      dryRun: values["dry-run"],
      once: values.once,
      maxSpendPerHour: maxSpendHour,
      maxSpendTotal: maxSpend,
      cashFloor,
      safety: safety ?? SERIOUS_DEFAULTS.safety,
      negotiator,
      trace,
      scoreTracker: new ScoreTracker(new FileScoreTrace(trace.dir)),
      lessonsFile: join(process.cwd(), values.lessons),
      log: (line) => console.log(line),
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      shouldStop: () => stop,
    });
    if (res.stoppedBy === "unknown-error") process.exit(3);
    return;
  }
  const dealerId = values.dealer;
  const dealers = await client.dealers().catch(() => ({ dealers: [] }));
  const info = dealers.dealers.find((d) => d.id === dealerId);
  const aliases = [...(info?.name ? [info.name] : []), "persona", "dealer"];
  const menu = await client.dealer(dealerId).catch((e: unknown) => {
    console.error(`no dealer profile (${e instanceof Error ? e.message : String(e)}): old planner`);
    return undefined;
  });
  const trace = new FileTrace(liveTraceDir(process.cwd()));
  const scoreTracker = new ScoreTracker(new FileScoreTrace(trace.dir));
  let lastRank: number | undefined;
  const agent = new BazaarAgent(client, {
    dealer: { id: dealerId, aliases },
    dryRun: values["dry-run"],
    maxSpendPerHour: maxSpendHour,
    maxSpendTotal: maxSpend,
    maxDeals,
    maxThreads,
    ...(menu ? { menu } : {}),
    negotiator,
    ...(safety !== undefined ? { safety } : {}),
    ...(only ? { only } : {}),
    trace,
    log: (line) => console.log(line),
  });
  const fmt = (n: number) => (Number.isFinite(n) ? String(n) : "∞");
  console.log(
    `bazaar agent · dealer ${dealerId} · ${values["dry-run"] ? "DRY-RUN (no POST)" : "LIVE"} · max-spend ${maxSpend} P (run and per hour) · max-deals ${fmt(maxDeals)} · max-threads ${fmt(maxThreads)}${safety !== undefined ? ` · safety ${safety}` : ""}${only ? ` · only ${values.only}` : ""} · traces in ${trace.dir}`,
  );
  if (values["dry-run"]) for (const line of await agent.plan()) console.log(line);

  let stop = false;
  process.on("SIGINT", () => {
    stop = true;
    console.log("parando tras este paso…");
  });
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  while (!stop) {
    let wait = 5_000;
    try {
      const clock = await client.clock();
      if (clock.paused && !values["dry-run"]) {
        console.log(`[tick ${clock.tick}] reloj en pausa`);
        wait = Math.min(60_000, Math.max(5_000, (clock.next_tick_in ?? 30) * 1000));
      } else {
        if (clock.paused) console.log(`[tick ${clock.tick}] clock paused (dry-run: observing anyway)`);
        const records = await agent.step(clock);
        // The figure we maximize: one more GET /api/me per tick (reusing the client/its rate
        // limiter), apart from the one the agent already makes to decide. The tick's own `records` serve as the cause.
        const me = await client.me().catch(() => undefined);
        if (me) {
          const snapshot = scoreTracker.record(me, clock.tick, records);
          if (snapshot) {
            console.log(formatScoreSummary(snapshot, lastRank));
            lastRank = snapshot.rank;
          }
        }
        const after = await client.clock();
        wait = after.tick === clock.tick ? Math.max(200, (after.next_tick_in ?? 1) * 1000 + 300) : 200;
      }
    } catch (e) {
      console.error(`loop error: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (values.once) break;
    if (agent.done()) {
      const s = agent.runStats();
      console.log(`limits reached: ${s.deals} deal(s), ${s.threads} conversation(s), ${s.spent} P spent; end of run`);
      break;
    }
    await sleep(wait);
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
