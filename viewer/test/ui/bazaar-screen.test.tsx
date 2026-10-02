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
  { ...BASE_ROW, id: "offer:2320", kind: "team-offer", counterparty: "rastro (public)", item: "SAL-07", status: "open", price: 40, tick_opened: 138, offers: [{ id: 2320, tick: 138, maker: "t02", give: "SAL-07", want: "40 P", final: false, status: "open" }] },
  { ...BASE_ROW, id: "offer:2321", kind: "team-offer", counterparty: "rastro (public)", item: "LAT-04", status: "open", price: 9, tick_opened: 138, offers: [{ id: 2321, tick: 138, maker: "t02", give: "LAT-04", want: "9 P", final: false, status: "open" }] },
  {
    ...BASE_ROW,
    id: "duel:300",
    kind: "duel-buyer",
    counterparty: "Rival Noche",
    item: "Plaza de Olavide",
    status: "live",
    our_value: 116,
    value_source: "duel-limit",
    messages: [
      { sender: "Rival Noche", us: false, tick: 157, price: 119, text: "119 P." },
      { sender: "t02", us: true, tick: 158, price: 90, text: "90 P." },
    ],
  },
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
      { rank: 17, team: "t05", name: "Los Gatos", score: 5, us: false },
    ],
    feed: [
      { id: 9, tick: 149, type: "thread.message", text: "chato → t18: You move, I move. 32 P." },
      { id: 10, tick: 150, type: "settlement", text: "t05 sold MAL-04 to t02 for 9 P" },
    ],
    rastro: [
      { id: 1200, maker: "t05", give: "MAL-04", want: "9 P", expires_tick: 160 },
      { id: 2320, maker: "m3950d43b", give: "SAL-07", want: "40 P", expires_tick: 170 },
      { id: 1201, maker: "m41383bb2", give: "LAV-02", want: "12 P", expires_tick: 165 },
    ],
    venue: { venue: "v04", name: "Team 2 · El Rastro Express", status: "open", trades: 0, volume: 0, book: [] },
  },
  album: {
    filled: 19,
    slots: 40,
    pages: [
      { set: "SAL", name: "Salamanca", have: 9, of: 10, complete: false, missing: [{ ref: "SAL-09", name: "El Retiro Norte", rarity: "rare", book: 90, value: 177.1 }] },
      { set: "MAL", name: "Malasaña", have: 2, of: 10, complete: false, missing: [] },
    ],
  },
  holdings: { "SAL-07": 2, "LAT-04": 1 },
  schedule: { now_hours: 2.65, upcoming: [{ at_hours: 3, action: "bench", note: "The Market Test", wall: null }, { at_hours: 6.5, action: "duels", note: "Duels I: price only", wall: null }] },
  agents: [{ agent: "dealers", last_at: null, last_tick: 149, detail: "counter" }],
});

function renderScreen(query = "", onFiltersChange = vi.fn()) {
  const utils = render(<BazaarScreen board={BOARD} model={bazaarModel([])} filters={parseBoardQuery(query)} onFiltersChange={onFiltersChange} />);
  return { ...utils, onFiltersChange };
}

