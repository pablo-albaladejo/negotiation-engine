import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runArenaCli } from "../../src/arena/cli.js";

afterEach(() => vi.unstubAllGlobals());

describe("pnpm arena", () => {
  it("juega sin red, imprime la tabla y guarda resumen y una transcripción por partida", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("red prohibida en la arena")));
    vi.stubGlobal("fetch", fetchSpy);
    const out = mkdtempSync(join(tmpdir(), "arena-"));
    const lines: string[] = [];
    const { runDir, report } = await runArenaCli(["--seeds", "3", "--out", out, "--run-id", "t"], (l) => lines.push(l));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(existsSync(join(runDir, "summary.json"))).toBe(true);
    const summary = JSON.parse(readFileSync(join(runDir, "summary.json"), "utf8"));
    expect(summary).toMatchObject({ runId: "t", llmProvider: "none", network: false, seeds: { start: 1, count: 3 } });
    expect(summary.overall.games).toBe(report.games.length);
    const transcripts = readFileSync(join(runDir, "transcripts.jsonl"), "utf8").trim().split("\n");
    expect(transcripts).toHaveLength(report.games.length);
    expect(JSON.parse(transcripts[0]!)).toHaveProperty("transcript");
    expect(lines.join("\n")).toMatch(/escenario\s+rival/);
    expect(report.overall.violations).toBe(0);
  });

  it("la misma ejecución sembrada da el mismo resumen por clúster", async () => {
    const out = mkdtempSync(join(tmpdir(), "arena-"));
    const args = ["--seeds", "2", "--scenarios", "price-buyer-wide,price-seller-narrow", "--out", out, "--quiet"];
    const a = await runArenaCli([...args, "--run-id", "a"]);
    const b = await runArenaCli([...args, "--run-id", "b"]);
    const stable = (r: typeof a) => r.report.clusters.map(({ latencyMeanMs: _m, latencyMaxMs: _x, ...rest }) => rest);
    expect(stable(b)).toEqual(stable(a));
  });

  it("comparación pareada: la misma configuración como candidata da diferencia 0", async () => {
    const out = mkdtempSync(join(tmpdir(), "arena-"));
    const { summary } = await runArenaCli(["--seeds", "2", "--candidate", "config/champion.json", "--out", out, "--run-id", "p", "--quiet"]);
    const paired = summary.paired as { diffPp: number | null }[];
    expect(paired.length).toBeGreaterThan(0);
    for (const p of paired) expect(p.diffPp === null || p.diffPp === 0).toBe(true);
  });

  it("rechaza un escenario o rival desconocido", async () => {
    await expect(runArenaCli(["--scenarios", "nope", "--quiet"])).rejects.toThrow(/Escenario desconocido/);
    await expect(runArenaCli(["--rivals", "nope", "--quiet"])).rejects.toThrow(/Bot desconocido/);
  });
});
