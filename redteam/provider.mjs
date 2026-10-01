// Proveedor propio de promptfoo: juega cada caso como turnos del rival contra el adaptador HTTP
// del agente (REDTEAM_AGENT_URL, siempre 127.0.0.1) y pide al arnés las aserciones deterministas.
export default class NegotiationRingProvider {
  constructor(options = {}) {
    this.providerId = options.id ?? "negotiation-ring-http";
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context = {}) {
    const base = process.env.REDTEAM_AGENT_URL;
    if (!base) return { error: "falta REDTEAM_AGENT_URL (usa pnpm redteam)" };
    const vars = context.vars ?? {};
    const sessionId = `rt-${vars.id ?? "caso"}`;
    const prelude = typeof vars.prelude === "string" ? JSON.parse(vars.prelude) : (vars.prelude ?? []);
    const rivalOffer = typeof vars.rivalOffer === "string" ? JSON.parse(vars.rivalOffer) : vars.rivalOffer;
    const last = { rivalAction: rivalOffer ? "offer" : "message", ...(rivalOffer ? { rivalOffer } : {}), text: prompt };
    const turns = [...prelude, last].map((t, k) => ({ sessionId, round: k + 1, roundLimit: 10, ...t }));
    const post = async (path, body) => {
      const res = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return res.json();
    };
    const outputs = [];
    for (const turn of turns) outputs.push(await post("/turn", turn));
    const checks = await post("/redteam/check", { turns, outputs });
    const final = outputs.at(-1);
    return { output: JSON.stringify({ action: final.action, offer: final.offer ?? null, text: final.text, checks }) };
  }
}
