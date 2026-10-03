import { BazaarError, type BazaarClient } from "../shared/client.js";
import { closeText, counterText, holdText, textMatchesPrice } from "./negotiation/messages.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, mirrorVerdict, stepResponses, type Decision, type NegotiatorParams, type ThreadView } from "./negotiation/negotiator.js";
import { applyOnly, chaseCandidates, formatPlan, menuBlocks, nextCopyValue, PACK_SAFETY, rankCandidates, selectCandidates, UNLOCK_CHASE_TOLERANCE, type OnlyFilter, type PageImpact } from "./planning/plan.js";
import { readValueRules } from "../trades/trades.js";
import { buyTargets, missingPageCards, raritySetTargets, rarityOf, spareTargets, type Target } from "./planning/planner.js";
import { StandingOfferSchema, type Catalog, type Clock, type DealerInfo, type Me, type Thread } from "../shared/schemas.js";
import { formatPatience, PatienceLog } from "./negotiation/patience.js";
import type { TraceRecord, TraceSink } from "../shared/trace.js";
import { gameHours, WELCOME_FIRST_DEAL_PAST } from "./dealer-profile.js";
import { TeamBudget } from "./team.js";
import { copiesOf, formatThreadSummary, outcomeOf, revealedCards, valueCreated, type ThreadOutcome, type ThreadSummary } from "./history/thread-log.js";
import { isDealer, sideOfTopic, threadPrices, type DealerRef } from "./negotiation/view.js";
import { checkStructure, dealerOffers, expectationOf, firstMismatch } from "./negotiation/offer-structure.js";
import { busyAssets, sellBlocked } from "../shared/asset-locks.js";

/**
 * Observe → decide → act loop against one dealer, one thread at a time. Every figure comes from
 * `decide`; the text comes from templates with the same figure. In `dryRun` it makes no POST.
 */

export type BazaarApi = Pick<BazaarClient, "me" | "catalog" | "value" | "myThreads" | "myOffers" | "thread" | "openThread" | "say" | "closeThread" | "accept">;

/** What the agent is about to send (a POST), so the coordinator can arbitrate it first. Local use only: it carries our private value. */
export interface DealerIntent {
  dealer: string;
  kind: "open" | "accept" | "counter" | "hold" | "close";
  thread?: number;
  /** Target key (`buy:SAL-09`, `sell:438`...). */
  target: string;
  side: "buy" | "sell";
  /** Price of her offer that we accept, or of our counteroffer. */
  price?: number;
  /** Our private value of what is bought or sold (never leaves in a message). */
  value?: number;
  /** Cards involved (the requested one, the one revealed on rarity+set, or the asset we sell). */
  cards: string[];
  text?: string;
  rule?: string;
}

export interface AgentOptions {
  dealer: DealerRef;
  dryRun: boolean;
  /** Maximum spend per game-clock hour on purchases (P). */
  maxSpendPerHour: number;
  /** Fraction of your_value that we pay at most. */
  safety?: number;
  maxLookups?: number;
  /** Overrides negotiator parameters (anchor, Boulware, holds...); the rest stays at defaults. */
  negotiator?: Partial<NegotiatorParams>;
  /** Dealer record: with it, targets come from the menu planner (`plan.ts`); without it, from the legacy one. */
  menu?: DealerInfo;
  /** Serious mode: without the dealer record nothing is opened (the legacy planner sells to anyone, ignoring her menu). */
  requireMenu?: boolean;
  /** Run caps: deals (stops on reaching), total open conversations, and purchase spend. */
  maxDeals?: number;
  maxThreads?: number;
  maxSpendTotal?: number;
  /** `--only`: only these menu-planner targets, in this order (even if they leave no room over her list). */
  only?: readonly OnlyFilter[];
  /** Caps shared between dealers (spend, cash floor, one accept per tick); if missing, its own. */
  team?: TeamBudget;
  /** Deals per game hour with this dealer (`menu.deals_per_team_per_hour`); on reaching it, no more are opened until the hour passes. */
  dealsPerHour?: number;
  /** Summary of each finished conversation (cards, copies, opening/final, patience...). */
  onThreadSummary?: (s: ThreadSummary) => void;
  trace: TraceSink;
  now?: () => number;
  log?: (line: string) => void;
  /**
   * Coordinator (`pnpm bazaar:play`): every POST (open, accept, counteroffer, hold, close) goes through here first;
   * if it returns false nothing is sent and the thread state doesn't change. Without `gate`, the agent acts alone (as always).
   */
  gate?: (intent: DealerIntent) => boolean;
  /**
   * Egg probe riding on a counteroffer (never a separate message): phrase X for «Do you know about X?» in this
   * thread, or `undefined`. The coordinator decides it (one per conversation, never the same X with the same persona).
   */
  probe?: (thread: number) => string | undefined;
  /** Called after sending (live) a counteroffer with a probe, to record it in `eggsTried`. */
  onProbe?: (thread: number, phrase: string) => void;
  /** Cap on our offers by her predicted limit (per-persona adjustment, `offerCap`); `undefined` without a prediction. */
  herLimitCap?: (thread: number) => number | undefined;
  /**
   * `firstStepFrac` of this tick for this dealer (see `NegotiatorParams`): the coordinator enables it only if the mirror of
   * her persona holds. Without it, the one from `negotiator`/defaults applies (0: off).
   */
  firstStepFrac?: () => number;
  /** β of her persona's curve at this tick (`PersonaModel`): with β < 1 the fixed price is not applied. */
  herBeta?: () => number | undefined;
  /**
   * Unlock chase: the persona (e.g. "pilar") that a deal with THIS dealer would unlock early (active, not unlocked for us,
   * `early_deals_with` = this dealer, our level ≥ `early_min_level`), or `undefined`. With no target with room, the agent
   * then opens the least harmful deal within `UNLOCK_CHASE_TOLERANCE` (`chaseCandidates`), one at a time.
   */
  unlockChase?: () => string | undefined;
  /** Our estimated value of a pack type (coordinator: `GameState.packs`); with it the planner also proposes `{buy: {pack}}`. */
  packValueOf?: (pack: string) => number | undefined;
  /** Allow blind buys (rarity+set and packs); off by default (`RankInput.blindBuys`). */
  blindBuys?: boolean;
  /** `--page-targets`: only these complete a page with its bonus (`RankInput.pageTargets`); without it, none does. */
  pageTargets?: readonly string[];
  /** `--page-bonus-scored` (`RankInput.pageBonusScored`): without it a page target is valued at its base. */
  pageBonusScored?: boolean;
}

