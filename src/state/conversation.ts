import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ThreadSchema, type Me, type Thread } from "../shared/schemas.js";
import { liveTraceDir } from "../shared/trace.js";
import { negotiatorForDealer, patienceBudgetFor, traitsOf } from "../dealers/dealer-profile.js";
import { adaptiveStep, DEFAULT_NEGOTIATOR_PARAMS, nextPrice, plannedSchedule, type NegotiatorParams } from "../dealers/negotiation/negotiator.js";
import { outcomeOf } from "../dealers/history/thread-log.js";
import type { Prediction } from "../dealers/history/persona-fit.js";
import { sideOfTopic, threadPrices } from "../dealers/negotiation/view.js";
import { rivalOfferFrom, type Duel } from "../duels/schemas.js";
import { DAYS_MIN, offerForSurplus, referenceSurplus, targetSurplus, type DuelDecision, type DuelParams, type DuelState } from "../duels/duels.js";
import { readSide, type TradeOffer } from "../trades/trades.js";
import { detectFlag, detectPressure, type CatalogIndex, type FlagCandidate } from "../flags/flags.js";

/**
 * A conversation as a first-class entity: a thread with a dealer, a duel or our offer in El Rastro.
 * The structural part (prices, standing offer, phase, outcome) is rebuilt every tick from the API,
 * reading structure only (prices, offers, states), never the rival's text. What the API does not give (forced
 * phase, mood, hints, probed eggs) persists in `results/bazaar-live/<date>/conversations.json`.
 * `limits` is private: reservation, private value and `your_limit` never appear in a message.
 */

export type ConversationKind = "dealer" | "duel" | "rastro";
export type Phase = "opening" | "haggling" | "closing" | "done";
export type Goal = "ladder" | "page" | "duplicate" | "duel" | "listing" | "bid" | "other";

/** Code's decision in a tick (the figure is the one decided; `reason` is a fixed phrase from code, never from an LLM). */
export interface StrategyDecision {
  action: "accept" | "counter" | "hold" | "walk" | "wait";
  price?: number;
  days?: number;
  rule: string;
  reason: string;
  tick: number;
}

/** Strategy computed by code each tick, alongside the state. Private like `limits`: never in a message. */
export interface Strategy {
  plan: {
    anchor?: number;
    /** Expected path of our prices if the other side does not move (`plannedSchedule`; in duels, the curve). */
    plannedPath: number[];
    stepSize?: number;
    patienceBudget?: number;
    walkCondition: string;
    /** Duels: price from which we accept right away (decay and reasonable share). */
    acceptThreshold?: number;
    /** Duels with days: which day we ask for and which we give up. */
    daysPlan?: string;
  };
  lastDecision?: StrategyDecision;
  next: { priceIfTheyHold?: number; walkWhen: string };
}

export interface Conversation {
  /** `dealer:<thread>`, `duel:<id>` or `rastro:<offer>`. */
  id: string;
  kind: ConversationKind;
  /** Persona id (abuela, chato), the duel rival's alias or "rastro" (public board). */
  counterparty: string;
  asset: { ref?: string; rarity?: string; set?: string; item?: string };
  side: "buy" | "sell";
  goal: { why: Goal; expectedValue?: number };
  /** Private: never in a message. */
  limits: { reservation?: number; privateValue?: number; duelLimit?: number; daysWeight?: unknown };
  /** Structure only (prices and offers), never its text. */
  history: { herPrices: number[]; ourPrices: number[]; herAtOurMessages?: number[]; herCurrent?: { price: number; final: boolean; days?: number } };
  phase: Phase;
  /** What the other side has conceded since its first price (P, ≥ 0). */
  herConcession?: number;
  /** Our messages against the estimated patience (dealer) or duel rounds. */
  roundsUsed: number;
  patienceEstimate?: number;
  holdsUsed?: number;
  mood: { warnings: number; strikes: number; cooloffUntil?: number; kindness: number };
  /** Hints heard and eggs probed (step 3). Their text never yields a figure. */
  hints: string[];
  eggsTried: string[];
  /**
   * Patience for egg probes: `probeCostNow` 0 at the opening or after a deal (spends no patience), 1 otherwise.
   * Probes always ride along with a counteroffer (`eggProbeFor` in `src/coordinator/routes.ts`), never alone.
   */
  patience?: { roundsSpent: number; budget: number; probeCostNow: number };
  /** Text↔structure contradiction in a dealer message (see `src/flags/flags.ts`). */
  flagCandidate?: FlagCandidate;
  /** Prediction of its curve (per-persona fit, `src/dealers/history/persona-fit.ts`). Private: never in a message. */
  prediction?: Prediction;
  /** Filled in by the coordinator with the tick's budget. */
  turn: { canMessage?: boolean; canAccept?: boolean };
  result?: { outcome?: string; price?: number; ladderShare?: number; negPointsDelta?: number; score?: number };
  strategy: Strategy;
}

