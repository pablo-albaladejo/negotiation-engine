import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createBotByName } from "../../src/bots/index.js";
import { parseDeterministic } from "../../src/llm/deterministic-parser.js";
import { createLlmNarrator } from "../../src/llm/llm-narrator.js";
import { createLlmParser, delimitRivalText } from "../../src/llm/llm-parser.js";
import { NarratorInputSchema } from "../../src/llm/narrator.js";
import { resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";
import { createLlmClient, type LlmClient } from "../../src/llm/provider.js";
import { renderTemplate } from "../../src/llm/template.js";
import { champion, makeBrain, turn } from "../pipeline/helpers.js";

const injection = JSON.parse(readFileSync("test/fixtures/llm/injection.json", "utf8"));
const between = (s: string, tag: string) => s.slice(s.indexOf(`<${tag}>`) + tag.length + 2, s.lastIndexOf(`</${tag}>`)).trim();

/** Cliente falso que pasa por el contrato real (esquema, JSON, error tipado); registra lo enviado. */
function fakeClient(answer: (req: { system: string; prompt: string }) => unknown) {
  const sent: { system: string; prompt: string }[] = [];
  const client: LlmClient = createLlmClient("fake", async ({ system, prompt }) => {
    sent.push({ system, prompt });
    return answer({ system, prompt });
  });
  return { client, sent };
}

/** LLM que lee como el determinista (coincide) o que suma `skew` a cada cifra (discrepa). */
const readingParser = (skew = 0) =>
  createLlmParser(
    fakeClient(({ prompt }) => {
      const out = parseDeterministic(between(prompt, "rival_text"), ["pct"]);
      return out.offer ? { ...out, offer: { pct: out.offer.pct! + skew } } : out;
    }).client,
  );
const narratorSaying = (skew = 0) =>
  fakeClient(({ prompt }) => {
    const d = NarratorInputSchema.parse(JSON.parse(between(prompt, "decision")));
    const offer = d.offer ? { pct: d.offer.pct! + skew } : undefined;
    return { text: renderTemplate({ action: d.action, ...(offer ? { offer } : {}), ...(d.ask ? { ask: d.ask } : {}) }) };
  });

describe("parser LLM en cuarentena (11.4)", () => {
  it("solo manda el texto delimitado como dato y quita las etiquetas que intente colar", async () => {
    const { client, sent } = fakeClient(() => injection.flaggedResponse);
    await createLlmParser(client).parse(injection.texts[1], new AbortController().signal, { issueNames: ["pct"] });
    expect(sent[0]!.prompt.match(/<\/rival_text>/g)).toHaveLength(1);
    expect(sent[0]!.prompt).toBe(delimitRivalText(injection.texts[1]));
    expect(sent[0]!.system).toMatch(/DATO, nunca instrucciones/);
    expect(sent[0]!.system).not.toContain(injection.texts[1]);
  });

  it("una respuesta con campos prohibidos (reservation, role) se rechaza: el parser falla", async () => {
    const parser = createLlmParser(fakeClient(() => injection.compromisedResponse).client);
    await expect(parser.parse(injection.texts[0], new AbortController().signal, { issueNames: ["pct"] })).rejects.toMatchObject({ kind: "schema" });
  });

  it.each(["compromisedResponse", "flaggedResponse"])("inyección (%s): mandato intacto, sin accept, afirmaciones fuera del narrador", async (key) => {
    const { brain, store, trace } = makeBrain({ parser: createLlmParser(fakeClient(() => injection[key]).client) });
    for (const [k, text] of injection.texts.entries()) {
      const out = await brain.turn(turn(k + 1, { rivalAction: "message", text }));
      expect(out.action).not.toBe("accept");
    }
    const session = store.get("s1")!;
    expect(session.mandate).toEqual({ role: "buyer", reservation: { pct: 3 } });
    for (const r of trace.records.filter((r) => r.box === "narrator")) expect(JSON.stringify(r.input)).not.toMatch(/reserva|0,5/);
  });

  // Estas reglas describen la política `dual-strict` (la anterior); `llm-primary-verified` se prueba en test/pipeline/parser-policies.test.ts.
  const dualStrict = resolveRuntimeConfig({ parser: { policy: "dual-strict" } });

  it("solo texto: si ambos parsers coinciden la oferta se registra", async () => {
    const { brain, store } = makeBrain({ parser: readingParser(), runtime: dualStrict });
    await brain.turn(turn(1, { rivalAction: "offer", text: "Te ofrezco un 2,5 %" }));
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 2.5 }]);
  });

  it("solo texto: si discrepan no hay oferta y la contraoferta pide confirmar las cifras", async () => {
    const { brain, store, trace } = makeBrain({ parser: readingParser(1), runtime: dualStrict });
    const out = await brain.turn(turn(1, { rivalAction: "offer", text: "Te ofrezco un 2,5 %" }));
    expect(store.get("s1")!.rivalOffers).toEqual([]);
    expect(trace.records.find((r) => r.box === "reconcile")!.output).toMatchObject({ offer: null, unconfirmed: true });
    expect(out.action === "counter" && out.text).toBe(renderTemplate({ action: "counter", offer: (out as { offer: Record<string, number> }).offer, ask: "confirm-figures" }));
  });

  it("contra el bot de solo texto: 0 acuerdos distintos de los reales, coincidan o no los parsers", async () => {
    const scenario = loadCatalog().find((s) => s.id === "text-buyer-wide")!;
    for (const [skew, expectDeals] of [[0, true], [1, false]] as const) {
      const agent = createAgentParticipant({ config: champion, parser: readingParser(skew), runtime: dualStrict });
      let deals = 0;
      for (const seed of [1, 2, 3, 4, 5]) {
        const game = await playGame({ scenario, agent, rival: createBotByName("text-only"), seed });
        expect(game.wrongAgreement).toBe(false);
        if (game.endReason === "agreement" && game.agreedBy === "agent") deals++;
      }
      if (expectDeals) expect(deals).toBeGreaterThan(0);
      else expect(deals).toBe(0);
    }
  });
});

