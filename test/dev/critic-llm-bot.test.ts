import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createAgentParticipant } from "../../src/arena/agent-participant.js";
import { runArenaCli } from "../../src/arena/cli.js";
import { playGame } from "../../src/arena/runner.js";
import { loadCatalog } from "../../src/arena/scenario.js";
import { createLlmBot } from "../../src/bots/llm-bot.js";
import { runCritic } from "../../src/dev/critic.js";
import { createLlmClient } from "../../src/llm/provider.js";
import { champion } from "../pipeline/helpers.js";

const scenario = (id: string) => loadCatalog().find((s) => s.id === id)!;

describe("bot guiado por LLM (15.2)", () => {
  it("es un Participant del conjunto reservado con persona configurable y nunca cruza su mandato", async () => {
    const systems: string[] = [];
    // LLM falso que intenta regalar: ofrece y acepta fuera de los límites del bot.
    const client = createLlmClient("fake", async ({ system, prompt }) => {
      systems.push(system);
      return prompt.includes('"theirOffer":{') ? { action: "accept", text: "Acepto." } : { action: "counter", offer: { pct: 9.9 }, text: "Te doy un 9,9 %." };
    });
    const bot = createLlmBot({ client, persona: "regateador duro que ancla alto" });
    expect(bot.pool).toBe("heldOut");
    const game = await playGame({ scenario: scenario("price-buyer-wide"), agent: createAgentParticipant({ config: champion }), rival: bot, seed: 1 });
    expect(systems[0]).toContain("regateador duro que ancla alto");
    const sellerLimit = scenario("price-buyer-wide").mandates.seller.reservation.pct!;
    for (const m of game.transcript.filter((m) => m.from === "rival" && m.offer)) expect(m.offer!.pct!).toBeLessThanOrEqual(sellerLimit);
    if (game.agreedBy === "rival") expect(game.agreement!.pct!).toBeLessThanOrEqual(sellerLimit);
  });

  it("si el LLM falla, repite su última oferta o su apertura: siempre responde", async () => {
    const client = createLlmClient("fake", async () => "no es json");
    const game = await playGame({ scenario: scenario("price-seller-wide"), agent: createAgentParticipant({ config: champion }), rival: createLlmBot({ client, persona: "x" }), seed: 2 });
    expect(game.endReason).not.toBe("rival-error");
    expect(game.transcript.filter((m) => m.from === "rival").every((m) => m.action === "counter")).toBe(true);
  });
});

describe("crítico LLM (14.3)", () => {
  it("lee las derrotas de results/, escribe critic.md allí y no toca configuraciones", async () => {
    const before = readFileSync("config/champion.json", "utf8");
    const configsBefore = readdirSync("config").sort();
    const out = mkdtempSync(join(tmpdir(), "critic-"));
    const { runDir } = await runArenaCli(["--seeds", "2", "--scenarios", "price-buyer-narrow", "--rivals", "boulware", "--out", out, "--run-id", "c", "--quiet", "--no-traces"], () => {});
    const prompts: string[] = [];
    const client = createLlmClient("fake", async ({ prompt }) => {
      prompts.push(prompt);
      return { summary: "Cede demasiado tarde con ZOPA estrecha.", findings: [{ gameId: "price-buyer-narrow__boulware__1", cause: "walk en el último movimiento", suggestion: "subir beta" }] };
    });
    const { reportPath, losses } = await runCritic({ runDir, client });
    expect(losses).toBe(2);
    expect(dirname(reportPath)).toBe(runDir.startsWith("/") ? runDir : join(process.cwd(), runDir));
    const report = readFileSync(reportPath, "utf8");
    expect(report).toContain("derrotas 2");
    expect(report).toContain("subir beta");
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).not.toMatch(/"text"|reservation|mandate/);
    expect(readFileSync("config/champion.json", "utf8")).toBe(before);
    expect(readdirSync("config").sort()).toEqual(configsBefore);
  });

  it("sin derrotas no consulta al LLM", async () => {
    const out = mkdtempSync(join(tmpdir(), "critic-"));
    const { runDir } = await runArenaCli(["--seeds", "1", "--scenarios", "price-buyer-wide", "--rivals", "conceder", "--out", out, "--run-id", "c", "--quiet", "--no-traces"], () => {});
    let calls = 0;
    const client = createLlmClient("fake", async () => (calls++, {}));
    expect((await runCritic({ runDir, client })).losses).toBe(0);
    expect(calls).toBe(0);
  });
});
