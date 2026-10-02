import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.js";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.js";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key! });
const d = await c.dealer("abuela");
console.log(JSON.stringify(d.menu, null, 0));
console.log(JSON.stringify({ ...d, menu: undefined }).slice(0, 1500));
const ts = await c.myThreads("all" as never).catch(async () => c.myThreads("closed" as never));
console.log(JSON.stringify(ts.threads.map((t: any) => ({ id: t.id, with: t.with, status: t.status, topic: t.topic }))));
