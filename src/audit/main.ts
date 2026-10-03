import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import type { Catalog, Me } from "../shared/schemas.js";
import { buildValueModel, heldAssets, type ValueModel } from "../trades/trades.js";
import { albumCopyLost, bookGaps, cashFloor, reserveBreach, churn, DETECTORS, doubleAct, dupBuy, maxSpend, planView, playView, repeatFailure, tradePairs, type Alert, type Detector, type TickView } from "./detectors.js";
import { dealerSaturated, dealerSpam, hiddenCardMove, duelLeftOnTable, duelUnanswered, repeatedPrice, type ConductInput } from "./conduct.js";
import { baselineFromCounts, baselineFromMe, replay, type Baseline, type Ledger } from "./ledger.js";
import { ValueHistory } from "./value-history.js";
import { daySnapshots, DuelSendParser, latestCatalog, parseDealerEvent, parseDecision, parseJson, parsePlanLine, parseStreamLine, PlayLogParser, readDuelsState, readValuesFile, Tail, type DealerEvent, type DecisionNote, type PlanLine, type Snapshot, type StreamEvent } from "./sources.js";

/**
 * `pnpm bazaar:audit`: read-only inefficiency monitor. Reads local traces (recorder stream, decisions, plan.jsonl or
 * play.log, values.json, recorded snapshots); at most one GET /api/me at start and then every ≥ 5 min. Never POSTs.
 *   --date YYYY-MM-DD  process that whole day once, print a report and exit
 *   --watch            tail the files every --interval seconds (15) and append new alerts
 * Alerts go to results/bazaar-live/<date>/audit.jsonl (deduplicated by key across restarts) and the per-detector status
 * to audit-status.json (overwritten). --out writes both elsewhere; --no-api skips /api/me.
 */

const { values: args } = parseArgs({
  options: {
    date: { type: "string" },
    watch: { type: "boolean", default: false },
    interval: { type: "string", default: "15" },
    out: { type: "string" },
    "no-api": { type: "boolean", default: false },
  },
});

/** A source stalled for more than this many ticks while the clock moves marks its detectors unmeasured. */
const STALE_TICKS = 10;
const ME_EVERY_MS = 5 * 60_000;

