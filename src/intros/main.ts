import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { ledgerNow, loadLedgerFile, matchPairs } from "../broker/matchmaker.js";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { INTRO_PARAMS, loadIntroMemo, planIntros, saveIntroMemo, type IntroPlan } from "./intros.js";

/**
 * `pnpm bazaar:intros --dry-run --once`: reads our venue, the rivals ledger and our open conversations (GET only) and
 * prints the introductions it would send. Live requires dropping `--dry-run` AND passing `--confirm`; then it repeats
 * every `--every-s` seconds. Each introduction opens a team thread with the holder and one with the wanter, says one
 * message and closes it at once, so it holds a conversation slot for one call only.
 */
type IntrosApi = Pick<BazaarClient, "me" | "venues" | "clock" | "myThreads" | "raw" | "say" | "closeThread">;

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

/** Opens a team thread on our venue (El Rastro if that is refused), says the message and closes it. */
async function sendOne(api: IntrosApi, team: string, venue: string, text: string, log: (l: string) => void): Promise<boolean> {
  let id: number | undefined;
  for (const v of [venue, "rastro"]) {
    try {
      const t = (await api.raw("POST", "/api/threads", { with: team, venue: v })) as { id?: unknown };
      if (typeof t?.id === "number") {
        id = t.id;
        break;
      }
    } catch (e) {
      log(`[intros] open thread with ${team} on ${v} failed: ${e instanceof Error ? e.message : String(e)}`);
    }
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
    await api.closeThread(id).catch((e) => log(`[intros] close thread ${id} failed: ${e instanceof Error ? e.message : String(e)}`));
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
  log(`intros: ${dryRun ? "DRY-RUN" : "LIVE"} · ${INTRO_PARAMS.perHour} pairs/h · one intro per team every ${INTRO_PARAMS.teamCooldownMs / 3600_000} h · keep ${INTRO_PARAMS.minFreeSlots} conversation slots free`);
  for (;;) {
    const venue = await ourOpenVenue(client);
    const ledger = loadLedgerFile(values["rivals-file"]!);
    if (!venue) log("[intros] off: we run no open venue");
    else if (!ledger) log(`[intros] off: no rivals ledger at ${values["rivals-file"]}`);
    else {
      const memo = loadIntroMemo(memoFile);
      const pairs = matchPairs(ledger, "t02", ledgerNow(ledger));
      const { plans, notes } = planIntros(pairs, memo, venue, Date.now());
      for (const n of notes) log(n);
      for (const p of plans) await introduce(client, p, venue, dryRun, memo, memoFile, log);
    }
    if (values.once) return 0;
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

async function introduce(api: IntrosApi, p: IntroPlan, venue: string, dryRun: boolean, memo: ReturnType<typeof loadIntroMemo>, memoFile: string, log: (l: string) => void): Promise<void> {
  log(`[intros] ${p.ref}: ${p.holder} (spare) → ${p.wanter} (missing) on ${venue}`);
  if (dryRun) {
    for (const m of p.messages) log(`[intros] would tell ${m.team} (${m.role}): ${m.text}`);
    return;
  }
  // Both threads need a slot each, one after the other; dealers and the team desk keep theirs.
  if ((await freeSlots(api)) <= INTRO_PARAMS.minFreeSlots) {
    log(`[intros] ${p.ref}: skipped, fewer than ${INTRO_PARAMS.minFreeSlots + 1} free conversation slots`);
    return;
  }
  let sent = 0;
  for (const m of p.messages) if (await sendOne(api, m.team, venue, m.text, log)) sent += 1;
  if (sent) {
    memo.sent.push({ ts: Date.now(), ref: p.ref, holder: p.holder, wanter: p.wanter });
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
