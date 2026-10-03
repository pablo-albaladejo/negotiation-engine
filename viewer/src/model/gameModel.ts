import { niceScale, type OfferCurve } from "./cockpit.js";

/**
 * Our internal model as served by `/api/bazaar/model`: the tick's `GameState`, the budget from
 * `clock.limits`, the intents of each coordinator route (in dry-run) with their verdict and the
 * conversations with state and strategy. The fields another agent is adding to `src/state/` (time,
 * agenda, triggers, personas, eggs, flags, hints) are optional: they are rendered if present.
 * Types and pure functions only; nothing here computes a figure.
 */

export interface ModelDecision {
  action: string;
  price?: number;
  days?: number;
  rule: string;
  reason: string;
  tick: number;
}

export interface ModelStrategy {
  plan: { anchor?: number; plannedPath: number[]; stepSize?: number; patienceBudget?: number; walkCondition: string; acceptThreshold?: number; daysPlan?: string };
  lastDecision?: ModelDecision;
  next: { priceIfTheyHold?: number; walkWhen: string };
}

/** Interval of an estimate (mean and extremes). */
export interface FitRange {
  mean: number;
  lo: number;
  hi: number;
}

/** Per-persona fit prediction for a dealer conversation (its side only: never our values). */
export interface ModelPrediction {
  herNext?: number;
  herLimit: FitRange;
  /** Its predicted path per round (0 = opening). */
  curve: { round: number; price: number; lo: number; hi: number }[];
  walkRound: FitRange;
  mirror: boolean | "unknown";
  fittedFrom: number;
}

/** Per-persona fit estimates (`Persona.estimates`). */
export interface ModelPersonaEstimates {
  opening_markup: FitRange;
  beta: FitRange;
  max_rounds: FitRange;
  accept_margin: number;
  walk_after_rounds: FitRange;
  mirror: boolean | "unknown";
  bands: Record<string, { limit: FitRange; samples: number; fewSamples: boolean; best: number }>;
  fittedFrom: number;
  history: { tick: number; param: string; value: number }[];
}

export interface ModelConversation {
  id: string;
  kind: string;
  counterparty: string;
  asset: { ref?: string; rarity?: string; set?: string; item?: string };
  side: "buy" | "sell";
  goal: { why: string; expectedValue?: number };
  limits: { reservation?: number; privateValue?: number; duelLimit?: number; daysWeight?: unknown };
  history: { herPrices: number[]; ourPrices: number[]; herCurrent?: { price: number; final: boolean; days?: number } };
  phase: string;
  herConcession?: number;
  roundsUsed: number;
  patienceEstimate?: number;
  patience?: { roundsSpent?: number; budget?: number; probeCostNow?: number };
  mood: { warnings: number; strikes: number; cooloffUntil?: number; kindness?: number };
  hints?: unknown[];
  eggsTried?: unknown[];
  turn: { canMessage?: boolean; canAccept?: boolean };
  result?: { outcome?: string; price?: number; score?: number };
  strategy: ModelStrategy;
  flagCandidate?: unknown;
  /** Only in dealer conversations and if the server provides it. */
  prediction?: ModelPrediction;
}

export interface ModelIntent {
  id: string;
  route: string;
  kind: string;
  conversation?: string;
  acceptClass?: string;
  ev?: number;
  summary: string;
  locks?: string[];
  price?: number;
  selected: boolean;
  reason: string;
  /** Arbitration order (optional: an older server does not provide it). */
  order?: number;
}

export interface ModelRoute {
  route: string;
  label: string;
  status: "ok" | "failed" | "not wired";
  error?: string;
  notes: string[];
  intents: ModelIntent[];
}

export interface ModelScheduleEvent {
  at_hours: number;
  action: string;
  note: string | null;
  params: Record<string, unknown>;
  wall: string | null;
}

export interface ModelFeedLine {
  id: number;
  tick: number | null;
  type: string;
  text: string;
  actor?: string | null;
  persona?: string | null;
}

export interface MechanismDecisionView {
  current: string;
  recommendation: "stay-auto" | "switch-to-board" | "insufficient-data" | "stay-board" | "back-to-auto";
  reason: string;
  confidence: number;
  sessions: { benchAt: number; hard: boolean; ratio?: number }[];
  costs: { bond: number; fee: number; cashAvailable?: number };
  nextBenchAt?: number;
  nextBenchHard?: boolean;
  ticksToBench?: number;
  meanRatio?: number;
  hardPassed: number;
  heartbeat?: { ageSec: number; mode: string };
}

export interface ModelRivalPage {
  set: string;
  have: number;
  of: number;
  missing: string[];
}

export interface ModelBoardSnapshot {
  tick: number;
  albumFilled?: number;
  albumSlots?: number;
  pagesComplete?: number;
  rarest?: string;
  deals?: number;
  score?: number;
  negotiating?: number;
  market?: number;
  rank?: number;
}