const root = process.cwd();
const liveRoot = join(root, "results", "bazaar-live");
const date = args.date ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD (got ${date})`);
  process.exit(2);
}
const dayDir = join(liveRoot, date);
const localDate = new Date().toLocaleDateString("sv-SE");
const logsDir = [join(root, "results", "logs", date), join(root, "results", "logs", localDate)].find((d) => existsSync(join(d, "play.log"))) ?? join(root, "results", "logs", date);
const outDir = args.out ?? dayDir;
const auditFile = join(outDir, "audit.jsonl");
/** A path relative to the repo when it is inside it, otherwise absolute. */
const show = (p: string): string => {
  const r = relative(root, p);
  return r.startsWith("..") || isAbsolute(r) ? p : r;
};
const statusFile = join(outDir, "audit-status.json");

// ---------------------------------------------------------------- sources

type SourceName = "stream-team" | "stream-public" | "plan" | "play.log" | "decisions" | "score";
const tails: Record<SourceName, Tail> = {
  "stream-team": new Tail(join(dayDir, "stream-team.jsonl")),
  "stream-public": new Tail(join(dayDir, "stream-public.jsonl")),
  plan: new Tail(join(dayDir, "plan.jsonl")),
  "play.log": new Tail(join(logsDir, "play.log")),
  decisions: new Tail(join(dayDir, "decisions.jsonl")),
  score: new Tail(join(dayDir, "score.jsonl")),
};
const lastTick: Partial<Record<SourceName, number>> = {};
const seenTick = (s: SourceName, tick: number): void => {
  lastTick[s] = Math.max(lastTick[s] ?? -Infinity, tick);
};

const events = new Map<number, StreamEvent>();
const planLines = new Map<number, PlanLine>();
const play = new PlayLogParser();
const history = new ValueHistory();
const decisions: DecisionNote[] = [];
const dealerEvents: DealerEvent[] = [];
const duelsStateFile = join(dayDir, "duels-state.json");
let streamTeam: string | undefined;

function readAll(): void {
  for (const s of ["stream-team", "stream-public"] as const) {
    for (const line of tails[s].read()) {
      const { event, team } = parseStreamLine(line);
      if (team && s === "stream-team") streamTeam = team;
      if (!event) continue;
      events.set(event.id, event);
      seenTick(s, event.tick);
    }
  }
  for (const line of tails.plan.read()) {
    const p = parsePlanLine(line);
    if (!p) continue;
    planLines.set(p.tick, p);
    history.addPlan(p);
    seenTick("plan", p.tick);
  }
  for (const line of tails["play.log"].read()) {
    play.push(line);
    history.pushPlayLog(line);
  }
  for (const t of play.ticks.keys()) seenTick("play.log", t);
  for (const line of tails.decisions.read()) {
    const ev = parseDealerEvent(line);
    if (ev) dealerEvents.push(ev);
    const d = parseDecision(line);
    if (!d) continue;
    decisions.push(d);
    seenTick("decisions", d.tick);
  }
  for (const line of tails.score.read()) {
    const j = parseJson(line) as { tick?: unknown } | undefined;
    if (typeof j?.tick === "number") seenTick("score", j.tick);
  }
}

// ---------------------------------------------------------------- /api/me (sparingly) and value model

const env = loadBazaarEnv();
const client = !args["no-api"] && env.key ? new BazaarClient({ url: env.url, key: env.key }) : undefined;
let me: Me | undefined;
let meAt = 0;
let apiTick: number | undefined;
async function refreshMe(): Promise<void> {
  if (!client || Date.now() - meAt < ME_EVERY_MS) return;
  meAt = Date.now();
  try {
    me = await client.me();
    const t = (me as { tick?: unknown }).tick;
    if (typeof t === "number") apiTick = t;
  } catch (e) {
    console.log(`[audit] GET /api/me failed: ${e instanceof Error ? e.message : String(e)} (continuing from local files)`);
  }
}

let snapshots: Snapshot[] = daySnapshots(dayDir);
const catalog: Catalog | undefined = latestCatalog(liveRoot);

function valueModel(): ValueModel | undefined {
  const zero = readValuesFile(join(liveRoot, "values.json"));
  const held = me ?? snapshots.filter((s) => s.me).at(-1)?.me;
  if (!held && zero.size === 0) return undefined;
  return buildValueModel(catalog ?? { sets: [], packs: [] }, heldAssets(held?.assets ?? []), zero);
}

function baseline(): Baseline | undefined {
  const firstTick = Math.min(...[...events.values()].map((e) => e.tick));
  const withMe = snapshots.filter((s) => s.me);
  if (withMe.length === 0) snapshots = daySnapshots(dayDir);
  const snap = withMe.filter((s) => s.tick <= firstTick).at(-1) ?? withMe[0];
  if (snap?.me) return baselineFromMe(snap.me, snap.tick, show(snap.file));
  const first = [...planLines.values()].sort((a, b) => a.tick - b.tick)[0];
  if (first?.holdings) return baselineFromCounts(first.holdings, first.tick, "plan.jsonl (first line)");
  return undefined;
}

// ---------------------------------------------------------------- run detectors

interface DetectorStatus {
  status: "measured" | "unmeasured";
  reason: string;
  alerts: number;
  lossP: number;
  lastTick: number | null;
}

function tickViews(): TickView[] {
  const views = new Map<number, TickView>();
  for (const t of play.ticks.values()) views.set(t.tick, playView(t));
  for (const p of planLines.values()) views.set(p.tick, planView(p));
  return [...views.values()].sort((a, b) => a.tick - b.tick);
}

/** Duel counters and accepts we sent: play.log, plus the duel lines of each plan.jsonl execution (deduplicated later per duel and tick). */
function duelSends(): DuelSendParser["sends"] {
  const fromPlan = new DuelSendParser();
  for (const p of [...planLines.values()].sort((a, b) => a.tick - b.tick)) {
    for (const e of p.execution) if (e.route === "duels") for (const l of (e.detail ?? "").split("\n")) fromPlan.push(l.trim(), p.tick);
  }
  return [...play.duels.sends, ...fromPlan.sends];
}

/** Dealer errors in plan.jsonl execution lines: `dealer abuela: [tick 406] · error · buy:RET-02 · error persona_quota`. */
function planDealerErrors(): { tick: number; dealer: string; target: string; code: string; line: string }[] {
  return [...planLines.values()].flatMap((p) =>
    p.execution.flatMap((e) => {
      const m = /dealer (\w+): \[tick \d+\] · error · (\S+) · .*\berror ([\w-]+)/.exec(e.detail ?? "");
      return m ? [{ tick: p.tick, dealer: m[1]!, target: m[2]!, code: m[3]!, line: e.detail ?? "" }] : [];
    }),
  );
}

function evaluate(): { alerts: Alert[]; status: Record<string, unknown>; ledger: Ledger } {
  const team = me?.id ?? streamTeam ?? snapshots.find((s) => s.me?.id)?.me?.id ?? undefined;
  if (!team) throw new Error("our team id is unknown: no hello in stream-team.jsonl, no snapshot and no /api/me");
  const base = baseline();
  const model = valueModel();
  const ledger = replay({ team, events: [...events.values()], ...(base ? { baseline: base } : {}), decisions });
  const views = tickViews();
  const clock = Math.max(ledger.lastTick, ...Object.values(lastTick).filter((x): x is number => x !== undefined), apiTick ?? -Infinity);

  const health = (s: SourceName): { ok: boolean; why: string } => {
    const t = lastTick[s];
    if (t === undefined) return { ok: false, why: `${s}: no data` };
    if (clock - t > STALE_TICKS) return { ok: false, why: `${s}: stale since tick ${t} (clock ${clock})` };
    return { ok: true, why: `${s} up to tick ${t}` };
  };
  const statics: Record<string, { ok: boolean; why: string }> = {
    baseline: base ? { ok: true, why: `baseline ${base.source} @ tick ${base.tick} (${base.cards.length} cards)` } : { ok: false, why: "baseline: no recorded /api/me snapshot and no plan.jsonl" },
    values: model && model.base.size > 0 ? { ok: true, why: `values for ${model.base.size} cards` } : { ok: false, why: "values: no values.json and no /api/me" },
    catalog: catalog ? { ok: true, why: "catalog from a recorded snapshot" } : { ok: false, why: "catalog: no recorded /api/catalog" },
  };
  const need = (...xs: string[]): { ok: boolean; why: string } => {
    const hs = xs.map((x) => statics[x] ?? health(x as SourceName));
    const bad = hs.filter((h) => !h.ok);
    return bad.length ? { ok: false, why: bad.map((h) => h.why).join("; ") } : { ok: true, why: hs.map((h) => h.why).join("; ") };
  };
  const coord = (): { ok: boolean; why: string } => {
    const p = health("plan");
    if (p.ok) return { ok: true, why: `${p.why}${views.some((v) => v.source === "play.log") ? " (play.log for earlier ticks)" : ""}` };
    const l = health("play.log");
    return l.ok ? { ok: true, why: `${p.why} → play.log fallback (${l.why})` } : { ok: false, why: `${p.why}; ${l.why}` };
  };
  // Our duel sends come from the coordinator's execution lines: without plan.jsonl or play.log we cannot tell silence apart.
  const duelCoverage = (): { ok: boolean; why: string } => {
    const st = health("stream-team");
    const c = coord();
    return st.ok && c.ok ? { ok: true, why: `${st.why}; our sends from ${c.why}` } : { ok: false, why: [st, c].filter((h) => !h.ok).map((h) => h.why).join("; ") };
  };
  // Dealers need decisions.jsonl, duels only the stream and our sends: one stale half must not hide the other.
  const repeatedCoverage = (): { ok: boolean; why: string } => {
    const dealers = need("stream-team", "decisions");
    const duels = duelCoverage();
    if (dealers.ok && duels.ok) return { ok: true, why: dealers.why };
    if (duels.ok) return { ok: true, why: `duels only (${duels.why}); dealers unmeasured: ${dealers.why}` };
    if (dealers.ok) return { ok: true, why: `dealers only (${dealers.why}); duels unmeasured: ${duels.why}` };
    return { ok: false, why: `${dealers.why}; ${duels.why}` };
  };
  const conduct: ConductInput = { team, events: [...events.values()], dealerEvents, duelSends: duelSends(), duelMemory: readDuelsState(duelsStateFile), date, clock };
  const requirements: Record<Detector, { ok: boolean; why: string }> = {
    "dup-buy": need("stream-team", "baseline", "values"),
    "round-trip-loss": need("stream-team"),
    "buy-back": need("stream-team"),
    "below-best-bid": need("stream-team", "stream-public"),
    "above-best-ask": need("stream-team", "stream-public"),
    "album-copy-lost": need("stream-team", "baseline", "catalog", "values"),
    "cash-floor": coord(),
    "reserve-breach": play.reserveFrom === undefined ? { ok: false, why: "page reserve unknown: no `page reserve:` line in play.log" } : need("stream-team", "play.log"),
    "max-spend": need("plan", "stream-team"),
    "double-act": coord(),
    "repeat-failure": coord(),
    churn: need("stream-team"),
    "repeated-price": repeatedCoverage(),
    "duel-unanswered": duelCoverage(),
    "duel-left-on-table": need("stream-team"),
    "dealer-saturated": need("stream-team"),
    "hidden-card-move": need("stream-team"),
    "dealer-spam": need("stream-team", "decisions"),
    "stale-source": { ok: true, why: "file ticks against the clock" },
  };

  // score.jsonl is only written by a standalone `pnpm bazaar`, never by bazaar:play: its silence is not a stale source.
  const stale: Alert[] = (["stream-team", "stream-public", "plan", "play.log"] as const).flatMap((s) => {
    const t = lastTick[s];
    if (t === undefined || clock - t <= STALE_TICKS) return [];
    return [
      {
        v: 1 as const,
        ts: new Date().toISOString(),
        tick: clock,
        detector: "stale-source" as const,
        severity: s.startsWith("stream") ? ("high" as const) : ("low" as const),
        refs: [],
        assets: [],
        summary: `${s} has no new data since tick ${t} (clock at tick ${clock}).`,
        evidence: { source: s, lastTick: t, clock },
        key: `stale-source:${s}:${t}`,
      },
    ];
  });

  // Values as of each trade's tick; reservations need the ledger's book to map sold asset ids to refs (re-adding is a no-op).
  history.addDecisions(decisions, ledger.lots);
  const alerts = [
    ...dupBuy(ledger, model, history),
    ...tradePairs(ledger),
    ...bookGaps(ledger),
    ...albumCopyLost(ledger, model, history),
    ...cashFloor(views),
    ...reserveBreach(ledger, views, new Map([...play.ticks].flatMap(([t, p]) => (p.reserve ? [[t, p.reserve] as const] : []))), play.reserveFrom, model),
    ...maxSpend(views, ledger),
    ...doubleAct(views, ledger),
    ...repeatFailure(views),
    ...churn(ledger),
    ...repeatedPrice(conduct),
    ...duelUnanswered(conduct),
    ...duelLeftOnTable(conduct),
    ...dealerSaturated(conduct),
    ...hiddenCardMove(conduct),
    ...dealerSpam(conduct, planDealerErrors()),
    ...stale,
  ].sort((a, b) => a.tick - b.tick);
  const deduped = markOverlaps(alerts);

  const detectors: Record<string, DetectorStatus> = {};
  for (const d of DETECTORS) {
    const mine = alerts.filter((a) => a.detector === d);
    const r = requirements[d];
    detectors[d] = { status: r.ok ? "measured" : "unmeasured", reason: r.why, alerts: mine.length, lossP: round(mine.reduce((s, a) => s + (a.lossP ?? 0), 0)), lastTick: mine.at(-1)?.tick ?? null };
  }
  const status = {
    v: 1,
    updated: new Date().toISOString(),
    date,
    team,
    clock,
    lossP: { gross: round(alerts.reduce((s, a) => s + (a.lossP ?? 0), 0)), deduped: deduped },
    baseline: base ? { source: base.source, tick: base.tick, cards: base.cards.length } : null,
    sources: Object.fromEntries((Object.keys(tails) as SourceName[]).map((s) => [s, { file: show(tails[s].file), lastTick: lastTick[s] ?? null, stale: lastTick[s] === undefined ? null : clock - lastTick[s]! > STALE_TICKS }])),
    detectors,
  };
  return { alerts, status, ledger };
}

const round = (x: number): number => Math.round(x * 10) / 10;

/**
 * Alerts that count a loss on the same trade (`evidence.trades`: dup-buy and the round trip of that copy, a buy-back and
 * the round trip before it…) form one group: each alert gets `overlaps` (the other keys) and the deduplicated total
 * counts only the largest loss of each group.
 */
function markOverlaps(alerts: Alert[]): number {
  const parent = alerts.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const owner = new Map<string, number>();
  alerts.forEach((a, i) => {
    const trades = Array.isArray(a.evidence.trades) ? (a.evidence.trades as string[]) : [];
    for (const t of trades) {
      const j = owner.get(t);
      if (j === undefined) owner.set(t, i);
      else parent[find(i)] = find(j);
    }
  });
  const groups = new Map<number, number[]>();
  alerts.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]));
  let total = 0;
  for (const members of groups.values()) {
    total += Math.max(0, ...members.map((i) => alerts[i]!.lossP ?? 0));
    if (members.length > 1) for (const i of members) alerts[i]!.overlaps = members.filter((j) => j !== i).map((j) => alerts[j]!.key);
  }
  return round(total);
}

// ---------------------------------------------------------------- output

/**
 * Detectors whose verdict on a past trade or run is final once its sources are read: a key of theirs that a measured
 * pass no longer produces is retracted (e.g. an album-copy-lost judged with today's value, or a duel held at our floor).
 */
const RETRACTABLE: ReadonlySet<Detector> = new Set<Detector>(["dup-buy", "album-copy-lost", "repeated-price"]);
const RETRACT_WHY: Partial<Record<Detector, string>> = {
  "dup-buy": "no longer qualifies: the next copy valued as of the trade's tick covers its cost",
  "album-copy-lost": "no longer qualifies: valued as of the trade's tick, the sale covered the card's value",
  "repeated-price": "no longer qualifies: the repeated price was our floor (no room to move)",
};

/** A line of audit.jsonl that withdraws an earlier alert; the last line of a key wins. */
interface Retraction {
  v: 1;
  kind: "retract";
  ts: string;
  key: string;
  detector: Detector;
  reason: string;
}

type Written = { detector: Detector; severity: string; lossP?: number } | "retracted";
const written = new Map<string, Written>();
if (existsSync(auditFile)) {
  for (const line of readFileSync(auditFile, "utf8").split("\n")) {
    const j = parseJson(line) as { key?: unknown; kind?: unknown; detector?: unknown; severity?: unknown; lossP?: unknown } | undefined;
    if (typeof j?.key !== "string") continue;
    if (j.kind === "retract") written.set(j.key, "retracted");
    else written.set(j.key, { detector: j.detector as Detector, severity: String(j.severity), ...(typeof j.lossP === "number" ? { lossP: j.lossP } : {}) });
  }
}

const fmt = (a: Alert): string => `[audit] ${a.severity.toUpperCase().padEnd(6)} ${a.detector.padEnd(15)} t${a.tick}${a.lossP !== undefined ? ` −${a.lossP} P` : ""} · ${a.summary}`;
const fmtLoss = (w: { severity: string; lossP?: number }): string => `${w.severity}${w.lossP !== undefined ? ` −${w.lossP} P` : ""}`;

/**
 * Appends to audit.jsonl the alerts not yet there, a retraction plus the new version of an alert whose severity or loss
 * changed, and a retraction for each key of a RETRACTABLE detector (measured this pass) that no longer comes out. A
 * retracted key that qualifies again is written again. Prints every alert (`printAll`) or only what changed.
 */
function emit(alerts: Alert[], status: Record<string, unknown>, printAll: boolean): Alert[] {
  mkdirSync(outDir, { recursive: true });
  const retract = (key: string, detector: Detector, reason: string): Retraction => ({ v: 1, kind: "retract", ts: new Date().toISOString(), key, detector, reason });
  const retractions: Retraction[] = [];
  const fresh: Alert[] = [];
  const now = new Set(alerts.map((a) => a.key));
  for (const a of alerts) {
    const prev = written.get(a.key);
    if (prev && prev !== "retracted" && prev.severity === a.severity && prev.lossP === a.lossP) continue;
    if (prev && prev !== "retracted") retractions.push(retract(a.key, a.detector, `re-evaluated: ${fmtLoss(prev)} → ${fmtLoss(a)}`));
    fresh.push(a);
  }
  const detectors = status.detectors as Record<string, DetectorStatus>;
  for (const [key, prev] of written) {
    if (prev === "retracted" || now.has(key) || !RETRACTABLE.has(prev.detector) || detectors[prev.detector]?.status !== "measured") continue;
    retractions.push(retract(key, prev.detector, RETRACT_WHY[prev.detector] ?? "no longer qualifies"));
  }
  for (const r of retractions) {
    appendFileSync(auditFile, `${JSON.stringify(r)}\n`);
    written.set(r.key, "retracted");
    console.log(`[audit] RETRACT ${r.detector.padEnd(15)} ${r.key} · ${r.reason}`);
  }
  for (const a of fresh) {
    appendFileSync(auditFile, `${JSON.stringify(a)}\n`);
    written.set(a.key, { detector: a.detector, severity: a.severity, ...(a.lossP !== undefined ? { lossP: a.lossP } : {}) });
  }
  for (const a of printAll ? alerts : fresh) console.log(fmt(a));
  status.retracted = [...written].filter(([, w]) => w === "retracted").map(([k]) => k);
  writeFileSync(statusFile, `${JSON.stringify(status, null, 2)}\n`);
  return fresh;
}

function report(alerts: Alert[], status: { detectors: Record<string, DetectorStatus>; team: string; clock: number; lossP: { gross: number; deduped: number }; retracted?: string[] }, ledger: Ledger): void {
  console.log(`\n== audit ${date} · team ${status.team} · clock tick ${status.clock} · ${ledger.trades.length} of our trades · ${ledger.lots.length} cards in the book ==`);
  for (const [d, s] of Object.entries(status.detectors)) {
    console.log(`  ${d.padEnd(15)} ${s.status.padEnd(10)} ${String(s.alerts).padStart(3)} alerts · ${String(s.lossP).padStart(6)} P · ${s.reason}`);
  }
  console.log(`  total: ${alerts.length} alerts · ${status.lossP.gross} P gross · ${status.lossP.deduped} P counting each overlapping loss once (retracted alerts never count)`);
  if (status.retracted?.length) console.log(`  retracted in audit.jsonl: ${status.retracted.length} (${status.retracted.join(", ")})`);
  console.log(`  written: ${show(auditFile)} · ${show(statusFile)}`);
}

async function cycle(printAll: boolean): Promise<{ r: ReturnType<typeof evaluate>; fresh: Alert[] }> {
  await refreshMe();
  readAll();
  const r = evaluate();
  return { r, fresh: emit(r.alerts, r.status, printAll) };
}

async function main(): Promise<void> {
  if (!args.watch) {
    const { r } = await cycle(true);
    report(r.alerts, r.status as never, r.ledger);
    return;
  }
  const every = Math.max(5, Number(args.interval) || 15) * 1000;
  // Writes are synchronous: a signal can stop it at once.
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.on(sig, () => process.exit(0));
  let started = false;
  for (;;) {
    // Every pass, the first one included, is retried on the next interval instead of exiting (under bazaar:up a
    // crash would burn its restarts).
    try {
      const { r, fresh } = await cycle(false);
      if (!started) console.log(`[audit] watching ${date} every ${every / 1000} s · ${r.alerts.length} alerts so far (${fresh.length} new) · Ctrl-C to stop`);
      started = true;
    } catch (e) {
      console.log(`[audit] cycle failed: ${e instanceof Error ? e.message : String(e)} (retrying in ${every / 1000} s)`);
    }
    await new Promise((r) => setTimeout(r, every));
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
