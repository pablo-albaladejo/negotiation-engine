// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { bazaarModel, type ConversationThread, type Duel } from "../../src/model/index.js";
import { BazaarScreen } from "../../src/screens/BazaarScreen.js";

afterEach(cleanup);

const THREADS: ConversationThread[] = [
  {
    id: 56,
    with: "abuela",
    topic: { sell: { assets: [23] } },
    status: "open",
    closed_reason: null,
    messages: [
      { sender: "abuela", text: "Hola, cariño, 13 P for it.", ts: 29 },
      { sender: "t02", text: "Hello, Abuela! I was hoping for 21 P.", ts: 29 },
    ],
    standing_offers: [{ maker: "abuela", give: { cash: 13 }, want: { cash: 0 }, assets: ["MAL-02"], final: false }],
    trace: [
      { tick: 29, ourPrice: 21, herPrice: 13, rule: "anchor" },
      { tick: 30, ourPrice: 18, herPrice: 13, rule: "adaptive" },
    ],
  },
  {
    id: 178,
    with: "abuela",
    topic: { buy: { rarity: "uncommon", set: "SAL" } },
    status: "deal",
    closed_reason: null,
    messages: [{ sender: "t02", text: "Deal at 23.", ts: 99 }],
    standing_offers: [],
    trace: [{ tick: 99, action: "outcome", status: "deal" }],
  },
  {
    id: 125,
    with: "abuela",
    topic: { buy: { card: "SAL-05" } },
    status: "walked",
    closed_reason: "no_progress",
    messages: [],
    standing_offers: [],
    trace: [],
  },
];

const DUELS: Duel[] = [
  { id: 1, role: "seller", status: "open", rival: "team-y", your_limit: 10, done: false },
  { id: 2, role: "buyer", status: "won", rival: "team-x", your_limit: 5, done: true },
];

describe("BazaarScreen · Conversations", () => {
  it("lista los hilos con estado, con quién y el tema, más reciente primero", () => {
    render(<BazaarScreen model={bazaarModel([])} live={null} conversations={THREADS} duels={[]} />);
    expect(screen.getByText("Conversations")).toBeTruthy();
    expect(screen.getAllByText("abuela").length).toBeGreaterThan(0);
    expect(screen.getAllByText("open").length).toBeGreaterThan(0);
    expect(screen.getByText("deal")).toBeTruthy();
    expect(screen.getByText("walked")).toBeTruthy();
  });

  it("muestra el chat del primer hilo (texto literal, sin interpretar) y sus chips de oferta", () => {
    render(<BazaarScreen model={bazaarModel([])} live={null} conversations={THREADS} duels={[]} />);
    expect(screen.getByText("Hola, cariño, 13 P for it.")).toBeTruthy();
    expect(screen.getByText("Hello, Abuela! I was hoping for 21 P.")).toBeTruthy();
    expect(screen.getByText(/abuela 13/)).toBeTruthy();
  });

  it("al seleccionar otro hilo de la lista, el chat cambia", () => {
    render(<BazaarScreen model={bazaarModel([])} live={null} conversations={THREADS} duels={[]} />);
    const walkedEntry = screen.getByText("walked").closest("button")!;
    fireEvent.click(walkedEntry);
    expect(screen.getByText(/no_progress/)).toBeTruthy();
  });

  it("sin conversaciones: estado vacío, sin Card de Duels", () => {
    render(<BazaarScreen model={bazaarModel([])} live={null} conversations={[]} duels={[]} />);
    expect(screen.getByText("No Bazaar conversations yet")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Duels" })).toBeNull();
  });

  it("Duels: una fila por duelo, con rival/rol/estado/límite", () => {
    render(<BazaarScreen model={bazaarModel([])} live={null} conversations={[]} duels={DUELS} />);
    expect(screen.getByRole("heading", { name: "Duels" })).toBeTruthy();
    expect(screen.getByText("team-y")).toBeTruthy();
    expect(screen.getByText("team-x")).toBeTruthy();
  });
});
