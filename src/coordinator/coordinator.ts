import type { GameState, TickLimits } from "../state/game-state.js";

/**
 * Per-tick coordinator, pure: each route (duels, dealers, El Rastro) proposes its intents without sending them; here
 * the tick budget read from `clock.limits` (never hardcoded) is split and what goes out is decided.
 *
 * ASSUMPTION (to verify live): accepting a duel shares the `accepts_per_team_per_tick` quota with
 * the dealers and El Rastro. If it turns out not to, it is enough to take the "duel" class out of the quota in `arbitrate`.
 */

export type Route = "duels" | "dealers" | "trades" | "flags" | "eggs" | "agenda" | "packs" | "markets" | "venue";
/**
 * `flag`: `POST /api/flags`, does not use the accept quota. `probe`: egg message, counts as a message and goes last.
 * `unpack`: open a sealed pack; ASSUMPTION (unverified): does not spend the accept quota.
 * `agenda`: calendar action (venue, pack, offers before the close) that is only printed: it never goes out from here.
 * `venue`: mechanism change of our venue (`src/venue/route.ts`); at most one per tick, live behind its own gate.
 */
export type IntentKind = "accept" | "message" | "open" | "listing" | "cancel" | "flag" | "probe" | "agenda" | "unpack" | "venue";
export type AcceptClass = "duel" | "page-completing" | "dealer-ladder" | "other";

/** Accept priority (lower rank, earlier); at equal rank, higher expected value first. */
export const ACCEPT_PRIORITY: Record<AcceptClass, { rank: number; why: string }> = {
  duel: { rank: 1, why: "duel: its value decays every round" },
  "page-completing": { rank: 2, why: "SAL-09 or a page-completing buy (+25 % page bonus)" },
  "dealer-ladder": { rank: 3, why: "dealer ladder (best three deals per level count)" },
  other: { rank: 4, why: "the rest" },
};

export const DUEL_ACCEPT_QUOTA_ASSUMPTION = "ASSUMPTION: a duel accept shares the team accept quota (accepts_per_team_per_tick) with dealers and El Rastro";

export interface Intent {
  /** Unique within the tick: `duels:accept:177`, `dealers:counter:abuela:56`, `trades:post:3`... */
  id: string;
  route: Route;
  kind: IntentKind;
  /** Conversation the message counts against (`duel:177`, `dealer:56`). */
  conversation?: string;
  acceptClass?: AcceptClass;
  /** Expected value (P, at our values) if it goes out; only for ordering. */
  ev?: number;
  /** Readable line: what and with which figure (decided by code). */
  summary: string;
  /** Figure decided by code (already through `enforceGuardrails`), if the intent carries one. */
  price?: number;
  /** Card ref it buys or sells, when known (only for the plan log; arbitration uses `locks`). */
  ref?: string;
  /** Assets it commits (`asset:29`): one asset, one place, also across routes in the same tick. */
  locks?: string[];
}

export interface Budget {
  accepts: number;
  messagesPerConversation: number;
  maxOpenThreads: number;
  openThreadsNow: number;
  offersPerTick: number;
  maxOpenOffers: number;
  openOffersNow: number;
  /** Limits missing from `clock.limits`: used as 0 (conservative: nothing of that kind is done). */
  missing: string[];
  /** Agenda: reason not to open new conversations (final, freeze, end of round). */
  opensBlocked?: string;
  /** Agenda: personas that close (no opens with them). */
  closedPersonas?: readonly string[];
}

export function budgetFrom(state: Pick<GameState, "limits" | "ours" | "env">): Budget {
  const l: TickLimits = state.limits;
  const missing: string[] = [];
  const get = (v: number | undefined, name: string) => {
    if (v === undefined) missing.push(name);
    return v ?? 0;
  };
  return {
    accepts: get(l.acceptsPerTick, "accepts_per_team_per_tick"),
    messagesPerConversation: get(l.messagesPerConversation, "messages_per_side_per_tick"),
    maxOpenThreads: get(l.maxOpenThreads, "max_open_threads_per_team"),
    openThreadsNow: state.ours.openThreads.length,
    offersPerTick: get(l.offersPerTick, "offers_per_team_per_tick"),
    maxOpenOffers: get(l.maxOpenOffers, "max_open_offers_per_team"),
    openOffersNow: state.env.myOpenOffers,
    missing,
  };
}

export function formatBudget(b: Budget): string[] {
  return [
    `accepts/tick ${b.accepts} · messages/conversation/tick ${b.messagesPerConversation} · open threads ${b.openThreadsNow}/${b.maxOpenThreads} · listings/tick ${b.offersPerTick} · open offers ${b.openOffersNow}/${b.maxOpenOffers}`,
    ...(b.missing.length ? [`missing in clock.limits (used as 0, nothing of that kind goes out): ${b.missing.join(", ")}`] : []),
    DUEL_ACCEPT_QUOTA_ASSUMPTION,
  ];
}

export interface Verdict {
  intent: Intent;
  selected: boolean;
  reason: string;
}

const priority = (i: Intent) => ACCEPT_PRIORITY[i.acceptClass ?? "other"];