/** Card a buy target asks for by name (`{buy: {card}}`), if any. */
const buyCardOf = (t: Target): string | undefined => (t.side === "buy" ? (t.topic as { buy?: { card?: unknown } }).buy?.card : undefined) as string | undefined;

interface Active {
  id: number;
  target: Target;
  lastSentTick?: number;
  /** Prices we have sent in this thread (reliable source; the thread is only used when resuming it). */
  sent: number[];
  /** Holds (same price, no new offer) already spent in this thread. */
  holdsUsed: number;
  /** Messages, replies, ticks until her end and her response to each of our steps. */
  patience: PatienceLog;
  openTick?: number;
  openTs?: string;
  /** Cards of the conversation and copies we held at opening; asset ids at opening (to see what arrived). */
  cards: string[];
  copiesBefore: Record<string, number>;
  assetIds?: Set<number>;
  negBefore?: number;
  ladderBefore?: number;
  /** Rarity+set: card she offers, already revalued at our value. */
  revealed?: string;
  /** Copies of `revealed` we already hold: a duplicate priced above our limit is walked (`named-card-revalue`). */
  revealedHeld?: number;
  lastRule?: string;
  /** Purchase we accept ourselves: its price was already counted in the budget (not counted twice on close). */
  acceptedPrice?: number;
  /** Our last message was text only (hold): never two in a row without an offer. */
  lastTextOnly?: boolean;
  /** The team's first conversation with this dealer (`welcome_first_deal`: her opening is her limit). */
  welcome?: boolean;
  /** Price accepted with `welcome-first-deal`: her measured limit for this dealer and this band. */
  measuredLimit?: number;
  /** Persona this conversation chases (unlock chase): its tolerance applies only while she is still locked for us. */
  chase?: string;
}

const STOP_CODES = new Set(["sold_out", "locked", "asset_locked", "insufficient_cash", "invalid", "not_found", "http_404", "closed"]);

export class BazaarAgent {
  private active: Active | undefined;
  /** Game hour until which the dealer's hourly quota is spent (`persona_quota`): its allotment is per game hour, not per wall-clock hour. */
  private blockedUntilHour = -1;
  private cooloffUntilTick = -1;
  private readonly skip = new Map<string, number>();
  private readonly team: TeamBudget;
  /** Game hours of each deal with this dealer (hourly quota). */
  private readonly dealHours: number[] = [];
  private hoursNow = 0;
  private lastCash: number | undefined;
  /** Cash at the previous step: if a deal closes with no visible price, the cash drop is what was spent. */
  private prevCash: number | undefined;
  private catalog: Catalog | undefined;
  /** If the dealer rejects `{buy: {card}}`, we buy by rarity and set. */
  private cardTopicOk = true;
  /** If the dealer rejects `{buy: {pack}}` (400/422), no more pack buys with it this run. */
  private packTopicOk = true;
  /** Game hours of each pack deal, per pack type (`per_team_per_hour`). */
  private readonly packHours = new Map<string, number[]>();
  private readonly now: () => number;
  private readonly log: (line: string) => void;
  private readonly safety: number;
  private readonly maxLookups: number;
  private readonly negotiatorParams: NegotiatorParams;
  private threadsOpened = 0;
  private dealsDone = 0;
  private spentRun = 0;

  constructor(
    private readonly api: BazaarApi,
    private readonly o: AgentOptions,
  ) {
    this.now = o.now ?? Date.now;
    this.log = o.log ?? (() => {});
    this.safety = o.safety ?? 0.85;
    this.maxLookups = o.maxLookups ?? 12;
    this.negotiatorParams = { ...DEFAULT_NEGOTIATOR_PARAMS, ...o.negotiator };
    this.team = o.team ?? new TeamBudget({ maxSpendPerHour: o.maxSpendPerHour, ...(o.maxSpendTotal !== undefined ? { maxSpendTotal: o.maxSpendTotal } : {}), now: this.now });
  }

  private allow(intent: Omit<DealerIntent, "dealer">): boolean {
    return this.o.gate ? this.o.gate({ dealer: this.o.dealer.id, ...intent }) : true;
  }

  /** Record re-read from `/api/dealers/{id}` (the menu can change mid-game). */
  setMenu(menu: DealerInfo): void {
    this.o.menu = menu;
  }

  get dealerId(): string {
    return this.o.dealer.id;
  }

  spentThisHour(): number {
    return this.team.spentThisHour();
  }

  /** What can still be spent: what is left of the hour, of the run and of the cash above the floor. */
  budgetLeft(cash: number | undefined = this.lastCash, keepPageReserve = false): number {
    return this.team.left(cash, keepPageReserve);
  }

  /** Deals with this dealer in the last game hour. */
  dealsLastHour(): number {
    return this.dealHours.filter((h) => h > this.hoursNow - 1).length;
  }

  /** There is an open conversation with this dealer. */
  busy(): boolean {
    return !!this.active;
  }

  /** The run is over: the deal cap was reached, or the conversation cap with none left open. */
  done(): boolean {
    return this.dealsDone >= (this.o.maxDeals ?? Infinity) || (!this.active && this.threadsOpened >= (this.o.maxThreads ?? Infinity));
  }

  runStats(): { deals: number; threads: number; spent: number } {
    return { deals: this.dealsDone, threads: this.threadsOpened, spent: this.spentRun };
  }

  /** Readable dry-run plan (same planner and same value cache as the loop). GET only. */
  async plan(): Promise<string[]> {
    if (!this.o.menu) return ["(no dealer menu: the legacy planner is used; no plan to show)"];
    const me = await this.api.me();
    this.catalog ??= await this.api.catalog();
    const safety = this.o.safety ?? 0.9;
    const caps = { maxDeals: this.o.maxDeals ?? Infinity, maxSpend: Math.max(0, Math.floor(this.budgetLeft(me.cash))), maxThreads: this.o.maxThreads ?? Infinity, safety };
    const ranked = await rankCandidates({ me, catalog: this.catalog, dealer: this.o.menu, valueOf: (c) => this.valueOf(c, me), safety, budget: caps.maxSpend, cardTopic: this.cardTopicOk, ...this.packInput(), ...this.pageInput(me) });
    const busy = await busyAssets(this.api, me.id);
    const blocked: string[] = [];
    const menu = this.o.menu;
    const catalog = this.catalog;
    const cands = (this.o.only ? applyOnly(ranked, this.o.only) : ranked).filter((c) => {
      const why = menuBlocks(menu, catalog, c) ?? sellBlocked(c.topic, busy);
      if (why) blocked.push(`not opened: ${c.label} (${why})`);
      return !why;
    });
    const chosen = selectCandidates(cands, { maxThreads: Math.min(caps.maxThreads, 10), maxSpend: caps.maxSpend, pageSpend: this.pageInput(me).pageBudget, only: !!this.o.only });
    const lines = [...formatPlan(me, this.o.menu, cands, chosen, caps, this.negotiatorParams), ...blocked];
    return this.o.only ? [`--only ${this.o.only.map((f) => f.raw).join(",")}: ${cands.length} matching candidate(s), opened in that order`, ...lines] : lines;
  }

