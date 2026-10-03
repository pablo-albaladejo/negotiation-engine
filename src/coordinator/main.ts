import { parseArgs } from "node:util";
import { BazaarClient, BazaarError } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { FileTrace, liveTraceDir } from "../shared/trace.js";
import { clockGate } from "../dealers/serious.js";
import { defaultDuelsStateFile } from "../duels/agent.js";
import { buildGameState, formatGameState } from "../state/game-state.js";
import { defaultConversationsFile, formatConversation, loadConversationMemos, saveConversationMemos } from "../state/conversation.js";
import { arbitrate, budgetFrom, formatBudget, type Intent } from "./coordinator.js";
import { DealersRoute, DuelsRoute, TradesRoute, type RouteProposal } from "./routes.js";

/**
 * `pnpm bazaar:play [--dry-run] [--once] [--confirm]`: el coordinador. Cada tick construye el `GameState` (solo GET),
 * lee el presupuesto de `clock.limits`, pide a cada ruta (duelos, dealers, El Rastro) sus intenciones sin enviarlas,
 * arbitra (una aceptación por tick según `ACCEPT_PRIORITY`, mensajes por conversación, hilos y listados) e imprime
 * qué sale y qué no, y por qué. Por defecto es seguro: en vivo solo sin `--dry-run` Y con `--confirm`
 * (solo con aprobación del usuario); sin `--confirm` corre como dry-run. Nunca imprime la clave.
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function num(raw: string, name: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${name} debe ser un número ≥ 0`);
  return n;
}

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      once: { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      "max-spend-hour": { type: "string", default: "60" },
      "max-spend": { type: "string", default: "150" },
      "cash-floor": { type: "string", default: "20" },
      "page-targets": { type: "string", default: "SAL-09" },
      "leaderboard-every": { type: "string", default: "5" },
    },
  });
  const live = !values["dry-run"] && values.confirm;
  const dryRun = !live;
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("Falta BAZAAR_KEY (ponla en .env o en el entorno).");
    process.exit(2);
  }
  const pageTargets = values["page-targets"].split(",").map((s) => s.trim()).filter(Boolean);
  const leaderboardEvery = num(values["leaderboard-every"], "--leaderboard-every");
  const client = new BazaarClient({ url: env.url, key: env.key });
  const root = process.cwd();
  const duels = new DuelsRoute(client, dryRun, live ? defaultDuelsStateFile(root) : undefined);
  const dealers = new DealersRoute(client, {
    dryRun,
    maxSpendPerHour: num(values["max-spend-hour"], "--max-spend-hour"),
    maxSpendTotal: num(values["max-spend"], "--max-spend"),
    cashFloor: num(values["cash-floor"], "--cash-floor"),
    pageTargets,
    ...(live ? { trace: new FileTrace(liveTraceDir(root)) } : {}),
  });
  const trades = new TradesRoute(client, dryRun);
  const convFile = defaultConversationsFile(root);
  console.log(
    `bazaar:play · ${live ? "LIVE" : `DRY RUN (GET only, no POST)${!values["dry-run"] && !values.confirm ? " · no --confirm: running as dry-run" : ""}`} · page targets ${pageTargets.join(", ")} · cash floor ${values["cash-floor"]} P`,
  );

  let lastTick = -1;
  let lastLeaderboard = -Infinity;
  for (;;) {
    const memos = loadConversationMemos(convFile);
    const clock = await client.clock();
    if (live) {
      const gate = clockGate(clock);
      if (!gate.run) {
        console.log(`[tick ${clock.tick}] waiting (${gate.reason}) ${Math.round(gate.waitMs / 1000)} s`);
        await sleep(gate.waitMs);
        continue;
      }
      if (clock.tick === lastTick) {
        await sleep(Math.max(200, (clock.next_tick_in ?? 1) * 1000 + 300));
        continue;
      }
    }
    lastTick = clock.tick;
    const withLb = clock.tick - lastLeaderboard >= leaderboardEvery;
    const state = await buildGameState(client, { leaderboard: withLb, pageTargets, memos });
    if (withLb) lastLeaderboard = state.tick;
    const budget = budgetFrom(state);

    console.log(`\n== tick ${state.tick} · GameState ==`);
    for (const l of formatGameState(state)) console.log(`  ${l}`);
    if (dryRun && (state.clock.paused || (state.clock.doors && state.clock.doors !== "open"))) console.log("  (clock paused or doors closed: live mode would wait; dry-run shows what it would propose)");
    console.log("== budget (clock.limits) ==");
    for (const l of formatBudget(budget)) console.log(`  ${l}`);

    const proposals: { route: string; p: RouteProposal }[] = [];
    const me = await client.me().catch(() => undefined);
    for (const [route, run] of [
      ["duels", () => duels.propose()],
      ["dealers", () => dealers.propose(clock, state)],
      ["trades", () => trades.propose(state, me, pageTargets)],
    ] as const) {
      try {
        proposals.push({ route, p: await run() });
      } catch (e) {
        console.log(`  route ${route} failed: ${e instanceof BazaarError ? e.code : e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
      }
    }
    const intents: Intent[] = proposals.flatMap((x) => x.p.intents);
    console.log("== proposed intents ==");
    for (const { route, p } of proposals) {
      for (const n of p.notes) console.log(`  [${route}] ${n}`);
      for (const i of p.intents) console.log(`  [${route}] ${i.kind}: ${i.summary}`);
    }
    if (!intents.length) console.log("  (none)");

    const verdicts = arbitrate(intents, budget);
    const selected = new Set(verdicts.filter((v) => v.selected).map((v) => v.intent.id));
    console.log("== arbitration ==");
    for (const v of verdicts) console.log(`  ${v.selected ? "SELECTED" : "DROPPED "} ${v.intent.id} · ${v.reason}`);
    if (!verdicts.length) console.log("  (nothing to arbitrate)");

    // Conversaciones: turno concedido por el presupuesto, estrategia y última decisión de cada ruta.
    const acceptedConv = new Set(verdicts.filter((v) => v.selected && v.intent.kind === "accept").map((v) => v.intent.conversation));
    const acceptsLeft = budget.accepts - acceptedConv.size;
    for (const c of state.conversations) {
      if (c.phase === "done") continue;
      c.turn = {
        canMessage: c.kind !== "rastro" && budget.messagesPerConversation > 0 && !acceptedConv.has(c.id),
        canAccept: acceptedConv.has(c.id) || (c.kind !== "rastro" && acceptsLeft > 0),
      };
      for (const { p } of proposals) {
        const strategy = p.strategies.get(c.id);
        if (strategy) c.strategy = strategy;
        const decision = p.decisions.get(c.id);
        if (decision) c.strategy = { ...c.strategy, lastDecision: decision };
      }
    }
    const active = state.conversations.filter((c) => c.phase !== "done");
    console.log(`== conversations (${active.length} active, ${state.conversations.length - active.length} done) ==`);
    for (const c of active) console.log(`  ${formatConversation(c)}`);

    console.log(`== ${live ? "execution" : "dry-run (nothing sent)"} ==`);
    const lines = await duels.execute(selected);
    for (const l of lines) console.log(`  ${l}`);
    if (live) {
      for (const l of await dealers.execute(clock, selected)) console.log(`  ${l}`);
      for (const l of await trades.execute(selected)) console.log(`  ${l}`);
      saveConversationMemos(convFile, state.conversations);
    }
    if (values.once) break;
    const after = await client.clock().catch(() => undefined);
    await sleep(Math.max(1, after?.next_tick_in ?? 5) * 1000 + 300);
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
