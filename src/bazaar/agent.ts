import { BazaarError, type BazaarClient } from "./client.js";
import { closeText, counterText, holdText, textMatchesPrice } from "./messages.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, type Decision, type NegotiatorParams, type ThreadView } from "./negotiator.js";
import { applyOnly, formatPlan, menuBlocks, rankCandidates, selectCandidates, type OnlyFilter } from "./plan.js";
import { buyTargets, missingPageCards, raritySetTargets, rarityOf, spareTargets, type Target } from "./planner.js";
import { StandingOfferSchema, type Catalog, type Clock, type DealerInfo, type Me, type Thread } from "./schemas.js";
import { formatPatience, PatienceLog } from "./patience.js";
import type { TraceRecord, TraceSink } from "./trace.js";
import { gameHours } from "./dealer-profile.js";
import { TeamBudget } from "./team.js";
import { copiesOf, formatThreadSummary, outcomeOf, revealedCards, valueCreated, type ThreadOutcome, type ThreadSummary } from "./thread-log.js";
import { isDealer, sideOfTopic, threadPrices, type DealerRef } from "./view.js";
import { checkStructure, dealerOffers, expectationOf, firstMismatch } from "./offer-structure.js";
import { busyAssets, sellBlocked } from "./asset-locks.js";

/**
 * Bucle observar → decidir → actuar contra un dealer, un hilo a la vez. Toda cifra sale de
 * `decide`; el texto, de plantillas con la misma cifra. En `dryRun` no hace ningún POST.
 */

export type BazaarApi = Pick<BazaarClient, "me" | "catalog" | "value" | "myThreads" | "myOffers" | "thread" | "openThread" | "say" | "closeThread" | "accept">;

export interface AgentOptions {
  dealer: DealerRef;
  dryRun: boolean;
  /** Gasto máximo por hora de reloj en compras (P). */
  maxSpendPerHour: number;
  /** Fracción de your_value que pagamos como máximo. */
  safety?: number;
  maxLookups?: number;
  /** Sobrescribe parámetros del negociador (ancla, Boulware, aguantes...); el resto queda por defecto. */
  negotiator?: Partial<NegotiatorParams>;
  /** Ficha del dealer: con ella los objetivos salen del planificador por menú (`plan.ts`); sin ella, del antiguo. */
  menu?: DealerInfo;
  /** Modo serio: sin ficha del dealer no se abre nada (el planificador antiguo vende a cualquiera, sin mirar su menú). */
  requireMenu?: boolean;
  /** Topes de la ejecución: tratos (se para al llegar), conversaciones abiertas en total y gasto en compras. */
  maxDeals?: number;
  maxThreads?: number;
  maxSpendTotal?: number;
  /** `--only`: solo estos objetivos del planificador por menú, en este orden (aunque no dejen margen sobre su lista). */
  only?: readonly OnlyFilter[];
  /** Topes compartidos entre dealers (gasto, suelo de caja, una aceptación por tick); si falta, uno propio. */
  team?: TeamBudget;
  /** Tratos por hora de juego con este dealer (`menu.deals_per_team_per_hour`); al llegar, no abre más hasta que pase la hora. */
  dealsPerHour?: number;
  /** Resumen de cada conversación terminada (cartas, copias, apertura/final, paciencia...). */
  onThreadSummary?: (s: ThreadSummary) => void;
  trace: TraceSink;
  now?: () => number;
  log?: (line: string) => void;
}

interface Active {
  id: number;
  target: Target;
  lastSentTick?: number;
  /** Precios que hemos enviado en este hilo (fuente fiable; el hilo solo se usa al retomarlo). */
  sent: number[];
  /** Aguantes (mismo precio, sin oferta nueva) ya gastados en este hilo. */
  holdsUsed: number;
  /** Mensajes, respuestas, tics hasta su final y su respuesta a cada paso nuestro. */
  patience: PatienceLog;
  openTick?: number;
  openTs?: string;
  /** Cartas de la conversación y copias que teníamos al abrir; ids de activos al abrir (para ver qué llegó). */
  cards: string[];
  copiesBefore: Record<string, number>;
  assetIds?: Set<number>;
  negBefore?: number;
  ladderBefore?: number;
  /** Rareza+set: carta que ella ofrece, ya revalorada a nuestro valor. */
  revealed?: string;
  lastRule?: string;
  /** Compra que aceptamos nosotros: su precio ya se contó en el presupuesto (no se cuenta dos veces al cerrar). */
  acceptedPrice?: number;
}

