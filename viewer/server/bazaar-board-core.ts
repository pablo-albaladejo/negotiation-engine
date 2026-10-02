import { z } from "zod";

/**
 * Núcleo puro de `/api/bazaar/board`: a partir de las respuestas crudas del Bazaar (GET), nuestras
 * trazas locales y la caché de veredictos arma UNA lista de todas nuestras conversaciones (hilos
 * con dealers, duelos, tratos y ofertas entre equipos) con valor, excedente, veredicto y deltas de
 * la cifra ya calculados. Sin E/S: `bazaar-board.ts` hace las llamadas y persiste la caché. El texto
 * de los mensajes se copia literal (puede traer inyección): nunca se interpreta aquí.
 */

export const OUR_TEAM_FALLBACK = "t02";
/** Un trato liquidado hace ≤ este nº de ticks se valora "en el momento" (`/api/me/value` si vendimos). */
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

export const LeaderboardSchema = z.looseObject({ teams: z.array(z.looseObject({ team: str, name: str.nullish(), score: num.nullish(), rank: num.nullish() })).nullish() });

/** Una línea de `decisions.jsonl` / `thread-<id>.jsonl` (nuestra traza; tolerante). */
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

/** `docs/bazaar/lessons.json` → `conversations[]`: solo `thread` + `our_value` (valor que logueamos). */
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

// ---------------------------------------------------------------- salida

export type RowKind = "dealer-buy" | "dealer-sell" | "dealer" | "duel-buyer" | "duel-seller" | "team-trade" | "team-offer";
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
  lessons: Lesson[];
  cache: VerdictCache;
  /** `/api/me/value?card=REF` ya consultado en este ciclo (solo para ventas recién liquidadas). */
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

/** Excedente desde nuestro lado: compra = valor − precio; venta = precio − valor. */
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

/** Lado que damos / recibimos en una oferta (según quién la hizo). */
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

/** Deltas de `score.jsonl` cuya causa es este hilo/duelo (suma; `null` si nunca apareció). */
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
}

/** Valor de lo que de verdad recibimos (compra) o entregamos (venta), en este orden: caché →
 * venta recién liquidada (`/api/me/value`) → compra cuya carta sigue en nuestras manos (valor
 * ahora, `your_value` de ese asset en `/api/me`) → nuestra traza (`summary.ourValue`, solo si el
 * resumen nombra esa misma carta) → lecciones (solo ventas) → "not logged". */
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

/** Oferta liquidada de un hilo (la última con `status: "settled"`), con su tick. */
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

/** Liquidación del feed para un hilo: misma contraparte, alguna carta (ref o id) en común y mismo precio. */
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
  closed_reason: null,
  price: null,
  our_value: null,
  value_source: null,
  surplus: null,
  verdict: "not logged",
  d_neg_points: null,
  d_ladder_points: null,
  d_score: null,
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
    deal = { rowId: `thread:${t.id}`, side: dealSide, assets, tickSettled, thread: t.id };
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
    if (s.persona && !s.venue) continue; // trato con dealer: lo cubre su hilo
    const b = settlementRow(s, input.team);
    rows.push(b.row);
    if (b.deal) deals.push(b.deal);
  }
  for (const o of input.myOffers) rows.push(offerRow(o, input));
  return { rows, deals };
}

/** Qué refs hay que valorar con `/api/me/value` en este ciclo: ventas recién liquidadas sin caché. */
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

/** Lista unificada + entradas nuevas para la caché (`newValues`: solo las resueltas ahora). */
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
  const key = (r: BoardRow) => r.tick_opened ?? r.tick_settled ?? -1;
  rows.sort((a, b) => key(b) - key(a));
  return { rows, newValues };
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

/** Liquidaciones del feed que nos involucran (se acumulan en la caché: el feed es corto). */
export function ourSettlements(events: readonly FeedEvent[], team: string): Settlement[] {
  const out: Settlement[] = [];
  for (const e of events) {
    if (e.type !== "settlement") continue;
    const p = SettlementSchema.safeParse(e.payload);
    if (p.success && (p.data.parties ?? []).includes(team)) out.push(p.data);
  }
  return out;
}

// ---------------------------------------------------------------- mercado

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
}

const s = (v: unknown, dflt = "?"): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : dflt);

/** Resumen literal de un evento del feed (el texto de terceros se copia tal cual, nunca se interpreta). */
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
  } else if (type === "pack.opened") {
    text = `${s(p.team)} opened ${s(p.pack, "a pack")}`;
  } else if (type === "offer.cancelled") {
    text = `offer ${s(p.offer)} cancelled`;
  }
  return { id: e.id, tick: e.tick ?? null, type, text };
}

/**
 * Libro de un venue: las `max` ofertas más recientes, y siempre las nuestras (`keep`), aunque
 * sean más antiguas; el Bazaar anonimiza al autor, así que solo las reconocemos por id.
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
  return (p.data.teams ?? []).map((t) => ({ rank: t.rank ?? null, team: t.team, name: t.name ?? t.team, score: t.score ?? null, us: t.team === team }));
}
