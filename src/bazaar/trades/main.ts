import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { DEFAULT_TRADE_PARAMS, type TradeParams } from "./trades.js";
import { TradesAgent, type TradesApi } from "./agent.js";

/**
 * `pnpm bazaar:trades --dry-run --once`: lee el tablón de El Rastro, nuestras ofertas, el feed y nuestros
 * valores, e imprime oportunidades (valor creado a nuestros valores), aceptación, listados y pujas; no
 * envía nada. En vivo hace falta quitar `--dry-run` Y pasar `--confirm` (solo con aprobación del usuario).
 */
export async function runTradesCli(
  argv: string[],
  log: (line: string) => void = console.log,
  api?: TradesApi,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "dry-run": { type: "boolean", default: false },
      once: { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      ticks: { type: "string" },
      top: { type: "string", default: "10" },
      "max-offers": { type: "string" },
      "max-spend": { type: "string" },
      "max-bids": { type: "string" },
      "min-margin": { type: "string" },
      expires: { type: "string" },
    },
  });
  const n = (flag: string, v: string | undefined, fallback: number): number => {
    if (v === undefined) return fallback;
    const x = Number(v);
    if (!Number.isFinite(x) || x < 0) throw new Error(`--${flag} must be a non-negative number`);
    return x;
  };
  const params: TradeParams = {
    ...DEFAULT_TRADE_PARAMS,
    maxOffers: Math.min(30, n("max-offers", values["max-offers"], DEFAULT_TRADE_PARAMS.maxOffers)),
    maxSpend: n("max-spend", values["max-spend"], DEFAULT_TRADE_PARAMS.maxSpend),
    maxBids: n("max-bids", values["max-bids"], DEFAULT_TRADE_PARAMS.maxBids),
    minMargin: n("min-margin", values["min-margin"], DEFAULT_TRADE_PARAMS.minMargin),
    expiresInTicks: n("expires", values.expires, DEFAULT_TRADE_PARAMS.expiresInTicks),
  };
  const dryRun = values["dry-run"];
  if (!dryRun && !values.confirm) {
    log("REFUSED: live trades post and accept offers; run with --dry-run, or without it AND with --confirm (only with the user's approval).");
    return 2;
  }
  let client = api;
  if (!client) {
    const env = loadBazaarEnv();
    if (!env.key) {
      log("Falta BAZAAR_KEY (ponla en .env o en el entorno).");
      return 2;
    }
    client = new BazaarClient({ url: env.url, key: env.key });
  }
  log(`trades: ${dryRun ? "DRY-RUN" : "LIVE"} · max-offers ${params.maxOffers} · max-spend ${params.maxSpend} P · max-bids ${params.maxBids} · min-margin ${params.minMargin} P · expires ${params.expiresInTicks} ticks`);
  const agent = new TradesAgent(client, params, { dryRun, log, top: n("top", values.top, 10) });
  const maxTicks = values.once ? 1 : values.ticks !== undefined ? n("ticks", values.ticks, 1) : Infinity;
  for (let i = 0; i < maxTicks; i++) {
    await agent.step();
    if (i + 1 >= maxTicks) break;
    const clock = await client.clock();
    await sleep(Math.max(1, clock.next_tick_in ?? clock.tick_seconds ?? 30) * 1000 + 300);
  }
  log(`trades: spent this run ${agent.spent} P`);
  return 0;
}

if (process.argv[1] && /trades\/main\.[cm]?[jt]s$/.test(process.argv[1])) {
  runTradesCli(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    },
  );
}
