import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { ledgerNow, loadLedgerFile, matchPairs } from "../broker/matchmaker.js";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { bookOrders, INTRO_PARAMS, loadIntroMemo, planBookIntros, planIntros, saveIntroMemo, type BookIntro, type IntroPlan } from "./intros.js";

/**
 * `pnpm bazaar:intros --dry-run --once`: reads our venue, the rivals ledger and our open conversations (GET only) and
 * prints the introductions it would send. Live requires dropping `--dry-run` AND passing `--confirm`; then it repeats
 * every `--every-s` seconds. Each introduction opens a team thread with the holder and one with the wanter, says one
 * message and closes it at once, so it holds a conversation slot for one call only.
 */
type IntrosApi = Pick<BazaarClient, "me" | "venues" | "clock" | "myThreads" | "raw" | "say" | "closeThread" | "board">;

/** Our open venue id from `/api/me` (string or object), confirmed open in the public listing; undefined otherwise. */
async function ourOpenVenue(api: IntrosApi): Promise<string | undefined> {
  const mine = (await api.me()) as { venue?: unknown };
  const v = mine.venue;
  const id = typeof v === "string" ? v : v && typeof v === "object" ? ((v as { venue?: unknown; id?: unknown }).venue ?? (v as { id?: unknown }).id) : undefined;
  if (typeof id !== "string") return undefined;
  const listed = (await api.venues()).venues.find((x) => x.venue === id) as { status?: unknown } | undefined;
  return listed && (listed.status ?? "open") === "open" ? id : undefined;
}

async function freeSlots(api: IntrosApi): Promise<number> {
  const clock = await api.clock();
  const cap = Number((clock.limits as Record<string, unknown> | undefined)?.max_open_threads_per_team ?? 6);
  const open = (await api.myThreads("open")).threads.filter((t) => (t.status ?? "open") === "open").length;
  return (Number.isFinite(cap) ? cap : 6) - open;
}

/**
 * Opens a team thread on El Rastro (a thread on our own venue is refused: `self_venue`), says the message and closes it.
 * The message itself still points both teams to our venue.
 */
async function sendOne(api: IntrosApi, team: string, text: string, log: (l: string) => void): Promise<boolean> {
  let id: number | undefined;
  try {
    const t = (await api.raw("POST", "/api/threads", { with: team, venue: "rastro" })) as { id?: unknown };
    if (typeof t?.id === "number") id = t.id;
  } catch (e) {
    log(`[intros] open thread with ${team} on rastro failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (id === undefined) return false;
  try {
    await api.say(id, text);
    log(`[intros] sent to ${team} in thread ${id}`);
    return true;
  } catch (e) {
    log(`[intros] say to ${team} in thread ${id} failed: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  } finally {
    await closeOrQueue(api, id, log);
  }
}

/** Thread ids whose close failed (e.g. rate_limited): retried at the start of every pass so no slot stays taken. */
const pendingCloses = new Set<number>();

/** Closes a thread, retrying once after a second; if it still fails, the id waits in `pendingCloses`. */
async function closeOrQueue(api: IntrosApi, id: number, log: (l: string) => void): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await api.closeThread(id);
      pendingCloses.delete(id);
      return;
    } catch (e) {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1200));
      else log(`[intros] close thread ${id} failed: ${e instanceof Error ? e.message : String(e)} (retried next pass)`);
    }
  }
  pendingCloses.add(id);
}

