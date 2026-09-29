import type { Participant } from "../arena/participant.js";
import { createBot, timeDependent } from "./bot.js";
import { createTextOnlyBot } from "./text-only.js";

/** Bots en código registrados: deterministas por semilla, sin LLM ni red. */
export const BOTS: Record<string, () => Participant> = {
  boulware: () => createBot({ name: "boulware", strategy: timeDependent(0.2) }),
  conceder: () => createBot({ name: "conceder", strategy: timeDependent(3) }),
  "text-only": createTextOnlyBot,
};

export function createBotByName(name: string): Participant {
  const factory = BOTS[name];
  if (!factory) throw new Error(`Bot desconocido: ${name} (disponibles: ${Object.keys(BOTS).join(", ")})`);
  return factory();
}
