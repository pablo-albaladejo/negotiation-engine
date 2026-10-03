// `pnpm bazaar:news`: watches the Bazaar news (Radio Rastro, the Bulletin, the notice board) and writes a summary
// for the viewer. DISPLAY ONLY: read-only GETs, never a figure or a decision.
// Usage: pnpm bazaar:news [--once] [--poll-ms 30000] [--no-llm] [--no-file-log]
// Sources: the recorder's results/bazaar-live/<date>/stream-public.jsonl (`news.posted`) and GET /api/news
// (at most once every 30 s). Writes news.jsonl (append, dedupe by id) and news-summary.json (atomic) in the same folder.
import { appendFileSync, closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { BazaarClient } from "../shared/client.js";
import { loadBazaarEnv } from "../shared/env.js";
import { claudeOnce } from "../shared/llm.js";
import { buildSummaryFile, itemFromApi, itemFromStreamLine, latestFirst, NewsListSchema, rulesSummary, summaryPrompt, tagMentions, type Mention, type NewsItem, type NewsSummaryFile } from "./news.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIN_POLL_MS = 30_000;
const API_EVERY_MS = 30_000;
const NAMES_EVERY_MS = 3_600_000;

const { values } = parseArgs({
  options: {
    once: { type: "boolean", default: false },
    "poll-ms": { type: "string", default: String(MIN_POLL_MS) },
    "no-llm": { type: "boolean", default: false },
    "no-file-log": { type: "boolean", default: false },
  },
});
const pollMs = Math.max(MIN_POLL_MS, Number(values["poll-ms"]) || MIN_POLL_MS);
const useLlm = !values["no-llm"];

/** Local date YYYY-MM-DD, the recorder's folder convention. */
const localDate = (d = new Date()) => d.toLocaleDateString("sv-SE");
const liveDir = (date: string) => join(ROOT, "results", "bazaar-live", date);

function log(msg: string): void {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  if (values["no-file-log"]) return;
  try {
    const dir = join(ROOT, "results", "logs", localDate());
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, "news.log"), `${line}\n`);
  } catch {
    // logging must never stop the loop
  }
}

const env = loadBazaarEnv({ envFile: join(ROOT, ".env") });
const client = env.key ? new BazaarClient({ url: env.url, key: env.key, ratePerSec: 1, burst: 1, retries: 1 }) : null;
if (!client) log("no BAZAAR_KEY: stream only, no GET /api/news");

// ---------- state ----------
let date = localDate();
const items = new Map<number, NewsItem>();
let streamOffset = 0;
let streamRest = "";
let lastApiAt = 0;
let names: Mention[] = [];
let namesAt = 0;

/** Loads today's news.jsonl so a restart neither re-appends nor re-summarises. */
function loadPersisted(): void {
  items.clear();
  streamOffset = 0;
  streamRest = "";
  const file = join(liveDir(date), "news.jsonl");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const it = JSON.parse(line) as NewsItem;
      if (typeof it.id === "number") items.set(it.id, { ...it, mentions: it.mentions ?? [] });
    } catch {
      // a broken line is skipped
    }
  }
}

/** New `news.posted` lines of the recorder's public stream since the last read. */
function tailStream(): NewsItem[] {
  const file = join(liveDir(date), "stream-public.jsonl");
  if (!existsSync(file)) return [];
  const fd = openSync(file, "r");
  try {
    const size = fstatSync(fd).size;
    if (size < streamOffset) {
      streamOffset = 0;
      streamRest = "";
    }
    if (size === streamOffset) return [];
    const buf = Buffer.alloc(size - streamOffset);
    readSync(fd, buf, 0, buf.length, streamOffset);
    streamOffset = size;
    const text = streamRest + buf.toString("utf8");
    const lines = text.split("\n");
    streamRest = lines.pop() ?? "";
    return lines.map(itemFromStreamLine).filter((x): x is NewsItem => x !== null);
  } finally {
    closeSync(fd);
  }
}

