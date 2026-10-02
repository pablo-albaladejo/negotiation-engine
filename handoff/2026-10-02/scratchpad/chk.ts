import { loadCatalog } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena/src/arena/scenario.ts";
import { pctForApr, aprOffer, withinAprBand, aprOf } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena/src/engine/apr.ts";
const cat = loadCatalog("/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena/config/arena/scenarios.json", { includeOptIn: true }).filter(s => s.mandateUnit === "apr");
for (const s of cat) {
  const pct = s.issues.find(i => i.name === "pct")!, day = s.issues.find(i => i.name === "day")!;
  for (const r of ["buyer","seller"] as const) {
    const m = s.mandates[r]; const d = m.reservation.day!;
    console.log(s.id, r, "pctRange", pct.min, pct.max, "dayRange", day.min, day.max, "base", s.baseDays, "band", m.apr, "refDay", d,
      "pct@min", pctForApr(m.apr!.min, d, s.baseDays!).toFixed(3), "pct@max", pctForApr(m.apr!.max, d, s.baseDays!).toFixed(3));
  }
}
// fuzz aprOffer
let throws = 0, bad = 0, n = 0;
for (let i = 0; i < 200000; i++) {
  const base = [30, 45, 60][i % 3]; const day = Math.floor(Math.random() * (base - 1));
  const min = Math.random() * 80; const max = min + Math.random() * 40 + 1e-3;
  const band = { min, max, baseDays: base, day };
  const role = i % 2 ? "buyer" : "seller"; const t = min - 5 + Math.random() * (max - min + 10);
  n++;
  try { const o = aprOffer(band, role as any, t); if (!withinAprBand(band, o)) bad++; } catch { throws++; }
}
console.log({ n, bad, throws });
console.log("edge", aprOf(99.99, 10, 30), aprOf(-1, 10, 30), aprOf(2, 29.999, 30), pctForApr(1e6, 10, 30));
