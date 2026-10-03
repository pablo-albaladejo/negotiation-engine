import { defaultPosteriorFile, loadPosterior, savePosterior } from "../dealers/history/persona-fit.js";
import { defaultPersonaModelFile, formatPersonaModel, loadPersonaModels, savePersonaModels } from "../state/persona-model.js";
import { parseArgs } from "node:util";
import { BazaarClient, BazaarError } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { FileTrace, liveTraceDir } from "../shared/trace.js";
import { clockGate } from "../dealers/serious.js";
import { defaultDuelsStateFile } from "../duels/agent.js";
import { buildGameState, formatGameState } from "../state/game-state.js";
import { defaultRivalsFile, loadRivalLedger, saveRivalLedger } from "../state/rivals.js";
import { defaultConversationsFile, formatConversation, loadConversationMemos, saveConversationMemos } from "../state/conversation.js";
import { arbitrate, budgetFrom, formatBudget, type Intent } from "./coordinator.js";
import { arbitrageLines, personaArbitrage } from "./arbitrage.js";
import { defaultPlanLogFile, holdingsOf, planExecution, planIntent, writePlanLine, type PlanExecution } from "./plan-log.js";
import { defaultScoreAuditFile } from "./score-audit.js";
import { DealersRoute, DuelsRoute, EggsRoute, FlagsRoute, TradesRoute, type RouteProposal } from "./routes.js";
import { defaultListBackoffFile } from "../trades/agent.js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { duelsApi } from "../duels/schemas.js";
import { agendaEffects, agendaItems, formatAgendaItem } from "../agenda/agenda.js";
import { defaultTriggersFile, loadTriggerMemo, personaFiles, runTriggers, saveTriggerMemo } from "../agenda/triggers.js";
import type { TimeState } from "../state/time.js";
import { defaultValuesFile, loadValueCache, saveValueCache } from "../state/prices.js";
import { executePacks, proposePacks } from "../packs/packs.js";
import { executeMarkets, proposeMarkets } from "../markets/markets.js";
import { executeRivalBuy, proposeRivalBuy, rivalBuyValues, type RivalBuyPlan } from "../markets/rival-buy.js";
import { directedListings, executeRivalPage, proposeRivalPage, type RivalPagePlan } from "../markets/rival-page.js";
import { executeRivalSwap, proposeRivalSwap, type RivalSwapPlan } from "../markets/rival-swap.js";
import { ScannerLedger } from "../markets/scanner.js";
import { proposeTeamDesk, type DeskPlan } from "../teamdesk/counter.js";
import { defaultDeskLogFile, deskOfferIds, executeTeamDesk, loadDeskLedger } from "../teamdesk/desk.js";
import { appendHints, defaultHintsFile, loadHints, seedRaw } from "../hints/corpus.js";
import { defaultHintLabelsFile, HintLabeler, loadHintLabels } from "../hints/labels.js";
import { decideMechanism, DEFAULT_MECHANISM_THRESHOLDS, formatMechanismLine, ticksPerHourOf } from "../venue/mechanism.js";
import { executeVenueMechanism, proposeVenueMechanism } from "../venue/route.js";
import { VENUE_COST } from "../venue/venue.js";
import { defaultHeartbeatFile, defaultSessionsFile, loadBenchSessions, loadHeartbeat, publicSession } from "../broker/shadow.js";
import { parseFeed, defaultFlagsFile, defaultPersonasFile, formatPersona, loadFlags, loadPersonaMemos, saveFlags, savePersonaMemos } from "../state/world.js";

/**
 * `pnpm bazaar:play [--dry-run] [--once] [--confirm]`: the coordinator. Each tick it builds the `GameState` (GET only),
 * reads the budget from `clock.limits`, asks each route (duels, dealers, El Rastro) for its intents without sending them,
 * arbitrates (one accept per tick per `ACCEPT_PRIORITY`, messages per conversation, threads and listings) and prints
 * what goes out and what does not, and why. Safe by default: live only without `--dry-run` AND with `--confirm`
 * (only with user approval); without `--confirm` it runs as a dry-run. Never prints the key.
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const TRANSIENT = new Set(["rate_limited", "too_many_failures", "network"]);

/** A transient API error (rate limit, network) while reading skips the tick instead of ending the live loop. */
async function orSkip<T>(p: Promise<T>, what: string): Promise<T | undefined> {
  try {
    return await p;
  } catch (e) {
    if (!(e instanceof BazaarError) || !TRANSIENT.has(e.code)) throw e;
    console.log(`  ${what}: ${e.code}, tick skipped`);
    return undefined;
  }
}

