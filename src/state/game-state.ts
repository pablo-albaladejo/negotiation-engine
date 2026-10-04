import { updatePosterior, type Posterior } from "../dealers/history/persona-fit.js";
import { buildPersonaModel, type PersonaModel } from "./persona-model.js";
import { traitsOf } from "../dealers/dealer-profile.js";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Clock, Me } from "../shared/schemas.js";
import { extractScoreFields, type ScoreFields } from "../shared/score.js";
import { duelsApi, type Duel, type Schedule } from "../duels/schemas.js";
import { parseMyOffers, parseOffers, readSide } from "../trades/trades.js";
import { buildValuation, type ValuationState } from "./valuation.js";
import { buildWorkshop, type WorkshopState } from "../workshop/workshop.js";
import { spareTargets } from "../dealers/planning/planner.js";
import { buildConversations, type Conversation, type ConversationMemo } from "./conversation.js";
import { indexCatalog } from "../flags/flags.js";
import { buildPacks, formatPacks, type PacksState } from "../packs/packs.js";
import { buildPriceSheet, buildVenues, formatPriceSheet, formatVenues, valuesWanted, type PriceEntry, type VenueInfo } from "./prices.js";
import { buildTime, formatTime, type TimeState } from "./time.js";
import { applyCardHistory, confirmCandidates, emptyRivalLedger, formatRivals, ingestEvents, ingestLeaderboard, rivalsView, type RivalLedger, type RivalsState } from "./rivals.js";
import type { MechanismDecision } from "../venue/mechanism.js";
import { candidateContext, collectRaw, enrichLine, formatHints, hintsByPersona, newLines, type HintLine, type Raw } from "../hints/corpus.js";
import { applyLabels, type HintLabel } from "../hints/labels.js";
import { buildPersonas, mergeWorldEvents, parseFeed, recordedWorldEvents, personaTypeOf, resolveProbes, worldFromFeed, formatEggsAndFlags, type FeedEvent, type FlagRecord, type OursWorld, type Persona, type PersonaMemo, type WorldEggs } from "./world.js";
import { eggPlanRows, recordedOurPersonaMessages, type EggPlanRow } from "../hints/egg-plan.js";
import { findChains, writeForex, type ForexState } from "../forex/chains.js";
import { updateDealerLedger } from "../forex/ledger.js";
import { formatNewsSignals, readNewsSignals, type NewsSignals } from "../news/signals.js";

/**
 * A single `GameState` per tick, built with GET only and tolerant: each read that fails is recorded in
 * `missing` and the rest of the state carries on. Read by the coordinator (`pnpm bazaar:play`) and, later, the viewer.
 * Our private value for each card (`your_value`) goes in `ours.values` for local use; it never appears in a message.
 */

/** Limits in force (`/api/clock` → `limits`). An absent field stays `undefined`: the coordinator decides what to do. */
export interface TickLimits {
  acceptsPerTick?: number;
  /** `messages_per_side_per_tick`: our messages per conversation and tick. */
  messagesPerConversation?: number;
  maxOpenThreads?: number;
  /** `offers_per_team_per_tick`: new offers per tick (a cancelled one also counts). */
  offersPerTick?: number;
  maxOpenOffers?: number;
  raw: Record<string, unknown>;
}

export interface AlbumPage {
  set: string;
  name?: string;
  have: number;
  of: number;
  complete: boolean;
}

