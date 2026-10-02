import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key! });
for (const id of [257, 260]) { const t = await c.raw("GET", `/api/threads/${id}`) as any; console.log(id, JSON.stringify({status:t.status, with:t.with, topic:t.topic, standing_offers:t.standing_offers, messages:(t.messages||[]).map((m:any)=>({sender:m.sender,text:m.text,price:m.price,offer:m.offer}))})); }
console.log("chato", JSON.stringify(await c.raw("GET", "/api/dealers/chato")));
console.log("abuela", JSON.stringify(await c.raw("GET", "/api/dealers/abuela")));
console.log("myoffers", JSON.stringify(await c.raw("GET", "/api/me/offers")).slice(0,2500));
console.log("threads", JSON.stringify(await c.raw("GET", "/api/me/threads?status=open")).slice(0,1500));
