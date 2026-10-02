import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LOOPBACK, startViewerServer } from "../../server/http.js";
import { get } from "./helpers.js";

describe("servidor del visor: solo local y solo lectura", () => {
  let server: Server;
  let port: number;
  beforeAll(async () => {
    ({ server, port } = await startViewerServer({ repoRoot: mkdtempSync(join(tmpdir(), "viewer-http-")), env: { VIEWER_PORT: "0", HOST: "0.0.0.0" } }));
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("escucha en 127.0.0.1 aunque el entorno pida otra dirección", () => {
    expect((server.address() as AddressInfo).address).toBe(LOOPBACK);
  });

  it("Host ajeno ⇒ 403 (DNS rebinding)", async () => {
    expect((await get(port, "/api/bazaar/score", { host: "evil.example" })).status).toBe(403);
  });

  it("solo GET y HEAD ⇒ 405 para el resto", async () => {
    const res = await get(port, "/api/bazaar/score", { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe("GET, HEAD");
  });

  it("una ruta /api fuera del Bazaar ⇒ 404", async () => {
    expect((await get(port, "/api/runs")).status).toBe(404);
  });
});