  async step(clock: Clock): Promise<TraceRecord[]> {
    const out: TraceRecord[] = [];
    const tick = clock.tick;
    const ticksPerHour = Math.max(1, Math.round(3600 / (clock.tick_seconds ?? 60)));
    const emit = (r: Omit<TraceRecord, "ts" | "tick" | "dealer" | "dryRun">) => {
      const rec: TraceRecord = { ts: new Date(this.now()).toISOString(), tick, dealer: this.o.dealer.id, dryRun: this.o.dryRun, ...r };
      this.o.trace.write(rec);
      out.push(rec);
      this.log(describe(rec));
    };
    this.hoursNow = gameHours(clock);
    try {
      const me = await this.api.me();
      this.prevCash = this.lastCash;
      this.lastCash = me.cash;
      if (!this.active) await this.adoptOpenThread(me, tick);
      if (this.active) {
        const thread = await this.api.thread(this.active.id);
        if (thread.status === "open") {
          this.team.claimBuy(this.o.dealer.id, buyCardOf(this.active.target));
          await this.negotiate(thread, tick, me, ticksPerHour, emit);
          return out;
        }
        this.finish(thread, tick, ticksPerHour, emit, me);
      }
      this.team.claimBuy(this.o.dealer.id, undefined);
      if (this.done()) {
        emit({ action: "idle", rule: this.dealsDone >= (this.o.maxDeals ?? Infinity) ? "max-deals" : "max-threads" });
        return out;
      }
      if (this.hoursNow < this.blockedUntilHour || tick < this.cooloffUntilTick) {
        emit({ action: "blocked", rule: this.hoursNow < this.blockedUntilHour ? "persona_quota" : "cooloff" });
        return out;
      }
      if (this.o.dealsPerHour !== undefined && this.dealsLastHour() >= this.o.dealsPerHour) {
        emit({ action: "blocked", rule: "dealer-quota" });
        return out;
      }
      const target = await this.nextTarget(me, tick);
      if (target?.chase) this.log(`unlock-chase ${target.chase} via ${this.o.dealer.id}: ${target.label} · our value ${Math.round((target.value ?? 0) * 10) / 10} · limit ${target.reservation} (tolerance ${UNLOCK_CHASE_TOLERANCE} P) · no target with room, one deal to trigger the unlock`);
      if (!target) {
        emit({ action: "idle", rule: "no-target" });
        return out;
      }
      if (!this.allow({ kind: "open", target: target.key, side: target.side, ...(target.value !== undefined ? { value: target.value } : {}), cards: cardsOfTarget(target, me), ...(target.chase ? { rule: "unlock-chase" } : {}) })) return out;
      if (this.o.dryRun) {
        emit({ action: "open", target: target.key, side: target.side, reservation: target.reservation, rule: target.chase ? "unlock-chase (dry-run)" : "dry-run" });
        return out;
      }
      try {
        const welcome = await this.isFirstConversation();
        const thread = await this.api.openThread(this.o.dealer.id, target.topic);
        this.active = { id: thread.id, target, lastSentTick: tick, sent: [], holdsUsed: 0, patience: new PatienceLog(target.side, tick), welcome, ...(target.chase ? { chase: target.chase } : {}), ...this.openSnapshot(me, target, tick) };
        this.team.claimBuy(this.o.dealer.id, buyCardOf(target));
        this.threadsOpened += 1;
        const p = threadPrices(thread, target.side, this.o.dealer);
        emit({
          action: "open",
          ...(target.chase ? { rule: "unlock-chase" } : {}),
          thread: thread.id,
          target: target.key,
          side: target.side,
          reservation: target.reservation,
          ...(p.herCurrent ? { herPrice: p.herCurrent.price, herFinal: p.herCurrent.final } : {}),
          ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
        });
      } catch (e) {
        if (isCardTopicRefusal(e, target)) {
          this.cardTopicOk = false;
          emit({ action: "error", target: target.key, error: (e as BazaarError).code, rule: "card-topic-unsupported" });
        } else if (isPackTopicRefusal(e, target)) {
          this.packTopicOk = false;
          this.log(`  ${this.o.dealer.id} refused the pack topic ${JSON.stringify(target.topic)} (${(e as BazaarError).status} ${(e as BazaarError).code}): no more pack buys with this dealer this run`);
          emit({ action: "error", target: target.key, error: (e as BazaarError).code, rule: "pack-topic-unsupported" });
        } else {
          this.onError(e, tick, ticksPerHour, target, emit);
        }
      }
    } catch (e) {
      this.onError(e, tick, ticksPerHour, this.active?.target, emit);
    }
    return out;
  }

  /** After a restart: resumes the thread open with the dealer, rebuilding the target from its topic. */
  private async adoptOpenThread(me: Me, tick: number): Promise<void> {
    const list = await this.api.myThreads("open");
    const summary = list.threads.find((t) => isDealer(this.o.dealer, t.with) && (t.status ?? "open") === "open");
    if (!summary) return;
    const thread = await this.api.thread(summary.id);
    const target = await this.targetFromTopic(thread, me);
    // One asset, one place when resuming too: if the asset is already in another open offer or thread, this thread is closed.
    const busyWhy = target?.side === "sell" ? sellBlocked(target.topic, (await busyAssets(this.api, me.id, thread.id)) ?? new Map()) : undefined;
    if (busyWhy) {
      this.log(`  thread ${thread.id}: not resumed, ${busyWhy}: ${this.o.dryRun ? "would close it politely" : "closing it politely"}`);
      if (!this.o.dryRun && this.allow({ kind: "close", thread: thread.id, target: target!.key, side: target!.side, cards: cardsOfTarget(target!, me), rule: "asset-busy" })) {
        await this.api.say(thread.id, closeText(0)).catch(() => undefined);
        await this.api.closeThread(thread.id);
      }
      return;
    }
    if (target) {
      const welcome = await this.isFirstConversation(thread.id);
      this.active = { id: thread.id, target, sent: [], holdsUsed: 0, patience: new PatienceLog(target.side, tick), welcome, ...this.openSnapshot(me, target, tick) };
      this.threadsOpened += 1;
    } else if (!this.o.dryRun && this.allow({ kind: "close", thread: thread.id, target: "unknown-topic", side: sideOfTopic(thread.topic) ?? "buy", cards: [], rule: "unknown-topic" })) await this.api.closeThread(thread.id);
  }

