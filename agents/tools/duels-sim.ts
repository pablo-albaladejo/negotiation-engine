// Duel latency simulation (no real API): a local mock of the duel endpoints with real ticks, 4 concurrent duels whose
// rivals replay real offers from a past session, and the real play code (DuelsRoute fast sub-loop + BazaarClient token
// bucket) sharing the bucket with a load generator that stands in for play's other routes.
// Measures, per rival offer, how long after its tick started we SAW it (GET /api/duels) and how long until our POST.
// Usage: pnpm exec tsx agents/tools/duels-sim.ts [--tick-seconds 15] [--waves 2] [--load 50] [--source results/duels/done-2026-10-04.json]
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { BazaarClient } from "../../src/shared/client.js";
import { DuelsRoute } from "../../src/coordinator/routes.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { values } = parseArgs({
  options: {
    "tick-seconds": { type: "string", default: "15" },
    waves: { type: "string", default: "2" },
    concurrent: { type: "string", default: "4" },
    "duel-ticks": { type: "string", default: "12" },
    load: { type: "string", default: "50" },
    "load-chains": { type: "string", default: "3" },
    session: { type: "string", default: "4" },
    source: { type: "string", default: "results/duels/done-2026-10-04.json" },
  },
});
const TICK_MS = Number(values["tick-seconds"]) * 1000;
const WAVES = Number(values.waves);
const CONCURRENT = Number(values.concurrent);
const DUEL_TICKS = Number(values["duel-ticks"]);
const LOAD = Number(values.load);
const LOAD_CHAINS = Number(values["load-chains"]);

interface Msg { tick: number; from: string; text: string; price: number; days?: number }
interface Src { duel: number; role: string; item: string; issues: string[]; your_days_weight?: unknown; days_meaning?: string; your_limit: number; limit_meaning?: string; rival: string; decay_per_round: number; status: string; price?: number | null; days?: number | null; messages: Msg[] }
interface SimDuel { id: number; src: Src; start: number; deadline: number; script: Map<number, Msg>; messages: Msg[]; status: "live" | "deal" | "no_deal"; price?: number; days?: number; lastPost: Map<string, number> }

// Duels with a talking rival, replayed by relative tick.
const pool = (JSON.parse(readFileSync(join(ROOT, values.source), "utf8")).duels as Src[]).filter((d) => d.session === Number(values.session) && d.messages.some((m) => m.from !== "you"));
if (pool.length < WAVES * CONCURRENT) throw new Error(`only ${pool.length} source duels with a talking rival`);

const T0 = 5000;
let tick = T0;
const tickStart = new Map<number, number>();
const duels: SimDuel[] = [];
for (let w = 0; w < WAVES; w++)
  for (let k = 0; k < CONCURRENT; k++) {
    const src = pool[(w * CONCURRENT + k) * Math.floor(pool.length / (WAVES * CONCURRENT))]!;
    const first = Math.min(...src.messages.map((m) => m.tick));
    const start = T0 + 1 + w * (DUEL_TICKS + 1);
    const script = new Map<number, Msg>();
    for (const m of src.messages) if (m.from !== "you") script.set(start + (m.tick - first), { ...m, tick: start + (m.tick - first) });
    duels.push({ id: 900000 + w * 10 + k, src, start, deadline: start + DUEL_TICKS, script, messages: [], status: "live", lastPost: new Map() });
  }
const lastTick = Math.max(...duels.map((d) => d.deadline)) + 1;

// Measurements.
const seen = new Map<string, number>(); // `${duel}:${tick}` → ms after tick start when GET /api/duels first showed it
const acted = new Map<string, number>(); // `${duel}:${tick}` → ms after tick start of our first POST on that duel
let requests = 0, rateLimited = 0, rejected = 0, duelGets = 0;
const window: number[] = [];

