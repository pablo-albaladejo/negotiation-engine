import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { createLlmClient, LlmError, type LlmClient } from "./provider.js";

export interface ExecResult {
  code: number | null;
  stdout: string;
  stderr: string;
}
export type Exec = (args: readonly string[], stdin: string, signal: AbortSignal) => Promise<ExecResult>;

/** Ejecuta `claude` en un directorio neutro; el aborto mata el proceso. */
export const spawnClaude: Exec = (args, stdin, signal) =>
  new Promise((resolve, reject) => {
    const child = spawn("claude", [...args], { cwd: tmpdir(), signal, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(stdin);
  });

export interface ClaudeCliOptions {
  /** Id de modelo del gateway; sin él, el modelo por defecto del CLI. */
  model?: string;
  exec?: Exec;
}

/** Argumentos: sin herramientas, sin MCP, sin ajustes de usuario ni sesión guardada. */
export function claudeCliArgs(system: string, jsonSchema: Record<string, unknown>, model?: string): string[] {
  const args = ["-p", "--output-format", "json", "--json-schema", JSON.stringify(jsonSchema), "--system-prompt", system];
  args.push("--tools", "", "--strict-mcp-config", "--no-session-persistence", "--restricted");
  if (model) args.push("--model", model);
  return args;
}

/** Proveedor `claude-cli`: `claude -p --json-schema`; la salida estructurada viene en el sobre JSON. */
export function createClaudeCliClient(options: ClaudeCliOptions = {}): LlmClient {
  const exec = options.exec ?? spawnClaude;
  return createLlmClient("claude-cli", async ({ system, prompt, jsonSchema, signal }) => {
    const { code, stdout, stderr } = await exec(claudeCliArgs(system, jsonSchema, options.model), prompt, signal);
    let envelope: { is_error?: boolean; subtype?: string; result?: unknown; structured_output?: unknown };
    try {
      envelope = JSON.parse(stdout) as typeof envelope;
    } catch {
      // Sin stderr ni texto del modelo en el error: los errores acaban en logs y spans.
      if (code !== 0) throw new LlmError("provider", `claude terminó con código ${code}`);
      throw new LlmError("invalid-json", "el sobre de claude no es JSON");
    }
    if (envelope.is_error || (envelope.subtype && envelope.subtype !== "success") || code !== 0) {
      // Solo el subtipo y el código, nunca `envelope.result` (texto del modelo).
      throw new LlmError("provider", `claude: error (${String(envelope.subtype ?? "sin subtipo")}, código ${code})`);
    }
    return envelope.structured_output ?? envelope.result;
  });
}
