import { writeFileSync } from "node:fs";
import { BazaarBoard } from "/Users/pablo/development/hackathon/negotiation-ring/viewer/server/bazaar-board.ts";
import { loadBazaarEnv } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/env.ts";
const S = "/private/tmp/claude-501/-Users-pablo-development-hackathon-causa-prima/4328c728-5ba0-4af5-b8fe-2a085aa33646/scratchpad";
const b = new BazaarBoard(`${S}/bl`, { lessonsFile: "/Users/pablo/development/hackathon/negotiation-ring/docs/bazaar/lessons.json", snapshotsFile: null });
const t0 = Date.now();
const r = await b.get();
const text = JSON.stringify(r.body);
const key = loadBazaarEnv().key;
if (key && text.includes(key)) throw new Error("LEAK");
writeFileSync(`${S}/board.json`, text);
const d = (r.body as any).data;
console.log("ms", Date.now() - t0, "rows", d.rows.length, "source", d.source, "next", d.next_refresh_ms, JSON.stringify(d.header), JSON.stringify(d.clock));
for (const x of d.rows)
  console.log(x.id, x.kind, x.counterparty, "|", x.item, "|", x.status, x.closed_reason, "p", x.price, "v", x.our_value, x.value_source, "s", x.surplus, x.verdict, "dN", x.d_neg_points, "dL", x.d_ladder_points, "t", x.tick_opened, x.tick_settled, "m", x.messages.length, "o", x.offers.length, "dec", x.decisions.length);
console.log(d.market.leaderboard.length, d.market.feed.length, d.market.rastro.length, JSON.stringify(d.market.venue)?.slice(0, 200));
