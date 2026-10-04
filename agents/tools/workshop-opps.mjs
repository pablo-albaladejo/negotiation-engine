// Read-only opportunity check (workshop agent): Workshop triples and Pilar (L3) sale candidates. GET only; never POSTs.
// Run: set -a && . ./.env && set +a && node agents/tools/workshop-opps.mjs  (BAZAAR_URL and BAZAAR_KEY from .env only)
const H = { "X-Team-Key": process.env.BAZAAR_KEY }, U = process.env.BAZAAR_URL;
const get = async (p) => (await fetch(U + p, { headers: H })).json();
const RANK = ["common", "uncommon", "rare", "epic", "legendary"];

const me = await get("/api/me");
const offers = (await get("/api/me/offers")).offers ?? [];
const locked = new Map();
for (const o of offers) if (o.status === "open") for (const a of [...(o.give.assets ?? []), ...(o.want.assets ?? [])]) locked.set(a.id, `offer ${o.id}`);
for (const t of me.open_threads ?? []) {
  const th = await get(`/api/threads/${t}`);
  for (const id of [...(th.topic?.sell?.assets ?? []), ...(th.topic?.buy?.assets ?? [])]) locked.set(id, `thread ${t}`);
}

// Free spare copies: free copies of a card beyond the first one (the album copy stays).
// Pablo's hard rule: hidden cards (beyond the 12 per set, e.g. LAT-13, or flagged hidden) are never sold, offered or spent.
const isHidden = (a) => a.hidden === true || Number(String(a.ref).split("-")[1]) > 12;
const free = {};
for (const a of me.assets) if (a.kind === "card" && !locked.has(a.id) && !isHidden(a)) (free[a.ref] ??= []).push(a);
const spares = [];
for (const cs of Object.values(free)) spares.push(...cs.sort((x, y) => x.your_value - y.your_value).slice(1));

const byRarity = {};
for (const s of spares) (byRarity[s.rarity] ??= []).push(s);
const workshop = Object.entries(byRarity).filter(([r, xs]) => xs.length >= 3 && r !== "legendary")
  .map(([r, xs]) => ({ rarity: r, next: RANK[RANK.indexOf(r) + 1], pick: xs.sort((x, y) => x.your_value - y.your_value).slice(0, 3).map((a) => `${a.id}:${a.ref}@${a.your_value}`) }));

const pilar = spares.filter((s) => ["uncommon", "rare", "epic"].includes(s.rarity)).map((a) => `${a.id}:${a.ref}(${a.rarity})@${a.your_value}`);

console.log(JSON.stringify({ tick: me.tick, cash: me.cash, workshop, pilarCandidates: pilar, spares: spares.map((a) => `${a.ref}(${a.rarity[0]})`), locked: [...locked].map(([id, w]) => `${id}:${w}`) }));
