import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Intent } from "../coordinator/coordinator.js";
import { busyAssets } from "../shared/asset-locks.js";
import { BazaarError, type BazaarClient } from "../shared/client.js";
import { RASTRO_FEES, venueFeesOf, type TradeState } from "../trades/trades.js";
import { deskFloor, openCounters, TAG, TEAM_DESK_PARAMS, type DeskIncoming, type DeskPlan } from "./counter.js";

/**
 * Team-desk execution and log: cancels, then counters (live only with the opt-in flag), each re-checked against the
 * server's `your_value` and the asset locks just before posting; one JSONL line per event in
 * `results/bazaar-live/<date>/team-desk.jsonl` (the viewer reads it).
 */

export type DeskStatus = "would" | "sent" | "failed" | "filled" | "expired" | "cancelled";

export interface DeskEvent {
  ts: string;
  tick: number;
  event: "incoming" | "counter" | "step" | "cancel" | "outcome";
  team: string;
  venue: string;
  /** Full on "incoming"; only `id` on counter and step lines (the viewer chains them by it). */
  incoming?: Omit<DeskIncoming, "team" | "venue"> | { id: number };
  counter?: { offerId: number | null; ref: string; assetId: number; price: number; floor: number; anchor: number; serverValue: number; negIfFilled: number; replaces: number | null };
  status?: DeskStatus;
  negDelta?: number | null;
  reason?: string;
}

interface SentCounter {
  team: string;
  venue: string;
  ref: string;
  assetId: number;
  price: number;
  value: number;
  fee: number;
  expiresTick: number;
}

/** What the desk remembers across ticks (seeded from today's log, so a restart keeps it). */
export interface DeskLedger {
  file: string;
  loggedIncoming: Set<number>;
  sent: Map<number, SentCounter>;
  /** Dry-run lines already logged (`key@price`): the same "would" is written once, not every tick. */
  wouldSeen: Set<string>;
}

export function defaultDeskLogFile(root = process.cwd(), now = new Date()): string {
  return join(root, "results", "bazaar-live", now.toISOString().slice(0, 10), "team-desk.jsonl");
}

export function loadDeskLedger(file = defaultDeskLogFile()): DeskLedger {
  const ledger: DeskLedger = { file, loggedIncoming: new Set(), sent: new Map(), wouldSeen: new Set() };
  if (!existsSync(file)) return ledger;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as DeskEvent;
      if (e.event === "incoming" && e.incoming) ledger.loggedIncoming.add(e.incoming.id);
      const c = e.counter;
      if ((e.event === "counter" || e.event === "step") && e.status === "sent" && c?.offerId != null)
        ledger.sent.set(c.offerId, { team: e.team, venue: e.venue, ref: c.ref, assetId: c.assetId, price: c.price, value: c.serverValue, fee: Math.round((c.price - c.serverValue - c.negIfFilled) * 10) / 10, expiresTick: e.tick + TEAM_DESK_PARAMS.expiresInTicks });
      if (e.event === "outcome" && c?.offerId != null) ledger.sent.delete(c.offerId);
    } catch {
      // A torn line (written while play crashed) is skipped.
    }
  }
  return ledger;
}

