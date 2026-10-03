import type { BazaarClient } from "../shared/client.js";
import type { Clock, DealerInfo, Me } from "../shared/schemas.js";
import type { TraceRecord, TraceSink } from "../shared/trace.js";
import { BazaarAgent, type DealerIntent } from "../dealers/agent.js";
import { dealsPerHourOf, negotiatorForDealer, traitsOf, unlockedDealerIds } from "../dealers/dealer-profile.js";
import { TeamBudget } from "../dealers/team.js";
import { DuelsAgent, formatDuelEntry, type DuelProposal } from "../duels/agent.js";
import { duelsApi } from "../duels/schemas.js";
import { TradesAgent } from "../trades/agent.js";
import { DEFAULT_TRADE_PARAMS, type TickPlan, type TradeState } from "../trades/trades.js";
import { completesPage, duelStrategy, type Strategy, type StrategyDecision } from "../state/conversation.js";
import type { GameState } from "../state/game-state.js";
import type { Intent } from "./coordinator.js";

/**
 * Rutas del coordinador. Cada una propone sus intenciones del tick SIN enviarlas (solo GET) y, en vivo, ejecuta
 * solo las que el coordinador seleccionó. Reutilizan los agentes de siempre: `DuelsAgent.propose/execute`,
 * `TradesAgent.propose/execute` y `BazaarAgent` con `gate` (cada POST pasa antes por el coordinador).
 */

export interface RouteProposal {
  intents: Intent[];
  /** Líneas informativas (duelos en espera, dealers sin objetivo...). */
  notes: string[];
  /** Estrategia por conversación (`duel:177`...), calculada por código. */
  strategies: Map<string, Strategy>;
  /** Última decisión por conversación (dealers), para la entidad Conversation. */
  decisions: Map<string, StrategyDecision>;
}

const empty = (): RouteProposal => ({ intents: [], notes: [], strategies: new Map(), decisions: new Map() });

// ---------------------------------------------------------------- duelos

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
   * Ejecuta lo seleccionado. En dry-run el agente no envía nada: solo marca cada entrada (dry-run, deferred, skipped),
   * así que sirve también para imprimir qué haría con cada duelo.
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

/** Traza que el coordinador silencia en la pasada de propuestas (para no duplicar registros). */
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
}

const dealerKey = (i: DealerIntent) => `dealers:${i.kind}:${i.dealer}:${i.thread ?? i.target}`;

const DEALER_REASON: Record<DealerIntent["kind"], string> = {
  open: "best value-creating target on the dealer's menu",
  accept: "her offer is within our limit and creates value",
  counter: "next step on the planned path",
  hold: "hold our price while waiting for her final",
  close: "no deal within our limit",
};

export class DealersRoute {
  private readonly agents = new Map<string, BazaarAgent>();
  private readonly team: TeamBudget;
  private readonly trace: SwitchableTrace;
  private collected: DealerIntent[] = [];
  private allowed = new Set<string>();
  private mode: "propose" | "execute" = "propose";
  private readonly logs: string[] = [];

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

  /** Un `BazaarAgent` por dealer desbloqueado, como el modo serio (ficha obligatoria, perfil por dealer). */
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
        }),
      );
    }
  }

  async propose(clock: Clock, state: GameState): Promise<RouteProposal> {
    const out = empty();
    const me = await this.client.me();
    await this.ensureAgents(me);
    this.mode = "propose";
    this.collected = [];
    this.trace.muted = true;
    for (const [id, agent] of this.agents) {
      this.logs.length = 0;
      await agent.step(clock);
      const quiet = this.logs.filter((l) => !/\b(open|accept|counter|hold|close)\b.*dry-run/.test(l));
      if (!this.collected.some((i) => i.dealer === id)) out.notes.push(`dealer ${id}: ${quiet.at(-1)?.replace(/^\[tick \d+\]( \(dry-run\))? · /, "") ?? "no action"}`);
    }
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
        out.intents.push({ ...base, kind: "open" });
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

  /** En vivo: segunda pasada con la puerta abierta solo para lo seleccionado (sus GET se repiten; si algo cambió, no sale). */
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
    return lines;
  }
}

// ---------------------------------------------------------------- El Rastro

export class TradesRoute {
  readonly agent: TradesAgent;
  private last: { state: TradeState; plan: TickPlan } | undefined;

  constructor(client: BazaarClient, dryRun: boolean) {
    this.agent = new TradesAgent(client, DEFAULT_TRADE_PARAMS, { dryRun, log: () => {} });
  }

  async propose(state: GameState, me: Me | undefined, pageTargets: readonly string[]): Promise<RouteProposal> {
    const out = empty();
    this.last = await this.agent.propose();
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
    plan.posts.forEach((p, k) => out.intents.push({ id: `trades:post:${k}`, route: "trades", kind: "listing", ev: p.value, locks: ("assets" in p.body.give ? p.body.give.assets : []).map((id) => `asset:${id}`), summary: `El Rastro: POST ${p.kind} ${p.ref} @ ${p.price} P (${p.why}, value ${p.value.toFixed(1)})` }));
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
