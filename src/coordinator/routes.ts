import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Clock, DealerInfo, Me } from "../shared/schemas.js";
import type { TraceRecord, TraceSink } from "../shared/trace.js";
import { BazaarAgent, type DealerIntent } from "../dealers/agent.js";
import { dealsPerHourOf, negotiatorForDealer, traitsOf, unlockedDealerIds } from "../dealers/dealer-profile.js";
import { TeamBudget } from "../dealers/team.js";
import { offerCap, RARITY_BOOK } from "../dealers/history/persona-fit.js";
import { appendLesson, PendingLessons } from "../dealers/history/lessons.js";
import { DuelsAgent, formatDuelEntry, type DuelProposal } from "../duels/agent.js";
import { duelsApi } from "../duels/schemas.js";
import { TradesAgent } from "../trades/agent.js";
import { DEFAULT_TRADE_PARAMS, type TickPlan, type TradeParams, type TradeState } from "../trades/trades.js";
import { completesPage, duelStrategy, type Strategy, type StrategyDecision } from "../state/conversation.js";
import type { GameState } from "../state/game-state.js";
import { tradeSignals } from "../state/rivals.js";
import type { FlagRecord } from "../state/world.js";
import type { FlagCandidate } from "../flags/flags.js";
import { isProbePhrase } from "../dealers/negotiation/messages.js";
import type { Intent } from "./coordinator.js";
import { marketSale, proposeMarkets, type MarketsContext } from "../markets/markets.js";
import { directedListings } from "../markets/rival-page.js";

/**
 * Coordinator routes. Each proposes its tick intents WITHOUT sending them (GET only) and, live, executes
 * only those the coordinator selected. They reuse the existing agents: `DuelsAgent.propose/execute`,
 * `TradesAgent.propose/execute` and `BazaarAgent` with `gate` (each POST goes through the coordinator first).
 */

export interface RouteProposal {
  intents: Intent[];
  /** Informational lines (duels waiting, dealers without a target...). */
  notes: string[];
  /** Strategy per conversation (`duel:177`...), computed by code. */
  strategies: Map<string, Strategy>;
  /** Last decision per conversation (dealers), for the Conversation entity. */
  decisions: Map<string, StrategyDecision>;
}

const empty = (): RouteProposal => ({ intents: [], notes: [], strategies: new Map(), decisions: new Map() });

// ---------------------------------------------------------------- duels

export class DuelsRoute {
  readonly agent: DuelsAgent;
  private proposal: DuelProposal | undefined;

  constructor(client: BazaarClient, dryRun: boolean, stateFile?: string) {
    this.agent = new DuelsAgent(duelsApi(client), { dryRun, ...(stateFile ? { stateFile } : {}) });
  }

  async propose(): Promise<RouteProposal> {
    const out = empty();
    this.proposal = await this.agent.propose();
    const tick = this.proposal.clock.tick;
    for (const p of this.proposal.planned) {
      const conv = `duel:${p.duel.id}`;
      const strategy = duelStrategy(p.state, this.agent.params, p.decision, tick);
      out.strategies.set(conv, strategy);
      const d = p.decision;
      const terms = (o: { price: number; days?: number } | undefined) => (o ? `${o.price} P${o.days !== undefined && p.state.withDays ? ` day ${o.days}` : ""}` : "?");
      if (p.already || d.action === "wait") {
        out.notes.push(`duel ${p.duel.id} (${p.duel.role}, rival ${p.duel.rival ?? "?"}): WAIT (${p.already ? "already acted this tick" : d.rule})${p.assumption ? ` · ${p.assumption}` : ""}`);
        continue;
      }
      if (d.action === "accept") {
        out.intents.push({ id: `duels:accept:${p.duel.id}`, route: "duels", kind: "accept", conversation: conv, acceptClass: "duel", ev: d.surplus, summary: `duel ${p.duel.id}: ACCEPT rival ${terms(p.rival)} (${d.rule}, surplus ${d.surplus.toFixed(1)})` });
      } else {
        out.intents.push({ id: `duels:message:${p.duel.id}`, route: "duels", kind: "message", conversation: conv, ev: d.surplus, summary: `duel ${p.duel.id}: COUNTER ${terms(d.offer)} (${d.rule}, round ${d.round}) "${d.text}"` });
      }
    }
    return out;
  }

