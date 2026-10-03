/**
 * Vista unificada del Bazaar tal como la sirve `/api/bazaar/board`: el servidor ya calculó valor,
 * excedente, veredicto y deltas; aquí solo se tipa, se filtra/ordena (presentación) y se alinea la
 * conversación por tick. El texto de los mensajes es literal (puede traer inyección): nunca se
 * interpreta, solo se muestra como texto.
 */
export type BoardRowKind = "dealer-buy" | "dealer-sell" | "dealer" | "duel-buyer" | "duel-seller" | "team-trade" | "team-offer";
export type BoardVerdict = "good" | "bad" | "neutral" | "open" | "no deal" | "not logged";

export interface BoardMessage {
  sender: string;
  us: boolean;
  tick: number | null;
  price: number | null;
  text: string;
}

export interface BoardOffer {
  id: number | null;
  tick: number | null;
  maker: string;
  give: string;
  want: string;
  final: boolean;
  status: string;
}

export interface BoardDecision {
  tick: number | null;
  action: string;
  rule: string | null;
  reservation: number | null;
  ourPrice: number | null;
  herPrice: number | null;
}

export interface BoardRow {
  id: string;
  kind: BoardRowKind;
  counterparty: string;
  item: string;
  status: string;
  closed_reason: string | null;
  price: number | null;
  our_value: number | null;
  value_source: string | null;
  surplus: number | null;
  verdict: BoardVerdict;
  d_neg_points: number | null;
  d_ladder_points: number | null;
  d_score: number | null;
  duel_result: number | null;
  tick_opened: number | null;
  tick_settled: number | null;
  messages: BoardMessage[];
  offers: BoardOffer[];
  decisions: BoardDecision[];
}

export interface BoardHeader {
  team: string;
  score: number | null;
  negotiating: number | null;
  neg_points: number | null;
  ladder_points: number | null;
  market: number | null;
  duel_points: number | null;
  rank: number | null;
  cash: number | null;
  level: number | null;
}

export interface BoardClock {
  tick: number;
  round: number | null;
  round_name: string | null;
  next_tick_in: number | null;
  tick_seconds: number | null;
  doors: string | null;
  today_name: string | null;
}

export interface BoardBookLine {
  id: number;
  maker: string;
  give: string;
  want: string;
  expires_tick: number | null;
}

export interface BoardTeam {
  rank: number | null;
  team: string;
  name: string;
  score: number | null;
  us: boolean;
  negotiating?: number | null;
  market?: number | null;
  level?: number | null;
  album_filled?: number | null;
  album_slots?: number | null;
  /** Páginas completas del álbum: las ★ del leaderboard oficial. */
  pages_complete?: number | null;
  deals?: number | null;
}

export interface BoardMarket {
  leaderboard: BoardTeam[];
  feed: { id: number; tick: number | null; type: string; text: string }[];
  rastro: BoardBookLine[];
  venue: { venue: string; name: string | null; status: string | null; trades: number | null; volume: number | null; book: BoardBookLine[] } | null;
}

export interface BoardMissingCard {
  ref: string;
  name: string;
  rarity: string | null;
  book: number | null;
  value: number | null;
}

export interface BoardAlbumPage {
  set: string;
  name: string;
  have: number;
  of: number;
  complete: boolean;
  missing: BoardMissingCard[];
}

export interface BoardAlbum {
  filled: number | null;
  slots: number | null;
  pages: BoardAlbumPage[];
}

export interface BoardSchedule {
  now_hours: number | null;
  upcoming: { at_hours: number; action: string; note: string; wall: string | null }[];
}

export interface BoardAgent {
  agent: "dealers" | "duels" | "broker" | "trades";
  last_at: string | null;
  last_tick: number | null;
  detail: string | null;
}

export interface Board {
  team: string;
  live: boolean;
  source: "api" | "snapshot" | "none";
  fetched_tick: number | null;
  next_refresh_ms: number;
  clock: BoardClock | null;
  header: BoardHeader | null;
  rows: BoardRow[];
  market: BoardMarket;
  album: BoardAlbum | null;
  holdings: Record<string, number>;
  schedule: BoardSchedule | null;
  agents: BoardAgent[];
}

export const EMPTY_BOARD: Board = {
  team: "",
  live: false,
  source: "none",
  fetched_tick: null,
  next_refresh_ms: 30_000,
  clock: null,
  header: null,
  rows: [],
  market: { leaderboard: [], feed: [], rastro: [], venue: null },
  album: null,
  holdings: {},
  schedule: null,
  agents: [],
};

