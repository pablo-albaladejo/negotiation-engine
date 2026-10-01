import { describe, expect, it } from "vitest";
import { parseConfig, type Issue } from "../../src/engine/config.js";
import type { ParserFigure, ParserOutput, TextParser } from "../../src/llm/parser.js";
import { validateText } from "../../src/llm/validator.js";
import { verifyTextAcceptance, type TextAcceptInput } from "../../src/pipeline/binding.js";
import { resolveRuntimeConfig } from "../../src/pipeline/runtime-config.js";
import type { TurnOutput } from "../../src/protocol/schemas.js";
import { champion, makeBrain } from "./helpers.js";

const pct: Issue = { name: "pct", min: 0, max: 10, direction: "higher-better", weight: 0.7 };
const day: Issue = { name: "day", min: 0, max: 60, direction: "higher-better", weight: 0.3 };
const issues = [pct, day];
const ourLast = { pct: 2, day: 20 };
const ok = (issue: string, value: number) => ({ issue, value, evidence: String(value), ok: true, confidence: "verified-digits" as const });

function acc(overrides: Partial<TextAcceptInput>): TextAcceptInput {
  return { issues, text: "De acuerdo, aceptamos", intent: "accept", intentEvidence: "De acuerdo", negated: false, ourLast, textHasNumbers: false, ...overrides };
}

describe("verifyTextAcceptance: tabla de enlace", () => {
  it.each<[string, Partial<TextAcceptInput>, string | true]>([
    ["sin cifras ⇒ acuerdo", {}, true],
    ["intención distinta", { intent: "offer" }, "not-accept"],
    ["evidencia que no aparece", { intentEvidence: "Trato hecho" }, "no-evidence"],
    ["evidencia vacía", { intentEvidence: "" }, "no-evidence"],
    ["negación determinista", { negated: true }, "negated"],
    ["sin oferta nuestra previa", { ourLast: undefined }, "no-prior-offer"],
    ["cifras ilegibles", { textHasNumbers: true }, "figures-unverified"],
    ["cifra citada sin verificar", { checks: [{ issue: "pct", value: 2, evidence: "2", ok: false, reason: "span-not-found" }] }, "figures-unverified"],
    ["cifra llm-only no acepta", { checks: [{ issue: "pct", value: 2, evidence: "二", ok: true, confidence: "llm-only" }] }, "llm-only"],
    ["cifras verificadas iguales (parcial)", { checks: [ok("pct", 2)], textHasNumbers: true }, true],
    ["cifras verificadas iguales (todas)", { checks: [ok("pct", 2), ok("day", 20)], textHasNumbers: true }, true],
    ["cifras verificadas distintas", { checks: [ok("pct", 3), ok("day", 20)], textHasNumbers: true }, "figures-differ"],
    ["determinista igual", { deterministic: { pct: 2, day: 20 }, textHasNumbers: true }, true],
    ["determinista distinto", { deterministic: { pct: 3, day: 20 }, textHasNumbers: true }, "figures-differ"],
  ])("%s", (_name, overrides, expected) => {
    const result = verifyTextAcceptance(acc(overrides));
    if (expected === true) expect(result).toEqual({ verified: true });
    else expect(result).toEqual({ verified: false, reason: expected });
  });
});

const twoIssues = parseConfig({ ...champion, issues: [pct, day] });
const mandate2 = { role: "buyer" as const, reservation: { pct: 1, day: 10 } };
const t = (round: number, extra: Record<string, unknown>) => ({ sessionId: "s1", round, roundLimit: 10, ...extra });
const said = (intent: ParserOutput["intent"], extra: Partial<ParserOutput> = {}, figures?: ParserFigure[]): TextParser => ({
  name: "fake-llm",
  parse: async () => ({ intent, claims: [], tactics: [], injectionSuspected: false, ...(figures ? { figures } : {}), ...extra }),
});
type WithOffer = TurnOutput & { offer: Record<string, number> };

async function afterOpening(parser: TextParser, runtime = resolveRuntimeConfig({})) {
  const run = makeBrain({ config: twoIssues, mandate: mandate2, parser, runtime });
  const opening = (await run.brain.turn(t(1, { rivalAction: "message", text: "Hallo" }))) as WithOffer;
  return { ...run, opening };
}

