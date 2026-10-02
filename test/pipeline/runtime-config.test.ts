import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadRuntimeConfig, resolveRuntimeConfig, RuntimeConfigError } from "../../src/pipeline/runtime-config.js";

function tempFile(content: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "runtime-"));
  const path = join(dir, "runtime.json");
  writeFileSync(path, JSON.stringify(content));
  return path;
}

describe("RuntimeConfigSchema y resolución por modo", () => {
  it("sin fichero: hybrid con los valores de texto y mandato desde el escenario", () => {
    // Sin fichero equivale a un contenido vacío; el versionado tampoco cambia los valores por defecto.
    for (const c of [resolveRuntimeConfig({}), loadRuntimeConfig({ env: {} })]) {
      expect(c.ring.mode).toBe("hybrid");
      expect(c.parser.policy).toBe("llm-primary-verified");
      expect(c.acceptance).toEqual({ signal: "parser-intent-verified", walkSignal: "trace-only" });
      expect(c.mandate.source).toBe("scenario-file");
    }
    const none = resolveRuntimeConfig({});
    expect(none).toMatchObject({ ring: { mode: "hybrid" }, parser: { acceptWordNumbers: "confirm", onLlmFailure: "deterministic" } });
    expect(none.llm.parser).toMatchObject({ provider: "none", timeoutMs: 1800, attempts: 1 });
    expect(none.llm.narrator).toMatchObject({ timeoutMs: 1500, attempts: 1, minRemainingMs: 900 });
    expect(none.template).toEqual({ languages: ["en", "es"], fallbackLanguage: "en", uncovered: "neutral" });
  });

  it("text-only usa los mismos valores de texto que hybrid", () => {
    const text = resolveRuntimeConfig({ ring: { mode: "text-only" } });
    expect(text.parser.policy).toBe("llm-primary-verified");
    expect(text.acceptance).toEqual({ signal: "parser-intent-verified", walkSignal: "trace-only" });
  });

  it("modo estructurado: dual-strict, ring-action y 2 intentos", () => {
    const config = resolveRuntimeConfig({ ring: { mode: "structured" } });
    expect(config.parser.policy).toBe("dual-strict");
    expect(config.acceptance).toEqual({ signal: "ring-action", walkSignal: "ring-action" });
    expect(config.llm.parser.attempts).toBe(2);
  });

  it("una clave explícita sustituye al valor por defecto del modo", () => {
    expect(resolveRuntimeConfig({ ring: { mode: "hybrid" }, parser: { policy: "dual-strict" } }).parser.policy).toBe("dual-strict");
  });

  it("valor inválido: el error nombra la clave y los valores admitidos", () => {
    expect(() => resolveRuntimeConfig({ parser: { policy: "llm-only" } })).toThrow(RuntimeConfigError);
    expect(() => resolveRuntimeConfig({ parser: { policy: "llm-only" } })).toThrow(/parser\.policy.*llm-primary-verified \| dual-strict \| deterministic-only/);
    expect(() => resolveRuntimeConfig({ narrator: { language: "not a tag!" } })).toThrow(/narrator\.language/);
    expect(() => resolveRuntimeConfig({ template: { languages: ["en"], fallbackLanguage: "es" } })).toThrow(/template\.fallbackLanguage/);
  });

  it("brief-text está aplazado: el esquema lo rechaza nombrando mandate.source", () => {
    expect(() => resolveRuntimeConfig({ mandate: { source: "brief-text" } })).toThrow(/mandate\.source/);
  });

  it("esquema cerrado: claves secretas o desconocidas se rechazan", () => {
    expect(() => resolveRuntimeConfig({ reservation: { pct: 3 } })).toThrow(/reservation: clave no admitida/);
    expect(() => resolveRuntimeConfig({ llm: { parser: { apiKey: "sk-x" } } })).toThrow(/llm\.parser\.apiKey: clave no admitida/);
  });

  it("proveedor y modelo por defecto desde el entorno; proveedor por caja", () => {
    const config = resolveRuntimeConfig({ llm: { narrator: { provider: "none" } } }, { LLM_PROVIDER: "anthropic-api", ANTHROPIC_MODEL: "m1" });
    expect(config.llm.parser).toMatchObject({ provider: "anthropic-api", model: "m1" });
    expect(config.llm.narrator.provider).toBe("none");
  });

  it("carga desde RUNTIME_CONFIG, aplica sobrescrituras de CLI y la huella cambia con la configuración", () => {
    const path = tempFile({ ring: { mode: "structured" } });
    const fromFile = loadRuntimeConfig({ env: { RUNTIME_CONFIG: path } });
    expect(fromFile.parser.policy).toBe("dual-strict");
    const overridden = loadRuntimeConfig({ env: { RUNTIME_CONFIG: path }, overrides: { ringMode: "hybrid", parserPolicy: "deterministic-only" } });
    expect(overridden.ring.mode).toBe("hybrid");
    expect(overridden.parser.policy).toBe("deterministic-only");
    expect(overridden.fingerprint).toMatch(/^[0-9a-f]{12}$/);
    expect(overridden.fingerprint).not.toBe(fromFile.fingerprint);
    expect(() => loadRuntimeConfig({ env: { RUNTIME_CONFIG: join(tmpdir(), "no-existe-runtime.json") } })).toThrow(/no encontrada/);
  });

  it("config/runtime.json versionado es válido y resuelve a hybrid", () => {
    expect(loadRuntimeConfig({ path: "config/runtime.json", env: {} }).ring.mode).toBe("hybrid");
  });
});