  /**
   * Executes what was selected. In dry-run the agent sends nothing: it only marks each entry (dry-run, deferred, skipped),
   * so it also serves to print what it would do with each duel.
   */
  async execute(selected: ReadonlySet<string>): Promise<string[]> {
    if (!this.proposal) return [];
    const accepts = this.proposal.planned.filter((p) => selected.has(`duels:accept:${p.duel.id}`)).map((p) => p.duel.id);
    const messages = new Set(this.proposal.planned.filter((p) => selected.has(`duels:message:${p.duel.id}`)).map((p) => String(p.duel.id)));
    const report = await this.agent.execute(this.proposal, { accepts, messages });
    return report.entries.flatMap((e) => formatDuelEntry(e).split("\n"));
  }
}

// ---------------------------------------------------------------- dealers

/** Trace the coordinator silences in the proposals pass (to avoid duplicate records). */
class SwitchableTrace implements TraceSink {
  muted = true;
  constructor(private readonly inner: TraceSink | undefined) {}
  write(record: TraceRecord): void {
    if (!this.muted) this.inner?.write(record);
  }
}

export interface DealersRouteOptions {
  dryRun: boolean;
  maxSpendPerHour: number;
  maxSpendTotal: number;
  cashFloor: number;
  pageTargets: readonly string[];
  trace?: TraceSink;
  /** `docs/bazaar/lessons.json`: only written live; in dry-run what would be added is printed (`docs/` is never touched). */
  lessonsFile?: string;
}

/** First big concession (`firstStepFrac`) only against a persona with a true mirror (`mirror_concessions`); otherwise off. */
export const MIRROR_FIRST_STEP_FRAC = 0.12;

const dealerKey = (i: DealerIntent) => `dealers:${i.kind}:${i.dealer}:${i.thread ?? i.target}`;

const DEALER_REASON: Record<DealerIntent["kind"], string> = {
  open: "best value-creating target on the dealer's menu",
  accept: "her offer is within our limit and creates value",
  counter: "next step on the planned path",
  hold: "hold our price while waiting for her final",
  close: "no deal within our limit",
};

/**
 * *demand_markup* (personas.md § 3.2): its sell limit rises as the hour's stock runs out, so buying from it
 * early in the game hour is cheaper. Weight of buy openings: ×1.25 at the start of the hour, ×0.75 at the end.
 */
export function demandWeight(gameHour: number | undefined): number {
  if (gameHour === undefined) return 1;
  return 1.25 - 0.5 * (gameHour - Math.floor(gameHour));
}

/**
 * Persona that one more deal with `dealer` could unlock early (the server seems to check the rule only when a deal with
 * `early_deals_with` closes: Team 13 got Pilar on its 3rd Chato deal, we have 4 and she is still locked): active, not
 * unlocked for us, and our level reaches `early_min_level`. The first such persona; `undefined` if none.
 */
export function unlockChaseFor(state: GameState, dealer: string): string | undefined {
  const level = state.ours.level ?? 0;
  return state.personas.find((p) => p.status === "active" && p.unlock.earlyDealsWith === dealer && !state.ours.unlocked.includes(p.id) && level >= (p.unlock.earlyMinLevel ?? 0))?.id;
}

