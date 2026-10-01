import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { authFromEnv, createAgent, serverAuthFromEnv } from "../../src/agent/agent.js";
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
      env: { ...process.env, AGENT_CONFIG: configPath, LLM_PROVIDER: "none", PORT: "0", AGENT_ALLOW_NOAUTH: "1" },
      timeout: 20_000,
    }).catch((e: { code: number; stderr: string }) => e);
    expect((error as { code: number }).code).not.toBe(0);
    expect((error as { stderr: string }).stderr).toMatch(/defaultHorizon/);
  }, 30_000);
});

describe("autenticación por entorno", () => {
  const turn = JSON.stringify({ sessionId: "auth", round: 1, rivalAction: "message", text: "hola" });

  it("sin token no exige autenticación; con token exige la cabecera exacta y /health sigue abierto", async () => {
    expect(authFromEnv({})).toBeUndefined();
    const auth = authFromEnv({ AGENT_AUTH_TOKEN: "s3cret" })!;
    expect(auth).toEqual({ header: "authorization", value: "Bearer s3cret" });
    const agent = createAgent({ configPath: "config/champion.json", scenarioPath, provider: "none", logger: silentLogger, auth });
    expect((await agent.app.request("/health")).status).toBe(200);
    expect((await agent.app.request("/turn", { method: "POST", body: turn })).status).toBe(401);
    expect((await agent.app.request("/turn", { method: "POST", body: turn, headers: { authorization: "Bearer nope" } })).status).toBe(401);
    expect((await agent.app.request("/turn", { method: "POST", body: turn, headers: { authorization: "Bearer s3cret" } })).status).toBe(200);
  });

  it("AGENT_AUTH_HEADER cambia la cabecera", () => {
    expect(authFromEnv({ AGENT_AUTH_TOKEN: "t", AGENT_AUTH_HEADER: "X-Ring-Key" })).toEqual({ header: "x-ring-key", value: "t" });
  });
});

describe("modo servidor sin token", () => {
  it("se niega salvo con AGENT_ALLOW_NOAUTH=1", () => {
    expect(() => serverAuthFromEnv({})).toThrow(/AGENT_AUTH_TOKEN/);
    expect(() => serverAuthFromEnv({ AGENT_ALLOW_NOAUTH: "true" })).toThrow(ConfigError);
    expect(serverAuthFromEnv({ AGENT_ALLOW_NOAUTH: "1" })).toBeUndefined();
    expect(serverAuthFromEnv({ AGENT_AUTH_TOKEN: "t" })).toEqual({ header: "authorization", value: "Bearer t" });
  });

  it("`pnpm agent` en modo servidor sin token sale con código ≠ 0 y lo explica", async () => {
    const env: NodeJS.ProcessEnv = { ...process.env, LLM_PROVIDER: "none", PORT: "0", AGENT_TRACE: "off" };
    delete env.AGENT_AUTH_TOKEN;
    delete env.AGENT_ALLOW_NOAUTH;
    const error = await run("pnpm", ["-s", "agent"], { env, timeout: 20_000 }).catch((e: { code: number; stderr: string }) => e);
    expect((error as { code: number }).code).not.toBe(0);
    expect((error as { stderr: string }).stderr).toMatch(/AGENT_AUTH_TOKEN/);
  }, 30_000);
});