export const KIND_LABEL: Record<BoardRowKind, string> = {
  "dealer-buy": "dealer · we buy, she sells",
  "dealer-sell": "dealer · we sell, she buys",
  dealer: "dealer",
  "duel-buyer": "duel · we buy",
  "duel-seller": "duel · we sell",
  "team-trade": "team trade",
  "team-offer": "team offer",
};

export type BoardSort = "tick" | "surplus";

export interface BoardFilters {
  kind: string;
  counterparty: string;
  status: string;
  verdict: string;
  sort: BoardSort;
  row: string;
}

export const ALL = "all";
const DEFAULT_FILTERS: BoardFilters = { kind: ALL, counterparty: ALL, status: ALL, verdict: ALL, sort: "tick", row: "" };

/** Filtros desde la query del hash (`#/bazaar?kind=duel-buyer&verdict=bad&sort=surplus&row=thread:178`). */
export function parseBoardQuery(query: string): BoardFilters {
  const p = new URLSearchParams(query);
  const sort = p.get("sort") === "surplus" ? "surplus" : "tick";
  return {
    kind: p.get("kind") || ALL,
    counterparty: p.get("with") || ALL,
    status: p.get("status") || ALL,
    verdict: p.get("verdict") || ALL,
    sort,
    row: p.get("row") || "",
  };
}

export function boardQuery(f: BoardFilters): string {
  const p = new URLSearchParams();
  if (f.kind !== ALL) p.set("kind", f.kind);
  if (f.counterparty !== ALL) p.set("with", f.counterparty);
  if (f.status !== ALL) p.set("status", f.status);
  if (f.verdict !== ALL) p.set("verdict", f.verdict);
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
  if (f.row) p.set("row", f.row);
  return p.toString();
}

export function filterBoardRows(rows: readonly BoardRow[], f: BoardFilters): BoardRow[] {
  const out = rows.filter(
    (r) => (f.kind === ALL || r.kind === f.kind) && (f.counterparty === ALL || r.counterparty === f.counterparty) && (f.status === ALL || r.status === f.status) && (f.verdict === ALL || r.verdict === f.verdict),
  );
  const tick = (r: BoardRow) => r.tick_settled ?? r.tick_opened ?? -1;
  if (f.sort === "surplus") return out.sort((a, b) => (b.surplus ?? -Infinity) - (a.surplus ?? -Infinity) || tick(b) - tick(a));
  return out.sort((a, b) => (b.tick_opened ?? tick(b)) - (a.tick_opened ?? tick(a)));
}

const uniq = (xs: string[]) => [...new Set(xs)].sort();

export function boardFilterOptions(rows: readonly BoardRow[]): { kind: string[]; counterparty: string[]; status: string[]; verdict: string[] } {
  return {
    kind: uniq(rows.map((r) => r.kind)),
    counterparty: uniq(rows.map((r) => r.counterparty)),
    status: uniq(rows.map((r) => r.status)),
    verdict: uniq(rows.map((r) => r.verdict)),
  };
}

export interface TimelineStep {
  tick: number | null;
  messages: BoardMessage[];
  decisions: BoardDecision[];
}

/** Mensajes y nuestras decisiones agrupados por tick (en orden), para mostrarlos lado a lado. */
export function boardTimeline(row: BoardRow): TimelineStep[] {
  const steps = new Map<string, TimelineStep>();
  const at = (tick: number | null) => {
    const k = tick === null ? "?" : String(tick);
    let s = steps.get(k);
    if (!s) {
      s = { tick, messages: [], decisions: [] };
      steps.set(k, s);
    }
    return s;
  };
  for (const m of row.messages) at(m.tick).messages.push(m);
  for (const d of row.decisions) at(d.tick).decisions.push(d);
  return [...steps.values()].sort((a, b) => (a.tick ?? Infinity) - (b.tick ?? Infinity));
}

export function boardModel(raw: Board | null | undefined): Board {
  return raw ? { ...EMPTY_BOARD, ...raw, market: { ...EMPTY_BOARD.market, ...(raw.market ?? {}) }, rows: raw.rows ?? [], holdings: raw.holdings ?? {}, agents: raw.agents ?? [] } : EMPTY_BOARD;
}
