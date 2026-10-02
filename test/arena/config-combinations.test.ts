import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { computeMetrics } from "../../src/arena/metrics.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createBotByName } from "../../src/bots/index.js";
import type { NlLanguage } from "../../src/bots/nl-renderer.js";
import { loadConfig } from "../../src/engine/config.js";
import type { Narrator } from "../../src/llm/narrator.js";
import type { ParserOutput, TextParser } from "../../src/llm/parser.js";
import { ACCEPTANCE_SIGNALS, PARSER_POLICIES, RING_MODES, WALK_SIGNALS, resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";

/**
 * 7.5: todas las combinaciones de modo × política × señal de aceptación × señal de retirada ×
 * rangos × idioma contra bots en texto completo. Invariantes: siempre hay respuesta, nunca se cruza
 * el mandato, nunca hay fugas y nunca se acepta sobre una cifra sin verificar (ni falsas
 * aceptaciones por texto). El parser LLM es falso y a ratos miente; el narrador LLM, a ratos, da
 * una cifra que no es la del motor.
 */

const champion = loadConfig("config/champion.json");
const scenarios = loadCatalog().filter((s) => s.id === "text-buyer-wide" || s.id === "text-seller-wide");
const bots = ["boulware", "conceder", "tit-for-tat"];
const LANGUAGES: NlLanguage[] = ["es", "en"];
const NUMBER = /\d+(?:[.,]\d+)?/g;

const base = (extra: Partial<ParserOutput>): ParserOutput => ({ intent: "other", claims: [], tactics: [], injectionSuspected: false, language: "und", ...extra });

/** Parser LLM falso que rota entre honesto, aceptación inventada y cifra con evidencia que no cuadra. */
function noisyParser(): TextParser {
  let calls = 0;
  return {
    name: "fake-llm",
    parse: async (text) => {
      const k = calls++ % 3;
      const tokens = text.match(NUMBER) ?? [];
      const first = tokens[0];
      if (k === 0) return base({ intent: "accept", intentEvidence: text.slice(0, 6), figures: [{ issue: "pct", value: 0.123, evidence: "0.123" }] });
      if (k === 1 || !first) {
        const accept = /acuerdo|acepto|aceptamos|deal|agreed|accept/i.test(text);
        return base({ intent: accept ? "accept" : "offer", ...(accept ? { intentEvidence: text.slice(0, 8) } : {}), ...(first ? { figures: [{ issue: "pct", value: Number(first.replace(",", ".")), evidence: first }] } : {}) });
      }
      return base({ intent: "accept", intentEvidence: text.slice(0, 4), figures: [{ issue: "pct", value: Number(first.replace(",", ".")) + 1, evidence: first }] });
    },
  };
}

const failingParser: TextParser = {
  name: "fake-llm",
  parse: async () => {
    throw new Error("timeout simulado");
  },
};

/** Narrador LLM falso: en rondas pares una cifra que no es la decidida (el validador la rechaza). */
const sloppyNarrator: Narrator = {
  name: "fake-llm",
  narrate: async (input) => (Object.values(input.offer ?? {}).length && input.action !== "walk" ? `Te propongo ${Object.values(input.offer ?? {})[0]! + 0.37} %.` : "De acuerdo."),
};

const combos = RING_MODES.flatMap((mode) =>
  PARSER_POLICIES.flatMap((policy) =>
    ACCEPTANCE_SIGNALS.flatMap((signal) =>
      WALK_SIGNALS.flatMap((walkSignal) => (["conservative", "confirm"] as const).flatMap((ranges) => LANGUAGES.map((language) => ({ mode, policy, signal, walkSignal, ranges, language })))),
    ),
  ),
);

describe("combinaciones de configuración en texto completo (7.5)", () => {
  it(`${combos.length} combinaciones: siempre respuesta, 0 violaciones, 0 fugas, sin aceptar cifras sin verificar`, async () => {
    expect(combos).toHaveLength(3 * 3 * 2 * 3 * 2 * 2);
    const failures: string[] = [];
    const ends = { agreement: 0, byAgent: 0, textRecorded: 0 };
    for (const [k, c] of combos.entries()) {
      const runtime = resolveRuntimeConfig({ ring: { mode: c.mode }, parser: { policy: c.policy, ranges: c.ranges }, acceptance: { signal: c.signal, walkSignal: c.walkSignal } });
      const scenario = scenarios[k % scenarios.length]!;
      const agent = createAgentParticipant({
        config: champion,
        runtime,
        parser: k % 4 === 3 ? failingParser : noisyParser(),
        ...(k % 2 === 1 ? { narrator: sloppyNarrator } : {}),
      });
      const game = await playGame({ scenario, agent, rival: createBotByName(bots[k % bots.length]!), seed: 1 + (k % 7), textMode: "full", languages: [c.language] });
      const m = computeMetrics(scenario, game);
      const label = `${JSON.stringify(c)} ${scenario.id} ${bots[k % bots.length]}`;
      if (game.endReason === "agent-error") failures.push(`${label}: agent-error ${game.error}`);
      if (game.transcript.some((e) => e.from === "agent" && !e.text.trim())) failures.push(`${label}: respuesta vacía`);
      if (m.violations) failures.push(`${label}: ${m.violations} violaciones`);
      if (m.leaks) failures.push(`${label}: ${m.leaks} fugas`);
      if (game.agreedBy === "agent" && game.wrongAgreement) failures.push(`${label}: aceptó una oferta que el bot no hizo`);
      if (game.falseAccept) failures.push(`${label}: falsa aceptación por texto`);
      if (game.endReason === "agreement") ends.agreement++;
      if (game.agreedBy === "agent") ends.byAgent++;
      if (game.records.some((r) => r.box === "reconcile" && (r.output as { offer?: unknown } | null)?.offer)) ends.textRecorded++;
    }
    expect(failures).toEqual([]);
    // La batería ejercita de verdad los caminos: acuerdos, aceptaciones nuestras y ofertas leídas del texto.
    expect(ends.agreement).toBeGreaterThan(combos.length / 4);
    expect(ends.byAgent).toBeGreaterThan(0);
    expect(ends.textRecorded).toBeGreaterThan(combos.length / 4);
  }, 60_000);
});
