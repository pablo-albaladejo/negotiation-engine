import { z } from "zod";

/**
 * Pure core of `/api/bazaar/board`: from the raw Bazaar responses (GET), our local traces and the
 * verdict cache it builds ONE list of all our conversations (dealer threads, duels, deals and
 * offers between teams) with value, surplus, verdict and score deltas already computed. No I/O:
 * `bazaar-board.ts` makes the calls and persists the cache. Message text is copied verbatim (it may
 * carry injection): it is never interpreted here.
 */

export const OUR_TEAM_FALLBACK = "t02";
/** A deal settled ≤ this many ticks ago is valued "on the spot" (`/api/me/value` if we sold). */
export const FRESH_TICKS = 3;

const num = z.number();
const str = z.string();

const AssetRefSchema = z.looseObject({ id: num.nullish(), ref: str.nullish(), name: str.nullish(), kind: str.nullish() });
const SideSchema = z.looseObject({ cash: num.nullish(), assets: z.array(z.unknown()).nullish(), types: z.array(z.unknown()).nullish() });
const OfferSchema = z.looseObject({
  id: num,
  maker: str.nullish(),
  to: str.nullish(),
  venue: str.nullish(),
  thread: num.nullish(),
  status: str.nullish(),
  give: SideSchema.nullish(),
  want: SideSchema.nullish(),
  final: z.boolean().nullish(),
  expires_tick: num.nullish(),
  created_tick: num.nullish(),
});
type RawOffer = z.infer<typeof OfferSchema>;
type RawSide = z.infer<typeof SideSchema>;

const MessageSchema = z.looseObject({ id: z.union([num, str]).nullish(), tick: num.nullish(), sender: str.nullish(), text: str.nullish(), price: num.nullish(), offer: z.unknown().optional() });
export const BoardThreadSchema = z.looseObject({
  id: num,
  kind: str.nullish(),
  team: str.nullish(),
  with: str.nullish(),
  venue: str.nullish(),
  topic: z.unknown().optional(),
  status: str.nullish(),
  closed_reason: str.nullish(),
  created_tick: num.nullish(),
  item: str.nullish(),
  messages: z.array(MessageSchema).nullish(),
  standing_offers: z.array(z.unknown()).nullish(),
});
export type BoardThread = z.infer<typeof BoardThreadSchema>;

const DuelOfferSchema = z.looseObject({ id: num.nullish(), price: num.nullish(), tick: num.nullish(), days: num.nullish() });
export const BoardDuelSchema = z.looseObject({
  duel: num,
  status: str.nullish(),
  role: str.nullish(),
  item: str.nullish(),
  your_limit: num.nullish(),
  limit_meaning: str.nullish(),
  rival: str.nullish(),
  deadline_tick: num.nullish(),
  rounds: num.nullish(),
  session: num.nullish(),
  days: num.nullish(),
  issues: z.array(str).nullish(),
  decay_per_round: num.nullish(),
  your_offer: DuelOfferSchema.nullish(),
  rival_offer: DuelOfferSchema.nullish(),
  messages: z.array(z.looseObject({ tick: num.nullish(), from: str.nullish(), text: str.nullish(), price: num.nullish() })).nullish(),
  result: num.nullish(),
  price: num.nullish(),
});
export type BoardDuel = z.infer<typeof BoardDuelSchema>;

const SettlementItemSchema = z.looseObject({ id: num.nullish(), kind: str.nullish(), ref: str.nullish(), name: str.nullish(), frm: str.nullish(), to: str.nullish() });
export const SettlementSchema = z.looseObject({
  settlement: num,
  tick: num.nullish(),
  kind: str.nullish(),
  parties: z.array(str).nullish(),
  venue: str.nullish(),
  persona: str.nullish(),
  fee: num.nullish(),
  items: z.array(SettlementItemSchema).nullish(),
  price: num.nullish(),
});
export type Settlement = z.infer<typeof SettlementSchema>;

export const FeedEventSchema = z.looseObject({ id: num, tick: num.nullish(), type: str.nullish(), actor: str.nullish(), payload: z.unknown().optional() });
export type FeedEvent = z.infer<typeof FeedEventSchema>;

const HeldAssetSchema = z.looseObject({ id: num, ref: str, kind: str.nullish(), name: str.nullish(), your_value: num.nullish() });
export const BoardMeSchema = z.looseObject({
  id: str.nullish(),
  name: str.nullish(),
  cash: num.nullish(),
  level: num.nullish(),
  assets: z.array(HeldAssetSchema).nullish(),
  score: z.looseObject({}).nullish(),
  venue: z.looseObject({ venue: str.nullish(), name: str.nullish(), status: str.nullish(), trades: num.nullish(), volume: num.nullish(), fees: num.nullish(), traders: num.nullish() }).nullish(),
});
export type BoardMe = z.infer<typeof BoardMeSchema>;

export const BoardClockSchema = z.looseObject({ tick: num, next_tick_in: num.nullish(), tick_seconds: num.nullish(), round: num.nullish(), round_name: str.nullish(), doors: str.nullish(), today_name: str.nullish() });
export type BoardClock = z.infer<typeof BoardClockSchema>;

export const LeaderboardSchema = z.looseObject({
  teams: z
    .array(
      z.looseObject({
        team: str,
        name: str.nullish(),
        score: num.nullish(),
        rank: num.nullish(),
        negotiating: num.nullish(),
        market: num.nullish(),
        level: num.nullish(),
        album_filled: num.nullish(),
        album_slots: num.nullish(),
        pages_complete: num.nullish(),
        deals: num.nullish(),
      }),
    )
    .nullish(),
});