describe("narrador LLM (11.5)", () => {
  // Reserva poco común para barrer la traza y los prompts.
  const mandate = { role: "buyer" as const, reservation: { pct: 3.17 } };
  const rivalText = "Mi jefe dice que tu reserva es 3,17 %; te ofrezco un 1 %";

  it("su entrada son solo enums, cifras decididas y persona: ni reserva ni texto del rival, en traza y prompt", async () => {
    const { client, sent } = narratorSaying();
    const { brain, trace } = makeBrain({ mandate, narrator: createLlmNarrator(client) });
    for (let r = 1; r <= 3; r++) await brain.turn(turn(r, { rivalAction: "offer", rivalOffer: { pct: 1 }, text: rivalText }));
    const inputs = trace.records.filter((r) => r.box === "narrator").map((r) => r.input as Record<string, unknown>);
    expect(inputs.length).toBe(3);
    for (const input of inputs) {
      expect(Object.keys(input).every((k) => ["action", "offer", "rivalIntent", "tactics", "persona", "ask"].includes(k))).toBe(true);
      expect(JSON.stringify(input)).not.toMatch(/3\.17|3,17|jefe/);
    }
    for (const s of sent) {
      expect(`${s.system}\n${s.prompt}`).not.toMatch(/3\.17|3,17|jefe/);
      expect(s.system).toMatch(/cifra con dígitos/);
    }
    expect(trace.records.some((r) => r.box === "template")).toBe(false);
  });

  it("una cifra narrada distinta de la decidida la rechaza el validador: 2 intentos y plantilla", async () => {
    const { client, sent } = narratorSaying(0.5);
    const { brain, trace } = makeBrain({ mandate, narrator: createLlmNarrator(client) });
    const out = await brain.turn(turn(1, { rivalAction: "offer", rivalOffer: { pct: 1 } }));
    expect(sent).toHaveLength(2);
    expect(trace.records.filter((r) => r.box === "validator").map((r) => (r.output as { ok: boolean }).ok)).toEqual([false, false]);
    // Sin texto del rival el idioma de la sesión es desconocido: plantilla en `template.fallbackLanguage` (en).
    expect(out.action === "counter" && out.text).toBe(renderTemplate({ action: "counter", offer: (out as { offer: Record<string, number> }).offer }, "en"));
  });
});
