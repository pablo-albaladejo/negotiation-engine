import { beforeAll, describe, expect, it } from "vitest";
import type { TraceLine } from "../../../src/pipeline/trace.js";
import { emptyLiveFeed, FINAL_HOLD_MS, liveModel, type LiveFeed } from "../../src/model/live.js";
import { generateFixtures, RIVAL_HTML, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});

const feed = (lines: TraceLine[], extra: Partial<LiveFeed> = {}): LiveFeed => ({ ...emptyLiveFeed(), runId: "agent-x", session: "s", lines, lastEventAt: 1_000, ...extra });
const box = (round: number, name: string, output: unknown, result: "ok" | "fallback" = "ok"): TraceLine =>
  ({ kind: "box", sessionId: "ring-session-1", round, box: name, input: null, output, result, latencyMs: 1 }) as TraceLine;

describe("liveModel (P7)", () => {
  it("sin sesión: BREAK (waiting for the next match), sin datos inventados", () => {
    const m = liveModel(emptyLiveFeed(), 0);
    expect(m).toMatchObject({ status: "break", badge: "BREAK", sessionId: null, round: 0, attacksBlocked: 0, outcome: null, last: null, last3: [] });
  });

  it("en curso: LIVE con ronda, límite del registro input, utilidades de explain × 100 y 3 últimas burbujas", () => {
    const m = liveModel(feed(fx.tournament.trace), 2_000);
    expect(m).toMatchObject({ status: "live", badge: "LIVE", sessionId: "ring-session-1", role: "buyer", round: 3, roundLimit: 10, outcome: null });
    const engine = fx.tournament.trace.filter((l) => l.kind === "box" && l.box === "engine").map((l) => (l as { output: { explain: { uOffer: number } } }).output.explain.uOffer);
    expect(m.ours.map((p) => p.value)).toEqual(engine.map((u) => u * 100));
    expect(m.last3).toHaveLength(3);
    expect(m.last3.at(-1)).toMatchObject({ side: "us", round: 3 });
    expect(m.last3.find((b) => b.side === "them")?.text).toContain(RIVAL_HTML);
    expect(m.latest.theirOffer).toEqual({ pct: 3 });
    expect(m.templateCount).toBe(0);
    expect(m.ourMessageCount).toBe(3);
  });

  it("privacidad P7: de explain solo usa uOffer/uRival; ni target, ni targetOffer, ni rivalReserveEstimate llegan al modelo", () => {
    const m = liveModel(feed(fx.tournament.trace), 2_000);
    const json = JSON.stringify(m);
    for (const key of ["target", "targetOffer", "rivalReserveEstimate", "explain"]) expect(json).not.toContain(`"${key}"`);
    const explains = fx.tournament.trace.flatMap((l) => (l.kind === "box" && l.box === "engine" ? [(l.output as { explain: { target: number } }).explain] : []));
    expect(explains.length).toBeGreaterThan(0);
    for (const e of explains) for (const v of [e.target, e.target * 100]) expect(json).not.toContain(String(v));
  });

  it("ataques bloqueados = registros parser con injectionSuspected + leak con leak: true (nunca calculado)", () => {
    const base = liveModel(feed(fx.tournament.trace), 2_000).attacksBlocked;
    const lines = [...fx.tournament.trace, box(4, "parser", { intent: "offer", injectionSuspected: true }), box(4, "leak", { leak: true }), box(4, "leak", { leak: false })];
    const m = liveModel(feed(lines), 2_000);
    expect(m.attacksBlocked).toBe(base + 2);
    expect(m.injectionRounds).toContain(4);
  });

  it("acción terminal en output ⇒ FINAL; pasado el margen sin eventos ⇒ BREAK con el último resultado", () => {
    const lines = [...fx.tournament.trace, box(4, "template", { text: "x" }, "fallback"), box(4, "output", { sessionId: "ring-session-1", round: 4, action: "accept", offer: { pct: 3 }, text: "ok" })];
    const final = liveModel(feed(lines), 1_000 + FINAL_HOLD_MS);
    expect(final).toMatchObject({ status: "final", badge: "FINAL", outcome: { action: "accept", offer: { pct: 3 }, round: 4 }, templateCount: 1 });
    const brk = liveModel(feed(lines), 1_001 + FINAL_HOLD_MS);
    expect(brk).toMatchObject({ status: "break", badge: "BREAK", last: { action: "accept", offer: { pct: 3 } } });
  });

  it("sesión nueva sin registros: BREAK con el final de la anterior", () => {
    const prev = [...fx.tournament.trace, box(4, "output", { sessionId: "ring-session-1", round: 4, action: "walk", text: "bye" })];
    const m = liveModel(feed([], { session: "next", previous: { session: "s", lines: prev } }), 2_000);
    expect(m).toMatchObject({ status: "break", last: { action: "walk", offer: null } });
  });
});
