import { parseArgs } from "node:util";
import { BazaarAgent } from "./agent.js";
import { BazaarClient } from "./client.js";
import { loadBazaarEnv } from "./env.js";
import { DEFAULT_NEGOTIATOR_PARAMS, type StepMode } from "./negotiator.js";
import { parseOnly } from "./plan.js";
import { FileScoreTrace, formatScoreSummary, ScoreTracker } from "./score.js";
import { FileTrace, liveTraceDir } from "./trace.js";
import { cashFloorOf, SERIOUS_DEFAULTS } from "./serious.js";
import { runSerious } from "./serious-run.js";
import { join } from "node:path";

/**
 * `pnpm bazaar [--dry-run] [--once] [--max-spend 120] [--max-deals N] [--max-threads N] [--dealer abuela] [--only buy:uncommon:SAL,...] [--safety 0.9]`:
 * un paso por tick hasta Ctrl-C o hasta llegar a `--max-deals` (o agotar `--max-threads` conversaciones).
 * `--dry-run` solo lee (GET), imprime el plan y registra lo que haría; ningún POST.
 * `--serious`: modo continuo con todos los dealers desbloqueados y todos los tratos que crean valor (sin --only),
 * safety 1,0, `--max-spend-hour 60 --max-spend 150`, caja nunca por debajo de 270 + `--cash-reserve` (10). Con el mercado
 * ya pagado, `--cash-floor 20` fija el suelo total (sin reserva añadida salvo `--cash-reserve` explícito).
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
      safety: { type: "string" },
      only: { type: "string" },
    },
  });
  const serious = values.serious;
  const maxSpend = Number(values["max-spend"] ?? (serious ? SERIOUS_DEFAULTS.maxSpendTotal : 120));
  if (!Number.isFinite(maxSpend) || maxSpend < 0) throw new Error("--max-spend debe ser un número ≥ 0");
  const maxSpendHour = Number(values["max-spend-hour"] ?? (serious ? SERIOUS_DEFAULTS.maxSpendPerHour : maxSpend));
  if (!Number.isFinite(maxSpendHour) || maxSpendHour < 0) throw new Error("--max-spend-hour debe ser un número ≥ 0");
  const { floor: cashFloor, venue: floorVenue, reserve: floorReserve } = cashFloorOf(values["cash-floor"], values["cash-reserve"]);
  if (!Number.isFinite(cashFloor) || cashFloor < 0) throw new Error("--cash-floor y --cash-reserve deben ser números ≥ 0");
  if (serious && values.only) throw new Error("--serious abre todos los tratos que crean valor: no admite --only");
  const buyAnchorFrac = Number(values["buy-anchor-frac"]);
  const sellAnchorMult = Number(values["sell-anchor-mult"]);
  const maxHolds = Number(values["max-holds"]);
  if (!Number.isFinite(buyAnchorFrac) || buyAnchorFrac <= 0) throw new Error("--buy-anchor-frac debe ser un número > 0");
  if (!Number.isFinite(sellAnchorMult) || sellAnchorMult <= 0) throw new Error("--sell-anchor-mult debe ser un número > 0");
  if (!Number.isInteger(maxHolds) || maxHolds < 0) throw new Error("--max-holds debe ser un entero ≥ 0");
  const sellFloorAnchorMult = Number(values["sell-floor-anchor-mult"]);
  const patienceBudget = Number(values["patience-budget"]);
  const maxStep = Number(values["max-step"]);
  const stepMode = values["step-mode"] as StepMode;
  if (!Number.isFinite(sellFloorAnchorMult) || sellFloorAnchorMult < 1) throw new Error("--sell-floor-anchor-mult debe ser un número ≥ 1");
  if (!Number.isInteger(patienceBudget) || patienceBudget < 1) throw new Error("--patience-budget debe ser un entero ≥ 1");
  if (!Number.isInteger(maxStep) || maxStep < 1) throw new Error("--max-step debe ser un entero ≥ 1");
  if (stepMode !== "adaptive" && stepMode !== "boulware") throw new Error("--step-mode debe ser adaptive o boulware");
  const safety = values.safety === undefined ? undefined : Number(values.safety);
  if (safety !== undefined && (!Number.isFinite(safety) || safety <= 0 || safety > 1)) throw new Error("--safety debe ser un número en (0, 1]");
  const only = values.only ? parseOnly(values.only) : undefined;
  const maxDeals = cap(values["max-deals"], "--max-deals");
  const maxThreads = cap(values["max-threads"], "--max-threads");
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("Falta BAZAAR_KEY (ponla en .env o en el entorno).");
    process.exit(2);
  }
  const client = new BazaarClient({ url: env.url, key: env.key });
  const negotiator = { buyAnchorFrac, sellAnchorMult, maxHolds, sellFloorAnchorMult, patienceBudget, maxStep, stepMode };
  if (serious) {
    const trace = new FileTrace(liveTraceDir(process.cwd()));
    const clock = await client.clock();
    console.log(
      `bazaar agent · SERIOUS · ${values["dry-run"] ? "DRY-RUN (sin POST)" : "LIVE"} · all unlocked dealers · safety ${safety ?? SERIOUS_DEFAULTS.safety} · max-spend-hour ${maxSpendHour} P · max-spend ${maxSpend} P · cash floor ${cashFloor} P (${floorVenue} + reserve ${floorReserve}) · limits ${JSON.stringify(clock.limits ?? {})} · trazas en ${trace.dir}`,
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
    console.error(`sin ficha del dealer (${e instanceof Error ? e.message : String(e)}): planificador antiguo`);
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
    `bazaar agent · dealer ${dealerId} · ${values["dry-run"] ? "DRY-RUN (sin POST)" : "LIVE"} · max-spend ${maxSpend} P (run and per hour) · max-deals ${fmt(maxDeals)} · max-threads ${fmt(maxThreads)}${safety !== undefined ? ` · safety ${safety}` : ""}${only ? ` · only ${values.only}` : ""} · trazas en ${trace.dir}`,
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
        if (clock.paused) console.log(`[tick ${clock.tick}] reloj en pausa (dry-run: se observa igualmente)`);
        const records = await agent.step(clock);
        // Cifra que maximizamos: un GET /api/me más por tick (reutilizando el cliente/su limitador de
        // tasa), aparte del que ya hace el agente para decidir. `records` del propio tick sirve de causa.
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
      console.error(`error en el bucle: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (values.once) break;
    if (agent.done()) {
      const s = agent.runStats();
      console.log(`topes alcanzados: ${s.deals} trato(s), ${s.threads} conversación(es), ${s.spent} P gastados; fin de la ejecución`);
      break;
    }
    await sleep(wait);
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
