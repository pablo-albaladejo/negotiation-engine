import { describe, expect, it } from "vitest";
import type { Issue } from "../../src/engine/config.js";
import { bindRivalMove } from "../../src/pipeline/binding.js";
import { makeBrain, turn } from "./helpers.js";

const issues: Issue[] = [
  { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.5 },
  { name: "day", min: 0, max: 60, direction: "lower-better", weight: 0.5 },
];
const ours = { pct: 2, day: 20 };

describe("enlace de la aceptación del rival (tabla)", () => {
  it.each([
    ["accept sin cifras ⇒ acuerdo en nuestra última oferta", "accept", undefined, ours, { kind: "agreement", offer: ours }],
    ["accept con las mismas cifras ⇒ acuerdo", "accept", { pct: 2, day: 20 }, ours, { kind: "agreement", offer: ours }],
    ["accept con cifras distintas ⇒ oferta nueva", "accept", { pct: 3, day: 20 }, ours, { kind: "offer", offer: { pct: 3, day: 20 } }],
    ["accept sin oferta nuestra previa ⇒ nada", "accept", undefined, undefined, { kind: "none" }],
    ["accept con cifras sin oferta nuestra ⇒ oferta nueva", "accept", { pct: 3, day: 20 }, undefined, { kind: "offer", offer: { pct: 3, day: 20 } }],
    ["offer con cifras ⇒ oferta", "offer", { pct: 1, day: 30 }, ours, { kind: "offer", offer: { pct: 1, day: 30 } }],
    ["offer sin cifras (solo texto) ⇒ nada", "offer", undefined, ours, { kind: "none" }],
    ["message ⇒ nada", "message", undefined, ours, { kind: "none" }],
    ["walk ⇒ retirada", "walk", undefined, ours, { kind: "walk" }],
  ] as const)("%s", (_name, action, offer, ourLast, expected) => {
    expect(bindRivalMove(issues, action, offer ? { ...offer } : undefined, ourLast ? { ...ourLast } : undefined)).toEqual(expected);
  });
});

describe("enlace aplicado en el turno", () => {
  it("accept sin cifras tras nuestra oferta ⇒ aceptamos exactamente nuestra última oferta", async () => {
    const { brain, store } = makeBrain();
    const first = await brain.turn(turn(1));
    expect(first.action).toBe("counter");
    const second = await brain.turn(turn(2, { rivalAction: "accept" }));
    expect(second.action).toBe("accept");
    expect(second.action !== "walk" && second.offer).toEqual(first.action !== "walk" && first.offer);
    expect(store.get("s1")!.agreement).toEqual(first.action !== "walk" && first.offer);
  });

  it("accept con cifras distintas ⇒ se registra como oferta nueva y decide el motor", async () => {
    const { brain, store } = makeBrain();
    await brain.turn(turn(1));
    const second = await brain.turn(turn(2, { rivalAction: "accept", rivalOffer: { pct: 1 } }));
    expect(second.action).toBe("counter");
    expect(store.get("s1")!.rivalOffers.at(-1)).toEqual({ pct: 1 });
    expect(store.get("s1")!.agreement).toBeUndefined();
  });
});
