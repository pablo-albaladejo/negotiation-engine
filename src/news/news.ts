import { z } from "zod";

// News from the Bazaar (Radio Rastro, the Bulletin, the notice board). For display and, through `signals.ts`, as a
// hint in GameState.news: nothing here produces a figure or a decision, and no trading route may import this folder.

const num = z.coerce.number();

/** One news item as `GET /api/news` returns it (tolerant: any source string). */
export const NewsItemSchema = z.looseObject({
  id: num,
  at_hours: num.nullish(),
  tick: num.nullish(),
  source: z.string().nullish(),
  source_name: z.string().nullish(),
  headline: z.string().nullish(),
  body: z.string().nullish(),
});
export const NewsListSchema = z.looseObject({ news: z.array(NewsItemSchema).default([]) });

export interface NewsItem {
  id: number;
  tick: number | null;
  at_hours: number | null;
  source: string;
  source_name: string;
  headline: string;
  body: string;
  /** Where we saw it first: the recorder's stream or the API. */
  via: "stream" | "api";
  /** Names from the catalog, dealers and venues that the text mentions (tag only, for display). */
  mentions: Mention[];
}

export interface Mention {
  name: string;
  kind: "set" | "card" | "dealer" | "venue";
  id?: string;
}

export interface NewsSummaryFile {
  updatedAt: string;
  tick: number | null;
  count: number;
  items: NewsItem[];
  bySource: Record<string, { name: string; count: number; latest: { id: number; tick: number | null; headline: string } | null }>;
  summary: { text: string; by: "llm" | "rules"; at: string };
  mentions: Array<Mention & { count: number }>;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Item from the API. */
export function itemFromApi(raw: z.infer<typeof NewsItemSchema>): NewsItem {
  return {
    id: raw.id,
    tick: raw.tick ?? null,
    at_hours: raw.at_hours ?? null,
    source: raw.source ?? "unknown",
    source_name: raw.source_name ?? raw.source ?? "unknown",
    headline: raw.headline ?? "",
    body: raw.body ?? "",
    via: "api",
    mentions: [],
  };
}

/** Item from one recorder line (`stream-public.jsonl`), or null if the line is not a `news.posted` event. */
export function itemFromStreamLine(line: string): NewsItem | null {
  if (!line.includes("news.posted")) return null;
  let rec: unknown;
  try {
    rec = JSON.parse(line);
  } catch {
    return null;
  }
  if (!rec || typeof rec !== "object") return null;
  const r = rec as { event?: unknown; data?: Record<string, unknown> };
  const data = r.data;
  if (!data || (r.event !== "news.posted" && data.type !== "news.posted")) return null;
  const p = data.payload as Record<string, unknown> | undefined;
  if (!p || typeof p.id !== "number") return null;
  return {
    id: p.id,
    tick: numOrNull(data.tick),
    at_hours: numOrNull(data.t),
    source: str(p.source) || str(data.actor) || "unknown",
    source_name: str(p.source_name) || str(p.source) || "unknown",
    headline: str(p.headline) || str(p.text),
    body: str(p.body),
    via: "stream",
    mentions: [],
  };
}

const fold = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Deterministic tagging: whole-word, accent- and case-insensitive match of each known name (≥ 3 letters). */
export function tagMentions(text: string, names: readonly Mention[]): Mention[] {
  const hay = fold(text);
  const out: Mention[] = [];
  const seen = new Set<string>();
  for (const m of names) {
    const key = fold(m.name).trim();
    if (key.length < 3 || seen.has(`${m.kind}:${key}`)) continue;
    if (new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(key)}($|[^\\p{L}\\p{N}])`, "u").test(hay)) {
      seen.add(`${m.kind}:${key}`);
      out.push(m);
    }
  }
  return out;
}

/** Deterministic summary: count and the latest few headlines. */
export function rulesSummary(items: readonly NewsItem[], latest = 3): string {
  if (items.length === 0) return "No news yet.";
  const head = items
    .slice(0, latest)
    .map((i) => `${i.source_name}: ${i.headline}${i.tick !== null ? ` (tick ${i.tick})` : ""}`)
    .join("; ");
  return `${items.length} item${items.length === 1 ? "" : "s"}; latest: ${head}. Unverified: some news is true, some is rumour, some is just Madrid.`;
}

/** Prompt for the one-shot LLM summary of the latest items. */
export function summaryPrompt(items: readonly NewsItem[], latest = 8): string {
  const lines = items.slice(0, latest).map((i) => `- [tick ${i.tick ?? "?"}] ${i.source_name}: ${i.headline}${i.body ? ` — ${i.body}` : ""}`);
  return [
    "You summarise news from a trading-card market game set in Madrid (cards, sets, dealers, venues such as El Rastro).",
    "Some items are true and the market moves as they say, some are rumours that never happen, some are just Madrid flavour. Nothing tells which is which.",
    "Write a 2-4 sentence plain-English summary of the latest items below (newest first). Explicitly say they may be rumours,",
    "and say what market moves they would imply IF true (which cards/sets/dealers might rise, fall or change). No markdown, no lists, no preamble.",
    "",
    ...lines,
  ].join("\n");
}

/** Sorted latest first (by id, which grows with time). */
export const latestFirst = (items: Iterable<NewsItem>): NewsItem[] => [...items].sort((a, b) => b.id - a.id);

export function buildSummaryFile(items: readonly NewsItem[], summary: NewsSummaryFile["summary"], now: Date = new Date()): NewsSummaryFile {
  const sorted = latestFirst(items);
  const bySource: NewsSummaryFile["bySource"] = {};
  for (const i of sorted) {
    const s = (bySource[i.source] ??= { name: i.source_name, count: 0, latest: { id: i.id, tick: i.tick, headline: i.headline } });
    s.count += 1;
  }
  const counts = new Map<string, Mention & { count: number }>();
  for (const i of sorted)
    for (const m of i.mentions) {
      const k = `${m.kind}:${m.name}`;
      const c = counts.get(k) ?? { ...m, count: 0 };
      c.count += 1;
      counts.set(k, c);
    }
  const ticks = sorted.map((i) => i.tick).filter((t): t is number => t !== null);
  return {
    updatedAt: now.toISOString(),
    tick: ticks.length ? Math.max(...ticks) : null,
    count: sorted.length,
    items: sorted,
    bySource,
    summary,
    mentions: [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}