export interface ModelRivalTeam {
  team: string;
  seen: { assetId: number; ref: string; tick: number; source: string; confirmedTick?: number }[];
  distinct: number;
  spares: string[];
  board?: ModelBoardSnapshot;
  /** Leaderboard rows over time (optional: an older server does not provide it). */
  history?: ModelBoardSnapshot[];
  unseen?: number;
  pages: ModelRivalPage[];
  wants: { ref: string; tick: number }[];
}

/** What other teams hold and want, from public structure only (`src/state/rivals.ts`). */
export interface ModelRivals {
  teams: ModelRivalTeam[];
  byRef: Record<string, { holders: string[]; wantedBy: string[] }>;
  seenAssets: number;
  lastEventId: number;
  /** Our leaderboard rows over time (an older server does not provide it). */
  usHistory?: ModelBoardSnapshot[];
}

export interface ModelState {
  tick: number;
  builtAt: string;
  clock: { tick: number; tHours?: number; tickSeconds?: number; paused: boolean; doors?: string; roundName?: string; nextTickIn?: number; closes?: string; nextOpens?: string };
  limits: Record<string, unknown>;
  ours: {
    team?: string;
    name?: string;
    cash?: number;
    level?: number;
    unlocked: string[];
    album: { pages: { set: string; name?: string; have: number; of: number; complete: boolean }[]; filled?: number; slots?: number };
    holdings: { cards: number; packs: number; spares: number };
    score?: Record<string, unknown>;
    venue?: { id?: string; name?: string; mechanism?: string; status?: string };
    openThreads: { id: number; with?: string; status: string }[];
    cooloffs: { dealer: string; untilTick: number }[];
    eggs?: unknown[];
    badges?: unknown[];
    hiddenCards?: unknown[];
    gifts?: unknown[];
    flags?: { sent?: unknown[]; balance?: number } | unknown[];
  };
  env: {
    schedule: { nowHours?: number; next: { atHours: number; action: string; note?: string }[] };
    dealers: { id: string; name?: string; status?: string; level?: number }[];
    rastro: { offers: number; asks: number; bids: number; ours: number };
    myOpenOffers: number;
    leaderboard?: { tick?: number; ourRank?: number; ourScore?: number; top: { team: string; name?: string; score?: number; rank?: number }[] };
  };
  conversations: ModelConversation[];
  /** Other teams (optional: an older server does not provide it). */
  rivals?: ModelRivals;
  missing: string[];
  /** Market Test auto-or-board decision (`src/venue/mechanism.ts`), computed with the sessions measured in shadow. */
  venue?: { mechanismDecision: MechanismDecisionView };
  personas?: unknown[];
  world?: { eggs?: { byPersona?: Record<string, { foundByOthers?: unknown[]; left?: number; leftAssumed?: boolean }> } } & Record<string, unknown>;
  time?: Record<string, unknown>;
  agenda?: unknown[];
  triggers?: unknown[];
}

/** Data for the «Now» tab (`now` in `/api/bazaar/model`). */
export interface NowOffer {
  id: number;
  venue: string;
  venue_name: string | null;
  side: "sell" | "buy" | "swap";
  give: string;
  want: string;
  refs: string[];
  price: number | null;
  created_tick: number | null;
  expires_tick: number | null;
  age_ticks: number | null;
  fee: { bps: number; per_card: number; est: number | null } | null;
  crosses: { offer: number; price: number } | null | "unknown";
  goal: string | null;
}

export interface NowVenue {
  id: string;
  name: string | null;
  status: string | null;
  mechanism: string | null;
  opened_tick: number | null;
  trades: number | null;
  volume: number | null;
  fees: number | null;
  fee_bps: number | null;
  fee_per_card: number | null;
  pending_fee: { fee_bps: number | null; fee_per_card: number | null; effective_tick: number | null; in_ticks: number | null } | null;
  suspension_reason: string | null;
}

export interface NowData {
  goals: Record<string, { goal: string; global: string; figure: number | null }>;
  deadlines: Record<string, number>;
  offers: NowOffer[];
  venue: NowVenue | null;
}

export interface GameModel {
  available: boolean;
  /** The response is the latest build and another is in progress (optional on older servers). */
  rebuilding?: boolean;
  reason: string | null;
  tick: number | null;
  built_at: string | null;
  next_refresh_ms: number;
  safety: { mode: string; blocked: number; note: string };
  inputs: { ok: string[]; missing: string[] };
  state: ModelState | null;
  budget:
    | { accepts: number; messagesPerConversation: number; maxOpenThreads: number; openThreadsNow: number; offersPerTick: number; maxOpenOffers: number; openOffersNow: number; missing: string[]; lines: string[]; assumption: string }
    | null;
  accept_priority: { cls: string; rank: number; why: string }[];
  routes: ModelRoute[];
  goals: {
    round_weights: { round: number; name: string; at_hours: number; weight: number }[];
    levers: string[];
    page_targets: string[];
    cash_floor: number;
    max_spend_hour: number;
    max_spend_total: number;
    judges: string;
  };
  schedule: { now_hours: number | null; events: ModelScheduleEvent[] };
  triggers: ModelFeedLine[];
  eggs_feed: ModelFeedLine[];
  persisted: { date: string | null; conversations: boolean; personas: unknown; flags: unknown };
  hints: Record<string, unknown>[];
  /** Optional: an older server does not provide it. */
  prices?: { source: string; rows: Record<string, unknown>[] };
  packs?: { state: unknown; catalog: unknown[]; held: unknown[] };
  venues?: { state: unknown; api: unknown[] };
  now?: NowData | null;
  /** Per-persona fit (optional: an older server does not provide it). */
  fit?: { source: string; estimates: Record<string, ModelPersonaEstimates>; welcome?: string[]; bands?: Record<string, string> } | null;
}

