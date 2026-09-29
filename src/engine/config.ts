import { readFileSync } from "node:fs";
import { z } from "zod";

/** Parámetros del motor. Los ajusta el bucle de self-play y se congelan en config/champion.json. */
export const AgentConfigSchema = z.object({
  version: z.number().int().nonnegative(),
  /** Exponente Boulware: <1 concede tarde, >1 concede pronto. */
  beta: z.number().positive(),
  /** Fracción del rango hacia nuestro extremo con la que abrimos (0..1). */
  openingMargin: z.number().min(0).max(1),
  /** Tolerancia para aceptar una oferta rival cercana a la nuestra siguiente (0..1). */
  acceptMargin: z.number().min(0).max(1),
  /** Ruido relativo añadido a cada oferta para no ser predecibles (0..1). */
  noise: z.number().min(0).max(1),
  persona: z.string().min(1),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export function loadConfig(path = process.env.AGENT_CONFIG ?? "config/champion.json"): AgentConfig {
  return AgentConfigSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}
