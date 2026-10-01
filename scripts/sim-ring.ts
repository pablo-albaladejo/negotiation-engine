import { serve } from "@hono/node-server";
import { parseArgs } from "node:util";
import { createSimulatedRing, linearSellerRival } from "../src/protocol/sim-ring.js";

// Ring simulado para el humo en modo cliente: sirve turnos de un vendedor lineal y valida las respuestas.
// Sale con 0 si la partida termina con todas las respuestas válidas.
const { values } = parseArgs({ options: { port: { type: "string", default: "8788" }, rounds: { type: "string", default: "3" } } });
const rounds = Number(values.rounds);
const ring = createSimulatedRing({
  issueNames: ["pct"],
  nextTurn: linearSellerRival({ sessionId: "smoke-client", rounds, reservation: 6 }),
});
ring.app.get("/health", (c) => c.json({ status: "ok" }));
const server = serve({ fetch: ring.app.fetch, port: Number(values.port) });

const deadline = Date.now() + 30_000;
const timer = setInterval(() => {
  if (!ring.done && Date.now() < deadline) return;
  clearInterval(timer);
  server.close();
  for (const r of ring.responses) {
    console.log(`ronda ${r.round}: ${r.action}${r.action === "walk" ? "" : ` ${JSON.stringify(r.offer)}`} — ${r.text}`);
  }
  const ok = ring.done && ring.responses.length > 0 && ring.invalidResponses.length === 0 && ring.errors.length === 0;
  if (!ok) console.error(`humo cliente fallido: ${ring.responses.length} válidas, ${ring.invalidResponses.length} inválidas, ${ring.errors.length} errores`);
  process.exit(ok ? 0 : 1);
}, 100);
