import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BazaarModel, ModelPostBlocked, ReadOnlyBazaarClient, readOnlyFetch } from "../server/bazaar/bazaar-model.js";
import { startViewerServer } from "../server/http.js";

/**
 * Viewer model guardrails: `/api/bazaar/model` must never reach a game POST, and private data
 * (private value, `your_limit`, reserves) never leaves 127.0.0.1.
 */

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Fake Bazaar: answers GET with a minimal state (one live duel, one acceptable offer) and records each method. */
function fakeBazaar() {
  const methods: string[] = [];
  const fetchFn = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const method = (init?.method ?? "GET").toUpperCase();
    methods.push(method);
    if (method !== "GET") throw new Error(`the fake Bazaar got a ${method}`);
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    if (path === "/api/clock") return json({ tick: 50, next_tick_in: 5, limits: { accepts_per_team_per_tick: 1, messages_per_side_per_tick: 1, max_open_threads_per_team: 6, offers_per_team_per_tick: 12, max_open_offers_per_team: 30 } });
    if (path === "/api/me") return json({ id: "t02", name: "Team 2", cash: 300, level: 2, unlocked: [], assets: [{ id: 1, ref: "SAL-01", kind: "card", your_value: 20 }] });
    if (path === "/api/duels") return json({ duels: [{ id: 9, role: "seller", rival: "Rival X", your_limit: 60, status: "live", deadline: 60, round: 1, rival_offer: 95, messages: [{ from: "you", price: 100 }, { from: "rival", price: 95 }] }] });
    if (path === "/api/schedule") return json({ now_hours: 5, upcoming: [] });
    if (path === "/api/dealers") return json({ dealers: [] });
    if (path === "/api/me/threads") return json({ threads: [] });
    if (path === "/api/me/offers") return json({ offers: [] });
    if (path.startsWith("/api/venues/")) return json({ offers: [] });
    return json({ error: "not_found" }, 404);
  }) as typeof fetch;
  return { methods, fetchFn };
}

describe("viewer model guard: never POSTs to the game", () => {
  it("readOnlyFetch rejects every non-GET without calling the real fetch", async () => {
    let called = 0;
    let blocked = 0;
    const f = readOnlyFetch((async () => {
      called += 1;
      return json({});
    }) as typeof fetch, () => (blocked += 1));
    for (const method of ["POST", "DELETE", "PUT", "PATCH"]) await expect(f("https://bazaar.example/api/offers/1/accept", { method })).rejects.toBeInstanceOf(ModelPostBlocked);
    expect(called).toBe(0);
    expect(blocked).toBe(4);
    await f("https://bazaar.example/api/clock");
    expect(called).toBe(1);
  });

  it("the read-only client blocks every write method of the Bazaar client before the network", async () => {
    const { methods, fetchFn } = fakeBazaar();
    const client = new ReadOnlyBazaarClient({ url: "https://bazaar.example", key: "k", fetch: fetchFn, ratePerSec: 1000, burst: 1000 });
    await expect(client.accept(1)).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.acceptOffer(1)).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.say(1, "hi", 10)).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.openThread("abuela", { buy: { card: "SAL-09" } })).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.closeThread(1)).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.postOffer({ venue: "rastro", give: {}, want: {} })).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.cancelOffer(1)).rejects.toBeInstanceOf(ModelPostBlocked);
    await expect(client.raw("POST", "/api/duels/9/accept", {})).rejects.toBeInstanceOf(ModelPostBlocked);
    expect(methods).toEqual([]);
    expect(client.blocked).toBe(8);
  });

  it("a full model cycle (GameState, routes in dry-run, arbitration) only sends GET", async () => {
    const { methods, fetchFn } = fakeBazaar();
    const model = new BazaarModel(mkdtempSync(join(tmpdir(), "model-guard-")), { fetch: fetchFn, ratePerSec: 1000, loadEnv: () => ({ url: "https://bazaar.example", key: "k" }) });
    const res = await model.get();
    const data = res.body.data as { available: boolean; safety: { blocked: number }; routes: { route: string; intents: unknown[] }[] };
    expect(data.available).toBe(true);
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.every((m) => m === "GET")).toBe(true);
    expect(data.safety.blocked).toBe(0);
    expect(model.blocked).toBe(0);
  });

  it("the model module never calls an execute path", () => {
    const src = readFileSync(new URL("../server/bazaar/bazaar-model.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/\.execute\(/);
    expect(src).not.toMatch(/dryRun:\s*false/);
  });
});

describe("viewer model guard: private limits stay on localhost", () => {
  const get = (port: number, path: string, host: string, method = "GET") =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = request({ host: "127.0.0.1", port, path, method, headers: { host } }, (res) => {
        let body = "";
        res.on("data", (c: Buffer) => (body += c.toString()));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      });
      req.on("error", reject);
      req.end();
    });

  it("binds to 127.0.0.1 only, refuses foreign Host headers and non-GET methods on /api/bazaar/model", async () => {
    const { fetchFn } = fakeBazaar();
    const dir = mkdtempSync(join(tmpdir(), "model-host-"));
    const { server, port } = await startViewerServer({
      repoRoot: dir,
      bazaarDir: dir,
      env: { VIEWER_PORT: "0", HOST: "0.0.0.0" },
      bazaarModelDeps: { fetch: fetchFn, ratePerSec: 1000, loadEnv: () => ({ url: "https://bazaar.example", key: "k" }) },
      bazaarBoardDeps: { fetch: fetchFn, loadEnv: () => ({ url: "https://bazaar.example", key: undefined }), snapshotsFile: null, lessonsFile: null },
    });
    try {
      expect((server.address() as { address: string }).address).toBe("127.0.0.1");
      const foreign = await get(port, "/api/bazaar/model", "evil.example");
      expect(foreign.status).toBe(403);
      expect(foreign.body).not.toContain("your_limit");
      expect(foreign.body).not.toContain("duelLimit");
      const rebinding = await get(port, "/api/bazaar/model", `evil.example:${port}`);
      expect(rebinding.status).toBe(403);
      const post = await get(port, "/api/bazaar/model", `127.0.0.1:${port}`, "POST");
      expect(post.status).toBe(405);
      const local = await get(port, "/api/bazaar/model", `127.0.0.1:${port}`);
      expect(local.status).toBe(200);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
