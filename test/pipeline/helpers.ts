import { loadConfig, type AgentConfig } from "../../src/engine/config.js";
import type { OfferMandate } from "../../src/engine/issues.js";
import { MemoryTrace } from "../../src/pipeline/box.js";
import { createPipeline, type PipelineDeps } from "../../src/pipeline/pipeline.js";
import { SessionStore } from "../../src/pipeline/session.js";
import { createProtocolSchemas } from "../../src/protocol/schemas.js";

export const champion: AgentConfig = loadConfig("config/champion.json");
export const schemas = createProtocolSchemas(champion.issues.map((i) => i.name));

/** Comprador con reserva 3 % (quiere al menos un 3 % de descuento). */
export const buyerMandate: OfferMandate = { role: "buyer", reservation: { pct: 3 } };

export function makeBrain(
  overrides: Partial<PipelineDeps> & { mandate?: OfferMandate; config?: AgentConfig } = {},
) {
  const { mandate, config, ...deps } = overrides;
  const trace = new MemoryTrace();
  const store = new SessionStore({
    mandateFor: () => mandate ?? buyerMandate,
    configFor: () => config ?? champion,
    seedFor: () => 42,
    now: () => 0,
  });
  const brain = createPipeline({ store, trace, ...deps });
  return { brain, store, trace };
}

export function turn(round: number, extra: Record<string, unknown> = {}) {
  return { sessionId: "s1", round, rivalAction: "message", ...extra };
}
