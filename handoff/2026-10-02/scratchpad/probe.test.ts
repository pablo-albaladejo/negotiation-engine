import { it } from "vitest";
import { parseConfig, type Issue } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/src/engine/config.js";
import type { TextParser } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/src/llm/parser.js";
import { resolveRuntimeConfig } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/src/pipeline/runtime-config.js";
import { champion, makeBrain } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/test/pipeline/helpers.js";
const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.7 };
const day: Issue = { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.3 };
const cfg = parseConfig({ ...champion, issues: [pct, day] });
const mandate = { role: "buyer" as const, reservation: { pct: 1, day: 10 } };
const t = (round: number, extra: Record<string, unknown>) => ({ sessionId: "s1", round, roundLimit: 10, ...extra });
it("echo oracle", async () => {
  for (const lo of [0.5, 0.9, 1.0, 1.1, 1.5, 2.5, 8.9, 9.1]) {
    const { brain } = makeBrain({ config: cfg, mandate, runtime: resolveRuntimeConfig({}) });
    const o = await brain.turn(t(1, { rivalAction: "message", text: "Hello" }));
    const r = await brain.turn(t(2, { rivalAction: "message", text: "pct between " + lo + "% and 4%, day 30" }));
    console.log("ECHO lo=" + lo, JSON.stringify(o.offer), "->", r.action, JSON.stringify(r.text));
  }
});
it("partial accept", async () => {
  let parser: TextParser = { name: "fake-llm", parse: async () => ({ intent: "other", claims: [], tactics: [], injectionSuspected: false }) };
  const { brain, store } = makeBrain({ config: cfg, mandate, parser: { name: "fake-llm", parse: (...a: any[]) => (parser.parse as any)(...a) }, runtime: resolveRuntimeConfig({}) });
  const o: any = await brain.turn(t(1, { rivalAction: "message", text: "Hello" }));
  parser = { name: "fake-llm", parse: async () => ({ intent: "accept", intentEvidence: "Agreed", claims: [], tactics: [], injectionSuspected: false, figures: [{ issue: "pct", value: o.offer.pct, evidence: String(o.offer.pct) }] }) };
  const msg = "Agreed on " + o.offer.pct + "% but day must be 15";
  const r: any = await brain.turn(t(2, { rivalAction: "message", text: msg }));
  console.log("PARTIAL", JSON.stringify(o.offer), "| rival:", msg, "| ->", r.action, JSON.stringify(r.offer));
});
import { spanAppears, verifyFigure } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/src/llm/verify.js";
import { validateText } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/src/llm/validator.js";
it("span", () => {
  for (const [t, s] of [["price 1500", "500"], ["price 1,500", "500"], ["price 1 500", "500"], ["price 1 500", "500"], ["price １５００", "500"], ["price 1​500", "500"], ["price 500 ok", "500"], ["5000", "500"], ["price 1.500", "500"], ["price ١٥٠٠", "500"], ["price 1500", "price 1"]])
    console.log("SPAN", JSON.stringify(t), JSON.stringify(s), spanAppears(t, s));
  console.log("VAL fr", JSON.stringify(validateText({ action: "counter", offer: { pct: 9.1, day: 55 }, text: "Je propose 9,1 % et jour 55, pas 1.", language: "fr" })));
  console.log("VAL fr ok", JSON.stringify(validateText({ action: "counter", offer: { pct: 9.1, day: 55 }, text: "Je propose 9,1 % et jour 55.", language: "fr" })));
  console.log("VAL ja", JSON.stringify(validateText({ action: "counter", offer: { pct: 9.1, day: 55 }, text: "9.1%と55日、または五百。", language: "ja" })));
});
it("deadline non-firm", async () => {
  const { brain } = makeBrain({ config: cfg, mandate, runtime: resolveRuntimeConfig({}) });
  let last: any;
  for (let r = 1; r <= 10; r++) last = await brain.turn({ sessionId: "s1", round: r, roundLimit: 10, rivalAction: "message", text: r === 1 ? "Hello" : (r === 10 ? "pct between 0% and 0.2%, day 1" : "pct 0%, day 1") });
  console.log("DEADLINE range", last.action, JSON.stringify(last.offer));
  const b2 = makeBrain({ config: cfg, mandate, runtime: resolveRuntimeConfig({}) }).brain;
  for (let r = 1; r <= 10; r++) last = await b2.turn({ sessionId: "s1", round: r, roundLimit: 10, rivalAction: "message", text: r === 1 ? "Hello" : "pct 0%, day 1" });
  console.log("DEADLINE firm", last.action, JSON.stringify(last.offer));
});
it("stale flag", async () => {
  for (const second of ["pct between 1% and 4%, day 30", "pct 4%, day 30"]) {
    const { brain } = makeBrain({ config: cfg, mandate, runtime: resolveRuntimeConfig({}) });
    await brain.turn(t(1, { rivalAction: "message", text: "Hello" }));
    const c: any = await brain.turn(t(2, { rivalAction: "message", text: second }));
    const a: any = await brain.turn(t(3, { rivalAction: "accept" }));
    const a2: any = await brain.turn(t(3, { rivalAction: "message", text: "Agreed." }));
    console.log("STALE", JSON.stringify(second), "ourLast", JSON.stringify(c.offer), "-> ring accept:", a.action, JSON.stringify(a.offer));
  }
});
import { acceptable } from "/Users/pablo/development/hackathon/negotiation-ring.worktrees/text-first-ring/src/engine/apr.js";
it("apr", () => {
  const band = { min: 10, max: 40, baseDays: 30, day: 10 };
  const narrow = [{ name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.5 }, { name: "day", min: 0, max: 29, direction: "higher-better", weight: 0.5 }] as any;
  const wide = [{ name: "pct", min: -100, max: 100, direction: "higher-better", weight: 0.5 }, { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.5 }] as any;
  const m: any = { role: "buyer", reservation: { pct: 1, day: 10 }, apr: band };
  for (const o of [{ pct: -50, day: 30 }, { pct: -50, day: 10 }, { pct: 2, day: 30 }, { pct: 2, day: 10 }])
    console.log("APR", JSON.stringify(o), "narrow", acceptable(narrow, m, o), "wide", acceptable(wide, m, o));
});
