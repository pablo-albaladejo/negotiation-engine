import type { Participant } from "../arena/participant.js";
import { ADVERSARIAL, createAdversarialBot } from "./adversarial.js";
import { createBot, timeDependent, titForTat } from "./bot.js";
import { createTextOnlyBot } from "./text-only.js";

/** Bots en código registrados: deterministas por semilla, sin LLM ni red. */
export const BOTS: Record<string, () => Participant> = {
  boulware: () => createBot({ name: "boulware", strategy: timeDependent(0.2) }),
  conceder: () => createBot({ name: "conceder", strategy: timeDependent(3) }),
  "tit-for-tat": () => createBot({ name: "tit-for-tat", strategy: titForTat }),
  "text-only": createTextOnlyBot,
  // Adversariales con el texto en código (15.1): atacan con el texto, la cifra es de un bot determinista.
  ...Object.fromEntries(Object.keys(ADVERSARIAL).map((name) => [name, () => createAdversarialBot(name)])),
};

export function createBotByName(name: string): Participant {
  const factory = BOTS[name];
  if (!factory) throw new Error(`Bot desconocido: ${name} (disponibles: ${Object.keys(BOTS).join(", ")})`);
  return factory();
}
