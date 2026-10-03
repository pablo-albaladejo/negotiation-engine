#!/usr/bin/env node
// Read-only dump of the Bazaar state to reconstruct the day: current snapshot, everything of ours
// (threads with messages, finished duels, offers, assets), each card's history and the feed.
// Saves to results/bazaar-live/<date>/dump-HHMM/ one JSON per source, timeline.jsonl (one event per line,
// sorted by tick) and summary.md. Uso: set -a && . ./.env && . ./.env.broker && set +a && pnpm bazaar:dump
// Limits imposed by the API (measured on 3 Oct): the feed returns at most 500 events and does not paginate; the
// history of other teams' cards says "a team" instead of the team. Never prints keys. GET only.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL = process.env.BAZAAR_URL;
const KEY = process.env.BAZAAR_KEY;
const BROKER = process.env.BAZAAR_BROKER_KEY ?? process.env.BROKER_KEY;
if (!URL || !KEY) {
  console.error("Missing BAZAAR_URL / BAZAAR_KEY (load .env)");
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requests = 0;
async function get(path, headers = { "X-Team-Key": KEY }) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(220); // < 5 req/s
    requests++;
    try {
      const r = await fetch(URL + path, { headers });
      if (r.status === 429 || r.status === 503) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      const text = await r.text();
      let body;
      try { body = JSON.parse(text); } catch { body = text.slice(0, 500); }
      return { status: r.status, body };
    } catch (e) {
      if (attempt === 4) return { status: `ERR ${e?.cause?.code ?? e}`, body: null };
    }
  }
  return { status: 429, body: null };
}

const now = new Date();
const day = now.toLocaleDateString("sv-SE");
const hhmm = now.toTimeString().slice(0, 5).replace(":", "");
const dir = join(process.cwd(), "results", "bazaar-live", day, `dump-${hhmm}`);
mkdirSync(dir, { recursive: true });
const save = (name, data) => writeFileSync(join(dir, name), JSON.stringify(data, null, 1));
const log = (s) => console.log(s);

// 1. Current snapshot of all read endpoints.
const snapshot = {};
for (const p of [
  "/api/clock", "/api/schedule", "/api/levels", "/api/catalog", "/api/dealers", "/api/leaderboard",
  "/api/venues", "/api/venues/rastro/offers", "/api/me", "/api/me/offers", "/api/duels",
]) {
  snapshot[p] = await get(p);
  log(`${String(snapshot[p].status).padEnd(4)} ${p}`);
}
const me = snapshot["/api/me"].body ?? {};
const venues = snapshot["/api/venues"].body?.venues ?? [];
for (const v of venues) {
  if (v.venue && v.venue !== "rastro") snapshot[`/api/venues/${v.venue}/offers`] = await get(`/api/venues/${v.venue}/offers`);
}
if (BROKER) snapshot["/api/broker/book"] = await get("/api/broker/book", { "X-Broker-Key": BROKER });
save("snapshot.json", snapshot);

// 2. Ours: threads with all their messages and finished duels.
const threadList = (await get("/api/me/threads")).body?.threads ?? [];
const threads = [];
for (const t of threadList) threads.push(t.messages ? t : ((await get(`/api/threads/${t.id}`)).body ?? t));
save("threads.json", threads);
const duelsDone = (await get("/api/duels?done=true")).body?.duels ?? [];
const duelsLive = snapshot["/api/duels"].body?.duels ?? [];
save("duels.json", { done: duelsDone, live: duelsLive });
log(`threads ${threads.length} · finished duels ${duelsDone.length} · in progress ${duelsLive.length}`);

// 3. Feed: the most the API gives (500 events, no pagination).
const feed = (await get("/api/feed?limit=500")).body?.events ?? [];
save("feed.json", feed);
const feedTicks = feed.map((e) => e.tick).filter(Number.isFinite);
const feedFrom = feedTicks.length ? Math.min(...feedTicks) : null;
log(`feed ${feed.length} events · ticks ${feedFrom ?? "-"}–${feedTicks.length ? Math.max(...feedTicks) : "-"}`);

// 4. History of all cards: sequential ids from 1; stops after 40 consecutive nonexistent ids.
const cards = [];
let misses = 0;
for (let id = 1; misses < 40; id++) {
  const r = await get(`/api/cards/${id}`);
  if (r.status === 200 && r.body?.id != null) {
    cards.push(r.body);
    misses = 0;
  } else misses++;
  if (id % 100 === 0) log(`cards: id ${id} · ${cards.length} found`);
}
save("cards.json", cards);
log(`cards ${cards.length}`);

