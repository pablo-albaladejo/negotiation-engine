import { describe, expect, it } from "vitest";
import { a2aAdapterFromApp, createA2AApp, sendMessageRequest } from "../../src/protocol/a2a.js";
import { createHttpApp, httpAdapterFromApp } from "../../src/protocol/http.js";
import { makeBrain } from "../pipeline/helpers.js";
import { scriptedGame, serverContract } from "./contract.js";

const issueNames = () => ["pct"];

serverContract("A2A JSON-RPC (spike, Hono sin Express)", (brain) => a2aAdapterFromApp(createA2AApp(brain, { issueNames })));

describe("spike A2A", () => {
  it("publica la tarjeta de agente sin datos del mandato", async () => {
    const app = createA2AApp(makeBrain().brain, { issueNames, url: "https://ring.example/a2a" });
    const card = (await (await app.request("/.well-known/agent-card.json")).json()) as Record<string, unknown>;
    expect(card).toMatchObject({ name: "negotiation-ring", supportedInterfaces: [{ url: "https://ring.example/a2a", protocolBinding: "JSONRPC" }] });
    expect(JSON.stringify(card)).not.toMatch(/reserv|mandat/i);
  });

  it("un turno por SendMessage devuelve la salida canónica en data y su texto en text", async () => {
    const app = createA2AApp(makeBrain().brain, { issueNames });
    const res = await app.request("/a2a", { method: "POST", body: JSON.stringify(sendMessageRequest({ sessionId: "a", round: 1, rivalAction: "message" })) });
    const body = (await res.json()) as { result: { message: { role: string; parts: Record<string, unknown>[] } } };
    expect(body.result.message.role).toBe("ROLE_AGENT");
    const [data, text] = body.result.message.parts;
    expect(data).toMatchObject({ data: { sessionId: "a", round: 1, action: "counter" } });
    expect(text).toMatchObject({ text: (data!.data as { text: string }).text });
  });

  it("JSON inválido ⇒ error JSON-RPC sin caída", async () => {
    const app = createA2AApp(makeBrain().brain, { issueNames });
    const res = await app.request("/a2a", { method: "POST", body: "{no json" });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: -32700 } });
  });

  it("la misma partida sembrada da las mismas decisiones por HTTP JSON y por A2A", async () => {
    const http = httpAdapterFromApp(createHttpApp(makeBrain().brain, { issueNames, health: () => ({ configVersion: 1, llmProvider: "none" }) }));
    const a2a = a2aAdapterFromApp(createA2AApp(makeBrain().brain, { issueNames }));
    for (const turn of scriptedGame) expect(await a2a.handle(turn)).toEqual(await http.handle(turn));
  });
});