// ---------------------------------------------------------------- lectura tolerante

export const rec = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
export const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const numOf = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const strOf = (x: unknown): string | undefined => (typeof x === "string" && x !== "" ? x : undefined);
const pick = (o: Record<string, unknown>, ...keys: string[]): unknown => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null);

/** Readable text of any value (hint, egg, gift…): always plain text. */
export function textOf(x: unknown): string {
  if (x === null || x === undefined) return "—";
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);
  const o = rec(x);
  const main = strOf(pick(o, "text", "phrase", "name", "prize", "ref", "id", "reason"));
  const rest = Object.entries(o)
    .filter(([k, v]) => v !== null && v !== undefined && typeof v !== "object" && !["text", "phrase", "name", "prize", "ref", "id", "reason"].includes(k))
    .map(([k, v]) => `${k} ${String(v)}`);
  return [main, ...rest].filter(Boolean).join(" · ") || JSON.stringify(x);
}

/** The raw model from the API, or an empty model if it does not arrive. */
export function gameModelOf(raw: unknown): GameModel | null {
  const o = rec(raw);
  if (typeof o.available !== "boolean") return null;
  return raw as GameModel;
}

// ---------------------------------------------------------------- conversations ↔ board rows

/** Board row of a model conversation (`dealer:56` → `thread:56`, `rastro:7` → `offer:7`). */
export function boardRowIdFor(convId: string): string {
  const [kind, id] = convId.split(":");
  if (kind === "dealer") return `thread:${id}`;
  if (kind === "rastro") return `offer:${id}`;
  return convId;
}

export function modelConversationFor(model: GameModel | null, rowId: string): ModelConversation | null {
  const list = model?.state?.conversations ?? [];
  return list.find((c) => c.id === rowId || boardRowIdFor(c.id) === rowId) ?? null;
}

const PHASE_ORDER: Record<string, number> = { closing: 0, haggling: 1, opening: 2, done: 3 };

/** Active first (close, haggling, opening), then the finished ones. */
export function sortedConversations(model: GameModel | null): ModelConversation[] {
  return [...(model?.state?.conversations ?? [])].sort((a, b) => (PHASE_ORDER[a.phase] ?? 9) - (PHASE_ORDER[b.phase] ?? 9) || a.id.localeCompare(b.id));
}

export function assetLabel(c: ModelConversation): string {
  return c.asset.ref ?? c.asset.item ?? (c.asset.rarity ? `${c.asset.rarity} ${c.asset.set ?? ""}`.trim() : "?");
}

/** Round x of the patience (dealer) or of the duel rounds. */
export function roundOf(c: ModelConversation): string {
  const used = c.patience?.roundsSpent ?? c.roundsUsed;
  const budget = c.patience?.budget ?? c.patienceEstimate ?? c.strategy.plan.patienceBudget;
  return budget !== undefined ? `${used}/${budget}` : String(used);
}

export function decisionLabel(d: ModelDecision | undefined): string {
  if (!d) return "—";
  return `${d.action}${d.price !== undefined ? ` ${d.price}${d.days !== undefined ? ` day ${d.days}` : ""}` : ""} · ${d.rule}`;
}

// ---------------------------------------------------------------- curve with the predicted path

/**
 * Predicted path (`strategy.plan.plannedPath`) over the board curve: the steps we have not taken yet
 * are placed at the ticks following the last one, joined to our last offer. Returns the extended curve.
 */
export function withPlannedPath(curve: OfferCurve, conv: ModelConversation | null): { curve: OfferCurve; planned: { round: number; value: number }[] } {
  const path = conv?.phase !== "done" ? (conv?.strategy.plan.plannedPath ?? []) : [];
  const sent = conv?.history.ourPrices.length ?? 0;
  const future = path.slice(sent);
  if (future.length === 0) return { curve, planned: [] };
  const lastRound = Math.max(curve.rounds - 1, ...curve.ours.map((p) => p.round), ...curve.theirs.map((p) => p.round));
  const lastOurs = curve.ours[curve.ours.length - 1];
  const planned = [...(lastOurs ? [lastOurs] : []), ...future.map((value, k) => ({ round: lastRound + 1 + k, value }))];
  const values = [...curve.ours, ...curve.theirs, ...curve.limit, ...planned].map((p) => p.value).concat(curve.reference ? [curve.reference.value] : []);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const scale = niceScale(lo - Math.max(1, (hi - lo) * 0.1), hi + Math.max(1, (hi - lo) * 0.1));
  return { curve: { ...curve, rounds: lastRound + future.length + 1, yDomain: scale.domain, yTicks: scale.ticks }, planned };
}