describe("aceptación desde el texto en el pipeline (hybrid por defecto)", () => {
  it("aceptación en alemán sin cifras: acuerdo en nuestra última oferta, repetimos las cifras y respondemos igual después", async () => {
    const { brain, store, trace, opening } = await afterOpening(said("accept", { intentEvidence: "Einverstanden" }));
    const deal = (await brain.turn(t(2, { rivalAction: "message", text: "Einverstanden, das nehmen wir" }))) as WithOffer;
    expect(deal).toMatchObject({ action: "accept", offer: opening.offer });
    expect(validateText({ action: "accept", offer: deal.offer, text: deal.text })).toEqual({ ok: true });
    const session = store.get("s1")!;
    expect(session).toMatchObject({ agreement: opening.offer, agreementOrigin: "rival-text-verified", agreementRound: 2 });
    expect(trace.records.find((r) => r.box === "binding" && r.round === 2)!.input).toMatchObject({ effectiveAction: "accept", textSignal: { acceptSignal: "parser-intent-verified", acceptVerified: true } });

    const again = await brain.turn(t(3, { rivalAction: "message", text: "Noch etwas: 5 %?" }));
    expect(again).toEqual({ ...deal, round: 3 });
    expect(trace.records.some((r) => r.box === "agreement-repeat")).toBe(true);
  });

  it("aceptación que cita nuestra cifra verificada (parcial) cierra el acuerdo", async () => {
    const run = makeBrain({ config: twoIssues, mandate: mandate2, parser: said("other") });
    const opening = (await run.brain.turn(t(1, { rivalAction: "message", text: "Hola" }))) as WithOffer;
    const quoted = `${opening.offer.pct} %`;
    const parser = said("accept", { intentEvidence: "acepto" }, [{ issue: "pct", value: opening.offer.pct!, evidence: quoted }]);
    const { brain, store } = await afterOpening(parser);
    const deal = await brain.turn(t(2, { rivalAction: "message", text: `Vale, acepto el ${quoted}` }));
    expect(deal.action).toBe("accept");
    expect(store.get("s1")!.agreementOrigin).toBe("rival-text-verified");
  });

  it("aceptación con cifras ilegibles: sin acuerdo y pide confirmar", async () => {
    const { brain, store } = await afterOpening(said("accept", { intentEvidence: "acepto" }));
    const out = await brain.turn(t(2, { rivalAction: "message", text: "acepto, pero a tres y pico" }));
    expect(out.action).toBe("counter");
    expect(out.text).toMatch(/confirmar tus cifras/);
    expect(store.get("s1")!.agreement).toBeUndefined();
  });

  it("negación detectada: sin acuerdo aunque el LLM diga accept", async () => {
    const { brain, store, trace } = await afterOpening(said("accept", { intentEvidence: "acepto" }));
    await brain.turn(t(2, { rivalAction: "message", text: "no acepto ese 2 %" }));
    expect(store.get("s1")!.agreement).toBeUndefined();
    expect(trace.records.find((r) => r.box === "binding" && r.round === 2)!.input).toMatchObject({ textSignal: { acceptVerified: false, acceptReason: "negated" } });
  });

  it("con acceptance.signal = ring-action el texto no cierra el acuerdo", async () => {
    const { brain, store } = await afterOpening(said("accept", { intentEvidence: "de acuerdo" }), resolveRuntimeConfig({ acceptance: { signal: "ring-action" } }));
    const out = await brain.turn(t(2, { rivalAction: "message", text: "de acuerdo, acepto" }));
    expect(out.action).not.toBe("accept");
    expect(store.get("s1")!.agreement).toBeUndefined();
  });

  it("aceptación antes de nuestra primera oferta: sin acuerdo, respondemos con la apertura", async () => {
    const { brain, store } = makeBrain({ config: twoIssues, mandate: mandate2, parser: said("accept", { intentEvidence: "accepted" }) });
    const out = await brain.turn(t(1, { rivalAction: "message", text: "accepted" }));
    expect(out.action).toBe("counter");
    expect(store.get("s1")!.agreement).toBeUndefined();
  });

  it("hybrid con acción del ring offer: la intención del texto no cierra", async () => {
    const { brain, store } = await afterOpening(said("accept", { intentEvidence: "acepto" }));
    await brain.turn(t(2, { rivalAction: "offer", rivalOffer: { pct: 0.5, day: 5 }, text: "acepto" }));
    expect(store.get("s1")!.agreement).toBeUndefined();
    expect(store.get("s1")!.rivalOffers).toEqual([{ pct: 0.5, day: 5 }]);
  });

  it("sin LLM (determinista): la intención y su evidencia vienen del parser determinista", async () => {
    const { brain, store } = makeBrain({ config: twoIssues, mandate: mandate2 });
    const opening = (await brain.turn(t(1, { rivalAction: "message", text: "Hola" }))) as WithOffer;
    const deal = await brain.turn(t(2, { rivalAction: "message", text: "De acuerdo, trato hecho." }));
    expect(deal).toMatchObject({ action: "accept", offer: opening.offer });
    expect(store.get("s1")!.agreementOrigin).toBe("rival-text-verified");
  });
});

describe("retirada desde el texto y origen del acuerdo", () => {
  const walkText = "we're done here unless you move";

  it("trace-only: no marca la retirada, el motor contraoferta y la traza registra la intención walk", async () => {
    const { brain, store, trace } = await afterOpening(said("walk", { intentEvidence: "we're done here" }));
    const out = await brain.turn(t(2, { rivalAction: "message", text: walkText }));
    expect(store.get("s1")!.rivalWalked).toBe(false);
    expect(out.action).toBe("counter");
    expect(trace.records.find((r) => r.box === "binding" && r.round === 2)!.input).toMatchObject({ textSignal: { intent: "walk", walkSignal: "trace-only", walkVerified: false } });
  });

  it("parser-intent-verified: la retirada con evidencia literal cuenta como walk", async () => {
    const runtime = resolveRuntimeConfig({ acceptance: { walkSignal: "parser-intent-verified" } });
    const { brain, store } = await afterOpening(said("walk", { intentEvidence: "we're done here" }), runtime);
    await brain.turn(t(2, { rivalAction: "message", text: walkText }));
    expect(store.get("s1")!.rivalWalked).toBe(true);
  });

  it("acuerdo por aceptación nuestra: origen engine-accept", async () => {
    const { brain, store } = makeBrain();
    await brain.turn({ sessionId: "s1", round: 1, roundLimit: 10, rivalAction: "message", text: "Hola" });
    const out = await brain.turn({ sessionId: "s1", round: 10, roundLimit: 10, rivalAction: "offer", rivalOffer: { pct: 9 } });
    expect(out.action).toBe("accept");
    expect(store.get("s1")!).toMatchObject({ agreement: { pct: 9 }, agreementOrigin: "engine-accept", agreementRound: 10 });
  });
});