export class DealersRoute {
  private readonly agents = new Map<string, BazaarAgent>();
  private readonly team: TeamBudget;
  private readonly trace: SwitchableTrace;
  private collected: DealerIntent[] = [];
  private allowed = new Set<string>();
  private mode: "propose" | "execute" = "propose";
  private readonly logs: string[] = [];
  /** Tick state (conversations and personas) to pick the egg probe that goes with a counteroffer. */
  private state: GameState | undefined;
  /** Last `neg_points` seen (score audit). */
  private lastNeg: number | undefined;
  /** Lesson lines of the tick (dumped into notes or into the execution). */
  private readonly lessonLines: string[] = [];
  private readonly lessonsSeen = new Set<string>();
  private readonly lessons = new PendingLessons((entry) => {
    if (this.o.dryRun || !this.o.lessonsFile) {
      const key = `${entry.dealer}:${entry.thread}`;
      if (this.lessonsSeen.has(key)) return;
      this.lessonsSeen.add(key);
      this.lessonLines.push(`lessons (dry-run, nothing written): would append thread ${entry.thread} (${entry.dealer}, ${entry.outcome}) · ${entry.lessons.length} lesson(s)${entry.lessons.length ? `: ${entry.lessons.join(" | ")}` : ""}`);
      return;
    }
    try {
      if (appendLesson(this.o.lessonsFile, entry)) this.lessonLines.push(`lessons: thread ${entry.thread} appended (${entry.lessons.length} lesson(s))`);
    } catch (e) {
      this.lessonLines.push(`lessons: could not append thread ${entry.thread}: ${e instanceof Error ? e.message : String(e)}`);
    }
  });

  /** On stop: writes the lessons still waiting for neg_points to settle. */
  flushLessons(): string[] {
    this.lessons.flush();
    return this.lessonLines.splice(0);
  }

  constructor(
    private readonly client: BazaarClient,
    private readonly o: DealersRouteOptions,
  ) {
    this.team = new TeamBudget({ maxSpendPerHour: o.maxSpendPerHour, maxSpendTotal: o.maxSpendTotal, cashFloor: o.cashFloor });
    this.trace = new SwitchableTrace(o.trace);
  }

  private gate = (i: DealerIntent): boolean => {
    if (this.mode === "propose") {
      this.collected.push(i);
      return false;
    }
    return this.allowed.has(dealerKey(i));
  };

  /** One `BazaarAgent` per unlocked dealer, like serious mode (mandatory card, profile per dealer). */
  private async ensureAgents(me: Me): Promise<void> {
    const list = await this.client.dealers();
    const all = list.dealers as (typeof list.dealers[number] & { open_to_all?: unknown; enabled?: unknown })[];
    for (const id of unlockedDealerIds(me, all)) {
      if (this.agents.has(id)) continue;
      const menu: DealerInfo | undefined = await this.client.dealer(id).catch(() => undefined);
      const summary = all.find((d) => d.id === id);
      const dealsPerHour = dealsPerHourOf(menu);
      this.agents.set(
        id,
        new BazaarAgent(this.client, {
          dealer: { id, aliases: [...(summary?.name ? [summary.name] : []), ...(menu?.name ? [menu.name] : []), "persona", "dealer"] },
          dryRun: this.o.dryRun,
          maxSpendPerHour: this.o.maxSpendPerHour,
          requireMenu: true,
          team: this.team,
          safety: 1.0,
          negotiator: negotiatorForDealer(traitsOf(menu ?? summary), id),
          ...(menu ? { menu } : {}),
          ...(dealsPerHour !== undefined ? { dealsPerHour } : {}),
          trace: this.trace,
          log: (line) => this.logs.push(line),
          gate: this.gate,
          onThreadSummary: (summary) => this.lessons.add(summary),
          probe: (thread) => (this.state ? eggProbeFor(this.state, `dealer:${thread}`) : undefined),
          firstStepFrac: () => (this.state?.personas.find((p) => p.id === id)?.model?.strategy.mirror_concessions.value === true ? MIRROR_FIRST_STEP_FRAC : 0),
          herBeta: () => this.state?.personas.find((p) => p.id === id)?.model?.strategy.beta.value ?? undefined,
          unlockChase: () => (this.state ? unlockChaseFor(this.state, id) : undefined),
          packValueOf: (pack) => this.state?.packs.types.find((t) => t.id === pack)?.ourValue,
          herLimitCap: (thread) => {
            const conv = this.state?.conversations.find((c) => c.id === `dealer:${thread}`);
            return conv?.prediction ? offerCap(conv.prediction, conv.side === "buy", RARITY_BOOK[conv.asset.rarity ?? ""] ?? 10) : undefined;
          },
          onProbe: (thread, phrase) => {
            const conv = this.state?.conversations.find((c) => c.id === `dealer:${thread}`);
            conv?.eggsTried.push(phrase);
            this.state?.personas.find((p) => p.id === id)?.eggProbes.push({ phrase, tick: this.state.tick, result: "sent" });
          },
        }),
      );
    }
  }

