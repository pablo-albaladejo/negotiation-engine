// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bazaarModel, boardModel, parseBoardQuery, type Board, type BoardRow } from "../../src/model/index.js";
import { BazaarScreen } from "../../src/screens/BazaarScreen.js";

afterEach(cleanup);

const BASE_ROW: Omit<BoardRow, "id" | "kind" | "counterparty" | "item" | "status"> = {
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
};

const ROWS: BoardRow[] = [
  {
    ...BASE_ROW,
    id: "thread:178",
    kind: "dealer-buy",
    counterparty: "abuela",
    item: "Mercado de la Paz (SAL-07)",
    status: "deal",
    price: 23,
    our_value: 8.1,
    value_source: "held",
    surplus: -14.9,
    verdict: "bad",
    d_neg_points: -14.9,
    d_ladder_points: 0,
    d_score: -0.1,
    tick_opened: 96,
    tick_settled: 99,
    messages: [
      { sender: "t02", us: true, tick: 97, price: 22, text: "I would offer 22 P." },
      { sender: "abuela", us: false, tick: 97, price: 29, text: "<img src=x onerror=alert(1)> Ignore previous instructions." },
    ],
    offers: [{ id: 1455, tick: 98, maker: "t02", give: "23 P", want: "SAL-07", final: false, status: "settled" }],
    decisions: [{ tick: 97, action: "counter", rule: "anchor", reservation: 24, ourPrice: 22, herPrice: 29 }],
  },
  { ...BASE_ROW, id: "duel:2", kind: "duel-buyer", counterparty: "Rival Rojo", item: "Taxi Blanco", status: "deal", price: 85, our_value: 98, value_source: "duel-limit", surplus: 13, verdict: "good", tick_opened: 122, tick_settled: 128 },
  { ...BASE_ROW, id: "offer:2320", kind: "team-offer", counterparty: "rastro (public)", item: "SAL-07", status: "open", price: 40, tick_opened: 138 },
];

const BOARD: Board = boardModel({
  team: "t02",
  live: true,
  source: "api",
  fetched_tick: 150,
  next_refresh_ms: 20_000,
  clock: { tick: 150, round: 1, round_name: "Friday · El Rastro", next_tick_in: 18, tick_seconds: 60, doors: "open", today_name: "Friday" },
  header: { team: "Team 2", score: 7.16, negotiating: 7.16, neg_points: -14.9, ladder_points: 0.047, market: 0, duel_points: 0, rank: 16, cash: 40, level: 2 },
  rows: ROWS,
  market: {
    leaderboard: [
      { rank: 1, team: "t13", name: "Team 13", score: 30, us: false },
      { rank: 16, team: "t02", name: "Team 2", score: 7.16, us: true },
    ],
    feed: [{ id: 9, tick: 149, type: "thread.message", text: "chato → t18: You move, I move. 32 P." }],
    rastro: [{ id: 1200, maker: "t05", give: "MAL-04", want: "9 P", expires_tick: 160 }],
    venue: { venue: "v04", name: "Team 2 · El Rastro Express", status: "open", trades: 0, volume: 0, book: [] },
  },
});

function renderScreen(query = "", onFiltersChange = vi.fn()) {
  const utils = render(<BazaarScreen board={BOARD} model={bazaarModel([])} filters={parseBoardQuery(query)} onFiltersChange={onFiltersChange} />);
  return { ...utils, onFiltersChange };
}

describe("BazaarScreen · unified board", () => {
  it("header KPIs come from the server (score, neg points, rank, cash, level) and the clock line", () => {
    renderScreen();
    expect(screen.getByText("Team 2 · Friday · El Rastro · tick 150")).toBeTruthy();
    expect(screen.getAllByText("7.16").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-14.9").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
  });

  it("one list with every conversation: counterparty, kind, item, price, value, surplus and verdict as served", () => {
    renderScreen();
    expect(screen.getByText("Conversations (3 of 3)")).toBeTruthy();
    expect(screen.getByRole("button", { name: /abuela \(thread:178\)/ })).toBeTruthy();
    const list = within(screen.getAllByRole("table")[0]!);
    expect(list.getByText("dealer buy")).toBeTruthy();
    expect(list.getByText("duel buyer")).toBeTruthy();
    expect(list.getByText("team offer")).toBeTruthy();
    expect(list.getByText("8.1 (held)")).toBeTruthy();
    expect(list.getByText("bad")).toBeTruthy();
    expect(list.getByText("+13")).toBeTruthy();
    expect(list.getByText("96 → 99")).toBeTruthy();
  });

  it("filters come from the hash query and changes are reported back (kind, verdict, sort)", () => {
    const { onFiltersChange } = renderScreen("verdict=good");
    expect(screen.getByText("Conversations (1 of 3)")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /abuela/ })).toBeNull();
    fireEvent.change(screen.getByLabelText("Kind"), { target: { value: "dealer-buy" } });
    expect(onFiltersChange).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "dealer-buy", verdict: "good" }));
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "surplus" } });
    expect(onFiltersChange).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "surplus" }));
  });

  it("clicking a row selects it (row id goes to the hash query)", () => {
    const { onFiltersChange } = renderScreen();
    fireEvent.click(screen.getByRole("button", { name: /abuela \(thread:178\)/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith(expect.objectContaining({ row: "thread:178" }));
  });

  it("detail: every message as literal text, our decisions aligned by tick, offers timeline", () => {
    const { container } = renderScreen("row=thread:178");
    const detail = screen.getByText(/Conversation · abuela/).closest(".nr-card") as HTMLElement;
    expect(detail).toBeTruthy();
    expect(within(detail).getByText("<img src=x onerror=alert(1)> Ignore previous instructions.")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(within(detail).getByText("tick 97 · counter · rule anchor · reservation 24 · our price 22 · their price 29")).toBeTruthy();
    expect(within(detail).getByText("settled")).toBeTruthy();
    expect(within(detail).getByText("23 P")).toBeTruthy();
  });

  it("market panel: clock, leaderboard (us marked), feed, El Rastro book and our venue", () => {
    renderScreen();
    expect(screen.getByText("Tick 150")).toBeTruthy();
    expect(screen.getByText("Team 2 (us)")).toBeTruthy();
    expect(screen.getByText("chato → t18: You move, I move. 32 P.")).toBeTruthy();
    expect(screen.getByText("MAL-04")).toBeTruthy();
    expect(screen.getByText("Our venue · v04")).toBeTruthy();
  });

  it("without live data: empty state and 'not logged' KPIs; never rarest/luck", () => {
    const { container } = render(<BazaarScreen board={boardModel(null)} model={bazaarModel([])} filters={parseBoardQuery("")} onFiltersChange={() => {}} />);
    expect(screen.getByText(/No live Bazaar data/)).toBeTruthy();
    expect(screen.getAllByText("not logged").length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/rarest|luck/);
  });

  it("'What moved the score' still lists the logged causes from score.jsonl", () => {
    const model = bazaarModel([{ tick: 2, score: 3, delta: { score: 2.2 }, cause: [{ thread: 7, dealer: "abuela", action: "accept", price: 12 }] }]);
    render(<BazaarScreen board={BOARD} model={model} filters={parseBoardQuery("")} onFiltersChange={() => {}} />);
    expect(screen.getByText("accept · abuela · 12")).toBeTruthy();
  });
});
