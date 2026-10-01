import { beforeAll, describe, expect, it } from "vitest";
import { arenaReplayModel, isTwoIssue, matchesModel, runsModel, tournamentReplayModel, twoIssueModel } from "../../src/model/index.js";
import { asV1Trace, generateFixtures, RIVAL_HTML, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
beforeAll(async () => {
  fx = await generateFixtures();
});

const RIVAL_DRIVEN = new Set(["rival-walked", "rival-accepted"]);

describe("runsModel (P1)", () => {
  it("una fila por run con los campos de summary.json; un run sin resumen queda en null (not logged)", () => {
    const rows = runsModel([
      { runId: "tournament-1", kind: "tournament", summary: null },
      { runId: fx.runId, kind: "arena", summary: fx.summary },
    ]);
    const arena = rows.find((r) => r.runId === fx.runId)!;
    expect(arena).toEqual({
      runId: fx.runId,
      kind: "arena",
      createdAt: fx.summary.createdAt,
      config: { path: fx.summary.config.path, version: fx.summary.config.version },
      games: fx.summary.overall.games,
      meanSurplus: fx.summary.overall.meanSurplus,
      agreementRate: fx.summary.overall.agreementRate,
      violations: fx.summary.overall.violations,
      leaks: fx.summary.overall.leaks,
    });
    expect(rows.find((r) => r.kind === "tournament")).toMatchObject({ games: null, meanSurplus: null, config: null });
  });
});

describe("matchesModel (P2)", () => {
  it("KPIs de summary.overall y todas las partidas sin filtros", () => {
    const m = matchesModel(fx.summary, fx.games);
    expect(m.kpis.games).toBe(fx.summary.overall.games);
    expect(m.rows).toHaveLength(fx.games.length);
    expect(m.empty).toBe(false);
    expect(m.options.rivals).toEqual([...new Set(fx.games.map((g) => g.rival))].sort());
    expect(m.rows.every((r) => r.roundLimit !== null)).toBe(true);
  });

  it("filtro rival boulware + rol buyer: solo esas partidas", () => {
    const m = matchesModel(fx.summary, fx.games, { rival: "boulware", role: "buyer" });
    const expected = fx.games.filter((g) => g.rival === "boulware" && g.role === "buyer").map((g) => g.gameId);
    expect(expected.length).toBeGreaterThan(0);
    expect(m.rows.map((r) => r.gameId)).toEqual(expected);
    expect(m.shownCount).toBe(expected.length);
  });

  it("filtros de resultado y plantilla", () => {
    const result = fx.games[0]!.endReason;
    expect(matchesModel(fx.summary, fx.games, { result }).rows.every((r) => r.endReason === result)).toBe(true);
    expect(matchesModel(fx.summary, fx.games, { template: true }).rows.every((r) => r.templateFallbacks > 0)).toBe(true);
  });

  it("run vacío: overall.games = 0 ⇒ empty", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, games: 0 } };
    expect(matchesModel(summary, []).empty).toBe(true);
  });
});

describe("arenaReplayModel (P3)", () => {
  it("con traza v2: panel por ronda con regla y explain, curva solo de explain, reservas del transcript", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-wide")!;
    const m = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    expect(m.hasTrace).toBe(true);
    expect(m.reserves).toEqual(line.reserves);
    expect(m.game.roundLimit).toBe(line.roundLimit);
    expect(m.chat).toHaveLength(line.transcript.length);
    const decided = m.rounds!.filter((p) => p.decision);
    expect(decided.length).toBeGreaterThan(0);
    for (const p of decided) if (!RIVAL_DRIVEN.has(p.decision!.rule)) expect(p.explain).not.toBeNull();
    expect(m.explain.length).toBeGreaterThan(0);
    expect(m.explain.map((e) => e.target)).toEqual(decided.flatMap((p) => (p.explain ? [p.explain.target] : [])));
  });

  it("ZOPA vacía: reservas de ambas partes y zopaEmpty", () => {
    const line = fx.games.find((g) => g.scenarioId === "price-buyer-empty")!;
    const m = arenaReplayModel(line, fx.traces.get(line.gameId)!);
    expect(m.game.zopaEmpty).toBe(true);
    expect(m.reserves).toEqual({ ours: line.reserves!.ours, rival: line.reserves!.rival });
  });

  it("traza v1 sin explain y transcript v1: regla registrada, explain null, sin curva ni reservas", () => {
    const { schemaVersion: _s, roundLimit: _l, reserves: _r, ...v1 } = fx.games[0]!;
    const m = arenaReplayModel(v1, asV1Trace(fx.traces.get(v1.gameId)!));
    expect(m.reserves).toBeNull();
    expect(m.game.roundLimit).toBeNull();
    expect(m.explain).toEqual([]);
    for (const p of m.rounds!.filter((r) => r.decision)) {
      expect(p.explain).toBeNull();
      expect(p.decision!.rule).toEqual(expect.any(String));
    }
  });

  it("sin traza: gráfico y chat desde el transcript, sin panel de decisión", () => {
    const line = fx.games[0]!;
    const m = arenaReplayModel(line, null);
    expect(m.hasTrace).toBe(false);
    expect(m.rounds).toBeNull();
    expect(m.offers.ours).toEqual(line.transcript.filter((e) => e.from === "agent" && e.offer).map((e) => ({ round: e.round, offer: e.offer })));
  });

  it("rechaza una traza de torneo", () => {
    expect(() => arenaReplayModel(fx.games[0]!, fx.tournament.trace)).toThrow(/arena/);
  });
});

