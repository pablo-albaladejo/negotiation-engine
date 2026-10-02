import { NL_LANGUAGES } from "../bots/nl-renderer.js";
import { LlmProviderSchema, type LlmProvider } from "../llm/provider.js";
import { PARSER_POLICIES, resolveRuntimeConfig, type ParserPolicy } from "../pipeline/runtime-config.js";

/**
 * Plan de `pnpm eval:llm`: matriz política del parser × idioma del rival × proveedor, en texto
 * completo, con una cota superior de las llamadas reales al LLM para poder revisarla con
 * `--dry-run` y cortar si supera `EVAL_LLM_MAX_CALLS`.
 */

export interface EvalCell {
  provider: LlmProvider;
  policy: ParserPolicy;
  language: string;
  /** Bots en código (con el renderizador de lenguaje natural) y, si hay LLM, el bot LLM. */
  rivals: string[];
  llmBot: boolean;
  games: number;
  /** Cota superior de llamadas reales al LLM de la celda. */
  maxCalls: number;
}

export interface EvalPlan {
  scenario: string;
  rounds: number;
  seeds: number;
  cells: EvalCell[];
  maxCalls: number;
  budget: number;
}

function list(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Proveedores por defecto: `none` si `LLM_PROVIDER=none`; si no, `claude-cli` y `anthropic-api` si hay clave. */
export function defaultProviders(env: NodeJS.ProcessEnv): LlmProvider[] {
  if (env.LLM_PROVIDER === "none") return ["none"];
  return env.ANTHROPIC_API_KEY ? ["claude-cli", "anthropic-api"] : ["claude-cli"];
}

export function planEvalMatrix(env: NodeJS.ProcessEnv, rounds: number): EvalPlan {
  const scenario = env.EVAL_LLM_SCENARIO ?? "text-buyer-wide";
  const seeds = Number(env.EVAL_LLM_SEEDS ?? "1");
  if (!Number.isInteger(seeds) || seeds < 1) throw new Error("EVAL_LLM_SEEDS debe ser un entero ≥ 1");
  const policies = list(env.EVAL_LLM_POLICIES, PARSER_POLICIES.join(","));
  for (const p of policies) if (!(PARSER_POLICIES as readonly string[]).includes(p)) throw new Error(`EVAL_LLM_POLICIES: política desconocida ${p} (${PARSER_POLICIES.join(" | ")})`);
  const languages = list(env.EVAL_LLM_LANGUAGES, "es,en");
  for (const l of languages) if (!(NL_LANGUAGES as readonly string[]).includes(l)) throw new Error(`EVAL_LLM_LANGUAGES: idioma sin renderizador ${l} (${NL_LANGUAGES.join(" | ")}; fr/ja/ar en la tarea 9.1)`);
  const providers = env.EVAL_LLM_PROVIDERS ? list(env.EVAL_LLM_PROVIDERS, "").map((p) => LlmProviderSchema.parse(p)) : defaultProviders(env);
  const rivals = list(env.EVAL_LLM_RIVALS, "boulware");
  const withLlmBot = (env.EVAL_LLM_LLM_BOT ?? "1") !== "0";
  const budget = Number(env.EVAL_LLM_MAX_CALLS ?? "300");
  // Intentos por caja de la configuración de ejecución en texto (hybrid sin campos estructurados).
  const attempts = resolveRuntimeConfig({}).llm;
  const cells: EvalCell[] = [];
  for (const provider of providers) {
    for (const policy of policies as ParserPolicy[]) {
      for (const language of languages) {
        const llm = provider !== "none";
        const llmBot = llm && withLlmBot;
        const games = (rivals.length + (llmBot ? 1 : 0)) * seeds;
        // Por turno del agente (rondas + el aviso final): parser si la política lo llama y narrador.
        const perAgentTurn = llm ? (policy === "deterministic-only" ? 0 : attempts.parser.attempts) + attempts.narrator.attempts : 0;
        const agentCalls = games * (rounds + 1) * perAgentTurn;
        const botCalls = llmBot ? seeds * rounds : 0;
        cells.push({ provider, policy, language, rivals, llmBot, games, maxCalls: agentCalls + botCalls });
      }
    }
  }
  return { scenario, rounds, seeds, cells, maxCalls: cells.reduce((s, c) => s + c.maxCalls, 0), budget };
}

export function formatPlan(plan: EvalPlan): string[] {
  const providers = [...new Set(plan.cells.map((c) => c.provider))];
  const policies = [...new Set(plan.cells.map((c) => c.policy))];
  const languages = [...new Set(plan.cells.map((c) => c.language))];
  const rivals = plan.cells[0]?.rivals ?? [];
  const llmBot = plan.cells.some((c) => c.llmBot);
  return [
    `eval:llm plan · ${plan.scenario} (${plan.rounds} rondas) · semillas ${plan.seeds} · texto completo`,
    `proveedores: ${providers.join(", ")} · políticas: ${policies.join(", ")} · idiomas: ${languages.join(", ")}`,
    `rivales: ${rivals.join(", ")}${llmBot ? " + bot LLM" : ""} · celdas ${plan.cells.length} · partidas ${plan.cells.reduce((s, c) => s + c.games, 0)}`,
    `llamadas reales al LLM (cota superior): ${plan.maxCalls} · presupuesto EVAL_LLM_MAX_CALLS = ${plan.budget}`,
  ];
}