const rivalOf = (d: SimDuel) => [...d.messages].reverse().find((m) => m.from !== "you");
const oursOf = (d: SimDuel) => [...d.messages].reverse().find((m) => m.from === "you");
// The rival accepts our standing offer when it is at least as good for them as the real deal they closed.
function rivalAccepts(d: SimDuel): boolean {
  const ours = oursOf(d);
  if (!ours || d.src.status !== "deal" || d.src.price == null) return false;
  if ((ours.days ?? 0) !== (d.src.days ?? 0)) return false;
  return d.src.role === "seller" ? ours.price <= d.src.price : ours.price >= d.src.price;
}
function view(d: SimDuel) {
  const r = rivalOf(d), o = oursOf(d);
  const off = (m?: Msg) => (m ? { price: m.price, days: m.days ?? 0, tick: m.tick } : null);
  return { duel: d.id, session: 99, status: d.status, role: d.src.role, item: d.src.item, issues: d.src.issues, your_days_weight: d.src.your_days_weight, days_meaning: d.src.days_meaning, your_limit: d.src.your_limit, limit_meaning: d.src.limit_meaning, rival: d.src.rival, deadline_tick: d.deadline, decay_per_round: d.src.decay_per_round, rounds: d.messages.filter((m) => m.from !== "you").length, your_offer: off(o), rival_offer: off(r), messages: d.messages, price: d.price ?? null, days: d.days ?? null };
}
function advance() {
  tick += 1;
  tickStart.set(tick, Date.now());
  for (const d of duels) {
    if (d.status !== "live" || tick < d.start) continue;
    if (tick >= d.deadline) { d.status = "no_deal"; continue; }
    if (rivalAccepts(d)) { const o = oursOf(d)!; d.status = "deal"; d.price = o.price; d.days = o.days; continue; }
    const m = d.script.get(tick);
    if (m) d.messages.push(m);
  }
}

const send = (res: ServerResponse, code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const readBody = (req: IncomingMessage) => new Promise<string>((r) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => r(s)); });
const server = createServer(async (req, res) => {
  const now = Date.now();
  requests += 1;
  window.push(now);
  while (window.length && window[0]! < now - 1000) window.shift();
  if (window.length > 5) { rateLimited += 1; return send(res, 429, { error: "rate_limited", detail: "5 req/s" }); }
  const url = new URL(req.url ?? "/", "http://x");
  const started = tickStart.get(tick) ?? now;
  if (url.pathname === "/api/clock") return send(res, 200, { tick, tick_seconds: TICK_MS / 1000, paused: false, doors: "open", next_tick_in: Math.max(0, (started + TICK_MS - now) / 1000), limits: { accepts_per_team_per_tick: 1, messages_per_side_per_tick: 1 } });
  if (url.pathname === "/api/duels") {
    duelGets += 1;
    const live = duels.filter((d) => d.status === "live" && tick >= d.start);
    for (const d of live) for (const m of d.messages) if (m.from !== "you" && !seen.has(`${d.id}:${m.tick}`)) seen.set(`${d.id}:${m.tick}`, now - (tickStart.get(m.tick) ?? now));
    return send(res, 200, { duels: live.map(view) });
  }
  const m = url.pathname.match(/^\/api\/duels\/(\d+)\/(messages|accept)$/);
  if (m && req.method === "POST") {
    const d = duels.find((x) => x.id === Number(m[1]));
    const body = await readBody(req);
    if (!d || d.status !== "live") { rejected += 1; return send(res, 409, { error: "duel_closed" }); }
    if (d.lastPost.get(m[2]!) === tick) { rejected += 1; return send(res, 429, { error: "one_per_tick" }); }
    d.lastPost.set(m[2]!, tick);
    const r = rivalOf(d);
    if (r && !acted.has(`${d.id}:${r.tick}`) && r.tick === tick) acted.set(`${d.id}:${r.tick}`, now - started);
    if (m[2] === "accept") {
      if (!r) { rejected += 1; return send(res, 409, { error: "no_offer" }); }
      d.status = "deal"; d.price = r.price; d.days = r.days ?? 0;
      return send(res, 200, { ok: true });
    }
    const b = JSON.parse(body || "{}") as { text?: string; price?: number; days?: number; offer?: { price?: number; days?: number } };
    d.messages.push({ tick, from: "you", text: b.text ?? "", price: b.offer?.price ?? b.price ?? 0, days: b.offer?.days ?? b.days ?? 0 });
    return send(res, 200, { ok: true });
  }
  send(res, 200, {});
});

