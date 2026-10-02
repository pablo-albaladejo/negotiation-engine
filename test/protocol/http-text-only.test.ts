import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createHttpApp, toCanonicalTurn } from "../../src/protocol/http.js";
import type { RingMode } from "../../src/pipeline/runtime-config.js";
import { champion, makeBrain } from "../pipeline/helpers.js";

const fixtures = JSON.parse(readFileSync("test/fixtures/ring/text-only/turns.json", "utf8")) as { name: string; body: Record<string, unknown> }[];
const body = (name: string) => fixtures.find((f) => f.name === name)!.body;

function app(mode: RingMode) {
  const run = makeBrain();
  const http = createHttpApp(run.brain, { ringMode: mode, issueNames: () => champion.issues.map((i) => i.name), health: () => ({ configVersion: 1, llmProvider: "none" }) });
  const post = async (payload: unknown) => {
    const res = await http.request("/turn", { method: "POST", body: JSON.stringify(payload), headers: { "content-type": "application/json" } });
    return { status: res.status, json: (await res.json()) as Record<string, unknown> };
  };
  return { ...run, post };
}

describe("adaptador HTTP según ring.mode", () => {
  it("text-only: mensaje solo con texto ⇒ message, ronda derivada, sin oferta, respuesta solo con texto", async () => {
    const { post, trace } = app("text-only");
    const first = await post(body("solo-texto"));
    expect(first.status).toBe(200);
    expect(Object.keys(first.json).sort()).toEqual(["round", "sessionId", "text"]);
    expect(first.json.round).toBe(1);
    const input = trace.records.find((r) => r.box === "input")!.input;
    expect(input).toMatchObject({ rivalAction: "message", hasOffer: false, hasText: true });
    const second = await post(body("solo-texto-con-estructura-descartada"));
    expect(second.json.round).toBe(2);
    expect(trace.records.filter((r) => r.box === "input").at(-1)!.input).toMatchObject({ rivalAction: "message", hasOffer: false });
    const timed = await post(body("solo-texto-con-tiempos"));
    expect(timed.json.round).toBe(7);
    expect(trace.records.some((r) => r.box === "output")).toBe(true);
  });

  it("hybrid: la acción del ring prevalece y la respuesta lleva acción y oferta", async () => {
    const { post, store } = app("hybrid");
    const opening = await post({ sessionId: "s1", text: "Hola" });
    expect(opening.json).toMatchObject({ round: 1, action: "counter" });
    const deal = await post({ sessionId: "s1", rivalAction: "accept", text: "no, gracias" });
    expect(deal.json).toMatchObject({ round: 2, action: "accept", offer: opening.json.offer });
    expect(store.get("s1")!.agreementOrigin).toBe("ring-action");
  });

  it("structured: el turno no se toca (sin ronda ⇒ error de protocolo)", async () => {
    const { post } = app("structured");
    expect((await post({ sessionId: "s1", text: "Hola" })).status).toBe(400);
    expect(toCanonicalTurn({ a: 1 }, "structured", () => 1)).toEqual({ a: 1 });
  });
});
