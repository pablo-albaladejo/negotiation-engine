import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { startViewerServer } from "../../server/http.js";
import { get } from "./helpers.js";

const THREAD_56 = {
  id: 56,
  status: "open",
  with: "abuela",
  topic: { sell: { assets: [23] } },
  closed_reason: null,
  messages: [
    { id: 269, tick: 29, sender: "abuela", text: "Hola, cariño, have you eaten? 13 P for it.", price: null },
    { id: 273, tick: 29, sender: "t02", text: "Hello, Abuela! I was hoping for 21 P.", price: null },
  ],
  standing_offers: [
    {
      id: 356,
      maker: "abuela",
      to: "t02",
      status: "open",
      give: { cash: 13, assets: [], types: [] },
      want: { cash: 0, assets: [{ id: 23, kind: "card", ref: "MAL-02" }], types: [] },
      final: false,
    },
    {
      id: 348,
      maker: "t02",
      to: "abuela",
      status: "cancelled",
      give: { cash: 0, assets: [], types: ["card:MAL-02"] },
      want: { cash: 21, assets: [], types: [] },
      final: false,
    },
  ],
};

const THREAD_222 = {
  id: 222,
  status: "deal",
  with: "bazaar-team-7",
  topic: { buy: { card: "SAL-05" } },
  closed_reason: null,
  messages: [{ id: 1, tick: 90, sender: "t02", text: "Deal.", price: 10 }],
  standing_offers: [],
};

function makeBazaarDir(): string {
  const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-threads-"));
  const day = join(root, "2026-10-02");
  mkdirSync(day, { recursive: true });
  writeFileSync(
    join(day, "thread-56.jsonl"),
    [JSON.stringify({ ts: "2026-10-02T10:00:00Z", tick: 29, action: "open", thread: 56, reservation: 24 }), "not json at all"].join("\n") + "\n",
  );
  return root;
}

describe("/api/bazaar/threads (solo lectura)", () => {
  it("sin BAZAAR_KEY: lista vacía, nunca llama al Bazaar", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-threads-nokey-"));
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarThreadsDeps: { loadEnv: () => ({ url: "https://example.invalid", key: undefined }) },
    });
    const res = await get(port, "/api/bazaar/threads");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: [], errors: [] });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("con clave: hilos con mensajes/sender/text, ofertas abiertas (give/want cash + assets), y nuestra traza local; nunca la clave", async () => {
    const bazaarDir = makeBazaarDir();
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-threads-repo-"));
    let server: Server;
    let port: number;
    ({ server, port } = await startViewerServer({
      repoRoot: root,
      bazaarDir,
      env: { VIEWER_PORT: "0" },
      bazaarThreadsDeps: {
        loadEnv: () => ({ url: "https://example.invalid", key: "team-secret-key" }),
        makeClient: () => ({
          myThreads: async () =>
            ({ threads: [{ id: 56, status: "open", with: "abuela" }, { id: 222, status: "deal", with: "bazaar-team-7" }] }) as never,
          thread: async (id: number) => (id === 56 ? (THREAD_56 as never) : (THREAD_222 as never)),
        }),
      },
    }));
    const res = await get(port, "/api/bazaar/threads");
    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/team-secret-key/);
    const data = res.json.data as Array<{ id: number; with: string | null; status: string; messages: unknown[]; standing_offers: unknown[]; trace: unknown[] }>;
    // La más reciente / abierta primero.
    expect(data.map((t) => t.id)).toEqual([222, 56]);
    const t56 = data.find((t) => t.id === 56)!;
    expect(t56.messages).toEqual([
      { sender: "abuela", text: "Hola, cariño, have you eaten? 13 P for it.", ts: 29 },
      { sender: "t02", text: "Hello, Abuela! I was hoping for 21 P.", ts: 29 },
    ]);
    // Solo la oferta "open" (no la "cancelled"), con give/want.cash y las refs de carta.
    expect(t56.standing_offers).toEqual([
      { maker: "abuela", give: { cash: 13 }, want: { cash: 0 }, assets: ["MAL-02"], final: false },
    ]);
    expect(t56.trace).toEqual([{ ts: "2026-10-02T10:00:00Z", tick: 29, action: "open", thread: 56, reservation: 24 }]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("estados cerrados con closed_reason (p.ej. walked por no_progress) se devuelven tal cual", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-threads-walked-"));
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarThreadsDeps: {
        loadEnv: () => ({ url: "https://example.invalid", key: "k" }),
        makeClient: () => ({
          myThreads: async () => ({ threads: [{ id: 99, status: "closed", with: "abuela" }] }) as never,
          thread: async () =>
            ({ id: 99, status: "closed", closed_reason: "no_progress", with: "abuela", topic: null, messages: [], standing_offers: [] }) as never,
        }),
      },
    });
    const res = await get(port, "/api/bazaar/threads");
    const data = res.json.data as Array<{ status: string; closed_reason: string | null }>;
    expect(data).toEqual([{ id: 99, with: "abuela", topic: null, status: "closed", closed_reason: "no_progress", messages: [], standing_offers: [], trace: [] }]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});

describe("/api/bazaar/duels (solo lectura)", () => {
  it("sin BAZAAR_KEY: lista vacía", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-duels-nokey-"));
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarDuelsDeps: { loadEnv: () => ({ url: "https://example.invalid", key: undefined }) },
    });
    const res = await get(port, "/api/bazaar/duels");
    expect(res.json).toEqual({ data: [], errors: [] });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("con clave: duelos abiertos y terminados marcados con done; nunca la clave", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-duels-repo-"));
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarDuelsDeps: {
        loadEnv: () => ({ url: "https://example.invalid", key: "team-secret-key" }),
        makeClient: () => ({
          duels: async (done?: boolean) =>
            done
              ? ({ duels: [{ id: 2, role: "buyer", your_limit: 5, status: "won", rival: "team-x" }] } as never)
              : ({ duels: [{ id: 1, role: "seller", your_limit: 10, status: "open", rival: "team-y" }] } as never),
        }),
      },
    });
    const res = await get(port, "/api/bazaar/duels");
    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/team-secret-key/);
    expect(res.json.data).toEqual([
      { id: 1, role: "seller", your_limit: 10, status: "open", rival: "team-y", done: false },
      { id: 2, role: "buyer", your_limit: 5, status: "won", rival: "team-x", done: true },
    ]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
