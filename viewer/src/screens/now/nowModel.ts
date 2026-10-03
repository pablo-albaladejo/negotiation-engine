import type { Board, BoardRow } from "../../model/bazaarBoard.js";
import { partyOf } from "../../model/cockpit.js";
import { assetLabel, boardRowIdFor, nowHours, roundAt, wallLabel, type GameModel, type ModelConversation, type ModelIntent, type NowOffer } from "../../model/gameModel.js";

/**
 * Pure logic of the «Now» tab: tick header, tick plan (SELECTED intents in arbitration order),
 * live conversations with their state, our published offers and what changed since the previous tick.
 * Mixes the board (`/api/bazaar/board`, fresh every tick) with the latest model build; no figure
 * is computed here: each row's figure is the one the code decided. No private values or limits.
 */

// ---------------------------------------------------------------- cabecera

export interface TickHeader {
  tick: number | null;
  gameHour: number | null;
  round: string;
  weight: number | null;
  /** Seconds until the next tick (local countdown from the last clock reading). */
  nextTickIn: number | null;
  doors: string | null;
  opens: string | null;
  modelAgeS: number | null;
  modelTick: number | null;
  /** Ticks the model build lags behind the clock. */
  modelBehind: number | null;
  apiAgeS: number | null;
  rebuilding: boolean;
}

export function tickHeader(board: Board, model: GameModel | null, nowMs: number, boardAtMs: number | null): TickHeader {
  const clock = board.clock;
  const tick = clock?.tick ?? model?.state?.clock.tick ?? model?.tick ?? null;
  const h = board.schedule?.now_hours ?? (model ? nowHours(model) : null);
  const r = model && h !== null ? roundAt(model, h) : null;
  const elapsed = boardAtMs !== null ? (nowMs - boardAtMs) / 1000 : 0;
  const builtMs = model?.built_at ? Date.parse(model.built_at) : NaN;
  const modelTick = model?.tick ?? null;
  const opens = wallLabel(model?.state?.clock.nextOpens ?? null);
  return {
    tick,
    gameHour: h,
    round: clock?.round_name ?? (r ? `R${r.round} · ${r.name}` : clock?.round != null ? `R${clock.round}` : "round ?"),
    weight: r?.weight ?? null,
    nextTickIn: clock?.next_tick_in != null ? Math.max(0, Math.round(clock.next_tick_in - elapsed)) : null,
    doors: clock?.doors ?? model?.state?.clock.doors ?? null,
    opens,
    modelAgeS: Number.isNaN(builtMs) ? null : Math.max(0, Math.round((nowMs - builtMs) / 1000)),
    modelTick,
    modelBehind: tick !== null && modelTick !== null ? tick - modelTick : null,
    apiAgeS: boardAtMs !== null ? Math.max(0, Math.round(elapsed)) : null,
    rebuilding: model?.rebuilding === true,
  };
}