/**
 * Model-only curve (no board row or fewer than two recorded prices): X axis = conversation step;
 * our offers, theirs, the predicted path, the limit (private, local only) and the threshold.
 */
export function modelCurve(conv: ModelConversation): { curve: OfferCurve; planned: { round: number; value: number }[] } | null {
  const ours = conv.history.ourPrices.map((value, k) => ({ round: k + 1, value }));
  const theirs = conv.history.herPrices.map((value, k) => ({ round: k + 1, value }));
  if (ours.length + theirs.length + conv.strategy.plan.plannedPath.length === 0) return null;
  const limit = conv.limits.duelLimit ?? conv.limits.reservation ?? conv.limits.privateValue;
  const base: OfferCurve = {
    firstTick: 1,
    rounds: Math.max(ours.length, theirs.length) + 1,
    yDomain: [0, 1],
    yTicks: [],
    ours,
    theirs,
    limit: [],
    capped: null,
    reference: limit !== undefined ? { value: limit, label: conv.kind === "duel" ? `our limit ${limit}` : `our value ${limit}` } : null,
    end: null,
  };
  const out = withPlannedPath(base, conv);
  if (out.planned.length > 0) return out;
  const values = [...ours, ...theirs].map((p) => p.value).concat(limit !== undefined ? [limit] : []);
  if (values.length === 0) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const scale = niceScale(lo - Math.max(1, (hi - lo) * 0.1), hi + Math.max(1, (hi - lo) * 0.1));
  return { curve: { ...base, yDomain: scale.domain, yTicks: scale.ticks }, planned: [] };
}

// ---------------------------------------------------------------- time and agenda

const fmtH = (h: number) => (Math.round(h * 100) / 100).toFixed(2);

/** "Sat 09:00" in Madrid time. */
export function wallLabel(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).replace(",", "");
}

/** Round in force at hour `h` (R1 ×0.5 from h 0; R2 and R3 per `/api/schedule`). */
export function roundAt(model: GameModel, h: number): { round: number; name: string; weight: number } | null {
  const rounds = [...model.goals.round_weights].sort((a, b) => a.at_hours - b.at_hours);
  return [...rounds].reverse().find((r) => r.at_hours <= h + 1e-9) ?? rounds[0] ?? null;
}

/** Current game hour: `state.time` if present, otherwise `clock.t_hours` or `schedule.now_hours`. */
export function nowHours(model: GameModel): number | null {
  const t = rec(model.state?.time);
  return numOf(pick(t, "gameHour", "game_hour", "hours", "tHours")) ?? model.state?.clock.tHours ?? model.schedule.now_hours ?? null;
}

/** One-line summary: "h 2.65 · R1 ×0.5 · closed until Sat 09:00". */
export function timeSummary(model: GameModel): string {
  const t = rec(model.state?.time);
  const h = nowHours(model);
  const parts: string[] = [];
  if (h !== null) parts.push(`h ${fmtH(h)}`);
  const tRound = numOf(t.round) ?? numOf(rec(t.round).n);
  const tWeight = numOf(pick(t, "roundWeight", "round_weight", "weight")) ?? numOf(rec(t.round).weight);
  const r = h !== null ? roundAt(model, h) : null;
  const round = tRound ?? r?.round;
  const weight = tWeight ?? r?.weight;
  if (round !== undefined) parts.push(`R${round}${weight !== undefined ? ` ×${weight}` : ""}`);
  const clock = model.state?.clock;
  const phase = strOf(pick(t, "dayPhase", "day_phase"));
  if (clock?.paused || (clock?.doors && clock.doors !== "open")) {
    const opens = wallLabel(strOf(t.nextOpens) ?? clock?.nextOpens);
    parts.push(`${phase ?? "closed"}${opens ? ` until ${opens}` : ""}`);
  } else {
    if (phase) parts.push(phase);
    if (clock?.tickSeconds !== undefined) parts.push(`${clock.tickSeconds} s/tick`);
    const left = numOf(pick(t, "ticksLeftToday", "ticksLeft", "ticks_left"));
    if (left !== undefined) parts.push(`${left} ticks left today`);
  }
  const drift = numOf(pick(t, "drift", "driftHours", "drift_hours")) ?? numOf(rec(t.drift).offsetHours);
  if (drift !== undefined && Math.abs(drift) > 0.005) parts.push(`schedule drift ${drift > 0 ? "+" : ""}${fmtH(drift)} h`);
  if (t.scheduleChanged === true) parts.push("schedule changed");
  return parts.join(" · ") || "time unknown";
}

/** What our code does for each event kind (if `state.agenda` does not bring its own plan). */
const PLANNED_ACTION: Record<string, string> = {
  bench: "broker matches the Market Test bench on our venue (board earns full, auto half)",
  duels: "duels route on: v2 policy, early accept with decay",
  round: "round weight changes: re-plan the ladder",
  set_release: "new set: refresh page targets and missing-card values",
  grant_all: "cash arrives: spending caps reset, bids re-checked",
  day_closes: "doors close: nothing queued, live mode waits",
  day_opens: "doors open: bazaar:play resumes the tick loop",
  finale: "finale: stop opening, close what is in hand",
  freeze: "freeze: nothing after it counts",
};

