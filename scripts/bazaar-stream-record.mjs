#!/usr/bin/env node
// Records the live Bazaar stream (/api/events/stream, SSE) so the whole day can be reconstructed:
// the feed only returns the last 500 events and does not paginate. Read-only; never prints keys.
// Uso: set -a && . ./.env && set +a && pnpm bazaar:record [--scope team,public] [--quiet]
// Each event goes as one line to results/bazaar-live/<date>/stream-<scope>.jsonl:
// {recv, scope, event, id?, data}. If the stream drops it reconnects with growing backoff (and Last-Event-ID if
// the server sends ids); on 429/503 (limit: 6 streams per key) it meanwhile reads /api/feed and records
// the events it had not seen yet in feed-poll.jsonl.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const URL = process.env.BAZAAR_URL;
const KEY = process.env.BAZAAR_KEY;
if (!URL || !KEY) {
  console.error("Missing BAZAAR_URL / BAZAAR_KEY (load .env)");
  process.exit(1);
}
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const scopes = (arg("--scope") ?? "team,public").split(",").map((s) => s.trim()).filter(Boolean);
const quiet = process.argv.includes("--quiet");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function append(name, record) {
  const dir = join(process.cwd(), "results", "bazaar-live", new Date().toLocaleDateString("sv-SE"));
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, name), JSON.stringify(record) + "\n");
}
const brief = (data) => {
  if (!data || typeof data !== "object") return String(data ?? "").slice(0, 120);
  const d = data.payload ?? data;
  return `${data.type ?? ""} ${data.actor ?? ""} tick ${data.tick ?? "?"} ${JSON.stringify(d).slice(0, 120)}`;
};

// Fallback on 429/503: the feed, without repeating already-recorded ids.
const seenFeed = new Set();
async function pollFeed() {
  try {
    const r = await fetch(`${URL}/api/feed?limit=500`, { headers: { "X-Team-Key": KEY } });
    if (!r.ok) return;
    const events = (await r.json()).events ?? [];
    let n = 0;
    for (const e of events) {
      if (seenFeed.has(e.id)) continue;
      seenFeed.add(e.id);
      append("feed-poll.jsonl", { recv: new Date().toISOString(), ...e });
      n++;
    }
    if (n) console.log(`[feed] ${n} new events`);
  } catch {
    // network down: retried on the next cycle
  }
}

async function record(scope) {
  let lastId;
  let backoff = 1000;
  for (;;) {
    let fallback = false;
    try {
      const headers = { "X-Team-Key": KEY, accept: "text/event-stream" };
      if (lastId) headers["Last-Event-ID"] = lastId;
      const r = await fetch(`${URL}/api/events/stream?scope=${encodeURIComponent(scope)}`, { headers });
      if (!r.ok || !r.body) {
        fallback = r.status === 429 || r.status === 503;
        throw new Error(`HTTP ${r.status}`);
      }
      console.log(`[${scope}] connected`);
      backoff = 1000;
      const decoder = new TextDecoder();
      let buf = "";
      let ev = { event: "message", data: [] };
      for await (const chunk of r.body) {
        buf += decoder.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).replace(/\r$/, "");
          buf = buf.slice(nl + 1);
          if (line === "") {
            // end of event
            if (ev.data.length) {
              const raw = ev.data.join("\n");
              let data;
              try { data = JSON.parse(raw); } catch { data = raw; }
              append(`stream-${scope}.jsonl`, { recv: new Date().toISOString(), scope, event: ev.event, ...(ev.id ? { id: ev.id } : {}), data });
              if (data && typeof data === "object" && data.id != null) seenFeed.add(data.id);
              if (!quiet) console.log(`[${scope}] ${ev.event} ${brief(data)}`);
            }
            ev = { event: "message", data: [] };
          } else if (line.startsWith(":")) {
            // comment (keep-alive)
          } else {
            const i = line.indexOf(":");
            const field = i < 0 ? line : line.slice(0, i);
            const value = i < 0 ? "" : line.slice(i + 1).replace(/^ /, "");
            if (field === "event") ev.event = value;
            else if (field === "data") ev.data.push(value);
            else if (field === "id") ev.id = lastId = value;
          }
        }
      }
      throw new Error("stream closed");
    } catch (e) {
      console.log(`[${scope}] ${e?.message ?? e} · retrying in ${Math.round(backoff / 1000)} s${fallback ? " (meanwhile, /api/feed)" : ""}`);
      append(`stream-${scope}.jsonl`, { recv: new Date().toISOString(), scope, event: "_disconnected", data: { error: String(e?.message ?? e) } });
      if (fallback) await pollFeed();
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 60_000);
    }
  }
}

console.log(`recording ${scopes.join(", ")} → results/bazaar-live/<date>/stream-<scope>.jsonl (Ctrl+C to stop)`);
await Promise.all(scopes.map(record));
