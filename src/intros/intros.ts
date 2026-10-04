import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LedgerLike, MatchPair } from "../broker/matchmaker.js";

/**
 * Thread introductions: one-to-one half of the matchmaker. For a want-list × duplicate pair from the rivals ledger
 * (`matchPairs`), we tell the holder that a team lacks its spare and the wanter that a team holds it, each in a short
 * team thread, and point both to OUR venue, where the broker crosses a cash ask and a cash bid (any copy). Value created
 * between other teams on our venue is the organic half of the market score. The text names cards, teams and the venue,
 * never a figure; only structure (offers, feed, `/api/cards`) feeds the ledger. Pure except the memo file helpers.
 */

export const INTRO_PARAMS = {
  /** Pairs introduced per rolling hour (two threads each). */
  perHour: 3,
  /** Pairs introduced per run (one loop pass). */
  perRun: 1,
  /** A team gets at most one introduction in this window. */
  teamCooldownMs: 2 * 3600_000,
  /** The same card and holder/wanter pair is not introduced twice in this window. */
  pairCooldownMs: 6 * 3600_000,
  /** Free conversation slots that must remain after opening one (dealers and team desk share the cap). */
  minFreeSlots: 3,
  /** Book intros (an open order on our venue): teams told per order, and messages per rolling hour. */
  bookTargetsPerOrder: 2,
  bookPerHour: 4,
  /** A ledger sighting or want older than this is ignored for book intros. */
  maxAgeTicks: 240,
};
export type IntroParams = typeof INTRO_PARAMS;

export interface IntroSent {
  ts: number;
  ref: string;
  holder: string;
  wanter: string;
  /** Book intro: the only team we messaged (the other side is the order's maker). */
  target?: string;
}

export interface IntroMemo {
  sent: IntroSent[];
}

export interface IntroMessage {
  team: string;
  role: "holder" | "wanter";
  text: string;
}

export interface IntroPlan {
  ref: string;
  holder: string;
  wanter: string;
  messages: [IntroMessage, IntroMessage];
}

/** Team id → label used in the text ("t09" → "Team 9"). */
const label = (id: string): string => (/^t\d+$/.test(id) ? `Team ${Number(id.slice(1))}` : id);
/** A book maker: its team label, or "A team" for a pseudonym. */
const makerLabel = (id: string): string => (/^t\d+$/.test(id) ? label(id) : "A team");

/** The two messages of one introduction; game text (it goes to the other teams), no figure. */
export function introMessages(ref: string, holder: string, wanter: string, venue: string): [IntroMessage, IntroMessage] {
  // game text
  const head = `Team 2 here: we run venue "${venue}" (0 % fee, 0 P per card; our broker crosses every tick).`;
  return [
    {
      team: holder,
      role: "holder",
      // game text
      text: `${head} ${label(wanter)} is missing ${ref} and you hold a spare. Post it on venue "${venue}": give {"assets": [your ${ref} id]}, want cash. Our broker matches it with their bid as soon as the prices meet. No reply needed.`,
    },
    {
      team: wanter,
      role: "wanter",
      // game text
      text: `${head} ${label(holder)} holds a spare ${ref}, a card you are missing. Bid on venue "${venue}": give cash, want {"cards": ["${ref}"]}. Our broker crosses it with their ask as soon as the prices meet. No reply needed.`,
    },
  ];
}