  /**
   * `welcome_first_deal`: it is the team's first conversation with this dealer if it is not one of those already past
   * (`WELCOME_FIRST_DEAL_PAST`), this agent didn't open another before and the server lists no other thread of ours with it.
   */
  private async isFirstConversation(threadId?: number): Promise<boolean> {
    if (WELCOME_FIRST_DEAL_PAST.has(this.o.dealer.id) || this.threadsOpened > 0) return false;
    const list = await this.api.myThreads().catch(() => undefined);
    return !!list && !list.threads.some((t) => isDealer(this.o.dealer, t.with) && t.id !== threadId);
  }

  private async targetFromTopic(thread: Thread, me: Me): Promise<Target | undefined> {
    const side = sideOfTopic(thread.topic);
    const topic = thread.topic as { buy?: { card?: string }; sell?: { assets?: number[] } } | undefined;
    if (side === "sell") {
      const id = topic?.sell?.assets?.[0];
      const asset = me.assets.find((a) => a.id === id);
      if (id === undefined || typeof asset?.your_value !== "number") return undefined;
      return { key: `sell:${id}`, side, topic: { sell: { assets: [id] } }, reservation: Math.max(1, Math.ceil(asset.your_value)), label: `sell ${asset.ref}`, value: asset.your_value };
    }
    const rs = (thread.topic as { buy?: { rarity?: string; set?: string } } | undefined)?.buy;
    if (side === "buy" && rs?.rarity && rs.set) {
      this.catalog ??= await this.api.catalog();
      const cards = this.catalog.sets.find((s) => s.id === rs.set)?.cards.filter((c) => rarityOf(c) === rs.rarity) ?? [];
      if (!cards.length) return undefined;
      const vals = await Promise.all(cards.map((c) => this.valueOf(c.id, me)));
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      return { key: `buy:${rs.set}:${rs.rarity}`, side, topic: { buy: { rarity: rs.rarity, set: rs.set } }, reservation: Math.floor(mean * this.safety), label: `buy ${rs.rarity} ${rs.set}`, value: mean };
    }
    const pack = (thread.topic as { buy?: { pack?: string } } | undefined)?.buy?.pack;
    if (side === "buy" && pack) {
      const value = this.o.packValueOf?.(pack);
      if (value === undefined) return undefined;
      const list = this.o.menu?.menu.sells.find((e) => e.pack === pack)?.list_price ?? undefined;
      return { key: `buy:pack:${pack}`, side, topic: { buy: { pack } }, reservation: Math.floor(value * PACK_SAFETY), label: `buy pack ${pack}`, value, ...(list !== undefined ? { herList: list } : {}) };
    }
    const card = topic?.buy?.card;
    if (side === "buy" && card) {
      const value = await this.valueOf(card, me);
      return { key: `buy:${card}`, side, topic: { buy: { card } }, reservation: Math.floor(value * this.safety), label: `buy ${card}`, value };
    }
    return undefined;
  }

  /** What is recorded when opening (or resuming) a conversation for its summary. */
  private openSnapshot(me: Me, target: Target, tick: number): Pick<Active, "openTick" | "openTs" | "cards" | "copiesBefore" | "assetIds" | "negBefore" | "ladderBefore"> {
    const cards = cardsOfTarget(target, me);
    const score = (me.score ?? {}) as { neg_points?: unknown; ladder_points?: unknown };
    return {
      openTick: tick,
      openTs: new Date(this.now()).toISOString(),
      cards,
      copiesBefore: copiesOf(me, cards),
      assetIds: new Set(me.assets.map((a) => a.id)),
      ...(typeof score.neg_points === "number" ? { negBefore: score.neg_points } : {}),
      ...(typeof score.ladder_points === "number" ? { ladderBefore: score.ladder_points } : {}),
    };
  }

  private summarize(thread: Thread, me: Me | undefined, tick: number, outcome: ThreadOutcome, settled: number | undefined, reservation: number): ThreadSummary {
    const a = this.active!;
    const { target } = a;
    const p = threadPrices(thread, target.side, this.o.dealer, me ? selfIdOf(thread, me) : undefined);
    const received = outcome === "deal" && target.side === "buy" && me && a.assetIds ? me.assets.filter((x) => !a.assetIds!.has(x.id)).map((x) => x.ref) : undefined;
    const cards = [...new Set([...(a.revealed ? [a.revealed] : a.cards), ...(received ?? [])])];
    const copiesBefore = { ...Object.fromEntries(cards.map((c) => [c, 0])), ...a.copiesBefore };
    const finalOffer = [...thread.standing_offers].reverse().find((o) => isDealer(this.o.dealer, o.maker) && o.final === true);
    const herFinal = finalOffer ? (target.side === "buy" ? finalOffer.want?.cash : finalOffer.give?.cash) : undefined;
    const ps = a.patience.summary(tick);
    const list = this.listFor(target);
    const ourPrices = p.ourPrices.length ? p.ourPrices : a.sent;
    return {
      thread: thread.id,
      dealer: this.o.dealer.id,
      kind: target.side,
      target: target.key,
      cards,
      ...(received?.length ? { received } : {}),
      copiesBefore: Object.fromEntries(cards.map((c) => [c, copiesBefore[c] ?? 0])),
      copiesAfter: me ? copiesOf(me, cards) : {},
      dealsWithDealerLastHour: this.dealsLastHour(),
      ...(a.measuredLimit !== undefined ? { measuredLimit: a.measuredLimit } : {}),
      ...(a.openTick !== undefined ? { openTick: a.openTick } : {}),
      ...(a.openTs ? { openTs: a.openTs } : {}),
      tick,
      ts: new Date(this.now()).toISOString(),
      ...(list !== undefined ? { herList: list } : {}),
      ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
      ...(typeof herFinal === "number" ? { herFinal } : {}),
      finalFlag: !!finalOffer,
      herPrices: p.herPrices,
      ourPrices,
      patience: { msgs: ps.ourMsgs, herReplies: ps.herReplies, ticks: ps.ticks, untilFinal: ps.untilFinal },
      outcome,
      ...(thread.closed_reason ? { closedReason: thread.closed_reason } : {}),
      ...(a.lastRule ? { rule: a.lastRule } : {}),
      ...(settled !== undefined ? { price: settled } : {}),
      ...(target.value !== undefined ? { ourValue: target.value } : {}),
      ourLimit: reservation,
      ...(outcome === "deal" ? (() => { const v = valueCreated(target.side, target.value, settled); return v !== undefined ? { valueCreated: v } : {}; })() : {}),
      ...(a.negBefore !== undefined ? { negPointsBefore: a.negBefore } : {}),
      ...(a.ladderBefore !== undefined ? { ladderPointsBefore: a.ladderBefore } : {}),
    };
  }

