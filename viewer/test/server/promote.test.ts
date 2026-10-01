import { cpSync, readFileSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startViewerServer } from "../../server/http.js";
import { gateModel, type RunEntry } from "../../src/model/index.js";
import type { GateFile } from "../../../src/arena/results-schema.js";
import { generateFixtures, generateGateFixtures } from "../fixtures.js";
import { get, makeRepo, snapshot } from "./helpers.js";

let repo: ReturnType<typeof makeRepo>;
let gx: Awaited<ReturnType<typeof generateGateFixtures>>;
let server: Server;
let port: number;

beforeAll(async () => {
  const fx = await generateFixtures();
  gx = await generateGateFixtures();
  repo = makeRepo(fx);
  cpSync(gx.passed.dir, join(repo.root, "results", "promote-passed"), { recursive: true });
  cpSync(gx.rejected.dir, join(repo.root, "results", "promote-bad"), { recursive: true });
  writeFileSync(join(repo.root, "results", "promote-bad", "gate.json"), '{"candidate": 1}');
  ({ server, port } = await startViewerServer({ repoRoot: repo.root, env: { VIEWER_PORT: "0" } }));
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("/api/promote/:runId (solo lectura)", () => {
  it("devuelve gate.json validado, que acepta gateModel, y el run figura como promoción", async () => {
    const res = await get(port, "/api/promote/promote-passed");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: gx.passed.gate, errors: [] });
    expect(gateModel("promote-passed", res.json.data as GateFile).verdict.pass).toBe(true);
    const runs = (await get(port, "/api/runs")).json.data as RunEntry[];
    expect(runs.find((r) => r.runId === "promote-passed")?.kind).toBe("promotion");
  });

  it("gate.json inválido: data null y error con fichero y campo, sin caída", async () => {
    const res = await get(port, "/api/promote/promote-bad");
    expect(res.status).toBe(200);
    expect(res.json.data).toBeNull();
    expect((res.json.errors as { file: string }[])[0]!.file).toBe("promote-bad/gate.json");
  });

  it("run sin gate.json o identificador inválido: 404/400; leer no cambia nada en disco", async () => {
    const before = snapshot(repo.root);
    const champion = readFileSync(join(repo.root, "config", "champion.json"), "utf8");
    expect((await get(port, "/api/promote/fx")).status).toBe(404);
    expect((await get(port, "/api/promote/..%2Fconfig")).status).toBe(400);
    expect((await get(port, "/api/promote/promote-passed", { method: "POST" })).status).toBe(405);
    expect(snapshot(repo.root)).toEqual(before);
    expect(readFileSync(join(repo.root, "config", "champion.json"), "utf8")).toBe(champion);
  });
});
