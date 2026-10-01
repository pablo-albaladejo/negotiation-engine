import { describe, expect, it } from "vitest";
import { createInMemoryAdapter, InMemoryRingClient, runClientLoop } from "../../src/protocol/adapter.js";
import {
  createHttpAgentClient,
  createHttpApp,
  createHttpRingClient,
  httpAdapterFromApp,
  type FetchLike,
} from "../../src/protocol/http.js";
import { createSimulatedRing, linearSellerRival } from "../../src/protocol/sim-ring.js";
import type { Brain } from "../../src/pipeline/pipeline.js";
import type { TurnInput, TurnOutput } from "../../src/protocol/schemas.js";
import { makeBrain, schemas } from "../pipeline/helpers.js";
import { clientContract, scriptedGame, serverContract, spyBrain } from "./contract.js";

const issueNames = () => ["pct"];
const health = () => ({ configVersion: 1, llmProvider: "none" });
const noSleep = async () => {};

/** fetch que enruta a una app Hono sin abrir puertos. */
function appFetch(app: { request: (url: string, init?: RequestInit) => Response | Promise<Response> }): FetchLike {
  return async (url, init) => app.request(new URL(url).pathname, init);
}

serverContract("en memoria", (brain) => createInMemoryAdapter(brain, { issueNames }));
serverContract("HTTP JSON (Hono)", (brain) => httpAdapterFromApp(createHttpApp(brain, { issueNames, health })));
serverContract("HTTP JSON (Hono) en hybrid", (brain) => httpAdapterFromApp(createHttpApp(brain, { issueNames, health, ringMode: "hybrid" })));

clientContract("en memoria", async (brain, turns) => {
  const ring = new InMemoryRingClient(turns);
  await runClientLoop(ring, createInMemoryAdapter(brain, { issueNames }), { sleep: noSleep });
  return { responses: ring.responses, errors: ring.errors };
});

clientContract("HTTP JSON por sondeo contra un ring simulado", async (brain, turns) => {
  const queue = [...turns];
  const ring = createSimulatedRing({ issueNames: ["pct"], nextTurn: () => queue.shift() ?? null });
  const client = createHttpRingClient({ baseUrl: "http://ring.test", fetch: appFetch(ring.app) });
  await runClientLoop(client, createInMemoryAdapter(brain, { issueNames }), { sleep: noSleep });
  return { responses: ring.responses, errors: ring.errors };
});

describe("adaptador HTTP JSON", () => {
  it("JSON malformado ⇒ 400 con error de protocolo y el siguiente turno se procesa", async () => {
    const spy = spyBrain();
    const app = createHttpApp(spy.brain, { issueNames, health });
    const bad = await app.request("/turn", { method: "POST", body: "{ no json", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toMatchObject({ error: { code: "protocol_error" } });
    expect(spy.calls()).toBe(0);
    const ok = await app.request("/turn", { method: "POST", body: JSON.stringify(scriptedGame[0]) });
    expect(ok.status).toBe(200);
    expect(schemas.turnOutput.safeParse(await ok.json()).success).toBe(true);
  });

  it("GET /health da versión y proveedor, sin datos del mandato", async () => {
    const app = createHttpApp(spyBrain().brain, { issueNames, health });
    const res = await app.request("/health");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ status: "ok", configVersion: 1, llmProvider: "none" });
    expect(JSON.stringify(body)).not.toMatch(/reserv|mandate|role/);
  });

  it("cliente HTTP con tiempo máximo: error tipado si el agente no responde", async () => {
    const hang: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal!.reason)));
    const client = createHttpAgentClient({ baseUrl: "http://agent.test", fetch: hang, timeoutMs: 20, issueNames: ["pct"] });
    await expect(client.turn(scriptedGame[0] as TurnInput)).rejects.toThrow(/red/);
  });
});

describe("modos servidor y cliente", () => {
  async function serverMode(brain: Brain): Promise<TurnOutput[]> {
    const client = createHttpAgentClient({
      baseUrl: "http://agent.test",
      fetch: appFetch(createHttpApp(brain, { issueNames, health })),
      issueNames: ["pct"],
    });
    const outputs: TurnOutput[] = [];
    for (const turn of scriptedGame) outputs.push(await client.turn(turn as TurnInput));
    return outputs;
  }

  async function clientMode(brain: Brain): Promise<TurnOutput[]> {
    const queue = [...scriptedGame];
    const ring = createSimulatedRing({ issueNames: ["pct"], nextTurn: () => queue.shift() ?? null });
    const client = createHttpRingClient({ baseUrl: "http://ring.test", fetch: appFetch(ring.app) });
    await runClientLoop(client, createInMemoryAdapter(brain, { issueNames }), { sleep: noSleep });
    return ring.responses;
  }

  it("la misma partida sembrada da mensajes idénticos en ambos modos", async () => {
    const server = await serverMode(makeBrain().brain);
    const client = await clientMode(makeBrain().brain);
    expect(client).toEqual(server);
    expect(server).toHaveLength(scriptedGame.length);
  });

  it("el cliente HTTP juega una partida completa contra nuestro servidor HTTP", async () => {
    const app = createHttpApp(makeBrain().brain, { issueNames, health });
    const client = createHttpAgentClient({ baseUrl: "http://agent.test", fetch: appFetch(app), issueNames: ["pct"] });
    const rival = linearSellerRival({ sessionId: "s1", rounds: 10, reservation: 6 });
    let last: TurnOutput | undefined;
    let round = 1;
    for (; round <= 10; round++) {
      const turn = rival(round, last);
      if (turn === null) break;
      last = await client.turn(turn as TurnInput);
      expect(schemas.turnOutput.safeParse(last).success).toBe(true);
      if (last.action !== "counter") break;
    }
    // Termina con acuerdo antes del límite: el rival concede hasta 6 % y nuestra reserva es 3 %.
    expect(last!.action).toBe("accept");
    expect(round).toBeLessThanOrEqual(10);
  });
});