  /** Her list for this conversation: when buying, that of the menu entry; when selling, her sell list for that rarity. */
  private listFor(target: Target): number | undefined {
    const sells = this.o.menu?.menu.sells ?? [];
    const t = target.topic as { buy?: { card?: string; rarity?: string }; sell?: unknown };
    const rarity = (target as { rarity?: string }).rarity ?? t.buy?.rarity;
    const byCard = t.buy?.card ? sells.find((e) => e.card === t.buy!.card)?.list_price : undefined;
    return byCard ?? (rarity ? (sells.find((e) => e.rarity?.toLowerCase() === rarity)?.list_price ?? undefined) : undefined);
  }

  /** Our value of buying one more copy of `card`: for a card we already hold, the next copy's marginal (`nextCopyValue`). */
  private async valueOf(card: string, me: Me): Promise<number> {
    // No cache here: the client's forgets a set's values when the hand changes (page bonus), whichever route bought.
    const v = await this.api.value(card);
    const held = me.assets.filter((a) => a.ref === card && (a.kind ?? "card") === "card");
    if (!held.length) return v;
    const vals = held.flatMap((a) => (typeof a.your_value === "number" ? [a.your_value] : []));
    this.catalog ??= await this.api.catalog();
    return nextCopyValue(v, held.length, vals.length ? Math.min(...vals) : undefined, readValueRules(this.catalog).marginals);
  }

  /** Pack value source for the planner, unless the dealer refused the pack topic. */
  /** Planner inputs for page-completing buys (cash above the floor) and blind buys. */
  private pageInput(me: Me): { pageBudget: number; blindBuys: boolean; pageTargets: readonly string[]; pageBonusScored: boolean } {
    return { pageBudget: Math.max(0, Math.floor(this.team.pageLeft(me.cash))), blindBuys: this.o.blindBuys ?? false, pageTargets: this.o.pageTargets ?? [], pageBonusScored: this.o.pageBonusScored ?? false };
  }

  private packInput(): { packValueOf?: (pack: string) => number | undefined } {
    return this.packTopicOk && this.o.packValueOf ? { packValueOf: this.o.packValueOf } : {};
  }

  /** `per_team_per_hour` of a pack already reached with this dealer in the last game hour. */
  private packQuotaFull(c: { pack?: string; perHour?: number }): boolean {
    if (c.pack === undefined || c.perHour === undefined) return false;
    return (this.packHours.get(c.pack) ?? []).filter((h) => h > this.hoursNow - 1).length >= c.perHour;
  }

  /** Persona to chase through this dealer right now: the route's answer, unless `/api/me` already lists her as unlocked. */
  private chasePersona(me: Me): string | undefined {
    const p = this.o.unlockChase?.();
    return p && !(me.unlocked ?? me.unlocked_dealers ?? []).includes(p) ? p : undefined;
  }

  private async nextTarget(me: Me, tick: number): Promise<(Target & { chase?: string }) | undefined> {
    const free = (t: Target) => (this.skip.get(t.key) ?? -1) <= tick;
    if (this.o.menu) {
      const budget = Math.max(0, Math.floor(this.budgetLeft(me.cash)));
      this.catalog ??= await this.api.catalog();
      const ranked = await rankCandidates({ me, catalog: this.catalog, dealer: this.o.menu, valueOf: (c) => this.valueOf(c, me), safety: this.o.safety ?? 0.9, budget, cardTopic: this.cardTopicOk, ...this.packInput(), ...this.pageInput(me) });
      // One asset, one place: nothing already in another open thread or in an open offer (El Rastro, another dealer).
      const busy = await busyAssets(this.api, me.id);
      const { menu, catalog } = { menu: this.o.menu, catalog: this.catalog };
      const elsewhere = (c: Target) => { const card = buyCardOf(c); return card !== undefined && this.team.buyingElsewhere(this.o.dealer.id, card); };
      const cands = (this.o.only ? applyOnly(ranked, this.o.only) : ranked).filter((c) => !menuBlocks(menu, catalog, c) && !sellBlocked(c.topic, busy) && !this.packQuotaFull(c) && !elsewhere(c));
      const picked = selectCandidates(cands.filter(free), { maxThreads: 1, maxSpend: budget, pageSpend: this.pageInput(me).pageBudget, only: !!this.o.only })[0]?.candidate;
      const chase = this.o.only ? undefined : this.chasePersona(me);
      if (chase && picked) this.log(`unlock-chase ${chase} via ${this.o.dealer.id}: regular target ${picked.label} has room and also counts (no tolerance used)`);
      if (!chase || picked) return picked;
      const c = chaseCandidates(cands.filter(free), { tolerance: UNLOCK_CHASE_TOLERANCE, maxSpend: budget })[0];
      if (!c) this.log(`unlock-chase ${chase} via ${this.o.dealer.id}: no deal within ${UNLOCK_CHASE_TOLERANCE} P of our value (duplicates to sell or cards to buy at ≤ value + ${UNLOCK_CHASE_TOLERANCE})`);
      return c ? { ...c, chase } : undefined;
    }
    if (this.o.requireMenu) return undefined;
    const busy = await busyAssets(this.api, me.id);
    const sell = spareTargets(me).find((t) => free(t) && !sellBlocked(t.topic, busy));
    if (sell) return sell;
    // Only page cards are bought here: they stay above the page reserve.
    const budget = this.budgetLeft(me.cash, true);
    if (budget < 1) return undefined;
    this.catalog ??= await this.api.catalog();
    const missing = missingPageCards(me, this.catalog).filter((m) => (this.skip.get(`buy:${m.id}`) ?? -1) <= tick);
    const plan = { budget, cash: me.cash, safety: this.safety, maxLookups: this.maxLookups };
    const buys = this.cardTopicOk
      ? await buyTargets(missing, (c) => this.valueOf(c, me), plan)
      : await raritySetTargets(missing, this.catalog, (c) => this.valueOf(c, me), { ...plan, maxLookups: 40, rarities: ["common", "uncommon"] });
    return buys.find(free);
  }