/** What persists between ticks because the API does not give it. */
export interface ConversationMemo {
  phaseOverride?: Phase;
  mood?: Partial<Conversation["mood"]>;
  hints?: string[];
  eggsTried?: string[];
  lastDecision?: StrategyDecision;
}

const SCHEMA = "bazaar-conversations/v1";

export function defaultConversationsFile(root: string, now: Date = new Date()): string {
  return join(liveTraceDir(root, now), "conversations.json");
}

/** Persisted memory; empty if the file does not exist or is invalid (never throws). */
export function loadConversationMemos(file: string): Map<string, ConversationMemo> {
  const out = new Map<string, ConversationMemo>();
  if (!existsSync(file)) return out;
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as { schema?: string; conversations?: Record<string, ConversationMemo> };
    if (data.schema !== SCHEMA || !data.conversations) return out;
    for (const [id, m] of Object.entries(data.conversations)) out.set(id, m);
  } catch {
    // Corrupt file: start with no memory (the structure comes from the API).
  }
  return out;
}

/** Saves the non-structural part of each conversation (atomic rename). */
export function saveConversationMemos(file: string, conversations: readonly Conversation[]): void {
  mkdirSync(dirname(file), { recursive: true });
  const memos: Record<string, ConversationMemo> = {};
  for (const c of conversations) memos[c.id] = { mood: c.mood, hints: c.hints, eggsTried: c.eggsTried, ...(c.strategy.lastDecision ? { lastDecision: c.strategy.lastDecision } : {}) };
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ schema: SCHEMA, updated: new Date().toISOString(), conversations: memos }, null, 2)}\n`);
  renameSync(tmp, file);
}

export interface ConversationInputs {
  tick: number;
  me?: Me;
  /** Threads from `/api/me/threads` as-is (with messages and offers). */
  threads: readonly unknown[];
  /** `/api/dealers` (public traits to estimate patience). */
  dealers: readonly unknown[];
  duels: readonly Duel[];
  /** Our open offers in El Rastro. */
  rastro: readonly TradeOffer[];
  /** Album pages, to know whether a card completes a page. */
  pages: readonly { set: string; have: number; of: number }[];
  /** Cards that always count as "page" (SAL-09). */
  pageTargets: readonly string[];
  memos: ReadonlyMap<string, ConversationMemo>;
  /** Indexed catalog for the flag detector; without it, there are no candidates. */
  catalog?: CatalogIndex;
  /** Personas whose detector looks from the first message (trickster). */
  flagsFromFirstMessage?: ReadonlySet<string>;
}

/**
 * Latest flag candidate of the thread: dealer messages with an attached offer, comparing text with structure (wins
 * always) and, if none, pressure phrases from the closed list in its counteroffers (with an offer and not its first
 * message). Except for the trickster, the opening is skipped. The text never yields a figure (narrow exception, see `flags.ts`).
 */
function flagCandidateOf(t: Thread, i: ConversationInputs): FlagCandidate | undefined {
  if (!i.catalog || !t.with) return undefined;
  const theirs = t.messages.filter((m) => m.sender === t.with);
  const from = i.flagsFromFirstMessage?.has(t.with) ? 0 : 1;
  // Our own egg probes in this thread ("Do you know about X?"): the dealer's reply may echo X without naming a card.
  const echoes = t.messages.filter((m) => m.sender !== t.with && m.text).flatMap((m) => [...m.text!.matchAll(/Do you know about ([^?]{3,40})\?/g)].map((x) => x[1]!));
  let found: FlagCandidate | undefined;
  let pressure: FlagCandidate | undefined;
  theirs.forEach((m, k) => {
    const msg = { ...(m.id != null ? { id: m.id } : {}), ...(m.text ? { text: m.text } : {}), ...(m.offer && typeof m.offer === "object" ? { offer: m.offer } : {}) };
    if (k >= from) {
      const f = detectFlag(msg, i.catalog!, echoes);
      if (f?.verifiable) found = f;
    }
    pressure = detectPressure(msg, k >= 1) ?? pressure;
  });
  return found ?? pressure;
}

const setOfRef = (ref: string) => ref.split("-")[0] ?? ref;
const lastN = <T>(xs: readonly T[], n = 3) => xs.slice(-n);

function copies(me: Me | undefined, ref: string): number {
  return me ? me.assets.filter((a) => a.ref === ref && (a.kind ?? "card") === "card").length : 0;
}

/** Buying `ref` completes a page (only that card is missing) or is a fixed target (SAL-09). */
export function completesPage(ref: string, me: Me | undefined, pages: ConversationInputs["pages"], pageTargets: readonly string[]): boolean {
  if (pageTargets.includes(ref)) return true;
  const page = pages.find((p) => p.set === setOfRef(ref));
  return !!page && page.have === page.of - 1 && copies(me, ref) === 0;
}

const NO_STRATEGY: Strategy = { plan: { plannedPath: [], walkCondition: "-" }, next: { walkWhen: "-" } };

function withMemo(c: Omit<Conversation, "mood" | "hints" | "eggsTried" | "strategy"> & { strategy?: Strategy }, memo: ConversationMemo | undefined, cooloffUntil?: number, warnings = 0): Conversation {
  const mood = { warnings, strikes: 0, kindness: 0, ...memo?.mood, ...(cooloffUntil !== undefined ? { cooloffUntil } : {}) };
  const strategy = { ...(c.strategy ?? NO_STRATEGY), ...(memo?.lastDecision ? { lastDecision: memo.lastDecision } : {}) };
  return { ...c, ...(memo?.phaseOverride ? { phase: memo.phaseOverride } : {}), mood, hints: memo?.hints ?? [], eggsTried: memo?.eggsTried ?? [], strategy };
}

/**
 * Strategy of a dealer thread from the negotiator (same parameters as `pnpm bazaar --serious`: the
 * dealer's profile). Estimated reservation = our private value (safety 1.0 of serious mode); without a known value, no plan.
 */
export function dealerStrategy(
  side: "buy" | "sell",
  dealerId: string,
  dealerInfo: unknown,
  history: { herPrices: readonly number[]; ourPrices: readonly number[]; herCurrent?: { price: number; final: boolean } },
  privateValue: number | undefined,
  holdsUsed = 0,
): Strategy {
  const p: NegotiatorParams = { ...DEFAULT_NEGOTIATOR_PARAMS, ...negotiatorForDealer(traitsOf(dealerInfo), dealerId) };
  const walkWhen = `after ${p.patienceBudget} msgs + ${p.maxHolds} hold(s) without her move, a final outside our limit, or a lowball (< ${p.lowballFrac} x our limit)`;
  if (privateValue === undefined) return { plan: { plannedPath: [], patienceBudget: p.patienceBudget, walkCondition: walkWhen }, next: { walkWhen } };
  const reservation = side === "buy" ? Math.floor(privateValue) : Math.ceil(privateValue);
  const herOpening = history.herPrices[0];
  const base = { side, reservation, ...(herOpening !== undefined ? { herOpening } : {}) };
  const path = plannedSchedule(base, p);
  const last = history.ourPrices.at(-1);
  const gap = last === undefined ? undefined : (side === "buy" ? 1 : -1) * (reservation - last);
  const next = nextPrice(
    { ...base, herPrices: history.herPrices, ourPrices: history.ourPrices, ...(history.herCurrent ? { herCurrent: { offerId: 0, ...history.herCurrent } } : {}), canMessage: true, canAccept: true, holdsUsed },
    p,
  );
  const msgsLeft = Math.max(0, p.patienceBudget - history.ourPrices.length);
  return {
    plan: {
      ...(path[0] !== undefined ? { anchor: path[0] } : {}),
      plannedPath: path,
      ...(gap !== undefined && gap > 0 ? { stepSize: adaptiveStep(gap, history.ourPrices.length, p) } : {}),
      patienceBudget: p.patienceBudget,
      walkCondition: walkWhen,
    },
    next: { ...(next ? { priceIfTheyHold: next.price } : {}), walkWhen: msgsLeft > 0 ? `${msgsLeft} msg(s) of patience left, then hold ${p.maxHolds} and walk` : `patience spent: hold ${p.maxHolds} then walk` },
  };
}

function dealerConversations(i: ConversationInputs): Conversation[] {
  const out: Conversation[] = [];
  const selfId = i.me?.id ?? undefined;
  for (const raw of i.threads) {
    const parsed = ThreadSchema.safeParse(raw);
    if (!parsed.success) continue;
    const t = parsed.data;
    const side = sideOfTopic(t.topic);
    if (!side || !t.with) continue;
    const dealerInfo = i.dealers.find((d) => (d as { id?: unknown }).id === t.with) as { id: string; name?: string } | undefined;
    const ref = { id: t.with, aliases: [...(dealerInfo?.name ? [dealerInfo.name] : []), "persona", "dealer"] };
    const p = threadPrices(t, side, ref, selfId);
    const topic = t.topic as { buy?: { card?: string; rarity?: string; set?: string }; sell?: { assets?: number[] } };
    const soldAsset = topic.sell?.assets?.[0] !== undefined ? i.me?.assets.find((a) => a.id === topic.sell!.assets![0]) : undefined;
    const cardRef = topic.buy?.card ?? soldAsset?.ref;
    const item = (raw as { item?: unknown }).item;
    const asset = {
      ...(cardRef ? { ref: cardRef } : {}),
      ...(topic.buy?.rarity ? { rarity: topic.buy.rarity } : soldAsset?.rarity ? { rarity: soldAsset.rarity } : cardRef && i.catalog?.byId.get(cardRef)?.rarity ? { rarity: i.catalog.byId.get(cardRef)!.rarity! } : {}),
      ...(topic.buy?.set ? { set: topic.buy.set } : cardRef ? { set: setOfRef(cardRef) } : {}),
      ...(typeof item === "string" ? { item } : {}),
    };
    const privateValue = cardRef ? i.me?.assets.find((a) => a.ref === cardRef && typeof a.your_value === "number")?.your_value ?? undefined : undefined;
    const why: Goal = side === "sell" ? (cardRef && copies(i.me, cardRef) > 1 ? "duplicate" : "other") : cardRef && completesPage(cardRef, i.me, i.pages, i.pageTargets) ? "page" : "ladder";
    // Levels 3–5 (or no trait): unknown patience, measured; for the phase the default (6) is assumed.
    const known = patienceBudgetFor(traitsOf(dealerInfo));
    const patience = known ?? 6;
    const done = t.status !== "open";
    const rounds = p.ourPrices.length;
    const phase: Phase = done ? "done" : p.herCurrent?.final || rounds >= patience - 1 ? "closing" : rounds === 0 ? "opening" : "haggling";
    const herConcession = p.herPrices.length > 1 ? Math.abs(p.herPrices[0]! - p.herPrices.at(-1)!) : 0;
    const price = p.herCurrent?.price ?? p.herPrices.at(-1);
    const ev = privateValue !== undefined && price !== undefined ? (side === "buy" ? privateValue - price : price - privateValue) : undefined;
    const reason = t.closed_reason ?? undefined;
    const flag = flagCandidateOf(t, i);
    const strategy = done ? undefined : dealerStrategy(side, t.with, dealerInfo, { herPrices: p.herPrices, ourPrices: p.ourPrices, ...(p.herCurrent ? { herCurrent: { price: p.herCurrent.price, final: p.herCurrent.final } } : {}) }, privateValue);
    out.push(
      withMemo(
        {
          id: `dealer:${t.id}`,
          kind: "dealer",
          counterparty: t.with,
          asset,
          side,
          goal: { why, ...(ev !== undefined ? { expectedValue: Math.round(ev * 10) / 10 } : {}) },
          limits: { ...(privateValue !== undefined ? { privateValue } : {}) },
          history: { herPrices: p.herPrices, ourPrices: p.ourPrices, ...(p.herCurrent ? { herCurrent: { price: p.herCurrent.price, final: p.herCurrent.final } } : {}) },
          phase,
          herConcession,
          roundsUsed: rounds,
          ...(known !== undefined ? { patienceEstimate: known } : {}),
          patience: { roundsSpent: rounds, budget: patience, probeCostNow: phase === "opening" || t.status === "deal" ? 0 : 1 },
          ...(flag ? { flagCandidate: flag } : {}),
          turn: {},
          ...(strategy ? { strategy } : {}),
          ...(done ? { result: { outcome: outcomeOf(t.status, reason), ...(t.status === "deal" && price !== undefined ? { price } : {}) } } : {}),
        },
        i.memos.get(`dealer:${t.id}`),
        reason === "cooloff" && typeof t.until_tick === "number" ? t.until_tick : undefined,
        reason && /warn|strike|anti_cheat|spam|inject/i.test(reason) ? 1 : 0,
      ),
    );
  }
  return out;
}

function duelConversations(i: ConversationInputs): Conversation[] {
  return i.duels.map((d) => {
    const msgs = d.messages ?? [];
    const isRival = (m: (typeof msgs)[number]) => {
      const who = m.from ?? m.sender;
      return who != null && who !== "you";
    };
    const herPrices = msgs.filter((m) => isRival(m) && typeof m.price === "number").map((m) => m.price!);
    const ourPrices = msgs.filter((m) => (m.from ?? m.sender) === "you" && typeof m.price === "number").map((m) => m.price!);
    const rival = rivalOfferFrom(d);
    const deadline = typeof d.deadline === "number" && d.deadline < 1e9 ? d.deadline : undefined;
    const left = deadline !== undefined ? deadline - i.tick : undefined;
    const done = !!d.status && d.status !== "live";
    const phase: Phase = done ? "done" : left !== undefined && left <= 3 ? "closing" : ourPrices.length === 0 ? "opening" : "haggling";
    const sign = d.role === "seller" ? 1 : -1;
    const raw = d as Duel & { item?: unknown; result?: unknown; price?: unknown };
    return withMemo(
      {
        id: `duel:${d.id}`,
        kind: "duel",
        counterparty: d.rival ?? "?",
        asset: typeof raw.item === "string" ? { item: raw.item } : {},
        side: d.role === "seller" ? "sell" : "buy",
        goal: { why: "duel", ...(rival ? { expectedValue: sign * (rival.price - d.your_limit) } : {}) },
        limits: { duelLimit: d.your_limit, ...(d.your_days_weight != null ? { daysWeight: d.your_days_weight } : {}) },
        history: { herPrices, ourPrices, ...(rival ? { herCurrent: { price: rival.price, final: false, ...(rival.days !== undefined ? { days: rival.days } : {}) } } : {}) },
        phase,
        herConcession: herPrices.length > 1 ? Math.abs(herPrices[0]! - herPrices.at(-1)!) : 0,
        roundsUsed: typeof d.round === "number" ? d.round : Math.min(ourPrices.length, herPrices.length),
        turn: {},
        ...(done ? { result: { outcome: d.status ?? "done", ...(typeof raw.price === "number" ? { price: raw.price } : {}), ...(typeof raw.result === "number" ? { score: raw.result } : {}) } } : {}),
      },
      i.memos.get(`duel:${d.id}`),
    );
  });
}

function rastroConversations(i: ConversationInputs): Conversation[] {
  return i.rastro
    .filter((o) => o.venue === "rastro" && o.thread == null && (o.status ?? "open") === "open")
    .map((o) => {
      const give = readSide(o.give);
      const want = readSide(o.want);
      const selling = give.assets.length > 0;
      const ref = selling ? (give.assets[0]?.ref ?? undefined) : want.cards[0];
      const price = selling ? want.cash : give.cash;
      const why: Goal = selling ? (ref && copies(i.me, ref) > 1 ? "duplicate" : "listing") : ref && completesPage(ref, i.me, i.pages, i.pageTargets) ? "page" : "bid";
      const value = ref ? i.me?.assets.find((a) => a.ref === ref && typeof a.your_value === "number")?.your_value ?? undefined : undefined;
      return withMemo(
        {
          id: `rastro:${o.id}`,
          kind: "rastro",
          counterparty: "rastro",
          asset: ref ? { ref, set: setOfRef(ref) } : {},
          side: selling ? "sell" : "buy",
          goal: { why },
          limits: { ...(value !== undefined ? { privateValue: value } : {}) },
          history: { herPrices: [], ourPrices: price > 0 ? [price] : [] },
          phase: "opening",
          roundsUsed: 0,
          turn: {},
        },
        i.memos.get(`rastro:${o.id}`),
      );
    });
}

/**
 * Strategy of a duel from policy v2 (`decideDuel`): anchor, price curve per round, acceptance threshold
 * (the larger of `acceptShare` × opening surplus and the next offer discounted by one round of decay) and day plan.
 */
export function duelStrategy(state: DuelState, params: DuelParams, decision: DuelDecision, tick: number): Strategy {
  const sign = state.role === "seller" ? 1 : -1;
  const path: number[] = [];
  for (let r = 0; r <= params.maxRounds; r++) {
    const price = offerForSurplus(state, targetSurplus(state, params, r)).price;
    if (path.at(-1) !== price) path.push(price);
  }
  const decay = state.decay ?? params.decay;
  const round = state.ourOffers.length;
  const nextTarget = targetSurplus(state, params, round);
  const acceptSurplus = Math.max(params.minSurplus, params.acceptShare * referenceSurplus(state, params), (1 - decay) ** params.acceptLookahead * nextTarget);
  const best = DAYS_MIN + state.daysValue.indexOf(Math.max(...state.daysValue));
  const walk = "never outside our limit; never two concessions without a rival counter; last tick: accept anything >= min surplus";
  const action: StrategyDecision["action"] = decision.action === "accept" ? "accept" : decision.action === "wait" ? "wait" : decision.offer && state.ourOffers.at(-1)?.price === decision.offer.price ? "hold" : "counter";
  const price = decision.action === "accept" ? state.rivalOffers.at(-1)?.price : decision.offer?.price;
  const days = decision.action === "accept" ? state.rivalOffers.at(-1)?.days : decision.offer?.days;
  const reason =
    decision.rule === "accept-share" ? "rival offer already gives a reasonable share" :
    decision.rule === "accept-decay" ? "rival offer beats our next offer after one round of decay" :
    decision.rule === "waiting-for-rival" ? "no new rival offer: we do not concede again" :
    decision.rule === "silent-concede" ? "one concession to a silent rival" :
    decision.rule === "endgame" ? "deadline close: split the difference" :
    decision.rule === "opening" ? "opening anchor" :
    decision.action === "accept" ? "engine acceptance (AC_next)" : "concession curve";
  return {
    plan: {
      ...(path[0] !== undefined ? { anchor: path[0] } : {}),
      plannedPath: path,
      ...(path.length > 1 ? { stepSize: Math.abs(path[1]! - path[0]!) } : {}),
      patienceBudget: params.maxRounds,
      walkCondition: walk,
      acceptThreshold: Math.round(state.limit + sign * acceptSurplus),
      ...(state.withDays ? { daysPlan: `ask day ${best} (our best); give days toward the rival's when it costs us less than the price we get` } : {}),
    },
    lastDecision: { action, ...(price !== undefined ? { price } : {}), ...(days !== undefined && state.withDays ? { days } : {}), rule: decision.rule, reason, tick },
    next: {
      ...(state.ourOffers.at(-1) ? { priceIfTheyHold: decision.action === "counter" && decision.offer ? decision.offer.price : state.ourOffers.at(-1)!.price } : {}),
      walkWhen: state.ticksLeft !== undefined ? `no walk: hold to the deadline (${state.ticksLeft} ticks left)` : "no walk: hold to the deadline",
    },
  };
}

