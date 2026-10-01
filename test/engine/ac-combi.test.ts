import { describe, expect, it } from "vitest";
import { acCombiWindow, decideAcceptance, type AcceptanceInput, type TimeInfo } from "../../src/engine/acceptance.js";
import { pctIssue } from "./arbitraries.js";

// Comprador con reserva 3 % ⇒ u(reserva) = 0.3; AC_time solo por encima de 0.32.
const mandate = { role: "buyer" as const, reservation: { pct: 3 } };
const at = (t: number): TimeInfo => ({ t, source: "ring-rounds", isLastMove: false, defaultHorizonReached: false });

function input(pct: number, t: number, previous: number[], extra: Partial<AcceptanceInput> = {}): AcceptanceInput {
  return {
    issues: [pctIssue],
    mandate,
    rivalCurrent: { pct },
    rivalPrevious: previous.map((p) => ({ pct: p })),
    ourNextUtility: 0.8,
    time: at(t),
    acceptMargin: 0.02,
    acTimeThreshold: 1,
    acCombiThreshold: 0.8,
    rivalCanRespond: false,
    ...extra,
  };
}

function withoutCombi({ acCombiThreshold: _omit, ...rest }: AcceptanceInput): AcceptanceInput {
  return rest;
}

describe("AC_combi(T, MAX^W) en la caja de aceptación (12.3)", () => {
  it.each([
    ["desactivada (sin umbral) ⇒ counter", withoutCombi(input(4, 0.9, [3.5])), "counter", "none"],
    ["t < T ⇒ no aplica", input(4, 0.7, [3.5]), "counter", "none"],
    ["t ≥ T y u ≥ máximo de la ventana ⇒ accept", input(4, 0.8, [2, 3.5]), "accept", "ac-combi"],
    ["igual al máximo de la ventana ⇒ accept", input(3.5, 0.9, [3.5]), "accept", "ac-combi"],
    ["por debajo del máximo de la ventana ⇒ counter", input(3.4, 0.9, [3.5]), "counter", "none"],
    ["sin ofertas previas del rival ⇒ no aplica", input(4, 0.9, []), "counter", "none"],
    ["una oferta mejor fuera de la ventana no bloquea", input(4, 0.9, [5, 3, 3, 3, 3, 3, 3, 3, 3]), "accept", "ac-combi"],
    ["por debajo de la reserva nunca, aunque supere la ventana", input(2.9, 0.9, [2]), "counter", "none"],
    ["AC_next tiene prioridad", input(7.8, 0.9, [9]), "accept", "ac-next"],
  ])("%s", (_name, acceptanceInput, verdict, rule) => {
    expect(decideAcceptance(acceptanceInput)).toEqual({ verdict, rule });
  });

  it("en el último movimiento manda la regla sin margen, no AC_combi", () => {
    const last: TimeInfo = { t: 1, source: "ring-rounds", isLastMove: true, defaultHorizonReached: false };
    expect(decideAcceptance({ ...input(3, 1, [3.5]), time: last })).toEqual({ verdict: "accept", rule: "last-move" });
  });

  it.each([
    [0.5, 4, 4],
    [0.8, 8, 2],
    [0.9, 9, 1],
    [0.99, 20, 1],
    [0.3, 2, 2],
  ])("ventana en t=%s con %i ofertas previas = %i", (t, previous, size) => {
    expect(acCombiWindow(t, previous)).toBe(size);
  });
});