  async propose(clock: Clock, state: GameState): Promise<RouteProposal> {
    const out = empty();
    this.state = state;
    const me = await this.client.me();
    await this.ensureAgents(me);
    this.lessons.observe(me.score as { neg_points?: unknown; ladder_points?: unknown } | undefined, clock.tick);
    // Score audit: each deal scores your_value − price at our private values; log every move to check it against the settlements.
    const neg = (me.score as { neg_points?: unknown } | undefined)?.neg_points;
    if (typeof neg === "number") {
      if (this.lastNeg !== undefined && Math.round((neg - this.lastNeg) * 10) !== 0) out.notes.push(`score audit: neg_points ${this.lastNeg} → ${neg} (Δ ${Math.round((neg - this.lastNeg) * 10) / 10}) at tick ${clock.tick}: check against this tick's settlements (your_value − price)`);
      this.lastNeg = neg;
    }
    this.mode = "propose";
    this.collected = [];
    this.trace.muted = true;
    for (const [id, agent] of this.agents) {
      this.logs.length = 0;
      await agent.step(clock);
      out.notes.push(...this.logs.filter((l) => l.startsWith("unlock-chase ") || l.includes("named-card-revalue")).map((l) => `dealer ${id}: ${l}`));
      const quiet = this.logs.filter((l) => !/\b(open|accept|counter|hold|close)\b.*dry-run/.test(l));
      if (!this.collected.some((i) => i.dealer === id)) out.notes.push(`dealer ${id}: ${quiet.at(-1)?.replace(/^\[tick \d+\]( \(dry-run\))? · /, "") ?? "no action"}`);
    }
    out.notes.push(...this.lessonLines.splice(0));
    for (const i of this.collected) {
      const conv = i.thread !== undefined ? `dealer:${i.thread}` : undefined;
      const ev = i.value !== undefined && i.price !== undefined ? (i.side === "buy" ? i.value - i.price : i.price - i.value) : i.value;
      const what = `${i.dealer} ${i.kind.toUpperCase()} ${i.target}${i.thread !== undefined ? ` (thread ${i.thread})` : ""}${i.price !== undefined ? ` @ ${i.price} P` : ""}${i.rule ? ` (${i.rule})` : ""}${i.text ? ` "${i.text}"` : ""}`;
      const sold = /^sell:(\d+)$/.exec(i.target)?.[1];
      const base = { id: dealerKey(i), route: "dealers" as const, summary: what, ...(conv ? { conversation: conv } : {}), ...(ev !== undefined ? { ev } : {}), ...(sold ? { locks: [`asset:${sold}`] } : {}) };
      if (i.kind === "accept") {
        const page = i.side === "buy" && i.cards.some((c) => completesPage(c, me, state.ours.album.pages, this.o.pageTargets));
        out.intents.push({ ...base, kind: "accept", acceptClass: page ? "page-completing" : "dealer-ladder" });
      } else if (i.kind === "open") {
        const w = i.side === "buy" ? demandWeight(state.time.gameHour) : 1;
        out.intents.push({ ...base, kind: "open", ...(ev !== undefined && w !== 1 ? { ev: Math.round(ev * w * 100) / 100, summary: `${what} · demand ×${w.toFixed(2)}` } : {}) });
      } else {
        out.intents.push({ ...base, kind: "message" });
      }
      if (conv) {
        const action: StrategyDecision["action"] = i.kind === "close" ? "walk" : i.kind === "open" ? "counter" : i.kind;
        out.decisions.set(conv, { action, ...(i.price !== undefined ? { price: i.price } : {}), rule: i.rule ?? i.kind, reason: DEALER_REASON[i.kind], tick: clock.tick });
      }
    }
    return out;
  }

