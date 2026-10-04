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
  /** Δ of each score part on the tick this deal settled (`score-audit.jsonl`); absent on an older server. */
  d_parts?: Record<string, number> | null;
  /** Our deals settled on that same tick (the Δ is theirs together when > 1). */
  d_shared?: number;
  /** The ladder Δ arrived on a later tick and was given to this deal: not an exact attribution. */
  d_lagged?: boolean;
  /** Duel only: its points line was rebuilt afterwards (duel-points.jsonl `backfill`). */
  d_backfill?: boolean;
  duel_result: number | null;
  /** Duel only: number, session (1 = I, 2 = II, 3 = III, 4 = Grand Final), agreed delivery days, issues, decay per round. */
  duel?: { no: number; session: number | null; days: number | null; issues: string[]; decay: number | null; deadline: number | null };
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
  color?: string | null;
  theme?: string | null;
  /** Every page card in catalog order (held or missing). */
  cards?: BoardAlbumCard[];
  /** Off-page cards (shinies); hidden ones only when we hold them. */
  shinies?: BoardAlbumCard[];
}

export interface BoardAlbumCard extends BoardMissingCard {
  /** Copies we hold (0 = missing). */
  held: number;
  print_run: number | null;
  /** Copies in circulation. */
  minted: number | null;
  hidden: boolean;
  flavour: string | null;
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

export interface BoardDeskStep {
  tick: number | null;
  event: string;
  status: string | null;
  offerId: number | null;
  ref: string | null;
  price: number | null;
  anchor: number | null;
  floor: number | null;
  serverValue: number | null;
  negIfFilled: number | null;
  reason: string | null;
}

export interface BoardDeskChain {
  key: string;
  venue: string | null;
  incoming: { id?: number | null; weGet?: string | null; weGive?: string | null; kind?: string | null; value?: number | null; verdict?: string | null } | null;
  incomingTick: number | null;
  steps: BoardDeskStep[];
  outcome: { tick: number | null; status: string | null; negDelta: number | null; reason: string | null } | null;
  status: string | null;
  /** Expiry tick of the incoming offer; absent on an older server. */
  incomingExpires?: number | null;
  /** Past its expiry with no outcome logged. */
  expired?: boolean;
  /** Counts toward «pending»: last counter sent, no outcome, not expired. */
  pending?: boolean;
}

export interface BoardDeskTeam {
  team: string;
  chains: BoardDeskChain[];
  negWon: number;
  negOpen: number;
}

export interface BoardScoreParts {
  tick: number | null;
  now: Record<string, number>;
  day_start: { tick: number; parts: Record<string, number> } | null;
  prev: { tick: number; parts: Record<string, number> } | null;
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
  /** Every score part now, at the day's first snapshot and at the previous tick; absent on an older server. */
  score_parts?: BoardScoreParts;
  /** Team desk: offers other teams make to us, our counters and outcomes, per team; absent on an older server. */
  team_desk?: BoardDeskTeam[];
  /** Every open venue's book as play read it, marked against our hand (null without venue-books.json). */
  venue_books?: BoardVenueBooks | null;
  /** Forex chains A → B → C as play found them this tick (null without forex.json; absent on an older server). */
  forex?: BoardForex | null;
  /** Where each of our open offers comes from (plan.jsonl), by offer id. */
  offer_origins?: Record<string, BoardOfferOrigin>;
  /** Directed offers between other teams, last ~60 ticks (structure only). */
  directed?: BoardDirectedOffer[];
  /** Easter eggs: ours (probe and prize) and every find per persona. */
  eggs?: BoardEggs;
  /** Organiser grants to us (admin.grant), oldest first; absent on an older server. */
  grants?: BoardGrant[];
  /** Market test: bench sessions auto vs board; absent on an older server. */
  market_test?: BoardMarketTest;
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

const PART_LABEL: Record<string, string> = { neg_points: "neg", ladder_points: "ladder", duel_points: "duel", mm_points: "mm", score: "score" };

/**
 * Points column: the Δ of each raw part on the deal's tick (neg, ladder… always shown, the rest only when they moved),
 * then the score Δ. `null` when the deal was not audited.
 */
export function pointsLabel(r: BoardRow): { value: string; tone?: "better" | "worse" } | null {
  const p = r.d_parts;
  if (!p) return null;
  const sign = (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 1000) / 1000}`;
  const shown = Object.entries(PART_LABEL).filter(([k]) => p[k] !== undefined && (k === "neg_points" || k === "ladder_points" || p[k] !== 0));
  const text = shown.map(([k, label]) => `${label} ${sign(p[k]!)}`).join(" · ");
  const net = p.score ?? Object.entries(p).reduce((s, [k, v]) => (k === "score" ? s : s + v), 0);
  const tone = net > 0 ? "better" : net < 0 ? "worse" : undefined;
  const value = `${text}${(r.d_shared ?? 0) > 1 ? ` (tick total, ${r.d_shared} ${r.duel ? "duels" : "deals"})` : ""}${r.d_lagged ? " · ladder lagged (not exact)" : ""}${r.d_backfill ? " · backfilled" : ""}`;
  return tone ? { value, tone } : { value };
}

/** Status column: the outcome plus the raw detail when it adds something (`deal · auto-match`, `no deal · walked`). */
export function statusLabel(r: BoardRow): string {
  const outcome = outcomeOf(r);
  // A duel is either live until its deadline or finished (deal or no deal): say which.
  if (r.duel) return outcome === "open" ? `live · ends t${r.duel.deadline ?? "?"}` : `finished · ${outcome}`;
  const detail = r.status === "matched" ? "auto-match" : r.status === "settled" && r.kind === "other-trade" ? "board" : r.status === outcome || r.status?.replace(/_/g, " ") === outcome || r.status === "bought" || r.status === "sold" ? null : r.status;
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

/** One offer in a venue book, marked against us (server: viewer/server/bazaar/venues/venue-books.ts). */
export interface BoardBookRow {
  id: number;
  side: "ask" | "bid" | "swap";
  maker: string | null;
  to: string | null;
  to_us: boolean;
  refs: string[];
  price: number;
  fee: number;
  hand: number | null;
  value: number | null;
  /** NEG at our values as the taker; null on a dup, several cards or no value. */
  neg: number | null;
  mark: "ours" | "lack" | "spare" | "last" | "keep" | "dup" | "none";
  wanted_by: string[];
  held_by: string[];
  expires_tick: number | null;
  created_tick: number | null;
}

export interface BoardVenueBook {
  venue: string;
  name: string | null;
  owner: string | null;
  owner_name: string | null;
  mechanism: string | null;
  fee_bps: number;
  fee_per_card: number;
  status: string | null;
  house: boolean;
  ours: boolean;
  off_limits: boolean;
  asks: BoardBookRow[];
  bids: BoardBookRow[];
  swaps: BoardBookRow[];
}

export interface BoardVenueBooks {
  tick: number | null;
  updated: string | null;
  venues: BoardVenueBook[];
}

/** One leg of a forex chain (server: viewer/server/bazaar/forex/forex.ts). */
export interface BoardForexLeg {
  at: string;
  kind: "dealer" | "venue";
  price: number;
  lo: number;
  hi: number;
  n: number;
  fee: number;
  last_tick: number | null;
}

export interface BoardForexStep {
  kind: "buy" | "hold" | "sell";
  at: string;
  /** buy = −(price + fee), hold = 0, sell = +(price − fee). */
  expected: number;
  label: string;
}

export interface BoardForexChain {
  id: string;
  card: string;
  rarity: string | null;
  buy: BoardForexLeg;
  sell: BoardForexLeg;
  steps: BoardForexStep[];
  margin: number;
  worst: number;
  automated: boolean;
  max_buy: number | null;
  min_sell: number | null;
  /** Index into steps; −1 = idle. */
  current: number;
  status: string;
  done_today: number;
  /** Conversations and assets behind each step, index-aligned with steps (absent on an older server). */
  step_threads?: BoardForexStepThreads[];
}

/** One of our dealer threads behind a forex step (server: viewer/server/bazaar/forex/forex-threads.ts). */
export interface BoardForexThread {
  id: number;
  dealer: string;
  side: "buy" | "sell";
  card: string | null;
  status: "open" | "deal" | "closed";
  outcome: string | null;
  rule: string | null;
  opened_tick: number | null;
  closed_tick: number | null;
  her_prices: number[];
  our_prices: number[];
  her_last: number | null;
  our_last: number | null;
  price: number | null;
  flags: { message_id: number | null; reason: string; tick: number | null }[];
}

export interface BoardForexStepThreads {
  threads: BoardForexThread[];
  /** Hold step: asset ids of the card we hold beyond the first. */
  assets: number[];
}

export interface BoardForex {
  tick: number | null;
  updated: string | null;
  trades: number;
  scanned: number;
  chains: BoardForexChain[];
}

export interface BoardOfferOrigin {
  /** trades | rival-page | rival-buy | rival-swap | team-desk. */
  route: string;
  steps: { tick: number; price: number | null; tag: string | null; reposts?: number }[];
  neg: number | null;
  ticks_left: number | null;
  summary: string | null;
}

export interface BoardDirectedOffer {
  id: number;
  tick: number | null;
  maker: string;
  to: string;
  venue: string | null;
  side: "sells" | "buys" | "swap";
  refs: string[];
  price: number;
  status: "open" | "filled" | "cancelled" | "expired";
  expires_tick: number | null;
  hand: number | null;
  spare: boolean;
}

export interface BoardEggCard {
  ref: string;
  name: string | null;
  rarity: string | null;
  hidden: boolean;
  print_run: number | null;
}

export interface BoardOurEgg {
  tick: number;
  persona: string;
  persona_name: string | null;
  probe: { phrase: string; tick: number } | null;
  prize: { cards: BoardEggCard[]; cash: number; packs: string[]; badges: string[]; reason: string | null };
  order: number;
  /** The thread it fired in; absent on an older server, null without our team stream. */
  flow?: BoardEggFlow | null;
}

/** What we did to get an egg: the thread topic, every message up to the egg (our text and offers) and the outcome. */
export interface BoardEggFlow {
  thread: number | null;
  topic: string | null;
  steps: { tick: number; who: "us" | "dealer"; text: string | null; offer: string | null }[];
  outcome: string;
}

export interface BoardPersonaEggs {
  persona: string;
  persona_name: string | null;
  found: { team: string; name: string | null; tick: number }[];
  probes: { sent: number; hit: number; miss: number; last: { phrase: string; tick: number; result: string } | null };
}

/** One item of the approved egg probe plan (`src/hints/egg-plan.ts`) with its status. */
export interface BoardEggPlanRow {
  n: number;
  persona: string;
  route: "play" | "manual" | "excluded";
  line: string;
  key: string;
  odds: string;
  stake: string;
  cost: string;
  note?: string;
  status: "pending" | "sent" | "hit" | "miss" | "excluded";
  sentTick?: number;
  hitTick?: number;
  nextAllowedTick?: number;
}

export interface BoardEggs {
  ours: BoardOurEgg[];
  /** Sunday's approved egg probe plan; absent on an older server. */
  plan?: BoardEggPlanRow[];
  personas: BoardPersonaEggs[];
  /** Absent on an older server. */
  badges?: { badge: string; tick: number }[];
  gifts?: {
    tick: number;
    from: string | null;
    from_name?: string | null;
    context?: { thread: number | null; our_offer: string | null; our_tick: number | null; deal: { tick: number; price: number | null; refs: string[] } | null } | null;
    cards: BoardEggCard[];
    cash: number;
    packs: string[];
    reason: string | null;
  }[];
  gifts_by_persona?: { persona: string; total: number; teams: number; ours: number }[];
}

export interface BoardGrant {
  day: string;
  tick: number | null;
  actor: string | null;
  cash: number;
  packs: string[];
  cards: string[];
  reason: string | null;
}

/** Duel session name as the schedule calls it (4 is the Grand Final, the last wave). */
export function duelSessionName(session: number | null | undefined): string {
  if (session === 1) return "Duels I";
  if (session === 2) return "Duels II";
  if (session === 3) return "Duels III";
  if (session === 4) return "Grand Final (duels IV)";
  return session == null ? "Duels (session unknown)" : `Duels ${session}`;
}

/**
 * A duel that closed at a price we offered BEFORE our last offer: the rival accepted that earlier offer while our next
 * one was on its way (e.g. deal 64 after we had already posted 69). Null when the deal is at our last offer or theirs.
 */
export function duelEarlierAccept(r: BoardRow): { price: number; tick: number | null; later: number; laterTick: number | null } | null {
  if (!r.duel || outcomeOf(r) !== "deal" || r.price === null) return null;
  const ours = r.messages.filter((m) => m.us && m.price !== null);
  const last = ours[ours.length - 1];
  if (!last || last.price === r.price) return null;
  const earlier = [...ours].reverse().find((m) => m.price === r.price);
  if (!earlier) return null;
  return { price: r.price, tick: earlier.tick, later: last.price!, laterTick: last.tick };
}

export interface BoardMarketTrader {
  id: string;
  side: "ask" | "bid";
  points: { tick: number; quote: number; temper: string | null }[];
}

export interface BoardMarketMatch {
  tick: number;
  source: string | null;
  sell: string | null;
  buy: string | null;
  price: number | null;
  ask: number | null;
  bid: number | null;
  surplus: number | null;
  status: string | null;
  error: string | null;
}

export interface BoardMarketOptimalPair {
  ask_id: string;
  bid_id: string;
  tick: number;
  ask: number;
  bid: number;
  surplus: number;
}

/** Ours vs the hindsight optimum, in quote surplus (bid − ask from bench.jsonl; not the official efficiency). */
export interface BoardMarketHindsight {
  comparable: boolean;
  note: string | null;
  final: boolean;
  through_tick: number | null;
  ours: { pairs: number; surplus: number };
  optimum: { pairs: number; surplus: number };
  captured: number | null;
  pairs: BoardMarketOptimalPair[];
  missed: BoardMarketOptimalPair[];
  /** Indexes into `our_matches`. */
  suboptimal: number[];
}

export interface BoardMarketSession {
  day: string;
  session: number;
  name: string | null;
  hard: boolean;
  start_tick: number;
  ticks: number;
  hour: number | null;
  /** Wall-clock start and end (ISO); absent on an older server. */
  started_at?: string | null;
  finished_at?: string | null;
  venue: string | null;
  mode: string;
  efficiency: number | null;
  auto_baseline: number | null;
  delta: number | null;
  matches: number | null;
  finished: boolean;
  dry_run: boolean | null;
  shadow: { shadow_surplus: number | null; auto_surplus: number | null; pairs_shadow: number | null; pairs_auto: number | null } | null;
  traders: BoardMarketTrader[] | null;
  our_matches: BoardMarketMatch[] | null;
  /** Absent on an older viewer server. */
  hindsight?: BoardMarketHindsight | null;
}

export interface BoardMarketTest {
  sessions: BoardMarketSession[];
  now: { tick: number | null; hour: number | null; bench: number | null; matched: number | null; line: string } | null;
}
