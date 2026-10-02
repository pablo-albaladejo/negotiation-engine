const W = "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena";
const { acceptable, aprOffer, withinAprBand, aprOf, pctForApr, aprBandFits, enforceAprGuardrails } = await import(W + "/src/engine/apr.ts");
const { loadCatalog, mandateFor } = await import(W + "/src/arena/scenario.ts");
const cat = loadCatalog(W + "/config/arena/scenarios.json", { includeOptIn: true }).filter((s: any) => s.mandateUnit === "apr");
// accept fuzz on reservation side, in-domain and out-of-domain rival offers
let crossIn = 0, crossOut = 0, nIn = 0, nOut = 0; const ex: any[] = [];
for (const s of cat) for (const role of ["buyer", "seller"] as const) {
  const m = mandateFor(s, role); const b = m.apr!;
  for (let i = 0; i < 50000; i++) {
    const inDom = i % 2 === 0;
    const pct = inDom ? Math.round(Math.random() * 500) / 100 : Math.round((Math.random() * 300 - 100)) / 1;
    const day = inDom ? Math.floor(Math.random() * 26) : Math.floor(Math.random() * 120 - 30);
    const o = { pct, day }; const ok = acceptable(s.issues, m, o);
    // economic truth: buyer needs pct >= pctForApr(min, day) (day<base) else pct>=... ; seller needs pct <= pctForApr(max, day)
    const need = day < b.baseDays ? pctForApr(role === "buyer" ? b.min : b.max, day, b.baseDays) : (role === "buyer" ? Infinity : -Infinity);
    const cross = ok && (role === "buyer" ? pct < need - 1e-9 : pct > need + 1e-9);
    if (inDom) { nIn++; if (cross) crossIn++; } else { nOut++; if (cross) { crossOut++; if (ex.length < 4) ex.push({ id: s.id, role, o }); } }
  }
}
console.log({ nIn, crossIn, nOut, crossOut, ex });
// offer fuzz: guardrail output always in band, rival day path
let bad = 0, thr = 0, n = 0;
for (let i = 0; i < 200000; i++) {
  const base = [30, 45, 60][i % 3]; const day = Math.floor(Math.random() * (base - 1));
  const min = Math.random() * 80; const max = min + Math.random() * 40 + 1e-3; const band = { min, max, baseDays: base, day };
  if (!aprBandFits(band)) continue; n++;
  const role = i % 2 ? "buyer" : "seller"; const rd = Math.floor(Math.random() * base * 1.5);
  try { const o = aprOffer(band, role as any, min - 5 + Math.random() * (max - min + 10), rd); if (!withinAprBand(band, o)) bad++; } catch { thr++; }
}
console.log({ offers: n, bad, thr });
