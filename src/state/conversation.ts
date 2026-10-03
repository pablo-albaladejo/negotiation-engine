import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ThreadSchema, type Me, type Thread } from "../shared/schemas.js";
import { liveTraceDir } from "../shared/trace.js";
import { negotiatorForDealer, patienceBudgetFor, traitsOf } from "../dealers/dealer-profile.js";
import { adaptiveStep, DEFAULT_NEGOTIATOR_PARAMS, nextPrice, plannedSchedule, type NegotiatorParams } from "../dealers/negotiation/negotiator.js";
import { outcomeOf } from "../dealers/history/thread-log.js";
import { sideOfTopic, threadPrices } from "../dealers/negotiation/view.js";
import { rivalOfferFrom, type Duel } from "../duels/schemas.js";
import { DAYS_MIN, offerForSurplus, openingSurplus, targetSurplus, type DuelDecision, type DuelParams, type DuelState } from "../duels/duels.js";
import { readSide, type TradeOffer } from "../trades/trades.js";
import { detectFlag, detectPressure, type CatalogIndex, type FlagCandidate } from "../flags/flags.js";

/**
 * Una conversación como entidad de primera clase: hilo con un dealer, duelo u oferta nuestra en El Rastro.
 * La parte estructural (precios, oferta vigente, fase, resultado) se reconstruye en cada tick desde la API,
 * leyendo solo estructura (precios, ofertas, estados), nunca el texto del rival. Lo que la API no da (fase
 * forzada, ánimo, pistas, eggs probados) persiste en `results/bazaar-live/<fecha>/conversations.json`.
 * `limits` es privado: reserva, valor privado y `your_limit` nunca salen en un mensaje.
 */

export type ConversationKind = "dealer" | "duel" | "rastro";
export type Phase = "opening" | "haggling" | "closing" | "done";
export type Goal = "ladder" | "page" | "duplicate" | "duel" | "listing" | "bid" | "other";

/** Decisión del código en un tick (la cifra es la decidida; `reason` es una frase fija del código, nunca de un LLM). */
export interface StrategyDecision {
  action: "accept" | "counter" | "hold" | "walk" | "wait";
  price?: number;
  days?: number;
  rule: string;
  reason: string;
  tick: number;
}

/** Estrategia calculada por código cada tick, junto al estado. Privada como `limits`: nunca en un mensaje. */
export interface Strategy {
  plan: {
    anchor?: number;
    /** Camino previsto de nuestros precios si el otro no se mueve (`plannedSchedule`; en duelos, la curva). */
    plannedPath: number[];
    stepSize?: number;
    patienceBudget?: number;
    walkCondition: string;
    /** Duelos: precio a partir del cual aceptamos ya (decay y parte razonable). */
    acceptThreshold?: number;
    /** Duelos con días: qué día pedimos y cuál cedemos. */
    daysPlan?: string;
  };
  lastDecision?: StrategyDecision;
  next: { priceIfTheyHold?: number; walkWhen: string };
}

export interface Conversation {
  /** `dealer:<thread>`, `duel:<id>` o `rastro:<offer>`. */
  id: string;
  kind: ConversationKind;
  /** Id de la persona (abuela, chato), alias del rival del duelo o "rastro" (tablón público). */
  counterparty: string;
  asset: { ref?: string; rarity?: string; set?: string; item?: string };
  side: "buy" | "sell";
  goal: { why: Goal; expectedValue?: number };
  /** Privado: nunca en un mensaje. */
  limits: { reservation?: number; privateValue?: number; duelLimit?: number; daysWeight?: unknown };
  /** Solo estructura (precios y ofertas), nunca su texto. */
  history: { herPrices: number[]; ourPrices: number[]; herAtOurMessages?: number[]; herCurrent?: { price: number; final: boolean; days?: number } };
  phase: Phase;
  /** Lo que el otro lado ha cedido desde su primer precio (P, ≥ 0). */
  herConcession?: number;
  /** Mensajes nuestros frente a la paciencia estimada (dealer) o rondas del duelo. */
  roundsUsed: number;
  patienceEstimate?: number;
  holdsUsed?: number;
  mood: { warnings: number; strikes: number; cooloffUntil?: number; kindness: number };
  /** Pistas oídas y eggs probados (paso 3). Su texto nunca da una cifra. */
  hints: string[];
  eggsTried: string[];
  /**
   * Paciencia para probes de eggs: `probeCostNow` 0 en la apertura o tras un trato (no gasta paciencia), 1 si no.
   * Los probes van siempre a caballo de una contraoferta (`eggProbeFor` en `src/coordinator/routes.ts`), nunca solos.
   */
  patience?: { roundsSpent: number; budget: number; probeCostNow: number };
  /** Contradicción texto↔estructura en un mensaje del dealer (ver `src/flags/flags.ts`). */
  flagCandidate?: FlagCandidate;
  /** Lo rellena el coordinador con el presupuesto del tick. */
  turn: { canMessage?: boolean; canAccept?: boolean };
  result?: { outcome?: string; price?: number; ladderShare?: number; negPointsDelta?: number; score?: number };
  strategy: Strategy;
}

/** Lo que persiste entre ticks porque la API no lo da. */
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

