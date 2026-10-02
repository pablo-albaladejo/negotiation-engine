import { BazaarError, type BazaarClient } from "./client.js";
import { closeText, counterText, holdText, textMatchesPrice } from "./messages.js";
import { DEFAULT_NEGOTIATOR_PARAMS, decide, type Decision, type NegotiatorParams, type ThreadView } from "./negotiator.js";
import { buyTargets, missingPageCards, raritySetTargets, rarityOf, spareTargets, type Target } from "./planner.js";
import type { Catalog, Clock, Me, Thread } from "./schemas.js";
import type { TraceRecord, TraceSink } from "./trace.js";
import { isDealer, sideOfTopic, threadPrices, type DealerRef } from "./view.js";

/**
 * Bucle observar → decidir → actuar contra un dealer, un hilo a la vez. Toda cifra sale de
 * `decide`; el texto, de plantillas con la misma cifra. En `dryRun` no hace ningún POST.
 */

export type BazaarApi = Pick<BazaarClient, "me" | "catalog" | "value" | "myThreads" | "thread" | "openThread" | "say" | "closeThread" | "accept">;

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
}

const HOUR_MS = 3_600_000;
const STOP_CODES = new Set(["sold_out", "locked", "asset_locked", "insufficient_cash", "invalid", "not_found", "http_404", "closed"]);

export class BazaarAgent {
  private active: Active | undefined;
  private lastAcceptTick = -1;
  private blockedUntilMs = 0;
  private cooloffUntilTick = -1;
  private readonly skip = new Map<string, number>();
  private readonly spend = new Map<number, number>();
  private readonly values = new Map<string, number>();
  private catalog: Catalog | undefined;
  /** Si el dealer rechaza `{buy: {card}}`, se compra por rareza y set. */
  private cardTopicOk = true;
  private readonly now: () => number;
  private readonly log: (line: string) => void;
  private readonly safety: number;
  private readonly maxLookups: number;
  private readonly negotiatorParams: NegotiatorParams;

  constructor(
    private readonly api: BazaarApi,
    private readonly o: AgentOptions,
  ) {
    this.now = o.now ?? Date.now;
    this.log = o.log ?? (() => {});
    this.safety = o.safety ?? 0.85;
    this.maxLookups = o.maxLookups ?? 12;
    this.negotiatorParams = { ...DEFAULT_NEGOTIATOR_PARAMS, ...o.negotiator };
  }

