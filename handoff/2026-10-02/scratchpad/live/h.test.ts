import { it } from "vitest";
import { runGrid } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/harness.js";
import { loadDealerProfile } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/model.js";
import { oursPolicy } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/policies.js";
it("x", async () => {
  const rs = await runGrid({ profile: loadDealerProfile(), policies: [oursPolicy()], floors: [0.15, 0.35], seeds: 15 });
  process.stderr.write(String(rs.length)+"\n"+, rs.filter(r=>r.atOpening).map(r=>`${r.scenario} f${r.floorFrac} o${r.opening} l${r.limit} r${r.rounds} fin${r.finalTaken}`).join("\n")+"\n");
});