/**
 * Splits the tick: at most `accepts` accepts across all routes (by class and expected value), messages
 * per conversation per `messagesPerConversation` (none in the conversation whose accept goes out), new threads
 * up to `maxOpenThreads` and listings up to `offersPerTick` without exceeding `maxOpenOffers`. Cancels always go out.
 */
export function arbitrate(intents: readonly Intent[], b: Budget): Verdict[] {
  const verdicts = new Map<string, Verdict>();
  // One asset, one place: the first selected intent (in arbitrage order) keeps the asset.
  const taken = new Map<string, string>();
  const clash = (i: Intent) => i.locks?.map((l) => (taken.has(l) ? `${l} already in ${taken.get(l)}` : undefined)).find(Boolean);
  const take = (i: Intent) => i.locks?.forEach((l) => taken.set(l, i.id));
  const accepts = intents.filter((i) => i.kind === "accept").sort((a, c) => priority(a).rank - priority(c).rank || (c.ev ?? 0) - (a.ev ?? 0));
  const acceptedConversations = new Set<string>();
  let acceptsUsed = 0;
  const winners: string[] = [];
  accepts.forEach((i) => {
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      return;
    }
    if (acceptsUsed < b.accepts) {
      acceptsUsed += 1;
      winners.push(i.id);
      take(i);
      const k = acceptsUsed - 1;
      if (i.conversation) acceptedConversations.add(i.conversation);
      verdicts.set(i.id, { intent: i, selected: true, reason: `accept ${k + 1}/${b.accepts}: rank ${priority(i).rank} (${priority(i).why})${i.ev !== undefined ? `, EV ${i.ev.toFixed(1)}` : ""}` });
    } else {
      verdicts.set(i.id, { intent: i, selected: false, reason: b.accepts === 0 ? "no accepts this tick (quota 0)" : `accept quota ${b.accepts}/tick used by ${winners.join(", ")}` });
    }
  });

  const perConversation = new Map<string, number>();
  // Egg probes are low priority: they only use the room left by the negotiation messages.
  for (const i of [...intents.filter((x) => x.kind === "message"), ...intents.filter((x) => x.kind === "probe")]) {
    const conv = i.conversation ?? i.id;
    if (acceptedConversations.has(conv)) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `accept selected in ${conv}` });
      continue;
    }
    const used = perConversation.get(conv) ?? 0;
    if (used >= b.messagesPerConversation) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `message quota ${b.messagesPerConversation}/conversation/tick used in ${conv}` });
      continue;
    }
    perConversation.set(conv, used + 1);
    verdicts.set(i.id, { intent: i, selected: true, reason: `message ${used + 1}/${b.messagesPerConversation} in ${conv}` });
  }

  let threads = b.openThreadsNow;
  for (const i of intents.filter((x) => x.kind === "open").sort((a, c) => (c.ev ?? 0) - (a.ev ?? 0))) {
    if (b.opensBlocked) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `agenda: no new conversations (${b.opensBlocked})` });
      continue;
    }
    const persona = i.route === "dealers" ? i.id.split(":")[2] : undefined;
    if (persona && b.closedPersonas?.includes(persona)) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `agenda: ${persona} closes` });
      continue;
    }
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      continue;
    }
    if (threads >= b.maxOpenThreads) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `open threads ${threads}/${b.maxOpenThreads}` });
      continue;
    }
    threads += 1;
    take(i);
    verdicts.set(i.id, { intent: i, selected: true, reason: `open thread ${threads}/${b.maxOpenThreads}` });
  }

  for (const i of intents.filter((x) => x.kind === "unpack")) {
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      continue;
    }
    take(i);
    verdicts.set(i.id, { intent: i, selected: true, reason: "open pack: ASSUMPTION it does not use the accept quota (unverified)" });
  }
  for (const i of intents.filter((x) => x.kind === "agenda")) verdicts.set(i.id, { intent: i, selected: false, reason: "agenda intent: printed only (live needs its own CLI with --confirm and user approval)" });
  intents.filter((x) => x.kind === "venue").forEach((i, k) => verdicts.set(i.id, { intent: i, selected: k === 0, reason: k === 0 ? "venue mechanism: one change per tick; live needs --confirm and --allow-venue-switch" : "venue mechanism: one change per tick already selected" }));
  for (const i of intents.filter((x) => x.kind === "flag")) verdicts.set(i.id, { intent: i, selected: true, reason: "flag: structural contradiction, does not use the accept quota" });

  const cancels = intents.filter((x) => x.kind === "cancel");
  for (const i of cancels) verdicts.set(i.id, { intent: i, selected: true, reason: "cancel (frees an open offer)" });
  let posted = 0;
  let open = b.openOffersNow - cancels.length;
  for (const i of intents.filter((x) => x.kind === "listing")) {
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      continue;
    }
    if (posted >= b.offersPerTick) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `listings ${posted}/${b.offersPerTick} this tick` });
      continue;
    }
    if (open >= b.maxOpenOffers) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `open offers ${open}/${b.maxOpenOffers}` });
      continue;
    }
    posted += 1;
    open += 1;
    take(i);
    verdicts.set(i.id, { intent: i, selected: true, reason: `listing ${posted}/${b.offersPerTick}, open offers ${open}/${b.maxOpenOffers}` });
  }
  return intents.map((i) => verdicts.get(i.id)!);
}
