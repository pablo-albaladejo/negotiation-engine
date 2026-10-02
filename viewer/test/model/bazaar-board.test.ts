import { describe, expect, it } from "vitest";
import { boardFilterOptions, boardModel, boardQuery, boardTimeline, filterBoardRows, parseBoardQuery, type BoardRow } from "../../src/model/index.js";

const row = (over: Partial<BoardRow> & Pick<BoardRow, "id">): BoardRow => ({
  kind: "dealer-buy",
  counterparty: "abuela",
  item: "x",
  status: "deal",
  closed_reason: null,
  price: null,
  our_value: null,
  value_source: null,
  surplus: null,
  verdict: "not logged",
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

const ROWS = [
  row({ id: "thread:178", surplus: -14.9, verdict: "bad", tick_opened: 96 }),
  row({ id: "duel:2", kind: "duel-buyer", counterparty: "Rival Rojo", surplus: 13, verdict: "good", tick_opened: 122 }),
  row({ id: "offer:1", kind: "team-offer", counterparty: "rastro (public)", status: "open", verdict: "open", tick_opened: 138 }),
];

describe("bazaar board model", () => {
  it("hash query round-trips (only non-default filters are written)", () => {
    const f = parseBoardQuery("kind=duel-buyer&with=Rival%20Rojo&verdict=good&sort=surplus&row=duel%3A2");
    expect(f).toEqual({ kind: "duel-buyer", counterparty: "Rival Rojo", status: "all", verdict: "good", sort: "surplus", row: "duel:2" });
    expect(parseBoardQuery(boardQuery(f))).toEqual(f);
    expect(boardQuery(parseBoardQuery(""))).toBe("");
  });

  it("filters by kind/counterparty/status/verdict and sorts by tick (newest) or surplus (best)", () => {
    expect(filterBoardRows(ROWS, parseBoardQuery("")).map((r) => r.id)).toEqual(["offer:1", "duel:2", "thread:178"]);
    expect(filterBoardRows(ROWS, parseBoardQuery("sort=surplus")).map((r) => r.id)).toEqual(["duel:2", "thread:178", "offer:1"]);
    expect(filterBoardRows(ROWS, parseBoardQuery("verdict=bad")).map((r) => r.id)).toEqual(["thread:178"]);
    expect(filterBoardRows(ROWS, parseBoardQuery("with=Rival%20Rojo&kind=duel-buyer")).map((r) => r.id)).toEqual(["duel:2"]);
    expect(filterBoardRows(ROWS, parseBoardQuery("status=open")).map((r) => r.id)).toEqual(["offer:1"]);
  });

  it("filter options are the distinct values present", () => {
    expect(boardFilterOptions(ROWS).verdict).toEqual(["bad", "good", "open"]);
  });

  it("timeline groups messages and our decisions by tick, in order", () => {
    const r = row({
      id: "thread:1",
      messages: [
        { sender: "abuela", us: false, tick: 98, price: 25, text: "25" },
        { sender: "t02", us: true, tick: 97, price: 22, text: "22" },
      ],
      decisions: [{ tick: 97, action: "counter", rule: "anchor", reservation: 24, ourPrice: 22, herPrice: 29 }],
    });
    const steps = boardTimeline(r);
    expect(steps.map((s) => s.tick)).toEqual([97, 98]);
    expect(steps[0]!.decisions[0]!.rule).toBe("anchor");
  });

  it("boardModel tolerates a missing payload", () => {
    expect(boardModel(null).rows).toEqual([]);
  });
});
