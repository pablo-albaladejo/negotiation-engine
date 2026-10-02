import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";

const env = loadBazaarEnv();
const client = new BazaarClient({ url: env.url, key: env.key });
const me = await client.raw("GET", "/api/me");
const clock = await client.raw("GET", "/api/clock");
console.log("me keys:", Object.keys(me));
console.log("me.score:", JSON.stringify(me.score));
console.log("clock:", JSON.stringify(clock));
