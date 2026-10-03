import { readFileSync } from "node:fs";
import { join } from "node:path";

// News as a HINT for the model (GameState.news): who or what is being talked about, and in which direction.
// Never a figure: no price, limit or amount is read from a news item, and every signal may be rumour.

export type NewsDirection = "demand" | "supply" | "event" | "unknown";

export interface NewsSignal {
  id: number;
  tick: number | null;
  /** Ticks since it was posted (null when the item has no tick). */
  ageTicks: number | null;
  source: string;
  sourceName: string;
  headline: string;
  body: string;
  /** Typed mentions by name; dealers by persona id when the summary file carries it. */
  mentions: { sets: string[]; cards: string[]; dealers: string[]; venues: string[] };
  direction: NewsDirection;
  /** Some news is true, some is rumour, some is just Madrid: nothing tells which. */
  unverified: true;
}

export interface NewsSignals {
  available: boolean;
  updatedAt: string | null;
  summary: { text: string; by: string };
  /** Latest first. */
  items: NewsSignal[];
}

export const NEWS_SUMMARY_FILE = "news-summary.json";

export const emptyNewsSignals = (): NewsSignals => ({ available: false, updatedAt: null, summary: { text: "", by: "none" }, items: [] });

// English and Spanish keywords (game text: they match the news wording).
const DEMAND = /\b(looking for|wants?|wanted|buying|buys|hunting|seeks?|seeking|busca[n]?|buscando|compra[n]?|comprando|quiere[n]?)\b/;
const SUPPLY = /\b(flood(?:s|ing|ed)?|dump(?:s|ing|ed)?|selling off|sells? off|cheap|glut|sobran?|inunda[n]?|liquida[n]?|regala[n]?|barat[oa]s?)\b/;

const fold = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Deterministic direction from the text: demand, supply, an event naming an entity, or unknown. */
export function newsDirection(text: string, namesEntity: boolean): NewsDirection {
  const t = fold(text);
  if (DEMAND.test(t)) return "demand";
  if (SUPPLY.test(t)) return "supply";
  return namesEntity ? "event" : "unknown";
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const intOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const rec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

function typedMentions(raw: unknown): NewsSignal["mentions"] {
  const out: NewsSignal["mentions"] = { sets: [], cards: [], dealers: [], venues: [] };
  if (!Array.isArray(raw)) return out;
  const push = (list: string[], v: string) => {
    if (v && !list.includes(v)) list.push(v);
  };
  for (const m of raw) {
    // Old files may carry bare names without a kind: nothing to type, so they are skipped.
    const r = rec(m);
    const name = str(r.name);
    if (r.kind === "set") push(out.sets, name);
    else if (r.kind === "card") push(out.cards, name);
    else if (r.kind === "dealer") push(out.dealers, str(r.id) || name);
    else if (r.kind === "venue") push(out.venues, name);
  }
  return out;
}

/** Signals from a parsed news-summary.json (pure; anything odd gives an empty or partial result). */
export function newsSignalsFrom(parsed: unknown, nowTick: number): NewsSignals {
  const file = rec(parsed);
  if (!Array.isArray(file.items)) return emptyNewsSignals();
  const items: NewsSignal[] = [];
  for (const raw of file.items) {
    const r = rec(raw);
    const id = intOrNull(r.id);
    if (id === null) continue;
    const tick = intOrNull(r.tick);
    const headline = str(r.headline);
    const body = str(r.body);
    const mentions = typedMentions(r.mentions);
    const named = mentions.sets.length + mentions.cards.length + mentions.dealers.length + mentions.venues.length > 0;
    items.push({
      id,
      tick,
      ageTicks: tick !== null && Number.isFinite(nowTick) ? Math.max(0, nowTick - tick) : null,
      source: str(r.source) || "unknown",
      sourceName: str(r.source_name) || str(r.source) || "unknown",
      headline,
      body,
      mentions,
      direction: newsDirection(`${headline} ${body}`, named),
      unverified: true,
    });
  }
  items.sort((a, b) => b.id - a.id);
  const summary = rec(file.summary);
  return { available: true, updatedAt: str(file.updatedAt) || null, summary: { text: str(summary.text), by: str(summary.by) || "none" }, items };
}

/** Reads `<dir>/news-summary.json` (written by `pnpm bazaar:news`); never throws: missing or bad file → empty. */
export function readNewsSignals(dir: string, nowTick: number): NewsSignals {
  try {
    return newsSignalsFrom(JSON.parse(readFileSync(join(dir, NEWS_SUMMARY_FILE), "utf8")), nowTick);
  } catch {
    return emptyNewsSignals();
  }
}

/** One console line with the latest signals (no figures). */
export function formatNewsSignals(n: NewsSignals, latest = 3): string[] {
  if (!n.available || n.items.length === 0) return ["news: -"];
  const parts = n.items.slice(0, latest).map((s) => {
    const who = [...s.mentions.dealers, ...s.mentions.sets, ...s.mentions.cards, ...s.mentions.venues];
    return `#${s.id} ${s.direction}${who.length ? ` [${who.join(", ")}]` : ""} "${s.headline}"${s.ageTicks !== null ? ` (${s.ageTicks} ticks ago)` : ""}`;
  });
  return [`news (unverified, hint only): ${n.items.length} · ${parts.join(" · ")}`];
}