  private async negotiate(thread: Thread, tick: number, me: Me, ticksPerHour: number, emit: (r: Omit<TraceRecord, "ts" | "tick" | "dealer" | "dryRun">) => void) {
    const active = this.active!;
    await this.repriceRevealed(thread, active, me);
    const { target } = active;
    const selfId = selfIdOf(thread, me);
    const p = threadPrices(thread, target.side, this.o.dealer, selfId);
    active.patience.observe(tick, p.herCurrent?.price, !!p.herCurrent?.final, herReplies(thread, this.o.dealer, selfId));
    // Our last attempt counts even if the thread doesn't show it (e.g. the POST half-failed): never repeated.
    const lastTried = active.sent[active.sent.length - 1];
    if (lastTried !== undefined && p.ourPrices[p.ourPrices.length - 1] !== lastTried) p.ourPrices = [...p.ourPrices, lastTried];
    // Unlock chase: value ± tolerance while the persona is still locked; once unlocked, back to value-positive only.
    const chasing = active.chase !== undefined && this.chasePersona(me) === active.chase;
    const chaseOver = active.chase !== undefined && !chasing && target.value !== undefined;
    const ownRes = chaseOver ? (target.side === "buy" ? Math.min(target.reservation, Math.floor(target.value!)) : Math.max(target.reservation, Math.ceil(target.value!))) : target.reservation;
    const page = (target as { page?: PageImpact }).page;
    const spendable = target.pageCompleting ? this.team.pageLeft(me.cash) : this.budgetLeft(me.cash, !!page && page.after > page.have);
    const reservation = target.side === "buy" ? Math.max(0, Math.min(ownRes, me.cash, Math.floor(spendable))) : ownRes;
    const acceptValue = chasing && target.value !== undefined ? target.value + (target.side === "buy" ? UNLOCK_CHASE_TOLERANCE : -UNLOCK_CHASE_TOLERANCE) : target.value;
    const herAt = active.patience.herAtCounters();
    const cap = this.o.herLimitCap?.(thread.id);
    const herBeta = this.o.herBeta?.();
    const view: ThreadView = {
      side: target.side,
      reservation,
      herPrices: p.herPrices,
      ourPrices: p.ourPrices,
      ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
      ...(p.herCurrent ? { herCurrent: p.herCurrent } : {}),
      ...(target.herList !== undefined ? { herList: target.herList } : {}),
      canMessage: active.lastSentTick !== tick,
      canAccept: this.team.canAccept(tick),
      holdsUsed: active.holdsUsed,
      ...(acceptValue !== undefined ? { privateValue: acceptValue } : {}),
      ...(herAt && herAt.length === p.ourPrices.length ? { herAtOurMessages: herAt } : {}),
      ...(active.welcome ? { welcomeFirstDeal: true } : {}),
      ...(active.lastTextOnly ? { lastWasTextOnly: true } : {}),
      ...(cap !== undefined ? { herLimitCap: cap } : {}),
      ...(herBeta !== undefined ? { herBeta } : {}),
    };
    const firstStepFrac = this.o.firstStepFrac?.();
    let d: Decision = decide(view, firstStepFrac === undefined ? this.negotiatorParams : { ...this.negotiatorParams, firstStepFrac });
    // Before any accept (and on each of her offers): the shape of her offer must be the thread's; otherwise we close.
    const mismatch = await this.structureProblem(thread, target, d, reservation);
    if (active.revealedHeld && p.herCurrent && p.herCurrent.price > reservation && d.action.kind !== "close" && d.action.kind !== "wait") {
      // The card she names is one we already hold: worth only a duplicate's marginal; above our limit we walk, never pay for it.
      this.log(`  thread ${thread.id}: named-card-revalue: ${active.revealed} is a duplicate, her ${p.herCurrent.price} > our limit ${reservation}: closing politely`);
      d = { action: { kind: "close" }, rule: "named-card-revalue", effectiveReservation: d.effectiveReservation };
    } else if (mismatch) {
      this.log(`  thread ${thread.id}: structure-mismatch (${mismatch}): closing politely, never accepting`);
      d = { action: { kind: "close" }, rule: "structure-mismatch", effectiveReservation: d.effectiveReservation };
    } else if (d.action.kind === "accept" && target.side === "sell") {
      // Right before selling: the asset can't already be in another offer or thread (e.g. listed in El Rastro).
      const busy = await busyAssets(this.api, me.id, thread.id);
      const why = sellBlocked(target.topic, busy);
      if (why) {
        this.log(`  thread ${thread.id}: asset-busy (${why}): ${busy ? "closing politely" : "not accepting this tick"}`);
        d = { action: busy ? { kind: "close" } : { kind: "wait" }, rule: "asset-busy", effectiveReservation: d.effectiveReservation };
      }
    }
    active.lastRule = d.rule;
    const base = {
      thread: thread.id,
      target: target.key,
      side: target.side,
      reservation,
      effectiveReservation: d.effectiveReservation,
      rule: d.rule,
      mirror: mirrorVerdict(stepResponses(view)),
      ...(p.herCurrent ? { herPrice: p.herCurrent.price, herFinal: p.herCurrent.final } : {}),
      ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
    };
    if (d.action.kind !== "wait") {
      const a = d.action;
      const n = p.ourPrices.length;
      const probe = a.kind === "counter" ? this.o.probe?.(thread.id) : undefined;
      const text = a.kind === "counter" ? counterText(target.side, n, a.price, probe) : a.kind === "hold" ? holdText(n, a.price) : undefined;
      const intent: Omit<DealerIntent, "dealer"> = {
        kind: a.kind,
        thread: thread.id,
        target: target.key,
        side: target.side,
        ...("price" in a ? { price: a.price } : {}),
        ...(target.value !== undefined ? { value: target.value } : {}),
        cards: active.revealed ? [active.revealed] : active.cards,
        ...(text ? { text } : {}),
        rule: chasing ? `unlock-chase/${d.rule}` : d.rule,
      };
      if (!this.allow(intent)) return;
    }
    try {
      switch (d.action.kind) {
        case "accept":
          if (!this.o.dryRun) await this.api.accept(d.action.offerId);
          this.team.markAccept(tick);
          if (!this.o.dryRun && target.side === "buy") {
            // Counted on accept, with the price of her offer: doesn't depend on reading the closed thread later.
            this.team.record(d.action.price);
            this.spentRun += d.action.price;
            active.acceptedPrice = d.action.price;
          }
          // welcome_first_deal: her opening is her limit; stored as the measured limit of this dealer and this band.
          if (d.rule === "welcome-first-deal") active.measuredLimit = d.action.price;
          emit({ ...base, action: "accept", ourPrice: d.action.price, ...(d.rule === "welcome-first-deal" ? { measuredLimit: d.action.price } : {}), ...(p.ourPrices.length === 0 ? { tookOpening: true } : {}), patience: active.patience.summary(tick) });
          return;
        case "counter": {
          const probe = this.o.probe?.(thread.id);
          const text = counterText(target.side, p.ourPrices.length, d.action.price, probe);
          if (!textMatchesPrice(text, d.action.price)) throw new Error("text and figure do not match");
          if (d.action.price === p.ourPrices[p.ourPrices.length - 1]) throw new Error("repeated price");
          // Recorded before the POST: if it fails (or the server accepted it and the response doesn't validate), it is not resent.
          active.lastSentTick = tick;
          active.lastTextOnly = false;
          active.sent.push(d.action.price);
          active.patience.sent(tick, "counter", d.action.price, p.herCurrent?.price);
          if (!this.o.dryRun) await this.api.say(thread.id, text, d.action.price);
          if (!this.o.dryRun && probe !== undefined && text.includes(probe)) this.o.onProbe?.(thread.id, probe);
          emit({ ...base, action: "counter", ourPrice: d.action.price, text });
          return;
        }
        case "hold": {
          const text = holdText(p.ourPrices.length, d.action.price);
          if (!textMatchesPrice(text, d.action.price)) throw new Error("text and figure do not match");
          active.lastSentTick = tick;
          active.lastTextOnly = true;
          active.holdsUsed += 1;
          active.patience.sent(tick, "hold", d.action.price, p.herCurrent?.price);
          if (!this.o.dryRun) await this.api.say(thread.id, text);
          emit({ ...base, action: "hold", ourPrice: d.action.price, text });
          return;
        }
        case "close": {
          if (!this.o.dryRun) {
            // The farewell is text without an offer: only if the previous message wasn't one already.
            if (view.canMessage && !active.lastTextOnly) await this.api.say(thread.id, closeText(p.ourPrices.length)).catch(() => undefined);
            await this.api.closeThread(thread.id);
            this.skip.set(target.key, tick + ticksPerHour);
          }
          const summary = this.summarize(thread, me, tick, "closed_no_deal", undefined, reservation);
          emit({ ...base, action: "close", patience: active.patience.summary(tick), summary });
          if (!this.o.dryRun) {
            this.o.onThreadSummary?.(summary);
            this.active = undefined;
          }
          return;
        }
        case "wait":
          emit({ ...base, action: "wait" });
      }
    } catch (e) {
      this.onError(e, tick, ticksPerHour, target, emit, thread.id);
    }
  }

