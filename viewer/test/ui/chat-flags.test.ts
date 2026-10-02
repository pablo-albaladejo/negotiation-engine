import { describe, expect, it } from "vitest";
import type { RoundPanel } from "../../src/model/index.js";
import { chatFlags } from "../../src/ui/chat-flags.js";

const basePanel = (overrides: Partial<RoundPanel> = {}): RoundPanel => ({
  round: 1,
  decision: null,
  explain: null,
  parser: null,
  validator: null,
  leak: null,
  template: false,
  rivalText: null,
  ourText: null,
  ourOffer: null,
  rivalOffer: null,
  outcome: null,
  boxes: [],
  ...overrides,
});

describe("chatFlags (A6)", () => {
  // Test 1: agent counter-offer flags: target, est. reserve, rule.
  it("agent counter-offer: target / est. reserve / rule, all from logged fields", () => {
    const panel = basePanel({
      decision: { action: "counter", rule: "default-horizon", offer: { price: 100 } },
      explain: {
        t: 0.5,
        target: 0.42,
        targetOffer: { price: 110 },
        step: null,
        uOffer: 0.5,
        uRival: null,
        acNext: false,
        acTime: "n/a",
        rivalReserveEstimate: { price: 90 },
      } as RoundPanel["explain"],
    });
    expect(chatFlags("agent", panel)).toEqual([
      { kind: "neutral", label: "target 0.4" },
      { kind: "neutral", label: "est. reserve 90" },
      { kind: "neutral", label: "rule: default-horizon" },
    ]);
  });

  // Test 2 / X3: accept with the logged acceptance rule (e.g. ac-time) and the accepted price.
  it("agent accept: shows the logged acceptance rule (not a hardcoded one) and the price", () => {
    const panel = basePanel({ decision: { action: "accept", rule: "ac-time", offer: { price: 120 } } });
    expect(chatFlags("agent", panel)).toEqual([{ kind: "decision", label: "ac-time · accepts 120" }]);
  });

  // X3: when the rival accepted OUR offer, no acceptance rule of ours applies.
  it("agent accept with rule rival-accepted: 'deal at {price}', no rule shown", () => {
    const panel = basePanel({ decision: { action: "accept", rule: "rival-accepted", offer: { price: 120 } } });
    expect(chatFlags("agent", panel)).toEqual([{ kind: "decision", label: "deal at 120" }]);
  });

  // Test 3: rival injection -> [injection, quarantined] flags.
  it("rival turn flagged by the parser as a suspected injection -> injection + quarantined", () => {
    const panel = basePanel({ parser: { intent: "offer", injectionSuspected: true } });
    expect(chatFlags("rival", panel)).toEqual([
      { kind: "injection", label: "injection" },
      { kind: "neutral", label: "quarantined" },
    ]);
  });

  it("rival turn without an injection flag, and no panel at all -> no flags", () => {
    expect(chatFlags("rival", basePanel())).toEqual([]);
    expect(chatFlags("rival", null)).toEqual([]);
    expect(chatFlags("agent", null)).toEqual([]);
  });
});
