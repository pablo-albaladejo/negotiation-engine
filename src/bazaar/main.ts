import { parseArgs } from "node:util";
import { BazaarAgent } from "./agent.js";
import { BazaarClient } from "./client.js";
import { loadBazaarEnv } from "./env.js";
import { DEFAULT_NEGOTIATOR_PARAMS } from "./negotiator.js";
import { FileScoreTrace, formatScoreSummary, ScoreTracker } from "./score.js";
import { FileTrace, liveTraceDir } from "./trace.js";

/**
 * `pnpm bazaar [--dry-run] [--once] [--max-spend 120] [--max-deals N] [--max-threads N] [--dealer abuela]`:
 * un paso por tick hasta Ctrl-C o hasta llegar a `--max-deals` (o agotar `--max-threads` conversaciones).
 * `--dry-run` solo lee (GET), imprime el plan y registra lo que haría; ningún POST.
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
      "max-spend": { type: "string", default: "120" },
      "max-deals": { type: "string" },
      "max-threads": { type: "string" },
      dealer: { type: "string", default: "abuela" },
      "buy-anchor-frac": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.buyAnchorFrac) },
      "sell-anchor-mult": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.sellAnchorMult) },
      "max-holds": { type: "string", default: String(DEFAULT_NEGOTIATOR_PARAMS.maxHolds) },
    },
  });
  const maxSpend = Number(values["max-spend"]);
  if (!Number.isFinite(maxSpend) || maxSpend < 0) throw new Error("--max-spend debe ser un número ≥ 0");
  const buyAnchorFrac = Number(values["buy-anchor-frac"]);
  const sellAnchorMult = Number(values["sell-anchor-mult"]);
  const maxHolds = Number(values["max-holds"]);
  if (!Number.isFinite(buyAnchorFrac) || buyAnchorFrac <= 0) throw new Error("--buy-anchor-frac debe ser un número > 0");
  if (!Number.isFinite(sellAnchorMult) || sellAnchorMult <= 0) throw new Error("--sell-anchor-mult debe ser un número > 0");
  if (!Number.isInteger(maxHolds) || maxHolds < 0) throw new Error("--max-holds debe ser un entero ≥ 0");
  const maxDeals = cap(values["max-deals"], "--max-deals");
  const maxThreads = cap(values["max-threads"], "--max-threads");
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("Falta BAZAAR_KEY (ponla en .env o en el entorno).");
    process.exit(2);
  }
  const client = new BazaarClient({ url: env.url, key: env.key });
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
    maxSpendPerHour: maxSpend,
    maxSpendTotal: maxSpend,
    maxDeals,
    maxThreads,
    ...(menu ? { menu } : {}),
    negotiator: { buyAnchorFrac, sellAnchorMult, maxHolds },
    trace,
    log: (line) => console.log(line),
  });
  const fmt = (n: number) => (Number.isFinite(n) ? String(n) : "∞");
  console.log(
    `bazaar agent · dealer ${dealerId} · ${values["dry-run"] ? "DRY-RUN (sin POST)" : "LIVE"} · max-spend ${maxSpend} P (run and per hour) · max-deals ${fmt(maxDeals)} · max-threads ${fmt(maxThreads)} · trazas en ${trace.dir}`,
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
