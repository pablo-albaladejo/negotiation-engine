import { describe, expect, it } from "vitest";
import { agentLines, boardModel, bookMakerLabel, niceScale, offerCurve, ourOfferIds, historyGroups, liveItems, mentionsUs, partyOf, scheduleLines, scoreMovers, standingOf, teamLabel, withTeamNames, type Board, type BoardRow } from "../../src/model/index.js";

const EMPTY: Board = boardModel(null);

const row = (over: Partial<BoardRow> & Pick<BoardRow, "id" | "kind" | "status">): BoardRow => ({
  counterparty: "x",
  item: "x",
  closed_reason: null,
  price: null,
  our_value: null,
  value_source: null,
  surplus: null,
  verdict: "open",
  d_neg_points: null,
  d_ladder_points: null,
  d_score: null,
  duel_result: null,
  tick_opened: null,
  tick_settled: null,
  messages: [],
  offers: [],
  decisions: [],
  ...over,
});

const team = (name: string, rank: number, score: number, us = false) => ({ name, rank, score, us }) as Board["market"]["leaderboard"][number];

describe("cockpit · standingOf", () => {
  it("distancia al de delante y al líder, con la cifra del juego", () => {
    const board = { ...EMPTY, market: { ...EMPTY.market, leaderboard: [team("A", 1, 30), team("B", 2, 10), team("Us", 3, 7.16, true)] } };
    const st = standingOf(board);
    expect(st).toMatchObject({ rank: 3, teams: 3, score: 7.16, gapToAhead: 2.84, gapToLeader: 22.84 });
    expect(st.ahead?.name).toBe("B");
    expect(st.leader?.name).toBe("A");
  });

  it("si vamos primeros no hay líder ni equipo por delante", () => {
    const st = standingOf({ ...EMPTY, market: { ...EMPTY.market, leaderboard: [team("Us", 1, 9, true), team("B", 2, 3)] } });
    expect(st.leader).toBeNull();
    expect(st.ahead).toBeNull();
  });
});

describe("cockpit · liveItems", () => {
  it("duelo vivo: límite, nuestra puja y la del rival; los cerrados no salen", () => {
    const board = {
      ...EMPTY,
      rows: [
        row({ id: "duel:1", kind: "duel-seller", status: "live", item: "Taxi", our_value: 50, messages: [{ sender: "r", us: false, tick: 1, price: 40, text: "" }] }),
        row({ id: "duel:2", kind: "duel-buyer", status: "deal" }),
      ],
    };
    expect(liveItems(board)).toEqual([expect.objectContaining({ id: "duel:1", title: "Sell Taxi", state: "limit 50 · they bid 40" })]);
  });

  it("oferta de venta: avisa si es nuestra única copia y marca la sobrante", () => {
    const offer = (id: number, give: string) => row({ id: `offer:${id}`, kind: "team-offer", status: "open", offers: [{ id, tick: 1, maker: "t02", give, want: "9 P", final: false, status: "open" }] });
    const items = liveItems({ ...EMPTY, holdings: { "SAL-07": 2, "LAT-04": 1 }, rows: [offer(1, "SAL-07"), offer(2, "LAT-04"), offer(3, "12 P")] });
    expect(items.map((i) => [i.title, i.warning])).toEqual([
      ["Sell SAL-07 (spare, we hold 2) for 9 P", null],
      ["Sell LAT-04 for 9 P", "selling our only LAT-04"],
      ["Buy 9 P for 12 P", null],
    ]);
  });

  it("orden: duelos, dealers y ofertas", () => {
    const items = liveItems({ ...EMPTY, rows: [row({ id: "o", kind: "team-offer", status: "open" }), row({ id: "t", kind: "dealer-buy", status: "open" }), row({ id: "d", kind: "duel-buyer", status: "live" })] });
    expect(items.map((i) => i.kind)).toEqual(["duel", "dealer", "offer"]);
  });
});

