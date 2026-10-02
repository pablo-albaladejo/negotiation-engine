import { describe, expect, it } from "vitest";
import { runVenueCli, type VenueApi } from "../../src/bazaar/venue/main.js";
import { planVenue, VENUE_COST } from "../../src/bazaar/venue/venue.js";
import type { Me } from "../../src/bazaar/shared/schemas.js";

const me = (level: number, cash: number, venue: string | null = null) => ({ id: "t02", cash, level, assets: [], venue }) as unknown as Me;
const RASTRO = [{ venue: "rastro", name: "El Rastro", owner: "world" }];

function fakeApi(m: Me) {
  const posts: unknown[] = [];
  const api: VenueApi = {
    me: async () => m,
    venues: async () => ({ venues: RASTRO }),
    clock: async () => ({ tick: 47, t_hours: 3.5 }) as never,
    openVenue: async (body) => {
      posts.push(body);
      return { venue: "v-t02", broker_key: "bk-secret" };
    },
  };
  return { api, posts };
}

describe("venue: preparar nuestro mercado", () => {
  it("cuerpo: nombre, comisiones 0 (las comisiones nunca puntúan) y mecanismo auto por defecto", () => {
    const plan = planVenue(me(2, 413), RASTRO, { tick: 1, t_hours: 4 });
    expect(plan.body).toEqual({ name: "Team 2 · El Rastro Express", fee_bps: 0, fee_per_card: 0, rules: { mechanism: "auto" }, description: expect.any(String) });
    expect(plan.cost).toBe(270);
    expect(VENUE_COST).toBe(270);
    expect(plan.ok).toBe(true);
    expect(planVenue(me(2, 413), RASTRO, { tick: 1 }, { mechanism: "board" }).body.rules.mechanism).toBe("board");
  });

  it("no apto con nivel < 2, caja < 270, nombre > 40 o un mercado ya abierto; el reloj solo informa", () => {
    expect(planVenue(me(1, 413), RASTRO, { tick: 1 }).ok).toBe(false);
    expect(planVenue(me(2, 269), RASTRO, { tick: 1 }).ok).toBe(false);
    expect(planVenue(me(2, 413), RASTRO, { tick: 1 }, { name: "x".repeat(41) }).ok).toBe(false);
    expect(planVenue(me(2, 413, "v-t02"), RASTRO, { tick: 1 }).ok).toBe(false);
    const early = planVenue(me(2, 413), RASTRO, { tick: 1, t_hours: 0.8 });
    expect(early.ok).toBe(true);
    expect(early.checks.find((c) => c.name === "trading start")).toMatchObject({ ok: false, info: true });
  });

  it("--dry-run imprime el plan y nunca hace POST, aunque cumpla los requisitos", async () => {
    const { api, posts } = fakeApi(me(2, 413));
    const lines: string[] = [];
    expect(await runVenueCli(["--dry-run"], (l) => lines.push(l), api)).toBe(0);
    expect(posts).toEqual([]);
    const text = lines.join("\n");
    expect(text).toContain('"fee_bps":0');
    expect(text).toContain("cost: 270 P");
    expect(text).toContain("DRY-RUN: nothing sent.");
  });

  it("sin --dry-run pero sin --confirm: se niega; con nivel 1 se niega aunque haya --confirm", async () => {
    const a = fakeApi(me(2, 413));
    expect(await runVenueCli([], () => {}, a.api)).toBe(2);
    expect(a.posts).toEqual([]);
    const b = fakeApi(me(1, 413));
    const lines: string[] = [];
    expect(await runVenueCli(["--confirm"], (l) => lines.push(l), b.api)).toBe(2);
    expect(b.posts).toEqual([]);
    expect(lines.join("\n")).toContain("NOT eligible");
  });

  it("solo sin --dry-run, con --confirm y requisitos cumplidos hace el POST; la broker key no se imprime", async () => {
    const { api, posts } = fakeApi(me(2, 413));
    const lines: string[] = [];
    const cwd = process.cwd();
    const tmp = await import("node:fs/promises").then((fs) => fs.mkdtemp(`${(process.env.TMPDIR ?? "/tmp").replace(/\/$/, "")}/venue-`));
    process.chdir(tmp);
    try {
      expect(await runVenueCli(["--confirm"], (l) => lines.push(l), api)).toBe(0);
    } finally {
      process.chdir(cwd);
    }
    expect(posts).toHaveLength(1);
    expect(lines.join("\n")).not.toContain("bk-secret");
  });
});
