import { writeFileSync } from "node:fs";
import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key! });
const t = await c.raw("GET", "/api/threads/56");
writeFileSync("/Users/pablo/development/hackathon/negotiation-ring/test/fixtures/bazaar/thread-56.json", JSON.stringify(t, null, 2) + "\n");