/** One line of `decisions.jsonl` / `thread-<id>.jsonl` (our trace; tolerant). */
export const DecisionSchema = z.looseObject({
  ts: str.optional(),
  tick: num.optional(),
  thread: num.optional(),
  dealer: str.optional(),
  action: str.optional(),
  rule: str.optional(),
  reservation: num.optional(),
  effectiveReservation: num.optional(),
  ourPrice: num.optional(),
  herPrice: num.optional(),
  herFinal: z.boolean().optional(),
  status: str.optional(),
  dryRun: z.boolean().optional(),
  summary: z.looseObject({ received: z.array(str).optional(), cards: z.array(str).optional(), ourValue: num.optional() }).optional(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const ScoreLineSchema = z.looseObject({
  tick: num.optional(),
  delta: z.record(str, num).optional(),
  cause: z.array(z.looseObject({ thread: num.optional(), duel: num.optional() })).optional(),
});
export type ScoreLine = z.infer<typeof ScoreLineSchema>;

/** `docs/bazaar/lessons.json` → `conversations[]`: only `thread` + `our_value` (the value we logged). */
export const LessonSchema = z.looseObject({ thread: num.optional(), kind: str.optional(), our_value: num.nullish() });
export type Lesson = z.infer<typeof LessonSchema>;

export type ValueSource = "held" | "api-value" | "trace" | "lessons" | "duel-limit" | "not logged";

export interface CachedValue {
  value: number;
  source: ValueSource;
  refs: string[];
  tick: number | null;
}

export interface VerdictCache {
  schema: "bazaar-verdicts/v1";
  updated: string | null;
  values: Record<string, CachedValue>;
  settlements: Record<string, Settlement>;
}

export const emptyCache = (): VerdictCache => ({ schema: "bazaar-verdicts/v1", updated: null, values: {}, settlements: {} });

const VerdictCacheSchema = z.looseObject({
  values: z.record(str, z.looseObject({ value: num, source: str, refs: z.array(str).default([]), tick: num.nullable().default(null) })).default({}),
  settlements: z.record(str, SettlementSchema).default({}),
});

export function parseCache(raw: unknown): VerdictCache {
  const parsed = VerdictCacheSchema.safeParse(raw);
  if (!parsed.success) return emptyCache();
  const values: Record<string, CachedValue> = {};
  for (const [k, v] of Object.entries(parsed.data.values)) values[k] = { value: v.value, source: v.source as ValueSource, refs: v.refs, tick: v.tick };
  return { schema: "bazaar-verdicts/v1", updated: null, values, settlements: parsed.data.settlements };
}

// ---------------------------------------------------------------- output

export type RowKind = "dealer-buy" | "dealer-sell" | "dealer" | "duel-buyer" | "duel-seller" | "team-trade" | "team-offer" | "other-trade";
export type Verdict = "good" | "bad" | "neutral" | "open" | "no deal" | "not logged";

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
  kind: RowKind;
  counterparty: string;
  /** Teams/dealers in the deal (filled only for other parties' trades, to filter by team). */
  parties: string[];
  item: string;
  status: string;
  closed_reason: string | null;
  price: number | null;
  our_value: number | null;
  value_source: ValueSource | null;
  surplus: number | null;
  verdict: Verdict;
  d_neg_points: number | null;
  d_ladder_points: number | null;
  d_score: number | null;
  /** Settlement that closed this deal (thread or book fill), to join `score-audit.jsonl`. */
  settlement: number | null;
  /** Δ of each score part on the tick this deal settled (`score-audit.jsonl` → parts / neg_points). */
  d_parts: Record<string, number> | null;
  /** Our deals that settled on that same tick: the Δ is theirs together when > 1. */
  d_shared: number;
  /** The ladder Δ came on a later tick with no deal of ours (it lands a few ticks after the settlement): not exact. */
  d_lagged: boolean;
  /** Duel only: its points line was rebuilt afterwards (`backfill` in duel-points.jsonl). */
  d_backfill?: boolean;
  duel_result: number | null;
  /** Duel only: the game's duel number, its session (1 = Duels I, 2 = II, 3 = III, 4 = Grand Final), the agreed delivery days and the decay per round (absent elsewhere). */
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

export interface BoardInput {
  team: string;
  nowTick: number | null;
  me: BoardMe | null;
  threads: BoardThread[];
  duels: BoardDuel[];
  myOffers: RawOffer[];
  settlements: Settlement[];
  decisions: Decision[];
  scoreLines: ScoreLine[];
  /** `score-audit.jsonl` lines (optional: absent before bazaar:play ran live). */
  audit?: ScoreAuditLine[];
  /** `duel-points.jsonl` lines (written by the duels session from Duels III on; absent before). */
  duelPoints?: DuelPointsLine[];
  lessons: Lesson[];
  cache: VerdictCache;
  /** `/api/me/value?card=REF` already queried this cycle (only for just-settled sales). */
  apiValues: ReadonlyMap<string, number>;
}

export function parseList<S extends z.ZodType>(schema: S, raw: unknown): z.infer<S>[] {
  if (!Array.isArray(raw)) return [];
  const out: z.infer<S>[] = [];
  for (const item of raw) {
    const p = schema.safeParse(item);
    if (p.success) out.push(p.data);
  }
  return out;
}

export const parseOffers = (raw: unknown): RawOffer[] => parseList(OfferSchema, raw);

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function verdictOf(surplus: number | null): Verdict {
  if (surplus === null) return "not logged";
  if (surplus >= 1) return "good";
  if (surplus <= -1) return "bad";
  return "neutral";
}

/** Surplus from our side: buy = value − price; sell = price − value. */
export function surplusOf(side: "buy" | "sell", price: number | null, value: number | null): number | null {
  if (price === null || value === null) return null;
  return round2(side === "buy" ? value - price : price - value);
}

interface AssetRef {
  id: number | null;
  ref: string;
  name: string | null;
}

function sideAssets(side: RawSide | null | undefined): AssetRef[] {
  if (!side) return [];
  const out: AssetRef[] = [];
  for (const a of side.assets ?? []) {
    const p = AssetRefSchema.safeParse(a);
    if (p.success && p.data.ref) out.push({ id: p.data.id ?? null, ref: p.data.ref, name: p.data.name ?? null });
  }
  for (const t of side.types ?? []) {
    if (typeof t !== "string") continue;
    const i = t.indexOf(":");
    out.push({ id: null, ref: i === -1 ? t : t.slice(i + 1), name: null });
  }
  return out;
}

export function sideLabel(side: RawSide | null | undefined): string {
  const parts: string[] = [];
  const cash = side?.cash ?? 0;
  if (cash) parts.push(`${cash} P`);
  for (const a of sideAssets(side)) parts.push(a.ref);
  return parts.length ? parts.join(" + ") : "nothing";
}

/** Side we give / receive in an offer (depending on who made it). */
function ourSides(o: RawOffer, team: string): { give: RawSide | null; get: RawSide | null } {
  const weMade = o.maker === team;
  return { give: (weMade ? o.give : o.want) ?? null, get: (weMade ? o.want : o.give) ?? null };
}

function offerOut(o: RawOffer, tick: number | null): BoardOffer {
  return { id: o.id, tick: o.created_tick ?? tick, maker: o.maker ?? "?", give: sideLabel(o.give), want: sideLabel(o.want), final: o.final ?? false, status: o.status ?? "open" };
}

function topicSide(topic: unknown): "buy" | "sell" | null {
  if (topic && typeof topic === "object") {
    if ("buy" in topic) return "buy";
    if ("sell" in topic) return "sell";
  }
  return null;
}

function topicLabel(topic: unknown): string | null {
  if (!topic || typeof topic !== "object") return null;
  const t = topic as { buy?: Record<string, unknown> };
  if (t.buy) {
    if (typeof t.buy.card === "string") return t.buy.card;
    if (typeof t.buy.pack === "string") return t.buy.pack;
    if (typeof t.buy.rarity === "string") return `${t.buy.rarity} ${typeof t.buy.set === "string" ? t.buy.set : ""}`.trim();
  }
  return null;
}

/** Deltas from `score.jsonl` caused by this thread/duel (summed; `null` if it never appeared). */
export function scoreDeltas(lines: readonly ScoreLine[], match: { thread?: number; duel?: number }): { neg: number | null; ladder: number | null; score: number | null } {
  let found = false;
  let neg = 0;
  let ladder = 0;
  let score = 0;
  for (const l of lines) {
    const hit = (l.cause ?? []).some((c) => (match.thread !== undefined && c.thread === match.thread) || (match.duel !== undefined && c.duel === match.duel));
    if (!hit || !l.delta) continue;
    found = true;
    neg += l.delta.neg_points ?? 0;
    ladder += l.delta.ladder_points ?? 0;
    score += l.delta.score ?? 0;
  }
  return found ? { neg: round2(neg), ladder: Math.round(ladder * 1000) / 1000, score: round2(score) } : { neg: null, ladder: null, score: null };
}

function scoreTick(lines: readonly ScoreLine[], thread: number): number | null {
  for (const l of lines) if ((l.cause ?? []).some((c) => c.thread === thread) && typeof l.tick === "number") return l.tick;
  return null;
}

function decisionsFor(decisions: readonly Decision[], thread: number): BoardDecision[] {
  const seen = new Set<string>();
  const out: BoardDecision[] = [];
  for (const d of decisions) {
    if (d.thread !== thread || d.dryRun) continue;
    const key = `${d.ts ?? ""}|${d.action ?? ""}|${d.tick ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ tick: d.tick ?? null, action: d.action ?? "?", rule: d.rule ?? null, reservation: d.effectiveReservation ?? d.reservation ?? null, ourPrice: d.ourPrice ?? null, herPrice: d.herPrice ?? null });
  }
  return out;
}

interface Valuation {
  value: number | null;
  source: ValueSource;
}

interface DealToValue {
  rowId: string;
  side: "buy" | "sell";
  assets: AssetRef[];
  tickSettled: number | null;
  thread?: number;
  settlement?: number | null;
}

/** Value of what we actually received (buy) or handed over (sell), in this order: cache →
 * just-settled sale (`/api/me/value`) → purchase whose card is still in our hands (value
 * now, `your_value` of that asset in `/api/me`) → our trace (`summary.ourValue`, only if the
 * summary names that same card) → lessons (sales only) → "not logged". */
export function valueDeal(deal: DealToValue, input: BoardInput): Valuation {
  const cached = input.cache.values[deal.rowId];
  if (cached) return { value: cached.value, source: cached.source };
  const cards = deal.assets;
  if (cards.length === 0) return { value: null, source: "not logged" };
  const fresh = deal.tickSettled !== null && input.nowTick !== null && input.nowTick - deal.tickSettled <= FRESH_TICKS;
  if (deal.side === "sell" && fresh && cards.every((c) => c.ref)) {
    const vals = cards.map((c) => input.apiValues.get(c.ref));
    if (vals.every((v): v is number => v !== undefined)) return { value: round2(vals.reduce((a, b) => a + b, 0)), source: "api-value" };
  }
  if (deal.side === "buy") {
    const held = input.me?.assets ?? [];
    const heldVals = cards.map((c) => (c.id !== null ? held.find((h) => h.id === c.id) : held.find((h) => h.ref === c.ref))?.your_value ?? undefined);
    if (heldVals.every((v): v is number => v !== undefined)) return { value: round2(heldVals.reduce((a, b) => a + b, 0)), source: "held" };
  }
  if (deal.thread !== undefined) {
    const summary = [...input.decisions].reverse().find((d) => d.thread === deal.thread && d.summary?.ourValue !== undefined)?.summary;
    const named = summary?.received ?? summary?.cards ?? [];
    if (summary?.ourValue !== undefined && cards.length === 1 && named.includes(cards[0]!.ref)) return { value: summary.ourValue, source: "trace" };
    if (deal.side === "sell") {
      const lesson = input.lessons.find((l) => l.thread === deal.thread && typeof l.our_value === "number");
      if (lesson && typeof lesson.our_value === "number") return { value: lesson.our_value, source: "lessons" };
    }
  }
  return { value: null, source: "not logged" };
}

/** Settled offer of a thread (the last one with `status: "settled"`), with its tick. */
function settledOfferOf(t: BoardThread): { offer: RawOffer; tick: number | null } | null {
  let found: { offer: RawOffer; tick: number | null } | null = null;
  const isSettled = (s: string | null | undefined) => s === "settled" || s === "accepted";
  for (const m of t.messages ?? []) {
    const p = OfferSchema.safeParse(m.offer);
    if (p.success && isSettled(p.data.status)) found = { offer: p.data, tick: m.tick ?? null };
  }
  for (const raw of t.standing_offers ?? []) {
    const p = OfferSchema.safeParse(raw);
    if (p.success && isSettled(p.data.status)) found = { offer: p.data, tick: p.data.created_tick ?? null };
  }
  return found;
}

function lastTick(t: BoardThread): number | null {
  let last: number | null = null;
  for (const m of t.messages ?? []) if (typeof m.tick === "number" && (last === null || m.tick > last)) last = m.tick;
  return last;
}

/** Feed settlement for a thread: same counterparty, some card (ref or id) in common and same price. */
function matchSettlement(settlements: readonly Settlement[], counterparty: string, assets: readonly AssetRef[], price: number | null, minTick: number | null): Settlement | null {
  return (
    settlements.find(
      (s) =>
        (s.persona === counterparty || (s.parties ?? []).includes(counterparty)) &&
        (price === null || s.price === price) &&
        (minTick === null || (s.tick ?? 0) >= minTick) &&
        (s.items ?? []).some((i) => assets.some((a) => (a.ref && i.ref === a.ref) || (a.id !== null && i.id === a.id))),
    ) ?? null
  );
}

export interface ValueRequest {
  rowId: string;
  ref: string;
}

interface Built {
  row: BoardRow;
  deal: DealToValue | null;
}

const blankRow = (): Omit<BoardRow, "id" | "kind" | "counterparty" | "item" | "status"> => ({
  parties: [],
  closed_reason: null,
  price: null,
  our_value: null,
  value_source: null,
  surplus: null,
  verdict: "not logged",
  d_neg_points: null,
  d_ladder_points: null,
  d_score: null,
  settlement: null,
  d_parts: null,
  d_shared: 0,
  d_lagged: false,
  duel_result: null,
  tick_opened: null,
  tick_settled: null,
  messages: [],
  offers: [],
  decisions: [],
});

function threadRow(t: BoardThread, input: BoardInput, consumed: Set<number>): Built {
  const team = input.team;
  const counterparty = (t.team && t.team !== team ? t.team : t.with) ?? "?";
  const isDealer = (t.kind ?? "persona") === "persona";
  const side = topicSide(t.topic);
  const kind: RowKind = isDealer ? (side === "buy" ? "dealer-buy" : side === "sell" ? "dealer-sell" : "dealer") : "team-trade";
  const messages: BoardMessage[] = [];
  const offers: BoardOffer[] = [];
  for (const m of t.messages ?? []) {
    const p = OfferSchema.safeParse(m.offer);
    const offer = p.success ? p.data : null;
    let price = m.price ?? null;
    if (price === null && offer) {
      const s = ourSides(offer, team);
      price = (s.give?.cash || s.get?.cash) ?? null;
      if (price === 0) price = null;
    }
    messages.push({ sender: m.sender ?? "?", us: m.sender === team, tick: m.tick ?? null, price, text: m.text ?? "" });
    if (offer) offers.push(offerOut(offer, m.tick ?? null));
  }
  for (const raw of t.standing_offers ?? []) {
    const p = OfferSchema.safeParse(raw);
    if (p.success && !offers.some((o) => o.id === p.data.id)) offers.push(offerOut(p.data, null));
  }
  const settled = settledOfferOf(t);
  const status = t.status ?? "open";
  let price: number | null = null;
  let deal: DealToValue | null = null;
  let tickSettled: number | null = null;
  let item = t.item ?? topicLabel(t.topic) ?? "—";
  if (settled) {
    const s = ourSides(settled.offer, team);
    const dealSide = side ?? ((s.give?.cash ?? 0) > 0 ? "buy" : "sell");
    const assets = dealSide === "buy" ? sideAssets(s.get) : sideAssets(s.give);
    price = (dealSide === "buy" ? s.give?.cash : s.get?.cash) ?? null;
    if (dealSide === "sell" && assets.length === 0 && side === "sell") {
      const ids = ((t.topic as { sell?: { assets?: unknown[] } }).sell?.assets ?? []).filter((x): x is number => typeof x === "number");
      for (const id of ids) assets.push({ id, ref: "", name: null });
    }
    const match = matchSettlement(input.settlements, counterparty, assets, price, t.created_tick ?? null);
    if (match) {
      consumed.add(match.settlement);
      for (const a of assets) {
        const it = (match.items ?? []).find((i) => (a.ref && i.ref === a.ref) || (a.id !== null && i.id === a.id));
        if (a.id === null) a.id = it?.id ?? null;
        if (!a.ref) a.ref = it?.ref ?? "";
      }
    }
    tickSettled = match?.tick ?? scoreTick(input.scoreLines, t.id) ?? (status === "deal" ? lastTick(t) : settled.tick);
    const refs = assets.map((a) => a.ref).filter(Boolean);
    if (refs.length) item = t.item ? `${t.item} (${refs.join(" + ")})` : refs.join(" + ");
    deal = { rowId: `thread:${t.id}`, side: dealSide, assets, tickSettled, thread: t.id, settlement: match?.settlement ?? null };
  }
  const d = scoreDeltas(input.scoreLines, { thread: t.id });
  const row: BoardRow = {
    ...blankRow(),
    id: `thread:${t.id}`,
    kind,
    counterparty,
    item,
    status,
    closed_reason: t.closed_reason ?? null,
    price,
    verdict: status === "open" ? "open" : "no deal",
    d_neg_points: d.neg,
    d_ladder_points: d.ladder,
    d_score: d.score,
    tick_opened: t.created_tick ?? t.messages?.[0]?.tick ?? null,
    tick_settled: tickSettled,
    messages,
    offers,
    decisions: decisionsFor(input.decisions, t.id),
  };
  return { row, deal };
}

function duelRow(d: BoardDuel, input: BoardInput): BoardRow {
  const role = d.role === "buyer" ? "buyer" : "seller";
  const status = d.status ?? "live";
  const price = d.price ?? null;
  const limit = d.your_limit ?? null;
  const isDeal = status === "deal" && price !== null;
  const surplus = isDeal && limit !== null ? round2(role === "buyer" ? limit - price : price - limit) : null;
  const msgs = d.messages ?? [];
  const ticks = msgs.map((m) => m.tick).filter((t): t is number => typeof t === "number");
  const item = d.item ?? "item";
  const sides = (p: number) => (role === "buyer" ? { ours: { give: `${p} P`, want: item }, theirs: { give: item, want: `${p} P` } } : { ours: { give: item, want: `${p} P` }, theirs: { give: `${p} P`, want: item } });
  const offers: BoardOffer[] = [];
  if (typeof d.your_offer?.price === "number") offers.push({ id: d.your_offer.id ?? null, tick: d.your_offer.tick ?? null, maker: input.team, ...sides(d.your_offer.price).ours, final: false, status: "latest" });
  if (typeof d.rival_offer?.price === "number") offers.push({ id: d.rival_offer.id ?? null, tick: d.rival_offer.tick ?? null, maker: d.rival ?? "rival", ...sides(d.rival_offer.price).theirs, final: false, status: "latest" });
  const deltas = scoreDeltas(input.scoreLines, { duel: d.duel });
  const open = status === "live" || status === "open";
  return {
    ...blankRow(),
    id: `duel:${d.duel}`,
    kind: role === "buyer" ? "duel-buyer" : "duel-seller",
    counterparty: d.rival ?? "?",
    item: d.item ?? "—",
    status,
    price,
    our_value: limit,
    value_source: limit !== null ? "duel-limit" : null,
    surplus,
    verdict: isDeal ? verdictOf(surplus) : open ? "open" : "no deal",
    d_neg_points: deltas.neg,
    d_ladder_points: deltas.ladder,
    d_score: deltas.score,
    duel_result: d.result ?? null,
    duel: { no: d.duel, session: d.session ?? null, days: d.days ?? null, issues: d.issues ?? [], decay: d.decay_per_round ?? null, deadline: d.deadline_tick ?? null },
    tick_opened: ticks.length ? Math.min(...ticks) : null,
    tick_settled: open ? null : ticks.length ? Math.max(...ticks) : (d.deadline_tick ?? null),
    messages: msgs.map((m) => ({ sender: m.from === "you" ? input.team : (m.from ?? "?"), us: m.from === "you", tick: m.tick ?? null, price: m.price ?? null, text: m.text ?? "" })),
    offers,
  };
}

function settlementRow(s: Settlement, team: string): Built {
  const items = s.items ?? [];
  const received = items.filter((i) => i.to === team);
  const given = items.filter((i) => i.frm === team);
  const side: "buy" | "sell" = received.length > 0 && received.length >= given.length ? "buy" : "sell";
  const moved = side === "buy" ? received : given;
  const other = (s.parties ?? []).find((p) => p !== team) ?? "?";
  const assets: AssetRef[] = moved.filter((i) => i.ref).map((i) => ({ id: i.id ?? null, ref: i.ref ?? "", name: i.name ?? null }));
  const row: BoardRow = {
    ...blankRow(),
    id: `settlement:${s.settlement}`,
    kind: "team-trade",
    counterparty: s.venue ? `${other} @ ${s.venue}` : other,
    item: moved.map((i) => i.name ?? i.ref ?? "?").join(" + ") || "—",
    status: side === "buy" ? "bought" : "sold",
    price: s.price ?? null,
    tick_settled: s.tick ?? null,
    settlement: s.settlement,
  };
  return { row, deal: { rowId: row.id, side, assets, tickSettled: s.tick ?? null } };
}

function offerRow(o: RawOffer, input: BoardInput): BoardRow {
  const team = input.team;
  const weMade = o.maker === team;
  const s = ourSides(o, team);
  const gives = sideAssets(s.give);
  const gets = sideAssets(s.get);
  const counterparty = weMade ? (o.to ?? `${o.venue ?? "venue"} (public)`) : (o.maker ?? "?");
  const price = (gives.length ? s.get?.cash : s.give?.cash) ?? null;
  const held = input.me?.assets ?? [];
  const first = gives[0];
  const giveValue = gives.length === 1 && first && first.id !== null ? (held.find((h) => h.id === first.id)?.your_value ?? null) : null;
  return {
    ...blankRow(),
    id: `offer:${o.id}`,
    kind: "team-offer",
    counterparty,
    item: [...gives, ...gets].map((a) => a.ref).join(" + ") || "—",
    status: o.status ?? "open",
    price,
    our_value: giveValue,
    value_source: giveValue !== null ? "held" : null,
    verdict: (o.status ?? "open") === "open" ? "open" : "no deal",
    tick_opened: o.created_tick ?? null,
    offers: [offerOut(o, null)],
  };
}

function assemble(input: BoardInput): { rows: BoardRow[]; deals: DealToValue[] } {
  const rows: BoardRow[] = [];
  const deals: DealToValue[] = [];
  const consumed = new Set<number>();
  for (const t of input.threads) {
    const b = threadRow(t, input, consumed);
    rows.push(b.row);
    if (b.deal) deals.push(b.deal);
  }
  for (const d of input.duels) rows.push(duelRow(d, input));
  for (const s of input.settlements) {
    if (consumed.has(s.settlement) || !(s.parties ?? []).includes(input.team)) continue;
    if (s.persona && !s.venue) continue; // dealer deal: covered by its thread
    const b = settlementRow(s, input.team);
    rows.push(b.row);
    if (b.deal) deals.push(b.deal);
  }
  for (const o of input.myOffers) rows.push(offerRow(o, input));
  return { rows, deals };
}

/** Which refs must be valued with `/api/me/value` this cycle: just-settled sales not in the cache. */
export function pendingValueRequests(input: BoardInput): ValueRequest[] {
  const { deals } = assemble(input);
  const out: ValueRequest[] = [];
  for (const deal of deals) {
    if (deal.side !== "sell" || input.cache.values[deal.rowId]) continue;
    if (deal.tickSettled === null || input.nowTick === null || input.nowTick - deal.tickSettled > FRESH_TICKS) continue;
    for (const a of deal.assets) if (a.ref && !input.apiValues.has(a.ref)) out.push({ rowId: deal.rowId, ref: a.ref });
  }
  return out;
}

/** Unified list + new cache entries (`newValues`: only those resolved now). */
export function buildRows(input: BoardInput): { rows: BoardRow[]; newValues: Record<string, CachedValue> } {
  const { rows, deals } = assemble(input);
  const newValues: Record<string, CachedValue> = {};
  for (const deal of deals) {
    const row = rows.find((r) => r.id === deal.rowId);
    if (!row) continue;
    const v = valueDeal(deal, input);
    row.our_value = v.value;
    row.value_source = v.source;
    row.surplus = surplusOf(deal.side, row.price, v.value);
    row.verdict = verdictOf(row.surplus);
    if (v.value !== null && !input.cache.values[deal.rowId]) newValues[deal.rowId] = { value: v.value, source: v.source, refs: deal.assets.map((a) => a.ref).filter(Boolean), tick: deal.tickSettled };
  }
  for (const deal of deals) {
    const row = rows.find((r) => r.id === deal.rowId);
    if (row && deal.settlement != null) row.settlement = deal.settlement;
  }
  applyScoreAudit(rows, input.audit ?? []);
  applyDuelPoints(rows, input.duelPoints ?? []);
  const key = (r: BoardRow) => r.tick_opened ?? r.tick_settled ?? -1;
  rows.sort((a, b) => key(b) - key(a));
  return { rows, newValues };
}

/** One line of `score-audit.jsonl` (written by `bazaar:play` live): the Δ of a tick and our deals in it. */
export const ScoreAuditSchema = z.looseObject({
  tick: num,
  delta: num.optional(),
  parts: z.record(str, num).optional(),
  deals: z.array(z.looseObject({ settlement: num })).optional(),
});
export type ScoreAuditLine = z.infer<typeof ScoreAuditSchema>;

/**
 * Puts each tick's score Δ on the deals that settled in it. Older lines carry only the neg_points Δ (`delta`); newer
 * ones every part (`parts`). With two deals in one tick the Δ is shared (`d_shared`), never split by guess.
 */
/** Ticks after a dealer settlement in which a ladder-only Δ is still given to it. */
export const LADDER_LAG = 6;

export function applyScoreAudit(rows: BoardRow[], audit: readonly ScoreAuditLine[]): void {
  const bySettlement = new Map<number, BoardRow>();
  for (const r of rows) if (r.settlement !== null) bySettlement.set(r.settlement, r);
  for (const a of audit) {
    const deals = a.deals ?? [];
    if (!deals.length) {
      const ladder = a.parts?.ladder_points;
      if (ladder === undefined) continue;
      // The ladder refreshes a few ticks after the settlement: give it to our latest dealer deal of the last LADDER_LAG ticks.
      const row = rows
        .filter((r) => r.kind.startsWith("dealer") && r.settlement !== null && r.tick_settled !== null && r.tick_settled <= a.tick && a.tick - r.tick_settled <= LADDER_LAG)
        .sort((x, y) => (y.tick_settled ?? 0) - (x.tick_settled ?? 0))[0];
      if (!row) continue;
      const parts = { ...(row.d_parts ?? { neg_points: 0 }) };
      parts.ladder_points = Math.round(((parts.ladder_points ?? 0) + ladder) * 1000) / 1000;
      row.d_parts = parts;
      row.d_ladder_points = parts.ladder_points;
      row.d_lagged = true;
      continue;
    }
    // `parts` only lists the parts that moved: a missing one is a measured 0.
    const parts: Record<string, number> = a.parts ? { neg_points: 0, ladder_points: 0, ...a.parts } : { neg_points: a.delta ?? 0 };
    for (const d of deals) {
      const row = bySettlement.get(d.settlement);
      if (!row) continue;
      row.d_parts = parts;
      row.d_shared = deals.length;
      row.d_neg_points = parts.neg_points ?? null;
      row.d_ladder_points = parts.ladder_points ?? row.d_ladder_points;
      if (parts.score !== undefined) row.d_score = parts.score;
    }
  }
}

/**
 * One line of `duel-points.jsonl`: the duel_points jump of the first tick we saw it, and the duels of ours that closed
 * then (the API gives no closing tick). With more than one duel the jump is theirs together (`d_shared`).
 */
export const DuelPointsSchema = z.looseObject({
  tick: num,
  delta: num,
  duels: z.array(num),
  backfill: z.boolean().optional(),
});
export type DuelPointsLine = z.infer<typeof DuelPointsSchema>;

/** Puts each duel_points jump on its duels; duels without a line (Duels I and II) stay not audited. */
export function applyDuelPoints(rows: BoardRow[], lines: readonly DuelPointsLine[]): void {
  const byDuel = new Map<number, BoardRow>();
  for (const r of rows) if (r.duel) byDuel.set(r.duel.no, r);
  for (const l of lines) {
    for (const id of l.duels) {
      const row = byDuel.get(id);
      if (!row) continue;
      row.d_parts = { duel_points: l.delta };
      row.d_shared = l.duels.length;
      row.d_score = null;
      if (l.backfill) row.d_backfill = true;
    }
  }
}

const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function headerOf(me: BoardMe | null, team: string): BoardHeader | null {
  if (!me) return null;
  const s = (me.score ?? {}) as Record<string, unknown>;
  return {
    team: me.name ?? team,
    score: numOrNull(s.score),
    negotiating: numOrNull(s.negotiating),
    neg_points: numOrNull(s.neg_points),
    ladder_points: numOrNull(s.ladder_points),
    market: numOrNull(s.market),
    duel_points: numOrNull(s.duel_points),
    rank: numOrNull(s.rank),
    cash: me.cash ?? null,
    level: me.level ?? null,
  };
}

/** Feed settlements that involve us (accumulated in the cache: the feed is short). */
/** Every settlement in the public feed (ours and other teams'). */
export function feedSettlements(events: readonly FeedEvent[]): Settlement[] {
  const out: Settlement[] = [];
  for (const e of events) {
    if (e.type !== "settlement") continue;
    const p = SettlementSchema.safeParse(e.payload);
    if (p.success) out.push(p.data);
  }
  return out;
}

/** One line of the recorder's public stream (`stream-public.jsonl`): the feed event sits under `data`. */
export const StreamLineSchema = z.looseObject({ event: str.nullish(), data: FeedEventSchema.nullish() });
export type StreamLine = z.infer<typeof StreamLineSchema>;

export function streamSettlements(lines: readonly StreamLine[]): Settlement[] {
  return feedSettlements(lines.flatMap((l) => (l.data ? [l.data] : [])));
}

/** A settlement between other parties (we are not in it): public structure only, no value or verdict. */
function otherTradeRow(s: Settlement): BoardRow {
  const items = s.items ?? [];
  const first = items[0];
  const seller = first?.frm ?? s.parties?.[0] ?? "?";
  const buyer = first?.to ?? s.parties?.find((p) => p !== seller) ?? "?";
  return {
    ...blankRow(),
    id: `settlement:${s.settlement}`,
    kind: "other-trade",
    counterparty: `${seller} → ${buyer}${s.venue ? ` @ ${s.venue}` : ""}`,
    parties: (s.parties ?? []).slice(),
    item: items.map((i) => i.name ?? i.ref ?? "?").join(" + ") || "—",
    status: s.kind === "match" ? "matched" : "settled",
    price: s.price ?? null,
    tick_settled: s.tick ?? null,
  };
}

/** Settlements of other parties, newest first. */
export function otherTradeRows(settlements: readonly Settlement[], team: string): BoardRow[] {
  return settlements
    .filter((s) => !(s.parties ?? []).includes(team))
    .map(otherTradeRow)
    .sort((a, b) => (b.tick_settled ?? -1) - (a.tick_settled ?? -1));
}

// ---------------------------------------------------------------- market

export interface FeedLine {
  id: number;
  tick: number | null;
  type: string;
  text: string;
}

export interface BookLine {
  id: number;
  maker: string;
  give: string;
  want: string;
  expires_tick: number | null;
}

export interface LeaderLine {
  rank: number | null;
  team: string;
  name: string;
  score: number | null;
  us: boolean;
  /** Public parts of the score and the album (`/api/leaderboard`, refreshed every 5 ticks). */
  negotiating: number | null;
  market: number | null;
  level: number | null;
  album_filled: number | null;
  album_slots: number | null;
  /** Complete pages: the ★ of the official leaderboard. */
  pages_complete: number | null;
  deals: number | null;
}

const s = (v: unknown, dflt = "?"): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : dflt);

/** Literal summary of a feed event (third-party text is copied as is, never interpreted). */
export function feedLine(e: FeedEvent): FeedLine {
  const p = (e.payload && typeof e.payload === "object" ? e.payload : {}) as Record<string, unknown>;
  const type = e.type ?? "event";
  let text = e.actor ?? "";
  if (type === "settlement") {
    const st = SettlementSchema.safeParse(p);
    if (st.success) {
      const items = (st.data.items ?? []).map((i) => `${i.name ?? i.ref ?? "?"} ${i.frm ?? "?"} → ${i.to ?? "?"}`).join(", ");
      text = `${items}${typeof st.data.price === "number" ? ` · ${st.data.price} P` : ""}${st.data.venue ? ` @ ${st.data.venue}` : ""}`;
    }
  } else if (type === "offer.listed") {
    const o = OfferSchema.safeParse(p.offer);
    if (o.success) text = `${o.data.maker ?? "?"} gives ${sideLabel(o.data.give)}, wants ${sideLabel(o.data.want)}`;
  } else if (type === "thread.message") {
    const sender = s(p.sender, e.actor ?? "?");
    const other = typeof p.with === "string" && p.with !== sender ? p.with : s(p.team);
    const o = OfferSchema.safeParse(p.offer);
    const body = typeof p.text === "string" ? p.text : o.success ? `offer: gives ${sideLabel(o.data.give)}, wants ${sideLabel(o.data.want)}` : "";
    text = `${sender} → ${other}: ${body}`;
  } else if (type === "duel.closed") {
    text = `duel ${s(p.duel)} ${s(p.status, "")} · ${s(p.item, "")}`;
  } else if (type === "thread.opened") {
    text = `${s(p.team)} ↔ ${s(p.with)}`;
  } else if (type === "admin.grant") {
    const packs = Array.isArray(p.packs) ? p.packs.filter((x): x is string => typeof x === "string") : [];
    const cash = typeof p.cash === "number" ? p.cash : 0;
    text = `GRANT (organisers, not a trade) to ${s(p.team)}: ${[...(cash ? [`+${cash} P`] : []), ...packs.map((x) => `pack ${x}`)].join(" + ") || "—"}${typeof p.reason === "string" ? ` · ${p.reason}` : ""}`;
  } else if (type === "pack.opened") {
    text = `${s(p.team)} opened ${s(p.pack, "a pack")}`;
  } else if (type === "offer.cancelled") {
    text = `offer ${s(p.offer)} cancelled`;
  }
  return { id: e.id, tick: e.tick ?? null, type, text };
}

/**
 * Book of a venue: the `max` most recent offers, and always ours (`keep`), even if
 * older; the Bazaar anonymises the author, so we only recognise them by id.
 */
export function bookLines(raw: unknown, max = 40, keep: ReadonlySet<number> = new Set()): BookLine[] {
  const offers = parseOffers(raw).sort((a, b) => b.id - a.id);
  const ours = offers.filter((o) => keep.has(o.id));
  const rest = offers.filter((o) => !keep.has(o.id)).slice(0, Math.max(0, max - ours.length));
  return [...ours, ...rest]
    .map((o) => ({ id: o.id, maker: o.maker ?? "?", give: sideLabel(o.give), want: sideLabel(o.want), expires_tick: o.expires_tick ?? null }));
}

export function leaderLines(raw: unknown, team: string): LeaderLine[] {
  const p = LeaderboardSchema.safeParse(raw);
  if (!p.success) return [];
  return (p.data.teams ?? []).map((t) => ({
    rank: t.rank ?? null,
    team: t.team,
    name: t.name ?? t.team,
    score: t.score ?? null,
    us: t.team === team,
    negotiating: t.negotiating ?? null,
    market: t.market ?? null,
    level: t.level ?? null,
    album_filled: t.album_filled ?? null,
    album_slots: t.album_slots ?? null,
    pages_complete: t.pages_complete ?? null,
    deals: t.deals ?? null,
  }));
}
