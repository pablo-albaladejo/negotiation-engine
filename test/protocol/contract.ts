import { describe, expect, it } from "vitest";
import type { RingAdapter } from "../../src/protocol/adapter.js";
import type { Brain } from "../../src/pipeline/pipeline.js";
import type { TurnOutput } from "../../src/protocol/schemas.js";
import { makeBrain, schemas } from "../pipeline/helpers.js";

/** Cerebro espía: cuenta llamadas y permite forzar salidas inválidas o excepciones. */
export function spyBrain(mode: "normal" | "invalid" | "throw" = "normal") {
  const { brain, store } = makeBrain();
  let calls = 0;
  const spy: Brain = {
    async turn(raw) {
      calls++;
      if (mode === "throw") throw new Error("fallo interno");
      if (mode === "invalid") return { sessionId: "s1", round: 1, action: "counter", text: "sin oferta" } as unknown as TurnOutput;
      return brain.turn(raw);
    },
    fallback: (raw) => brain.fallback(raw),
  };
  return { brain: spy, store, calls: () => calls };
}

export const validTurn = { sessionId: "s1", round: 1, rivalAction: "offer", rivalOffer: { pct: 2 }, text: "te ofrezco 5 %" };
export const malformedTurns: unknown[] = [
  { round: 1, rivalAction: "offer" },
  { sessionId: "s1", round: 0, rivalAction: "message" },
  { sessionId: "s1", round: 1, rivalAction: "offer", rivalOffer: { pct: 2, day: 10 } },
  { sessionId: "s1", round: 1, rivalAction: "message", mandate: { role: "seller" } },
  "no es un objeto",
];

/** Una partida sembrada para comparar modos: rival que concede despacio. */
export const scriptedGame: unknown[] = [1, 1.5, 2, 2.5, 3].map((pct, k) => ({
  sessionId: "g",
  round: k + 1,
  roundLimit: 10,
  rivalAction: "offer",
  rivalOffer: { pct },
}));

/** Batería común en modo servidor: se ejecuta contra cualquier `RingAdapter`. */
export function serverContract(name: string, makeAdapter: (brain: Brain) => RingAdapter) {
  describe(`contrato de adaptador (servidor): ${name}`, () => {
    it("turno válido ⇒ salida que cumple el esquema y repite sesión y ronda", async () => {
      const { brain } = spyBrain();
      const result = await makeAdapter(brain).handle(validTurn);
      expect(result.status).toBe("ok");
      if (result.status !== "ok") return;
      expect(schemas.turnOutput.safeParse(result.output).success).toBe(true);
      expect(result.output).toMatchObject({ sessionId: "s1", round: 1 });
    });

    it.each(malformedTurns.map((t, k) => [k, t] as const))("entrada malformada %s ⇒ error de protocolo sin invocar al cerebro", async (_k, raw) => {
      const spy = spyBrain();
      const adapter = makeAdapter(spy.brain);
      const result = await adapter.handle(raw);
      expect(result.status).toBe("protocol_error");
      if (result.status === "protocol_error") expect(result.error.error.code).toBe("protocol_error");
      expect(spy.calls()).toBe(0);
      const next = await adapter.handle(validTurn);
      expect(next.status).toBe("ok");
    });

    it("salida inválida del cerebro ⇒ no se envía; sale la ruta de emergencia", async () => {
      const result = await makeAdapter(spyBrain("invalid").brain).handle(validTurn);
      expect(result.status).toBe("ok");
      if (result.status === "ok") expect(schemas.turnOutput.safeParse(result.output).success).toBe(true);
    });

    it("excepción del cerebro ⇒ respuesta válida", async () => {
      const result = await makeAdapter(spyBrain("throw").brain).handle(validTurn);
      expect(result.status).toBe("ok");
      if (result.status === "ok") expect(schemas.turnOutput.safeParse(result.output).success).toBe(true);
    });

    it("oferta estructurada con texto contradictorio ⇒ se registra la estructurada", async () => {
      const { brain, store } = spyBrain();
      await makeAdapter(brain).handle(validTurn);
      expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 2 }]);
    });
  });
}

/** Batería común en modo cliente: `play(brain, turnos)` juega los turnos por el bucle de sondeo. */
export function clientContract(
  name: string,
  play: (brain: Brain, turns: unknown[]) => Promise<{ responses: TurnOutput[]; errors: unknown[] }>,
) {
  describe(`contrato de adaptador (cliente): ${name}`, () => {
    it("juega todos los turnos con salidas que cumplen el esquema", async () => {
      const { responses, errors } = await play(spyBrain().brain, scriptedGame);
      expect(errors).toHaveLength(0);
      expect(responses.length).toBeGreaterThan(0);
      for (const r of responses) expect(schemas.turnOutput.safeParse(r).success).toBe(true);
    });

    it("un turno malformado se reporta al ring y el bucle sigue", async () => {
      const turns = [scriptedGame[0], { sessionId: "g", round: 0 }, scriptedGame[1]];
      const { responses, errors } = await play(spyBrain().brain, turns);
      expect(errors).toHaveLength(1);
      expect(responses).toHaveLength(2);
    });

    it("salida inválida del cerebro ⇒ respuesta de emergencia válida", async () => {
      const { responses } = await play(spyBrain("invalid").brain, [validTurn]);
      expect(responses).toHaveLength(1);
      expect(schemas.turnOutput.safeParse(responses[0]).success).toBe(true);
    });
  });
}
