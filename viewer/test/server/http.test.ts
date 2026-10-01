import { readFileSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { scenarioHash } from "../../../src/arena/scenario.js";
import { LOOPBACK, startViewerServer } from "../../server/http.js";
import { generateFixtures, type ViewerFixtures } from "../fixtures.js";
import { get, makeRepo, snapshot } from "./helpers.js";

let fx: ViewerFixtures;
let repo: ReturnType<typeof makeRepo>;
let server: Server;
let port: number;

beforeAll(async () => {
  fx = await generateFixtures();
  repo = makeRepo(fx);
  ({ server, port } = await startViewerServer({ repoRoot: repo.root, env: { VIEWER_PORT: "0" } }));
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("enlace solo a loopback", () => {
  it("con VIEWER_PORT=0 escucha en 127.0.0.1 (IPv4), nunca en 0.0.0.0 ni ::", () => {
    const address = server.address() as AddressInfo;
    expect(address.address).toBe("127.0.0.1");
    expect(address.family).toBe("IPv4");
    expect(port).toBeGreaterThan(0);
  });

  it("ninguna variable de entorno cambia la dirección (solo el puerto)", async () => {
    const env = { VIEWER_PORT: "0", HOST: "0.0.0.0", VIEWER_HOST: "0.0.0.0", HOSTNAME: "::" };
    const other = await startViewerServer({ repoRoot: repo.root, env });
    try {
      expect((other.server.address() as AddressInfo).address).toBe(LOOPBACK);
      expect(other.url).toBe(`http://127.0.0.1:${other.port}/`);
    } finally {
      await new Promise<void>((resolve) => other.server.close(() => resolve()));
    }
  });

  it("acepta Host 127.0.0.1:<puerto> y localhost:<puerto>", async () => {
    expect((await get(port, "/api/runs")).status).toBe(200);
    expect((await get(port, "/api/runs", { host: `localhost:${port}` })).status).toBe(200);
  });
});

describe("VIEWER_RESULTS_DIR", () => {
  it("resultsDir sustituye a <repoRoot>/results", async () => {
    const other = await startViewerServer({ repoRoot: repo.outside, resultsDir: join(repo.root, "results"), env: { VIEWER_PORT: "0" } });
    try {
      const res = await get(other.port, "/api/runs");
      expect((res.json.data as { runId: string }[]).map((r) => r.runId)).toContain(fx.runId);
    } finally {
      await new Promise<void>((resolve) => other.server.close(() => resolve()));
    }
  });
});

describe("Host ajeno ⇒ 403 sin leer ficheros", () => {
  it.each(["evil.example:5199", "evil.example:{port}", "127.0.0.1", "127.0.0.1:{other}", "0.0.0.0:{port}", "[::1]:{port}"])("Host %s", async (host) => {
    const api = vi.fn();
    const guarded = await startViewerServer({ repoRoot: repo.root, env: { VIEWER_PORT: "0" }, api });
    try {
      const res = await get(guarded.port, "/api/runs", { host: host.replace("{port}", String(guarded.port)).replace("{other}", String(guarded.port + 1)) });
      expect(res.status).toBe(403);
      expect(api).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve) => guarded.server.close(() => resolve()));
    }
  });
});

describe("solo GET y HEAD", () => {
  it.each(["POST", "PUT", "DELETE", "PATCH"])("%s /api/runs ⇒ 405 y results/ no cambia", async (method) => {
    const before = snapshot(join(repo.root, "results"));
    const res = await get(port, "/api/runs", { method });
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe("GET, HEAD");
    expect(snapshot(join(repo.root, "results"))).toEqual(before);
  });

  it("HEAD responde sin cuerpo", async () => {
    const res = await get(port, "/api/runs", { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.text).toBe("");
  });
});

describe("path traversal ⇒ 400/404 sin revelar rutas", () => {
  it.each([
    ["/api/runs/..%2F..%2Fetc%2Fpasswd", 400],
    ["/api/runs/%2e%2e", 400],
    ["/api/runs/%2E%2E/%2E%2E/etc", 400],
    ["/api/runs/../../etc/passwd", 400],
    ["/api/runs/%2Fetc%2Fpasswd", 400],
    ["/api/runs//etc/passwd", 400],
    ["/api/runs/%E0%A4%A", 400],
    ["/api/runs/fx/games/..%2F..%2Fsummary", 400],
    ["/api/tournament/agent-test/..%2Fevil%2Fsecret", 400],
    ["/api/runs/evil", 404],
    ["/api/runs/evil/games/secret", 404],
    ["/api/tournament/evil/secret", 404],
    ["/api/tournament/agent-test/leak", 404],
    ["/api/runs/does-not-exist", 404],
    ["/api/nope", 404],
  ] as const)("%s ⇒ %i", async (path, status) => {
    const res = await get(port, path);
    expect(res.status).toBe(status);
    expect(res.text).not.toContain(repo.root);
    expect(res.text).not.toContain(repo.outside);
    expect(res.text).not.toContain("secret");
  });

  it("el listado de runs omite el enlace simbólico que sale de results/", async () => {
    const res = await get(port, "/api/runs");
    const ids = (res.json.data as { runId: string }[]).map((r) => r.runId);
    expect(ids).toContain(fx.runId);
    expect(ids).not.toContain("evil");
  });
});

describe("config/: solo el escenario con nombre y hash coincidentes", () => {
  const ref = (id: string, hash: string) => `/api/scenario-ref?id=${encodeURIComponent(id)}&hash=${hash}`;
  const hashOf = (rel: string) => scenarioHash(readFileSync(join(repo.root, "config", rel), "utf8"));

  it("devuelve nuestro mandato con nombre y hash de la cabecera", async () => {
    const res = await get(port, ref(fx.tournament.ref.id, fx.tournament.ref.hash));
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual(fx.tournament.ref);
  });

  it.each(["arena/scenarios.json", "candidates/x.json", "champion.json", "../config/champion.json", "%2e%2e/package.json"])(
    "%s ⇒ 404 aunque el hash coincida",
    async (id) => {
      let hash = "0000000000000000";
      try {
        hash = hashOf(id);
      } catch {
        /* no existe: basta con el hash nulo */
      }
      expect((await get(port, ref(id, hash))).status).toBe(404);
    },
  );

  it("hash distinto ⇒ 404; sin parámetros ⇒ 400", async () => {
    expect((await get(port, ref(fx.tournament.ref.id, "0000000000000000"))).status).toBe(404);
    expect((await get(port, "/api/scenario-ref")).status).toBe(400);
  });

  it("las rutas fuera de /api no sirven results/ ni config/", async () => {
    for (const path of ["/config/arena/scenarios.json", "/config/champion.json", `/results/${fx.runId}/summary.json`]) {
      expect((await get(port, path)).status).toBe(404);
    }
  });
});
