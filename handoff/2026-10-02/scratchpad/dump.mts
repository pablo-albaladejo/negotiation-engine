import { writeFileSync } from "node:fs";
import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key!, ratePerSec: 1.5, burst: 1 });
const out: Record<string, unknown> = {};
const paths = process.argv.slice(2);
for (const p of paths) { try { out[p] = await c.raw("GET", p); } catch (e) { out[p] = { error: String(e) }; } }
const s = JSON.stringify(out, null, 1);
if (env.key && s.includes(env.key)) throw new Error("key leaked");
writeFileSync(process.env.OUT!, s);
console.log("ok", s.length);
