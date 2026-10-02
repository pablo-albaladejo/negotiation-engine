const W = "/Users/pablo/development/hackathon/negotiation-ring.worktrees/causa-prima-arena";
const { createScenarioAgentApp } = await import(W + "/src/arena/serve-agent.ts");
const { loadConfig } = await import(W + "/src/engine/config.ts");
const { loadCatalog } = await import(W + "/src/arena/scenario.ts");
const s = loadCatalog(W + "/config/arena/scenarios.json", { includeOptIn: true }).find((x: any) => x.id === "apr-buyer-wide");
for (const offer of [{ pct: -5, day: 40 }, { pct: 0, day: 30 }, { pct: -50, day: 30 }, { pct: 2, day: 5 }]) {
  const app = createScenarioAgentApp(loadConfig(W + "/config/champion.json"), s, "http");
  const sid = "t__x__1";
  const post = (b: any) => app.request("/turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r: any) => r.json());
  await post({ sessionId: sid, round: 1, roundLimit: 8, rivalAction: "message", text: "hola" });
  const r = await post({ sessionId: sid, round: 2, roundLimit: 8, rivalAction: "offer", rivalOffer: offer, text: `Ofrezco ${offer.pct}% a ${offer.day} días` });
  console.log(JSON.stringify(offer), "->", r.action, JSON.stringify(r.offer ?? r.error ?? r));
}
