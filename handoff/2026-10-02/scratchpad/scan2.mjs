import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const dir = process.argv[2];
const close = (a, b) => Math.abs(a - b) <= 1e-9;
const byField = {}; let rivalOffered = 0, total = 0, midpointPrior = 0;
for (const f of readdirSync(dir)) {
  const lines = readFileSync(join(dir, f), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const res = lines[0].mandate?.reservation ?? {};
  for (const r of lines.slice(1)) {
    if (r.box !== "engine" || r.result !== "ok" || !r.output?.explain) continue;
    const e = r.output.explain;
    const fields = { t: e.t, target: e.target, step: e.step, uOffer: e.uOffer, uRival: e.uRival };
    for (const [k, v] of Object.entries(e.targetOffer ?? {})) fields[`targetOffer.${k}`] = v;
    for (const [k, v] of Object.entries(e.rivalReserveEstimate ?? {})) fields[`rivalReserveEstimate.${k}`] = v;
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v !== "number" || !Object.values(res).some((x) => close(x, v))) continue;
      total++; byField[k] = (byField[k] ?? 0) + 1;
      if (k.startsWith("rivalReserveEstimate.")) {
        const issue = k.split(".")[1];
        const offers = (r.input?.state?.rivalOffers ?? []).map((o) => o[issue]);
        if (offers.some((o) => close(o, v))) rivalOffered++;
      }
    }
  }
}
console.log(JSON.stringify({ total, byField, estimateEqualsAnOfferTheRivalMade: rivalOffered }));