  /** Live: second pass with the gate open only for what was selected (its GETs are repeated; if something changed, it does not go out). */
  async execute(clock: Clock, selected: ReadonlySet<string>): Promise<string[]> {
    this.mode = "execute";
    this.allowed = new Set([...selected].filter((k) => k.startsWith("dealers:")));
    this.trace.muted = false;
    const lines: string[] = [];
    for (const [id, agent] of this.agents) {
      if (![...this.allowed].some((k) => k.split(":")[2] === id)) continue;
      this.logs.length = 0;
      await agent.step(clock);
      lines.push(...this.logs.map((l) => `dealer ${id}: ${l}`));
    }
    this.trace.muted = true;
    lines.push(...this.lessonLines.splice(0));
    return lines;
  }
}

// ---------------------------------------------------------------- El Rastro

export class TradesRoute {
  readonly agent: TradesAgent;
  private last: { state: TradeState; plan: TickPlan } | undefined;
  /** `--scanner`: listings are held back by a sale at our marginal value (otherwise by a duplicate sale at first-copy value). */
  scanner = false;
  /** Scanner settings shared with the markets route (ledger, cash floor, hourly cap) so the hold-back matches its decision. */
  scannerContext: Pick<MarketsContext, "ledger" | "cashFloor" | "spendPerHour"> = {};

  /** `params`: the coordinator's `--max-spend` and `--cash-floor` (otherwise the El Rastro defaults). */
  constructor(client: BazaarClient, dryRun: boolean, params: Partial<Pick<TradeParams, "maxSpend" | "cashFloor">> = {}) {
    this.agent = new TradesAgent(client, { ...DEFAULT_TRADE_PARAMS, ...params }, { dryRun, log: () => {} });
  }

  /** El Rastro state and plan of the last proposal (the rival-page listings reuse them; `undefined` before the first). */
  get lastState(): TradeState | undefined {
    return this.last?.state;
  }
  get lastPlan(): TickPlan | undefined {
    return this.last?.plan;
  }

  async propose(state: GameState, me: Me | undefined, pageTargets: readonly string[]): Promise<RouteProposal> {
    const out = empty();
    this.last = undefined;
    // Other teams' demand and supply lift asks and rank bids (absent rivals: the plan is unchanged).
    this.last = await this.agent.propose(state.rivals ? tradeSignals(state.rivals, state.tick) : undefined);
    const { plan } = this.last;
    if (plan.accept) {
      const a = plan.accept;
      const page = a.getCards.some((c) => completesPage(c, me, state.ours.album.pages, pageTargets));
      out.intents.push({
        id: `trades:accept:${a.offer.id}`,
        route: "trades",
        kind: "accept",
        conversation: `rastro-offer:${a.offer.id}`,
        acceptClass: page ? "page-completing" : "other",
        ev: a.valueCreated,
        locks: a.payAssets.map((id) => `asset:${id}`),
        summary: `El Rastro: ACCEPT offer #${a.offer.id} (${a.kind}: get ${a.getCards.join(", ") || "-"}, give ${a.giveCards.join(", ") || "-"}, cash ${a.cashNet} P, value created ${a.valueCreated.toFixed(1)})`,
      });
    }
    for (const c of plan.cancels) out.intents.push({ id: `trades:cancel:${c.id}`, route: "trades", kind: "cancel", summary: `El Rastro: CANCEL #${c.id} (${c.reason})` });
    // Scanner on: the same context the markets route gets this tick (directed listings from this El Rastro state, page targets).
    const trade = this.scanner ? this.last.state : undefined;
    const saleCtx: MarketsContext = trade ? { ...this.scannerContext, directedRefs: new Set(directedListings(trade).map((d) => d.ref)), pageTargets } : {};
    // The scanner's sales this tick, computed once (marketSale would rerun proposeMarkets per listing).
    const scannerSales = trade ? proposeMarkets(state, new Map(), { ...saleCtx, scanner: true, trade }).sales : undefined;
    plan.posts.forEach((p, k) => {
      // Never list a card below a better bid the markets route would take this tick (v02 bid 22 vs our El Rastro listing at 14).
      const sale = p.kind === "list" ? (scannerSales ? scannerSales.get(p.ref) : marketSale(state, p.ref)) : undefined;
      if (sale && sale.quote.price > p.price) {
        out.notes.push(`El Rastro: list ${p.ref} @ ${p.price} P held back: bid ${sale.quote.price} P on ${sale.venue.id} (#${sale.quote.offer}, net ${sale.net}) goes through the markets route`);
        return;
      }
      const locks = [...("assets" in p.body.give ? p.body.give.assets : []).map((id) => `asset:${id}`), ...(p.kind === "list" ? [`sell:${p.ref}`] : [])];
      out.intents.push({ id: `trades:post:${k}`, route: "trades", kind: "listing", ev: p.value, price: p.price, ref: p.ref, locks, summary: `El Rastro: POST ${p.kind} ${p.ref} @ ${p.price} P (${p.why}, value ${p.value.toFixed(1)})` });
    });
    out.notes.push(`El Rastro: ${plan.evaluated} offers read, ${plan.opportunities.length} opportunities${plan.notes.length ? ` · ${plan.notes.slice(0, 2).join(" · ")}` : ""}`);
    return out;
  }

