/**
 * Unified Bazaar view as served by `/api/bazaar/board`: the server already computed value,
 * surplus, verdict and deltas; here we only type, filter/sort (presentation) and align the
 * conversation by tick. Message text is verbatim (it may carry an injection): it is never
 * interpreted, only shown as text.
 */
export type BoardRowKind = "dealer-buy" | "dealer-sell" | "dealer" | "duel-buyer" | "duel-seller" | "team-trade" | "team-offer" | "other-trade";
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
  /** Parties of a trade between other teams (`other-trade`), to filter by team. */
  parties?: string[];
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
  /** Full album pages: the ★ of the official leaderboard. */
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

/** The Workshop (El Taller): spares we could hand in (sale guardrails applied on the server) and public crafts. */
export interface BoardWorkshop {
  open: boolean;
  opened_tick: number | null;
  teaser: string | null;
  how: string | null;
  needed: number;
  rarities: { rarity: string; next: string | null; spares: { ref: string; name: string | null; free: number; spare: number; your_value: number | null }[]; count: number; ready: boolean }[];
  locked: { id: number; ref: string; where: string }[];
  crafts: { id: number; tick: number | null; team: string; name: string | null; from: string | null; to: string | null; card: string | null; us: boolean }[];
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
  /** Settlements between other parties (we are not in them), from the public feed. */
  others: BoardRow[];
  market: BoardMarket;
  album: BoardAlbum | null;
  holdings: Record<string, number>;
  schedule: BoardSchedule | null;
  agents: BoardAgent[];
  /** Mode of the running `bazaar:play`: "live" sends real offers, "dry-run" sends nothing; null if not running (optional on older servers). */
  play_mode?: "live" | "dry-run" | null;
  /** The Workshop (El Taller); absent on an older server. */
  workshop?: BoardWorkshop;
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
  others: [],
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
  "other-trade": "other teams' trade",
};

export type BoardSort = "tick" | "surplus";

/** Whose deals the history shows: all, only ours, or only between other parties. */
export type BoardScope = "all" | "ours" | "others";
export const SCOPE_LABEL: Record<BoardScope, string> = { all: "Everyone", ours: "Only us", others: "Other teams" };

/** How an entry ended, the same for threads, duels, book fills and other teams' trades. */
export type BoardOutcome = "open" | "deal" | "no deal";
/** Which way the asset went for us (null for other teams' trades and undetermined rows). */
export type BoardSide = "buy" | "sell";

const OPEN_STATUSES = new Set(["open", "live", "pending"]);
const DEAL_STATUSES = new Set(["deal", "bought", "sold", "matched", "settled", "accepted", "filled"]);

/** Outcome of a row: raw statuses (`walked`, `cooloff`, `no_deal`, `bought`, `matched`…) collapsed to open / deal / no deal. */
export function outcomeOf(r: BoardRow): BoardOutcome {
  if (OPEN_STATUSES.has(r.status)) return "open";
  if (DEAL_STATUSES.has(r.status)) return "deal";
  // A thread closed by the server still counts as a deal when it has a settled price.
  return r.status === "closed" && r.price !== null ? "deal" : "no deal";
}

export function sideOf(r: BoardRow): BoardSide | null {
  if (r.kind === "dealer-buy" || r.kind === "duel-buyer" || r.status === "bought") return "buy";
  if (r.kind === "dealer-sell" || r.kind === "duel-seller" || r.status === "sold") return "sell";
  return null;
}

/** Status column: the outcome plus the raw detail when it adds something (`deal · auto-match`, `no deal · walked`). */
export function statusLabel(r: BoardRow): string {
  const outcome = outcomeOf(r);
  const detail = r.status === "matched" ? "auto-match" : r.status === "settled" && r.kind === "other-trade" ? "board" : r.status === outcome || r.status === "bought" || r.status === "sold" ? null : r.status;
  return [outcome, detail, r.closed_reason].filter(Boolean).join(" · ");
}

export interface BoardFilters {
  scope: BoardScope;
  kind: string;
  counterparty: string;
  status: string;
  side: string;
  verdict: string;
  sort: BoardSort;
  row: string;
}

