import type { Hono } from "hono";
import type { Participant, PlayerSession } from "../arena/participant.js";
import { mandateFor, rivalRole, type Scenario } from "../arena/scenario.js";
import { deriveSeed } from "../engine/rng.js";
import type { Brain } from "../pipeline/pipeline.js";
import { createHttpApp } from "../protocol/http.js";
import { createProtocolSchemas, ProtocolError, type TurnOutput } from "../protocol/schemas.js";

export interface BotAppOptions {
  bot: Participant;
  /** El bot juega el rol contrario al nuestro en este escenario, con su mandato. */
  scenario: Scenario;
  seed?: number;
}

/**
 * Expone un bot como agente HTTP JSON con el mismo contrato que `pnpm agent`
 * (`POST /turn`, `GET /health`): una sesión de bot por `sessionId`.
 */
export function createBotApp(options: BotAppOptions): Hono {
  const { bot, scenario } = options;
  const issueNames = scenario.issues.map((i) => i.name);
  const schemas = createProtocolSchemas(issueNames);
  const sessions = new Map<string, PlayerSession>();

  async function sessionFor(sessionId: string): Promise<PlayerSession> {
    let session = sessions.get(sessionId);
    if (!session) {
      session = await bot.start({
        sessionId,
        scenarioId: scenario.id,
        issues: scenario.issues,
        mandate: mandateFor(scenario, rivalRole(scenario.role)),
        seed: deriveSeed(options.seed ?? 1, sessionId),
        mode: scenario.mode,
      });
      sessions.set(sessionId, session);
    }
    return session;
  }

  const brain: Brain = {
    async turn(raw) {
      const input = schemas.turnInput.safeParse(raw);
      if (!input.success) throw ProtocolError.fromZod(input.error, "Turno");
      return (await sessionFor(input.data.sessionId)).respond(input.data);
    },
    fallback(raw): TurnOutput {
      const r = raw as { sessionId?: string; round?: number };
      return { sessionId: r.sessionId ?? "unknown", round: r.round ?? 1, action: "walk", text: "No puedo seguir, me retiro." };
    },
  };
  return createHttpApp(brain, { issueNames: () => issueNames, health: () => ({ configVersion: 0, llmProvider: "none" }) });
}
