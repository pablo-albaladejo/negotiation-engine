import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import type { Catalog } from "../shared/schemas.js";
import { assetsInOffers, assetsInThreads } from "../shared/asset-locks.js";
import {
  buildValueModel,
  countHoldings,
  formatTickPlan,
  heldAssets,
  parseMyOffers,
  parseOffers,
  parseSettlements,
  parseVenueFees,
  planTick,
  readSide,
  setOf,
  type FeeModel,
  type RivalSignals,
  type TickPlan,
  type TradeParams,
  type TradeState,
} from "./trades.js";

/** What the trades loop needs from the client (injectable in tests). */
export type TradesApi = Pick<BazaarClient, "me" | "catalog" | "clock" | "value" | "board" | "myOffers" | "myThreads" | "feed" | "postOffer" | "cancelOffer" | "acceptOffer" | "venues">;

export interface TradesAgentOptions {
  dryRun: boolean;
  log?: (line: string) => void;
  top?: number;
  /** Ticks for which an acceptance of ours reserves its assets (settles on the next tick). */
  reserveTicks?: number;
  /** Listing post counts and backoffs survive restarts here (written only live; `pnpm bazaar:play` restarts often). */
  backoffFile?: string;
}

/** Shared by `pnpm bazaar:play` and `pnpm bazaar:trades`: asset ids are global, so one file for every day. */
export const defaultListBackoffFile = (root: string): string => join(root, "results", "bazaar-live", "list-backoff.json");

interface BackoffMemo {
  posts: Record<string, number>;
  until: Record<string, number>;
}

function loadBackoff(file: string | undefined): BackoffMemo {
  if (!file || !existsSync(file)) return { posts: {}, until: {} };
  try {
    const d = JSON.parse(readFileSync(file, "utf8")) as Partial<BackoffMemo>;
    return { posts: d.posts ?? {}, until: d.until ?? {} };
  } catch {
    // Corrupt file: start counting again.
    return { posts: {}, until: {} };
  }
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
 * Trades loop with teams: one step per tick. Reads clock, `/api/me`, our offers, the El Rastro
 * board and the feed; decides with `planTick` (pure) and, if not dry-run, executes: cancellations,
 * then at most one acceptance (skipped if a cancellation failed), then new listings. Tracks the run's spend (`spent`: accepted purchases and
 * our bids that disappear without being cancelled before expiring) against `maxSpend`.
 */
export class TradesAgent {
  private catalog: Catalog | undefined;
  /** `/api/me/value` of cards we don't have (first-copy value): cached for the whole run. */
  private readonly zeroValues = new Map<string, number>();
  private readonly reservedUntil = new Map<number, number>();
  private readonly cancelled = new Set<number>();
  private openBids = new Map<number, { cash: number; expires: number }>();
  /** Fees per venue for offers addressed to us elsewhere (last good read is kept if `/api/venues` fails). */
  private venueFees = new Map<string, FeeModel>();
  /** Listings posted per asset in this run, and the tick until which reposting it backs off. */
  private readonly listPosts = new Map<number, number>();
  private readonly listBackoff = new Map<number, number>();
  spent = 0;
  private readonly log: (line: string) => void;

  constructor(
    private readonly api: TradesApi,
    private readonly params: TradeParams,
    private readonly opts: TradesAgentOptions,
  ) {
    this.log = opts.log ?? console.log;
    const memo = loadBackoff(opts.backoffFile);
    for (const [id, n] of Object.entries(memo.posts)) this.listPosts.set(Number(id), n);
    for (const [id, t] of Object.entries(memo.until)) this.listBackoff.set(Number(id), t);
  }