function num(raw: string, name: string): number {
  const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a number ≥ 0`);
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
      "page-bonus-scored": { type: "boolean", default: false },
      "egg-open": { type: "string" },
      "leaderboard-every": { type: "string", default: "5" },
      "approve-flags": { type: "string", default: "" },
      "flag-pressure": { type: "boolean", default: false },
      "allow-venue-switch": { type: "boolean", default: false },
      "rival-page": { type: "boolean", default: false },
      "rival-buy": { type: "boolean", default: false },
      "rival-swap": { type: "boolean", default: false },
      "team-desk": { type: "boolean", default: false },
      "rastro-bids": { type: "boolean", default: false },
      "no-venue-reserve": { type: "boolean", default: false },
      scanner: { type: "boolean", default: false },
      "scanner-spend-per-hour": { type: "string", default: "60" },
      "plan-log": { type: "string", default: "" },
      "hint-llm": { type: "boolean", default: false },
    },
  });
  const live = !values["dry-run"] && values.confirm;
  const dryRun = !live;
  const env = loadBazaarEnv();
  if (!env.key) {
    console.error("Missing BAZAAR_KEY (set it in .env or in the environment).");
    process.exit(2);
  }
  const pageTargets = values["page-targets"].split(",").map((s) => s.trim()).filter(Boolean);
  // Until a page bonus shows in neg_points, a page target is capped at its base (no bonus): the flag lifts it to 0.9 × value.
  const pageBonusScored = values["page-bonus-scored"] === true;
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
    pageBonusScored,
    ...(values["egg-open"] ? { eggOpen: values["egg-open"] } : {}),
    ...(live ? { trace: new FileTrace(liveTraceDir(root)), lessonsFile: join(root, "docs", "bazaar", "lessons.json"), scoreAuditFile: defaultScoreAuditFile(root) } : {}),
  });
  const rastroBids = values["rastro-bids"] === true;
  // --rival-swap (opt-in): El Rastro may also accept a card-for-card swap addressed to us (fee only) without a page-completing card.
  const rivalSwap = values["rival-swap"] === true;
  const trades = new TradesRoute(client, dryRun, { maxSpend: num(values["max-spend"], "--max-spend"), cashFloor: num(values["cash-floor"], "--cash-floor"), pageTargets, pageBonusScored, rastroBids, rivalSwap }, defaultListBackoffFile(root));
  trades.scanner = values.scanner === true;
  // Pressure phrases: only with approval (ids one by one or in bulk); candidates are listed in dry-run.
  const approvedFlags = new Set(values["approve-flags"].split(",").map((s) => s.trim()).filter(Boolean));
  const flagsRoute = new FlagsRoute(client, dryRun, { messages: approvedFlags, allPressure: values["flag-pressure"] });
  const eggs = new EggsRoute();
  // Dispersion scanner (markets route): executed deals per game hour, in memory for the run (a restart counts from zero).
  const scannerLedger = new ScannerLedger();
  const scannerSpendPerHour = num(values["scanner-spend-per-hour"], "--scanner-spend-per-hour");
  trades.scannerContext = { ledger: scannerLedger, cashFloor: num(values["cash-floor"], "--cash-floor"), spendPerHour: scannerSpendPerHour };
  // plan.jsonl: by default only live (like decisions.jsonl, same date); --plan-log forces a path, also in dry-run.
  const planFile = values["plan-log"] || (live ? defaultPlanLogFile(root) : undefined);
  const convFile = defaultConversationsFile(root);
  const personasFile = defaultPersonasFile(root);
  const flagsFile = defaultFlagsFile(root);
  const triggersFile = defaultTriggersFile(root);
  let prevTime: TimeState | undefined;
  const hintsFile = defaultHintsFile(root);
  // LLM labels of the hint corpus (egg probe phrases): in the background, also in dry-run (it only reads game text).
  // Opt-in (--hint-llm); off with --once: a pending `claude -p` child would hold the process for minutes.
  const hintLabelsFile = defaultHintLabelsFile(root);
  const hintLabeler = values["hint-llm"] && !values.once ? new HintLabeler(hintLabelsFile) : undefined;
  const valuesFile = defaultValuesFile(root);
  const posteriorFile = defaultPosteriorFile(root);
  const personaModelFile = defaultPersonaModelFile(root);
  const personaModels = loadPersonaModels(personaModelFile);
  // Other teams' holdings and wants: kept in memory, seeded from the recorder the first time.
  const rivalsFile = defaultRivalsFile(root);
  const rivalLedger = loadRivalLedger(rivalsFile, join(root, "results", "bazaar-live"));
  // Team desk: counter-offers to rejected offers other teams make to us; the log seeds what it already sent today.
  const deskLedger = loadDeskLedger(defaultDeskLogFile(root));
  const valueCache = loadValueCache(valuesFile);
  let prevRanks = new Map<string, { rank?: number; score?: number }>();
  // In dry-run the cursor lives only in memory (a loop without --once does not repeat triggers); live, on disk.
  let dryMemo = loadTriggerMemo(triggersFile);
  console.log(
    `bazaar:play · ${live ? "LIVE" : `DRY RUN (GET only, no POST)${!values["dry-run"] && !values.confirm ? " · no --confirm: running as dry-run" : ""}`} · page targets ${pageTargets.join(", ")} (${pageBonusScored ? "page bonus scored: cap 0.9 × value" : "cap = base, page bonus not counted"}) · cash floor ${values["cash-floor"]} P`,
  );

  let lastTick = -1;
  let lastLeaderboard = -Infinity;
  for (;;) {
    const memos = loadConversationMemos(convFile);
    const personaMemos = loadPersonaMemos(personasFile);
    const flags = loadFlags(flagsFile);
    const posterior = loadPosterior(posteriorFile);
    const clock = await orSkip(client.clock(), "clock");
    if (!clock) {
      await sleep(5_000);
      continue;
    }
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
    const state = await orSkip(buildGameState(client, {
      leaderboard: withLb,
      pageTargets,
      memos,
      personaMemos,
      flags,
      posterior,
      personaModels,
      rivals: rivalLedger,
      rivalConfirmPerTick: 2,
      ...(prevTime ? { prevTime } : {}),
      hintCorpus: loadHints(hintsFile),
      hintLabels: loadHintLabels(hintLabelsFile),
      valueCache: valueCache.values,
      valueCacheAt: valueCache.at,
      ...(valueCache.hand ? { valueCacheHand: valueCache.hand } : {}),
      prevRanks,
      // First time without a corpus: seed it with what is already saved in results/ (dumps, scans, streams).
      ...(existsSync(hintsFile) ? {} : { hintSeed: seedRaw(join(root, "results")) }),
    }), "GameState");
    if (!state) {
      await sleep(5_000);
      continue;
    }
    // The hint corpus is read-only game data (GET): it is also added in dry-run. It never enters a figure.
    appendHints(hintsFile, state.hints.fresh);
    const labelNote = hintLabeler?.tick(state.hints.all, state.personas.map((p) => ({ id: p.id, ...(p.name ? { name: p.name } : {}) })));
    if (labelNote) console.log(`  ${labelNote}`);
    // Private values already requested (GET): also saved in dry-run so the query is not repeated.
    // The disk cache seeds the client on the first tick only: later ticks would revive values the hand already forgot.
    valueCache.values.clear();
    saveValueCache(valuesFile, new Map(Object.entries(client.cachedValues())), client.hand());
    // Per-persona fit posterior: comes only from reads (GET), also saved in dry-run. It never enters a message.
    savePosterior(posteriorFile, posterior);
    savePersonaModels(personaModelFile, personaModels);
    // Rivals ledger: public structure only (GET), also saved in dry-run. A failed write never stops the loop.
    try {
      saveRivalLedger(rivalsFile, rivalLedger);
    } catch (e) {
      console.log(`  rivals: not saved (${e instanceof Error ? e.message : "error"})`);
    }
    prevTime = state.time;
    prevRanks = new Map(state.markets.venues.flatMap((v) => (v.owner ? [[v.owner, { ...(v.ownerRank !== undefined ? { rank: v.ownerRank } : {}), ...(v.ownerScore !== undefined ? { score: v.ownerScore } : {}) }] as const] : [])));
    if (withLb) lastLeaderboard = state.tick;
    const budget = budgetFrom(state);

    // Agenda and triggers BEFORE the routes propose: they can enable, disable or readjust routes.
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
    for (const p of state.personas) {
      console.log(`  ${formatPersona(p)}`);
      if (p.model) console.log(`    ${formatPersonaModel(p.model)}`);
    }
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
    // Auto or board? Sessions measured by the shadow broker and its heartbeat (disk), calendar and cash: pure rule.
    const nowHours = state.time.gameHour ?? state.clock.tHours;
    state.venue = {
      mechanismDecision: decideMechanism(
        {
          ...(state.ours.venue?.mechanism ? { current: state.ours.venue.mechanism } : {}),
          sessions: loadBenchSessions(defaultSessionsFile(root)).map(publicSession),
          ...(state.ours.cash !== undefined ? { cash: state.ours.cash } : {}),
          ...(nowHours !== undefined ? { nowHours } : {}),
          ticksPerHour: ticksPerHourOf(state.tick, state.clock.tHours, state.clock.tickSeconds),
          ...(schedule ? { schedule } : {}),
          ...(() => {
            const hb = loadHeartbeat(defaultHeartbeatFile(root));
            return hb ? { heartbeat: hb } : {};
          })(),
          now: new Date(),
        },
        { ...DEFAULT_MECHANISM_THRESHOLDS, cashFloor: num(values["cash-floor"], "--cash-floor") },
      ),
    };
    console.log("== venue mechanism ==");
    console.log(`  ${formatMechanismLine(state.venue.mechanismDecision)}`);
    console.log("== budget (clock.limits) ==");
    for (const l of formatBudget(budget)) console.log(`  ${l}`);
    // Venue-switch reserve: until our venue is board, buys that do not complete a page only spend cash above
    // VENUE_COST + --cash-floor (290 P), so `pnpm bazaar:venue --replace --mechanism board` becomes affordable.
    const venueReserveOn = !values["no-venue-reserve"] && state.ours.venue?.mechanism !== "board";
    const switchCash = VENUE_COST + num(values["cash-floor"], "--cash-floor");
    trades.venueReserve = dealers.venueReserve = venueReserveOn ? VENUE_COST : 0;
    if (venueReserveOn) {
      const cash = state.ours.cash ?? 0;
      console.log(
        cash < switchCash
          ? `  venue-switch reserve: cash ${cash} P < ${switchCash} P (venue ${VENUE_COST} + floor ${values["cash-floor"]}): buys only for page-completing cards; sells unchanged (--no-venue-reserve to disable)`
          : `  venue-switch reserve: cash ${cash} P ≥ ${switchCash} P: venue switch now allowed (pnpm bazaar:venue --replace --mechanism board --name ... --confirm, coordinator session); non-page buys only spend above ${switchCash} P`,
      );
    }

    const proposals: { route: string; p: RouteProposal }[] = [];
    let rivalPlan: RivalPagePlan = { posts: [], cancels: [] };
    let rivalBuyPlan: RivalBuyPlan = { posts: [], cancels: [] };
    let rivalSwapPlan: RivalSwapPlan = { posts: [], cancels: [] };
    let deskPlan: DeskPlan = { incoming: [], posts: [], cancels: [] };
    let deskIntents: Intent[] = [];
    const routeErrors: string[] = [];
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
          const m = proposeMarkets(state, byRef, {
            scanner: values.scanner === true,
            ...(trades.lastState ? { trade: trades.lastState, directedRefs: new Set(directedListings(trades.lastState).map((d) => d.ref)) } : {}),
            ledger: scannerLedger,
            cashFloor: num(values["cash-floor"], "--cash-floor"),
            spendPerHour: scannerSpendPerHour,
            pageTargets,
            pageBonusScored,
            venueReserve: trades.venueReserve,
          });
          // Directed listings to a rival that lacks one page card (never throws: off with a note on bad data).
          try {
            const r = proposeRivalPage({ tick: state.tick, trade: trades.lastState, ...(trades.lastPlan ? { tradePlan: trades.lastPlan } : {}), rivals: state.rivals, pageTargets, cashFloor: num(values["cash-floor"], "--cash-floor"), ...(budget.opensBlocked ? { opensBlocked: budget.opensBlocked } : {}), foreignOfferIds: deskOfferIds(deskLedger) });
            rivalPlan = r.plan;
            m.intents.push(...r.intents);
            m.notes.push(...r.notes);
          } catch (e) {
            m.notes.push(`[rival-page] off: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
          }
          // Directed bids to a rival seen holding a spare of a page card we lack (same safety: off with a note).
          try {
            const apiValues = await rivalBuyValues(client, trades.lastState, state.rivals);
            const r = proposeRivalBuy({ tick: state.tick, trade: trades.lastState, ...(trades.lastPlan ? { tradePlan: trades.lastPlan } : {}), rivals: state.rivals, maxSpend: num(values["max-spend"], "--max-spend"), cashFloor: num(values["cash-floor"], "--cash-floor"), pageTargets, pageBonusScored, pageReserve: trades.lastReserve, apiValues, ...(budget.opensBlocked ? { opensBlocked: budget.opensBlocked } : {}) });
            rivalBuyPlan = r.plan;
            m.intents.push(...r.intents);
            m.notes.push(...r.notes);
          } catch (e) {
            m.notes.push(`[rival-buy] off: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
          }
          // Directed card-for-card swaps of our spares (opt-in --rival-swap: without it, nothing is proposed).
          if (rivalSwap) {
            try {
              const r = proposeRivalSwap({ tick: state.tick, trade: trades.lastState, ...(trades.lastPlan ? { tradePlan: trades.lastPlan } : {}), otherAssets: rivalPlan.posts.map((p) => p.assetId), rivals: state.rivals, pageTargets, pageBonusScored, cashFloor: num(values["cash-floor"], "--cash-floor"), ...(budget.opensBlocked ? { opensBlocked: budget.opensBlocked } : {}) });
              rivalSwapPlan = r.plan;
              m.intents.push(...r.intents);
              m.notes.push(...r.notes);
            } catch (e) {
              m.notes.push(`[rival-swap] off: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
            }
          }
          // Team desk: counter-offers to offers made to us that El Rastro rejects (intents only with the opt-in --team-desk).
          try {
            const r = proposeTeamDesk({ tick: state.tick, trade: trades.lastState, ...(trades.lastPlan ? { tradePlan: trades.lastPlan } : {}), ...(trades.lastState?.rivals ? { rivals: trades.lastState.rivals } : {}) }, undefined, undefined, deskOfferIds(deskLedger));
            deskPlan = r.plan;
            deskIntents = r.intents;
            if (values["team-desk"]) m.intents.push(...r.intents);
            m.notes.push(...r.notes);
          } catch (e) {
            m.notes.push(`[team-desk] off: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
          }
          return { ...m, strategies: new Map(), decisions: new Map() };
        },
      ],
      ["agenda", async () => ({ intents: effects.intents, notes: [], strategies: new Map(), decisions: new Map() })],
      ["venue-mechanism", async () => ({ ...proposeVenueMechanism(state.venue!.mechanismDecision, state.ours.venue?.id), strategies: new Map(), decisions: new Map() })],
    ] as const) {
      try {
        proposals.push({ route, p: await run() });
      } catch (e) {
        const msg = e instanceof BazaarError ? e.code : e instanceof Error ? e.message.slice(0, 200) : String(e);
        routeErrors.push(`${route}: ${msg}`);
        console.log(`  route ${route} failed: ${msg}`);
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
    // Arbitrage between personas: proposal only, with the thread quota left by what is selected.
    const arbitrage = arbitrageLines(personaArbitrage(state.personas), budget, verdicts);
    console.log(`  [arbitrage] ${arbitrage.length ? "" : "no persona sells a rarity below another's measured ceiling"}`);
    for (const l of arbitrage) console.log(`    ${l}`);

    // Conversations: turn granted by the budget, strategy and last decision of each route.
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
    const selectedIntents = verdicts.filter((v) => v.selected).map((v) => v.intent);
    const execution: PlanExecution[] = [];
    const report = (route: string, lines: readonly string[]) => {
      for (const l of lines) {
        console.log(`  ${l}`);
        execution.push(planExecution(route, l, selectedIntents));
      }
    };
    report("duels", await duels.execute(selected));
    report("markets", await executeMarkets(client, selectedIntents, dryRun, scannerLedger));
    // Rival-page listings go out only live AND with the opt-in --rival-page; otherwise "would" lines.
    report("markets", await executeRivalPage(client, selectedIntents, rivalPlan, dryRun || !values["rival-page"], undefined, undefined, state.tick));
    // Rival-buy bids go out only live AND with the opt-in --rival-buy; otherwise "would" lines.
    report("markets", await executeRivalBuy(client, selectedIntents, rivalBuyPlan, dryRun || !values["rival-buy"], undefined, undefined, state.tick));
    // Rival-swap offers go out only live AND with the opt-in --rival-swap (proposed only with it).
    report("markets", await executeRivalSwap(client, selectedIntents, rivalSwapPlan, dryRun || !rivalSwap, undefined, undefined, state.tick));
    // Team-desk counters go out only live AND with the opt-in --team-desk; otherwise "would" lines (and the log).
    const deskOn = values["team-desk"] === true;
    report("markets", await executeTeamDesk(client, deskOn ? selectedIntents : deskIntents, deskPlan, dryRun || !deskOn, { tick: state.tick, ...(trades.lastState ? { myId: trades.lastState.myId } : {}), trade: trades.lastState, ledger: deskLedger }));
    report("packs", await executePacks(client, selectedIntents, dryRun));
    report("venue", executeVenueMechanism(selectedIntents, state.ours.venue?.id, { dryRun, confirm: values.confirm, allowVenueSwitch: values["allow-venue-switch"] }));
    const flagged = await flagsRoute.execute(state, selected);
    report("flags", flagged.lines);
    if (live) {
      report("dealers", await dealers.execute(clock, selected));
      report("trades", await trades.execute(selected));
      saveConversationMemos(convFile, state.conversations);
      savePersonaMemos(personasFile, state.personas);
      saveTriggerMemo(triggersFile, dryMemo);
      if (flagged.records.length) saveFlags(flagsFile, [...flags, ...flagged.records]);
    }
    if (planFile) {
      writePlanLine(planFile, {
        v: 1,
        tick: state.tick,
        ts: new Date().toISOString(),
        mode: live ? "live" : "dry-run",
        ...(state.ours.cash !== undefined ? { cash: state.ours.cash } : {}),
        cashFloor: num(values["cash-floor"], "--cash-floor"),
        maxSpend: num(values["max-spend"], "--max-spend"),
        holdings: holdingsOf(me),
        intents: intents.map(planIntent),
        arbitration: verdicts.map((v) => ({ id: v.intent.id, verdict: v.selected ? "selected" : "dropped", ...(v.reason ? { reason: v.reason } : {}) })),
        execution,
        ...(routeErrors.length ? { routeErrors } : {}),
      });
    }
    if (values.once) {
      for (const l of dealers.flushLessons()) console.log(`  ${l}`);
      break;
    }
    const after = await client.clock().catch(() => undefined);
    await sleep(Math.max(1, after?.next_tick_in ?? 5) * 1000 + 300);
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