// 5. Timeline: one event per line, sorted by tick.
const team = me.id;
const timeline = [];
for (const c of cards) {
  for (const h of c.history ?? []) {
    timeline.push({ tick: h.tick, src: "card", type: "transfer", card: c.id, ref: c.ref, rarity: c.rarity, from: h.from, to: h.to, why: h.why });
  }
}
for (const t of threads) {
  timeline.push({ tick: t.created_tick, src: "thread", type: "thread.opened", thread: t.id, with: t.with, topic: t.topic });
  for (const m of t.messages ?? []) {
    const o = m.offer;
    timeline.push({ tick: m.tick, src: "thread", type: "message", thread: t.id, sender: m.sender, text: m.text, offer: o ? { id: o.id, maker: o.maker, give: o.give?.cash, want: o.want?.cash, status: o.status } : undefined });
  }
  timeline.push({ tick: t.messages?.at(-1)?.tick ?? t.created_tick, src: "thread", type: "thread.end", thread: t.id, status: t.status, reason: t.closed_reason });
}
for (const d of duelsDone) {
  for (const m of d.messages ?? []) timeline.push({ tick: m.tick, src: "duel", type: "message", duel: d.duel, item: d.item, role: d.role, from: m.from, price: m.price, days: m.days, text: m.text });
  const last = d.messages?.at(-1)?.tick ?? d.deadline_tick;
  timeline.push({ tick: last, src: "duel", type: "duel.result", duel: d.duel, item: d.item, role: d.role, status: d.status, price: d.price, limit: d.your_limit, result: d.result });
}
// From the feed only what does not come from other sources (offers, other teams' settlements, announcements, clock…).
for (const e of feed) timeline.push({ tick: e.tick, src: "feed", type: e.type, actor: e.actor, id: e.id, payload: e.payload });
timeline.sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0));
writeFileSync(join(dir, "timeline.jsonl"), timeline.map((e) => JSON.stringify(e)).join("\n") + "\n");

// 6. Readable summary.
const clock = snapshot["/api/clock"].body ?? {};
const count = (xs, k) => xs.reduce((m, x) => ((m[k(x)] = (m[k(x)] ?? 0) + 1), m), {});
const why = count(timeline.filter((e) => e.type === "transfer"), (e) => e.why?.replace(/ from .*/, " from …").replace(/#\d+/, "#…") ?? "?");
const ours = timeline.filter((e) => e.type === "transfer" && (e.from === team || e.to === team));
const duelBy = count(duelsDone, (d) => `${d.role}:${d.status}`);
const lb = snapshot["/api/leaderboard"].body?.teams ?? [];
const L = [];
L.push(`# Volcado del Bazaar · ${day} ${hhmm.slice(0, 2)}:${hhmm.slice(2)}`, "");
L.push(`Tick ${clock.tick} · ${clock.round_name} · puertas ${clock.doors} · ${clock.paused ? "en pausa" : "en marcha"} · ${requests} peticiones`, "");
L.push("## Nuestro equipo", "");
L.push(`- ${me.name} (${me.id}): caja ${me.cash}, nivel ${me.level}, ${me.assets?.length ?? 0} activos, valor de colección ${me.collection_value}, score ${JSON.stringify(me.score)}`);
L.push(`- Hilos: ${threads.length} (${Object.entries(count(threads, (t) => t.status)).map(([k, v]) => `${k} ${v}`).join(", ")})`);
L.push(`- Duelos terminados: ${duelsDone.length} (${Object.entries(duelBy).map(([k, v]) => `${k} ${v}`).join(", ")})`);
L.push(`- Traspasos de cartas nuestras: ${ours.length}`, "");
L.push("## Mercado", "");
L.push(`- Activos con historial (cartas y sobres): ${cards.length}; traspasos: ${timeline.filter((e) => e.type === "transfer").length}`);
for (const [k, v] of Object.entries(why).sort((a, b) => b[1] - a[1])) L.push(`  - ${k}: ${v}`);
L.push(`- Feed: ${feed.length} eventos desde el tick ${feedFrom} (lo anterior ya no lo da la API)`);
L.push(`- Venues: ${venues.map((v) => v.venue).join(", ")}`, "");
L.push("## Clasificación (foto actual)", "");
L.push("| # | Equipo | Score | Deals | Álbum | Páginas |", "|---|---|---|---|---|---|");
for (const t of lb) L.push(`| ${t.rank} | ${t.name}${t.team === team ? " ←" : ""} | ${t.score} | ${t.deals} | ${t.album_filled}/${t.album_slots} | ${t.pages_complete} |`);
L.push("", "## Ficheros", "", "snapshot.json · threads.json · duels.json · feed.json · cards.json · timeline.jsonl (ordenado por tick)");
writeFileSync(join(dir, "summary.md"), L.join("\n") + "\n");
log(`saved ${dir} (${timeline.length} events in timeline.jsonl)`);
