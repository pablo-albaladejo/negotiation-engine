import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import type { GameSetup } from "../../src/arena/participant.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createLlmBot } from "../../src/bots/llm-bot.js";
import { createLlmClient, type LlmTransportRequest } from "../../src/llm/provider.js";
import { champion } from "../pipeline/helpers.js";

const scenario = (id: string) => loadCatalog().find((s) => s.id === id)!;
const situationOf = (prompt: string) => JSON.parse(prompt.match(/<situation>\n(.*)\n<\/situation>/s)![1]!) as Record<string, unknown>;

/** Cliente grabado: siempre propone su límite en inglés, con la cifra en lenguaje natural. */
function recordedClient(reply?: (situation: Record<string, unknown>) => unknown) {
  const sent: LlmTransportRequest[] = [];
  const client = createLlmClient("fake", async (request) => {
    sent.push(request);
    const situation = situationOf(request.prompt);
    if (reply) return reply(situation);
    const limit = (situation.yourLimits as Record<string, number>).pct!;
    return { action: "counter", offer: { pct: limit }, text: `Honestly, the best I can do is ${limit}% off.` };
  });
  return { client, sent };
}

const setup = (extra: Partial<GameSetup> = {}): GameSetup => ({
  sessionId: "g1",
  scenarioId: "price-buyer-wide",
  issues: scenario("price-buyer-wide").issues,
  mandate: { role: "seller", reservation: scenario("price-buyer-wide").mandates.seller.reservation },
  seed: 1,
  mode: "text-only",
  ...extra,
});

describe("bot LLM en texto completo (7.3)", () => {
  it("no ve nuestra oferta estructurada: solo nuestro texto, delimitado como dato; escribe en el idioma y la persona dados", async () => {
    const { client, sent } = recordedClient();
    const bot = createLlmBot({ client, persona: "comprador impaciente", textMode: "full", language: "en" });
    const session = await bot.start(setup());
    const out = await session.respond({ sessionId: "g1", round: 1, rivalAction: "offer", rivalOffer: { pct: 2.5 }, text: "Te propongo un 2,5 %." });
    const { prompt, system } = sent[0]!;
    expect(prompt).not.toContain("theirOffer");
    expect(prompt).not.toContain('"pct":2.5');
    expect(prompt).toContain("<rival_text>\nTe propongo un 2,5 %.\n</rival_text>");
    expect(system).toContain("comprador impaciente");
    expect(system).toMatch(/\(en\)/);
    expect(system).toMatch(/lenguaje natural/);
    expect(out).toMatchObject({ action: "counter", text: expect.stringMatching(/best I can do/) });
  });

  it("el idioma de la partida (arena) manda sobre el de las opciones", async () => {
    const { client, sent } = recordedClient();
    const session = await createLlmBot({ client, persona: "x", textMode: "full", language: "en" }).start(setup({ language: "es" }));
    await session.respond({ sessionId: "g1", round: 1, rivalAction: "offer", rivalOffer: { pct: 2.5 }, text: "Hola" });
    expect(sent[0]!.system).toMatch(/\(es\)/);
  });

  it("la aceptación del LLM solo vale si nuestra oferta real cumple su mandato (árbitro en código)", async () => {
    const { client } = recordedClient(() => ({ action: "accept", text: "Deal, we accept." }));
    const limit = scenario("price-buyer-wide").mandates.seller.reservation.pct!;
    const session = await createLlmBot({ client, persona: "x", textMode: "full", language: "en" }).start(setup());
    const tooGood = await session.respond({ sessionId: "g1", round: 1, rivalAction: "offer", rivalOffer: { pct: limit + 1 }, text: "x" });
    expect(tooGood.action).toBe("counter");
    const fine = await session.respond({ sessionId: "g1", round: 2, rivalAction: "offer", rivalOffer: { pct: limit - 0.5 }, text: "x" });
    expect(fine).toMatchObject({ action: "accept", offer: { pct: limit - 0.5 } });
  });

  it("si el LLM falla, repite su oferta con sus cifras en texto: siempre responde", async () => {
    const client = createLlmClient("fake", async () => "no es json");
    const session = await createLlmBot({ client, persona: "x", textMode: "full", language: "en" }).start(setup());
    const out = await session.respond({ sessionId: "g1", round: 1, rivalAction: "offer", rivalOffer: { pct: 1 }, text: "x" });
    expect(out.action).toBe("counter");
    expect(out.action === "counter" && out.text).toContain(String(out.action === "counter" && out.offer.pct));
  });

  it("partida en --text-mode full: el agente lee el texto del LLM (no el del renderizador) y la verdad de terreno es la canónica", async () => {
    const { client, sent } = recordedClient();
    const game = await playGame({
      scenario: scenario("price-buyer-wide"),
      agent: createAgentParticipant({ config: champion }),
      rival: createLlmBot({ client, persona: "x", textMode: "full" }),
      seed: 3,
      textMode: "full",
      languages: ["en"],
    });
    expect(game.language).toBe("en");
    expect(game.endReason).not.toBe("rival-error");
    const rivalMoves = game.transcript.filter((m) => m.from === "rival");
    expect(rivalMoves.length).toBeGreaterThan(0);
    for (const m of rivalMoves.filter((m) => m.action === "counter")) expect(m.text).toMatch(/best I can do is/);
    for (const request of sent) expect(request.prompt).not.toContain("theirOffer");
  });

  it("sin textMode el bot conserva el modo estructurado (ve nuestra oferta)", async () => {
    const { client, sent } = recordedClient();
    const session = await createLlmBot({ client, persona: "x" }).start(setup({ mode: "structured" }));
    await session.respond({ sessionId: "g1", round: 1, rivalAction: "offer", rivalOffer: { pct: 2.5 }, text: "Hola" });
    expect(sent[0]!.prompt).toContain('"theirOffer":{"pct":2.5}');
  });
});