describe("tournamentReplayModel (P4)", () => {
  it("con escenario local coincidente: nuestra reserva; nunca reserva del rival ni ZOPA", () => {
    const m = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    expect(m).toMatchObject({ role: "buyer", traceVersion: 2, ourReserve: { pct: 3.37 } });
    expect(m.rounds).toHaveLength(3);
    expect(m.explain.length).toBeGreaterThan(0);
    const keys = JSON.stringify(m).match(/"[A-Za-z]+":/g) ?? [];
    expect(keys.filter((k) => /^"(zopa|reserves|rivalReserve)":$/i.test(k))).toEqual([]);
    expect(m.rounds[0]!.rivalText).toContain(RIVAL_HTML);
  });

  it("hash distinto o sin escenario local: ourReserve null (not available)", () => {
    expect(tournamentReplayModel(fx.tournament.trace, { ...fx.tournament.ref, hash: "0000000000000000" }).ourReserve).toBeNull();
    expect(tournamentReplayModel(fx.tournament.trace, { ...fx.tournament.ref, id: "other.json" }).ourReserve).toBeNull();
    expect(tournamentReplayModel(fx.tournament.trace, null).ourReserve).toBeNull();
  });

  it("traza v1: sin rol ni explain", () => {
    const v1 = asV1Trace(fx.tournament.trace).map((l) => {
      if (l.kind !== "header" || l.mode !== "tournament") return l;
      const { role: _r, ...rest } = l;
      return rest;
    });
    const m = tournamentReplayModel(v1, fx.tournament.ref);
    expect(m).toMatchObject({ role: null, traceVersion: 1, explain: [] });
  });
});

describe("twoIssueModel (P5)", () => {
  const pctDay = () => fx.games.find((g) => g.scenarioId === "pct-day-buyer-wide")!;

  it("solo las partidas de 2 issues van a P5", () => {
    expect(isTwoIssue(pctDay())).toBe(true);
    expect(isTwoIssue(fx.games.find((g) => g.scenarioId === "price-buyer-wide")!)).toBe(false);
  });

  it("plano día × pct con un punto por oferta, mandato de la cabecera y utilidades de explain", () => {
    const line = pctDay();
    const m = twoIssueModel(line, fx.traces.get(line.gameId)!);
    expect(m.axes.y.name).toBe("pct");
    expect(m.axes.x.name).toBe("day");
    const offers = (from: "agent" | "rival") => line.transcript.filter((e) => e.from === from && e.offer);
    expect(m.offers.ours).toHaveLength(offers("agent").length);
    expect(m.offers.rival).toHaveLength(offers("rival").length);
    expect(m.offers.ours[0]).toEqual({ round: 1, x: offers("agent")[0]!.offer!.day, y: offers("agent")[0]!.offer!.pct });
    expect(m.mandate).toEqual({ role: "buyer", reservation: { pct: 2, day: 15 }, region: { x: [15, 60], y: [2, 10] } });
    expect(m.hasExplain).toBe(true);
    expect(m.utilities.length).toBe(m.rows!.length);
    expect(m.rows![0]!.uOffer).toBe(m.utilities[0]!.uOffer);
  });

  it("traza v1 sin explain: utilidades not logged; sin traza: sin mandato ni tabla", () => {
    const line = pctDay();
    const v1 = twoIssueModel(line, asV1Trace(fx.traces.get(line.gameId)!));
    expect(v1.utilities).toEqual([]);
    expect(v1.rows!.every((r) => r.uOffer === null && r.uRival === null)).toBe(true);
    const none = twoIssueModel(line, null);
    expect(none).toMatchObject({ mandate: null, rows: null, hasTrace: false });
    expect(none.offers.ours.length).toBeGreaterThan(0);
  });
});

/** Hojas numéricas de un valor con su clave. */
function numericLeaves(value: unknown, key = ""): { key: string; value: number }[] {
  if (typeof value === "number") return [{ key, value }];
  if (Array.isArray(value)) return value.flatMap((v) => numericLeaves(v, key));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => numericLeaves(v, k));
  return [];
}

describe("los modelos no calculan", () => {
  it("cada número de un modelo es un valor de la fuente o un conteo (clave *Count)", () => {
    const source = new Set(
      numericLeaves([fx.summary, fx.games, [...fx.traces.values()], fx.tournament.trace, fx.tournament.ref]).map((l) => l.value),
    );
    const models = [
      runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]),
      matchesModel(fx.summary, fx.games, { rival: "boulware" }),
      ...fx.games.map((g) => arenaReplayModel(g, fx.traces.get(g.gameId) ?? null)),
      tournamentReplayModel(fx.tournament.trace, fx.tournament.ref),
      ...fx.games.filter(isTwoIssue).map((g) => twoIssueModel(g, fx.traces.get(g.gameId) ?? null)),
    ];
    const computed = numericLeaves(models).filter((l) => !source.has(l.value) && !l.key.endsWith("Count"));
    expect(computed).toEqual([]);
  });
});
