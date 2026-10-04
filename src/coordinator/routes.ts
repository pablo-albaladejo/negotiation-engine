import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Catalog, Clock, DealerInfo, Me } from "../shared/schemas.js";
import { liveTraceDir, type TraceRecord, type TraceSink } from "../shared/trace.js";
import { BazaarAgent, type DealerIntent } from "../dealers/agent.js";
import { dealsPerHourOf, negotiatorForDealer, traitsOf, unlockedDealerIds } from "../dealers/dealer-profile.js";
import { TeamBudget } from "../dealers/team.js";
import { offerCap, RARITY_BOOK } from "../dealers/history/persona-fit.js";
import { appendLesson, PendingLessons, type LessonEntry } from "../dealers/history/lessons.js";
import { updateTeamReceived } from "../dealers/history/team-received.js";
import { introDemand } from "../intros/intros.js";
import { forexBuyRoute, forexRoutes, forexSellRoute, setForexRoutes } from "../dealers/planning/forex.js";
import { expectedShare, formatLadder, LADDER_P_PER_POINT, LADDER_SLOTS, ladderGain, ladderLevels, type LadderLevel } from "../dealers/history/ladder.js";
import { DuelsAgent, formatDuelEntry, type DuelProposal } from "../duels/agent.js";
import { duelsApi } from "../duels/schemas.js";
import { TradesAgent } from "../trades/agent.js";
import { buildValueModel, countHoldings, DEFAULT_TRADE_PARAMS, heldAssets, pageTargetCap, type TickPlan, type TradeParams, type TradeState } from "../trades/trades.js";
import { completesPage, duelStrategy, type Strategy, type StrategyDecision } from "../state/conversation.js";
import type { GameState } from "../state/game-state.js";
import { tradeSignals } from "../state/rivals.js";
import type { FlagRecord } from "../state/world.js";
import { normalize, type FlagCandidate } from "../flags/flags.js";
import type { HintLine } from "../hints/corpus.js";
import { GREETINGS, isProbePhrase } from "../dealers/negotiation/messages.js";
import type { Intent } from "./coordinator.js";
import { marketSale, proposeMarkets, type MarketsContext } from "../markets/markets.js";
import { ScoreAudit } from "./score-audit.js";
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
/**
 * A thread is ours when play's trace recorded opening it (`thread-<id>.jsonl` with an `open` record); a probe Pablo
 * opened by hand has none. Read from disk each time (a few small files a tick), so a restart keeps the answer.
 */
function openedByPlay(thread: number): boolean {
  const file = join(liveTraceDir(process.cwd()), `thread-${thread}.jsonl`);
  try {
    return existsSync(file) && readFileSync(file, "utf8").includes('"action":"open"');
  } catch {
    return false;
  }
}

