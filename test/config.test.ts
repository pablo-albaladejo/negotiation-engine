import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AgentConfigSchema, ConfigError, loadConfig } from "../src/engine/config.js";

const valid = {
  version: 1,
  issues: [{ name: "pct", min: 0, max: 10, direction: "higher-better", weight: 1 }],
  defaultHorizon: 10,
  beta: 0.2,
  openingMargin: 0.9,
  acceptMargin: 0.02,
  acTimeThreshold: 0.9,
  noise: 0.1,
  turnBudgetMs: 4500,
  persona: "calido-firme",
  provenance: { source: "manual" },
};

function writeTmp(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "cfg-"));
  const path = join(dir, "config.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
}

function firstIssuePath(input: unknown): string {
  const result = AgentConfigSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.error!.issues[0]!.path.join(".");
}

describe("AgentConfigSchema v1", () => {
  it("la campeona carga y es versión 1 de solo precio", () => {
    const config = loadConfig("config/champion.json");
    expect(config.version).toBe(1);
    expect(config.issues).toHaveLength(1);
    expect(config.defaultHorizon).toBe(10);
    expect(config.roleWeights).toEqual({ buyer: 1, seller: 1 });
  });

  it("aplica los valores por defecto (roleWeights 1:1, margen 500 ms, minEffectPp 1)", () => {
    const config = AgentConfigSchema.parse(valid);
    expect(config.roleWeights).toEqual({ buyer: 1, seller: 1 });
    expect(config.turnSafetyMarginMs).toBe(500);
    expect(config.minEffectPp).toBe(1);
  });

  it("normaliza los pesos a suma 1", () => {
    const config = AgentConfigSchema.parse({
      ...valid,
      issues: [
        { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 3 },
        { name: "day", min: 0, max: 60, direction: "lower-better", weight: 1 },
      ],
    });
    expect(config.issues.map((i) => i.weight)).toEqual([0.75, 0.25]);
  });

  it("rechaza una lista vacía de issues", () => {
    expect(firstIssuePath({ ...valid, issues: [] })).toBe("issues");
  });

  it("rechaza un issue con min ≥ max señalando el issue", () => {
    const issues = [{ name: "pct", min: 5, max: 5, direction: "higher-better", weight: 1 }];
    expect(firstIssuePath({ ...valid, issues })).toBe("issues.0.max");
  });

  it("rechaza direction desconocida, peso negativo, nombres repetidos y pesos a cero", () => {
    const base = valid.issues[0]!;
    expect(firstIssuePath({ ...valid, issues: [{ ...base, direction: "up" }] })).toBe("issues.0.direction");
    expect(firstIssuePath({ ...valid, issues: [{ ...base, weight: -1 }] })).toBe("issues.0.weight");
    expect(firstIssuePath({ ...valid, issues: [base, base] })).toBe("issues");
    expect(firstIssuePath({ ...valid, issues: [{ ...base, weight: 0 }] })).toBe("issues");
  });

  it.each([
    ["beta", -0.1],
    ["defaultHorizon", 0],
    ["noise", 1],
    ["noise", -0.1],
    ["openingMargin", 1.5],
    ["acceptMargin", -0.01],
    ["acTimeThreshold", 2],
    ["turnSafetyMarginMs", -1],
    ["turnBudgetMs", 0],
    ["minEffectPp", -1],
  ])("rechaza %s = %s señalando el campo", (field, value) => {
    expect(firstIssuePath({ ...valid, [field]: value })).toBe(field);
  });

  it("acepta β = 0 (intransigente hasta t = 1)", () => {
    expect(AgentConfigSchema.parse({ ...valid, beta: 0 }).beta).toBe(0);
  });

  it("exige procedencia", () => {
    const { provenance: _omit, ...rest } = valid;
    expect(firstIssuePath(rest)).toBe("provenance");
  });

  it("loadConfig falla con un error que nombra el campo inválido", () => {
    const path = writeTmp({ ...valid, defaultHorizon: 0 });
    expect(() => loadConfig(path)).toThrow(ConfigError);
    expect(() => loadConfig(path)).toThrow(/defaultHorizon/);
  });

  it("loadConfig falla con JSON inválido", () => {
    const dir = mkdtempSync(join(tmpdir(), "cfg-"));
    const path = join(dir, "bad.json");
    writeFileSync(path, "{ no es json");
    expect(() => loadConfig(path)).toThrow(ConfigError);
  });
});
