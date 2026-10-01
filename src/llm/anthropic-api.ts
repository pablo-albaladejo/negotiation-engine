import { createLlmClient, LlmError, type LlmClient } from "./provider.js";

export interface AnthropicOptions {
  apiKey: string | undefined;
  /** Modelo por env (`ANTHROPIC_MODEL`); sin valor por defecto. */
  model: string | undefined;
  baseUrl?: string;
  maxTokens?: number;
  fetch?: typeof fetch;
}

/**
 * Proveedor `anthropic-api`: Messages API con salida estructurada (`output_config.format` con JSON
 * Schema). La clave solo va en la cabecera y nunca en errores ni logs.
 */
export function createAnthropicClient(options: AnthropicOptions): LlmClient {
  const doFetch = options.fetch ?? fetch;
  const baseUrl = options.baseUrl ?? "https://api.anthropic.com";
  return createLlmClient("anthropic-api", async ({ system, prompt, jsonSchema, signal }) => {
    if (!options.apiKey) throw new LlmError("config", "falta ANTHROPIC_API_KEY");
    if (!options.model) throw new LlmError("config", "falta ANTHROPIC_MODEL");
    const response = await doFetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-api-key": options.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens ?? 1024,
        system,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: { type: "json_schema", schema: jsonSchema } },
      }),
    });
    let body: { content?: { type: string; text?: string }[]; stop_reason?: string; error?: { type?: string } };
    try {
      body = (await response.json()) as typeof body;
    } catch {
      throw new LlmError(response.ok ? "invalid-json" : "provider", `respuesta ilegible (HTTP ${response.status})`);
    }
    if (!response.ok) throw new LlmError("provider", `HTTP ${response.status} ${body.error?.type ?? ""}`.trim());
    if (body.stop_reason === "refusal") throw new LlmError("provider", "el modelo rechazó la petición");
    const text = body.content?.find((c) => c.type === "text")?.text;
    if (text === undefined) throw new LlmError("invalid-json", "respuesta sin bloque de texto");
    return text;
  });
}
