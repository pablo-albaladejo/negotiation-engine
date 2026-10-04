import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { hindsightOptimum, pairKey, type OptimalPair } from "./optimum.js";

/**
 * «Market test»: our bench sessions (the organisers' synthetic book every venue receives) in AUTO (v04) against BOARD
 * (v26, our broker matching live). Per session: the official result (`bench.started` / `bench.finished` on our team
 * stream: efficiency vs the auto baseline and matches), the book tick by tick (`<day>/bench.jsonl`: each synthetic
 * trader's quote and temper), our broker's matches (`<day>/broker.jsonl`, kind "match") and the auto shadow numbers
 * (`bench-sessions.json`). A «now» line comes from the live broker log. Files are re-read only when their size changes.
 * Read-only: nothing here posts.
 */

const num = z.number();
const str = z.string();

const StreamLineSchema = z.looseObject({
  data: z.looseObject({ tick: num.nullish(), t: num.nullish(), type: str.nullish(), payload: z.record(str, z.unknown()).nullish() }),
});
const BenchLineSchema = z.looseObject({
  tick: num,
  dryRun: z.boolean().nullish(),
  bench: z.array(z.looseObject({ id: str, side: str, quote: num, temper: str.nullish() })).nullish(),
});
const MatchSchema = z.looseObject({
  tick: num,
  kind: z.literal("match"),
  dryRun: z.boolean().nullish(),
  source: str.nullish(),
  sell: z.unknown().optional(),
  buy: z.unknown().optional(),
  price: num.nullish(),
  ask: num.nullish(),
  bid: num.nullish(),
  surplus: num.nullish(),
  estSurplus: num.nullish(),
  status: str.nullish(),
  error: str.nullish(),
});
const ShadowSchema = z.looseObject({
  benchAt: num.nullish(),
  hard: z.boolean().nullish(),
  firstTick: num.nullish(),
  lastTick: num.nullish(),
  shadowSurplus: num.nullish(),
  autoSurplus: num.nullish(),
  pairsShadow: num.nullish(),
  pairsAuto: num.nullish(),
  official: z.looseObject({ session: num.nullish() }).nullish(),
});

export interface TraderPoint {
  tick: number;
  quote: number;
  temper: string | null;
}

export interface Trader {
  id: string;
  side: "ask" | "bid";
  points: TraderPoint[];
}

export interface OurMatch {
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

/**
 * «What we did» against «the best possible given what was visible» (quote surplus = bid − ask from bench.jsonl, never
 * the official efficiency: the book has no private limits). Only board sessions are comparable: on auto the book is
 * recorded after auto already crossed, so crossed pairs never show up.
 */
export interface Hindsight {
  comparable: boolean;
  /** Why it is not comparable, or null. */
  note: string | null;
  /** False while the session runs (provisional, up to `through_tick`). */
  final: boolean;
  through_tick: number | null;
  /** Our live bench matches (status "sent", not dry-run): pairs and summed quote surplus. */
  ours: { pairs: number; surplus: number };
  optimum: { pairs: number; surplus: number };
  /** ours.surplus / optimum.surplus, only when comparable. */
  captured: number | null;
  pairs: OptimalPair[];
  /** Optimal pairs we did not make. */
  missed: OptimalPair[];
  /** Indexes into `our_matches` of our sent pairs that are not in the optimum. */
  suboptimal: number[];
}

export interface MarketSession {
  day: string;
  session: number;
  name: string | null;
  hard: boolean;
  start_tick: number;
  ticks: number;
  /** Game hour the session started (`t` of bench.started). */
  hour: number | null;
  /** Our venue in the official result, or null before it finishes. */
  venue: string | null;
  /** auto (v04), board (v26), or the venue id; before the result: board if the broker logged live book lines. */
  mode: string;
  efficiency: number | null;
  auto_baseline: number | null;
  delta: number | null;
  matches: number | null;
  finished: boolean;
  /** True when every logged book line was a shadow read (dry-run), false when the live broker was on, null without lines. */
  dry_run: boolean | null;
  shadow: { shadow_surplus: number | null; auto_surplus: number | null; pairs_shadow: number | null; pairs_auto: number | null } | null;
  /** Book and our matches: only for the last sessions (payload size). */
  traders: Trader[] | null;
  our_matches: OurMatch[] | null;
  hindsight: Hindsight | null;
}

export interface MarketTestOut {
  sessions: MarketSession[];
  /** Last line of the live broker log, parsed. */
  now: { tick: number | null; hour: number | null; bench: number | null; matched: number | null; line: string } | null;
}

const cache = new Map<string, { size: number; value: unknown }>();

/** Parsed content of a file, re-parsed only when its size changes. */
async function cached<T>(path: string, parse: (text: string) => T, fallback: T): Promise<T> {
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return fallback;
  }
  const hit = cache.get(path);
  if (hit && hit.size === size) return hit.value as T;
  const text = await readFile(path, "utf8").catch(() => null);
  if (text === null) return fallback;
  const value = parse(text);
  cache.set(path, { size, value });
  return value;
}

