import { BazaarError, type BazaarClient } from "./client.js";
import type { Catalog } from "./schemas.js";
import {
  buildValueModel,
  countHoldings,
  formatTickPlan,
  heldAssets,
  parseMyOffers,
  parseOffers,
  parseSettlements,
  planTick,
  readSide,
  setOf,
  type TickPlan,
  type TradeParams,
  type TradeState,
} from "./trades.js";

/** Lo que el bucle de trades necesita del cliente (inyectable en tests). */
export type TradesApi = Pick<BazaarClient, "me" | "catalog" | "clock" | "value" | "board" | "myOffers" | "feed" | "postOffer" | "cancelOffer" | "acceptOffer">;

export interface TradesAgentOptions {
  dryRun: boolean;
  log?: (line: string) => void;
  top?: number;
  /** Ticks que una aceptación nuestra reserva sus activos (liquida en el siguiente tick). */
  reserveTicks?: number;
}

export interface StepResult {
  plan: TickPlan;
  sent: string[];
  errors: string[];
}

function num(x: unknown, fallback: number): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

/**
 * Bucle de trades con equipos: un paso por tick. Lee reloj, `/api/me`, nuestras ofertas, el tablón de
 * El Rastro y el feed; decide con `planTick` (puro) y, si no es dry-run, ejecuta: como mucho una
 * aceptación, luego cancelaciones y altas. Lleva el gasto de la ejecución (`spent`: compras aceptadas y
 * pujas nuestras que desaparecen sin cancelar antes de caducar) contra `maxSpend`.
 */
export class TradesAgent {
  private catalog: Catalog | undefined;
  /** `/api/me/value` de cartas que no tenemos (valor de la primera copia): cacheado toda la ejecución. */
  private readonly zeroValues = new Map<string, number>();
  private readonly reservedUntil = new Map<number, number>();
  private readonly cancelled = new Set<number>();
  private openBids = new Map<number, { cash: number; expires: number }>();
  spent = 0;
  private readonly log: (line: string) => void;

  constructor(
    private readonly api: TradesApi,
    private readonly params: TradeParams,
    private readonly opts: TradesAgentOptions,
  ) {
    this.log = opts.log ?? console.log;
  }

  async state(): Promise<TradeState> {
    const clock = await this.api.clock();
    const me = await this.api.me();
    const myId = me.id ?? "";
    const { mine, toMe } = parseMyOffers(await this.api.myOffers(), myId);
    const board = parseOffers(await this.api.board("rastro"));
    let settlements: TradeState["settlements"] = [];
    try {
      settlements = parseSettlements(await this.api.feed(200));
    } catch (e) {
      if (!(e instanceof BazaarError)) throw e;
    }
    this.catalog ??= await this.api.catalog();
    const held = heldAssets(me.assets);
    const counts = countHoldings(held);
    const album = me.album as { pages?: { set?: string }[] } | undefined;
    const pageSets = [...new Set([...(album?.pages ?? []).flatMap((p) => (p.set ? [p.set] : [])), ...held.map((a) => setOf(a.ref))])].sort();
    const boardRefs = board.flatMap((o) => [...readSide(o.give).assets.flatMap((a) => (a.ref ? [a.ref] : [])), ...readSide(o.want).cards]);
    const pageRefs = pageSets.flatMap((s) => this.catalog!.sets.find((x) => x.id === s)?.cards.map((c) => c.id) ?? []);
    for (const ref of [...new Set([...pageRefs, ...boardRefs])].sort()) {
      if ((counts.get(ref) ?? 0) > 0 || this.zeroValues.has(ref)) continue;
      try {
        this.zeroValues.set(ref, await this.api.value(ref));
      } catch (e) {
        if (!(e instanceof BazaarError)) throw e;
      }
    }
    const model = buildValueModel(this.catalog, held, this.zeroValues);
    this.trackFilledBids(mine, clock.tick);
    for (const [id, until] of this.reservedUntil) if (until < clock.tick) this.reservedUntil.delete(id);
    const limits = clock.limits ?? {};
    return {
      tick: clock.tick,
      myId,
      cash: me.cash,
      held,
      pageSets,
      board,
      mine,
      toMe,
      settlements,
      model,
      limits: {
        offersPerTick: num(limits.offers_per_team_per_tick, 12),
        maxOpenOffers: num(limits.max_open_offers_per_team, 30),
        acceptsPerTick: num(limits.accepts_per_team_per_tick, 1),
      },
      spent: this.spent,
      reserved: new Set(this.reservedUntil.keys()),
    };
  }

  /** Una puja nuestra que ya no está, sin cancelarla nosotros y antes de caducar, se dio por llenada. */
  private trackFilledBids(mine: TradeState["mine"], tick: number): void {
    const now = new Map<number, { cash: number; expires: number }>();
    for (const o of mine) {
      if (o.venue !== "rastro" || o.thread != null || (o.status ?? "open") !== "open") continue;
      const g = readSide(o.give);
      const w = readSide(o.want);
      if (g.cash > 0 && w.cards.length === 1) now.set(o.id, { cash: g.cash, expires: o.expires_tick ?? Infinity });
    }
    for (const [id, b] of this.openBids) {
      if (now.has(id) || this.cancelled.has(id) || b.expires <= tick) continue;
      this.spent += b.cash + Math.ceil((b.cash * this.params.fees.bps) / 10_000 + this.params.fees.perCard - 1e-9);
    }
    this.openBids = now;
  }

  async step(): Promise<StepResult> {
    const state = await this.state();
    const plan = planTick(state, this.params);
    for (const line of formatTickPlan(plan, { top: this.opts.top ?? 10, dryRun: this.opts.dryRun })) this.log(line);
    const sent: string[] = [];
    const errors: string[] = [];
    if (this.opts.dryRun) return { plan, sent, errors };

    let lastResponse: unknown;
    const attempt = async (label: string, fn: () => Promise<unknown>): Promise<boolean> => {
      try {
        lastResponse = await fn();
        sent.push(label);
        return true;
      } catch (e) {
        if (!(e instanceof BazaarError)) throw e;
        errors.push(`${label}: ${e.code}`);
        return false;
      }
    };
    if (plan.accept) {
      const a = plan.accept;
      if (await attempt(`accept #${a.offer.id}`, () => this.api.acceptOffer(a.offer.id, a.payAssets))) {
        this.spent += a.spend;
        for (const id of a.payAssets) this.reservedUntil.set(id, state.tick + (this.opts.reserveTicks ?? 2));
      }
    }
    for (const c of plan.cancels) {
      if (await attempt(`cancel #${c.id}`, () => this.api.cancelOffer(c.id))) this.cancelled.add(c.id);
    }
    for (const p of plan.posts) {
      const ok = await attempt(`post ${p.kind} ${p.ref} @${p.price}`, () => this.api.postOffer(p.body));
      if (!ok && errors.at(-1)?.match(/wait_for_tick|rate_limited|too_many/)) break;
      // Una puja puede llenarse antes de la siguiente lectura: se apunta ya con el id que devuelve el POST.
      const id = (lastResponse as { id?: unknown; offer?: { id?: unknown } } | undefined)?.id ?? (lastResponse as { offer?: { id?: unknown } } | undefined)?.offer?.id;
      if (ok && p.kind === "bid" && typeof id === "number") this.openBids.set(id, { cash: p.price, expires: state.tick + this.params.expiresInTicks });
    }
    for (const line of sent) this.log(`sent: ${line}`);
    for (const line of errors) this.log(`error: ${line}`);
    return { plan, sent, errors };
  }
}
