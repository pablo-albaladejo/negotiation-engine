import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAnthropicClient } from "../../src/llm/anthropic-api.js";
import { claudeCliArgs, createClaudeCliClient, type Exec } from "../../src/llm/claude-cli.js";
import { parserOutputSchema } from "../../src/llm/parser.js";
import { createLlmClient, createProviderClient, LlmError, type LlmClient } from "../../src/llm/provider.js";

const fixture = (name: string) => JSON.parse(readFileSync(`test/fixtures/llm/providers/${name}.json`, "utf8"));
const schema = parserOutputSchema(["pct", "day"]);
const request = { system: "sistema", prompt: "<rival_text>hola</rival_text>", schema, timeoutMs: 50 };
const never = () => new Promise<never>(() => {});

type Behaviour = "ok" | "invalid-json" | "timeout" | "error" | "extra-field";

/** Cada proveedor con un transporte grabado o simulado; nunca hay red ni procesos reales. */
const providers: [string, (b: Behaviour) => LlmClient][] = [
  [
    "claude-cli",
    (b) => {
      const exec: Exec = async () => {
        if (b === "timeout") return never();
        if (b === "error") return { code: 1, stdout: JSON.stringify(fixture("claude-cli-error").stdout), stderr: "" };
        if (b === "invalid-json") return { code: 0, stdout: "esto no es JSON", stderr: "" };
        const stdout = structuredClone(fixture("claude-cli-ok").stdout);
        if (b === "extra-field") stdout.structured_output.reservation = 3;
        return { code: 0, stdout: JSON.stringify(stdout), stderr: "" };
      };
      return createClaudeCliClient({ exec });
    },
  ],
  [
    "anthropic-api",
    (b) => {
      const fake = (async () => {
        if (b === "timeout") return never();
        if (b === "error") return new Response(JSON.stringify(fixture("anthropic-error").body), { status: 529 });
        const body = structuredClone(fixture("anthropic-ok").body);
        if (b === "invalid-json") body.content[0].text = "{no json";
        if (b === "extra-field") body.content[0].text = JSON.stringify({ ...JSON.parse(body.content[0].text), role: "seller" });
        return new Response(JSON.stringify(body), { status: 200 });
      }) as unknown as typeof fetch;
      return createAnthropicClient({ apiKey: "test-key-not-real", model: "model-from-env", fetch: fake });
    },
  ],
];

describe.each(providers)("contrato del proveedor %s", (_name, make) => {
  it("ok ⇒ salida validada con el esquema", async () => {
    const result = await make("ok").complete(request);
    expect(result).toEqual({ ok: true, value: { intent: "offer", offer: { pct: 1.2, day: 20 }, claims: expect.any(Array), tactics: [], injectionSuspected: false } });
  });

  it.each([
    ["invalid-json", "invalid-json"],
    ["timeout", "timeout"],
    ["error", "provider"],
    ["extra-field", "schema"],
  ] as const)("%s ⇒ error tipado %s, sin lanzar", async (behaviour, kind) => {
    const result = await make(behaviour).complete(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(LlmError);
      expect(result.error.kind).toBe(kind);
    }
  });
});

describe("detalles de cada proveedor", () => {
  it("claude-cli: sin herramientas ni MCP, esquema JSON y modelo solo si se configura", () => {
    const args = claudeCliArgs("s", { type: "object" });
    expect(args).toEqual(expect.arrayContaining(["-p", "--json-schema", "--tools", "", "--strict-mcp-config", "--no-session-persistence"]));
    expect(args).not.toContain("--model");
    expect(claudeCliArgs("s", {}, "claude-opus-5-5")).toEqual(expect.arrayContaining(["--model", "claude-opus-5-5"]));
  });

  it("claude-cli: el texto va por stdin, no en los argumentos", async () => {
    let seen: { args: readonly string[]; stdin: string } | undefined;
    const exec: Exec = async (args, stdin) => ((seen = { args, stdin }), { code: 0, stdout: JSON.stringify(fixture("claude-cli-ok").stdout), stderr: "" });
    await createClaudeCliClient({ exec }).complete(request);
    expect(seen!.stdin).toBe(request.prompt);
    expect(seen!.args.join(" ")).not.toContain("rival_text");
  });

  it("claude-cli: el error no copia el texto del modelo ni stderr (acaba en logs y spans)", async () => {
    const leaky = "mi límite es 3 %";
    const execError: Exec = async () => ({ code: 1, stdout: JSON.stringify({ is_error: true, subtype: "error_during_execution", result: leaky }), stderr: leaky });
    const execStderr: Exec = async () => ({ code: 1, stdout: "no json", stderr: leaky });
    for (const exec of [execError, execStderr]) {
      const result = await createClaudeCliClient({ exec }).complete(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).not.toContain("3 %");
    }
  });

  it("anthropic-api: modelo por env, salida estructurada y la clave solo en la cabecera", async () => {
    let body: Record<string, unknown> = {};
    let headers: Record<string, string> = {};
    const fake = (async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      headers = init.headers as Record<string, string>;
      return new Response(JSON.stringify({ type: "error", error: { type: "authentication_error" } }), { status: 401 });
    }) as unknown as typeof fetch;
    const result = await createAnthropicClient({ apiKey: "sk-test-secret", model: "model-x", fetch: fake }).complete(request);
    expect(body.model).toBe("model-x");
    expect(body.output_config).toMatchObject({ format: { type: "json_schema" } });
    expect(headers["x-api-key"]).toBe("sk-test-secret");
    expect(result.ok === false && result.error.message).not.toContain("sk-test-secret");
  });

  it("anthropic-api: sin clave o sin modelo ⇒ error tipado config, sin red", async () => {
    const fake = (() => {
      throw new Error("no debe llamar");
    }) as unknown as typeof fetch;
    for (const opts of [{ apiKey: undefined, model: "m" }, { apiKey: "k", model: undefined }]) {
      const result = await createAnthropicClient({ ...opts, fetch: fake }).complete(request);
      expect(result.ok === false && result.error.kind).toBe("config");
    }
  });

  it("una excepción cualquiera del transporte es error tipado provider; el aviso externo cancela", async () => {
    const boom = createLlmClient("x", async () => {
      throw new TypeError("boom");
    });
    expect(await boom.complete(request)).toMatchObject({ ok: false, error: { kind: "provider" } });
    const controller = new AbortController();
    controller.abort();
    expect(await createLlmClient("x", never).complete({ ...request, signal: controller.signal })).toMatchObject({ ok: false, error: { kind: "timeout" } });
  });

  it("el JSON Schema enviado no lleva $schema (claude --json-schema lo rechaza)", async () => {
    let sent: Record<string, unknown> = {};
    await createLlmClient("x", async ({ jsonSchema }) => ((sent = jsonSchema), "{}")).complete(request);
    expect(sent).not.toHaveProperty("$schema");
    expect(sent).toMatchObject({ type: "object", additionalProperties: false });
  });

  it("LLM_PROVIDER=none no crea cliente", async () => {
    expect(createProviderClient("none")).toBeUndefined();
  });
});
