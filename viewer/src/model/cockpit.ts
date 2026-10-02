import type { Board, BoardAgent, BoardRow } from "./bazaarBoard.js";

/**
 * Modelo de la cabina del Bazaar: solo reordena y etiqueta lo que ya trae `/api/bazaar/board`.
 * Ninguna cifra se inventa aquí; la puntuación sale tal cual del juego.
 */

export interface Standing {
  rank: number | null;
  teams: number;
  score: number | null;
  leader: { name: string; score: number | null } | null;
  /** Equipo justo por delante (el que hay que pasar). */
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

/** Componentes de la cifra que el juego publica, en el orden en que suman. */
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
  /** Qué está en juego, en una línea (p. ej. "limit 116 · we bid 90 · they ask 119"). */
  state: string;
  /** Aviso que merece atención, o `null`. */
  warning: string | null;
}

const lastPrice = (row: BoardRow, us: boolean): number | null => {
  for (let i = row.messages.length - 1; i >= 0; i--) {
    const m = row.messages[i];
    if (m && m.us === us && m.price !== null) return m.price;
  }
  return null;
};

/** Ref de carta dentro de un texto de oferta ("SAL-07", "LAT-04"…). */
const cardRef = (text: string): string | null => /\b[A-Z]{3}-\d{2}\b/.exec(text)?.[0] ?? null;

/** Lo que está abierto ahora mismo: duelos vivos, hilos con dealers y nuestras ofertas en El Rastro. */
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

/** Tratos que movieron la cifra (Δ real del juego), el más reciente primero. */
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
 * Un agente está vivo si escribió su traza hace menos de 3 ticks (o, sin hora, si su último tick
 * está a ≤ 3 del reloj). Con la partida en pausa todos parecen parados: es lo esperado.
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
  /** "in 0.4 h" (horas de juego) */
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

/** Próximas citas; las que caen a la misma hora se mantienen juntas y en orden. */
export function scheduleLines(board: Board, max = 8): ScheduleLine[] {
  const s = board.schedule;
  if (!s) return [];
  return s.upcoming.slice(0, max).map((u) => {
    const dh = s.now_hours !== null ? u.at_hours - s.now_hours : null;
    const when = dh === null ? `hour ${u.at_hours}` : dh <= 0 ? "now" : `in ${dh < 1 ? dh.toFixed(2) : dh.toFixed(1)} h`;
    return { at_hours: u.at_hours, when, action: ACTION_LABEL[u.action] ?? u.action, note: u.note };
  });
}

/** Partes del historial: lo que puntúa por negociación y los duelos, por separado. */
export function historyGroups(rows: readonly BoardRow[]): { trades: BoardRow[]; duels: BoardRow[] } {
  const closed = rows.filter((r) => r.status !== "open" && r.status !== "live");
  return { trades: closed.filter((r) => !r.kind.startsWith("duel")), duels: closed.filter((r) => r.kind.startsWith("duel")) };
}

export type PartyKind = "us" | "team" | "dealer" | "duel rival" | "public";

export interface Party {
  /** Nombre legible: "Team 2 (us)", "Los Gatos (t18)", "chato"… */
  label: string;
  kind: PartyKind;
}

const TEAM_ID = /\bt\d{2}\b/g;

/** Nombre de un equipo por su id (`t02`), con "(us)" si somos nosotros; el id tal cual si no lo conocemos. */
export function teamLabel(board: Board, id: string): string {
  const t = board.market.leaderboard.find((x) => x.team === id);
  if (id === board.team || t?.us) return `${t?.name ?? "Team"} (us)`;
  if (!t || t.name === id) return id;
  // "Team 13" ya dice quién es "t13"; otros nombres llevan el id al lado.
  return t.name === `Team ${Number(id.slice(1))}` ? t.name : `${t.name} (${id})`;
}

/** Ids de nuestras ofertas (de `/api/me/offers`), para reconocerlas en libros anónimos. */
export function ourOfferIds(board: Board): Set<number> {
  return new Set(board.rows.filter((r) => r.kind === "team-offer" || r.kind === "team-trade").flatMap((r) => r.offers.flatMap((o) => (o.maker === board.team && o.id !== null ? [o.id] : []))));
}

/**
 * Quién puso una oferta de un libro (El Rastro, nuestro venue). El Bazaar anonimiza al autor
 * (`m3950d43b`), así que las nuestras se reconocen por id; el resto es "otro equipo (anónimo)".
 */
export function bookMakerLabel(board: Board, line: { id: number; maker: string }, ours: ReadonlySet<number>): { label: string; us: boolean } {
  if (ours.has(line.id) || line.maker === board.team) return { label: teamLabel(board, board.team), us: true };
  if (/^t\d{2}$/.test(line.maker)) return { label: teamLabel(board, line.maker), us: false };
  return { label: `another team (anonymous ${line.maker.slice(0, 5)})`, us: false };
}

/** Sustituye los ids de equipo (`t18`) de un texto por su nombre; el texto se sigue mostrando como texto. */
export function withTeamNames(board: Board, text: string): string {
  return text.replace(TEAM_ID, (id) => (id === board.team || board.market.leaderboard.some((t) => t.team === id) ? teamLabel(board, id) : id));
}

/** ¿Este texto u oferta nos menciona? */
export function mentionsUs(board: Board, text: string): boolean {
  return board.team !== "" && (text.match(TEAM_ID) ?? ([] as string[])).includes(board.team);
}

/** Con quién es cada conversación y qué tipo de parte es. */
export function partyOf(board: Board, row: BoardRow): Party {
  if (row.kind.startsWith("dealer")) return { label: row.counterparty, kind: "dealer" };
  if (row.kind.startsWith("duel")) return { label: row.counterparty, kind: "duel rival" };
  if (row.kind === "team-offer") return { label: "anyone (public offer)", kind: "public" };
  return { label: withTeamNames(board, row.counterparty), kind: "team" };
}

export interface CurvePoint {
  round: number;
  value: number;
}

export interface OfferCurve {
  /** Primer tick de la conversación; la ronda 1 del gráfico es este tick. */
  firstTick: number;
  rounds: number;
  yDomain: [number, number];
  /** Marcas del eje Y en números redondos. */
  yTicks: number[];
  ours: CurvePoint[];
  theirs: CurvePoint[];
  /** Nuestro límite por tick (reserva de `decisions.jsonl`). */
  limit: CurvePoint[];
  /**
   * Si el límite de los turnos quedó por debajo del de apertura (compras): el agente lo recorta por
   * caja o presupuesto, o lo revalúa al revelar la carta; la traza no dice cuál. `{ from, to }`, o `null`.
   */
  capped: { from: number; to: number } | null;
  /** Línea horizontal de referencia: nuestro valor (dealers) o el límite del duelo. */
  reference: { value: number; label: string } | null;
  end: { round: number; kind: "deal" | "walk"; label: string } | null;
}

/** Escala "bonita": paso 1, 2 o 5 × 10^k, unas 4–6 marcas que cubren [lo, hi]. */
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
 * Curva de la negociación a partir de los precios ya extraídos de cada mensaje y de nuestras
 * decisiones. Solo dibuja lo registrado; si hay menos de dos precios, no hay curva.
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
  const values = [...ours, ...theirs, ...limit].map((p) => p.value).concat(reference ? [reference.value] : [], end?.kind === "deal" && row.price !== null ? [row.price] : []);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max(1, (hi - lo) * 0.1);
  const scale = niceScale(lo - pad, hi + pad);
  return { firstTick, rounds: lastRound + 1, yDomain: scale.domain, yTicks: scale.ticks, ours, theirs, limit, capped, reference, end };
}