function write(ledger: DeskLedger, e: Omit<DeskEvent, "ts">): void {
  try {
    mkdirSync(dirname(ledger.file), { recursive: true });
    appendFileSync(ledger.file, `${JSON.stringify({ ts: new Date().toISOString(), ...e })}\n`);
  } catch {
    // The log never stops play.
  }
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/** Logs new incoming offers (once per id) and the outcome of our counters that left the book. */
export function recordDesk(ledger: DeskLedger, tick: number, plan: DeskPlan, trade: TradeState | undefined): string[] {
  const lines: string[] = [];
  for (const i of plan.incoming) {
    if (ledger.loggedIncoming.has(i.id)) continue;
    ledger.loggedIncoming.add(i.id);
    const { team, venue, ...incoming } = i;
    write(ledger, { tick, event: "incoming", team, venue, incoming });
  }
  if (!trade) return lines;
  const open = new Set(openCounters(trade).map((c) => c.offer.id));
  for (const [offerId, s] of ledger.sent) {
    if (open.has(offerId)) continue;
    const held = trade.held.some((a) => a.id === s.assetId);
    const status: DeskStatus = !held ? "filled" : tick >= s.expiresTick ? "expired" : "cancelled";
    const negDelta = status === "filled" ? r1(s.price - s.value - s.fee) : null;
    write(ledger, { tick, event: "outcome", team: s.team, venue: s.venue, counter: { offerId, ref: s.ref, assetId: s.assetId, price: s.price, floor: 0, anchor: 0, serverValue: s.value, negIfFilled: r1(s.price - s.value - s.fee), replaces: null }, status, negDelta });
    lines.push(`${TAG} outcome #${offerId} ${s.ref} → ${s.team}@${s.venue} @ ${s.price} P: ${status}${negDelta !== null ? ` (Δ neg ${negDelta})` : ""}`);
    ledger.sent.delete(offerId);
  }
  return lines;
}

/** Counter block of a cancel line: the offer id chains it in the viewer; prices are not repeated. */
const cancelled_ = (c: DeskPlan["cancels"][number]): NonNullable<DeskEvent["counter"]> => ({ offerId: c.offerId, ref: c.ref, assetId: 0, price: 0, floor: 0, anchor: 0, serverValue: 0, negIfFilled: 0, replaces: null });

const offerIdOf = (res: unknown): number | null => {
  const r = res as { id?: unknown; offer?: { id?: unknown } } | null;
  const id = r?.id ?? r?.offer?.id;
  return typeof id === "number" ? id : null;
};

export async function executeTeamDesk(
  client: Pick<BazaarClient, "postOffer" | "cancelOffer" | "value" | "myThreads" | "myOffers">,
  selected: readonly Intent[],
  plan: DeskPlan,
  dryRun: boolean,
  ctx: { tick: number; myId?: string; trade: TradeState | undefined; ledger: DeskLedger },
): Promise<string[]> {
  const { tick, ledger } = ctx;
  const lines = recordDesk(ledger, tick, plan, ctx.trade);
  const ids = new Set(selected.map((i) => i.id));
  const cancelled = new Set<number>();
  for (const c of plan.cancels.filter((x) => ids.has(x.intentId))) {
    if (dryRun) {
      lines.push(`${TAG} would cancel #${c.offerId} (${c.reason})`);
      if (!ledger.wouldSeen.has(`cancel:${c.offerId}`)) write(ledger, { tick, event: "cancel", team: c.team, venue: c.venue, counter: cancelled_(c), status: "would", reason: c.reason });
      ledger.wouldSeen.add(`cancel:${c.offerId}`);
      continue;
    }
    try {
      await client.cancelOffer(c.offerId);
      cancelled.add(c.offerId);
      lines.push(`${TAG} cancelled #${c.offerId} (${c.reason})`);
      write(ledger, { tick, event: "cancel", team: c.team, venue: c.venue, counter: cancelled_(c), status: "cancelled", reason: c.reason });
    } catch (e) {
      lines.push(`${TAG} cancel #${c.offerId} failed: ${e instanceof BazaarError ? e.code : String(e)}`);
    }
  }
  const posts = plan.posts.filter((x) => ids.has(x.intentId));
  const busy = !dryRun && posts.length ? await busyAssets(client, ctx.myId) : undefined;
  for (const p of posts) {
    const what = `POST ${p.venue} to=${p.team} ${p.ref} (asset ${p.assetId}) @ ${p.price} P exp ${p.body.expires_in_ticks}${p.replaces !== undefined ? ` (replaces #${p.replaces})` : ""}`;
    const log = (status: DeskStatus, serverValue: number, offerId: number | null, reason?: string) =>
      write(ledger, {
        tick,
        event: p.event,
        team: p.team,
        venue: p.venue,
        incoming: { id: p.incomingId },
        counter: { offerId, ref: p.ref, assetId: p.assetId, price: p.price, floor: p.floor, anchor: p.anchor, serverValue, negIfFilled: r1(p.price - p.fee - serverValue), replaces: p.replaces ?? null },
        status,
        ...(reason ? { reason } : {}),
      });
    if (dryRun) {
      lines.push(`${TAG} would ${what}`);
      const seen = `${p.team}:${p.ref}:${p.venue}@${p.price}`;
      if (!ledger.wouldSeen.has(seen)) log("would", p.value, null, `answers #${p.incomingId}`);
      ledger.wouldSeen.add(seen);
      continue;
    }
    if (p.replaces !== undefined && !cancelled.has(p.replaces)) {
      lines.push(`${TAG} ${what}: skipped, cancel of #${p.replaces} did not go through`);
      continue;
    }
    if (!busy || busy.has(p.assetId)) {
      const why = busy ? `asset ${p.assetId} busy (${busy.get(p.assetId)})` : "locks unreadable";
      lines.push(`${TAG} ${what}: skipped, ${why}`);
      log("failed", p.value, null, why);
      continue;
    }
    // The trade scores against the server's value at settlement: re-read it and keep the margin over the higher one.
    const serverValue = await client.value(p.ref).catch(() => undefined);
    if (serverValue === undefined) {
      lines.push(`${TAG} ${what}: skipped, server value unreadable`);
      continue;
    }
    if (serverValue <= 0 || p.value <= 0) {
      lines.push(`${TAG} ${what}: skipped, your_value ${Math.min(serverValue, p.value)} (no floor from code)`);
      log("failed", serverValue, null, "zero value: needs a price from Pablo");
      continue;
    }
    const floor = deskFloor(Math.max(serverValue, p.value), venueFeesOf(p.venue, ctx.trade?.venueFees, RASTRO_FEES));
    if (p.price < floor) {
      lines.push(`${TAG} ${what}: skipped, server value ${serverValue} lifts the floor to ${floor}`);
      log("failed", serverValue, null, `floor ${floor} above price`);
      continue;
    }
    try {
      const offerId = offerIdOf(await client.postOffer(p.body));
      if (offerId !== null) ledger.sent.set(offerId, { team: p.team, venue: p.venue, ref: p.ref, assetId: p.assetId, price: p.price, value: serverValue, fee: p.fee, expiresTick: tick + p.body.expires_in_ticks });
      lines.push(`${TAG} sent ${what}${offerId !== null ? ` → #${offerId}` : ""}`);
      log("sent", serverValue, offerId, `answers #${p.incomingId}`);
    } catch (e) {
      const code = e instanceof BazaarError ? e.code : String(e);
      lines.push(`${TAG} ${what} failed: ${code}`);
      log("failed", serverValue, null, code);
    }
  }
  return lines;
}

/** Ids of the counters this desk posted and still tracks (`proposeTeamDesk` only steps or cancels those). */
export const deskOfferIds = (ledger: DeskLedger): Set<number> => new Set(ledger.sent.keys());
