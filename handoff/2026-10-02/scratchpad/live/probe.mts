import { writeFileSync } from "node:fs";
import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key! });
const out = process.argv[2]!;
for (const p of ["/api/me", "/api/catalog", "/api/dealers/abuela", "/api/venues", "/api/levels", "/api/clock", "/RULES.md", "/api/rules", "/api/me/value?card=" ]) {
  try { const r = await c.raw("GET", p); writeFileSync(`${out}/${p.replace(/[^a-z]/gi, "_")}.json`, JSON.stringify(r, null, 1)); console.log("ok", p); }
  catch (e) { console.log("err", p, (e as Error).message.slice(0, 120)); }
}