/** Memoria persistida; vacía si el fichero no existe o no es válido (nunca lanza). */
export function loadConversationMemos(file: string): Map<string, ConversationMemo> {
  const out = new Map<string, ConversationMemo>();
  if (!existsSync(file)) return out;
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as { schema?: string; conversations?: Record<string, ConversationMemo> };
    if (data.schema !== SCHEMA || !data.conversations) return out;
    for (const [id, m] of Object.entries(data.conversations)) out.set(id, m);
  } catch {
    // Fichero corrupto: se arranca sin memoria (la estructura sale de la API).
  }
  return out;
}

/** Guarda la parte no estructural de cada conversación (rename atómico). */
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
  /** Hilos de `/api/me/threads` tal cual (con mensajes y ofertas). */
  threads: readonly unknown[];
  /** `/api/dealers` (rasgos públicos para estimar la paciencia). */
  dealers: readonly unknown[];
  duels: readonly Duel[];
  /** Nuestras ofertas abiertas en El Rastro. */
  rastro: readonly TradeOffer[];
  /** Páginas del álbum, para saber si una carta completa página. */
  pages: readonly { set: string; have: number; of: number }[];
  /** Cartas que siempre cuentan como «página» (SAL-09). */
  pageTargets: readonly string[];
  memos: ReadonlyMap<string, ConversationMemo>;
  /** Catálogo indexado para el detector de flags; sin él, no hay candidatos. */
  catalog?: CatalogIndex;
  /** Personas cuyo detector mira desde el primer mensaje (trickster). */
  flagsFromFirstMessage?: ReadonlySet<string>;
}

/**
 * Último candidato a flag del hilo: mensajes del dealer con oferta adjunta, comparando texto con estructura (gana
 * siempre) y, si no hay, frases de presión de la lista cerrada en sus contraofertas (con oferta y no su primer
 * mensaje). Salvo trickster, la apertura se salta. El texto nunca da una cifra (excepción estrecha, ver `flags.ts`).
 */
function flagCandidateOf(t: Thread, i: ConversationInputs): FlagCandidate | undefined {
  if (!i.catalog || !t.with) return undefined;
  const theirs = t.messages.filter((m) => m.sender === t.with);
  const from = i.flagsFromFirstMessage?.has(t.with) ? 0 : 1;
  let found: FlagCandidate | undefined;
  let pressure: FlagCandidate | undefined;
  theirs.forEach((m, k) => {
    const msg = { ...(m.id != null ? { id: m.id } : {}), ...(m.text ? { text: m.text } : {}), ...(m.offer && typeof m.offer === "object" ? { offer: m.offer } : {}) };
    if (k >= from) {
      const f = detectFlag(msg, i.catalog!);
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

/** Comprar `ref` completa una página (le falta solo esa carta) o es un objetivo fijo (SAL-09). */
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
 * Estrategia de un hilo con un dealer desde el negociador (mismos parámetros que `pnpm bazaar --serious`: perfil del
 * dealer). Reserva estimada = nuestro valor privado (safety 1,0 del modo serio); sin valor conocido, sin plan.
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
      ...(topic.buy?.rarity ? { rarity: topic.buy.rarity } : soldAsset?.rarity ? { rarity: soldAsset.rarity } : {}),
      ...(topic.buy?.set ? { set: topic.buy.set } : cardRef ? { set: setOfRef(cardRef) } : {}),
      ...(typeof item === "string" ? { item } : {}),
    };
    const privateValue = cardRef ? i.me?.assets.find((a) => a.ref === cardRef && typeof a.your_value === "number")?.your_value ?? undefined : undefined;
    const why: Goal = side === "sell" ? (cardRef && copies(i.me, cardRef) > 1 ? "duplicate" : "other") : cardRef && completesPage(cardRef, i.me, i.pages, i.pageTargets) ? "page" : "ladder";
    const patience = patienceBudgetFor(traitsOf(dealerInfo)) ?? 6;
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
          patienceEstimate: patience,
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
 * Estrategia de un duelo desde la política v2 (`decideDuel`): ancla, curva de precios por ronda, umbral de aceptación
 * (el mayor de `acceptShare` × excedente de apertura y la siguiente oferta descontada una ronda de decay) y plan de días.
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
  const acceptSurplus = Math.max(params.minSurplus, params.acceptShare * openingSurplus(state, params), (1 - decay) ** params.acceptLookahead * nextTarget);
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

/** Todas las conversaciones del tick: hilos con dealers, duelos vivos y nuestras ofertas abiertas en El Rastro. */
export function buildConversations(i: ConversationInputs): Conversation[] {
  return [...duelConversations(i), ...dealerConversations(i), ...rastroConversations(i)];
}

/** Una línea por conversación (sin límites privados): tipo, contraparte, activo, fase, últimos precios y turno. */
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
  return `${c.id} · ${c.kind} ${c.counterparty} · ${c.side} ${asset} · ${c.goal.why} · ${c.phase} (${c.roundsUsed}${c.patienceEstimate !== undefined ? `/${c.patienceEstimate}` : ""}) · ours [${lastN(c.history.ourPrices).join(", ")}] her [${lastN(c.history.herPrices).join(", ")}] now ${her} · ${turn}${result}${c.mood.cooloffUntil !== undefined ? ` · cooloff until ${c.mood.cooloffUntil}` : ""}${decision}${plan}${next}${probe}${flag}`;
}