describe("cockpit · scoreMovers e historyGroups", () => {
  const rows = [
    row({ id: "a", kind: "dealer-buy", status: "deal", d_score: 0, tick_settled: 5 }),
    row({ id: "b", kind: "dealer-buy", status: "deal", d_score: -0.1, tick_settled: 9 }),
    row({ id: "c", kind: "dealer-sell", status: "deal", d_score: 0.4, tick_settled: 12 }),
    row({ id: "d", kind: "duel-buyer", status: "deal", tick_settled: 3 }),
    row({ id: "e", kind: "dealer-buy", status: "open" }),
  ];

  it("solo los tratos con Δ real, el más reciente primero", () => {
    expect(scoreMovers({ ...EMPTY, rows }).map((r) => r.id)).toEqual(["c", "b"]);
  });

  it("historial: cerrados, duelos aparte", () => {
    const g = historyGroups(rows);
    expect(g.trades.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(g.duels.map((r) => r.id)).toEqual(["d"]);
  });
});

describe("cockpit · agentLines y scheduleLines", () => {
  it("vivo si escribió hace ≤ 3 ticks; parado si no; sin traza si no hay nada", () => {
    const now = Date.parse("2026-10-03T10:00:00Z");
    const board = {
      ...EMPTY,
      agents: [
        { agent: "dealers" as const, last_at: "2026-10-03T09:59:30Z", last_tick: 158, detail: "counter" },
        { agent: "duels" as const, last_at: "2026-10-03T09:40:00Z", last_tick: null, detail: null },
        { agent: "broker" as const, last_at: null, last_tick: null, detail: null },
      ],
    };
    expect(agentLines(board, now)).toEqual([
      { agent: "dealers", health: "running", text: "30 s ago · tick 158 · counter" },
      { agent: "duels", health: "stale", text: "20 min ago" },
      { agent: "broker", health: "no trace", text: "no trace yet" },
    ]);
  });

  it("calendario: horas que faltan y etiqueta legible", () => {
    const board = { ...EMPTY, schedule: { now_hours: 2.65, upcoming: [{ at_hours: 3, action: "bench", note: "n", wall: null }, { at_hours: 6.5, action: "other", note: "", wall: null }] } };
    expect(scheduleLines(board)).toEqual([
      { at_hours: 3, when: "in 0.35 h", action: "Market Test", note: "n" },
      { at_hours: 6.5, when: "in 3.9 h", action: "other", note: "" },
    ]);
  });
});

describe("cockpit · quién es quién", () => {
  const board: Board = {
    ...EMPTY,
    team: "t02",
    market: { ...EMPTY.market, leaderboard: [team("Team 2", 16, 7, true), team("Los Gatos", 3, 20)].map((t, i) => ({ ...t, team: i === 0 ? "t02" : "t05" })) },
  };

  it("teamLabel: nosotros con (us), el resto por nombre e id, desconocidos tal cual", () => {
    expect(teamLabel(board, "t02")).toBe("Team 2 (us)");
    expect(teamLabel(board, "t05")).toBe("Los Gatos (t05)");
    expect(teamLabel(board, "t99")).toBe("t99");
    const named = { ...board, market: { ...board.market, leaderboard: [{ ...team("Team 13", 1, 30), team: "t13" }] } };
    expect(teamLabel(named, "t13")).toBe("Team 13");
  });

  it("withTeamNames y mentionsUs sobre el texto del feed", () => {
    expect(withTeamNames(board, "t05 sold to t02; t99 watched")).toBe("Los Gatos (t05) sold to Team 2 (us); t99 watched");
    expect(mentionsUs(board, "t05 sold to t02")).toBe(true);
    expect(mentionsUs(board, "t05 sold to t12")).toBe(false);
  });

  it("partyOf: dealer, rival de duelo, oferta pública o equipo con nombre", () => {
    expect(partyOf(board, row({ id: "a", kind: "dealer-buy", status: "deal", counterparty: "abuela" }))).toEqual({ label: "abuela", kind: "dealer" });
    expect(partyOf(board, row({ id: "b", kind: "duel-seller", status: "deal", counterparty: "Rival Rojo" }))).toEqual({ label: "Rival Rojo", kind: "duel rival" });
    expect(partyOf(board, row({ id: "c", kind: "team-offer", status: "open" })).kind).toBe("public");
    expect(partyOf(board, row({ id: "d", kind: "team-trade", status: "sold", counterparty: "t05 @ rastro" }))).toEqual({ label: "Los Gatos (t05) @ rastro", kind: "team" });
  });

  it("libros anónimos: las nuestras por id de oferta, el resto anónimo", () => {
    const withOffer = { ...board, rows: [row({ id: "offer:7", kind: "team-offer", status: "open", offers: [{ id: 7, tick: 1, maker: "t02", give: "SAL-07", want: "9 P", final: false, status: "open" }] })] };
    const ours = ourOfferIds(withOffer);
    expect(bookMakerLabel(withOffer, { id: 7, maker: "m3950d43b" }, ours)).toEqual({ label: "Team 2 (us)", us: true });
    expect(bookMakerLabel(withOffer, { id: 8, maker: "m3950d43b" }, ours)).toEqual({ label: "another team (anonymous m3950)", us: false });
    expect(bookMakerLabel(withOffer, { id: 9, maker: "t05" }, ours)).toEqual({ label: "Los Gatos (t05)", us: false });
  });
});

describe("cockpit · offerCurve", () => {
  const msg = (tick: number, us: boolean, price: number | null) => ({ sender: us ? "t02" : "abuela", us, tick, price, text: "" });
  const dec = (tick: number, reservation: number | null, action = "counter") => ({ tick, action, rule: null, reservation, ourPrice: null, herPrice: null });

  it("ticks relativos, último precio de cada lado por tick, límite por tick y final del trato", () => {
    const curve = offerCurve(
      row({
        id: "thread:227",
        kind: "dealer-buy",
        status: "deal",
        price: 25,
        our_value: 32.5,
        tick_settled: 121,
        messages: [msg(119, true, 22), msg(119, false, 29), msg(120, false, 26), msg(120, true, 25), msg(121, false, null)],
        decisions: [dec(118, 32, "open"), dec(119, 28), dec(120, 28)],
      }),
    );
    expect(curve).toMatchObject({
      firstTick: 118,
      rounds: 5,
      ours: [{ round: 2, value: 22 }, { round: 3, value: 25 }],
      theirs: [{ round: 2, value: 29 }, { round: 3, value: 26 }],
      limit: [{ round: 1, value: 32 }, { round: 2, value: 28 }, { round: 3, value: 28 }],
      capped: { from: 32, to: 28 },
      reference: { value: 32.5, label: "our value 32.5" },
      end: { round: 4, kind: "deal", label: "deal 25" },
      yDomain: [20, 35],
      yTicks: [20, 25, 30, 35],
    });
  });

  it("duelo: el límite fijo es your_limit; sin final si sigue vivo", () => {
    const curve = offerCurve(row({ id: "duel:1", kind: "duel-buyer", status: "live", our_value: 116, messages: [msg(157, false, 119), msg(158, true, 90)] }));
    expect(curve).toMatchObject({ reference: { value: 116, label: "our limit 116" }, capped: null, limit: [], end: null, rounds: 3 });
  });

  it("niceScale: pasos 1/2/5 que cubren el rango", () => {
    expect(niceScale(20.4, 34.1)).toEqual({ domain: [20, 35], ticks: [20, 25, 30, 35] });
    expect(niceScale(85, 125)).toEqual({ domain: [80, 130], ticks: [80, 90, 100, 110, 120, 130] });
  });

  it("menos de dos precios ⇒ sin curva", () => {
    expect(offerCurve(row({ id: "x", kind: "dealer-buy", status: "open", messages: [msg(1, true, 5)] }))).toBeNull();
  });
});