function jsonl<S extends z.ZodType>(text: string, schema: S, needle?: string): z.infer<S>[] {
  const out: z.infer<S>[] = [];
  for (const line of text.split("\n")) {
    if (!line || (needle && !line.includes(needle))) continue;
    try {
      const p = schema.safeParse(JSON.parse(line));
      if (p.success) out.push(p.data);
    } catch {
      // A torn last line while the writer appends: skipped.
    }
  }
  return out;
}

const strOf = (x: unknown): string | null => (typeof x === "string" ? x : typeof x === "number" ? String(x) : x && typeof x === "object" ? JSON.stringify(x) : null);
const nOf = (x: unknown): number | null => (typeof x === "number" && Number.isFinite(x) ? x : null);
const round3 = (x: number) => Math.round(x * 1000) / 1000;

function modeOf(venue: string | null, dryRun: boolean | null): string {
  if (venue === "v04") return "auto";
  if (venue === "v26") return "board";
  if (venue) return venue;
  return dryRun === false ? "board" : dryRun === true ? "auto" : "?";
}

/** Live broker log line: «tick N · h X · v26 open · bench K (R runs) · offers S sell / B buy · matched M (surplus Z) …». */
export function parseBrokerLine(line: string): MarketTestOut["now"] {
  if (!line.trim()) return null;
  const n = (re: RegExp) => {
    const m = re.exec(line);
    return m ? Number(m[1]) : null;
  };
  return { tick: n(/tick (\d+)/), hour: n(/h ([\d.]+)/), bench: n(/bench (\d+)/), matched: n(/matched (\d+)/), line: line.trim() };
}

function hindsightOf(s: MarketSession, book: z.infer<typeof BenchLineSchema>[], matches: z.infer<typeof MatchSchema>[]): Hindsight {
  const through = book.length ? Math.max(...book.map((b) => b.tick)) : null;
  const sent = matches.flatMap((m, i) => (m.status === "sent" && m.dryRun !== true ? [{ i, sell: strOf(m.sell), buy: strOf(m.buy), surplus: m.surplus ?? 0 }] : []));
  const ourKeys = new Set(sent.map((m) => pairKey(m.sell, m.buy)));
  const pairs = hindsightOptimum(book, through, ourKeys);
  const ours = { pairs: sent.length, surplus: round3(sent.reduce((a, m) => a + m.surplus, 0)) };
  const optimum = { pairs: pairs.length, surplus: round3(pairs.reduce((a, p) => a + p.surplus, 0)) };
  const comparable = s.mode === "board";
  const note = comparable ? null : s.mode === "auto" ? "not comparable (auto: book recorded after auto crossed)" : "not comparable (mechanism unknown)";
  const optKeys = new Set(pairs.map((p) => pairKey(p.ask_id, p.bid_id)));
  return {
    comparable,
    note,
    final: s.finished,
    through_tick: through,
    ours,
    optimum,
    captured: comparable && optimum.surplus > 0 ? round3(ours.surplus / optimum.surplus) : null,
    pairs,
    missed: pairs.filter((p) => !ourKeys.has(pairKey(p.ask_id, p.bid_id))),
    suboptimal: sent.filter((m) => !optKeys.has(pairKey(m.sell, m.buy))).map((m) => m.i),
  };
}

