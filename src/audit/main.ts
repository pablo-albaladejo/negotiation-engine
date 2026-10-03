import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import type { Catalog, Me } from "../shared/schemas.js";
import { buildValueModel, heldAssets, type ValueModel } from "../trades/trades.js";
import { albumCopyLost, bookGaps, cashFloor, churn, DETECTORS, doubleAct, dupBuy, planView, playView, repeatFailure, roundTripLoss, type Alert, type Detector, type TickView } from "./detectors.js";
import { baselineFromCounts, baselineFromMe, replay, type Baseline, type Ledger } from "./ledger.js";
import { daySnapshots, latestCatalog, parseDecision, parseJson, parsePlanLine, parseStreamLine, PlayLogParser, readValuesFile, Tail, type DecisionNote, type PlanLine, type Snapshot, type StreamEvent } from "./sources.js";

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
const decisions: DecisionNote[] = [];
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
    seenTick("plan", p.tick);
  }
  for (const line of tails["play.log"].read()) play.push(line);
  for (const t of play.ticks.keys()) seenTick("play.log", t);
  for (const line of tails.decisions.read()) {
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
  if (snap?.me) return baselineFromMe(snap.me, snap.tick, snap.file.slice(root.length + 1));
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
  const requirements: Record<Detector, { ok: boolean; why: string }> = {
    "dup-buy": need("stream-team", "baseline", "values"),
    "round-trip-loss": need("stream-team"),
    "below-best-bid": need("stream-team", "stream-public"),
    "above-best-ask": need("stream-team", "stream-public"),
    "album-copy-lost": need("stream-team", "baseline", "catalog", "values"),
    "cash-floor": (() => {
      const c = coord();
      return health("plan").ok ? c : { ...c, why: `${c.why}; max-spend part needs plan.jsonl` };
    })(),
    "double-act": coord(),
    "repeat-failure": coord(),
    churn: need("stream-team"),
    "stale-source": { ok: true, why: "file ticks against the clock" },
  };

  const stale: Alert[] = (["stream-team", "stream-public", "plan", "play.log", "score"] as const).flatMap((s) => {
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

  const alerts = [
    ...dupBuy(ledger, model),
    ...roundTripLoss(ledger),
    ...bookGaps(ledger),
    ...albumCopyLost(ledger, model),
    ...cashFloor(views, ledger),
    ...doubleAct(views, ledger),
    ...repeatFailure(views),
    ...churn(ledger),
    ...stale,
  ].sort((a, b) => a.tick - b.tick);

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
    baseline: base ? { source: base.source, tick: base.tick, cards: base.cards.length } : null,
    sources: Object.fromEntries((Object.keys(tails) as SourceName[]).map((s) => [s, { file: tails[s].file.slice(root.length + 1), lastTick: lastTick[s] ?? null, stale: lastTick[s] === undefined ? null : clock - lastTick[s]! > STALE_TICKS }])),
    detectors,
  };
  return { alerts, status, ledger };
}

const round = (x: number): number => Math.round(x * 10) / 10;

// ---------------------------------------------------------------- output

const written = new Set<string>();
if (existsSync(auditFile)) {
  for (const line of readFileSync(auditFile, "utf8").split("\n")) {
    const k = (parseJson(line) as { key?: unknown } | undefined)?.key;
    if (typeof k === "string") written.add(k);
  }
}

const fmt = (a: Alert): string => `[audit] ${a.severity.toUpperCase().padEnd(6)} ${a.detector.padEnd(15)} t${a.tick}${a.lossP !== undefined ? ` −${a.lossP} P` : ""} · ${a.summary}`;

/** Appends the alerts not yet in audit.jsonl; prints every alert (`printAll`) or only the new ones. */
function emit(alerts: Alert[], status: Record<string, unknown>, printAll: boolean): Alert[] {
  mkdirSync(outDir, { recursive: true });
  const fresh = alerts.filter((a) => !written.has(a.key));
  for (const a of fresh) {
    appendFileSync(auditFile, `${JSON.stringify(a)}\n`);
    written.add(a.key);
  }
  for (const a of printAll ? alerts : fresh) console.log(fmt(a));
  writeFileSync(statusFile, `${JSON.stringify(status, null, 2)}\n`);
  return fresh;
}

function report(alerts: Alert[], status: { detectors: Record<string, DetectorStatus>; team: string; clock: number; baseline: unknown }, ledger: Ledger): void {
  console.log(`\n== audit ${date} · team ${status.team} · clock tick ${status.clock} · ${ledger.trades.length} of our trades · ${ledger.lots.length} cards in the book ==`);
  let total = 0;
  for (const [d, s] of Object.entries(status.detectors)) {
    total += s.lossP;
    console.log(`  ${d.padEnd(15)} ${s.status.padEnd(10)} ${String(s.alerts).padStart(3)} alerts · ${String(s.lossP).padStart(6)} P · ${s.reason}`);
  }
  console.log(`  total: ${alerts.length} alerts · ${round(total)} P estimated loss`);
  console.log(`  written: ${auditFile.slice(root.length + 1)} · ${statusFile.slice(root.length + 1)}`);
}

async function main(): Promise<void> {
  await refreshMe();
  readAll();
  const first = evaluate();
  const fresh = emit(first.alerts, first.status, !args.watch);
  if (!args.watch) {
    report(first.alerts, first.status as never, first.ledger);
    return;
  }
  console.log(`[audit] watching ${date} every ${args.interval} s · ${first.alerts.length} alerts so far (${fresh.length} new) · Ctrl-C to stop`);
  const every = Math.max(5, Number(args.interval) || 15) * 1000;
  // Writes are synchronous: a signal can stop it at once.
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.on(sig, () => process.exit(0));
  for (;;) {
    await new Promise((r) => setTimeout(r, every));
    try {
      await refreshMe();
      readAll();
      const r = evaluate();
      emit(r.alerts, r.status, false);
    } catch (e) {
      console.log(`[audit] cycle failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
