const W = "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena";
const { createScenarioAgentApp } = await import(W + "/src/arena/serve-agent.ts");
const { loadConfig } = await import(W + "/src/engine/config.ts");
const { loadCatalog, mandateFor } = await import(W + "/src/arena/scenario.ts");
const { aprValid, withinAprReservation, withinAprBand, offerApr, aprBetter } = await import(W + "/src/engine/apr.ts");
const { acceptableForUs, orientIssues } = await import(W + "/src/engine/issues.ts");
const cfg = loadConfig(W + "/config/champion.json");
const cat = loadCatalog(W + "/config/arena/scenarios.json", { includeOptIn: true });
const apr = cat.filter((s: any) => s.mandateUnit === "apr");
const lin = cat.filter((s: any) => s.mandateUnit !== "apr" && s.issues.length > 0).slice(0, 4);
async function session(s: any, offers: any[]) {
  const app = createScenarioAgentApp(cfg, s, "http"); const sid = `t__x__${Math.floor(Math.random()*1e6)}`;
  const post = (b: any) => app.request("/turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r: any) => r.json());
  const outs: any[] = []; let round = 1;
  outs.push(await post({ sessionId: sid, round: round++, roundLimit: 10, rivalAction: "message", text: "hola" }));
  for (const o of offers) { const r = await post({ sessionId: sid, round: round++, roundLimit: 10, rivalAction: "offer", rivalOffer: o, text: `Ofrezco ${Object.entries(o).map(([k,v])=>k+" "+v).join(", ")}` }); outs.push(r); if (r.action !== "counter") break; }
  return outs;
}
const buyerApr = apr.find((s: any) => s.role === "buyer");
for (const o of [{ pct: -50, day: 30 }, { pct: -5, day: 40 }, { pct: 0, day: 30 }]) { const r = (await session(buyerApr, [o])).at(-1); console.log("repro", JSON.stringify(o), r.action ?? r.error, JSON.stringify(r.offer ?? "")); }
let games = 0, bad: any[] = [], noResp = 0, accepts = 0, nonInt = 0, notMono = 0;
const rnd = (iss: any, wild: boolean) => Object.fromEntries(iss.map((i: any) => { const span = i.max - i.min; const v = wild && Math.random() < 0.4 ? i.min + (Math.random()*3-1)*span : i.min + Math.random()*span; return [i.name, Math.round(v*100)/100]; }));
for (const s of [...apr, ...lin]) for (let g = 0; g < 150; g++) {
  const offers = Array.from({ length: 9 }, () => rnd(s.issues, g % 2 === 0)); games++;
  let outs; try { outs = await session(s, offers); } catch (e) { noResp++; continue; }
  const m = mandateFor(s, s.role); let prev: any;
  for (const r of outs) {
    if (!r.action) { noResp++; continue; }
    if (r.action === "accept") { accepts++;
      const inR = s.issues.every((i: any) => r.offer[i.name] >= i.min && r.offer[i.name] <= i.max);
      const ok = inR && (m.apr ? aprValid(m.apr, r.offer) && withinAprReservation(m.role, m.apr, r.offer) : acceptableForUs(orientIssues(s.issues, m.role), m, r.offer));
      if (!ok) bad.push({ id: s.id, offer: r.offer }); }
    if (r.action === "counter" && m.apr) {
      if (!withinAprBand(m.apr, r.offer)) bad.push({ id: s.id, out: r.offer });
      if (!Number.isInteger(r.offer.day)) nonInt++;
      if (prev && aprBetter(m.role, offerApr(m.apr, r.offer), offerApr(m.apr, prev) + (m.role === "buyer" ? 1e-9 : -1e-9))) notMono++;
      prev = r.offer; }
  }
}
console.log({ games, accepts, bad: bad.slice(0, 3), badN: bad.length, noResp, nonInt, notMono });
