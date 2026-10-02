import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const dir = process.argv[2];
let files = 0, engine = 0, withExplain = 0, eqRes = 0, after2 = 0, after2NonNull = 0, nonNull = 0, targetOfferNull = 0;
const eqSamples = [];
const close = (a, b) => Math.abs(a - b) <= 1e-9;
for (const f of readdirSync(dir)) {
  files++;
  const lines = readFileSync(join(dir, f), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const res = Object.values(lines[0].mandate?.reservation ?? {});
  for (const r of lines.slice(1)) {
    if (r.box !== "engine" || r.result !== "ok") continue;
    engine++;
    const e = r.output?.explain;
    if (!e) continue;
    withExplain++;
    if (e.targetOffer === null) targetOfferNull++;
    if (e.rivalReserveEstimate !== null && e.rivalReserveEstimate !== undefined) nonNull++;
    if (r.round > 2) { after2++; if (e.rivalReserveEstimate != null) after2NonNull++; }
    const nums = [e.t, e.target, e.step, e.uOffer, e.uRival, ...Object.values(e.targetOffer ?? {}), ...Object.values(e.rivalReserveEstimate ?? {})].filter((v) => typeof v === "number");
    for (const [k, v] of Object.entries({ ...Object.fromEntries(Object.entries(e.targetOffer ?? {}).map(([a, b]) => [`targetOffer.${a}`, b])), ...Object.fromEntries(Object.entries(e.rivalReserveEstimate ?? {}).map(([a, b]) => [`rivalReserveEstimate.${a}`, b])), t: e.t, target: e.target, step: e.step, uOffer: e.uOffer, uRival: e.uRival })) {
      if (typeof v === "number" && res.some((x) => close(x, v))) { eqRes++; if (eqSamples.length < 5) eqSamples.push(`${f} r${r.round} ${k}=${v}`); }
    }
    void nums;
  }
}
console.log(JSON.stringify({ files, engineRecords: engine, withExplain, explainValuesEqualOurReservation: eqRes, eqSamples, rivalReserveEstimateNonNull: `${nonNull}/${withExplain}`, afterRound2NonNull: `${after2NonNull}/${after2}`, targetOfferNull }, null, 1));