/** Lead time (game hours) by which we must be ready for each event kind. */
const LEAD_HOURS: Record<string, number> = { bench: 0.1, duels: 0.25, round: 0.1, set_release: 0.1, grant_all: 0, day_closes: 0.1, day_opens: 0, finale: 0.5, freeze: 0.5 };

export interface TimelineEvent {
  at: number;
  action: string;
  label: string;
  note: string;
  planned: string;
  lead: number;
  wall: string | null;
  countdown: string | null;
}

function eventLabel(action: string, params: Record<string, unknown>): string {
  const name = strOf(params.name);
  if (action === "duels") return name ?? "Duels";
  if (action === "bench") return name ?? "Market Test";
  if (action === "round") return name ?? "Round";
  if (action === "set_release") return `Set ${strOf(params.set) ?? "?"}`;
  if (action === "grant_all") return "Grant";
  if (action === "day_closes") return "Day closes";
  if (action === "day_opens") return "Day opens";
  return action.replace(/_/g, " ");
}

/** Known events of the day: `state.agenda` if present; otherwise `/api/schedule` with our plan per kind. */
export function timelineEvents(model: GameModel): TimelineEvent[] {
  const now = nowHours(model);
  const countdown = (at: number) => (now === null ? null : at <= now ? "now / past" : `in ${fmtH(at - now)} h`);
  const agenda = arr(model.state?.agenda);
  if (agenda.length > 0) {
    return agenda.flatMap((x): TimelineEvent[] => {
      const o = rec(x);
      const at = numOf(pick(o, "atHours", "at_hours", "hour"));
      const action = strOf(pick(o, "action", "kind", "type")) ?? "event";
      if (at === undefined) return [];
      const params = rec(o.params);
      return [
        {
          at,
          action,
          label: strOf(pick(o, "label", "name")) ?? eventLabel(action, params),
          note: strOf(o.note) ?? "",
          planned: strOf(pick(o, "plannedAction", "planned_action", "plan")) ?? PLANNED_ACTION[action] ?? "—",
          lead: numOf(pick(o, "leadHours", "lead_hours", "lead")) ?? LEAD_HOURS[action] ?? 0,
          wall: wallLabel(strOf(pick(o, "wall", "wallTime"))),
          countdown: strOf(pick(o, "countdown")) ?? countdown(at),
        },
      ];
    });
  }
  return model.schedule.events.map((e) => ({
    at: e.at_hours,
    action: e.action,
    label: eventLabel(e.action, e.params),
    note: e.note ?? "",
    planned: PLANNED_ACTION[e.action] ?? "—",
    lead: LEAD_HOURS[e.action] ?? 0,
    wall: wallLabel(e.wall),
    countdown: countdown(e.at_hours),
  }));
}

/** Recent triggers: `state.triggers` if present; otherwise the feed events the server flagged. */
export function triggerLines(model: GameModel): { tick: number | null; type: string; text: string }[] {
  const own = arr(model.state?.triggers);
  if (own.length > 0) {
    return own.slice(0, 20).map((x) => {
      const o = rec(x);
      return { tick: numOf(o.tick) ?? null, type: strOf(pick(o, "type", "kind", "event")) ?? "trigger", text: strOf(pick(o, "text", "note", "action")) ?? textOf(x) };
    });
  }
  return model.triggers.map((t) => ({ tick: t.tick, type: t.type, text: t.text }));
}

// ---------------------------------------------------------------- personas

export interface PersonaView {
  id: string;
  name: string;
  type: string;
  status: string;
  level: number | null;
  traits: Record<string, number>;
  unlock: string;
  teaser: string | null;
  hints: number;
  eggProbes: unknown[];
  eggsByOthers: unknown[];
  eggsLeft: string | null;
  source: "state" | "personas.json" | "dealers";
}

function unlockText(o: Record<string, unknown>): string {
  const p = rec(o.progress);
  const u = rec(o.unlock);
  const parts: string[] = [];
  if (strOf(p.dealer) && numOf(p.needed) !== undefined) parts.push(`${p.dealer} deals ${numOf(p.deals) ?? 0}/${p.needed}`);
  if (u.always === true) parts.push("always open");
  if (strOf(u.openToAllAt)) parts.push(`open to all at ${u.openToAllAt}`);
  if (strOf(o.unlockPrize)) parts.push(`prize ${o.unlockPrize}`);
  return parts.join(" · ") || "—";
}