const HOUR_MS = 3_600_000;
const STOP_CODES = new Set(["sold_out", "locked", "asset_locked", "insufficient_cash", "invalid", "not_found", "http_404", "closed"]);

export class BazaarAgent {
  private active: Active | undefined;
  private blockedUntilMs = 0;
  private cooloffUntilTick = -1;
  private readonly skip = new Map<string, number>();
  private readonly team: TeamBudget;
  /** Horas de juego de cada trato con este dealer (cuota por hora). */
  private readonly dealHours: number[] = [];
  private hoursNow = 0;
  private lastCash: number | undefined;
  /** Caja del paso anterior: si un trato cierra sin precio visible, la caída de caja es lo gastado. */
  private prevCash: number | undefined;
  private readonly values = new Map<string, number>();
  private catalog: Catalog | undefined;
  /** Si el dealer rechaza `{buy: {card}}`, se compra por rareza y set. */
  private cardTopicOk = true;
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

  /** Ficha releída de `/api/dealers/{id}` (el menú puede cambiar a mitad de partida). */
  setMenu(menu: DealerInfo): void {
    this.o.menu = menu;
  }

  get dealerId(): string {
    return this.o.dealer.id;
  }

  spentThisHour(): number {
    return this.team.spentThisHour();
  }

  /** Lo que aún se puede gastar: lo que queda de la hora, de la ejecución y de la caja por encima del suelo. */
  budgetLeft(cash: number | undefined = this.lastCash): number {
    return this.team.left(cash);
  }

  /** Tratos con este dealer en la última hora de juego. */
  dealsLastHour(): number {
    return this.dealHours.filter((h) => h > this.hoursNow - 1).length;
  }

  /** Hay una conversación abierta con este dealer. */
  busy(): boolean {
    return !!this.active;
  }

  /** La ejecución terminó: se alcanzó el tope de tratos, o el de conversaciones y no queda ninguna abierta. */
  done(): boolean {
    return this.dealsDone >= (this.o.maxDeals ?? Infinity) || (!this.active && this.threadsOpened >= (this.o.maxThreads ?? Infinity));
  }

  runStats(): { deals: number; threads: number; spent: number } {
    return { deals: this.dealsDone, threads: this.threadsOpened, spent: this.spentRun };
  }

