import { describe, expect, it } from "vitest";
import { BazaarClient, BazaarError, TokenBucket } from "../../src/bazaar/shared/client.js";
import { loadBazaarEnv } from "../../src/bazaar/shared/env.js";

const KEY = "tk-test-secret";

function fakeTime() {
  let t = 1_000_000;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      t += ms;
    },
    sleeps,
    advance: (ms: number) => (t += ms),
  };
}

type Reply = { status: number; body: unknown };

function fakeFetch(replies: Reply[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = replies.shift() ?? { status: 200, body: {} };
    return new Response(JSON.stringify(r.body), { status: r.status });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

function client(replies: Reply[], extra: Partial<ConstructorParameters<typeof BazaarClient>[0]> = {}) {
  const time = fakeTime();
  const f = fakeFetch(replies);
  const c = new BazaarClient({ url: "https://bz.test/", key: KEY, fetch: f.fn, now: time.now, sleep: time.sleep, ...extra });
  return { c, time, f };
}

describe("BazaarClient", () => {
  it("envía la clave solo en la cabecera X-Team-Key y valida la respuesta con Zod (campos extra permitidos)", async () => {
    const { c, f } = client([{ status: 200, body: { tick: 7, next_tick_in: 12, paused: false, extra_field: 1 } }]);
    const clock = await c.clock();
    expect(clock.tick).toBe(7);
    expect(f.calls[0]!.url).toBe("https://bz.test/api/clock");
    expect((f.calls[0]!.init.headers as Record<string, string>)["X-Team-Key"]).toBe(KEY);
  });

  it("mapea errores 4xx a BazaarError con code, status y extra; sin la clave en el mensaje", async () => {
    const { c } = client([{ status: 400, body: { error: "insufficient_cash", message: "not enough", needed: 50 } }]);
    const err = await c.accept(3).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BazaarError);
    const be = err as BazaarError;
    expect(be.code).toBe("insufficient_cash");
    expect(be.status).toBe(400);
    expect(be.extra.needed).toBe(50);
    expect(be.message).not.toContain(KEY);
  });

  it("401 sin código es bad_key; respuesta inválida es bad_response", async () => {
    const { c } = client([{ status: 401, body: {} }, { status: 200, body: { nope: true } }]);
    await expect(c.me()).rejects.toMatchObject({ code: "bad_key" });
    await expect(c.clock()).rejects.toMatchObject({ code: "bad_response" });
  });

  it("reintenta rate_limited con espera creciente", async () => {
    const { c, f, time } = client([
      { status: 429, body: { error: "rate_limited" } },
      { status: 429, body: { error: "rate_limited" } },
      { status: 200, body: { tick: 1 } },
    ]);
    await expect(c.clock()).resolves.toMatchObject({ tick: 1 });
    expect(f.calls).toHaveLength(3);
    expect(time.sleeps.filter((s) => s === 250 || s === 500)).toEqual([250, 500]);
  });

  it("wait_for_tick con waitOnTick duerme next_tick_in y reintenta", async () => {
    const { c, f, time } = client(
      [
        { status: 429, body: { error: "wait_for_tick", next_tick_in: 3 } },
        { status: 200, body: { message: { id: 1, price: 20 } } },
      ],
      { waitOnTick: true },
    );
    await c.say(5, "hola", 20);
    expect(f.calls).toHaveLength(2);
    expect(time.sleeps).toContain(3200);
    expect(JSON.parse(f.calls[0]!.init.body as string)).toEqual({ text: "hola", price: 20 });
  });

  it("wait_for_tick sin waitOnTick se lanza para que el bucle lo gestione", async () => {
    const { c, f } = client([{ status: 429, body: { error: "wait_for_tick", next_tick_in: 3 } }]);
    await expect(c.accept(1)).rejects.toMatchObject({ code: "wait_for_tick", status: 429 });
    expect(f.calls).toHaveLength(1);
  });

  it("no repite un POST tras un fallo de red", async () => {
    let n = 0;
    const fetchFn = (async () => {
      n += 1;
      throw new TypeError("boom");
    }) as unknown as typeof fetch;
    const time = fakeTime();
    const c = new BazaarClient({ url: "https://bz.test", key: KEY, fetch: fetchFn, now: time.now, sleep: time.sleep });
    await expect(c.accept(1)).rejects.toMatchObject({ code: "network" });
    expect(n).toBe(1);
  });
});

describe("TokenBucket", () => {
  it("no supera 4 peticiones por segundo tras la ráfaga", async () => {
    const time = fakeTime();
    const bucket = new TokenBucket(4, 2, time.now, time.sleep);
    const start = time.now();
    const stamps: number[] = [];
    for (let i = 0; i < 12; i++) {
      await bucket.take();
      stamps.push(time.now() - start);
    }
    // 2 de ráfaga, luego una cada 250 ms: la 12.ª no antes de 2,5 s
    expect(stamps[1]).toBe(0);
    expect(stamps[11]!).toBeGreaterThanOrEqual(2500);
    for (let i = 0; i < stamps.length; i++) {
      const windowStart = stamps[i]! - 1000;
      const inWindow = stamps.filter((s) => s > windowStart && s <= stamps[i]!).length;
      expect(inWindow).toBeLessThanOrEqual(5);
    }
  });
});

describe("loadBazaarEnv", () => {
  it("usa la URL por defecto y no inventa clave", () => {
    expect(loadBazaarEnv({ env: {} })).toEqual({ url: "https://bazaar.causaprima.ai", key: undefined });
    expect(loadBazaarEnv({ env: { BAZAAR_URL: "http://x/", BAZAAR_KEY: " k " } })).toEqual({ url: "http://x", key: "k" });
  });
});