export async function marketTestOf(bazaarDir: string, logsDir: string, detailSessions = 8): Promise<MarketTestOut> {
  let days: string[];
  try {
    days = (await readdir(bazaarDir)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  } catch {
    days = [];
  }
  const shadows = await cached(join(bazaarDir, "bench-sessions.json"), (t) => {
    try {
      const raw: unknown = JSON.parse(t);
      return (Array.isArray(raw) ? raw : []).flatMap((x) => {
        const p = ShadowSchema.safeParse(x);
        return p.success ? [p.data] : [];
      });
    } catch {
      return [];
    }
  }, [] as z.infer<typeof ShadowSchema>[]);

  const sessions: (MarketSession & { _book: z.infer<typeof BenchLineSchema>[]; _matches: z.infer<typeof MatchSchema>[] })[] = [];
  // A long-running broker keeps writing to the day folder it was launched in, so the book and our matches are
  // pooled across days (ticks are global) and each session takes its window from the pool.
  const book: z.infer<typeof BenchLineSchema>[] = [];
  const matches: z.infer<typeof MatchSchema>[] = [];
  for (const day of days) {
    book.push(...(await cached(join(bazaarDir, day, "bench.jsonl"), (t) => jsonl(t, BenchLineSchema), [] as z.infer<typeof BenchLineSchema>[])));
    matches.push(...(await cached(join(bazaarDir, day, "broker.jsonl"), (t) => jsonl(t, MatchSchema, '"match"'), [] as z.infer<typeof MatchSchema>[])));
  }
  // With a live broker and a shadow both writing, the window keeps only the live lines.
  const preferLive = <T extends { dryRun?: boolean | null | undefined }>(lines: T[]): T[] =>
    lines.some((l) => l.dryRun === false) ? lines.filter((l) => l.dryRun === false) : lines;
  for (const day of days) {
    const events = await cached(join(bazaarDir, day, "stream-team.jsonl"), (t) => jsonl(t, StreamLineSchema, '"bench.'), [] as z.infer<typeof StreamLineSchema>[]);
    const started = new Map<number, MarketSession & { _book: z.infer<typeof BenchLineSchema>[]; _matches: z.infer<typeof MatchSchema>[] }>();
    for (const l of events) {
      const d = l.data;
      const p = d.payload ?? {};
      const session = nOf(p.session);
      if (session === null) continue;
      if (d.type === "bench.started" && !started.has(session)) {
        const start = nOf(p.start_tick) ?? d.tick ?? 0;
        const ticks = nOf(p.ticks) ?? 16;
        const name = strOf(p.name);
        const shadow = shadows.find((s) => s.official?.session === session || (s.firstTick != null && Math.abs(s.firstTick - start) <= 2));
        const inWindow = (tick: number) => tick >= start && tick <= start + ticks + 1;
        const lines = preferLive(book.filter((b) => inWindow(b.tick)));
        const dry = lines.length ? lines.every((b) => b.dryRun !== false) : null;
        started.set(session, {
          day,
          session,
          name,
          hard: /hard/i.test(name ?? "") || shadow?.hard === true,
          start_tick: start,
          ticks,
          hour: d.t ?? null,
          venue: null,
          mode: modeOf(null, dry),
          efficiency: null,
          auto_baseline: null,
          delta: null,
          matches: null,
          finished: false,
          dry_run: dry,
          shadow: shadow ? { shadow_surplus: shadow.shadowSurplus ?? null, auto_surplus: shadow.autoSurplus ?? null, pairs_shadow: shadow.pairsShadow ?? null, pairs_auto: shadow.pairsAuto ?? null } : null,
          traders: null,
          our_matches: null,
          hindsight: null,
          _book: lines,
          _matches: preferLive(matches.filter((m) => inWindow(m.tick))),
        });
      } else if (d.type === "bench.finished") {
        const s = started.get(session);
        if (!s) continue;
        const venue = strOf(p.venue);
        const eff = nOf(p.efficiency);
        const base = nOf(p.auto_baseline);
        Object.assign(s, { venue, mode: modeOf(venue, s.dry_run), efficiency: eff, auto_baseline: base, delta: eff !== null && base !== null ? round3(eff - base) : null, matches: nOf(p.matches), finished: true });
      }
    }
    sessions.push(...started.values());
  }
  sessions.sort((a, b) => a.day.localeCompare(b.day) || a.start_tick - b.start_tick);

  const detailFrom = Math.max(0, sessions.length - detailSessions);
  const out: MarketSession[] = sessions.map(({ _book, _matches, ...s }, i) => {
    if (i < detailFrom) return s;
    const traders = new Map<string, Trader>();
    for (const line of _book)
      for (const q of line.bench ?? []) {
        const t = traders.get(q.id) ?? { id: q.id, side: q.side === "bid" ? "bid" : "ask", points: [] };
        t.points.push({ tick: line.tick, quote: q.quote, temper: q.temper ?? null });
        traders.set(q.id, t);
      }
    const ours = _matches.map((m) => ({ tick: m.tick, source: m.source ?? null, sell: strOf(m.sell), buy: strOf(m.buy), price: m.price ?? null, ask: m.ask ?? null, bid: m.bid ?? null, surplus: m.surplus ?? m.estSurplus ?? null, status: m.status ?? (m.dryRun ? "dry-run" : null), error: m.error ?? null }));
    return { ...s, traders: [...traders.values()], our_matches: ours, hindsight: hindsightOf(s, _book, _matches) };
  });

  const log = await readFile(join(logsDir, "broker-live.log"), "utf8").catch(() => "");
  const last = log.trimEnd().split("\n").at(-1) ?? "";
  return { sessions: out, now: parseBrokerLine(last) };
}