/** Personas: `state.personas`, otherwise `personas.json`, otherwise the dealers from `/api/dealers`. */
export function personasOf(model: GameModel): PersonaView[] {
  const eggs = model.state?.world?.eggs?.byPersona ?? {};
  const fromState = arr(model.state?.personas);
  const persisted = rec(model.persisted.personas);
  const fromFile = Array.isArray(model.persisted.personas) ? model.persisted.personas : Array.isArray(persisted.personas) ? persisted.personas : Object.values(rec(persisted.personas ?? {}));
  const source: PersonaView["source"] = fromState.length > 0 ? "state" : fromFile.length > 0 ? "personas.json" : "dealers";
  const list = fromState.length > 0 ? fromState : fromFile.length > 0 ? fromFile : (model.state?.env.dealers ?? []);
  return list.map((x) => {
    const o = rec(x);
    const id = strOf(o.id) ?? "?";
    const e = rec(eggs[id]);
    const traits = Object.fromEntries(Object.entries(rec(o.traits)).filter(([, v]) => typeof v === "number")) as Record<string, number>;
    return {
      id,
      name: strOf(o.name) ?? id,
      type: strOf(o.type) ?? "dealer",
      status: strOf(o.status) ?? "—",
      level: numOf(o.level) ?? null,
      traits,
      unlock: unlockText(o),
      teaser: strOf(o.teaser) ?? null,
      hints: arr(o.hints).length,
      eggProbes: arr(o.eggProbes),
      eggsByOthers: arr(e.foundByOthers),
      eggsLeft: numOf(e.left) !== undefined ? `${e.left}${e.leftAssumed ? " (assumed)" : ""}` : null,
      source,
    };
  });
}

// ---------------------------------------------------------------- hints corpus

export interface HintView {
  key: string;
  persona: string;
  text: string;
  tick: number | null;
  hour: number | null;
  wall: string | null;
  source: string;
  messageId: string | null;
  candidate: boolean;
  reasons: string[];
  classification: string | null;
}

/** Corpus (`hints.jsonl`) + hints from `state.personas[].hints`, deduplicated, most recent first. */
export function hintsOf(model: GameModel): HintView[] {
  const out = new Map<string, HintView>();
  const add = (x: unknown, persona?: string) => {
    const o = typeof x === "string" ? { text: x } : rec(x);
    const text = strOf(o.text);
    if (!text) return;
    const who = strOf(o.persona) ?? persona ?? "?";
    const tick = numOf(o.tick) ?? null;
    const key = `${who}|${tick ?? ""}|${text}`;
    if (out.has(key)) return;
    out.set(key, {
      key,
      persona: who,
      text,
      tick,
      hour: numOf(pick(o, "gameHour", "game_hour", "hour")) ?? null,
      wall: wallLabel(strOf(pick(o, "wall", "wallTime", "wall_time"))),
      source: strOf(o.source) ?? (persona ? "state" : "corpus"),
      messageId: o.messageId !== undefined || o.message_id !== undefined ? String(pick(o, "messageId", "message_id")) : null,
      candidate: o.candidate === true,
      reasons: arr(o.reasons).map((r) => textOf(r)),
      classification: strOf(o.classification) ?? null,
    });
  };
  for (const h of model.hints) add(h);
  for (const p of arr(model.state?.personas)) for (const h of arr(rec(p).hints)) add(h, strOf(rec(p).id));
  return [...out.values()].sort((a, b) => (b.tick ?? -1) - (a.tick ?? -1));
}

export interface HintFilters {
  candidatesOnly: boolean;
  classification: string;
  persona: string;
  q: string;
}

export function filterHints(hints: readonly HintView[], f: HintFilters): HintView[] {
  const q = f.q.trim().toLowerCase();
  return hints.filter(
    (h) =>
      (!f.candidatesOnly || h.candidate) &&
      (f.classification === "" || (f.classification === "none" ? h.classification === null : h.classification === f.classification)) &&
      (f.persona === "" || h.persona === f.persona) &&
      (q === "" || h.text.toLowerCase().includes(q) || h.reasons.some((r) => r.toLowerCase().includes(q))),
  );
}

/** Hints that differ only in their numbers ("I think 16 P…", "I think 18 P…"), as one line. */
export interface HintGroup {
  key: string;
  persona: string;
  /** Text of the latest hint, numbers kept as they are. */
  text: string;
  count: number;
  lastTick: number | null;
  candidate: boolean;
  reasons: string[];
  classification: string | null;
}

/** Groups by persona + text with digits masked; keeps the input order (latest first). */
export function groupHints(hints: readonly HintView[]): HintGroup[] {
  const out = new Map<string, HintGroup>();
  for (const h of hints) {
    const key = `${h.persona}|${h.text.replace(/\d+([.,]\d+)?/g, "#")}`;
    const g = out.get(key);
    if (!g) {
      out.set(key, { key, persona: h.persona, text: h.text, count: 1, lastTick: h.tick, candidate: h.candidate, reasons: [...h.reasons], classification: h.classification });
      continue;
    }
    g.count += 1;
    g.candidate ||= h.candidate;
    g.classification ??= h.classification;
    for (const r of h.reasons) if (!g.reasons.includes(r)) g.reasons.push(r);
  }
  return [...out.values()];
}

// ---------------------------------------------------------------- flags

