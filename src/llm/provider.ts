import { z } from "zod";
import { createAnthropicClient } from "./anthropic-api.js";
import { createClaudeCliClient } from "./claude-cli.js";

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

export type LlmErrorKind = "timeout" | "invalid-json" | "schema" | "provider" | "config";

/** Error tipado del proveedor: el contrato nunca deja escapar otra excepción. */
export class LlmError extends Error {
  override name = "LlmError";
  constructor(
    readonly kind: LlmErrorKind,
    message: string,
  ) {
    super(`${kind}: ${message}`.slice(0, 300));
  }
}

export interface LlmRequest<T> {
  system: string;
  /** Mensaje del usuario; el texto no fiable va delimitado como dato por quien llama. */
  prompt: string;
  /** Esquema de la salida: se manda como JSON Schema y la respuesta se valida con él. */
  schema: z.ZodType<T>;
  timeoutMs: number;
  signal?: AbortSignal;
}

export type LlmResult<T> = { ok: true; value: T } | { ok: false; error: LlmError };

/** Lo que cada proveedor implementa: una llamada que devuelve el JSON (texto o valor) o lanza. */
export interface LlmTransportRequest {
  system: string;
  prompt: string;
  jsonSchema: Record<string, unknown>;
  signal: AbortSignal;
}
export type LlmTransport = (request: LlmTransportRequest) => Promise<unknown>;

export interface LlmClient {
  readonly name: Exclude<LlmProvider, "none"> | string;
  complete<T>(request: LlmRequest<T>): Promise<LlmResult<T>>;
  /** Abre la conexión antes del primer turno (solo proveedores HTTP); nunca lanza. */
  warm?(): Promise<boolean>;
}

/**
 * Contrato común: tiempo máximo, JSON válido, salida validada con el esquema y error tipado.
 * `complete` nunca lanza.
 */
export function createLlmClient(name: string, transport: LlmTransport): LlmClient {
  return {
    name,
    async complete<T>(request: LlmRequest<T>): Promise<LlmResult<T>> {
      const fail = (kind: LlmErrorKind, message: string): LlmResult<T> => ({ ok: false, error: new LlmError(kind, message) });
      const controller = new AbortController();
      const onAbort = () => controller.abort();
      request.signal?.addEventListener("abort", onAbort, { once: true });
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), Math.max(0, request.timeoutMs));
      });
      try {
        if (request.signal?.aborted) return fail("timeout", "cancelado antes de empezar");
        let jsonSchema: Record<string, unknown>;
        try {
          // Sin `$schema`: `claude --json-schema` rechaza la referencia al metaesquema draft 2020-12.
          const { $schema: _meta, ...rest } = z.toJSONSchema(request.schema) as Record<string, unknown>;
          jsonSchema = rest;
        } catch (error) {
          return fail("config", `esquema no convertible: ${(error as Error).message}`);
        }
        const call = transport({ system: request.system, prompt: request.prompt, jsonSchema, signal: controller.signal }).then(
          (raw) => ({ raw }),
          (error: unknown) => ({ error }),
        );
        const settled = await Promise.race([call, timeout]);
        if (settled === "timeout") {
          controller.abort();
          return fail("timeout", `sin respuesta en ${request.timeoutMs} ms`);
        }
        if ("error" in settled) {
          if (settled.error instanceof LlmError) return { ok: false, error: settled.error };
          if (controller.signal.aborted) return fail("timeout", "cancelado");
          return fail("provider", settled.error instanceof Error ? settled.error.message : String(settled.error));
        }
        let value = settled.raw;
        if (typeof value === "string") {
          try {
            value = JSON.parse(value);
          } catch {
            return fail("invalid-json", "la respuesta no es JSON");
          }
        }
        const parsed = request.schema.safeParse(value);
        if (!parsed.success) return fail("schema", parsed.error.issues.map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`).join("; "));
        return { ok: true, value: parsed.data };
      } finally {
        clearTimeout(timer);
        request.signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}

/**
 * Cliente del proveedor elegido; `none` no tiene cliente. Las claves solo se leen de `env`. El
 * modelo por caja (`llm.<caja>.model`) solo se aplica a `anthropic-api`; `claude-cli` usa
 * `CLAUDE_CLI_MODEL` (su arranque de ≈2 s no cabe en un turno de texto: solo para desarrollo).
 */
export function createProviderClient(provider: LlmProvider, env: NodeJS.ProcessEnv = process.env, options: { model?: string } = {}): LlmClient | undefined {
  if (provider === "none") return undefined;
  if (provider === "claude-cli") return createClaudeCliClient(env.CLAUDE_CLI_MODEL ? { model: env.CLAUDE_CLI_MODEL } : {});
  return createAnthropicClient({ apiKey: env.ANTHROPIC_API_KEY, model: options.model ?? env.ANTHROPIC_MODEL });
}

/** Cliente de una caja (`llm.parser` o `llm.narrator`) según su proveedor y modelo. */
export function createBoxClient(box: { provider: LlmProvider; model?: string }, env: NodeJS.ProcessEnv = process.env): LlmClient | undefined {
  return createProviderClient(box.provider, env, box.model ? { model: box.model } : {});
}
