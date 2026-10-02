import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { startViewerServer } from "../../server/http.js";
import { get } from "./helpers.js";

function makeBazaarRepo(): { root: string; bazaarDir: string; outside: string } {
  const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-repo-"));
  const bazaarDir = join(root, "results", "bazaar-live");
  const day = join(bazaarDir, "2026-10-02");
  mkdirSync(day, { recursive: true });
  writeFileSync(
    join(day, "score.jsonl"),
    [
      JSON.stringify({ ts: "2026-10-02T10:00:00Z", tick: 1, score: 1, neg_points: 1, delta: { score: 1 }, cause: [] }),
      JSON.stringify({ ts: "2026-10-02T10:01:00Z", tick: 2, score: 1.5, neg_points: 1.5, delta: { score: 0.5 }, cause: [{ thread: 7, dealer: "abuela", action: "accept", price: 12 }] }),
      "not json at all",
    ].join("\n") + "\n",
  );
  const outside = mkdtempSync(join(tmpdir(), "viewer-bazaar-outside-"));
  writeFileSync(join(outside, "score.jsonl"), JSON.stringify({ tick: 99, score: 999 }) + "\n");
  symlinkSync(outside, join(bazaarDir, "evil"));
  return { root, bazaarDir, outside };
}

describe("/api/bazaar/score (solo lectura)", () => {
  let server: Server;
  let port: number;
  const repo = makeBazaarRepo();
  afterAll(() => new Promise<void>((resolve) => server?.close(() => resolve())));

  it("devuelve los snapshots válidos, nunca el enlace simbólico fuera de la raíz", async () => {
    ({ server, port } = await startViewerServer({ repoRoot: repo.root, env: { VIEWER_PORT: "0" } }));
    const res = await get(port, "/api/bazaar/score");
    expect(res.status).toBe(200);
    const data = res.json.data as { tick: number; score: number }[];
    expect(data).toEqual([
      expect.objectContaining({ tick: 1, score: 1 }),
      expect.objectContaining({ tick: 2, score: 1.5 }),
    ]);
    expect(res.text).not.toContain("999");
    expect(res.json.errors.length).toBeGreaterThan(0);
  });

  it("directorio vacío o inexistente: lista vacía, nunca un error", async () => {
    const emptyRoot = mkdtempSync(join(tmpdir(), "viewer-bazaar-empty-"));
    const empty = await startViewerServer({ repoRoot: emptyRoot, env: { VIEWER_PORT: "0" } });
    const res = await get(empty.port, "/api/bazaar/score");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: [], errors: [] });
    await new Promise<void>((resolve) => empty.server.close(() => resolve()));
  });

  it("VIEWER_BAZAAR_DIR: lee de un directorio distinto al del repo", async () => {
    const other = await startViewerServer({ repoRoot: mkdtempSync(join(tmpdir(), "viewer-bazaar-other-")), bazaarDir: repo.bazaarDir, env: { VIEWER_PORT: "0" } });
    const res = await get(other.port, "/api/bazaar/score");
    expect((res.json.data as { tick: number }[]).map((d) => d.tick)).toEqual([1, 2]);
    await new Promise<void>((resolve) => other.server.close(() => resolve()));
  });
});

describe("/api/bazaar/live", () => {
  it("sin BAZAAR_KEY en el entorno del servidor: {data: null}", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-nolive-"));
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarLiveDeps: { loadEnv: () => ({ url: "https://example.invalid", key: undefined }) },
    });
    const res = await get(port, "/api/bazaar/live");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ data: null, errors: [] });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("con clave: solo los campos de la cifra y el reloj; nunca rarest/luck/luck_private ni la clave", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-live-"));
    let calls = 0;
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarLiveDeps: {
        loadEnv: () => ({ url: "https://example.invalid", key: "team-secret-key" }),
        makeClient: () => {
          calls += 1;
          return {
            me: async () =>
              ({
                name: "Team 2",
                cash: 10,
                assets: [{ id: 1, kind: "card", ref: "x", your_value: 42 }],
                score: { score: 3.2, neg_points: 2.1, rank: 9, venue: "sat", rarest: "mega-rare", luck: 0.9, luck_private: { seed: 1 } },
              }) as never,
            clock: async () => ({ tick: 42, round: 2, round_name: "Saturday · El Rastro" }) as never,
          };
        },
      },
    });
    const res = await get(port, "/api/bazaar/live");
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual({ team: "Team 2", round: "Saturday · El Rastro", tick: 42, score: { score: 3.2, neg_points: 2.1, rank: 9, venue: "sat" } });
    expect(res.text).not.toMatch(/team-secret-key|rarest|luck/);
    expect(res.text).not.toContain("your_value");
    // 5 s de caché: una segunda llamada inmediata no vuelve a llamar al Bazaar.
    await get(port, "/api/bazaar/live");
    expect(calls).toBe(1);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("regresión: la forma real del Bazaar (score con campos null, round_name en el reloj) no deja ni score ni round en null", async () => {
    const root = mkdtempSync(join(tmpdir(), "viewer-bazaar-live-real-"));
    const { server, port } = await startViewerServer({
      repoRoot: root,
      env: { VIEWER_PORT: "0" },
      bazaarLiveDeps: {
        loadEnv: () => ({ url: "https://example.invalid", key: "team-secret-key" }),
        makeClient: () => ({
          me: async () =>
            ({
              name: "Team 2",
              cash: 0,
              assets: [],
              score: {
                team: "t02",
                name: "Team 2",
                score: 0,
                negotiating: 0,
                market: 0,
                neg_points: 0,
                mm_points: 0,
                duel_points: 0,
                ladder_points: 0,
                bench_efficiency: null,
                bench_points: null,
                bench_venue: null,
                level: 1,
                album_filled: 14,
                album_slots: 40,
                pages_complete: 0,
                rarest: { ref: "SAL-10", name: "Museo Lázaro Galdiano", serial: 1, print_run: 30, rarity: "rare" },
                luck: 0,
                deals: 0,
                badges: [],
                adjustments: [],
                frozen: false,
                venue: null,
                luck_private: 0,
                rank: 17,
              },
            }) as never,
          clock: async () =>
            ({
              tick: 27,
              round: 1,
              round_name: "Friday · El Rastro",
              tick_seconds: 60,
              paused: false,
              next_tick_in: 46.92,
            }) as never,
        }),
      },
    });
    const res = await get(port, "/api/bazaar/live");
    expect(res.status).toBe(200);
    expect(res.json.data).toEqual({
      team: "Team 2",
      round: "Friday · El Rastro",
      tick: 27,
      score: {
        score: 0,
        negotiating: 0,
        market: 0,
        neg_points: 0,
        mm_points: 0,
        duel_points: 0,
        ladder_points: 0,
        bench_efficiency: null,
        bench_points: null,
        bench_venue: null,
        level: 1,
        album_filled: 14,
        album_slots: 40,
        pages_complete: 0,
        deals: 0,
        badges: [],
        adjustments: [],
        frozen: false,
        venue: null,
        rank: 17,
      },
    });
    expect(res.json.data).not.toMatchObject({ score: null, round: null });
    expect(res.text).not.toMatch(/team-secret-key|rarest|luck_private/);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
