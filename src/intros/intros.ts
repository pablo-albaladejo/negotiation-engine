import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { MatchPair } from "../broker/matchmaker.js";

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
};
export type IntroParams = typeof INTRO_PARAMS;

export interface IntroSent {
  ts: number;
  ref: string;
  holder: string;
  wanter: string;
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
  const lastHour = memo.sent.filter((s) => now - s.ts < 3600_000).length;
  let budget = Math.min(params.perRun, params.perHour - lastHour);
  if (budget <= 0) return { plans: [], notes: [`[intros] hourly cap reached (${lastHour}/${params.perHour})`] };
  const busy = new Set(memo.sent.filter((s) => now - s.ts < params.teamCooldownMs).flatMap((s) => [s.holder, s.wanter]));
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
