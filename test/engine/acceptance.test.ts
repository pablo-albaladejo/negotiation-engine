import { describe, expect, it } from "vitest";
import { computeTime, decideAcceptance, type AcceptanceInput, type TimeInfo } from "../../src/engine/acceptance.js";
import { pctIssue } from "./arbitraries.js";

// Comprador con reserva 3 % ⇒ u(reserva) = 0.3.
const mandate = { role: "buyer" as const, reservation: { pct: 3 } };
const mid: TimeInfo = { t: 0.5, source: "ring-rounds", isLastMove: false, defaultHorizonReached: false };
const late: TimeInfo = { ...mid, t: 0.95 };
const last: TimeInfo = { t: 1, source: "ring-rounds", isLastMove: true, defaultHorizonReached: false };
const horizon: TimeInfo = { t: 1, source: "default-horizon", isLastMove: false, defaultHorizonReached: true };

function input(pct: number | undefined, time: TimeInfo, extra: Partial<AcceptanceInput> = {}): AcceptanceInput {
  const base: AcceptanceInput = {
    issues: [pctIssue],
    mandate,
    ourNextUtility: 0.8,
    time,
    acceptMargin: 0.02,
    acTimeThreshold: 0.9,
    rivalCanRespond: false,
    ...extra,
  };
  return pct === undefined ? base : { ...base, rivalCurrent: { pct } };
}

describe("tabla de aceptación", () => {
  it.each([
    ["AC_next: u ≥ siguiente − margen", input(7.8, mid), "accept", "ac-next"],
    ["AC_next justo en el margen", input(7.8, mid, { ourNextUtility: 0.8 }), "accept", "ac-next"],
    ["por debajo de AC_next a mitad de partida", input(7.7, mid), "counter", "none"],
    ["AC_time: t ≥ umbral y u > reserva + margen", input(4, late), "accept", "ac-time"],
    ["AC_time no aplica en la reserva + margen exacta", input(3.2, late), "counter", "none"],
    ["último movimiento: igual a la reserva ⇒ accept", input(3, last), "accept", "last-move"],
    ["último movimiento: por encima de la reserva ⇒ accept", input(3.5, last), "accept", "last-move"],
    ["último movimiento: por debajo sin respuesta ⇒ walk", input(2.99, last), "walk", "last-move"],
    ["último movimiento: por debajo con respuesta ⇒ contraoferta final", input(2.99, last, { rivalCanRespond: true }), "counter", "last-move"],
    ["último movimiento sin oferta del rival ⇒ walk", input(undefined, last), "walk", "last-move"],
    ["horizonte por defecto: en la reserva ⇒ accept", input(3, horizon), "accept", "default-horizon"],
    ["horizonte por defecto: por debajo ⇒ counter, nunca walk", input(2, horizon), "counter", "default-horizon"],
    ["sin oferta del rival ⇒ counter", input(undefined, mid), "counter", "none"],
    ["fuera del mandato nunca se acepta", input(2.99, mid, { ourNextUtility: 0.3 }), "counter", "none"],
  ])("%s", (_name, acceptanceInput, verdict, rule) => {
    expect(decideAcceptance(acceptanceInput)).toEqual({ verdict, rule });
  });
});

describe("tiempo", () => {
  it("t sale del límite de rondas del ring", () => {
    expect(computeTime({ round: 3, roundLimit: 10 }, 20)).toEqual({
      t: 0.3,
      source: "ring-rounds",
      isLastMove: false,
      defaultHorizonReached: false,
    });
    expect(computeTime({ round: 10, roundLimit: 10 }, 20).isLastMove).toBe(true);
  });

  it("sin límite, t sale de defaultHorizon y al superarlo no es último movimiento", () => {
    expect(computeTime({ round: 5 }, 10).t).toBe(0.5);
    const beyond = computeTime({ round: 12 }, 10);
    expect(beyond).toEqual({ t: 1, source: "default-horizon", isLastMove: false, defaultHorizonReached: true });
  });

  it("con plazo del ring, t es la fracción del plazo consumida", () => {
    const info = computeTime({ round: 2, deadlineMs: 1_000, startedAtMs: 0, nowMs: 250 }, 10);
    expect(info).toEqual({ t: 0.25, source: "ring-deadline", isLastMove: false, defaultHorizonReached: false });
  });

  it("'última ronda, oferta final' en el texto no cambia t: computeTime no recibe texto", () => {
    expect(computeTime.length).toBe(2);
    expect(computeTime({ round: 3, roundLimit: 10 }, 10).t).toBe(0.3);
  });
});