  /**
   * Shape problem: one of her offers contradicts the thread (sells us something in a sale, asks for other assets...) or
   * the one we would accept is not exactly "cash > 0 for our assets" (sell) or "the requested card for cash
   * ≤ limit" (buy). Returns the reason for the trace, or `undefined` if everything adds up.
   */
  private async structureProblem(thread: Thread, target: Target, d: Decision, reservation: number): Promise<string | undefined> {
    const exp = expectationOf(target.topic, target.side, await this.cardMatcher(target));
    if (!exp) return d.action.kind === "accept" ? "unknown-topic" : undefined;
    const bad = firstMismatch(thread, this.o.dealer, exp);
    if (bad) return `${bad.reason} in offer ${bad.offer.id}`;
    if (d.action.kind !== "accept") return undefined;
    const offerId = d.action.offerId;
    const offer = dealerOffers(thread, this.o.dealer).find((o) => o.id === offerId);
    if (!offer) return `offer ${offerId} not found`;
    const c = checkStructure(offer, exp, { accept: true, ...(target.side === "buy" ? { maxCash: reservation } : {}) });
    return c.ok ? undefined : `${c.reason} in offer ${offer.id}`;
  }

  /** Rarity+set: the card she gives us must be of that rarity and set (per the catalog). */
  private async cardMatcher(target: Target): Promise<((ref: string) => boolean) | undefined> {
    const rs = (target.topic as { buy?: { card?: string; rarity?: string; set?: string } }).buy;
    if (!rs?.rarity || rs.card) return undefined;
    this.catalog ??= await this.api.catalog();
    const sets = rs.set ? this.catalog.sets.filter((x) => x.id === rs.set) : this.catalog.sets;
    const ok = new Set(sets.flatMap((x) => x.cards.filter((c) => rarityOf(c) === rs.rarity).map((c) => c.id)));
    return (ref) => ok.has(ref);
  }

  private finish(thread: Thread, tick: number, ticksPerHour: number, emit: (r: Omit<TraceRecord, "ts" | "tick" | "dealer" | "dryRun">) => void, me?: Me) {
    const { target, patience, acceptedPrice } = this.active!;
    let settled = settledPrice(thread, target, this.o.dealer) ?? acceptedPrice;
    if (thread.status === "deal") {
      this.dealsDone += 1;
      this.dealHours.push(this.hoursNow);
      const pack = (target.topic as { buy?: { pack?: string } }).buy?.pack;
      if (pack) this.packHours.set(pack, [...(this.packHours.get(pack) ?? []), this.hoursNow]);
      if (target.side === "buy" && acceptedPrice === undefined) {
        // Deal with no visible price ("deal at ?"): cash drop since the previous step; failing that, the limit (conservative).
        const drop = this.prevCash !== undefined && me ? this.prevCash - me.cash : undefined;
        const source = settled !== undefined ? "thread offers" : drop !== undefined && drop > 0 ? "cash delta" : "our limit (price unknown)";
        settled ??= drop !== undefined && drop > 0 ? drop : target.reservation;
        this.team.record(settled);
        this.spentRun += settled;
        this.log(`  thread ${thread.id}: deal, ${settled} P counted against the budgets (${source})`);
      }
    }
    const summary = this.summarize(thread, me, tick, outcomeOf(thread.status, thread.closed_reason), thread.status === "deal" ? settled : undefined, target.reservation);
    this.applyReason(thread.closed_reason ?? undefined, thread.until_tick ?? undefined, tick);
    this.skip.set(target.key, tick + ticksPerHour);
    emit({
      action: "outcome",
      thread: thread.id,
      target: target.key,
      side: target.side,
      status: thread.status,
      ...(thread.closed_reason ? { closedReason: thread.closed_reason } : {}),
      ...(settled !== undefined ? { settledPrice: settled } : {}),
      patience: patience.summary(tick),
      summary,
    });
    this.o.onThreadSummary?.(summary);
    this.active = undefined;
  }