/** Introductions to send now: best pairs first (most wanters), skipping teams and pairs in cooldown, within the hourly cap. */
export function planIntros(pairs: readonly MatchPair[], memo: IntroMemo, venue: string, now: number, params: IntroParams = INTRO_PARAMS): { plans: IntroPlan[]; notes: string[] } {
  const notes: string[] = [];
  const lastHour = memo.sent.filter((s) => !s.target && now - s.ts < 3600_000).length;
  let budget = Math.min(params.perRun, params.perHour - lastHour);
  if (budget <= 0) return { plans: [], notes: [`[intros] hourly cap reached (${lastHour}/${params.perHour})`] };
  const busy = busyTeams(memo, now, params);
  const done = new Set(memo.sent.filter((s) => now - s.ts < params.pairCooldownMs).map((s) => `${s.ref}:${s.holder}:${s.wanter}`));
  const plans: IntroPlan[] = [];
  for (const p of pairs) {
    if (budget <= 0) break;
    const holder = p.holders.find((h) => !busy.has(h));
    const wanter = p.wanters.find((w) => !busy.has(w) && w !== holder);
    if (!holder || !wanter) {
      notes.push(`[intros] skip ${p.ref}: every holder or wanter introduced in the last ${params.teamCooldownMs / 3600_000} h`);
      continue;
    }
    if (done.has(`${p.ref}:${holder}:${wanter}`)) continue;
    plans.push({ ref: p.ref, holder, wanter, messages: introMessages(p.ref, holder, wanter, venue) });
    busy.add(holder);
    busy.add(wanter);
    budget -= 1;
  }
  if (!plans.length && !notes.length) notes.push(`[intros] no pair to introduce (${pairs.length} card(s) with a want × duplicate pair)`);
  return { plans, notes };
}

/** Teams messaged within the team cooldown (a book intro only counts its target). */
function busyTeams(memo: IntroMemo, now: number, params: IntroParams): Set<string> {
  return new Set(memo.sent.filter((s) => now - s.ts < params.teamCooldownMs).flatMap((s) => (s.target ? [s.target] : [s.holder, s.wanter])));
}

/** An open order another team posted on our venue: one card for cash (ask) or cash for any copy of a card (bid). */
export interface BookOrder {
  id: number;
  maker: string;
  ref: string;
  side: "ask" | "bid";
}

/** Open one-card orders on our venue's public board, other teams only. Reads structure, never text. */
export function bookOrders(raw: unknown, us: string): BookOrder[] {
  const list = (raw as { offers?: unknown } | undefined)?.offers;
  if (!Array.isArray(list)) return [];
  const out: BookOrder[] = [];
  type Raw = { id?: unknown; maker?: unknown; status?: unknown; to?: unknown; give?: { assets?: { ref?: unknown }[]; cash?: unknown }; want?: { cash?: unknown; cards?: unknown[]; types?: unknown[]; assets?: unknown[] } };
  for (const o of list as Raw[]) {
    // The public board shows makers as pseudonyms; a team id only when the venue reveals it.
    if (typeof o.id !== "number" || typeof o.maker !== "string" || o.maker === us || o.to) continue;
    if ((typeof o.status === "string" ? o.status : "open") !== "open") continue;
    const gives = o.give?.assets ?? [];
    const wanted = [...(o.want?.cards ?? []), ...(o.want?.types ?? []).map((t) => (typeof t === "string" && t.startsWith("card:") ? t.slice(5) : undefined))].filter((r): r is string => typeof r === "string");
    const wantsOther = (o.want?.assets ?? []).length > 0 || (o.want?.types ?? []).length > wanted.length - (o.want?.cards ?? []).length;
    if (gives.length === 1 && typeof gives[0]?.ref === "string" && Number(o.want?.cash) > 0 && !wanted.length && !wantsOther) out.push({ id: o.id, maker: o.maker, ref: gives[0].ref, side: "ask" });
    else if (!gives.length && Number(o.give?.cash) > 0 && wanted.length === 1 && !wantsOther) out.push({ id: o.id, maker: o.maker, ref: wanted[0]!, side: "bid" });
  }
  return out;
}

/** The message of one book intro; game text, no figure. */
export function bookMessage(order: BookOrder, venue: string): string {
  // game text
  const head = `Team 2 here: we run venue "${venue}" (0 % fee, 0 P per card; our broker crosses every tick).`;
  return order.side === "bid"
    ? // game text
      `${head} ${makerLabel(order.maker)} has an open bid for ${order.ref} on venue "${venue}" right now, and you hold ${order.ref}. Post it there: give {"assets": [your ${order.ref} id]}, want cash. Our broker crosses it as soon as the prices meet. No reply needed.`
    : // game text
      `${head} ${makerLabel(order.maker)} is selling ${order.ref} on venue "${venue}" right now, a card you are missing. Bid there: give cash, want {"cards": ["${order.ref}"]}. Our broker crosses it as soon as the prices meet. No reply needed.`;
}