/** Flags sent (state or `flags.json`) and their balance; candidates from the conversations. */
export function flagsOf(model: GameModel): { sent: unknown[]; balance: number | null; candidates: { conversation: string; candidate: unknown }[] } {
  const ours = model.state?.ours.flags;
  const own = rec(ours);
  const file = rec(model.persisted.flags);
  const sent = Array.isArray(ours) ? ours : arr(own.sent).length > 0 ? arr(own.sent) : Array.isArray(model.persisted.flags) ? model.persisted.flags : arr(file.sent ?? file.flags);
  const balance = numOf(own.balance) ?? numOf(file.balance) ?? null;
  const candidates = (model.state?.conversations ?? []).filter((c) => c.flagCandidate !== undefined && c.flagCandidate !== null).map((c) => ({ conversation: c.id, candidate: c.flagCandidate }));
  return { sent, balance, candidates };
}

// ---------------------------------------------------------------- prices per card

export interface PriceRow {
  ref: string;
  name: string | null;
  set: string;
  rarity: string | null;
  book: number | null;
  printRun: number | null;
  minted: number | null;
  scarcity: number | null;
  dealers: string[];
  bestBid: number | null;
  bestAsk: number | null;
  bidVenue: string | null;
  askVenue: string | null;
  lastTrade: number | null;
  value: number | null;
  holdings: number;
  buyEdge: number | null;
  sellEdge: number | null;
  completesPage: boolean;
}

const n = (o: Record<string, unknown>, ...keys: string[]): number | null => numOf(pick(o, ...keys)) ?? null;

/** Best price of a field: number, `{ price, venue }` quote or per-venue object (`{ rastro: 8, v04: 9 }`). */
function bestOf(x: unknown, best: (a: number, b: number) => number): number | null {
  if (typeof x === "number") return x;
  const q = numOf(rec(x).price);
  if (q !== undefined) return q;
  const vals = Object.values(rec(x)).map((v) => numOf(v) ?? numOf(rec(v).price)).filter((v): v is number => v !== undefined);
  return vals.length ? vals.reduce(best) : null;
}

/** Price rows (`state.markets.prices` or the viewer's reconstruction), with camelCase or snake_case names. */
export function priceRows(model: GameModel): PriceRow[] {
  return (model.prices?.rows ?? []).flatMap((x): PriceRow[] => {
    const o = rec(x);
    const ref = strOf(pick(o, "ref", "card", "id"));
    if (!ref) return [];
    const value = n(o, "value", "privateValue", "private_value", "ourValue");
    const bid = bestOf(pick(o, "bestBid", "best_bid", "bid"), Math.max);
    const ask = bestOf(pick(o, "bestAsk", "best_ask", "ask"), Math.min);
    const holdings = n(o, "holdings", "held", "copies") ?? 0;
    const dealers = pick(o, "dealers");
    const d = rec(dealers);
    const dealerList = Array.isArray(dealers)
      ? dealers.map(textOf)
      : Array.isArray(d.sells) || Array.isArray(d.buys)
        ? [...arr(d.sells).map((x) => `${textOf(x)} sells`), ...arr(d.buys).map((x) => `${textOf(x)} buys`)]
        : Object.keys(d);
    return [
      {
        ref,
        name: strOf(o.name) ?? null,
        set: strOf(o.set) ?? ref.split("-")[0] ?? "?",
        rarity: strOf(o.rarity) ?? null,
        book: n(o, "book"),
        printRun: n(o, "printRun", "print_run"),
        minted: n(o, "minted"),
        scarcity: n(o, "scarcity"),
        dealers: dealerList,
        bestBid: bid,
        bestAsk: ask,
        bidVenue: strOf(rec(pick(o, "bestBid", "best_bid")).venue) ?? strOf(o.bid_venue) ?? (bid !== null && model.prices?.source !== "state" ? "rastro" : null),
        askVenue: strOf(rec(pick(o, "bestAsk", "best_ask")).venue) ?? strOf(o.ask_venue) ?? (ask !== null && model.prices?.source !== "state" ? "rastro" : null),
        lastTrade: bestOf(pick(o, "lastTrade", "last_trade"), (a) => a),
        value,
        holdings,
        buyEdge: n(o, "buyEdge", "buy_edge") ?? (value !== null && ask !== null ? Math.round((value - ask) * 10) / 10 : null),
        sellEdge: n(o, "sellEdge", "sell_edge") ?? (value !== null && bid !== null && holdings > 0 ? Math.round((bid - value) * 10) / 10 : null),
        completesPage: pick(o, "completesPage", "completes_page") === true,
      },
    ];
  });
}

export type PriceSort = "ref" | "buyEdge" | "sellEdge" | "value" | "book" | "scarcity";

export interface PriceFilters {
  set: string;
  rarity: string;
  opportunities: boolean;
  sort: PriceSort;
}