async function retryPendingCloses(api: IntrosApi, log: (l: string) => void): Promise<void> {
  for (const id of [...pendingCloses]) {
    try {
      await api.closeThread(id);
      pendingCloses.delete(id);
      log(`[intros] closed thread ${id} on retry`);
    } catch (e) {
      log(`[intros] close thread ${id} still failing: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

export async function runIntrosCli(argv: string[], log: (line: string) => void = console.log, api?: IntrosApi): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "dry-run": { type: "boolean", default: false },
      once: { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      "every-s": { type: "string", default: "300" },
      "rivals-file": { type: "string", default: "results/bazaar-live/rivals.json" },
      "memo-file": { type: "string", default: "results/bazaar-live/intros.json" },
    },
  });
  const dryRun = values["dry-run"];
  if (!dryRun && !values.confirm) {
    log("REFUSED: live intros send messages to other teams; run with --dry-run, or without it AND with --confirm (only with the user's approval).");
    return 2;
  }
  let client = api;
  if (!client) {
    const env = loadBazaarEnv();
    if (!env.key) {
      log("Missing BAZAAR_KEY (set it in .env or in the environment).");
      return 2;
    }
    client = new BazaarClient({ url: env.url, key: env.key });
  }
  const everyMs = Math.max(30, Number(values["every-s"]) || 300) * 1000;
  const memoFile = resolve(values["memo-file"]!);
  log(`intros: ${dryRun ? "DRY-RUN" : "LIVE"} · ${INTRO_PARAMS.perHour} pairs/h · book intros ${INTRO_PARAMS.bookPerHour}/h (≤ ${INTRO_PARAMS.bookTargetsPerOrder} per order) · one intro per team every ${INTRO_PARAMS.teamCooldownMs / 3600_000} h · keep ${INTRO_PARAMS.minFreeSlots} conversation slots free`);
  for (;;) {
    try {
      await pass();
    } catch (e) {
      // A failed read (rate limit, network) skips this pass; the loop keeps running.
      log(`[intros] pass failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (values.once) return 0;
    await new Promise((r) => setTimeout(r, everyMs));
  }

  async function pass(): Promise<void> {
    if (!dryRun) await retryPendingCloses(client!, log);
    const venue = await ourOpenVenue(client!);
    const ledger = loadLedgerFile(values["rivals-file"]!);
    if (!venue) log("[intros] off: we run no open venue");
    else if (!ledger) log(`[intros] off: no rivals ledger at ${values["rivals-file"]}`);
    else {
      const memo = loadIntroMemo(memoFile);
      // Live orders on our venue first: a counterparty is already waiting there.
      const raw = await client!.board(venue).catch((e: unknown) => log(`[intros] book of ${venue} unreadable: ${e instanceof Error ? e.message : String(e)}`));
      const orders = bookOrders(raw, "t02");
      const book = planBookIntros(orders, ledger, "t02", memo, venue, Date.now(), ledgerNow(ledger));
      if (orders.length) log(`[intros] book: ${orders.length} open order(s) by other teams on ${venue}`);
      for (const n of book.notes) log(n);
      for (const b of book.intros) await introduceBook(client!, b, dryRun, memo, memoFile, log);
      const pairs = matchPairs(ledger, "t02", ledgerNow(ledger));
      const { plans, notes } = planIntros(pairs, memo, venue, Date.now());
      for (const n of notes) log(n);
      for (const p of plans) await introduce(client!, p, venue, dryRun, memo, memoFile, log);
    }
  }
}

async function introduce(api: IntrosApi, p: IntroPlan, venue: string, dryRun: boolean, memo: ReturnType<typeof loadIntroMemo>, memoFile: string, log: (l: string) => void): Promise<void> {
  log(`[intros] ${p.ref}: ${p.holder} (spare) → ${p.wanter} (missing) on ${venue}`);
  if (dryRun) {
    for (const m of p.messages) log(`[intros] would tell ${m.team} (${m.role}): ${m.text}`);
    return;
  }
  // One thread per message, one after the other; dealers and the team desk keep their slots.
  if ((await freeSlots(api)) <= INTRO_PARAMS.minFreeSlots) {
    log(`[intros] ${p.ref}: skipped, fewer than ${INTRO_PARAMS.minFreeSlots + 1} free conversation slots`);
    return;
  }
  let sent = 0;
  for (const m of p.messages) if (await sendOne(api, m.team, m.text, log)) sent += 1;
  if (sent) {
    memo.sent.push({ ts: Date.now(), ref: p.ref, holder: p.holder, wanter: p.wanter, wanterOnly: true });
    saveIntroMemo(memoFile, memo);
  }
}

async function introduceBook(api: IntrosApi, b: BookIntro, dryRun: boolean, memo: ReturnType<typeof loadIntroMemo>, memoFile: string, log: (l: string) => void): Promise<void> {
  const o = b.order;
  log(`[intros] book #${o.id}: ${o.maker} ${o.side} ${o.ref} → tell ${b.team}`);
  if (dryRun) {
    log(`[intros] would tell ${b.team}: ${b.text}`);
    return;
  }
  if ((await freeSlots(api)) <= INTRO_PARAMS.minFreeSlots) {
    log(`[intros] book #${o.id}: skipped, fewer than ${INTRO_PARAMS.minFreeSlots + 1} free conversation slots`);
    return;
  }
  if (await sendOne(api, b.team, b.text, log)) {
    const [holder, wanter] = o.side === "bid" ? [b.team, o.maker] : [o.maker, b.team];
    memo.sent.push({ ts: Date.now(), ref: o.ref, holder, wanter, target: b.team });
    saveIntroMemo(memoFile, memo);
  }
}

if (process.argv[1] && /intros\/main\.[cm]?[jt]s$/.test(process.argv[1])) {
  runIntrosCli(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    },
  );
}