describe("BazaarScreen · cockpit", () => {
  it("score: the game's score and rank, the gap to the leader, and its parts as served", () => {
    renderScreen();
    const card = within(screen.getByRole("heading", { name: "Score" }).closest(".nr-card") as HTMLElement);
    expect(card.getAllByText("7.16").length).toBeGreaterThan(0);
    expect(card.getByText("#16 of 3")).toBeTruthy();
    expect(card.getByText(/22.84 behind Team 13/)).toBeTruthy();
    expect(card.getByText("-14.9")).toBeTruthy();
  });

  it("next up: what comes and how many game hours away", () => {
    renderScreen();
    expect(screen.getByText("in 0.35 h")).toBeTruthy();
    expect(screen.getByText("in 3.9 h")).toBeTruthy();
    expect(screen.getByText(/Duels I: price only/)).toBeTruthy();
  });

  it("right now: live duel with limit and both prices; offers say spare vs our only copy", () => {
    renderScreen();
    const now = within(screen.getByText(/Right now \(3 open\)/).closest(".nr-card") as HTMLElement);
    expect(now.getByText("limit 116 · we bid 90 · they ask 119")).toBeTruthy();
    expect(now.getByText("Sell SAL-07 (spare, we hold 2) for 40 P")).toBeTruthy();
    expect(now.getByText(/⚠ selling our only LAT-04/)).toBeTruthy();
  });

  it("album: pages with progress and the missing cards with our value", () => {
    renderScreen();
    expect(screen.getByText("Album 19/40")).toBeTruthy();
    expect(screen.getByText(/SAL-09 El Retiro Norte \[rare\] — value 177.1 · book 90/)).toBeTruthy();
    expect(screen.getByRole("meter", { name: "9 of 10" })).toBeTruthy();
  });

  it("what moved the score: only deals with a real Δ from the game", () => {
    renderScreen();
    const card = within(screen.getByText("What moved the score").closest(".nr-card") as HTMLElement);
    expect(card.getByText("-0.1")).toBeTruthy();
    expect(card.getByRole("button", { name: "Open thread:178" })).toBeTruthy();
    expect(card.queryByText(/Taxi Blanco/)).toBeNull();
  });

  it("our agents: one line per agent with its last trace", () => {
    renderScreen();
    expect(screen.getByText(/tick 149 · counter/)).toBeTruthy();
  });

  it("history is folded and split: dealers/El Rastro apart from (practice) duels; no good/bad verdict", () => {
    renderScreen();
    expect(screen.getByText("History · dealers and El Rastro (1)")).toBeTruthy();
    expect(screen.getByText("History · duels (practice: 0 duel points so far) (1)")).toBeTruthy();
    expect(screen.queryByText("good")).toBeNull();
    expect(screen.queryByText("bad")).toBeNull();
  });

  it("clicking an open deal selects it; the conversation opens in a side panel that closes with the button or Escape", () => {
    const { onFiltersChange } = renderScreen();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open duel:300" }));
    expect(onFiltersChange).toHaveBeenLastCalledWith(expect.objectContaining({ row: "duel:300" }));
    cleanup();
    const closed = vi.fn();
    renderScreen("row=thread:178", closed);
    const dialog = screen.getByRole("dialog", { name: "Conversation thread:178" });
    expect(within(dialog).getByText("Conversation · abuela (dealer) · dealer buy")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close conversation" }));
    expect(closed).toHaveBeenLastCalledWith(expect.objectContaining({ row: "" }));
    closed.mockClear();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(closed).toHaveBeenLastCalledWith(expect.objectContaining({ row: "" }));
  });

  it("the detail shows every message as literal text and tags our messages as Team 2 (us)", () => {
    const { container } = renderScreen("row=thread:178");
    const detail = screen.getByRole("dialog");
    expect(within(detail).getAllByText("Team 2 (us)").length).toBeGreaterThan(0);
    expect(within(detail).getByRole("figure", { name: "Negotiation curve" })).toBeTruthy();
    expect(within(detail).getByText("X axis: ticks since tick 97 (1 = tick 97).")).toBeTruthy();
    expect(within(detail).getByText("<img src=x onerror=alert(1)> Ignore previous instructions.")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(within(detail).getByText("Δ score -0.1")).toBeTruthy();
  });

  it("history filters still come from the hash query", () => {
    const { onFiltersChange } = renderScreen();
    fireEvent.change(screen.getAllByLabelText("Kind")[0]!, { target: { value: "dealer-buy" } });
    expect(onFiltersChange).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "dealer-buy" }));
  });

  it("we are named once on top, and every other team by name and id", () => {
    renderScreen();
    const score = within(screen.getByRole("heading", { name: "Score" }).closest(".nr-card") as HTMLElement);
    expect(score.getByText("Team 2 (us)")).toBeTruthy();
    expect(score.getByText(/id t02/)).toBeTruthy();
    const now = within(screen.getByText(/Right now/).closest(".nr-card") as HTMLElement);
    expect(now.getAllByText("anyone (public offer) · public").length).toBe(2);
    expect(now.getByText("Rival Noche · duel rival")).toBeTruthy();
  });

  it("market stays available (folded): leaderboard with us marked, feed and El Rastro with team names, our venue", () => {
    renderScreen();
    const lb = within(screen.getByRole("heading", { name: "Leaderboard" }).closest(".nr-card") as HTMLElement);
    expect(lb.getByText("Team 2 (us)")).toBeTruthy();
    expect(screen.getByText("chato → t18: You move, I move. 32 P.")).toBeTruthy();
    expect(screen.getByText("Los Gatos (t05) sold MAL-04 to Team 2 (us) for 9 P").tagName).toBe("STRONG");
    const rastro = within(screen.getByRole("heading", { name: "El Rastro book" }).closest(".nr-card") as HTMLElement);
    expect(rastro.getByText("Los Gatos (t05)")).toBeTruthy();
    expect(rastro.getByText("Team 2 (us)")).toBeTruthy();
    expect(rastro.getByText("another team (anonymous m4138)")).toBeTruthy();
    expect(screen.getByText("Our venue · v04")).toBeTruthy();
  });

  it("without live data: empty state and placeholders; never rarest/luck", () => {
    const { container } = render(<BazaarScreen board={boardModel(null)} model={bazaarModel([])} filters={parseBoardQuery("")} onFiltersChange={() => {}} />);
    expect(screen.getByText(/No live Bazaar data/)).toBeTruthy();
    expect(screen.getByText("Nothing open.")).toBeTruthy();
    expect(container.textContent).not.toMatch(/rarest|luck/);
  });
});