export interface GameState {
  tick: number;
  builtAt: string;
  clock: {
    tick: number;
    tHours?: number;
    tickSeconds?: number;
    paused: boolean;
    doors?: string;
    roundName?: string;
    nextTickIn?: number;
    closes?: string;
    nextOpens?: string;
  };
  limits: TickLimits;
  /** Game time, phase of the day, round and weight, ticks left today, drift and calendar change. */
  time: TimeState;
  ours: {
    team?: string;
    name?: string;
    cash?: number;
    level?: number;
    unlocked: string[];
    frozen?: boolean;
    album: { pages: AlbumPage[]; filled?: number; slots?: number };
    holdings: { cards: number; packs: number; byRef: Record<string, number>; spares: number };
    /** Already-known private values (`your_value` of what we hold), per card. Local use only. */
    values: Record<string, number>;
    score?: ScoreFields;
    venue?: { id?: string; name?: string; mechanism?: string; status?: string };
    openThreads: { id: number; with?: string; status: string }[];
    /** Dealers in cooloff (thread closed with `closed_reason` cooloff and a future `until_tick`). */
    cooloffs: { dealer: string; untilTick: number }[];
    /** Strike fields that `/api/me` carries, if any (none appear today). */
    strikes?: Record<string, unknown>;
  } & OursWorld;
  /** Price sheet per card (published sets): scarcity, dealers, best ask/bid, last deal, value and gaps. */
  markets: { prices: PriceEntry[]; venues: VenueInfo[] };
  /** Our value model laid out per card and page (`src/state/valuation.ts`): API value, base, next copy, lose a copy, page bonus. Local use only. */
  valuation?: ValuationState;
  /** Our sealed packs and pack types (expected value with supply, dealers, El Rastro). */
  packs: PacksState;
  /**
   * The Workshop (`src/workshop/`): our spares per rarity under the sale guardrails, the expected card of the next
   * rarity against what the spares are worth, the strategy's decision (craft, hold, short) and the public crafts.
   */
  workshop?: WorkshopState;
  /** Full hints corpus (what is already stored + what is new this tick) and the new part to append to `hints.jsonl`. */
  hints: { all: HintLine[]; fresh: HintLine[] };
  /** Personas (dealers and those that appear via `/api/levels` or the feed), with state and unlock progress. */
  personas: Persona[];
  world: { eggs: WorldEggs };
  /** Sunday's approved egg probe plan (`src/hints/egg-plan.ts`) with each item's status from our messages and eggs. */
  eggPlan: EggPlanRow[];
  /**
   * News (Radio Rastro, the Bulletin, the notice board) as a HINT: which dealer, set or card is being talked about and
   * in which direction. Read from news-summary.json (`pnpm bazaar:news`), never from the API; may be rumour and never a
   * figure. No decision reads it yet.
   */
  news: NewsSignals;
  env: {
    schedule: { nowHours?: number; next: { atHours: number; action: string; note?: string }[] };
    dealers: { id: string; name?: string; status?: string; level?: number }[];
    duels: Duel[];
    rastro: { offers: number; asks: number; bids: number; ours: number };
    myOpenOffers: number;
    leaderboard?: { tick?: number; ourRank?: number; ourScore?: number; top: { team: string; name?: string; score?: number; rank?: number }[] };
  };
  /** One per dealer thread, live duel and our offer in El Rastro (see `conversation.ts`). */
  conversations: Conversation[];
  /** Reads that failed (endpoint: code); the state is partial but usable. */
  missing: string[];
  /** This tick's feed (`/api/feed`, last 200 events): the coordinator's score audit reads our settlements from it. */
  events?: readonly FeedEvent[];
  /**
   * auto or board? Market Test sessions measured in shadow and the recommendation (`src/venue/mechanism.ts`). Filled in by
   * the coordinator after building the state (reads `bench-sessions.json` and the broker heartbeat from disk).
   */
  venue?: { mechanismDecision: MechanismDecision };
  /** Other teams: cards seen with them, cards they asked for, leaderboard bounds (see `rivals.ts`). Absent if it failed. */
  rivals?: RivalsState;
  /** Forex chains A → B → C (buy cheap, hold, sell dear) with the step we are on (`src/forex/`). Absent if it failed. */
  forex?: ForexState;
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" ? x : undefined);

export function readLimits(clock: Pick<Clock, "limits"> | undefined): TickLimits {
  const raw = clock?.limits ?? {};
  const out: TickLimits = { raw };
  const set = <K extends keyof Omit<TickLimits, "raw">>(k: K, v: unknown) => {
    const n = num(v);
    if (n !== undefined) out[k] = n;
  };
  set("acceptsPerTick", raw.accepts_per_team_per_tick);
  set("messagesPerConversation", raw.messages_per_side_per_tick);
  set("maxOpenThreads", raw.max_open_threads_per_team);
  set("offersPerTick", raw.offers_per_team_per_tick);
  set("maxOpenOffers", raw.max_open_offers_per_team);
  return out;
}

const AlbumSchema = z.looseObject({
  pages: z.array(z.looseObject({ set: z.string(), name: z.string().nullish(), have: z.number().catch(0), of: z.number().catch(10), complete: z.boolean().catch(false) })).catch([]),
  filled: z.number().nullish(),
  slots: z.number().nullish(),
});

const LeaderboardSchema = z.looseObject({
  tick: z.number().nullish(),
  teams: z.array(z.looseObject({ team: z.string(), name: z.string().nullish(), score: z.number().nullish(), rank: z.number().nullish() })).catch([]),
});

/** Parts of `/api/me` that the state uses (all optional; an odd field is ignored). */
function oursFrom(me: Me) {
  const raw = me as Me & Record<string, unknown>;
  const album = AlbumSchema.safeParse(me.album);
  const byRef: Record<string, number> = {};
  const values: Record<string, number> = {};
  let cards = 0;
  for (const a of me.assets) {
    if (a.kind && a.kind !== "card") continue;
    cards += 1;
    byRef[a.ref] = (byRef[a.ref] ?? 0) + 1;
    if (typeof a.your_value === "number" && values[a.ref] === undefined) values[a.ref] = a.your_value;
  }
  const venue = raw.venue && typeof raw.venue === "object" ? (raw.venue as Record<string, unknown>) : undefined;
  const rules = venue?.rules && typeof venue.rules === "object" ? (venue.rules as Record<string, unknown>) : undefined;
  const strikes = Object.fromEntries(Object.entries(raw).filter(([k]) => /strike|cooloff|warning/i.test(k)));
  const score = extractScoreFields(me);
  const team = me.id ?? undefined;
  const name = me.name ?? undefined;
  const venueOut = venue ? { ...(str(venue.venue) ? { id: str(venue.venue)! } : {}), ...(str(venue.name) ? { name: str(venue.name)! } : {}), ...(str(rules?.mechanism) ? { mechanism: str(rules!.mechanism)! } : {}), ...(str(venue.status) ? { status: str(venue.status)! } : {}) } : undefined;
  return {
    ...(team ? { team } : {}),
    ...(name ? { name } : {}),
    cash: me.cash,
    ...(me.level !== undefined ? { level: me.level } : {}),
    unlocked: me.unlocked ?? me.unlocked_dealers ?? [],
    ...(typeof raw.frozen === "boolean" ? { frozen: raw.frozen } : {}),
    album: album.success
      ? {
          pages: album.data.pages.map((p) => ({ set: p.set, ...(p.name ? { name: p.name } : {}), have: p.have, of: p.of, complete: p.complete })),
          ...(album.data.filled != null ? { filled: album.data.filled } : {}),
          ...(album.data.slots != null ? { slots: album.data.slots } : {}),
        }
      : { pages: [] },
    holdings: { cards, packs: me.assets.length - cards, byRef, spares: spareTargets(me).length },
    values,
    ...(score ? { score } : {}),
    ...(venueOut ? { venue: venueOut } : {}),
    ...(Object.keys(strikes).length ? { strikes } : {}),
  };
}

export interface BuildOptions {
  /** Read `/api/leaderboard` (the coordinator requests it every few ticks; the server refreshes it every 5). */
  leaderboard?: boolean;
  /** Cards that always count as "page" (SAL-09). */
  pageTargets?: readonly string[];
  /** Persisted part of each conversation (`conversations.json`). */
  memos?: ReadonlyMap<string, ConversationMemo>;
  /** Hints and probes per persona (`personas.json`). */
  personaMemos?: ReadonlyMap<string, PersonaMemo>;
  /** Flags already sent (`flags.json`). */
  flags?: readonly FlagRecord[];
  /** Previous tick's time: calendar fingerprint and round weight if the leaderboard was not read. */
  prevTime?: TimeState;
  /** Hints corpus already stored (`hints.jsonl`). */
  hintCorpus?: readonly HintLine[];
  /** Corpus seed from `results/` (first time only, without `hints.jsonl`). */
  hintSeed?: readonly Raw[];
  /** LLM labels of the corpus (`hint-labels.json`, `src/hints/labels.ts`). */
  hintLabels?: ReadonlyMap<string, HintLabel>;
  /** Private values cache on disk (`values.json`) and its timestamp; seeds the client's if still fresh. */
  valueCache?: ReadonlyMap<string, number>;
  valueCacheAt?: number;
  /** Hand the disk cache was saved with: without it the disk cache is ignored. */
  valueCacheHand?: Readonly<Record<string, number>>;
  /** Maximum `/api/me/value` calls per tick (default 4). */
  valueFetchesPerTick?: number;
  /**
   * Per-persona fit posterior (`persona-posterior.json`). Updated IN PLACE with the tick's conversations
   * (observations and estimates) so that whoever loaded it saves it.
   */
  posterior?: Posterior;
  /**
   * Accumulated models per persona (`persona-model.json`). Updated IN PLACE every tick so that whoever loaded them
   * saves them; without them (e.g. the viewer, which does not save) they are rebuilt from the posterior.
   */
  personaModels?: Record<string, PersonaModel>;
  /**
   * Ledger of what other teams hold and want (`rivals.json`). Updated IN PLACE with the tick's feed and leaderboard
   * so that whoever loaded it saves it; without it, built from this tick's feed only.
   */
  rivals?: RivalLedger;
  /**
   * `/api/cards/{id}` reads per tick to confirm that a rival still holds a page card we lack (default 0: no GET;
   * the coordinator passes 2).
   */
  rivalConfirmPerTick?: number;
  /** Leaderboard ranks from the previous tick (if this tick does not read it). */
  prevRanks?: ReadonlyMap<string, { rank?: number; score?: number }>;
  /** Day folder with news-summary.json and the recorder's stream-*.jsonl (default `<cwd>/results/bazaar-live/<local date>`); missing or bad file → empty. */
  newsDir?: string;
}

/** Builds the tick's state with parallel GETs; never throws on a failed read (except `/api/clock`). */

export async function buildGameState(client: BazaarClient, opts: BuildOptions = {}): Promise<GameState> {
  const duels = duelsApi(client);
  const clock = await client.clock();
  const missing: string[] = [];
  const settle = async <T>(name: string, p: Promise<T>): Promise<T | undefined> => {
    try {
      return await p;
    } catch (e) {
      missing.push(`${name}: ${e instanceof BazaarError ? e.code : e instanceof Error ? e.name : "error"}`);
      return undefined;
    }
  };
  const [me, schedule, dealers, live, threads, board, myOffers, leaderboard, feed, levels, catalog, venues] = await Promise.all([
    settle("me", client.me()),
    settle("schedule", duels.schedule()),
    settle("dealers", client.dealers()),
    settle("duels", duels.duels()),
    settle("threads", client.myThreads()),
    settle("rastro", client.board("rastro")),
    settle("my offers", client.myOffers()),
    opts.leaderboard ? settle("leaderboard", client.raw("GET", "/api/leaderboard")) : Promise.resolve(undefined),
    settle("feed", client.feed(200)),
    settle("levels", client.levels()),
    settle("catalog", client.catalog()),
    settle("venues", client.venues()),
  ]);
  // Other open venues (without El Rastro): their book for the price sheet.
  const others = (venues?.venues ?? []).filter((v) => v.venue && v.venue !== "rastro" && (v as { status?: unknown }).status !== "closed");
  const otherBoards = await Promise.all(others.map(async (v) => ({ venue: v.venue!, offers: parseOffers(await settle(`board ${v.venue}`, client.board(v.venue!))) })));
  const events = parseFeed(feed);
  const dayDir = opts.newsDir ?? join(process.cwd(), "results", "bazaar-live", new Date().toLocaleDateString("sv-SE"));
  writeVenueBooks(dayDir, clock.tick, (venues?.venues ?? []) as unknown[], [{ venue: "rastro", offers: board !== undefined ? parseOffers(board) : [] }, ...otherBoards]);
  const rawDealers = (dealers?.dealers ?? []) as unknown[];
  const c = clock as Clock & Record<string, unknown>;
  const ours = me ? oursFrom(me) : { unlocked: [], album: { pages: [] }, holdings: { cards: 0, packs: 0, byRef: {}, spares: 0 }, values: {} };
  const allThreads = threads?.threads ?? [];
  const cooloffs = allThreads.flatMap((t) => {
    const r = t as typeof t & { closed_reason?: unknown; until_tick?: unknown };
    const until = num(r.until_tick);
    return r.closed_reason === "cooloff" && until !== undefined && until > clock.tick && t.with ? [{ dealer: t.with, untilTick: until }] : [];
  });
  const offers = board !== undefined ? parseOffers(board) : [];
  const mine = myOffers !== undefined && me ? parseMyOffers(myOffers, me.id ?? "").mine : [];
  const lb = leaderboard !== undefined ? LeaderboardSchema.safeParse(leaderboard) : undefined;
  const liveDuels = (live?.duels ?? []).filter((d) => !d.status || d.status === "live");
  const conversations = buildConversations({
    tick: clock.tick,
    ...(me ? { me } : {}),
    threads: allThreads,
    dealers: dealers?.dealers ?? [],
    duels: liveDuels,
    rastro: mine,
    pages: ours.album.pages,
    pageTargets: opts.pageTargets ?? [],
    memos: opts.memos ?? new Map(),
    ...(catalog ? { catalog: indexCatalog(catalog) } : {}),
    flagsFromFirstMessage: new Set(rawDealers.filter((d) => personaTypeOf(d) === "trickster").map((d) => (d as { id: string }).id)),
  });
  const known = new Set([...rawDealers.map((d) => (d as { id: string }).id), ...((levels as { levels?: { id?: string }[] } | undefined)?.levels ?? []).flatMap((l) => (l.id ? [l.id] : []))]);
  const ctx = candidateContext([...known].map((id) => {
    const d = rawDealers.find((x) => (x as { id: string }).id === id) as { name?: string } | undefined;
    return { id, ...(d?.name ? { name: d.name } : {}) };
  }), catalog);
  const corpus = opts.hintCorpus ?? [];
  const fresh = newLines([...(opts.hintSeed ?? []), ...collectRaw([allThreads, feed])], new Set(corpus.map((h) => h.key)), ctx);
  // Stored lines are re-derived with today's rules and personas, then labelled (in memory: the file only grows).
  const hintsAll = applyLabels([...corpus.map((l) => enrichLine(l, ctx)), ...fresh], opts.hintLabels ?? new Map());
  const personas = buildPersonas({
    dealers: rawDealers,
    levels,
    events,
    ...(me?.id ? { team: me.id } : {}),
    unlocked: ours.unlocked,
    conversations,
    hints: hintsByPersona(hintsAll),
    memos: opts.personaMemos ?? new Map(),
  });
  // Per-persona curve fit: prediction in each dealer conversation and estimates in each persona.
  const fit = updatePosterior(opts.posterior ?? { observations: {}, estimates: {} }, conversations, clock.tick);
  if (opts.posterior) Object.assign(opts.posterior, fit.posterior);
  for (const conv of conversations) {
    const pr = fit.predictions.get(conv.id);
    if (pr) conv.prediction = pr;
  }
  for (const p of personas) {
    const est = fit.posterior.estimates[p.id];
    if (est) p.estimates = est;
  }
  // Eggs, badges and gifts: the feed's 200 events cover only minutes, so the recorder's whole day is merged in.
  const worldEvents = mergeWorldEvents(events, recordedWorldEvents(dayDir));
  const meBadges = Array.isArray(me?.badges) ? me.badges.filter((b): b is string => typeof b === "string") : [];
  const world = worldFromFeed(worldEvents, me?.id ?? undefined, personas.map((p) => p.id), Object.keys(ours.holdings.byRef), catalog, opts.flags ?? [], meBadges);
  // Egg probes resolve from the day's egg events (structure): hit or miss, persisted with the persona memo.
  for (const p of personas) p.eggProbes = resolveProbes(p.eggProbes, world.ours.eggs.filter((e) => e.persona === p.id), clock.tick);
  // Model of each persona: the fit (estimates) writes it and it accumulates over the previous tick's.
  for (const p of personas) {
    const raw = (rawDealers.find((d) => (d as { id?: string }).id === p.id) ?? {}) as Record<string, unknown>;
    const convs = conversations.filter((c) => c.kind === "dealer" && c.counterparty === p.id);
    const hits = world.ours.flags.sent.filter((x) => x.persona === p.id && x.result === "hit");
    p.model = buildPersonaModel({
      id: p.id,
      raw,
      traits: traitsOf(raw),
      ...(p.estimates ? { estimates: p.estimates } : {}),
      strikes: convs.reduce((a, c) => a + c.mood.strikes, 0),
      cooloffs: convs.filter((c) => c.mood.cooloffUntil !== undefined).length,
      hintsFired: p.hints.filter((h) => h.candidate).length,
      eggsFired: (world.eggs.byPersona[p.id]?.foundByOthers.length ?? 0) + world.ours.eggs.filter((x) => x.persona === p.id).length,
      trapsSeen: hits.filter((x) => /deadline|rival|scarcity|pressure|fake|last one/i.test(x.reason)).length,
      switchesSeen: hits.filter((x) => /switch|lesser|lower|card/i.test(x.reason)).length,
      tick: clock.tick,
      prev: opts.personaModels?.[p.id],
    });
    if (opts.personaModels) opts.personaModels[p.id] = p.model;
  }
  const ourRow = lb?.success ? lb.data.teams.find((t) => t.team === me?.id) : undefined;
  // Values cache in the client: the disk cache enters under the hand it was saved with, then the new hand forgets every
  // set that changed; `/api/me` seeds what we hold. Seeding the disk cache after `noteHand` revived stale values.
  if (opts.valueCache?.size && opts.valueCacheHand) {
    client.noteHand(opts.valueCacheHand);
    client.seedValues(Object.fromEntries(opts.valueCache), opts.valueCacheAt ?? 0);
  }
  client.noteHand(ours.holdings.byRef);
  client.seedValues(ours.values);
  const valueCache = new Map(Object.entries(client.cachedValues()));
  const ranks = lb?.success ? new Map(lb.data.teams.map((t) => [t.team, { ...(t.rank != null ? { rank: t.rank } : {}), ...(t.score != null ? { score: t.score } : {}) }])) : opts.prevRanks ?? new Map();
  const venueInfo = buildVenues((venues?.venues ?? []) as unknown[], [{ venue: "rastro", offers }, ...otherBoards], me?.id ?? undefined, ranks);
  const priceInputs = {
    untradeable: new Set(venueInfo.filter((v) => !v.canTrade).map((v) => v.id)),
    ...(catalog ? { catalog } : {}),
    dealers: rawDealers,
    boards: [{ venue: "rastro", offers }, ...otherBoards],
    ...(me?.id ? { team: me.id } : {}),
    events,
    holdings: ours.holdings.byRef,
    pages: ours.album.pages,
    pageTargets: opts.pageTargets ?? [],
  };
  // Few value GETs per tick: cards without a value with an ask or bid in view, page cards first.
  for (const ref of valuesWanted(buildPriceSheet({ ...priceInputs, values: Object.fromEntries(valueCache) }), opts.valueFetchesPerTick ?? 4)) {
    const v = await settle(`value ${ref}`, client.value(ref));
    if (v !== undefined) valueCache.set(ref, v);
  }
  const valuation = buildValuation(me?.assets ?? [], catalog ?? undefined, valueCache);
  const prices = buildPriceSheet({ ...priceInputs, values: Object.fromEntries(valueCache), nextCopy: new Map((valuation?.cards ?? []).filter((c) => c.held > 0).map((c) => [c.ref, c.nextCopy])) });
  // Forex chains: the day's dealer deals (any team) and the live venue quotes; never takes the tick down.
  let forex: ForexState | undefined;
  try {
    forex = findChains({ tick: clock.tick, trades: updateDealerLedger(dayDir, events, clock.tick), prices, venues: venueInfo, ...(me?.id ? { team: me.id } : {}), holdings: ours.holdings.byRef, conversations });
    writeForex(dayDir, forex);
  } catch (e) {
    missing.push(`forex: ${e instanceof Error ? e.message : "error"}`);
  }
  // Other teams' collections: never takes the tick down (a failure goes to `missing`).
  let rivals: RivalsState | undefined;
  try {
    const ledger = opts.rivals ?? emptyRivalLedger();
    ingestEvents(ledger, events);
    if (leaderboard !== undefined) ingestLeaderboard(ledger, leaderboard, clock.tick);
    const perTick = opts.rivalConfirmPerTick ?? 0;
    if (perTick > 0 && catalog) {
      const lacking = new Set(
        catalog.sets.flatMap((set) => set.cards.filter((c) => (c as { page?: unknown }).page !== false && (c as { hidden?: unknown }).hidden !== true && !((ours.holdings.byRef as Record<string, number>)[c.id] ?? 0)).map((c) => c.id)),
      );
      for (const id of confirmCandidates(ledger, me?.id ?? undefined, lacking, clock.tick, perTick)) {
        const card = await settle(`card ${id}`, client.raw("GET", `/api/cards/${id}`));
        if (card !== undefined) applyCardHistory(ledger, id, card, clock.tick);
      }
    }
    rivals = rivalsView(ledger, me?.id ?? undefined, catalog);
  } catch (e) {
    missing.push(`rivals: ${e instanceof Error ? e.message : "error"}`);
  }
  // The Workshop: never takes the tick down (a failure goes to `missing`).
  let workshop: WorkshopState | undefined;
  try {
    workshop = buildWorkshop({ assets: me?.assets ?? [], ...(me?.id ? { team: me.id } : {}), threads: allThreads, myOffers, prices, ...(valuation ? { valuation: valuation.cards } : {}), events });
  } catch (e) {
    missing.push(`workshop: ${e instanceof Error ? e.message : "error"}`);
  }
  const time = buildTime(clock, schedule, leaderboard, opts.prevTime?.scheduleHash);
  const prevWeight = opts.prevTime?.round?.weight;
  if (time.round && time.round.weight === undefined && prevWeight !== undefined && opts.prevTime?.round?.n === time.round.n) time.round.weight = prevWeight;
  return {
    tick: clock.tick,
    builtAt: new Date().toISOString(),
    clock: {
      tick: clock.tick,
      ...(num(c.t_hours) !== undefined ? { tHours: num(c.t_hours)! } : {}),
      ...(clock.tick_seconds !== undefined ? { tickSeconds: clock.tick_seconds } : {}),
      paused: !!clock.paused,
      ...(str(c.doors) ? { doors: str(c.doors)! } : {}),
      ...(clock.round_name ? { roundName: clock.round_name } : {}),
      ...(clock.next_tick_in !== undefined ? { nextTickIn: clock.next_tick_in } : {}),
      ...(str(c.closes) ? { closes: str(c.closes)! } : {}),
      ...(str(c.next_opens) ? { nextOpens: str(c.next_opens)! } : {}),
    },
    limits: readLimits(clock),
    time,
    ours: {
      ...ours,
      openThreads: allThreads.filter((t) => (t.status ?? "open") === "open").map((t) => ({ id: t.id, ...(t.with ? { with: t.with } : {}), status: t.status ?? "open" })),
      cooloffs,
      ...world.ours,
    },
    markets: { prices, venues: venueInfo },
    ...(valuation ? { valuation } : {}),
    ...(forex ? { forex } : {}),
    events,
    ...(workshop ? { workshop } : {}),
    packs: buildPacks({ ...(me ? { me } : {}), ...(catalog ? { catalog } : {}), dealers: rawDealers, rastro: offers, ...(me?.id ? { team: me.id } : {}), events, values: Object.fromEntries(valueCache) }),
    hints: { all: hintsAll, fresh },
    personas,
    world: { eggs: world.eggs },
    eggPlan: eggPlanRows({ messages: recordedOurPersonaMessages(dayDir, me?.id ?? undefined), ourEggs: world.ours.eggs, tick: clock.tick }),
    news: readNewsSignals(dayDir, clock.tick),
    env: {
      schedule: scheduleSummary(schedule),
      dealers: (dealers?.dealers ?? []).map((d) => ({ id: d.id, ...(d.name ? { name: d.name } : {}), ...(d.status ? { status: d.status } : {}), ...(typeof d.level === "number" ? { level: d.level } : {}) })),
      duels: liveDuels,
      rastro: {
        offers: offers.length,
        asks: offers.filter((o) => readSide(o.give).assets.length > 0 && readSide(o.want).cash > 0).length,
        bids: offers.filter((o) => readSide(o.give).cash > 0).length,
        ours: offers.filter((o) => o.maker === me?.id).length,
      },
      myOpenOffers: mine.filter((o) => (o.status ?? "open") === "open").length,
      ...(lb?.success
        ? {
            leaderboard: {
              ...(lb.data.tick != null ? { tick: lb.data.tick } : {}),
              ...(ourRow?.rank != null ? { ourRank: ourRow.rank } : {}),
              ...(ourRow?.score != null ? { ourScore: ourRow.score } : {}),
              top: lb.data.teams.slice(0, 3).map((t) => ({ team: t.team, ...(t.name ? { name: t.name } : {}), ...(t.score != null ? { score: t.score } : {}), ...(t.rank != null ? { rank: t.rank } : {}) })),
            },
          }
        : {}),
    },
    conversations,
    missing,
    ...(rivals ? { rivals } : {}),
  };
}

function scheduleSummary(s: Schedule | undefined): GameState["env"]["schedule"] {
  if (!s) return { next: [] };
  const now = s.now_hours ?? 0;
  return {
    ...(s.now_hours !== undefined ? { nowHours: s.now_hours } : {}),
    next: s.upcoming
      .filter((u) => u.at_hours >= now)
      .sort((a, b) => a.at_hours - b.at_hours)
      .slice(0, 4)
      .map((u) => ({ atHours: u.at_hours, action: u.action, ...(u.note ? { note: u.note } : {}) })),
  };
}

/** Compact state summary for the console (no private values or duel limits). */
export function formatGameState(g: GameState): string[] {
  const c = g.clock;
  const o = g.ours;
  const s = o.score;
  const pages = o.album.pages.map((p) => `${p.set} ${p.have}/${p.of}${p.complete ? "✓" : ""}`).join(" ");
  const lines = [
    `time: ${formatTime(g.time)}`,
    `clock: tick ${c.tick}${c.tHours !== undefined ? ` · ${c.tHours.toFixed(2)} h` : ""} · ${c.tickSeconds ?? "?"} s/tick${c.paused ? " · PAUSED" : ""}${c.doors ? ` · doors ${c.doors}` : ""}${c.roundName ? ` · ${c.roundName}` : ""}${c.doors && c.doors !== "open" && c.nextOpens ? ` · opens ${c.nextOpens}` : ""}`,
    `us: ${o.name ?? o.team ?? "?"} · cash ${o.cash ?? "?"} P · level ${o.level ?? "?"} · unlocked ${o.unlocked.join(", ") || "-"}${o.frozen ? " · FROZEN" : ""}${o.venue ? ` · venue ${o.venue.id ?? "?"} (${o.venue.mechanism ?? "?"}, ${o.venue.status ?? "?"})` : ""}`,
    `album: ${pages || "-"}${o.album.filled !== undefined ? ` · ${o.album.filled}/${o.album.slots ?? "?"} slots` : ""} · ${o.holdings.cards} cards, ${o.holdings.packs} packs, ${o.holdings.spares} spares · ${Object.keys(o.values).length} private values known`,
    s
      ? `score: ${s.score ?? "?"} (negotiating ${s.negotiating ?? "?"}, market ${s.market ?? "?"}) · ladder ${s.ladder_points ?? "?"} · neg ${s.neg_points ?? "?"} · duels ${s.duel_points ?? "?"} · mm ${s.mm_points ?? "?"} · deals ${s.deals ?? "?"} · rank ${s.rank ?? "?"}`
      : "score: not available",
    `threads: ${o.openThreads.length} open${o.openThreads.length ? ` (${o.openThreads.map((t) => `#${t.id} ${t.with ?? "?"}`).join(", ")})` : ""}${o.cooloffs.length ? ` · cooloff ${o.cooloffs.map((x) => `${x.dealer} until ${x.untilTick}`).join(", ")}` : ""}${o.strikes ? ` · strikes ${JSON.stringify(o.strikes)}` : ""}`,
    `dealers: ${g.env.dealers.map((d) => `${d.id}${d.status ? ` (${d.status})` : ""}`).join(", ") || "-"} · duels live ${g.env.duels.length} · El Rastro ${g.env.rastro.offers} offers (${g.env.rastro.asks} asks, ${g.env.rastro.bids} bids, ${g.env.rastro.ours} ours) · our open offers ${g.env.myOpenOffers}`,
    `schedule: ${g.env.schedule.next.map((u) => `${u.atHours.toFixed(2)} h ${u.action}`).join(" · ") || "-"}`,
  ];
  const lb = g.env.leaderboard;
  if (lb) lines.push(`leaderboard${lb.tick !== undefined ? ` (tick ${lb.tick})` : ""}: us rank ${lb.ourRank ?? "?"} score ${lb.ourScore ?? "?"} · top ${lb.top.map((t) => `${t.rank ?? "?"}. ${t.name ?? t.team} ${t.score ?? "?"}`).join(", ")}`);
  lines.push(...formatEggsAndFlags(g.world.eggs, g.ours, g.personas));
  if (g.eggPlan.length) lines.push(`egg plan: ${g.eggPlan.map((r) => `${r.n || "-"} ${r.persona} ${r.status}${r.nextAllowedTick !== undefined ? ` (after t${r.nextAllowedTick})` : ""}`).join(" · ")}`);
  lines.push(...formatHints(g.hints.all));
  if (g.news) lines.push(...formatNewsSignals(g.news));
  lines.push("venues:", ...formatVenues(g.markets.venues));
  lines.push(...formatPriceSheet(g.markets.prices));
  if (g.rivals) lines.push(...formatRivals(g.rivals));
  lines.push(...formatPacks(g.packs));
  if (g.missing.length) lines.push(`missing: ${g.missing.join("; ")}`);
  return lines;
}

/**
 * Every venue's book as read this tick (`venue-books.json` in the day folder) for the viewer's «Venues» tab: the same
 * GETs the price sheet already makes, so the viewer adds no calls on the shared key. Best effort, atomic.
 */
function writeVenueBooks(dir: string, tick: number, venues: unknown[], books: { venue: string; offers: unknown[] }[]): void {
  try {
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "venue-books.json");
    writeFileSync(`${path}.tmp`, JSON.stringify({ tick, updated: new Date().toISOString(), venues, books }));
    renameSync(`${path}.tmp`, path);
  } catch {
    // The view is optional; a failed write never stops the tick.
  }
}