  private saveBackoff(): void {
    const file = this.opts.backoffFile;
    if (!file) return;
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}`;
    writeFileSync(tmp, `${JSON.stringify({ posts: Object.fromEntries(this.listPosts), until: Object.fromEntries(this.listBackoff) })}\n`);
    renameSync(tmp, file);
  }

  async state(): Promise<TradeState> {
    const clock = await this.api.clock();
    const me = await this.api.me();
    const myId = me.id ?? "";
    const rawOffers = await this.api.myOffers();
    const { mine, toMe } = parseMyOffers(rawOffers, myId);
    // One asset, one place: what is in an open thread with a dealer (topic or thread offer) is neither listed nor used to pay.
    const inThreads = [...assetsInThreads((await this.api.myThreads("open")).threads)].concat([...assetsInOffers(rawOffers, myId)].filter(([, where]) => where.includes("in thread")));
    const board = parseOffers(await this.api.board("rastro"));
    let settlements: TradeState["settlements"] = [];
    try {
      settlements = parseSettlements(await this.api.feed(200));
    } catch (e) {
      if (!(e instanceof BazaarError)) throw e;
    }
    try {
      this.venueFees = parseVenueFees((await this.api.venues()).venues);
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
    const heldIds = new Set(held.map((a) => a.id));
    for (const [id, until] of this.listBackoff) {
      // A backoff further ahead than one rest period comes from another tick count (server reset): drop it.
      if (until > clock.tick + this.params.relistBackoffTicks) this.listBackoff.delete(id);
    }
    for (const id of new Set([...this.listPosts.keys(), ...this.listBackoff.keys()])) {
      if (heldIds.has(id)) continue;
      this.listPosts.delete(id);
      this.listBackoff.delete(id);
    }
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
      reserved: new Set([...this.reservedUntil.keys(), ...inThreads.map(([id]) => id)]),
      listBackoff: new Map(this.listBackoff),
      venueFees: new Map(this.venueFees),
    };
  }

  /** A bid of ours that is gone, without us cancelling it and before expiring, was taken as filled. */
  private trackFilledBids(mine: TradeState["mine"], tick: number): void {
    const now = new Map<number, { cash: number; expires: number }>();
    for (const o of mine) {
      if (o.venue !== "rastro" || o.thread != null || o.to || (o.status ?? "open") !== "open") continue;
      const g = readSide(o.give);
      const w = readSide(o.want);
      if (g.cash > 0 && w.cards.length === 1) now.set(o.id, { cash: g.cash, expires: o.expires_tick ?? Infinity });
    }
    for (const [id, b] of this.openBids) {
      if (now.has(id) || this.cancelled.has(id) || b.expires <= tick) continue;
      // A filled bid of ours: we were the maker, so no fee.
      this.spent += b.cash;
    }
    this.openBids = now;
  }

  /** Tick proposal without sending anything (GET only): state and `planTick` plan. `rivals`: other teams' signals, if known. */
  async propose(rivals?: RivalSignals, pageReserve?: TradeParams["pageReserve"], venueReserve = 0): Promise<{ state: TradeState; plan: TickPlan }> {
    const state = { ...(await this.state()), ...(rivals ? { rivals } : {}) };
    return { state, plan: planTick(state, { ...this.params, ...(pageReserve ? { pageReserve } : {}), ...(venueReserve ? { venueReserve } : {}) }) };
  }

  async step(): Promise<StepResult> {
    const { state, plan } = await this.propose();
    for (const line of formatTickPlan(plan, { top: this.opts.top ?? 10, dryRun: this.opts.dryRun })) this.log(line);
    if (this.opts.dryRun) return { plan, sent: [], errors: [] };
    return this.execute(state, plan);
  }

  /**
   * Executes a plan (possibly trimmed by the coordinator: no acceptance, fewer listings): cancellations, then
   * at most one acceptance (skipped if a cancellation failed), then new listings. In dry-run it sends nothing.
   */
  async execute(state: TradeState, plan: TickPlan): Promise<StepResult> {
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
    // Cancels go first: paying with one copy can leave a listed copy as the last one, and its cancel is in this plan.
    let cancelFailed = false;
    for (const c of plan.cancels) {
      if (await attempt(`cancel #${c.id}`, () => this.api.cancelOffer(c.id))) this.cancelled.add(c.id);
      else cancelFailed = true;
    }
    if (plan.accept && cancelFailed) {
      errors.push(`accept #${plan.accept.offer.id}: skipped, a cancel did not go through (the last copy could still be listed)`);
    } else if (plan.accept) {
      const a = plan.accept;
      if (await attempt(`accept #${a.offer.id}`, () => this.api.acceptOffer(a.offer.id, a.payAssets))) {
        this.spent += a.spend;
        for (const id of a.payAssets) this.reservedUntil.set(id, state.tick + (this.opts.reserveTicks ?? 2));
      }
    }
    let backoffChanged = false;
    for (const p of plan.posts) {
      if (p.replaces !== undefined && !this.cancelled.has(p.replaces)) {
        errors.push(`post ${p.kind} ${p.ref} @${p.price}: skipped, cancel of #${p.replaces} did not go through`);
        continue;
      }
      const assetId = "assets" in p.body.give ? p.body.give.assets[0] : undefined;
      const ok = await attempt(`post ${p.kind} ${p.ref} @${p.price}`, () => this.api.postOffer(p.body));
      if (!ok && errors.at(-1)?.match(/wait_for_tick|rate_limited|too_many/)) break;
      // The server says the asset is busy elsewhere: it is neither listed nor used to pay for a few ticks.
      if (!ok && assetId !== undefined && errors.at(-1)?.includes("asset_locked")) this.reservedUntil.set(assetId, state.tick + (this.opts.reserveTicks ?? 2));
      // Every post of a card (new or reprice, any copy) counts; after `relistBackoffAfter` all its copies rest
      // `relistBackoffTicks` and count again (LAT-04: 51 posts over several copies, 0 fills).
      if (ok && assetId !== undefined && p.kind === "list") {
        const copies = state.held.filter((a) => a.ref === p.ref).map((a) => a.id);
        if (!copies.includes(assetId)) copies.push(assetId);
        this.listPosts.set(assetId, (this.listPosts.get(assetId) ?? 0) + 1);
        const n = copies.reduce((sum, id) => sum + (this.listPosts.get(id) ?? 0), 0);
        if (n >= this.params.relistBackoffAfter) {
          for (const id of copies) {
            this.listPosts.set(id, 0);
            this.listBackoff.set(id, state.tick + this.params.relistBackoffTicks);
          }
        }
        backoffChanged = true;
      }
      // A bid may fill before the next read: it is recorded now with the id returned by the POST.
      const id = (lastResponse as { id?: unknown; offer?: { id?: unknown } } | undefined)?.id ?? (lastResponse as { offer?: { id?: unknown } } | undefined)?.offer?.id;
      if (ok && p.kind === "bid" && typeof id === "number") this.openBids.set(id, { cash: p.price, expires: state.tick + this.params.expiresInTicks });
    }
    if (backoffChanged) this.saveBackoff();
    for (const line of sent) this.log(`sent: ${line}`);
    for (const line of errors) this.log(`error: ${line}`);
    return { plan, sent, errors };
  }
}
