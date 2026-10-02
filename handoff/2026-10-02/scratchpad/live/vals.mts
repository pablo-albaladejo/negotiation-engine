import { BazaarClient } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/client.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const env = loadBazaarEnv();
const c = new BazaarClient({ url: env.url, key: env.key! });
console.log(JSON.stringify(await c.raw("GET", "/api/me/value?card=LAV-02")));
for (const s of ["LAV","MAL","LAT","SAL"]) { const row=[]; for (let i=1;i<=8;i++){ const id=`${s}-0${i}`; row.push(`${id}=${await c.value(id)}`);} console.log(row.join(" ")); }
