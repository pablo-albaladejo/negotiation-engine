import { describe, expect, it } from "vitest";
import { defaultProviders, formatPlan, planEvalMatrix } from "../../src/arena/eval-llm-plan.js";

describe("plan de pnpm eval:llm (7.4)", () => {
  it("por defecto: 3 políticas × es,en × claude-cli, con bot LLM y cota de llamadas dentro del presupuesto", () => {
    const plan = planEvalMatrix({}, 10);
    expect(plan.cells.map((c) => `${c.provider}/${c.policy}/${c.language}`)).toEqual([
      "claude-cli/llm-primary-verified/es",
      "claude-cli/llm-primary-verified/en",
      "claude-cli/dual-strict/es",
      "claude-cli/dual-strict/en",
      "claude-cli/deterministic-only/es",
      "claude-cli/deterministic-only/en",
    ]);
    // boulware + bot LLM, 1 semilla: agente (11 turnos × parser 1 + narrador 1) × 2 partidas + bot 10.
    expect(plan.cells[0]).toMatchObject({ games: 2, llmBot: true, maxCalls: 2 * 11 * 2 + 10 });
    expect(plan.cells[4]).toMatchObject({ maxCalls: 2 * 11 * 1 + 10 });
    expect(plan.maxCalls).toBeLessThanOrEqual(plan.budget);
  });

  it("LLM_PROVIDER=none: sin bot LLM y 0 llamadas", () => {
    const plan = planEvalMatrix({ LLM_PROVIDER: "none" }, 10);
    expect(new Set(plan.cells.map((c) => c.provider))).toEqual(new Set(["none"]));
    expect(plan.cells.every((c) => !c.llmBot && c.maxCalls === 0)).toBe(true);
    expect(formatPlan(plan).join("\n")).toMatch(/cota superior\): 0/);
  });

  it("anthropic-api solo con clave; listas y validación por variables", () => {
    expect(defaultProviders({ ANTHROPIC_API_KEY: "k" })).toEqual(["claude-cli", "anthropic-api"]);
    const plan = planEvalMatrix({ EVAL_LLM_PROVIDERS: "anthropic-api", EVAL_LLM_POLICIES: "dual-strict", EVAL_LLM_LANGUAGES: "en", EVAL_LLM_LLM_BOT: "0", EVAL_LLM_SEEDS: "2" }, 8);
    expect(plan.cells).toEqual([{ provider: "anthropic-api", policy: "dual-strict", language: "en", rivals: ["boulware"], llmBot: false, games: 2, maxCalls: 2 * 9 * 2 }]);
    expect(() => planEvalMatrix({ EVAL_LLM_POLICIES: "yolo" }, 8)).toThrow(/política desconocida/);
    expect(() => planEvalMatrix({ EVAL_LLM_LANGUAGES: "fr" }, 8)).toThrow(/sin renderizador/);
  });
});
