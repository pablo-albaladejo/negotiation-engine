import { readFileSync } from "node:fs";
import { decide } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/add-agent-architecture/src/engine/engine.js";
import { roundInFavor, offerAtUtility } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/add-agent-architecture/src/engine/issues.js";
for (const f of ["last-move-below-counter", "default-horizon-no-walk"]) {
  const fx = JSON.parse(readFileSync(`/Users/pablo/development/hackathon/negotiation-ring.worktrees/add-agent-architecture/test/fixtures/engine/${f}.json`, "utf8"));
  console.log(f, JSON.stringify(decide(fx.input)), JSON.stringify(fx.expected));
}
const issues = [{ name: "pct", min: 0, max: 10, direction: "higher-better" as const, weight: 1 }];
console.log(3 === 0.3 * 10, 0 + 0.3 * 10, roundInFavor(issues, { pct: 0 + 0.3 * 10 }));
