import { describe, expect, it } from "vitest";
import { agentLines, boardModel, historyGroups, liveItems, scheduleLines, scoreMovers, standingOf, type Board, type BoardRow } from "../../src/model/index.js";

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