  /**
   * Rarity+set: her offer says which card she gives (`give.types` = "card:SAL-05", thread 184). It is revalued at our value
   * of that card, so a duplicate lowers the limit and the negotiator closes instead of paying for it (SAL-07 at 23).
   */
  private async repriceRevealed(thread: Thread, active: Active, me: Me): Promise<void> {
    const topic = active.target.topic as { buy?: { rarity?: string; card?: string } };
    if (active.target.side !== "buy" || !topic.buy?.rarity || topic.buy.card) return;
    const card = revealedCards(thread, this.o.dealer)[0];
    if (!card || card === active.revealed) return;
    // Value of one MORE copy (thread 493: RET-06 already held was priced at the held copy's 40 and bought at 24).
    const value = await this.valueOf(card, me);
    const reservation = Math.min(active.target.reservation, Math.floor(value * (this.o.safety ?? 0.9)));
    const held = Math.max(active.copiesBefore[card] ?? 0, copiesOf(me, [card])[card] ?? 0);
    this.log(`  thread ${active.id}: named-card-revalue: she offers ${card} (${held ? `DUPLICATE, we hold ${held}` : "new for us"}): our value ${Math.round(value * 10) / 10} → limit ${reservation} (was ${active.target.reservation})`);
    active.revealed = card;
    active.revealedHeld = held;
    active.target = { ...active.target, value, reservation };
  }

  private applyReason(reason: string | undefined, untilTick: number | undefined, tick: number) {
    if (reason === "persona_quota") this.blockedUntilHour = Math.floor(this.hoursNow) + 1;
    if (reason === "cooloff") this.cooloffUntilTick = untilTick ?? tick + 10;
  }

  private onError(e: unknown, tick: number, ticksPerHour: number, target: Target | undefined, emit: (r: Omit<TraceRecord, "ts" | "tick" | "dealer" | "dryRun">) => void, thread?: number) {
    const code = e instanceof BazaarError ? e.code : "exception";
    if (e instanceof Error && (code === "bad_response" || code === "exception")) this.log(`  ${code}: ${e.message.slice(0, 400)}`);
    const untilTick = e instanceof BazaarError && typeof e.extra.until_tick === "number" ? e.extra.until_tick : undefined;
    this.applyReason(code, untilTick, tick);
    if (target && (STOP_CODES.has(code) || code === "persona_quota" || code === "cooloff")) {
      this.skip.set(target.key, tick + ticksPerHour);
      if (thread !== undefined && !this.o.dryRun) void this.api.closeThread(thread).catch(() => undefined);
      if (thread !== undefined) this.active = undefined;
    }
    emit({ action: "error", error: code, ...(thread !== undefined ? { thread } : {}), ...(target ? { target: target.key } : {}) });
  }
}

/** Our team id in the thread ("t02"): `thread.team`, else `me.id` or `me.score.team`. */
export function selfIdOf(thread: Thread, me: Me): string | undefined {
  const score = me.score as { team?: unknown } | null | undefined;
  return thread.team ?? me.id ?? (typeof score?.team === "string" ? score.team : undefined);
}

/** Price it closed at: the accepted offer (standing or from the messages) if visible; otherwise the dealer's last offer. */
export function settledPrice(thread: Thread, target: Target, dealer: DealerRef): number | undefined {
  const all = [...thread.standing_offers, ...thread.messages.map((m) => StandingOfferSchema.safeParse(m.offer)).flatMap((r) => (r.success ? [r.data] : []))];
  const accepted = all.find((o) => /accept|settl|fill|deal|done/i.test(o.status ?? ""));
  if (accepted) {
    const cash = target.side === "buy" ? (isDealer(dealer, accepted.maker) ? accepted.want?.cash : accepted.give?.cash) : isDealer(dealer, accepted.maker) ? accepted.give?.cash : accepted.want?.cash;
    if (typeof cash === "number") return cash;
  }
  return threadPrices(thread, target.side, dealer).herCurrent?.price;
}

function describe(r: TraceRecord): string {
  const parts = [`[tick ${r.tick}]${r.dryRun ? " (dry-run)" : ""}`, r.action];
  if (r.thread !== undefined) parts.push(`thread ${r.thread}`);
  if (r.target) parts.push(r.target);
  if (r.herPrice !== undefined) parts.push(`her ${r.herPrice}${r.herFinal ? " (final)" : ""}`);
  if (r.ourPrice !== undefined) parts.push(`ours ${r.ourPrice}`);
  if (r.rule) parts.push(`rule ${r.rule}`);
  if (r.status) parts.push(`status ${r.status}`);
  if (r.closedReason) parts.push(`reason ${r.closedReason}`);
  if (r.settledPrice !== undefined) parts.push(`settled ${r.settledPrice}`);
  if (r.error) parts.push(`error ${r.error}`);
  const line = parts.join(" · ");
  const withPatience = r.patience ? `${line}\n  ${formatPatience(r.patience)}` : line;
  return r.summary ? `${withPatience}\n${formatThreadSummary(r.summary)}` : withPatience;
}

/** Dealer messages after our first message in the thread (her replies, excluding her opening). */
export function herReplies(thread: Thread, dealer: DealerRef, selfId?: string): number {
  const isUs = (who: string | null | undefined) => (selfId ? !!who && who.toLowerCase() === selfId.toLowerCase() : !isDealer(dealer, who));
  let started = false;
  let n = 0;
  for (const m of thread.messages) {
    if (isUs(m.sender)) started = true;
    else if (started && isDealer(dealer, m.sender)) n += 1;
  }
  return n;
}

const NOT_A_TOPIC_PROBLEM = new Set(["insufficient_cash", "persona_quota", "cooloff", "sold_out", "wait_for_tick", "rate_limited", "locked", "bad_key"]);

/** The server refused to open a `{buy: {card}}` thread because of the topic (400/422 with no other known reason). */
export function isCardTopicRefusal(e: unknown, target: Target): boolean {
  return (
    e instanceof BazaarError &&
    (e.status === 400 || e.status === 422) &&
    !NOT_A_TOPIC_PROBLEM.has(e.code) &&
    "buy" in target.topic &&
    "card" in target.topic.buy
  );
}

/** The server refused to open a `{buy: {pack}}` thread because of the topic (400/422 with no other known reason). */
export function isPackTopicRefusal(e: unknown, target: Target): boolean {
  return e instanceof BazaarError && (e.status === 400 || e.status === 422) && !NOT_A_TOPIC_PROBLEM.has(e.code) && "buy" in target.topic && "pack" in target.topic.buy;
}

/** Cards of a target: the requested card, that of the asset we sell, or those of that rarity and set (until she says which). */
export function cardsOfTarget(target: Target, me: Me): string[] {
  const t = target.topic as { buy?: { card?: string; rarity?: string; set?: string }; sell?: { assets?: number[] } };
  if (t.buy?.card) return [t.buy.card];
  if (t.sell?.assets) return [...new Set(t.sell.assets.map((id) => me.assets.find((a) => a.id === id)?.ref).filter((r): r is string => !!r))];
  const cands = (target as { cards?: { id: string }[] }).cards;
  return cands ? cands.map((c) => c.id) : [];
}