async function fetchApi(): Promise<NewsItem[]> {
  if (!client || Date.now() - lastApiAt < API_EVERY_MS) return [];
  lastApiAt = Date.now();
  const res = await client.request("GET", "/api/news", NewsListSchema);
  return res.news.map(itemFromApi);
}

/** Names to tag (sets, cards, dealers, venues), refreshed hourly; failures keep the last list. */
async function refreshNames(): Promise<void> {
  if (!client || Date.now() - namesAt < NAMES_EVERY_MS) return;
  namesAt = Date.now();
  const next: Mention[] = [];
  try {
    const cat = await client.catalog();
    for (const s of cat.sets) if (s.name) next.push({ name: s.name, kind: "set", ...(s.id ? { id: s.id } : {}) });
    for (const s of cat.sets) for (const c of s.cards) if (c.name) next.push({ name: c.name, kind: "card", id: c.id });
  } catch (e) {
    log(`catalog failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    for (const d of (await client.dealers()).dealers) if (d.name) next.push({ name: d.name, kind: "dealer", id: d.id });
  } catch (e) {
    log(`dealers failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    for (const v of (await client.venues()).venues) if (v.name) next.push({ name: v.name, kind: "venue", ...(v.venue ? { id: v.venue } : {}) });
  } catch (e) {
    log(`venues failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (next.length > 0) {
    // Longer names first so "El Chato" is tried before shorter overlaps.
    names = next.sort((a, b) => b.name.length - a.name.length);
    log(`names for mentions: ${names.length}`);
  }
}

function writeSummary(file: NewsSummaryFile): void {
  const dir = liveDir(date);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "news-summary.json");
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(file, null, 2));
  renameSync(tmp, path);
}

async function cycle(): Promise<void> {
  const today = localDate();
  if (today !== date) {
    date = today;
    loadPersisted();
    log(`new day: ${date}`);
  }
  await refreshNames();
  const incoming: NewsItem[] = [];
  try {
    incoming.push(...tailStream());
  } catch (e) {
    log(`stream read failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    incoming.push(...(await fetchApi()));
  } catch (e) {
    log(`GET /api/news failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  const fresh: NewsItem[] = [];
  for (const it of incoming) {
    if (items.has(it.id)) continue;
    const tagged = { ...it, mentions: tagMentions(`${it.headline} ${it.body}`, names) };
    items.set(it.id, tagged);
    fresh.push(tagged);
  }
  const summaryPath = join(liveDir(date), "news-summary.json");
  if (fresh.length === 0 && existsSync(summaryPath)) return;
  if (fresh.length > 0) {
    mkdirSync(liveDir(date), { recursive: true });
    appendFileSync(join(liveDir(date), "news.jsonl"), latestFirst(fresh).reverse().map((i) => JSON.stringify(i)).join("\n") + "\n");
    for (const i of latestFirst(fresh)) log(`news #${i.id} [${i.source}] tick ${i.tick ?? "?"}: ${i.headline}${i.mentions.length ? ` {${i.mentions.map((m) => m.name).join(", ")}}` : ""}`);
  }
  const all = latestFirst(items.values());
  let summary: NewsSummaryFile["summary"] = { text: rulesSummary(all), by: "rules", at: new Date().toISOString() };
  if (useLlm && all.length > 0) {
    const t0 = Date.now();
    const text = await claudeOnce(summaryPrompt(all));
    if (text) summary = { text: text.slice(0, 1200), by: "llm", at: new Date().toISOString() };
    log(`summary by ${summary.by} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  writeSummary(buildSummaryFile(all, summary));
  log(`news-summary.json: ${all.length} items (${fresh.length} new)`);
}

process.on("unhandledRejection", (e) => log(`unhandled: ${e instanceof Error ? e.message : String(e)}`));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

loadPersisted();
log(`news watcher: ${date}, ${items.size} known items, poll ${pollMs} ms, llm ${useLlm ? "on" : "off"}${values.once ? ", once" : ""}`);
for (;;) {
  try {
    await cycle();
  } catch (e) {
    log(`cycle failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (values.once) break;
  await new Promise((r) => setTimeout(r, pollMs));
}
