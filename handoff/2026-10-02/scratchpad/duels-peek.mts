import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key! });
for (const p of ["/api/duels", "/api/duels?done=true", "/api/schedule", "/api/clock"]) {
  try { console.log(p, JSON.stringify(await c.raw("GET", p)).slice(0, 3000)); } catch (e) { console.log(p, "ERR", (e as Error).message); }
}
