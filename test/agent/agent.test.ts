import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createAgent } from "../../src/agent/agent.js";
import { ConfigError } from "../../src/engine/config.js";
import { silentLogger } from "../../src/pipeline/box.js";

const run = promisify(execFile);

function tmpCopy(overrides: Record<string, unknown> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "agent-"));
  const path = join(dir, "champion.json");
  writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync("config/champion.json", "utf8")), ...overrides }));
  return path;
}

const scenarioPath = "config/scenario.json";

describe("entrypoint del agente", () => {
  it("arranca con la campeona y /health da su versión y el proveedor", async () => {
    const agent = createAgent({ configPath: "config/champion.json", scenarioPath, provider: "none", logger: silentLogger });
    const res = await agent.app.request("/health");
    expect(await res.json()).toEqual({ status: "ok", configVersion: 1, llmProvider: "none" });
    const turn = await agent.app.request("/turn", {
      method: "POST",
      body: JSON.stringify({ sessionId: "x", round: 1, rivalAction: "message", text: "hola" }),
    });
    expect(turn.status).toBe(200);
  });

  it("no arranca con una configuración inválida: el error nombra el campo", () => {
    const configPath = tmpCopy({ beta: -1 });
    expect(() => createAgent({ configPath, scenarioPath, provider: "none", logger: silentLogger })).toThrow(ConfigError);
    expect(() => createAgent({ configPath, scenarioPath, provider: "none", logger: silentLogger })).toThrow(/beta/);
  });

  it("no arranca con un escenario que no cubre los issues declarados", () => {
    const dir = mkdtempSync(join(tmpdir(), "scn-"));
    const bad = join(dir, "scenario.json");
    writeFileSync(bad, JSON.stringify({ role: "buyer", reservation: { price: 3 } }));
    expect(() => createAgent({ configPath: "config/champion.json", scenarioPath: bad, provider: "none", logger: silentLogger })).toThrow(/pct/);
  });

  it("relee la campeona al abrir sesión, nunca a mitad de sesión; una recarga inválida conserva la anterior", async () => {
    const configPath = tmpCopy();
    const agent = createAgent({ configPath, scenarioPath, provider: "none", logger: silentLogger });
    await agent.brain.turn({ sessionId: "old", round: 1, rivalAction: "message" });

    writeFileSync(configPath, JSON.stringify({ ...JSON.parse(readFileSync(configPath, "utf8")), version: 2 }));
    utimesSync(configPath, new Date(), new Date(Date.now() + 5_000));
    await agent.brain.turn({ sessionId: "old", round: 2, rivalAction: "message" });
    await agent.brain.turn({ sessionId: "new", round: 1, rivalAction: "message" });
    expect(agent.store.get("old")!.configVersion).toBe(1);
    expect(agent.store.get("new")!.configVersion).toBe(2);

    writeFileSync(configPath, "{ rota");
    utimesSync(configPath, new Date(), new Date(Date.now() + 10_000));
    await agent.brain.turn({ sessionId: "newer", round: 1, rivalAction: "message" });
    expect(agent.store.get("newer")!.configVersion).toBe(2);
  });

  it("`pnpm agent` con configuración inválida sale con código ≠ 0 y nombra el campo", async () => {
    const configPath = tmpCopy({ defaultHorizon: 0 });
    const error = await run("pnpm", ["-s", "agent"], {
      env: { ...process.env, AGENT_CONFIG: configPath, LLM_PROVIDER: "none", PORT: "0" },
      timeout: 20_000,
    }).catch((e: { code: number; stderr: string }) => e);
    expect((error as { code: number }).code).not.toBe(0);
    expect((error as { stderr: string }).stderr).toMatch(/defaultHorizon/);
  }, 30_000);
});
