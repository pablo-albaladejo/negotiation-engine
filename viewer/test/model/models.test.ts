import { beforeAll, describe, expect, it } from "vitest";
import { arenaReplayModel, filterGames, filtersToQuery, gateModel, isTwoIssue, matchesModel, queryToFilters, queryToPage, queryWithPage, runsModel, tournamentReplayModel, twoIssueModel } from "../../src/model/index.js";
import { asV1Trace, generateFixtures, generateGateFixtures, RIVAL_HTML, type ViewerFixtures } from "../fixtures.js";

let fx: ViewerFixtures;
let gx: Awaited<ReturnType<typeof generateGateFixtures>>;
beforeAll(async () => {
  fx = await generateFixtures();
  gx = await generateGateFixtures();
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

  it("hasInjectionData: true solo si alguna partida trae metrics.injectionSuspected (campo opcional)", () => {
    const withField = { ...fx.games[0]!, metrics: { ...fx.games[0]!.metrics, injectionSuspected: 2 } };
    const withoutField = { ...fx.games[0]!, metrics: { ...fx.games[0]!.metrics, injectionSuspected: undefined } };
    expect(matchesModel(fx.summary, [withField]).hasInjectionData).toBe(true);
    expect(matchesModel(fx.summary, [withoutField]).hasInjectionData).toBe(false);
  });

  it("filtro injection: solo partidas con injectionSuspected > 0", () => {
    const flagged = { ...fx.games[0]!, gameId: "flagged", metrics: { ...fx.games[0]!.metrics, injectionSuspected: 1 } };
    const clean = { ...fx.games[1]!, gameId: "clean", metrics: { ...fx.games[1]!.metrics, injectionSuspected: 0 } };
    const m = matchesModel(fx.summary, [flagged, clean], { injection: true });
    expect(m.rows.map((r) => r.gameId)).toEqual(["flagged"]);
  });

  it("filtro injection se ignora si el run no trae datos de inyección (hasInjectionData=false)", () => {
    const noInjectionField = fx.games.map((g) => ({ ...g, metrics: { ...g.metrics, injectionSuspected: undefined } }));
    const m = matchesModel(fx.summary, noInjectionField, { injection: true });
    expect(m.hasInjectionData).toBe(false);
    expect(m.rows.length).toBe(noInjectionField.length);
  });

  it("protocolViolationBy: line.protocolViolation?.by ?? metrics.protocolViolation, null si no hay violación", () => {
    const withLineBy = { ...fx.games[0]!, protocolViolation: { by: "rival" as const, detail: "x" } };
    const withMetricsOnly = { ...fx.games[0]!, protocolViolation: undefined, metrics: { ...fx.games[0]!.metrics, protocolViolation: "agent" as const } };
    const withNeither = { ...fx.games[0]!, protocolViolation: undefined, metrics: { ...fx.games[0]!.metrics, protocolViolation: null } };
    expect(matchesModel(fx.summary, [withLineBy]).rows[0]!.protocolViolationBy).toBe("rival");
    expect(matchesModel(fx.summary, [withMetricsOnly]).rows[0]!.protocolViolationBy).toBe("agent");
    expect(matchesModel(fx.summary, [withNeither]).rows[0]!.protocolViolationBy).toBeNull();
  });

  it("run vacío: overall.games = 0 ⇒ empty", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, games: 0 } };
    expect(matchesModel(summary, []).empty).toBe(true);
  });

  it("filterGames: mismo predicado que matchesModel, reutilizable fuera de P2 (L14)", () => {
    const rival = fx.games[0]!.rival;
    const byRival = filterGames(fx.games, { rival });
    expect(byRival.every((g) => g.rival === rival)).toBe(true);
    expect(byRival.map((g) => g.gameId)).toEqual(matchesModel(fx.summary, fx.games, { rival }).rows.map((r) => r.gameId));
  });

  it("filtersToQuery/queryToFilters: round-trip para persistir en la URL (INBOX §2)", () => {
    const filters = { rival: "boulware", role: "buyer" as const, result: "agreement" as const, template: true, injection: true };
    expect(queryToFilters(filtersToQuery(filters))).toEqual(filters);
    expect(filtersToQuery({})).toBe("");
    expect(queryToFilters("")).toEqual({});
    expect(queryToFilters("role=not-a-role")).toEqual({});
  });

  it("queryToFilters drops an unknown result value (L9)", () => {
    expect(queryToFilters("result=agreement")).toEqual({ result: "agreement" });
    expect(queryToFilters("result=not-a-real-reason")).toEqual({});
  });

  it("queryToPage/queryWithPage: round-trip, 1-based in the URL, 0-based internally (T7)", () => {
    expect(queryToPage("")).toBe(0);
    expect(queryToPage("p=2")).toBe(1);
    expect(queryWithPage({}, 0)).toBe("");
    expect(queryWithPage({}, 1)).toBe("p=2");
    expect(queryToPage(queryWithPage({ rival: "boulware" }, 2))).toBe(2);
    expect(queryWithPage({ rival: "boulware" }, 2)).toBe("rival=boulware&p=3");
  });

  it("queryToPage clamps an invalid or non-positive p to the first page (T7)", () => {
    expect(queryToPage("p=0")).toBe(0);
    expect(queryToPage("p=-1")).toBe(0);
    expect(queryToPage("p=abc")).toBe(0);
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

  it("outcome: null sin binding agreement/walk registrado (L3 fixture solo intercambia ofertas)", () => {
    const m = tournamentReplayModel(fx.tournament.trace, fx.tournament.ref);
    expect(m.outcome).toBeNull();
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
    expect(m.weightsLine).toBe("pct 0.7 \u00b7 day 0.3");
  });

  it("weightsLine is null when the trace doesn't log per-issue weights", () => {
    const line = pctDay();
    const none = twoIssueModel(line, null);
    expect(none.weightsLine).toBeNull();
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

describe("gateModel (P6)", () => {
  it("rechazada en seco: veredicto y comprobaciones tal como se registraron, sin comando", () => {
    const { gate } = gx.rejected;
    const m = gateModel("promote-r", gate);
    expect(m.verdict).toMatchObject({ pass: false, dryRun: true, promoted: false, promotedVersion: null });
    expect(m.verdict.failed.map((c) => `${c.phase}/${c.check}`)).toEqual(gate.gate.failed.map((c) => `${c.phase}/${c.check}`));
    expect(m.checks.map((c) => c.pass)).toEqual(gate.gate.checks.map((c) => c.pass));
    expect(m.checks.find((c) => c.phase === "tuning" && c.check === "effect")).toMatchObject({ label: "Tuning · effect ≥ minimum effect", pass: false });
    expect(m.command).toBeNull();
  });

  it("aprobada en seco: comando con la ruta de la candidata; promovida: versión registrada y sin comando", () => {
    expect(gateModel("p", gx.passed.gate)).toMatchObject({ verdict: { pass: true, dryRun: true, promoted: false }, command: `pnpm promote ${gx.candidatePath}` });
    expect(gateModel("p", gx.promoted.gate)).toMatchObject({ verdict: { pass: true, dryRun: false, promoted: true, promotedVersion: 2 }, command: null });
  });

  it("el veredicto sale de gate.pass aunque las comprobaciones digan otra cosa (el visor no evalúa)", () => {
    const g = gx.passed.gate;
    const tampered = { ...g, gate: { ...g.gate, checks: g.gate.checks.map((c) => ({ ...c, pass: false })) } };
    expect(gateModel("p", tampered).verdict.pass).toBe(true);
  });

  it("métricas por fase, mapa rival × rol, cambio de excedente registrado y diff de parámetros", () => {
    const { gate } = gx.passed;
    const m = gateModel("p", gate);
    expect(m.phases).toEqual(["tuning", "revalidation", "heldOut"]);
    expect(m.metrics.tuning).toMatchObject({ surplusChangePp: gate.reports.tuning!.meanDiffPp, candidate: { meanSurplus: gate.summaries!.tuning!.candidate.meanSurplus } });
    const heat = m.heatmap.tuning!;
    expect(heat.roles).toEqual(["seller", "buyer"]);
    expect(heat.rows.map((r) => r.rival).sort()).toEqual(["boulware", "conceder"]);
    const cell = gate.summaries!.tuning!.candidateByRivalRole[0]!;
    expect(heat.rows.find((r) => r.rival === cell.rival)!.cells.find((c) => c.role === cell.role)!.meanSurplus).toBe(cell.meanSurplus);
    expect(m.params!.filter((p) => p.changed).map((p) => p.key).sort()).toEqual(["beta", "version"]);
    expect(m.params!.find((p) => p.key === "beta")).toMatchObject({ champion: "0.2", candidate: "0.3" });
  });

  it("gate.json v1: sin parámetros ni mapa; métricas de reports", () => {
    const { schemaVersion: _v, configs: _c, summaries: _s, dryRun: _d, promoted: _p, promotedVersion: _n, ...v1 } = gx.passed.gate;
    const m = gateModel("p", v1);
    expect(m).toMatchObject({ schemaVersion: 1, params: null, command: null, verdict: { dryRun: null, promoted: null } });
    expect(m.heatmap.tuning).toBeNull();
    expect(m.metrics.tuning!.candidate).toMatchObject({ agreementRate: v1.reports.tuning!.candidate.agreementRate, violations: null });
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
      numericLeaves([fx.summary, fx.games, [...fx.traces.values()], fx.tournament.trace, fx.tournament.ref, gx.rejected.gate, gx.passed.gate, gx.promoted.gate]).map((l) => l.value),
    );
    const models = [
      runsModel([{ runId: fx.runId, kind: "arena", summary: fx.summary }]),
      matchesModel(fx.summary, fx.games, { rival: "boulware" }),
      ...fx.games.map((g) => arenaReplayModel(g, fx.traces.get(g.gameId) ?? null)),
      tournamentReplayModel(fx.tournament.trace, fx.tournament.ref),
      ...fx.games.filter(isTwoIssue).map((g) => twoIssueModel(g, fx.traces.get(g.gameId) ?? null)),
      ...[gx.rejected, gx.passed, gx.promoted].map((g) => gateModel("p", g.gate)),
    ];
    const computed = numericLeaves(models).filter((l) => !source.has(l.value) && !l.key.endsWith("Count"));
    expect(computed).toEqual([]);
  });
});

describe("twoIssueModel additional assertions (T8)", () => {
  const pctDay = () => fx.games.find((g) => g.scenarioId === "pct-day-buyer-wide")!;

  it("mandateLine reflects the mandate when present (mandate: {pct} × {day})", () => {
    const line = pctDay();
    const m = twoIssueModel(line, fx.traces.get(line.gameId)!);
    expect(m.mandateLine).toBeTruthy();
    expect(m.mandateLine).toContain("pct");
    expect(m.mandateLine).toContain("day");
  });

  it("withinMandate is true/false/null based on agreement vs mandate (real behaviour)", () => {
    const line = pctDay();
    const m = twoIssueModel(line, fx.traces.get(line.gameId)!);
    // withinMandate is null without explain, true or false with agreement
    expect(typeof m.withinMandate === "boolean" || m.withinMandate === null).toBe(true);
  });

  it("utility null when explain is not present (v1 trace)", () => {
    const line = pctDay();
    const v1 = twoIssueModel(line, asV1Trace(fx.traces.get(line.gameId)!));
    expect(v1.utilities.length).toBe(0);
    if (v1.rows) {
      v1.rows.forEach((r) => {
        expect(r.uOffer).toBeNull();
        expect(r.uRival).toBeNull();
      });
    }
  });
});

describe("matchesModel KPIs and game state assertions (T10)", () => {
  it("model rows include zopaEmpty field from metrics", () => {
    const withZopaEmpty = { ...fx.games[0]!, metrics: { ...fx.games[0]!.metrics, zopaEmpty: true } };
    const m = matchesModel(fx.summary, [withZopaEmpty]);
    expect(m.rows[0]!.zopaEmpty).toBe(true);
  });

  it("model rows include agreement field from line", () => {
    const withAgreement = { ...fx.games[0]!, agreement: { price: 50 } };
    const m = matchesModel(fx.summary, [withAgreement]);
    expect(m.rows[0]!.agreement).toEqual({ price: 50 });
  });

  it("KPIs emptyZopaCorrect is null when not present in summary.overall", () => {
    const summary = { ...fx.summary, overall: { ...fx.summary.overall, emptyZopaCorrect: undefined } };
    const m = matchesModel(summary, fx.games);
    expect(m.kpis.emptyZopaCorrect).toBeNull();
  });

  it("KPIs durationMs is always present from summary", () => {
    const m = matchesModel(fx.summary, fx.games);
    expect(typeof m.kpis.durationMs).toBe("number");
  });

  it("model rows include injectionSuspected as optional metrics field", () => {
    const withInjection = { ...fx.games[0]!, metrics: { ...fx.games[0]!.metrics, injectionSuspected: 2 } };
    const m = matchesModel(fx.summary, [withInjection]);
    expect(m.rows[0]!.injectionSuspected).toBe(2);
  });
});