export function filterPrices(rows: readonly PriceRow[], f: PriceFilters): PriceRow[] {
  const out = rows.filter((r) => (f.set === "" || r.set === f.set) && (f.rarity === "" || r.rarity === f.rarity) && (!f.opportunities || (r.buyEdge ?? 0) > 0 || (r.sellEdge ?? 0) > 0));
  if (f.sort === "ref") return out.sort((a, b) => a.ref.localeCompare(b.ref));
  const key = f.sort;
  return out.sort((a, b) => (b[key] ?? -Infinity) - (a[key] ?? -Infinity) || a.ref.localeCompare(b.ref));
}

// ---------------------------------------------------------------- venues

export interface VenueView {
  id: string;
  name: string;
  owner: string | null;
  ownerName: string | null;
  ownerRank: number | null;
  ownerScore: number | null;
  feePct: number | null;
  feePerCard: number | null;
  mechanism: string | null;
  status: string | null;
  depth: number | null;
  trades: number | null;
  rivalPenalty: number | null;
  ours: boolean;
}

/** Venues: `state.markets.venues` if present; otherwise `/api/venues` as is (without El Rastro, which is the house's). */
export function venuesOf(model: GameModel, ourTeam: string): VenueView[] {
  const own = arr(model.venues?.state);
  const list = own.length > 0 ? own : (model.venues?.api ?? []);
  return list.flatMap((x): VenueView[] => {
    const o = rec(x);
    const id = strOf(pick(o, "id", "venue"));
    if (!id) return [];
    const owner = strOf(o.owner) ?? null;
    const bps = n(o, "fee_bps", "feeBps");
    const pct = n(o, "feePct", "fee_pct", "fee");
    return [
      {
        id,
        name: strOf(o.name) ?? id,
        owner,
        ownerName: strOf(pick(o, "ownerName", "owner_name")) ?? null,
        ownerRank: n(o, "ownerRank", "owner_rank"),
        ownerScore: n(o, "ownerScore", "owner_score"),
        feePct: bps !== null ? bps / 100 : pct,
        feePerCard: n(o, "fee_per_card", "feePerCard"),
        mechanism: strOf(o.mechanism) ?? strOf(rec(o.rules).mechanism) ?? null,
        status: strOf(o.status) ?? null,
        depth: n(o, "depth", "offers"),
        trades: n(o, "trades"),
        rivalPenalty: n(o, "rivalPenalty", "rival_penalty"),
        ours: o.ours === true || (owner !== null && owner === ourTeam),
      },
    ];
  });
}

// ---------------------------------------------------------------- sobres

export interface PackTypeView {
  id: string;
  name: string;
  color: string | null;
  /** Probability of each rarity per slot. */
  slots: Record<string, number>[];
  expectedBook: number | null;
  ev: number | null;
  dealerPrice: number | null;
  bid: number | null;
  ask: number | null;
}

export interface HeldPackView {
  id: string;
  ref: string;
  name: string;
  value: number | null;
  action: string | null;
  why: string | null;
}

/** Packs: state of the PACKS route if present; otherwise the catalog and our closed packs from `/api/me`. */
export function packsOf(model: GameModel): { types: PackTypeView[]; held: HeldPackView[]; intents: string[]; source: "state" | "catalog" } {
  const st = model.packs?.state;
  const so = rec(st);
  const stateTypes = Array.isArray(st) ? st : arr(pick(so, "types", "packTypes", "pack_types"));
  const types = (stateTypes.length > 0 ? stateTypes : (model.packs?.catalog ?? [])).flatMap((x): PackTypeView[] => {
    const o = rec(x);
    const id = strOf(pick(o, "id", "ref"));
    if (!id) return [];
    return [
      {
        id,
        name: strOf(o.name) ?? id,
        color: strOf(o.color) ?? null,
        slots: arr(o.slots).map((sl) => Object.fromEntries(Object.entries(rec(sl)).filter(([, v]) => typeof v === "number")) as Record<string, number>),
        expectedBook: n(o, "expectedBook", "expected_book"),
        ev: n(o, "supplyAdjustedEv", "supply_adjusted_ev", "ev", "expectedValue"),
        dealerPrice: bestOf(pick(o, "dealerPrice", "dealer_price"), Math.min),
        bid: bestOf(pick(o, "bestBid", "best_bid", "bid"), Math.max),
        ask: bestOf(pick(o, "bestAsk", "best_ask", "ask"), Math.min),
      },
    ];
  });
  const stateHeld = arr(pick(so, "held", "sealed"));
  const held = (stateHeld.length > 0 ? stateHeld : (model.packs?.held ?? [])).map((x, k): HeldPackView => {
    const o = rec(x);
    return {
      id: String(pick(o, "asset", "id") ?? k),
      ref: strOf(o.ref) ?? "?",
      name: strOf(o.name) ?? strOf(o.ref) ?? "pack",
      value: n(o, "value", "your_value", "ourValue"),
      action: strOf(pick(o, "action", "proposed", "plan")) ?? null,
      why: strOf(pick(o, "why", "reason")) ?? null,
    };
  });
  const intents = arr(pick(so, "intents")).map((i) => strOf(rec(i).summary) ?? textOf(i));
  return { types, held, intents, source: stateTypes.length > 0 || stateHeld.length > 0 ? "state" : "catalog" };
}
