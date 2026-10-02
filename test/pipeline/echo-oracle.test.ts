import { describe, expect, it } from "vitest";
import type { ParserFigure, TextParser } from "../../src/llm/parser.js";
import { resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";
import type { TurnOutput } from "../../src/protocol/schemas.js";
import { makeBrain } from "./helpers.js";

/**
 * La respuesta a una cifra no firme del rival no puede depender de la distancia de esa cifra a
 * nuestra reserva: si dependiera (eco sí/no, aceptar/bloquear, otra plantilla), el rival acotaría
 * la reserva con unas pocas sondas.
 */
const mandate = { role: "buyer" as const, reservation: { pct: 1 } };
const t = (round: number, extra: Record<string, unknown>) => ({ sessionId: "s1", round, roundLimit: 10, ...extra });
const xs = Array.from({ length: 39 }, (_, i) => Math.round((i + 1) * 10) / 100);
const es = (x: number) => String(x).replace(".", ",");

type Probe = { out: TurnOutput; echoed: string };

/** Sustituye la cifra repetida del rival por un marcador: lo único que puede variar con X. */
const shape = ({ out, echoed }: Probe) => ({
  action: out.action,
  offer: "offer" in out ? out.offer : null,
  text: out.text.replace(new RegExp(`(?<![\\d.,])${echoed.replace(/[.]/g, "\\.")}(?![\\d]|[.,]\\d)`, "gu"), "<X>"),
});

async function probe(round: number, text: string, echoed: string, parser?: TextParser, runtime = resolveRuntimeConfig({})): Promise<Probe> {
  const { brain } = makeBrain({ mandate, runtime, ...(parser ? { parser } : {}) });
  await brain.turn(t(1, { rivalAction: "message", text: "Hola" }));
  return { out: await brain.turn(t(round, { rivalAction: "message", text })), echoed };
}

describe("la petición de confirmar no es un oráculo de la reserva", () => {
  it.each([
    ["es, extremo inferior", (x: number) => `Podemos ir entre ${es(x)} y 4 %`, es],
    ["es, extremo superior", (x: number) => `Podemos ir entre 0,05 y ${es(x)} %`, es],
    ["en, extremo inferior", (x: number) => `We could do between ${x} and 4 %`, (x: number) => String(x)],
  ])("rango (%s): misma estructura y formulación para toda X en [0,1; 3,9] con la reserva en 1", async (_name, say, fmt) => {
    for (const round of [2, 9]) {
      const probes = await Promise.all(xs.map((x) => probe(round, say(x), fmt(x))));
      for (const p of probes) {
        expect(p.out.action).toBe("counter");
        expect(p.out.text, p.out.text).toContain(p.echoed);
      }
      const shapes = new Set(probes.map((p) => JSON.stringify(shape(p))));
      expect([...shapes], [...shapes].join("\n")).toHaveLength(1);
    }
  });

  it("cifra solo LLM: misma estructura para toda X, también en la última ronda (nunca acepta ni bloquea)", async () => {
    const runtime = resolveRuntimeConfig({ parser: { acceptWordNumbers: "llm-only" } });
    const llm = (x: number): TextParser => ({
      name: "fake-llm",
      parse: async () => ({ intent: "offer", claims: [], tactics: [], injectionSuspected: false, language: "es", figures: [{ issue: "pct", value: x, evidence: "punto" } satisfies ParserFigure] }),
    });
    for (const round of [2, 9, 10]) {
      const probes = await Promise.all([...xs, 6, 8, 9.5].map((x) => probe(round, "Te doy lo del punto que hablamos", "@@sin-eco@@", llm(x), runtime)));
      for (const p of probes) expect(p.out.action).not.toBe("accept");
      const shapes = new Set(probes.map((p) => JSON.stringify(shape(p))));
      expect([...shapes], [...shapes].join("\n")).toHaveLength(1);
    }
  });
});