export function ageLabel(s: number | null): string {
  if (s === null) return "—";
  if (s < 90) return `${s} s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  return `${Math.round(s / 3600)} h`;
}

// ---------------------------------------------------------------- tick plan

export interface PlanRow {
  id: string;
  selected: boolean;
  reason: string;
  order: number;
  route: string;
  /** Verb of the intent (accept, counter, open, post, cancel…). */
  action: string;
  /** Conversation or offer it concerns. */
  target: string;
  /** Id to open the drawer (model conversation or board row), if any. */
  open: string | null;
  figure: number | null;
  goal: string;
  global: string;
  summary: string;
}

const KIND_ORDER: Record<string, number> = { accept: 0, message: 1, probe: 2, open: 3, unpack: 4, flag: 5, cancel: 6, listing: 7 };
const VERB = /\b(OPEN|ACCEPT|COUNTER|HOLD|CLOSE|POST|CANCEL|WALK)\b/;

function convOf(model: GameModel, id: string | undefined): ModelConversation | undefined {
  if (!id) return undefined;
  const alt = id.replace(/^rastro-offer:/, "rastro:");
  return model.state?.conversations.find((c) => c.id === id || c.id === alt);
}

export function convLabel(c: ModelConversation): string {
  return `${c.counterparty} · ${c.side} ${assetLabel(c)}`;
}

function targetOf(model: GameModel, i: ModelIntent): string {
  const c = convOf(model, i.conversation);
  if (c) return `${c.id} · ${convLabel(c)}`;
  if (i.conversation?.startsWith("rastro-offer:")) return `El Rastro offer #${i.conversation.split(":")[1]}`;
  // Summary written by our code up to the first parenthesis or quote (never rival text).
  return i.summary.split(/ \(| "/)[0] ?? i.summary;
}

export function planRows(model: GameModel | null): { selected: PlanRow[]; dropped: PlanRow[] } {
  if (!model) return { selected: [], dropped: [] };
  const rows = model.routes.flatMap((r) =>
    r.intents.map((i): PlanRow => {
      const g = model.now?.goals[i.id];
      const c = convOf(model, i.conversation);
      return {
        id: i.id,
        selected: i.selected,
        reason: i.reason,
        order: i.order ?? 1000 + (KIND_ORDER[i.kind] ?? 9) * 100 - (i.ev ?? 0),
        route: r.label,
        action: VERB.exec(i.summary)?.[1]?.toLowerCase() ?? i.kind,
        target: targetOf(model, i),
        open: c ? c.id : null,
        figure: g?.figure ?? i.price ?? c?.strategy.lastDecision?.price ?? null,
        goal: g?.goal ?? c?.goal.why ?? "—",
        global: g?.global ?? "—",
        summary: i.summary,
      };
    }),
  );
  rows.sort((a, b) => a.order - b.order);
  return { selected: rows.filter((r) => r.selected), dropped: rows.filter((r) => !r.selected) };
}

export interface Quota {
  label: string;
  used: number;
  of: number;
}

/** Quotas from `clock.limits` versus what the tick plan would use. */
export function quotas(model: GameModel | null): Quota[] {
  const b = model?.budget;
  if (!model || !b) return [];
  const sel = model.routes.flatMap((r) => r.intents.filter((i) => i.selected));
  const count = (kind: string) => sel.filter((i) => i.kind === kind).length;
  const perConv = new Map<string, number>();
  for (const i of sel.filter((x) => x.kind === "message" || x.kind === "probe")) perConv.set(i.conversation ?? i.id, (perConv.get(i.conversation ?? i.id) ?? 0) + 1);
  const maxPerConv = Math.max(0, ...perConv.values());
  return [
    { label: "accepts this tick", used: count("accept"), of: b.accepts },
    { label: `messages per conversation (${perConv.size} conversations)`, used: maxPerConv, of: b.messagesPerConversation },
    { label: "open threads", used: b.openThreadsNow + count("open"), of: b.maxOpenThreads },
    { label: "new offers this tick", used: count("listing"), of: b.offersPerTick },
    { label: "open offers", used: Math.max(0, b.openOffersNow - count("cancel") + count("listing")), of: b.maxOpenOffers },
  ];
}

// ---------------------------------------------------------------- conversaciones vivas

export type LiveStatus = "our move" | "waiting for them" | "accept pending" | "cooloff" | "resting offer" | "done";

export interface LiveConv {
  key: string;
  /** Id for the drawer (board row if it exists, otherwise the model conversation). */
  open: string;
  kind: string;
  counterparty: string;
  side: string;
  asset: string;
  why: string;
  phase: string;
  roundsUsed: number | null;
  roundsLeft: number | null;
  lastOurs: number | null;
  lastTheirs: number | null;
  turn: "us" | "them" | "—";
  next: number | null;
  /** Its next predicted price from the per-persona fit (dealers only; its side, never our reserve). */
  herNext: number | null;
  deadlineIn: number | null;
  status: LiveStatus;
  outcome: string | null;
}

const KIND_NAME: Record<string, string> = { dealer: "dealer", duel: "duel", rastro: "El Rastro", venue: "venue" };

function lastOf(row: BoardRow | undefined, us: boolean): number | null {
  for (let k = (row?.messages.length ?? 0) - 1; k >= 0; k--) {
    const m = row!.messages[k]!;
    if (m.us === us && m.price !== null) return m.price;
  }
  return null;
}

function lastSender(row: BoardRow | undefined): "us" | "them" | null {
  const m = row?.messages[row.messages.length - 1];
  return m ? (m.us ? "us" : "them") : null;
}

const isOpen = (r: BoardRow) => r.status === "open" || r.status === "live";

export function liveConversations(board: Board, model: GameModel | null): { active: LiveConv[]; done: LiveConv[] } {
  const tick = board.clock?.tick ?? model?.tick ?? 0;
  const plan = model ? planRows(model).selected : [];
  const rowsById = new Map(board.rows.map((r) => [r.id, r]));
  const seen = new Set<string>();
  const out: LiveConv[] = [];
  for (const c of model?.state?.conversations ?? []) {
    const rowId = boardRowIdFor(c.id);
    const row = rowsById.get(rowId);
    seen.add(rowId);
    const closedNow = row ? !isOpen(row) : false;
    const done = c.phase === "done" || closedNow;
    const mine = plan.filter((p) => p.open === c.id);
    const accept = mine.find((p) => p.action === "accept");
    const msg = mine.find((p) => p.action !== "accept");
    const cool = (c.mood.cooloffUntil ?? 0) > tick || (model?.state?.ours.cooloffs ?? []).some((x) => x.dealer === c.counterparty && x.untilTick > tick);
    const sender = lastSender(row);
    const turn: LiveConv["turn"] = c.kind === "rastro" ? "them" : msg || accept ? "us" : sender === "them" ? "us" : sender === "us" ? "them" : c.history.ourPrices.length > c.history.herPrices.length ? "them" : "—";
    const status: LiveStatus = done ? "done" : cool ? "cooloff" : accept ? "accept pending" : c.kind === "rastro" ? "resting offer" : turn === "us" ? "our move" : "waiting for them";
    const budget = c.patience?.budget ?? c.patienceEstimate ?? c.strategy.plan.patienceBudget;
    const used = c.patience?.roundsSpent ?? c.roundsUsed;
    const dl = model?.now?.deadlines[c.id];
    out.push({
      key: c.id,
      open: row ? rowId : c.id,
      kind: KIND_NAME[c.kind] ?? c.kind,
      counterparty: row ? partyOf(board, row).label : c.counterparty,
      side: c.side,
      asset: assetLabel(c),
      why: c.goal.why,
      phase: closedNow && c.phase !== "done" ? `done (${row?.status})` : c.phase,
      roundsUsed: c.kind === "rastro" ? null : used,
      roundsLeft: c.kind === "rastro" || budget === undefined ? null : Math.max(0, budget - used),
      lastOurs: lastOf(row, true) ?? c.history.ourPrices.at(-1) ?? null,
      lastTheirs: lastOf(row, false) ?? c.history.herCurrent?.price ?? c.history.herPrices.at(-1) ?? null,
      turn: done ? "—" : turn,
      next: done ? null : (msg?.figure ?? accept?.figure ?? c.strategy.next.priceIfTheyHold ?? null),
      herNext: done ? null : (c.prediction?.herNext ?? null),
      deadlineIn: dl !== undefined && !done ? dl - tick : null,
      status,
      outcome: c.result?.outcome ? `${c.result.outcome}${c.result.price !== undefined ? ` @ ${c.result.price}` : ""}` : row && !isOpen(row) ? `${row.status}${row.price !== null ? ` @ ${row.price}` : ""}` : null,
    });
  }
  // What is open on the board that the model lacks (deals between teams, offers on other venues, model not yet built).
  for (const r of board.rows) {
    if (seen.has(r.id) || !isOpen(r)) continue;
    const duel = r.kind.startsWith("duel");
    const offer = r.kind === "team-offer";
    const sender = lastSender(r);
    const turn: LiveConv["turn"] = offer ? "them" : sender === "them" ? "us" : sender === "us" ? "them" : "—";
    out.push({
      key: r.id,
      open: r.id,
      kind: duel ? "duel" : r.kind.startsWith("dealer") ? "dealer" : offer ? "El Rastro" : "team",
      counterparty: partyOf(board, r).label,
      side: r.kind.endsWith("sell") || r.kind === "duel-seller" ? "sell" : r.kind.endsWith("buy") || r.kind === "duel-buyer" ? "buy" : "—",
      asset: r.item,
      why: "—",
      phase: r.status,
      roundsUsed: null,
      roundsLeft: null,
      lastOurs: offer ? r.price : lastOf(r, true),
      lastTheirs: lastOf(r, false),
      turn,
      next: null,
      herNext: null,
      deadlineIn: null,
      status: offer ? "resting offer" : turn === "us" ? "our move" : "waiting for them",
      outcome: null,
    });
  }
  const rank: Record<LiveStatus, number> = { "accept pending": 0, "our move": 1, cooloff: 2, "waiting for them": 3, "resting offer": 4, done: 5 };
  out.sort((a, b) => rank[a.status] - rank[b.status] || (a.deadlineIn ?? 1e9) - (b.deadlineIn ?? 1e9) || a.key.localeCompare(b.key));
  return { active: out.filter((c) => c.status !== "done"), done: out.filter((c) => c.status === "done") };
}

// ---------------------------------------------------------------- our offers

export interface OfferLine extends NowOffer {
  /** Age corrected to the current tick (the model may have been built one tick earlier). */
  age: number | null;
  expiresIn: number | null;
}

/** Model offers; if there is no `now` yet, the board's open offers (without venue or commission). */
export function offerLines(board: Board, model: GameModel | null): { lines: OfferLine[]; source: "model" | "board" } {
  const tick = board.clock?.tick ?? model?.tick ?? null;
  const fromModel = model?.now?.offers;
  if (fromModel) {
    const lag = tick !== null && model?.tick != null ? tick - model.tick : 0;
    return { source: "model", lines: fromModel.map((o) => ({ ...o, age: o.age_ticks !== null ? o.age_ticks + lag : null, expiresIn: o.expires_tick !== null && tick !== null ? o.expires_tick - tick : null })) };
  }
  const lines = board.rows
    .filter((r) => r.kind === "team-offer" && isOpen(r))
    .map((r): OfferLine => {
      const o = r.offers[r.offers.length - 1];
      const selling = /\b[A-Z]{3}-\d{2}\b/.test(o?.give ?? "");
      return {
        id: o?.id ?? 0,
        venue: "?",
        venue_name: null,
        side: selling ? "sell" : "buy",
        give: o?.give ?? "?",
        want: o?.want ?? "?",
        refs: [r.item],
        price: r.price,
        created_tick: r.tick_opened,
        expires_tick: null,
        age_ticks: null,
        fee: null,
        crosses: "unknown",
        goal: null,
        age: tick !== null && r.tick_opened !== null ? tick - r.tick_opened : null,
        expiresIn: null,
      };
    });
  return { source: "board", lines };
}

// ---------------------------------------------------------------- what changed

export interface Snapshot {
  tick: number | null;
  convs: Map<string, { label: string; open: boolean; status: string; msgs: number; ours: number | null; theirs: number | null }>;
  offers: Map<string, { label: string }>;
}

export function snapshotOf(board: Board, model: GameModel | null): Snapshot {
  const convs: Snapshot["convs"] = new Map();
  for (const r of board.rows) {
    if (r.kind === "team-offer") continue;
    convs.set(r.id, { label: `${r.id} · ${partyOf(board, r).label} · ${r.item}`, open: isOpen(r), status: r.status, msgs: r.messages.length, ours: lastOf(r, true), theirs: lastOf(r, false) });
  }
  for (const c of model?.state?.conversations ?? []) {
    const id = boardRowIdFor(c.id);
    if (convs.has(id) || c.kind === "rastro") continue;
    convs.set(id, { label: `${c.id} · ${convLabel(c)}`, open: c.phase !== "done", status: c.phase, msgs: c.history.ourPrices.length + c.history.herPrices.length, ours: c.history.ourPrices.at(-1) ?? null, theirs: c.history.herPrices.at(-1) ?? null });
  }
  const offers: Snapshot["offers"] = new Map();
  for (const o of offerLines(board, model).lines) offers.set(String(o.id), { label: `#${o.id} ${o.side} ${o.side === "buy" ? o.want : o.give} for ${o.side === "buy" ? o.give : o.want}${o.venue !== "?" ? ` on ${o.venue}` : ""}` });
  return { tick: board.clock?.tick ?? model?.tick ?? null, convs, offers };
}

export interface Change {
  kind: "message" | "price" | "opened" | "closed" | "posted" | "gone";
  text: string;
  /** Id for the drawer, if the line belongs to a conversation. */
  open: string | null;
}

export function diffSnapshots(prev: Snapshot, next: Snapshot, board: Board): Change[] {
  const out: Change[] = [];
  for (const [id, n] of next.convs) {
    const p = prev.convs.get(id);
    if (!p) {
      if (n.open) out.push({ kind: "opened", text: `opened ${n.label}`, open: id });
      continue;
    }
    if (p.open && !n.open) out.push({ kind: "closed", text: `closed ${n.label} (${n.status})`, open: id });
    if (n.msgs > p.msgs) out.push({ kind: "message", text: `${n.msgs - p.msgs} new message${n.msgs - p.msgs > 1 ? "s" : ""} in ${n.label}`, open: id });
    if (n.theirs !== p.theirs && n.theirs !== null) out.push({ kind: "price", text: `${n.label}: their price ${p.theirs ?? "—"} → ${n.theirs}`, open: id });
    if (n.ours !== p.ours && n.ours !== null) out.push({ kind: "price", text: `${n.label}: our price ${p.ours ?? "—"} → ${n.ours}`, open: id });
  }
  for (const [id, n] of next.offers) if (!prev.offers.has(id)) out.push({ kind: "posted", text: `posted offer ${n.label}`, open: board.rows.some((r) => r.id === `offer:${id}`) ? `offer:${id}` : null });
  for (const [id, p] of prev.offers) {
    if (next.offers.has(id)) continue;
    const row = board.rows.find((r) => r.id === `offer:${id}`);
    out.push({ kind: "gone", text: `offer ${p.label} ${row && !isOpen(row) ? row.status : "filled or withdrawn"}`, open: row ? row.id : null });
  }
  return out;
}

/**
 * Client memory (survives tab switches, not reloads): the snapshot of the last distinct tick and the
 * one of the current tick. The diff is always «previous tick → this tick».
 */
const memory: { prev: Snapshot | null; last: Snapshot | null } = { prev: null, last: null };

export function rememberSnapshot(next: Snapshot): Snapshot | null {
  if (next.tick === null) return memory.prev;
  if (memory.last && memory.last.tick !== next.tick) memory.prev = memory.last;
  memory.last = next;
  return memory.prev;
}
