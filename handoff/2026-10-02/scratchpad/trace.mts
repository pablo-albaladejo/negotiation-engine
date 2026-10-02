import { runEpisode, ABUELA_SCENARIOS } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/harness.ts";
import { oursPolicy, naivePolicy } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/policies.ts";
import { loadDealerProfile } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/model.ts";
import { DealerSim } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/sim/dealer.ts";
const profile = loadDealerProfile("/Users/pablo/development/hackathon/negotiation-ring/test/fixtures/bazaar/dealer-abuela.json");
const [scen, f, seed, pol] = process.argv.slice(2);
const scenario = ABUELA_SCENARIOS.find((s) => s.name === scen)!;
// monkeypatch to capture thread
const orig = DealerSim.prototype.view;
let last: any;
DealerSim.prototype.view = function (id: number) { last = orig.call(this, id); return last; };
const r = await runEpisode({ profile, scenario, policy: pol === "naive" ? naivePolicy() : oursPolicy(), seed: Number(seed), floorFrac: Number(f) });
console.log(JSON.stringify({ ...r, errors: r.errors }));
for (const m of last.messages) console.log(m.tick, m.sender, m.price ?? "", (m.text ?? "").slice(0, 60));
