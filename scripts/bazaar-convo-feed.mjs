// Read-only: prints every new message in our Bazaar threads (dealers and teams). Key from env, never printed.
const URL = process.env.BAZAAR_URL, KEY = process.env.BAZAAR_KEY;
const seen = new Map(); // threadId -> count of messages printed
const lastStatus = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path) {
  try { const r = await fetch(URL + path, { headers: { "X-Team-Key": KEY } }); return await r.json(); } catch { return null; }
}
const short = (s) => String(s ?? "").replace(/\s+/g, " ").slice(0, 260);
// prime: mark old threads as seen so we only stream new activity
const first = await get("/api/me/threads");
for (const t of first?.threads ?? []) { seen.set(t.id, (t.messages ?? []).length); lastStatus.set(t.id, t.status); }
console.log(`feed started · ${seen.size} existing threads skipped`);
for (;;) {
  const list = await get("/api/me/threads");
  for (const s of list?.threads ?? []) {
    const prevCount = seen.get(s.id);
    const needDetail = prevCount === undefined || s.status === "open" || lastStatus.get(s.id) !== s.status || (s.messages ?? []).length !== prevCount;
    if (!needDetail) continue;
    const t = (s.messages ? s : await get(`/api/threads/${s.id}`)) ?? s;
    const msgs = t.messages ?? [];
    const from = prevCount ?? 0;
    if (prevCount === undefined) console.log(`── thread ${t.id} opened with ${t.with ?? "?"} · topic ${JSON.stringify(t.topic ?? {})}`);
    for (const m of msgs.slice(from)) {
      const offer = (t.standing_offers ?? []).filter((o) => o.status === "open" && o.maker === m.sender).at(-1);
      const cash = offer ? (offer.give?.cash || offer.want?.cash || "") : "";
      console.log(`[thread ${t.id}] ${m.sender}${cash !== "" ? ` (${cash} P)` : ""}: ${short(m.text)}`);
    }
    seen.set(t.id, msgs.length);
    if (lastStatus.get(t.id) !== t.status) { if (lastStatus.has(t.id) || t.status !== "open") console.log(`── thread ${t.id} status: ${t.status}${t.closed_reason ? " (" + t.closed_reason + ")" : ""}`); lastStatus.set(t.id, t.status); }
  }
  await sleep(10000);
}