  spentThisHour(): number {
    return this.spend.get(Math.floor(this.now() / HOUR_MS)) ?? 0;
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
    try {
      const me = await this.api.me();
      if (!this.active) await this.adoptOpenThread(me);
      if (this.active) {
        const thread = await this.api.thread(this.active.id);
        if (thread.status === "open") {
          await this.negotiate(thread, tick, me, ticksPerHour, emit);
          return out;
        }
        this.finish(thread, tick, ticksPerHour, emit);
      }
      if (this.now() < this.blockedUntilMs || tick < this.cooloffUntilTick) {
        emit({ action: "blocked", rule: this.now() < this.blockedUntilMs ? "persona_quota" : "cooloff" });
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
        this.active = { id: thread.id, target, lastSentTick: tick, sent: [], holdsUsed: 0 };
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
  private async adoptOpenThread(me: Me): Promise<void> {
    const list = await this.api.myThreads("open");
    const summary = list.threads.find((t) => isDealer(this.o.dealer, t.with) && (t.status ?? "open") === "open");
    if (!summary) return;
    const thread = await this.api.thread(summary.id);
    const target = await this.targetFromTopic(thread, me);
    if (target) this.active = { id: thread.id, target, sent: [], holdsUsed: 0 };
    else if (!this.o.dryRun) await this.api.closeThread(thread.id);
  }

  private async targetFromTopic(thread: Thread, me: Me): Promise<Target | undefined> {
    const side = sideOfTopic(thread.topic);
    const topic = thread.topic as { buy?: { card?: string }; sell?: { assets?: number[] } } | undefined;
    if (side === "sell") {
      const id = topic?.sell?.assets?.[0];
      const asset = me.assets.find((a) => a.id === id);
      if (id === undefined || typeof asset?.your_value !== "number") return undefined;
      return { key: `sell:${id}`, side, topic: { sell: { assets: [id] } }, reservation: Math.max(1, Math.ceil(asset.your_value)), label: `sell ${asset.ref}` };
    }
    const rs = (thread.topic as { buy?: { rarity?: string; set?: string } } | undefined)?.buy;
    if (side === "buy" && rs?.rarity && rs.set) {
      this.catalog ??= await this.api.catalog();
      const cards = this.catalog.sets.find((s) => s.id === rs.set)?.cards.filter((c) => rarityOf(c) === rs.rarity) ?? [];
      if (!cards.length) return undefined;
      const vals = await Promise.all(cards.map((c) => this.valueOf(c.id)));
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      return { key: `buy:${rs.set}:${rs.rarity}`, side, topic: { buy: { rarity: rs.rarity, set: rs.set } }, reservation: Math.floor(mean * this.safety), label: `buy ${rs.rarity} ${rs.set}` };
    }
    const card = topic?.buy?.card;
    if (side === "buy" && card) {
      const value = await this.valueOf(card);
      return { key: `buy:${card}`, side, topic: { buy: { card } }, reservation: Math.floor(value * this.safety), label: `buy ${card}` };
    }
    return undefined;
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
    const sell = spareTargets(me).find(free);
    if (sell) return sell;
    const budget = this.o.maxSpendPerHour - this.spentThisHour();
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
    const { target } = active;
    const p = threadPrices(thread, target.side, this.o.dealer, selfIdOf(thread, me));
    // Nuestro último intento cuenta aunque el hilo no lo muestre (p. ej. el POST falló a medias): nunca se repite.
    const lastTried = active.sent[active.sent.length - 1];
    if (lastTried !== undefined && p.ourPrices[p.ourPrices.length - 1] !== lastTried) p.ourPrices = [...p.ourPrices, lastTried];
    const reservation = target.side === "buy" ? Math.max(0, Math.min(target.reservation, me.cash, this.o.maxSpendPerHour - this.spentThisHour())) : target.reservation;
    const view: ThreadView = {
      side: target.side,
      reservation,
      herPrices: p.herPrices,
      ourPrices: p.ourPrices,
      ...(p.herOpening !== undefined ? { herOpening: p.herOpening } : {}),
      ...(p.herCurrent ? { herCurrent: p.herCurrent } : {}),
      canMessage: active.lastSentTick !== tick,
      canAccept: this.lastAcceptTick !== tick,
      holdsUsed: active.holdsUsed,
    };
    const d: Decision = decide(view, this.negotiatorParams);
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
          this.lastAcceptTick = tick;
          emit({ ...base, action: "accept", ourPrice: d.action.price });
          return;
        case "counter": {
          const text = counterText(target.side, p.ourPrices.length, d.action.price);
          if (!textMatchesPrice(text, d.action.price)) throw new Error("texto y cifra no coinciden");
          if (d.action.price === p.ourPrices[p.ourPrices.length - 1]) throw new Error("precio repetido");
          // Se apunta antes del POST: si falla (o el servidor lo aceptó y la respuesta no valida), no se reenvía.
          active.lastSentTick = tick;
          active.sent.push(d.action.price);
          if (!this.o.dryRun) await this.api.say(thread.id, text, d.action.price);
          emit({ ...base, action: "counter", ourPrice: d.action.price, text });
          return;
        }
        case "hold": {
          const text = holdText(p.ourPrices.length, d.action.price);
          if (!textMatchesPrice(text, d.action.price)) throw new Error("texto y cifra no coinciden");
          active.lastSentTick = tick;
          active.holdsUsed += 1;
          if (!this.o.dryRun) await this.api.say(thread.id, text);
          emit({ ...base, action: "hold", ourPrice: d.action.price, text });
          return;
        }
        case "close":
          if (!this.o.dryRun) {
            if (view.canMessage) await this.api.say(thread.id, closeText(p.ourPrices.length)).catch(() => undefined);
            await this.api.closeThread(thread.id);
            this.skip.set(target.key, tick + ticksPerHour);
            this.active = undefined;
          }
          emit({ ...base, action: "close" });
          return;
        case "wait":
          emit({ ...base, action: "wait" });
      }
    } catch (e) {
      this.onError(e, tick, ticksPerHour, target, emit, thread.id);
    }
  }

  private finish(thread: Thread, tick: number, ticksPerHour: number, emit: (r: Omit<TraceRecord, "ts" | "tick" | "dealer" | "dryRun">) => void) {
    const target = this.active!.target;
    const settled = settledPrice(thread, target, this.o.dealer);
    if (thread.status === "deal") {
      if (target.side === "buy" && settled !== undefined) {
        const hour = Math.floor(this.now() / HOUR_MS);
        this.spend.set(hour, (this.spend.get(hour) ?? 0) + settled);
      }
      this.values.clear();
    }
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
    });
    this.active = undefined;
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

/** Precio al que cerró: la oferta aceptada si se ve; si no, la última oferta del dealer. */
export function settledPrice(thread: Thread, target: Target, dealer: DealerRef): number | undefined {
  const accepted = thread.standing_offers.find((o) => /accept|settl|fill|deal|done/i.test(o.status ?? ""));
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
  return parts.join(" · ");
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