  async execute(selected: ReadonlySet<string>): Promise<string[]> {
    if (!this.last) return [];
    const { state, plan } = this.last;
    const trimmed: TickPlan = {
      ...plan,
      ...(plan.accept && selected.has(`trades:accept:${plan.accept.offer.id}`) ? {} : { accept: undefined }),
      cancels: plan.cancels.filter((c) => selected.has(`trades:cancel:${c.id}`)),
      posts: plan.posts.filter((_, k) => selected.has(`trades:post:${k}`)),
    } as TickPlan;
    if (!trimmed.accept) delete (trimmed as { accept?: unknown }).accept;
    const res = await this.agent.execute(state, trimmed);
    return [...res.sent.map((s) => `El Rastro sent: ${s}`), ...res.errors.map((e) => `El Rastro error: ${e}`)];
  }
}

// ---------------------------------------------------------------- flags

/**
 * Bad-faith flags (`POST /api/flags`). A flag is proposed when the dealer's text contradicts the STRUCTURE of the
 * offer in that same message (`flagCandidate.verifiable`), or when a counteroffer of theirs carries a pressure phrase from
 * the closed list (`flagCandidate.tactic`, `src/flags/flags.ts`). The latter are not proven by structure: they are only
 * proposed if Pablo approved them (`--approve-flags <ids>` or, in bulk, `--flag-pressure`); without approval they are listed
 * as candidates. Never the same message twice; does not use the accept quota. Live only without --dry-run AND with --confirm.
 */
export interface FlagApproval {
  /** Message ids with a pressure phrase approved one by one. */
  messages: ReadonlySet<string>;
  /** All pressure phrases of the closed list approved in bulk. */
  allPressure: boolean;
}

export class FlagsRoute {
  constructor(
    private readonly client: BazaarClient,
    private readonly dryRun: boolean,
    private readonly approval: FlagApproval = { messages: new Set(), allPressure: false },
  ) {}

  private sendable(f: FlagCandidate): boolean {
    if (f.verifiable) return true;
    return !!f.tactic && (this.approval.allPressure || this.approval.messages.has(String(f.messageId)));
  }

  propose(state: GameState): RouteProposal {
    const out = empty();
    const sent = new Set(state.ours.flags.sent.map((f) => String(f.messageId)));
    for (const c of state.conversations) {
      const f = c.flagCandidate;
      if (!f) continue;
      if (sent.has(String(f.messageId))) {
        out.notes.push(`${c.id}: message ${f.messageId} already flagged`);
        continue;
      }
      if (!this.sendable(f)) {
        if (f.tactic) out.notes.push(`${c.id}: pressure candidate, message ${f.messageId} (${c.counterparty}, ${f.tactic}): needs approval (--approve-flags ${f.messageId})`);
        continue;
      }
      out.intents.push({ id: `flags:flag:${f.messageId}`, route: "flags", kind: "flag", conversation: c.id, summary: `flag message ${f.messageId} (${c.counterparty}): ${f.reason ?? "text contradicts the offer structure"}` });
    }
    if (!out.intents.length) out.notes.push("no verifiable text/structure contradiction and no approved pressure line");
    return out;
  }

