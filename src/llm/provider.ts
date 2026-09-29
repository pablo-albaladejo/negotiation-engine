import { z } from "zod";

/**
 * Proveedor del LLM, elegido por variable de entorno:
 * - none: sin LLM (parser y narrador deterministas / plantilla)
 * - claude-cli: `claude -p --json-schema` con la suscripción (desarrollo)
 * - anthropic-api: API de Claude con ANTHROPIC_API_KEY (torneo, solo si hace falta)
 */
export const LlmProviderSchema = z.enum(["none", "claude-cli", "anthropic-api"]);
export type LlmProvider = z.infer<typeof LlmProviderSchema>;

export function currentProvider(): LlmProvider {
  return LlmProviderSchema.parse(process.env.LLM_PROVIDER ?? "none");
}