await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const port = (server.address() as { port: number }).port;
const client = new BazaarClient({ url: `http://127.0.0.1:${port}`, key: "sim" });
const route = new DuelsRoute(client, false);
const logLines: string[] = [];
const origLog = console.log, origErr = console.error;
console.log = (...a: unknown[]) => void logLines.push(a.join(" "));
console.error = (...a: unknown[]) => void logLines.push(`ERR ${a.join(" ")}`);

// Load generator: play's other routes, LOAD GETs per tick in LOAD_CHAINS parallel chains on the same client/bucket.
let stop = false;
async function loadChain(n: number) {
  let lastSeen = -1;
  while (!stop) {
    if (tick === lastSeen) { await new Promise((r) => setTimeout(r, 100)); continue; }
    lastSeen = tick;
    for (let i = 0; i < n && !stop; i++) await client.raw("GET", "/api/other").catch(() => undefined);
  }
}

advance();
const timer = setInterval(advance, TICK_MS);
void route.runFast(false);
for (let c = 0; c < LOAD_CHAINS; c++) void loadChain(Math.ceil(LOAD / LOAD_CHAINS));
origLog(`sim: ${duels.length} duels (${WAVES} waves × ${CONCURRENT}), ${DUEL_TICKS} ticks each, tick ${TICK_MS / 1000} s, load ${LOAD} GET/tick, ~${Math.round(((lastTick - T0) * TICK_MS) / 60000)} min`);
await new Promise<void>((r) => { const t = setInterval(() => { if (tick > lastTick) { clearInterval(t); r(); } }, 500); });
stop = true;
clearInterval(timer);
console.log = origLog;
console.error = origErr;

const rivalOffers = duels.flatMap((d) => d.messages.filter((m) => m.from !== "you").map((m) => `${d.id}:${m.tick}`));
const seenMs = rivalOffers.map((k) => seen.get(k)).filter((v): v is number => v !== undefined);
const actMs = rivalOffers.map((k) => acted.get(k)).filter((v): v is number => v !== undefined);
const pct = (xs: number[], p: number) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))]! : NaN);
const missedSeen = rivalOffers.filter((k) => seen.get(k) === undefined || seen.get(k)! >= TICK_MS);
const steps = logLines.map((l) => l.match(/\[duels\] \[fast\] tick (\d+) · (\d+) live · (\d+) acting · (\d+) ms/)).filter(Boolean).map((m) => ({ tick: Number(m![1]), ms: Number(m![4]) }));
const gaps = steps.slice(1).map((s, i) => s.tick - steps[i]!.tick);
const summary = {
  duels: duels.length, deals: duels.filter((d) => d.status === "deal").length, tickSeconds: TICK_MS / 1000, load: LOAD,
  rivalOffers: rivalOffers.length,
  seenMs: { p50: pct(seenMs, 50), p90: pct(seenMs, 90), max: Math.max(...seenMs) },
  actMs: { n: actMs.length, p50: pct(actMs, 50), p90: pct(actMs, 90), max: Math.max(...actMs) },
  offersNotSeenWithinTick: missedSeen.length,
  stepMs: { p50: pct(steps.map((s) => s.ms), 50), p90: pct(steps.map((s) => s.ms), 90), max: Math.max(...steps.map((s) => s.ms)) },
  tickGaps: Object.fromEntries([...new Set(gaps)].map((g) => [g, gaps.filter((x) => x === g).length])),
  requests, rateLimited429: rateLimited, rejected, duelGets,
  errors: logLines.filter((l) => l.startsWith("ERR") || / error/.test(l)).length,
};
const outDir = join(ROOT, "results", "duels");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(join(outDir, `sim-${stamp}.json`), JSON.stringify({ summary, duels: duels.map(view) }, null, 2));
writeFileSync(join(outDir, `sim-${stamp}.log`), logLines.join("\n"));
console.log(JSON.stringify(summary, null, 2));
console.log(`files: results/duels/sim-${stamp}.{json,log}`);
server.close();
process.exit(0);
