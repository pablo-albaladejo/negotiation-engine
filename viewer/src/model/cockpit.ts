import type { Board, BoardAgent, BoardRow } from "./bazaarBoard.js";

/**
 * Bazaar cockpit model: it only reorders and labels what `/api/bazaar/board` already brings.
 * No figure is invented here; the score comes straight from the game.
 */

export interface Standing {
  rank: number | null;
  teams: number;
  score: number | null;
  leader: { name: string; score: number | null } | null;
  /** Team just ahead (the one to overtake). */
  ahead: { name: string; score: number | null } | null;
  gapToLeader: number | null;
  gapToAhead: number | null;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function standingOf(board: Board): Standing {
  const lb = [...board.market.leaderboard].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const usIdx = lb.findIndex((t) => t.us);
  const us = usIdx >= 0 ? lb[usIdx] : undefined;
  const score = board.header?.score ?? us?.score ?? null;
  const leader = lb[0] && !lb[0].us ? { name: lb[0].name, score: lb[0].score } : null;
  const aheadRow = usIdx > 0 ? lb[usIdx - 1] : undefined;
  const ahead = aheadRow ? { name: aheadRow.name, score: aheadRow.score } : null;
  const gap = (other: { score: number | null } | null) => (other?.score != null && score !== null ? round2(other.score - score) : null);
  return { rank: board.header?.rank ?? us?.rank ?? null, teams: lb.length, score, leader, ahead, gapToLeader: gap(leader), gapToAhead: gap(ahead) };
}

/** Components of the figure the game publishes, in the order they add up. */
export function scoreParts(board: Board): { label: string; value: number | null }[] {
  const h = board.header;
  return [
    { label: "Negotiation", value: h?.negotiating ?? null },
    { label: "Market", value: h?.market ?? null },
    { label: "Neg points", value: h?.neg_points ?? null },
    { label: "Duel points", value: h?.duel_points ?? null },
    { label: "Ladder", value: h?.ladder_points ?? null },
  ];
}

export interface LiveItem {
  id: string;
  kind: "duel" | "dealer" | "offer";
  title: string;
  counterparty: string;
  party: PartyKind;
  /** What is at stake, in one line (e.g. "limit 116 · we bid 90 · they ask 119"). */
  state: string;
  /** Warning that deserves attention, or `null`. */
  warning: string | null;
}

const lastPrice = (row: BoardRow, us: boolean): number | null => {
  for (let i = row.messages.length - 1; i >= 0; i--) {
    const m = row.messages[i];
    if (m && m.us === us && m.price !== null) return m.price;
  }
  return null;
};

/** Card ref inside an offer text ("SAL-07", "LAT-04"…). */
const cardRef = (text: string): string | null => /\b[A-Z]{3}-\d{2}\b/.exec(text)?.[0] ?? null;

/** What is open right now: live duels, dealer threads and our offers in El Rastro. */
export function liveItems(board: Board): LiveItem[] {
  const out: LiveItem[] = [];
  for (const r of board.rows) {
    if (r.status !== "open" && r.status !== "live") continue;
    const who = partyOf(board, r);
    if (r.kind === "duel-buyer" || r.kind === "duel-seller") {
      const buyer = r.kind === "duel-buyer";
      const ours = lastPrice(r, true);
      const theirs = lastPrice(r, false);
      const parts = [r.our_value !== null ? `limit ${r.our_value}` : null, ours !== null ? `we ${buyer ? "bid" : "ask"} ${ours}` : null, theirs !== null ? `they ${buyer ? "ask" : "bid"} ${theirs}` : "no rival offer yet"];
      out.push({ id: r.id, kind: "duel", title: `${buyer ? "Buy" : "Sell"} ${r.item}`, counterparty: who.label, party: who.kind, state: parts.filter(Boolean).join(" · "), warning: null });
    } else if (r.kind === "team-offer") {
      const o = r.offers[r.offers.length - 1];
      const give = o?.give ?? "?";
      const want = o?.want ?? "?";
      const selling = cardRef(give);
      const copies = selling ? (board.holdings[selling] ?? 0) : null;
      const warning = selling && copies !== null && copies <= 1 ? `selling our only ${selling}` : null;
      const tag = selling && copies !== null && copies > 1 ? ` (spare, we hold ${copies})` : "";
      out.push({ id: r.id, kind: "offer", title: selling ? `Sell ${give}${tag} for ${want}` : `Buy ${want} for ${give}`, counterparty: who.label, party: who.kind, state: r.our_value !== null ? `our value ${r.our_value}` : "", warning });
    } else {
      const ours = lastPrice(r, true);
      const theirs = lastPrice(r, false);
      const parts = [r.our_value !== null ? `our value ${r.our_value}` : null, ours !== null ? `we say ${ours}` : null, theirs !== null ? `they say ${theirs}` : null];
      out.push({ id: r.id, kind: "dealer", title: `${r.kind === "dealer-sell" ? "Sell" : "Buy"} ${r.item}`, counterparty: who.label, party: who.kind, state: parts.filter(Boolean).join(" · "), warning: null });
    }
  }
  const order = { duel: 0, dealer: 1, offer: 2 };
  return out.sort((a, b) => order[a.kind] - order[b.kind]);
}

/** Deals that moved the figure (the game's real Δ), most recent first. */
export function scoreMovers(board: Board): BoardRow[] {
  return board.rows.filter((r) => r.d_score !== null && r.d_score !== 0).sort((a, b) => (b.tick_settled ?? 0) - (a.tick_settled ?? 0));
}

export type AgentHealth = "running" | "stale" | "no trace";

export interface AgentLine {
  agent: BoardAgent["agent"];
  health: AgentHealth;
  /** "2 min ago · tick 158 · counter" */
  text: string;
}

/**
 * An agent is alive if it wrote its trace less than 3 ticks ago (or, with no time, if its last tick
 * is within 3 of the clock). With the game paused they all look stopped: that is expected.
 */
export function agentLines(board: Board, nowMs: number): AgentLine[] {
  const tickMs = (board.clock?.tick_seconds ?? 60) * 1000;
  const nowTick = board.clock?.tick ?? null;
  return board.agents.map((a) => {
    const ageMs = a.last_at ? nowMs - Date.parse(a.last_at) : null;
    const fresh = ageMs !== null ? ageMs <= 3 * tickMs : a.last_tick !== null && nowTick !== null && nowTick - a.last_tick <= 3;
    const health: AgentHealth = a.last_at === null && a.last_tick === null ? "no trace" : fresh ? "running" : "stale";
    const ago = ageMs === null ? null : ageMs < 60_000 ? `${Math.max(0, Math.round(ageMs / 1000))} s ago` : ageMs < 3_600_000 ? `${Math.round(ageMs / 60_000)} min ago` : `${Math.round(ageMs / 3_600_000)} h ago`;
    const text = [ago, a.last_tick !== null ? `tick ${a.last_tick}` : null, a.detail].filter(Boolean).join(" · ") || "no trace yet";
    return { agent: a.agent, health, text };
  });
}

export interface ScheduleLine {
  at_hours: number;
  /** "in 0.4 h" (game hours) */
  when: string;
  action: string;
  note: string;
}

const ACTION_LABEL: Record<string, string> = {
  bench: "Market Test",
  round: "New round",
  set_release: "Set release",
  day_closes: "Day closes",
  day_opens: "Day opens",
  grant_all: "Grant",
  duels: "Duels",
};

/** Upcoming appointments; those falling at the same time stay together and in order. */
export function scheduleLines(board: Board, max = 8): ScheduleLine[] {
  const s = board.schedule;
  if (!s) return [];
  return s.upcoming.slice(0, max).map((u) => {
    const dh = s.now_hours !== null ? u.at_hours - s.now_hours : null;
    const when = dh === null ? `hour ${u.at_hours}` : dh <= 0 ? "now" : `in ${dh < 1 ? dh.toFixed(2) : dh.toFixed(1)} h`;
    return { at_hours: u.at_hours, when, action: ACTION_LABEL[u.action] ?? u.action, note: u.note };
  });
}

/** Parts of the history: what scores per negotiation and the duels, separately. */
export function historyGroups(rows: readonly BoardRow[]): { trades: BoardRow[]; duels: BoardRow[] } {
  const closed = rows.filter((r) => r.status !== "open" && r.status !== "live");
  return { trades: closed.filter((r) => !r.kind.startsWith("duel")), duels: closed.filter((r) => r.kind.startsWith("duel")) };
}

export type PartyKind = "us" | "team" | "dealer" | "duel rival" | "public" | "others";

/** How each kind of part reads in the UI. Duels pit teams against each other, but the rules hide which one behind an alias. */
export const PARTY_LABEL: Record<PartyKind, string> = {
  us: "us",
  team: "team",
  dealer: "dealer",
  "duel rival": "team under an alias (hidden by the rules)",
  public: "public offer",
  others: "other teams (we are not in it)",
};

/** Official rarity colors (`/api/catalog`). */
export const RARITY_COLOR: Record<string, string> = {
  common: "#9AA4B8",
  uncommon: "#3DDC97",
  rare: "#4C8DFF",
  epic: "#B061FF",
  legendary: "#FFC44D",
};

export interface Party {
  /** Nombre legible: "Team 2 (us)", "Los Gatos (t18)", "chato"… */
  label: string;
  kind: PartyKind;
}

const TEAM_ID = /\bt\d{2}\b/g;

/** Name of a team by its id (`t02`), with "(us)" if it is us; the bare id if we do not know it. */
export function teamLabel(board: Board, id: string): string {
  const t = board.market.leaderboard.find((x) => x.team === id);
  if (id === board.team || t?.us) return `${t?.name ?? "Team"} (us)`;
  if (!t || t.name === id) return id;
  // "Team 13" already says who "t13" is; other names carry the id alongside.
  return t.name === `Team ${Number(id.slice(1))}` ? t.name : `${t.name} (${id})`;
}

/** Ids of our offers (from `/api/me/offers`), to recognize them in anonymous books. */
export function ourOfferIds(board: Board): Set<number> {
  return new Set(board.rows.filter((r) => r.kind === "team-offer" || r.kind === "team-trade").flatMap((r) => r.offers.flatMap((o) => (o.maker === board.team && o.id !== null ? [o.id] : []))));
}

/**
 * Who placed an offer in a book (El Rastro, our venue). The Bazaar anonymizes the author
 * (`m3950d43b`), so ours are recognized by id; the rest is "another team (anonymous)".
 */
export function bookMakerLabel(board: Board, line: { id: number; maker: string }, ours: ReadonlySet<number>): { label: string; us: boolean } {
  if (ours.has(line.id) || line.maker === board.team) return { label: teamLabel(board, board.team), us: true };
  if (/^t\d{2}$/.test(line.maker)) return { label: teamLabel(board, line.maker), us: false };
  return { label: `another team (anonymous ${line.maker.slice(0, 5)})`, us: false };
}

/** Replaces team ids (`t18`) in a text with their name; the text is still displayed as text. */
export function withTeamNames(board: Board, text: string): string {
  return text.replace(TEAM_ID, (id) => (id === board.team || board.market.leaderboard.some((t) => t.team === id) ? teamLabel(board, id) : id));
}

/** Does this text or offer mention us? */
export function mentionsUs(board: Board, text: string): boolean {
  return board.team !== "" && (text.match(TEAM_ID) ?? ([] as string[])).includes(board.team);
}

/** Who each conversation is with and what kind of part it is. */
export function partyOf(board: Board, row: BoardRow): Party {
  if (row.kind.startsWith("dealer")) return { label: row.counterparty, kind: "dealer" };
  if (row.kind.startsWith("duel")) return { label: row.counterparty, kind: "duel rival" };
  if (row.kind === "team-offer") return { label: "anyone (public offer)", kind: "public" };
  if (row.kind === "other-trade") return { label: withTeamNames(board, row.counterparty), kind: "others" };
  return { label: withTeamNames(board, row.counterparty), kind: "team" };
}

export interface CurvePoint {
  round: number;
  value: number;
}

export interface OfferCurve {
  /** First tick of the conversation; round 1 of the chart is this tick. */
  firstTick: number;
  rounds: number;
  yDomain: [number, number];
  /** Y-axis ticks at round numbers. */
  yTicks: number[];
  ours: CurvePoint[];
  theirs: CurvePoint[];
  /** Our limit per tick (reserve from `decisions.jsonl`). */
  limit: CurvePoint[];
  /**
   * If the limit of the turns ended up below the opening one (purchases): the agent trims it for
   * cash or budget, or revalues it when the card is revealed; the trace does not say which. `{ from, to }`, or `null`.
   */
  capped: { from: number; to: number } | null;
  /** Horizontal reference line: our value (dealers) or the duel's limit. */
  reference: { value: number; label: string } | null;
  end: { round: number; kind: "deal" | "walk"; label: string } | null;
}

/** "Nice" scale: step 1, 2 or 5 × 10^k, about 4–6 ticks covering [lo, hi]. */
export function niceScale(lo: number, hi: number): { domain: [number, number]; ticks: number[] } {
  const span = Math.max(hi - lo, 1);
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((st) => st >= raw) ?? 10 * mag;
  const min = Math.max(0, Math.floor(lo / step) * step);
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { domain: [min, max], ticks };
}

/**
 * Negotiation curve from the prices already extracted from each message and from our
 * decisions. Only draws what was recorded; with fewer than two prices, there is no curve.
 */
export function offerCurve(row: BoardRow): OfferCurve | null {
  const priced = row.messages.filter((m): m is typeof m & { tick: number; price: number } => m.tick !== null && m.price !== null);
  if (priced.length < 2) return null;
  const limits = row.decisions.filter((d): d is typeof d & { tick: number; reservation: number } => d.tick !== null && d.reservation !== null);
  const firstTick = Math.min(...priced.map((m) => m.tick), ...limits.map((d) => d.tick));
  const at = (tick: number) => tick - firstTick + 1;
  const byRound = (pts: { tick: number; value: number }[]): CurvePoint[] => {
    const m = new Map<number, number>();
    for (const p of pts) m.set(at(p.tick), p.value);
    return [...m].map(([round, value]) => ({ round, value })).sort((a, b) => a.round - b.round);
  };
  const ours = byRound(priced.filter((m) => m.us).map((m) => ({ tick: m.tick, value: m.price })));
  const theirs = byRound(priced.filter((m) => !m.us).map((m) => ({ tick: m.tick, value: m.price })));
  const limit = byRound(limits.map((d) => ({ tick: d.tick, value: d.reservation })));
  const opening = limits.find((d) => d.action === "open")?.reservation;
  const turns = limits.filter((d) => d.action !== "open").map((d) => d.reservation);
  const lowestTurn = turns.length > 0 ? Math.min(...turns) : undefined;
  const capped = row.kind === "dealer-buy" && opening !== undefined && lowestTurn !== undefined && lowestTurn < opening ? { from: opening, to: lowestTurn } : null;
  const duel = row.kind.startsWith("duel");
  const reference = row.our_value === null ? null : { value: row.our_value, label: duel ? `our limit ${row.our_value}` : `our value ${row.our_value}` };
  let lastRound = Math.max(...ours.map((p) => p.round), ...theirs.map((p) => p.round), ...limit.map((p) => p.round));
  const settledRound = row.tick_settled !== null && row.tick_settled >= firstTick ? at(row.tick_settled) : lastRound;
  let end: OfferCurve["end"] = null;
  if (row.price !== null && ["deal", "bought", "sold"].includes(row.status)) end = { round: settledRound, kind: "deal", label: `deal ${row.price}` };
  else if (row.status === "walked" || row.status === "closed") end = { round: settledRound, kind: "walk", label: row.closed_reason ?? row.status };
  if (end) lastRound = Math.max(lastRound, end.round);
  // A deal closes both curves at the agreed price: whoever accepted reaches the other's figure.
  if (end?.kind === "deal" && row.price !== null) {
    const price = row.price;
    for (const side of [ours, theirs]) {
      const last = side[side.length - 1];
      if (last && last.round === end.round) last.value = price;
      else side.push({ round: end.round, value: price });
    }
  }
  const values = [...ours, ...theirs, ...limit].map((p) => p.value).concat(reference ? [reference.value] : [], end?.kind === "deal" && row.price !== null ? [row.price] : []);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max(1, (hi - lo) * 0.1);
  const scale = niceScale(lo - pad, hi + pad);
  return { firstTick, rounds: lastRound + 1, yDomain: scale.domain, yTicks: scale.ticks, ours, theirs, limit, capped, reference, end };
}

/**
 * Text of the box when hovering a round of the curve: tick, our figure, theirs,
 * our limit (the last one recorded up to that tick), our value and the close if it falls there.
 */
export function curveRoundLines(curve: OfferCurve, them: string, round: number): string[] | null {
  if (round < 1) return null;
  const at = (pts: CurvePoint[]) => pts.find((p) => p.round === round)?.value;
  const lastLimit = curve.limit.length > 0 && round <= curve.limit[curve.limit.length - 1]!.round ? [...curve.limit].reverse().find((p) => p.round <= round)?.value : undefined;
  const closing = curve.end?.round === round ? curve.end : null;
  const ours = at(curve.ours);
  const theirs = at(curve.theirs);
  const lines = [
    `tick ${curve.firstTick + round - 1}`,
    ours !== undefined ? `us ${ours}` : null,
    theirs !== undefined ? `${them} ${theirs}` : null,
    lastLimit !== undefined ? `our limit ${lastLimit}` : null,
    curve.reference ? curve.reference.label : null,
    closing ? closing.label : null,
  ].filter((l): l is string => l !== null);
  return lines.length > 1 ? lines : null;
}
