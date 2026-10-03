import { defaultPosteriorFile, loadPosterior, savePosterior } from "../dealers/history/persona-fit.js";
import { parseArgs } from "node:util";
import { BazaarClient, BazaarError } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { FileTrace, liveTraceDir } from "../shared/trace.js";
import { clockGate } from "../dealers/serious.js";
import { defaultDuelsStateFile } from "../duels/agent.js";
import { buildGameState, formatGameState } from "../state/game-state.js";
import { defaultConversationsFile, formatConversation, loadConversationMemos, saveConversationMemos } from "../state/conversation.js";
import { arbitrate, budgetFrom, formatBudget, type Intent } from "./coordinator.js";
import { arbitrageLines, personaArbitrage } from "./arbitrage.js";
import { DealersRoute, DuelsRoute, EggsRoute, FlagsRoute, TradesRoute, type RouteProposal } from "./routes.js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { duelsApi } from "../duels/schemas.js";
import { agendaEffects, agendaItems, formatAgendaItem } from "../agenda/agenda.js";
import { defaultTriggersFile, loadTriggerMemo, personaFiles, runTriggers, saveTriggerMemo } from "../agenda/triggers.js";
import type { TimeState } from "../state/time.js";
import { defaultValuesFile, loadValueCache, saveValueCache } from "../state/prices.js";
import { executePacks, proposePacks } from "../packs/packs.js";
import { executeMarkets, proposeMarkets } from "../markets/markets.js";
import { appendHints, defaultHintsFile, loadHints, seedRaw } from "../hints/corpus.js";
import { parseFeed, defaultFlagsFile, defaultPersonasFile, formatPersona, loadFlags, loadPersonaMemos, saveFlags, savePersonaMemos } from "../state/world.js";

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
      "approve-flags": { type: "string", default: "" },
      "flag-pressure": { type: "boolean", default: false },
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
  // Frases de presión: solo con aprobación (ids uno a uno o en bloque); las candidatas se listan en dry-run.
  const approvedFlags = new Set(values["approve-flags"].split(",").map((s) => s.trim()).filter(Boolean));
  const flagsRoute = new FlagsRoute(client, dryRun, { messages: approvedFlags, allPressure: values["flag-pressure"] });
  const eggs = new EggsRoute();
  const convFile = defaultConversationsFile(root);
  const personasFile = defaultPersonasFile(root);
  const flagsFile = defaultFlagsFile(root);
  const triggersFile = defaultTriggersFile(root);
  let prevTime: TimeState | undefined;
  const hintsFile = defaultHintsFile(root);
  const valuesFile = defaultValuesFile(root);
  const posteriorFile = defaultPosteriorFile(root);
  const valueCache = loadValueCache(valuesFile);
  let prevRanks = new Map<string, { rank?: number; score?: number }>();
  // En dry-run el cursor vive solo en memoria (un bucle sin --once no repite disparadores); en vivo, en disco.
  let dryMemo = loadTriggerMemo(triggersFile);
  console.log(
    `bazaar:play · ${live ? "LIVE" : `DRY RUN (GET only, no POST)${!values["dry-run"] && !values.confirm ? " · no --confirm: running as dry-run" : ""}`} · page targets ${pageTargets.join(", ")} · cash floor ${values["cash-floor"]} P`,
  );

  let lastTick = -1;
  let lastLeaderboard = -Infinity;
  for (;;) {
    const memos = loadConversationMemos(convFile);
    const personaMemos = loadPersonaMemos(personasFile);
    const flags = loadFlags(flagsFile);
    const posterior = loadPosterior(posteriorFile);
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
    const state = await buildGameState(client, {
      leaderboard: withLb,
      pageTargets,
      memos,
      personaMemos,
      flags,
      posterior,
      ...(prevTime ? { prevTime } : {}),
      hintCorpus: loadHints(hintsFile),
      valueCache: valueCache.values,
      valueCacheAt: valueCache.at,
      prevRanks,
      // Primera vez sin corpus: semilla con lo ya guardado en results/ (volcados, escaneos, streams).
      ...(existsSync(hintsFile) ? {} : { hintSeed: seedRaw(join(root, "results")) }),
    });
    // El corpus de pistas es solo lectura del juego (GET): se añade también en dry-run. Nunca entra en una cifra.
    appendHints(hintsFile, state.hints.fresh);
    // Valores privados ya pedidos (GET): se guardan también en dry-run para no repetir la consulta.
    saveValueCache(valuesFile, new Map(Object.entries(client.cachedValues())));
    // Posterior del ajuste por persona: sale solo de lecturas (GET), se guarda también en dry-run. Nunca entra en un mensaje.
    savePosterior(posteriorFile, posterior);
    prevTime = state.time;
    prevRanks = new Map(state.markets.venues.flatMap((v) => (v.owner ? [[v.owner, { ...(v.ownerRank !== undefined ? { rank: v.ownerRank } : {}), ...(v.ownerScore !== undefined ? { score: v.ownerScore } : {}) }] as const] : [])));
    if (withLb) lastLeaderboard = state.tick;
    const budget = budgetFrom(state);

    // Agenda y disparadores ANTES de que las rutas propongan: pueden activar, desactivar o reajustar rutas.
    const schedule = await duelsApi(client).schedule().catch(() => undefined);
    const agenda = agendaItems(schedule, state.time.gameHour ?? 0);
    const effects = agendaEffects(agenda, state);
    if (effects.stopOpens) budget.opensBlocked = effects.stopOpens;
    if (effects.disabledPersonas.length) budget.closedPersonas = effects.disabledPersonas;
    if (effects.duelConfig?.decay !== undefined) duels.agent.params.decay = effects.duelConfig.decay;
    const triggerMemo = live ? loadTriggerMemo(triggersFile) : dryMemo;
    const events = parseFeed(await client.feed(200).catch(() => undefined));
    const triggers = runTriggers(events, triggerMemo, state.ours.team, state.limits.raw, state.tick);
    dryMemo = { ...(triggers.cursor !== undefined ? { cursor: triggers.cursor } : {}), limits: state.limits.raw, quiet: triggers.quiet };

    console.log(`\n== tick ${state.tick} · GameState ==`);
    for (const l of formatGameState(state)) console.log(`  ${l}`);
    if (dryRun && (state.clock.paused || (state.clock.doors && state.clock.doors !== "open"))) console.log("  (clock paused or doors closed: live mode would wait; dry-run shows what it would propose)");
    console.log("== personas ==");
    for (const p of state.personas) console.log(`  ${formatPersona(p)}`);
    console.log("== agenda (next 5) ==");
    for (const i of agenda.slice(0, 5)) console.log(`  ${formatAgendaItem(i)}`);
    if (!agenda.length) console.log("  (schedule empty or unreadable)");
    for (const n of effects.notes) console.log(`  effect: ${n}`);
    if (effects.stopOpens) console.log(`  effect: no new conversations (${effects.stopOpens})`);
    if (effects.duelConfig) console.log(`  effect: duel config ${effects.duelConfig.name}: decay ${effects.duelConfig.decay ?? "?"}, ${effects.duelConfig.withDays ? "price + days" : "price only"}`);
    console.log(`== triggers (${triggers.fired.length} fired${live ? "" : "; dry-run: cursor not saved"}) ==`);
    for (const f of triggers.fired) console.log(`  [tick ${f.tick}] ${f.type}${f.eventId !== undefined ? ` #${f.eventId}` : ""} → ${f.action}`);
    for (const id of [...new Set([...triggers.announced, ...triggers.activated])]) {
      const activated = triggers.activated.includes(id);
      const info = activated ? await client.dealer(id).catch(() => undefined) : undefined;
      const name = state.personas.find((p) => p.id === id)?.name;
      for (const f of personaFiles(id, info, { announcedOnly: !activated, ...(name ? { name } : {}) })) {
        const path = join(root, f.path);
        if (!live) console.log(`  would write ${f.path} (${f.content.split("\n").length} lines)${existsSync(path) ? " [exists: kept]" : ""}`);
        else if (!existsSync(path)) {
          mkdirSync(dirname(path), { recursive: true });
          writeFileSync(path, f.content);
          console.log(`  wrote ${f.path}`);
        }
      }
    }
    console.log("== budget (clock.limits) ==");
    for (const l of formatBudget(budget)) console.log(`  ${l}`);

    const proposals: { route: string; p: RouteProposal }[] = [];
    const me = await client.me().catch(() => undefined);
    for (const [route, run] of [
      ["duels", () => duels.propose()],
      ["dealers", () => dealers.propose(clock, state)],
      ["trades", () => trades.propose(state, me, pageTargets)],
      ["flags", async () => flagsRoute.propose(state)],
      ["eggs", async () => eggs.propose(state, triggers.quiet)],
      [
        "packs",
        async () => {
          const incoming = [
            ...agenda.filter((x) => x.action === "grant_all" && x.status !== "later" && Array.isArray(x.params.packs)).flatMap((x) => (x.params.packs as unknown[]).map(String)),
            ...state.personas.filter((p) => p.status !== "unlocked-for-us" && p.unlockPrize).map((p) => `${p.unlockPrize} (unlock ${p.id})`),
          ];
          const p = proposePacks({ packs: state.packs, ...(state.ours.cash !== undefined ? { cash: state.ours.cash } : {}), cashFloor: num(values["cash-floor"], "--cash-floor"), unlocked: state.ours.unlocked, dealers: (await client.dealers().catch(() => ({ dealers: [] }))).dealers, incoming });
          return { ...p, strategies: new Map(), decisions: new Map() };
        },
      ],
      [
        "markets",
        async () => {
          const byRef = new Map<string, number[]>();
          for (const a of me?.assets ?? []) if ((a.kind ?? "card") === "card") byRef.set(a.ref, [...(byRef.get(a.ref) ?? []), a.id]);
          return { ...proposeMarkets(state, byRef), strategies: new Map(), decisions: new Map() };
        },
      ],
      ["agenda", async () => ({ intents: effects.intents, notes: [], strategies: new Map(), decisions: new Map() })],
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
    // Arbitraje entre personas: solo propuesta, con el cupo de hilos que deja lo seleccionado.
    const arbitrage = arbitrageLines(personaArbitrage(state.personas), budget, verdicts);
    console.log(`  [arbitrage] ${arbitrage.length ? "" : "no persona sells a rarity below another's measured ceiling"}`);
    for (const l of arbitrage) console.log(`    ${l}`);

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
    for (const l of await executeMarkets(client, verdicts.filter((v) => v.selected).map((v) => v.intent), dryRun)) console.log(`  ${l}`);
    for (const l of await executePacks(client, verdicts.filter((v) => v.selected).map((v) => v.intent), dryRun)) console.log(`  ${l}`);
    const flagged = await flagsRoute.execute(state, selected);
    for (const l of flagged.lines) console.log(`  ${l}`);
    if (live) {
      for (const l of await dealers.execute(clock, selected)) console.log(`  ${l}`);
      for (const l of await trades.execute(selected)) console.log(`  ${l}`);
      saveConversationMemos(convFile, state.conversations);
      savePersonaMemos(personasFile, state.personas);
      saveTriggerMemo(triggersFile, dryMemo);
      if (flagged.records.length) saveFlags(flagsFile, [...flags, ...flagged.records]);
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