  /** Plan legible del dry-run (mismo planificador y misma caché de valores que el bucle). Solo GET. */
  async plan(): Promise<string[]> {
    if (!this.o.menu) return ["(no dealer menu: the legacy planner is used; no plan to show)"];
    const me = await this.api.me();
    this.catalog ??= await this.api.catalog();
    const safety = this.o.safety ?? 0.9;
    const caps = { maxDeals: this.o.maxDeals ?? Infinity, maxSpend: Math.max(0, Math.floor(this.budgetLeft(me.cash))), maxThreads: this.o.maxThreads ?? Infinity, safety };
    const ranked = await rankCandidates({ me, catalog: this.catalog, dealer: this.o.menu, valueOf: (c) => this.valueOf(c), safety, budget: caps.maxSpend, cardTopic: this.cardTopicOk });
    const busy = await busyAssets(this.api, me.id);
    const blocked: string[] = [];
    const menu = this.o.menu;
    const catalog = this.catalog;
    const cands = (this.o.only ? applyOnly(ranked, this.o.only) : ranked).filter((c) => {
      const why = menuBlocks(menu, catalog, c) ?? sellBlocked(c.topic, busy);
      if (why) blocked.push(`not opened: ${c.label} (${why})`);
      return !why;
    });
    const chosen = selectCandidates(cands, { maxThreads: Math.min(caps.maxThreads, 10), maxSpend: caps.maxSpend, only: !!this.o.only });
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
          await this.negotiate(thread, tick, me, ticksPerHour, emit);
          return out;
        }
        this.finish(thread, tick, ticksPerHour, emit, me);
      }
      if (this.done()) {
        emit({ action: "idle", rule: this.dealsDone >= (this.o.maxDeals ?? Infinity) ? "max-deals" : "max-threads" });
        return out;
      }
      if (this.now() < this.blockedUntilMs || tick < this.cooloffUntilTick) {
        emit({ action: "blocked", rule: this.now() < this.blockedUntilMs ? "persona_quota" : "cooloff" });
        return out;
      }
      if (this.o.dealsPerHour !== undefined && this.dealsLastHour() >= this.o.dealsPerHour) {
        emit({ action: "blocked", rule: "dealer-quota" });
        return out;
      }
      const target = await this.nextTarget(me, tick);
      if (!target) {
        emit({ action: "idle", rule: "no-target" });
        return out;
      }
      if (this.o.dryRun) {
        emit({ action: "open", target: target.key, side: target.side, reservation: target.reservation, rule: "dry-run" });
        return out;
      }
      try {
        const thread = await this.api.openThread(this.o.dealer.id, target.topic);
        this.active = { id: thread.id, target, lastSentTick: tick, sent: [], holdsUsed: 0, patience: new PatienceLog(target.side, tick), ...this.openSnapshot(me, target, tick) };
        this.threadsOpened += 1;
        const p = threadPrices(thread, target.side, this.o.dealer);
        emit({
          action: "open",
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
        } else {
          this.onError(e, tick, ticksPerHour, target, emit);
        }
      }
    } catch (e) {
      this.onError(e, tick, ticksPerHour, this.active?.target, emit);
    }
    return out;
  }

  /** Tras un reinicio: retoma el hilo abierto con el dealer, reconstruyendo el objetivo desde su topic. */
  private async adoptOpenThread(me: Me, tick: number): Promise<void> {
    const list = await this.api.myThreads("open");
    const summary = list.threads.find((t) => isDealer(this.o.dealer, t.with) && (t.status ?? "open") === "open");
    if (!summary) return;
    const thread = await this.api.thread(summary.id);
    const target = await this.targetFromTopic(thread, me);
    // Un activo, un sitio también al retomar: si el activo ya está en otra oferta u otro hilo abierto, este hilo se cierra.
    const busyWhy = target?.side === "sell" ? sellBlocked(target.topic, (await busyAssets(this.api, me.id, thread.id)) ?? new Map()) : undefined;
    if (busyWhy) {
      this.log(`  thread ${thread.id}: not resumed, ${busyWhy}: ${this.o.dryRun ? "would close it politely" : "closing it politely"}`);
      if (!this.o.dryRun) {
        await this.api.say(thread.id, closeText(0)).catch(() => undefined);
        await this.api.closeThread(thread.id);
      }
      return;
    }
    if (target) {
      this.active = { id: thread.id, target, sent: [], holdsUsed: 0, patience: new PatienceLog(target.side, tick), ...this.openSnapshot(me, target, tick) };
      this.threadsOpened += 1;
    } else if (!this.o.dryRun) await this.api.closeThread(thread.id);
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
      const vals = await Promise.all(cards.map((c) => this.valueOf(c.id)));
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      return { key: `buy:${rs.set}:${rs.rarity}`, side, topic: { buy: { rarity: rs.rarity, set: rs.set } }, reservation: Math.floor(mean * this.safety), label: `buy ${rs.rarity} ${rs.set}`, value: mean };
    }
    const card = topic?.buy?.card;
    if (side === "buy" && card) {
      const value = await this.valueOf(card);
      return { key: `buy:${card}`, side, topic: { buy: { card } }, reservation: Math.floor(value * this.safety), label: `buy ${card}`, value };
    }
    return undefined;
  }

  /** Lo que se apunta al abrir (o retomar) una conversación para su resumen. */
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

  /** Su lista para esta conversación: al comprar, la de esa entrada del menú; al vender, su lista de venta de esa rareza. */
  private listFor(target: Target): number | undefined {
    const sells = this.o.menu?.menu.sells ?? [];
    const t = target.topic as { buy?: { card?: string; rarity?: string }; sell?: unknown };
    const rarity = (target as { rarity?: string }).rarity ?? t.buy?.rarity;
    const byCard = t.buy?.card ? sells.find((e) => e.card === t.buy!.card)?.list_price : undefined;
    return byCard ?? (rarity ? (sells.find((e) => e.rarity?.toLowerCase() === rarity)?.list_price ?? undefined) : undefined);
  }

  private async valueOf(card: string): Promise<number> {
    const cached = this.values.get(card);
    if (cached !== undefined) return cached;
    const v = await this.api.value(card);
    this.values.set(card, v);
    return v;
  }

  private async nextTarget(me: Me, tick: number): Promise<Target | undefined> {
    const free = (t: Target) => (this.skip.get(t.key) ?? -1) <= tick;
    if (this.o.menu) {
      const budget = Math.max(0, Math.floor(this.budgetLeft(me.cash)));
      this.catalog ??= await this.api.catalog();
      const ranked = await rankCandidates({ me, catalog: this.catalog, dealer: this.o.menu, valueOf: (c) => this.valueOf(c), safety: this.o.safety ?? 0.9, budget, cardTopic: this.cardTopicOk });
      // Un activo, un sitio: nada que ya esté en otro hilo abierto o en una oferta abierta (El Rastro, otro dealer).
      const busy = await busyAssets(this.api, me.id);
      const { menu, catalog } = { menu: this.o.menu, catalog: this.catalog };
      const cands = (this.o.only ? applyOnly(ranked, this.o.only) : ranked).filter((c) => !menuBlocks(menu, catalog, c) && !sellBlocked(c.topic, busy));
      return selectCandidates(cands.filter(free), { maxThreads: 1, maxSpend: budget, only: !!this.o.only })[0]?.candidate;
    }
    if (this.o.requireMenu) return undefined;
    const busy = await busyAssets(this.api, me.id);
    const sell = spareTargets(me).find((t) => free(t) && !sellBlocked(t.topic, busy));
    if (sell) return sell;
    const budget = this.budgetLeft(me.cash);
    if (budget < 1) return undefined;
    this.catalog ??= await this.api.catalog();
    const missing = missingPageCards(me, this.catalog).filter((m) => (this.skip.get(`buy:${m.id}`) ?? -1) <= tick);
    const plan = { budget, cash: me.cash, safety: this.safety, maxLookups: this.maxLookups };
    const buys = this.cardTopicOk
      ? await buyTargets(missing, (c) => this.valueOf(c), plan)
      : await raritySetTargets(missing, this.catalog, (c) => this.valueOf(c), { ...plan, maxLookups: 40, rarities: ["common", "uncommon"] });
    return buys.find(free);
  }

  private async negotiate(thread: Thread, tick: number, me: Me, ticksPerHour: number, emit: (r: Omit<TraceRecord, "ts" | "tick" | "dealer" | "dryRun">) => void) {
    const active = this.active!;
    await this.repriceRevealed(thread, active);
    const { target } = active;
    const selfId = selfIdOf(thread, me);
    const p = threadPrices(thread, target.side, this.o.dealer, selfId);
    active.patience.observe(tick, p.herCurrent?.price, !!p.herCurrent?.final, herReplies(thread, this.o.dealer, selfId));
    // Nuestro último intento cuenta aunque el hilo no lo muestre (p. ej. el POST falló a medias): nunca se repite.
    const lastTried = active.sent[active.sent.length - 1];
    if (lastTried !== undefined && p.ourPrices[p.ourPrices.length - 1] !== lastTried) p.ourPrices = [...p.ourPrices, lastTried];
    const reservation = target.side === "buy" ? Math.max(0, Math.min(target.reservation, me.cash, Math.floor(this.budgetLeft(me.cash)))) : target.reservation;
    const herAt = active.patience.herAtCounters();
    const view: ThreadView = {
      side: target.side,
      reservation,
      herPrices: p.herPrices,
      ourPrices: p.ourPrices,
      ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
      ...(p.herCurrent ? { herCurrent: p.herCurrent } : {}),
      canMessage: active.lastSentTick !== tick,
      canAccept: this.team.canAccept(tick),
      holdsUsed: active.holdsUsed,
      ...(target.value !== undefined ? { privateValue: target.value } : {}),
      ...(herAt && herAt.length === p.ourPrices.length ? { herAtOurMessages: herAt } : {}),
    };
    let d: Decision = decide(view, this.negotiatorParams);
    // Antes de cualquier aceptación (y en cada oferta suya): la forma de su oferta debe ser la del hilo; si no, se cierra.
    const mismatch = await this.structureProblem(thread, target, d, reservation);
    if (mismatch) {
      this.log(`  thread ${thread.id}: structure-mismatch (${mismatch}): closing politely, never accepting`);
      d = { action: { kind: "close" }, rule: "structure-mismatch", effectiveReservation: d.effectiveReservation };
    } else if (d.action.kind === "accept" && target.side === "sell") {
      // Justo antes de vender: el activo no puede estar ya en otra oferta u otro hilo (p. ej. listado en El Rastro).
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
      ...(p.herCurrent ? { herPrice: p.herCurrent.price, herFinal: p.herCurrent.final } : {}),
      ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
    };
    try {
      switch (d.action.kind) {
        case "accept":
          if (!this.o.dryRun) await this.api.accept(d.action.offerId);
          this.team.markAccept(tick);
          if (!this.o.dryRun && target.side === "buy") {
            // Se cuenta al aceptar, con el precio de su oferta: no depende de leer luego el hilo cerrado.
            this.team.record(d.action.price);
            this.spentRun += d.action.price;
            active.acceptedPrice = d.action.price;
          }
          emit({ ...base, action: "accept", ourPrice: d.action.price, patience: active.patience.summary(tick) });
          return;
        case "counter": {
          const text = counterText(target.side, p.ourPrices.length, d.action.price);
          if (!textMatchesPrice(text, d.action.price)) throw new Error("texto y cifra no coinciden");
          if (d.action.price === p.ourPrices[p.ourPrices.length - 1]) throw new Error("precio repetido");
          // Se apunta antes del POST: si falla (o el servidor lo aceptó y la respuesta no valida), no se reenvía.
          active.lastSentTick = tick;
          active.sent.push(d.action.price);
          active.patience.sent(tick, "counter", d.action.price, p.herCurrent?.price);
          if (!this.o.dryRun) await this.api.say(thread.id, text, d.action.price);
          emit({ ...base, action: "counter", ourPrice: d.action.price, text });
          return;
        }
        case "hold": {
          const text = holdText(p.ourPrices.length, d.action.price);
          if (!textMatchesPrice(text, d.action.price)) throw new Error("texto y cifra no coinciden");
          active.lastSentTick = tick;
          active.holdsUsed += 1;
          active.patience.sent(tick, "hold", d.action.price, p.herCurrent?.price);
          if (!this.o.dryRun) await this.api.say(thread.id, text);
          emit({ ...base, action: "hold", ourPrice: d.action.price, text });
          return;
        }
        case "close": {
          if (!this.o.dryRun) {
            if (view.canMessage) await this.api.say(thread.id, closeText(p.ourPrices.length)).catch(() => undefined);
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
   * Problema de forma: alguna oferta suya contradice el hilo (nos vende algo en una venta, pide otros activos...) o
   * la que aceptaríamos no es exactamente «efectivo > 0 por nuestros activos» (venta) o «la carta pedida por efectivo
   * ≤ límite» (compra). Devuelve el motivo para la traza, o `undefined` si todo cuadra.
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

  /** Rareza+set: la carta que nos dé debe ser de esa rareza y set (según el catálogo). */
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
      if (target.side === "buy" && acceptedPrice === undefined) {
        // Trato sin precio visible ("deal at ?"): caída de caja desde el paso anterior; si tampoco, el límite (conservador).
        const drop = this.prevCash !== undefined && me ? this.prevCash - me.cash : undefined;
        const source = settled !== undefined ? "thread offers" : drop !== undefined && drop > 0 ? "cash delta" : "our limit (price unknown)";
        settled ??= drop !== undefined && drop > 0 ? drop : target.reservation;
        this.team.record(settled);
        this.spentRun += settled;
        this.log(`  thread ${thread.id}: deal, ${settled} P counted against the budgets (${source})`);
      }
      this.values.clear();
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
   * Rareza+set: su oferta dice qué carta da (`give.types` = "card:SAL-05", hilo 184). Se revalora a nuestro valor
   * de esa carta, así una repetida baja el límite y el negociador cierra en vez de pagar por ella (SAL-07 a 23).
   */
  private async repriceRevealed(thread: Thread, active: Active): Promise<void> {
    const topic = active.target.topic as { buy?: { rarity?: string; card?: string } };
    if (active.target.side !== "buy" || !topic.buy?.rarity || topic.buy.card) return;
    const card = revealedCards(thread, this.o.dealer)[0];
    if (!card || card === active.revealed) return;
    const value = await this.valueOf(card);
    const reservation = Math.floor(value * (this.o.safety ?? 0.9));
    const held = active.copiesBefore[card] ?? 0;
    this.log(`  thread ${active.id}: she offers ${card} (${held ? `DUPLICATE, we hold ${held}` : "new for us"}): our value ${Math.round(value * 10) / 10} → limit ${reservation} (was ${active.target.reservation})`);
    active.revealed = card;
    active.target = { ...active.target, value, reservation };
  }

  private applyReason(reason: string | undefined, untilTick: number | undefined, tick: number) {
    if (reason === "persona_quota") this.blockedUntilMs = (Math.floor(this.now() / HOUR_MS) + 1) * HOUR_MS + 5_000;
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

/** Nuestro id de equipo en el hilo ("t02"): `thread.team`, si no `me.id` o `me.score.team`. */
export function selfIdOf(thread: Thread, me: Me): string | undefined {
  const score = me.score as { team?: unknown } | null | undefined;
  return thread.team ?? me.id ?? (typeof score?.team === "string" ? score.team : undefined);
}

/** Precio al que cerró: la oferta aceptada (vigentes o de los mensajes) si se ve; si no, la última oferta del dealer. */
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

/** Mensajes del dealer posteriores a nuestro primer mensaje en el hilo (sus respuestas, sin su apertura). */
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

/** El servidor rechazó abrir un hilo `{buy: {card}}` por el topic (400/422 sin otro motivo conocido). */
export function isCardTopicRefusal(e: unknown, target: Target): boolean {
  return (
    e instanceof BazaarError &&
    (e.status === 400 || e.status === 422) &&
    !NOT_A_TOPIC_PROBLEM.has(e.code) &&
    "buy" in target.topic &&
    "card" in target.topic.buy
  );
}

/** Cartas de un objetivo: la carta pedida, la del activo que vendemos o las de esa rareza y set (hasta que ella diga cuál). */
export function cardsOfTarget(target: Target, me: Me): string[] {
  const t = target.topic as { buy?: { card?: string; rarity?: string; set?: string }; sell?: { assets?: number[] } };
  if (t.buy?.card) return [t.buy.card];
  if (t.sell?.assets) return [...new Set(t.sell.assets.map((id) => me.assets.find((a) => a.id === id)?.ref).filter((r): r is string => !!r))];
  const cands = (target as { cards?: { id: string }[] }).cards;
  return cands ? cands.map((c) => c.id) : [];
}
