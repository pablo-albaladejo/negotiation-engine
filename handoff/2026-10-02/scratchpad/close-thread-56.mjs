// Closes ONLY thread 56 (sell MAL-02 to abuela). Never opens threads. Key from env, never printed.
const URL = process.env.BAZAAR_URL, KEY = process.env.BAZAAR_KEY;
if (!URL || !KEY) { console.log("missing env"); process.exit(1); }
const THREAD = 56, OPENING = 13, OUR_VALUE_FLOOR = 3;
const LADDER = [18, 16, 15, 14];
const MAX_HOLDS = 3;
const TEXTS = {
  18: "Thank you, Abuela, you are very kind. Could we meet at 18 P? It would make my evening.",
  16: "You drive a gentle bargain, Abuela. How about 16 P for this one?",
  15: "I really appreciate your patience. 15 P and it is yours, with a smile.",
  14: "Let's make it easy for both of us, Abuela: 14 P and we have a deal.",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(method, path, body) {
  const res = await fetch(URL + path, { method, headers: { "X-Team-Key": KEY, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, json };
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
function herOffer(t) { return (t.standing_offers || []).find((o) => o.maker === "abuela" && o.status === "open"); }
async function waitNextTick(prev) {
  for (;;) { const c = (await api("GET", "/api/clock")).json; if (c.tick > prev) return c.tick; await sleep(Math.max(1000, Math.min(5000, (c.next_tick_in ?? 5) * 1000))); }
}
let step = 0, holds = 0, lastSent = 21;
let tick = (await api("GET", "/api/clock")).json.tick;
log("start · tick", tick, "· thread", THREAD);
for (let round = 0; round < 12; round++) {
  const { json: t } = await api("GET", `/api/threads/${THREAD}`);
  if (t.status !== "open") { log("thread status:", t.status, t.closed_reason || ""); break; }
  const o = herOffer(t); const her = o?.give?.cash ?? null;
  log(`tick ${tick} · her offer ${her ?? "-"}${o?.final ? " FINAL" : ""} · our last ${lastSent}`);
  const next = step < LADDER.length ? LADDER[step] : null;
  let accept = false, why = "";
  if (o && her !== null) {
    if (o.final && her >= OUR_VALUE_FLOOR) { accept = true; why = "final offer"; }
    else if (her > OPENING && (her >= lastSent || (next !== null && her >= next))) { accept = true; why = "above opening and met our counter"; }
    else if (next === null && holds >= MAX_HOLDS && her >= OUR_VALUE_FLOOR) { accept = true; why = "no movement after holds"; }
  }
  if (accept) {
    const r = await api("POST", `/api/offers/${o.id}/accept`, {});
    log(`ACCEPT offer ${o.id} at ${her} P (${why}) → HTTP ${r.status}`, r.json?.code || r.json?.status || "");
    if (r.status < 300) { tick = await waitNextTick(tick); const { json: t2 } = await api("GET", `/api/threads/${THREAD}`); log("after settle · thread status:", t2.status); break; }
  } else if (next !== null) {
    const r = await api("POST", `/api/threads/${THREAD}/messages`, { text: TEXTS[next], price: next });
    log(`counter ${next} P → HTTP ${r.status}`, r.json?.code || "");
    if (r.status < 300) { lastSent = next; step++; }
  } else {
    holds++;
    const r = await api("POST", `/api/threads/${THREAD}/messages`, { text: "No rush, Abuela. My offer stands whenever you are ready." });
    log(`hold ${holds}/${MAX_HOLDS} (text only) → HTTP ${r.status}`, r.json?.code || "");
  }
  tick = await waitNextTick(tick);
}
log("done");