  /** Sends the selected flags (live only) and returns the records for `flags.json`. */
  async execute(state: GameState, selected: ReadonlySet<string>): Promise<{ lines: string[]; records: FlagRecord[] }> {
    const lines: string[] = [];
    const records: FlagRecord[] = [];
    for (const c of state.conversations) {
      const f = c.flagCandidate;
      if (!f || !this.sendable(f) || !selected.has(`flags:flag:${f.messageId}`)) continue;
      const reason = f.reason ?? "text contradicts the offer structure";
      if (this.dryRun) {
        lines.push(`flags: would flag message ${f.messageId} (${reason})`);
        continue;
      }
      try {
        await this.client.raw("POST", "/api/flags", { message_id: f.messageId, reason });
        records.push({ messageId: f.messageId, reason, tick: state.tick, persona: c.counterparty, result: "pending" });
        lines.push(`flags: flagged message ${f.messageId}`);
      } catch (e) {
        lines.push(`flags: message ${f.messageId} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
      }
    }
    return { lines, records };
  }
}

// ---------------------------------------------------------------- eggs

/** Egg probe parameters (low priority). */
export const EGG_PARAMS = {
  /** Fixed Playground template (site-map § 9.3), appended to a counteroffer of ours. Never carries figures. */
  template: "Do you know about {hint}?",
};

/**
 * X phrase of the probe that can ride on the next counteroffer in `conversationId` (never in a separate message):
 * at most one per conversation (`eggsTried` empty), never the same X with the same persona (`eggsTried` of all its
 * conversations and its `eggProbes`), never with warnings, strikes or cooloff, and only with a candidate hint with a valid
 * keyword (`isProbePhrase`: no digits).
 */
export function eggProbeFor(state: GameState, conversationId: string): string | undefined {
  const conv = state.conversations.find((c) => c.id === conversationId);
  if (!conv || conv.kind !== "dealer" || conv.eggsTried.length > 0) return undefined;
  if (conv.mood.warnings > 0 || conv.mood.strikes > 0 || conv.mood.cooloffUntil !== undefined) return undefined;
  if (state.ours.strikes && Object.keys(state.ours.strikes).length) return undefined;
  const persona = state.personas.find((p) => p.id === conv.counterparty);
  if (!persona) return undefined;
  const eggs = state.world.eggs.byPersona[persona.id];
  if (eggs && eggs.left <= 0) return undefined;
  const tried = new Set([...state.conversations.filter((c) => c.counterparty === persona.id).flatMap((c) => c.eggsTried), ...persona.eggProbes.map((x) => x.phrase)].map((x) => x.toLowerCase().trim()));
  return persona.hints.map((h) => h.keyword?.trim()).find((k): k is string => !!k && isProbePhrase(k) && !tried.has(k.toLowerCase()) && !tried.has(EGG_PARAMS.template.replace("{hint}", k).toLowerCase()));
}

/**
 * Egg probes: they are NO LONGER sent as a separate message (that is a message without an offer, spam risk). It only
 * reports which probe would go with the next counteroffer of each conversation (`eggProbeFor`, `DealersRoute`).
 */
export class EggsRoute {
  propose(state: GameState, quiet: Readonly<Record<string, number>> = {}): RouteProposal {
    const out = empty();
    for (const c of state.conversations) {
      if (c.kind !== "dealer" || c.phase === "done") continue;
      if ((quiet[c.counterparty] ?? -1) >= state.tick) {
        out.notes.push(`${c.id}: ${c.counterparty} quiet until tick ${quiet[c.counterparty]} (warning/strike/cooloff): no probe`);
        continue;
      }
      const x = eggProbeFor(state, c.id);
      if (x) out.notes.push(`${c.id}: next counter carries "${EGG_PARAMS.template.replace("{hint}", x)}"`);
    }
    if (!out.notes.length) out.notes.push(`no probe (hints ${state.personas.reduce((a, p) => a + p.hints.length, 0)}; a probe needs a hint keyword and rides only on a counter)`);
    return out;
  }
}