export interface BookIntro {
  order: BookOrder;
  team: string;
  text: string;
}

/**
 * Book intros: for each open order on our venue, the teams that can fill it (holders of the card for a bid, spares
 * first; teams that asked for it and are not seen holding it for an ask), skipping teams in cooldown, within the
 * hourly cap. They go before pair intros: a live order is a counterparty waiting.
 */
export function planBookIntros(orders: readonly BookOrder[], ledger: LedgerLike, us: string, memo: IntroMemo, venue: string, now: number, ledgerTick: number, params: IntroParams = INTRO_PARAMS): { intros: BookIntro[]; notes: string[] } {
  const notes: string[] = [];
  const lastHour = memo.sent.filter((s) => s.target && now - s.ts < 3600_000).length;
  let budget = params.bookPerHour - lastHour;
  if (!orders.length) return { intros: [], notes: [] };
  if (budget <= 0) return { intros: [], notes: [`[intros] book: hourly cap reached (${lastHour}/${params.bookPerHour})`] };
  const busy = busyTeams(memo, now, params);
  const told = new Set(memo.sent.filter((s) => s.target && now - s.ts < params.pairCooldownMs).map((s) => `${s.ref}:${s.target}`));
  const fresh = (tick: number) => ledgerTick - tick <= params.maxAgeTicks;
  const intros: BookIntro[] = [];
  for (const o of orders) {
    const copies = new Map<string, number>();
    for (const a of Object.values(ledger.assets)) {
      if (a.ref !== o.ref || !a.holder || !/^t\d+$/.test(a.holder) || !fresh(a.confirmedTick ?? a.tick)) continue;
      copies.set(a.holder, (copies.get(a.holder) ?? 0) + 1);
    }
    const candidates =
      o.side === "bid"
        ? [...copies].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t)
        : Object.entries(ledger.wants).filter(([t, w]) => w[o.ref] !== undefined && fresh(w[o.ref]!) && !copies.has(t)).map(([t]) => t).sort();
    let n = 0;
    for (const team of candidates) {
      if (budget <= 0 || n >= params.bookTargetsPerOrder) break;
      if (team === us || team === o.maker || busy.has(team) || told.has(`${o.ref}:${team}`)) continue;
      intros.push({ order: o, team, text: bookMessage(o, venue) });
      busy.add(team);
      budget -= 1;
      n += 1;
    }
    if (!n) notes.push(`[intros] book #${o.id} ${o.side} ${o.ref} by ${o.maker}: no team to tell (${candidates.length} candidate(s), all in cooldown or none seen)`);
  }
  return { intros, notes };
}

export function loadIntroMemo(file: string): IntroMemo {
  if (!existsSync(file)) return { sent: [] };
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<IntroMemo>;
    return { sent: Array.isArray(raw.sent) ? raw.sent : [] };
  } catch {
    return { sent: [] };
  }
}

/**
 * Cards with team demand from intros (Pablo, 4 Oct: duplicates go to teams first): refs of intros sent in the last 6 h
 * where we hold the spare. Read by the dealers route and the Workshop; an unreadable memo gives no demand.
 */
export function introDemand(team: string | null | undefined, file = join(process.cwd(), "results", "bazaar-live", "intros.json"), now = Date.now()): ReadonlySet<string> {
  if (!team) return new Set();
  return new Set(loadIntroMemo(file).sent.filter((s) => s.holder === team && s.ts >= now - 6 * 3_600_000).map((s) => s.ref));
}

export function saveIntroMemo(file: string, memo: IntroMemo): void {
  writeFileSync(file, `${JSON.stringify(memo, null, 2)}\n`);
}
