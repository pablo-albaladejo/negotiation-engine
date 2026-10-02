import { runGrid } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/harness.ts";
import { loadDealerProfile } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/model.ts";
import { oursPolicy } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/policies.ts";
const rs = await runGrid({ profile: loadDealerProfile(), policies: [oursPolicy()], floors: [0.15, 0.35], seeds: 15 });
console.log(rs.length, rs.filter(r=>r.atOpening).map(r=>`${r.scenario} f${r.floorFrac} o${r.opening} l${r.limit} r${r.rounds} fin${r.finalTaken}`).join("\n"));