/** Dealers whose ladder level did not move the server's ladder_points after our deals: their ladder gain counts 0. */
const LADDER_UNVERIFIED: ReadonlySet<string> = new Set(["picaros"]);

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
  /** `--page-bonus-scored`: a page target's bonus counts (cap 0.9 × value); otherwise it is capped at its base. */
  pageBonusScored?: boolean;
  /** `--egg-open <dealer>`: one thread with this dealer only to carry the queued egg probe (once a day, no earlier thread). */
  eggOpen?: string;
  trace?: TraceSink;
  /** `docs/bazaar/lessons.json`: only written live; in dry-run what would be added is printed (`docs/` is never touched). */
  lessonsFile?: string;
  /** `score-audit.jsonl`: only written live; in dry-run the audit line is printed only. */
  scoreAuditFile?: string;
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
  /** Venue-switch reserve (P above the cash floor), set by the coordinator each tick: only page-completing buys use it. */
  venueReserve = 0;
  private readonly trace: SwitchableTrace;
  private collected: DealerIntent[] = [];
  /** Ladder levels read once per propose (the agents' `ladderSellDiscount` and the open bonus share it). */
  private ladderNow: LadderLevel[] = [];
  /** Lesson entries read with the ladder (same file, once per propose): the agents' `pastNoDeals` reads them. */
  private lessonEntries: LessonEntry[] = [];
  /** Assets received from another team today (`team-received.ts`), read once per propose. */
  private teamReceived: ReadonlySet<number> = new Set();
  private allowed = new Set<string>();
  private mode: "propose" | "execute" = "propose";
  private readonly logs: string[] = [];
  /** Tick state (conversations and personas) to pick the egg probe that goes with a counteroffer. */
  private state: GameState | undefined;
  /** Per-deal score audit: each `neg_points` Δ against the settlements of ours since the last read. */
  private readonly scoreAudit: ScoreAudit;
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
    this.scoreAudit = new ScoreAudit({ mode: o.dryRun ? "dry-run" : "live", ...(o.scoreAuditFile ? { file: o.scoreAuditFile } : {}) });
  }

  /** Today's ladder per level from docs/bazaar/lessons.json (read only) and the persona model (level, band limits). */
  private ladderOf(state: GameState): LadderLevel[] {
    let entries: LessonEntry[] = [];
    try {
      entries = (JSON.parse(readFileSync(this.o.lessonsFile ?? join(process.cwd(), "docs", "bazaar", "lessons.json"), "utf8")) as { conversations?: LessonEntry[] }).conversations ?? [];
    } catch {
      // No lessons yet: every slot is empty.
    }
    this.lessonEntries = entries;
    const rarity = new Map(state.markets.prices.map((p) => [p.ref, p.rarity]));
    return ladderLevels(entries, new Date().toISOString().slice(0, 10), (dealer) => {
      const model = state.personas.find((p) => p.id === dealer)?.model;
      const level = model?.public.level;
      return { ...(level !== undefined ? { level } : {}), limit: (band) => model?.bands[band]?.limit.value ?? undefined };
    }, (card) => rarity.get(card));
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
          herWalkAfterRounds: () => this.state?.personas.find((p) => p.id === id)?.model?.strategy.walk_after_rounds.value ?? undefined,
          unlockChase: () => (this.state ? unlockChaseFor(this.state, id) : undefined),
          packValueOf: (pack) => this.state?.packs.types.find((t) => t.id === pack)?.ourValue,
          pageTargets: this.o.pageTargets,
          pageBonusScored: this.o.pageBonusScored ?? false,
          // A pending one-shot greeting needs a thread to ride on, so it suspends the hopeless filter for this dealer.
          herBand: (band) => {
            if (this.state && greetingFor(this.state, id)) return undefined;
            const l = this.state?.personas.find((p) => p.id === id)?.model?.bands[band]?.limit;
            return l && l.source === "measured" && l.lo !== null && l.hi !== null ? { lo: l.lo, hi: l.hi, n: l.n } : undefined;
          },
          // Pablo, 3 Oct: a duplicate may go below its value when the ladder gain (P) covers the value given up.
          ladderSellDiscount: () => {
            const lvl = this.state?.personas.find((p) => p.id === id)?.model?.public.level;
            return lvl === undefined || LADDER_UNVERIFIED.has(id) ? 0 : ladderGain(this.ladderNow, lvl, expectedShare(this.ladderNow, id)) * LADDER_P_PER_POINT;
          },
          eggOpen: () =>
            this.o.eggOpen === id &&
            !!this.state &&
            nextProbeFor(this.state, id) !== undefined &&
            !this.state.conversations.some((c) => c.counterparty === id) &&
            !this.lessonEntries.some((e) => e.dealer === id && (e.ts ?? "").startsWith(new Date().toISOString().slice(0, 10))),
          teamReceived: () => this.teamReceived,
          ownsThread: (thread) => openedByPlay(thread),
          teamDemand: () => introDemand(this.state?.ours.team),
          pastNoDeals: (key) => pastNoDeals(this.lessonEntries, id, key, new Date().toISOString().slice(0, 10)),
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
    const reserve = pageReserveOf(state, me, this.o.pageTargets, await pageTargetCaps(this.client, me, this.o.pageTargets, this.o.pageBonusScored ?? false));
    this.team.pageReserve = reserve.amount;
    this.team.venueReserve = this.venueReserve;
    if (reserve.amount) out.notes.push(`page reserve: ${reserve.amount} P kept for ${reserve.refs.join(", ")} (${reserve.why}; other page-card buys stay above it)`);
    this.lessons.observe(me.score as { neg_points?: unknown; ladder_points?: unknown } | undefined, clock.tick);
    // Score audit: each deal should score your_value − price at our private values; every Δ is checked against our settlements.
    const audit = this.scoreAudit.observe({ tick: clock.tick, me, events: state.events ?? [], values: this.client.cachedValues() });
    if (audit.line) out.notes.push(audit.line);
    this.mode = "propose";
    this.collected = [];
    this.ladderNow = this.ladderOf(state);
    if (me.id) this.teamReceived = updateTeamReceived(join(process.cwd(), "results", "bazaar-live", new Date().toLocaleDateString("sv-SE")), me.id, state.events ?? []);
    // Forex: the dealer-to-dealer chains found this tick replace the seed routes (none found, none run).
    // A route whose copy we still hold stays until it is sold, even if the chain is no longer found.
    if (state.forex) {
      const found = state.forex.chains.filter((c) => c.automated).map((c) => ({ card: c.card, from: c.buy.at, maxBuy: c.maxBuy, to: c.sell.at, minSell: c.minSell, plausibleBid: c.sell.price, fees: c.buy.fee + c.sell.fee }));
      const held = forexRoutes().filter((r) => (state.ours.holdings.byRef[r.card] ?? 0) > 1 && !found.some((f) => f.card === r.card));
      setForexRoutes([...found, ...held]);
    }
    this.trace.muted = true;
    for (const [id, agent] of this.agents) {
      this.logs.length = 0;
      await agent.step(clock);
      out.notes.push(...this.logs.filter((l) => l.startsWith("unlock-chase ") || l.includes("named-card-revalue") || l.includes(": hopeless (") || l.startsWith("ladder-floor ") || l.startsWith("egg-open ")).map((l) => `dealer ${id}: ${l}`));
      const quiet = this.logs.filter((l) => !/\b(open|accept|counter|hold|close)\b.*dry-run/.test(l));
      if (!this.collected.some((i) => i.dealer === id)) out.notes.push(`dealer ${id}: ${quiet.at(-1)?.replace(/^\[tick \d+\]( \(dry-run\))? · /, "") ?? "no action"}`);
    }
    out.notes.push(...this.lessonLines.splice(0));
    // Ladder-aware opens: empty slots at higher levels first, then deals that would beat the weakest of a level's top 3.
    const ladder = this.ladderNow;
    const levelOf = (dealer: string) => state.personas.find((p) => p.id === dealer)?.model?.public.level;
    const emptyLevels = [...this.agents.keys()].flatMap((d) => {
      const lvl = levelOf(d);
      return lvl !== undefined && !ladder.some((l) => l.level === lvl) ? [`L${lvl} ${d} 0/${LADDER_SLOTS}`] : [];
    });
    out.notes.push(`${formatLadder(ladder)}${emptyLevels.length ? ` · empty: ${emptyLevels.join(" · ")}` : ""}`);
    for (const i of this.collected) {
      const conv = i.thread !== undefined ? `dealer:${i.thread}` : undefined;
      const ev = i.value !== undefined && i.price !== undefined ? (i.side === "buy" ? i.value - i.price : i.price - i.value) : i.value;
      const what = `${i.dealer} ${i.kind.toUpperCase()} ${i.target}${i.thread !== undefined ? ` (thread ${i.thread})` : ""}${i.price !== undefined ? ` @ ${i.price} P` : ""}${i.rule ? ` (${i.rule})` : ""}${i.text ? ` "${i.text}"` : ""}`;
      const sold = /^sell:(\d+)$/.exec(i.target)?.[1];
      // A named card we buy shares a `buy:<ref>` lock with El Rastro bids: one route per card and tick.
      const bought = /^buy:([A-Z]+-\d+)$/.exec(i.target)?.[1];
      const locks = [...(sold ? [`asset:${sold}`] : []), ...(bought ? [`buy:${bought}`] : [])];
      const base = { id: dealerKey(i), route: "dealers" as const, summary: what, ...(conv ? { conversation: conv } : {}), ...(ev !== undefined ? { ev } : {}), ...(locks.length ? { locks } : {}) };
      if (i.kind === "accept") {
        const page = i.side === "buy" && i.cards.some((c) => completesPage(c, me, state.ours.album.pages, this.o.pageTargets));
        out.intents.push({ ...base, kind: "accept", acceptClass: page ? "page-completing" : "dealer-ladder" });
      } else if (i.kind === "open") {
        const w = i.side === "buy" ? demandWeight(state.time.gameHour) : 1;
        const lvl = levelOf(i.dealer);
        const share = expectedShare(ladder, i.dealer);
        // Audit, 3 Oct: our Picaros sales at t1311 (SAL-03 @4) and t1355 (MAL-08 @10) left the server's ladder_points at
        // 0.27 (modelled +10.8 P at share 0.82): until her level is shown to score, no ladder bonus with her.
        const bonus = ev !== undefined && lvl !== undefined && !LADDER_UNVERIFIED.has(i.dealer) ? ladderGain(ladder, lvl, share) * LADDER_P_PER_POINT : 0;
        // Dealer deals score only through the ladder (RULES: best three per level by share of her range), never neg_points.
        // Pablo, 3 Oct: open with a dealer only if it raises her level's ladder (empty slot, or beats the weakest of the
        // top three) or we really want the card (a buy of a card we don't hold). Abuela L1 and Chato L2 are 3/3 at ~1.0.
        // Exception: a pending one-shot greeting (Abuela's saint's day) needs a thread to ride on.
        const wanted = i.side === "buy" && i.cards.some((c) => !me.assets.some((a) => a.ref === c && (a.kind ?? "card") === "card"));
        // Pablo, 3 Oct: a forex leg (Picaros -> Pilar, `forex.ts`) opens on its margin even without ladder gain.
        const forex = i.cards.some((c) => (i.side === "buy" ? forexBuyRoute(i.dealer, c) : forexSellRoute(i.dealer, c)) !== undefined);
        if (bonus <= 0 && !wanted && !forex && !greetingFor(state, i.dealer)) {
          out.notes.push(`dealer ${i.dealer}: ${i.target} skipped (no ladder gain at L${lvl ?? "?"} and not a card we want)`);
          continue;
        }
        const notes = [...(w !== 1 ? [`demand ×${w.toFixed(2)}`] : []), ...(bonus > 0 ? [`ladder +${bonus.toFixed(1)} P (L${lvl}, expected share ${share.toFixed(2)})`] : [])];
        out.intents.push({ ...base, kind: "open", ...(ev !== undefined && notes.length ? { ev: Math.round((ev * w + bonus) * 100) / 100, summary: `${what} · ${notes.join(" · ")}` } : {}) });
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

/**
 * Today's no-deal threads with `dealer` on target `key` (`sell:620`, `buy:SAL-09`…, the suffix of the lesson's `item`)
 * and her best price across them: the highest she bid when she buys, the lowest she asked when she sells.
 */
export function pastNoDeals(entries: readonly LessonEntry[], dealer: string, key: string, day: string): { n: number; best: number; lastTs?: string } | undefined {
  const mine = entries.filter((e) => e.dealer === dealer && e.outcome !== "deal" && (e.ts ?? "").startsWith(day) && /\(([^)]+)\)$/.exec(e.item)?.[1] === key && e.her_prices.length);
  if (!mine.length) return undefined;
  const prices = mine.flatMap((e) => e.her_prices);
  const lastTs = mine.map((e) => e.ts ?? "").sort().at(-1);
  return { n: mine.length, best: mine[0]!.kind === "sell" ? Math.max(...prices) : Math.min(...prices), ...(lastTs ? { lastTs } : {}) };
}

/** Catalog for the page-target caps (it does not change within the day): one GET per run. */
let catalogOnce: Promise<Catalog> | undefined;

/**
 * Cap of each page target we lack (`pageTargetCap`): its base without the page bonus, or 0.9 × its value with
 * `--page-bonus-scored`. GET only (catalog once, `/api/me/value` from the client's cache); a failed read leaves it out.
 */
export async function pageTargetCaps(client: BazaarClient, me: Me | undefined, pageTargets: readonly string[], pageBonusScored: boolean): Promise<Map<string, number>> {
  const caps = new Map<string, number>();
  const refs = pageTargets.filter((t) => !me?.assets.some((a) => a.ref === t && (a.kind ?? "card") === "card"));
  if (!me || !refs.length) return caps;
  try {
    catalogOnce ??= client.catalog();
    const catalog = await catalogOnce;
    const zero = new Map<string, number>();
    for (const ref of refs) zero.set(ref, await client.value(ref));
    const held = heldAssets(me.assets);
    const model = buildValueModel(catalog, held, zero);
    for (const ref of refs) caps.set(ref, pageTargetCap(ref, model, countHoldings(held), pageBonusScored));
  } catch (e) {
    catalogOnce = undefined;
    if (!(e instanceof BazaarError)) throw e;
  }
  return caps;
}

/**
 * Cash kept for page-target cards we still lack, up to each one's cap (`pageTargetCaps`: base, or 0.9 × value with
 * `--page-bonus-scored`); if a dealer already asked less, her last price. Incoming cash goes to SAL-09 first: other
 * page-card buys stay above it, so a cheap El Rastro accept never takes its cash. A target with no cap keeps the last
 * dealer ask (none asked, nothing kept).
 */
export function pageReserveOf(state: GameState, me: Me | undefined, pageTargets: readonly string[], caps: ReadonlyMap<string, number> = new Map()): { refs: string[]; amount: number; why: string } {
  const refs = pageTargets.filter((t) => !me?.assets.some((a) => a.ref === t && (a.kind ?? "card") === "card"));
  let amount = 0;
  const why: string[] = [];
  for (const ref of refs) {
    const asked = state.conversations
      .filter((c) => c.kind === "dealer" && c.side === "buy" && c.asset.ref === ref && c.history.herPrices.length)
      .sort((a, b) => Number(a.id.split(":")[1]) - Number(b.id.split(":")[1]))
      .at(-1);
    const ask = asked ? (asked.history.herCurrent?.price ?? asked.history.herPrices.at(-1)!) : undefined;
    const cap = caps.get(ref);
    const keep = cap === undefined ? (ask ?? 0) : ask !== undefined ? Math.min(cap, ask) : cap;
    amount += keep;
    why.push(`${ref} ${keep} P = ${cap === undefined ? "last dealer ask" : ask !== undefined && ask < cap ? `dealer ask ${ask} < cap ${cap}` : `cap ${cap}`}`);
  }
  return { refs, amount, why: why.join(", ") };
}

// ---------------------------------------------------------------- El Rastro

export class TradesRoute {
  readonly agent: TradesAgent;
  private last: { state: TradeState; plan: TickPlan } | undefined;
  /** `--scanner`: listings are held back by a sale at our marginal value (otherwise by a duplicate sale at first-copy value). */
  scanner = false;
  /** Scanner settings shared with the markets route (ledger, cash floor, hourly cap) so the hold-back matches its decision. */
  scannerContext: Pick<MarketsContext, "ledger" | "cashFloor" | "spendPerHour"> = {};

  /** `params`: the coordinator's `--max-spend`, `--cash-floor`, `--page-targets` and `--page-bonus-scored` (otherwise the El Rastro defaults). */
  constructor(
    private readonly client: BazaarClient,
    dryRun: boolean,
    private readonly params: Partial<Pick<TradeParams, "maxSpend" | "cashFloor" | "pageTargets" | "pageBonusScored" | "rastroBids" | "rivalSwap">> = {},
    backoffFile?: string,
  ) {
    this.agent = new TradesAgent(client, { ...DEFAULT_TRADE_PARAMS, ...params }, { dryRun, log: () => {}, ...(backoffFile ? { backoffFile } : {}) });
  }

  /** Page reserve of the last proposal (P): directed bids of the markets route stay above it too. */
  lastReserve = 0;
  /** Venue-switch reserve (P above the cash floor), set by the coordinator each tick: only page-completing buys use it. */
  venueReserve = 0;

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
    const reserve = pageReserveOf(state, me, pageTargets, await pageTargetCaps(this.client, me, pageTargets, this.params.pageBonusScored ?? false));
    this.lastReserve = reserve.amount;
    this.last = await this.agent.propose(state.rivals ? tradeSignals(state.rivals, state.tick) : undefined, reserve.amount ? { refs: reserve.refs, amount: reserve.amount } : undefined, this.venueReserve);
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
    // A card one of our dealer threads is already buying gets no El Rastro bid, and a resting one is cancelled:
    // two routes would buy two copies, and the second is worth ~25 % of the first.
    const dealerBuys = new Set(state.conversations.flatMap((c) => (c.kind === "dealer" && c.side === "buy" && c.phase !== "done" && c.asset.ref ? [c.asset.ref] : [])));
    for (const c of state.conversations) {
      const id = Number(/^rastro:(\d+)$/.exec(c.id)?.[1]);
      if (c.kind !== "rastro" || c.side !== "buy" || c.phase === "done" || !c.asset.ref || !dealerBuys.has(c.asset.ref) || !c.history.ourPrices.length || !Number.isFinite(id)) continue;
      if (!plan.cancels.some((x) => x.id === id)) plan.cancels.push({ id, reason: `a dealer thread is buying ${c.asset.ref}` });
    }
    for (const c of plan.cancels) out.intents.push({ id: `trades:cancel:${c.id}`, route: "trades", kind: "cancel", summary: `El Rastro: CANCEL #${c.id} (${c.reason})` });
    // Scanner on: the same context the markets route gets this tick (directed listings from this El Rastro state, page targets).
    const trade = this.scanner ? this.last.state : undefined;
    const saleCtx: MarketsContext = trade ? { ...this.scannerContext, directedRefs: new Set(directedListings(trade).map((d) => d.ref)), pageTargets, venueReserve: this.venueReserve } : {};
    // The scanner's sales this tick, computed once (marketSale would rerun proposeMarkets per listing).
    const scannerSales = trade ? proposeMarkets(state, new Map(), { ...saleCtx, scanner: true, trade }).sales : undefined;
    // `sell:<ref>` (one sale of a card per tick across routes) goes on the first listing of each card only: a second spare
    // copy repriced in the same tick must not be dropped by its sibling (its cancel would leave it unlisted and churn).
    const listedRefs = new Map<string, number>();
    plan.posts.forEach((p, k) => {
      // Never list a card below a better bid the markets route would take this tick (v02 bid 22 vs our El Rastro listing at 14).
      const sale = p.kind === "list" ? (scannerSales ? scannerSales.get(p.ref) : marketSale(state, p.ref)) : undefined;
      if (sale && sale.quote.price > p.price) {
        out.notes.push(`El Rastro: list ${p.ref} @ ${p.price} P held back: bid ${sale.quote.price} P on ${sale.venue.id} (#${sale.quote.offer}, net ${sale.net}) goes through the markets route`);
        return;
      }
      if (p.kind === "bid" && dealerBuys.has(p.ref)) {
        out.notes.push(`El Rastro: bid ${p.ref} @ ${p.price} P held back: a dealer thread of ours is buying it`);
        return;
      }
      const nth = p.kind === "list" ? (listedRefs.get(p.ref) ?? 0) : 0;
      if (p.kind === "list") listedRefs.set(p.ref, nth + 1);
      const sellLock = nth === 0 ? `sell:${p.ref}` : `sell:${p.ref}#${nth + 1}`;
      const locks = [...("assets" in p.body.give ? p.body.give.assets : []).map((id) => `asset:${id}`), ...(p.kind === "list" ? [sellLock] : [`buy:${p.ref}`])];
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
      // A reprice cancel goes only with its replacement: if the new post was dropped, the old offer stays up.
      cancels: plan.cancels.filter((c) => selected.has(`trades:cancel:${c.id}`) && plan.posts.every((p, k) => p.replaces !== c.id || selected.has(`trades:post:${k}`))),
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
        if (e instanceof BazaarError && e.code === "already_flagged") {
          // Flagged on an earlier day (flags.json is per day): record it so it is not retried every tick.
          records.push({ messageId: f.messageId, reason, tick: state.tick, persona: c.counterparty, result: "pending" });
          lines.push(`flags: message ${f.messageId} already flagged on the server (recorded)`);
          continue;
        }
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
  /**
   * One-shot line per persona (`GREETINGS`), sent once per day on a counteroffer, even after our egg there fired.
   * Pilar and banco carry the LAT-12 question (approved by Pablo; only on threads opened for a deal, never one of its own).
   */
  greetings: { abuela: GREETINGS[0]!, pilar: GREETINGS[1]!, banco: GREETINGS[1]! } as Readonly<Record<string, string>>,
  /**
   * One-shot line per persona that only rides from our 2nd counteroffer of a thread opened for a real deal (Chato's egg
   * needs to arrive mid-deal). Once a day; unlike `greetings` it never opens a thread nor relaxes a filter.
   */
  midDeal: { chato: GREETINGS[2]! } as Readonly<Record<string, string>>,
};

/** Probe text as it goes in the message: the greeting itself, or the egg question. */
export function probeText(x: string): string {
  return GREETINGS.includes(x) ? x : EGG_PARAMS.template.replace("{hint}", x);
}

/** The persona's mid-deal line if this thread already carries a price of ours and the line has not gone out today. */
function midDealFor(state: GameState, conv: GameState["conversations"][number]): string | undefined {
  const g = EGG_PARAMS.midDeal[conv.counterparty];
  const persona = state.personas.find((p) => p.id === conv.counterparty);
  if (!g || !persona || conv.history.ourPrices.length < 1) return undefined;
  const sent = [...state.conversations.filter((c) => c.counterparty === conv.counterparty).flatMap((c) => c.eggsTried), ...persona.eggProbes.map((x) => x.phrase)];
  return sent.includes(g) ? undefined : g;
}

/** The persona's greeting if it has not gone out yet today (any of its conversations or its `eggProbes`). */
function greetingFor(state: GameState, personaId: string): string | undefined {
  const g = EGG_PARAMS.greetings[personaId];
  const persona = state.personas.find((p) => p.id === personaId);
  if (!g || !persona) return undefined;
  const sent = [...state.conversations.filter((c) => c.counterparty === personaId).flatMap((c) => c.eggsTried), ...persona.eggProbes.map((x) => x.phrase)];
  return sent.includes(g) ? undefined : g;
}

/**
 * Probe phrases for `persona`, best first. Hints plant rumours about OTHER stalls, so a line that names this persona
 * from another stall ranks first ("ask Carmen about the golden chulapa" → abuela); then the persona's own lines
 * labelled egg-clue; then its own unlabelled keywords. Lines labelled 'voice' never give a phrase. Each line offers
 * the LLM phrase and the rule keyword; only valid ones (`isProbePhrase`: no digits) and only once.
 */
export function probePhrasesFor(hints: readonly HintLine[], persona: string): string[] {
  const rank = (l: HintLine): number | undefined => {
    if (l.classification === "voice") return undefined;
    if (l.persona !== persona) return l.targets?.includes(persona) ? (l.classification === "egg-clue" ? 0 : 1) : undefined;
    if (l.targets?.length) return undefined;
    return l.classification === "egg-clue" ? 2 : 3;
  };
  const seen = new Set<string>();
  return hints
    .flatMap((l) => {
      const r = rank(l);
      return r === undefined ? [] : [l.phrase, l.keyword].map((x) => ({ k: x?.trim(), r, tick: l.tick ?? 0 }));
    })
    .sort((a, b) => a.r - b.r || Number(isSpanishPhrase(b.k)) - Number(isSpanishPhrase(a.k)) || b.tick - a.tick)
    .flatMap(({ k }) => {
      // Keywords cut from the middle of a sentence ("to pack up", "your lucky face") are not a topic a dealer could know about.
      if (!k || !isProbePhrase(k) || /^(to|your|this|it|her|him)\s/i.test(k) || seen.has(normalize(k))) return [];
      seen.add(normalize(k));
      return [k];
    });
}

/**
 * Spanish phrase (an accented letter or a Spanish article first). Within a rank it goes first: our only egg fired on
 * the Spanish phrase although the hint was in English, and the English Moscow gold probe missed at chato (thread 900).
 */
export function isSpanishPhrase(x: string | undefined): boolean {
  return !!x && (/[áéíóúñ¿¡]/i.test(x) || /^(el|la|los|las|del|un|una)\s/i.test(x)); // game text
}

/**
 * X phrase of the probe that can ride on the next counteroffer in `conversationId` (never in a separate message):
 * at most one per conversation (`eggsTried` empty), plus one Spanish retry after an English miss, never the same X with the same persona (`eggsTried` of all its
 * conversations and its `eggProbes`), never with warnings, strikes or cooloff, and only from `probePhrasesFor`.
 */
export function eggProbeFor(state: GameState, conversationId: string): string | undefined {
  const conv = state.conversations.find((c) => c.id === conversationId);
  if (!conv || conv.kind !== "dealer") return undefined;
  if (conv.mood.warnings > 0 || conv.mood.strikes > 0 || conv.mood.cooloffUntil !== undefined) return undefined;
  if (state.ours.strikes && Object.keys(state.ours.strikes).length) return undefined;
  const midDeal = midDealFor(state, conv);
  if (midDeal) return midDeal;
  // Before our 2nd counteroffer, nothing else spends the mid-deal persona's thread.
  if (EGG_PARAMS.midDeal[conv.counterparty] && conv.history.ourPrices.length < 1) return undefined;
  if (conv.eggsTried.length > 1) return undefined;
  const greeting = greetingFor(state, conv.counterparty);
  if (greeting) return greeting;
  const x = nextProbeFor(state, conv.counterparty);
  // A second probe in the same conversation only as the Spanish retry after an English miss.
  if (conv.eggsTried.length === 1 && (!x || !isSpanishPhrase(x) || isSpanishPhrase(conv.eggsTried[0]))) return undefined;
  return x;
}

/** Next probe phrase for `personaId` not yet tried with it (any of its conversations or its `eggProbes`); none if its eggs ran out. */
function nextProbeFor(state: GameState, personaId: string): string | undefined {
  const persona = state.personas.find((p) => p.id === personaId);
  if (!persona) return undefined;
  const eggs = state.world.eggs.byPersona[persona.id];
  if (eggs && eggs.left <= 0) return undefined;
  // Eggs are once per team: after ours fired at this persona, more probes there only risk a spam label (Abuela kept getting them).
  if (state.ours.eggs.some((e) => e.persona === persona.id)) return undefined;
  const tried = new Set([...state.conversations.filter((c) => c.counterparty === persona.id).flatMap((c) => c.eggsTried), ...persona.eggProbes.map((x) => x.phrase)].map(normalize));
  return probePhrasesFor(state.hints.all, persona.id).find((k) => !tried.has(normalize(k)) && !tried.has(normalize(EGG_PARAMS.template.replace("{hint}", k))));
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
      if (x) out.notes.push(`${c.id}: next counter carries "${probeText(x)}"`);
    }
    // Queued for a dealer with no open thread (e.g. a hint routed to chato): it waits for the next counter there, never a message of its own.
    const open = new Set(state.conversations.filter((c) => c.kind === "dealer" && c.phase !== "done").map((c) => c.counterparty));
    for (const p of state.personas) {
      if (p.status === "announced" || p.status === "closed" || open.has(p.id) || (quiet[p.id] ?? -1) >= state.tick) continue;
      const x = greetingFor(state, p.id) ?? nextProbeFor(state, p.id);
      if (x) out.notes.push(`${p.id}: queued "${probeText(x)}" (no open thread: rides on the next counter there)`);
    }
    if (!out.notes.length) out.notes.push(`no probe (hints ${state.personas.reduce((a, p) => a + p.hints.length, 0)}; a probe needs a hint keyword and rides only on a counter)`);
    return out;
  }
}