export const ALL = "all";
const DEFAULT_FILTERS: BoardFilters = { scope: "all", kind: ALL, counterparty: ALL, status: ALL, side: ALL, verdict: ALL, sort: "tick", row: "" };

/** Filters from the hash query (`#/bazaar?kind=duel-buyer&verdict=bad&sort=surplus&row=thread:178`). */
export function parseBoardQuery(query: string): BoardFilters {
  const p = new URLSearchParams(query);
  const sort = p.get("sort") === "surplus" ? "surplus" : "tick";
  const whose = p.get("whose");
  return {
    scope: whose === "ours" || whose === "others" ? whose : "all",
    kind: p.get("kind") || ALL,
    counterparty: p.get("with") || ALL,
    status: p.get("status") || ALL,
    side: p.get("side") || ALL,
    verdict: p.get("verdict") || ALL,
    sort,
    row: p.get("row") || "",
  };
}

export function boardQuery(f: BoardFilters): string {
  const p = new URLSearchParams();
  if (f.scope !== DEFAULT_FILTERS.scope) p.set("whose", f.scope);
  if (f.kind !== ALL) p.set("kind", f.kind);
  if (f.counterparty !== ALL) p.set("with", f.counterparty);
  if (f.status !== ALL) p.set("status", f.status);
  if (f.side !== ALL) p.set("side", f.side);
  if (f.verdict !== ALL) p.set("verdict", f.verdict);
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
  if (f.row) p.set("row", f.row);
  return p.toString();
}

export function filterBoardRows(rows: readonly BoardRow[], f: BoardFilters): BoardRow[] {
  const out = rows.filter(
    (r) =>
      inScope(r, f.scope) &&
      (f.kind === ALL || r.kind === f.kind) &&
      (f.counterparty === ALL || counterpartiesOf(r).includes(f.counterparty)) &&
      (f.status === ALL || outcomeOf(r) === f.status) &&
      (f.side === ALL || sideOf(r) === f.side) &&
      (f.verdict === ALL || r.verdict === f.verdict),
  );
  const tick = (r: BoardRow) => r.tick_settled ?? r.tick_opened ?? -1;
  if (f.sort === "surplus") return out.sort((a, b) => (b.surplus ?? -Infinity) - (a.surplus ?? -Infinity) || tick(b) - tick(a));
  return out.sort((a, b) => (b.tick_opened ?? tick(b)) - (a.tick_opened ?? tick(a)));
}

const uniq = (xs: string[]) => [...new Set(xs)].sort();

const isOthers = (r: BoardRow) => r.kind === "other-trade";
const inScope = (r: BoardRow, scope: BoardScope) => scope === "all" || (scope === "others") === isOthers(r);
/** What the counterparty filter matches: each team of an other teams' trade, our counterparty otherwise. */
const counterpartiesOf = (r: BoardRow): string[] => (isOthers(r) ? (r.parties ?? []) : [r.counterparty]);

export function boardFilterOptions(rows: readonly BoardRow[]): { kind: string[]; counterparty: string[]; status: string[]; side: string[]; verdict: string[] } {
  return {
    kind: uniq(rows.map((r) => r.kind)),
    counterparty: uniq(rows.flatMap(counterpartiesOf)),
    status: (["open", "deal", "no deal"] as const).filter((o) => rows.some((r) => outcomeOf(r) === o)),
    side: uniq(rows.flatMap((r) => sideOf(r) ?? [])),
    verdict: uniq(rows.map((r) => r.verdict)),
  };
}

export interface TimelineStep {
  tick: number | null;
  messages: BoardMessage[];
  decisions: BoardDecision[];
}

/** Messages and our decisions grouped by tick (in order), to show them side by side. */
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
  return raw ? { ...EMPTY_BOARD, ...raw, market: { ...EMPTY_BOARD.market, ...(raw.market ?? {}) }, rows: raw.rows ?? [], others: raw.others ?? [], holdings: raw.holdings ?? {}, agents: raw.agents ?? [] } : EMPTY_BOARD;
}
