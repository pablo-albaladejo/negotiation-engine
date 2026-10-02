const W = "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena";
const { loadCatalog, mandateFor } = await import(W + "/src/arena/scenario.ts");
const { acceptable, pctForApr } = await import(W + "/src/engine/apr.ts");
const { orientIssues } = await import(W + "/src/engine/issues.ts");
const cat = loadCatalog(W + "/config/arena/scenarios.json", { includeOptIn: true });
const specials = [NaN, Infinity, -Infinity, -1e9, 1e9, -0.01, 100, 99.999];
let n = 0, acc = 0, cross = 0; const ex: any[] = [];
for (const s of cat) for (const role of ["buyer", "seller"] as const) {
  const m = mandateFor(s, role); const iss = orientIssues(s.issues, role);
  for (let i = 0; i < 4000; i++) {
    const o = Object.fromEntries(s.issues.map((is: any) => [is.name, Math.random() < 0.3 ? specials[i % specials.length] : is.min + (Math.random() * 3 - 1) * (is.max - is.min)]));
    n++; if (!acceptable(iss, m, o)) continue; acc++;
    const inR = s.issues.every((is: any) => Number.isFinite(o[is.name]) && o[is.name] >= is.min && o[is.name] <= is.max);
    let ok = inR;
    if (ok && m.apr) { const need = pctForApr(role === "buyer" ? m.apr.min : m.apr.max, o.day, m.apr.baseDays); ok = role === "buyer" ? o.pct >= need - 1e-9 : o.pct <= need + 1e-9; }
    if (!ok) { cross++; if (ex.length < 3) ex.push({ id: s.id, role, o }); }
  }
}
console.log({ scenarios: cat.length, n, acc, cross, ex });