/** All the tick's conversations: dealer threads, live duels and our open offers in El Rastro. */
export function buildConversations(i: ConversationInputs): Conversation[] {
  return [...duelConversations(i), ...dealerConversations(i), ...rastroConversations(i)];
}

/** One line per conversation (no private limits): kind, counterparty, asset, phase, latest prices and turn. */
export function formatConversation(c: Conversation): string {
  const asset = c.asset.ref ?? c.asset.item ?? (c.asset.rarity ? `${c.asset.rarity} ${c.asset.set ?? ""}`.trim() : "?");
  const her = c.history.herCurrent ? `${c.history.herCurrent.price}${c.history.herCurrent.final ? "F" : ""}` : "-";
  const turn = c.turn.canMessage === undefined && c.turn.canAccept === undefined ? "turn -" : `turn msg ${c.turn.canMessage ? "yes" : "no"}/accept ${c.turn.canAccept ? "yes" : "no"}`;
  const result = c.result ? ` · ${c.result.outcome ?? "?"}${c.result.price !== undefined ? ` @ ${c.result.price}` : ""}${c.result.score !== undefined ? ` (score ${c.result.score})` : ""}` : "";
  const d = c.strategy.lastDecision;
  const decision = d ? ` · last ${d.action}${d.price !== undefined ? ` ${d.price}${d.days !== undefined ? `/d${d.days}` : ""}` : ""} (${d.rule}: ${d.reason}, tick ${d.tick})` : "";
  const plan = c.strategy.plan.plannedPath.length ? ` · path [${c.strategy.plan.plannedPath.join(", ")}]` : "";
  const next = c.strategy.next.priceIfTheyHold !== undefined ? ` · next ${c.strategy.next.priceIfTheyHold} if they hold` : "";
  const flag = c.flagCandidate ? ` · FLAG? msg ${c.flagCandidate.messageId}${c.flagCandidate.tactic ? ` (${c.flagCandidate.tactic}, needs approval)` : ""}` : "";
  const probe = c.patience && c.phase !== "done" ? ` · probe cost ${c.patience.probeCostNow}` : "";
  const pr = c.prediction;
  const fit = pr && c.phase !== "done" ? ` · fit${pr.herNext !== undefined ? ` next ${pr.herNext}` : ""} limit ${pr.herLimit.mean} [${pr.herLimit.lo}–${pr.herLimit.hi}]` : "";
  return `${c.id} · ${c.kind} ${c.counterparty} · ${c.side} ${asset} · ${c.goal.why} · ${c.phase} (${c.roundsUsed}${c.patienceEstimate !== undefined ? `/${c.patienceEstimate}` : ""}) · ours [${lastN(c.history.ourPrices).join(", ")}] her [${lastN(c.history.herPrices).join(", ")}] now ${her} · ${turn}${result}${c.mood.cooloffUntil !== undefined ? ` · cooloff until ${c.mood.cooloffUntil}` : ""}${decision}${plan}${next}${fit}${probe}${flag}`;
}
