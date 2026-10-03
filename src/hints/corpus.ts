import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { normalize } from "../flags/flags.js";
import type { Catalog } from "../shared/schemas.js";

/**
 * Hints corpus: each dealer line, per persona, with tick, game time, wall-clock time, thread and message,
 * and its source (our thread or the public feed). Narrow exception to "only the rival's structure is read": this
 * text is stored to look for egg hints and NEVER enters a figure or a price decision.
 *
 * A deterministic rule flags candidates (with their `reasons`); `classification` stays null until an LLM
 * fills it in at step 3 ('hint' | 'egg-clue' | 'voice'). Persists in `results/bazaar-live/hints.jsonl`, append-
 * only, across days; deduplicated by message id or, without an id, by persona + normalized text.
 */

export type HintSource = "our-thread" | "feed";

export interface HintLine {
  key: string;
  persona: string;
  text: string;
  tick?: number;
  gameHour?: number;
  wall?: string;
  thread?: number;
  messageId?: number | string;
  source: HintSource;
  candidate: boolean;
  reasons: string[];
  /** Keyword for a probe ("… about X"), if any. */
  keyword?: string;
  /** Other personas the line names (id, full name or a name word): hints plant rumours about OTHER stalls. */
  targets?: string[];
  classification: null | "hint" | "egg-clue" | "voice";
  /** Probe phrase proposed by the LLM labeller (`labels.ts`): always a literal substring of `text`. */
  phrase?: string;
}

/** Rule context: known personas (id and name) and catalog (ids, unpublished sets). */
export interface CandidateContext {
  personas: readonly { id: string; name?: string }[];
  catalogIds: ReadonlySet<string>;
  unreleasedSets: readonly string[];
}

export function candidateContext(personas: readonly { id: string; name?: string }[], catalog: Catalog | undefined): CandidateContext {
  const sets = catalog?.sets ?? [];
  return {
    personas,
    catalogIds: new Set(sets.flatMap((s) => s.cards.map((c) => c.id))),
    unreleasedSets: sets.filter((s) => (s as { released?: unknown }).released === false && s.name).map((s) => s.name!),
  };
}

const TIME_RE = /\b(\d{1,2}([:.]\d{2})?\s?(am|pm|h)\b|half past|quarter (past|to)|o'?clock|opens?|opening|tomorrow|tonight|midnight|noon|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
const SECRET_RE = /\b(secret|rumou?rs?|hidden|legends?|legendary tale|whispers?|only the curious)\b/i;
const QUOTE_RE = /["“«‘][^"”»’]{3,}["”»’]/;

/** Words of a persona name too generic to stand for the persona on their own. */
const NAME_STOPWORDS = new Set(["senor", "senora", "don", "dona", "the", "los", "las", "del"]);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Other personas that `text` names: by id, full name or any name word of 4+ letters ("Carmen" → abuela). */
export function namedPersonas(persona: string, text: string, ctx: CandidateContext): string[] {
  const norm = normalize(text);
  return ctx.personas
    .filter((p) => {
      if (p.id === persona) return false;
      const words = p.name ? normalize(p.name).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !NAME_STOPWORDS.has(w)) : [];
      return [p.id, p.name, ...words].some((n) => n && new RegExp(`\\b${escapeRe(normalize(n))}\\b`).test(norm));
    })
    .map((p) => p.id);
}

/**
 * Probe keyword: the X of "… about X" or the Spanish "pregúntele … por X" (game text). Only a pointer for the
 * egg probe, never a figure.
 */
export function probeKeyword(text: string): string | undefined {
  const en = /\babout ([a-z][\w' -]{2,30}?)(?:[.,;:!?…]|$)/i.exec(text)?.[1];
  const es = /\bpreg[uú]nt\p{L}*[^.!?]*?\bpor ((?:el|la|los|las) [\p{L}' -]{2,30}?)(?:[.,;:!?…]|$)/iu.exec(text)?.[1];
  return (en ?? es)?.trim();
}

/** Deterministic candidate rule; returns the reasons (empty if it is not one). */
export function candidateReasons(persona: string, text: string, ctx: CandidateContext): string[] {
  const reasons: string[] = [];
  const norm = normalize(text);
  const others = namedPersonas(persona, text, ctx).map((id) => ({ id }));
  if (others.length) reasons.push(`names ${others.map((p) => p.id).join(", ")}`);
  else if (/\bstalls?\b/.test(norm)) reasons.push("mentions a stall");
  if (TIME_RE.test(text)) reasons.push("time or opens");
  const secret = SECRET_RE.exec(text);
  if (secret) reasons.push(`word "${secret[0].toLowerCase()}"`);
  if (QUOTE_RE.test(text)) reasons.push("quoted phrase");
  const unreleased = ctx.unreleasedSets.filter((s) => norm.includes(normalize(s)));
  if (unreleased.length) reasons.push(`unreleased set ${unreleased.join(", ")}`);
  const unknownIds = [...text.matchAll(/\b[A-Z]{3}-\d{2}\b/g)].map((m) => m[0]).filter((id) => ctx.catalogIds.size && !ctx.catalogIds.has(id));
  if (unknownIds.length) reasons.push(`card id not in catalogue ${unknownIds.join(", ")}`);
  return reasons;
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" && x ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const isTeam = (s: string) => /^t\d+$/.test(s);

export function hintKey(persona: string, text: string, messageId?: number | string): string {
  return messageId !== undefined ? `m:${messageId}` : `t:${persona}:${normalize(text).trim()}`;
}

export interface Raw {
  persona: string;
  text: string;
  tick?: number;
  gameHour?: number;
  wall?: string;
  thread?: number;
  messageId?: number | string;
  source: HintSource;
}

function line(r: Raw, ctx: CandidateContext): HintLine {
  return enrichLine({ key: hintKey(r.persona, r.text, r.messageId), ...r, candidate: false, reasons: [], classification: null }, ctx);
}

/**
 * Recomputes the deterministic part (reasons, keyword, targets) with today's rules and context: lines stored on
 * earlier days were derived with older rules or without the personas that arrived later.
 */
export function enrichLine(l: HintLine, ctx: CandidateContext): HintLine {
  const { keyword: _k, targets: _t, ...rest } = l;
  const reasons = candidateReasons(l.persona, l.text, ctx);
  const kw = probeKeyword(l.text);
  const targets = namedPersonas(l.persona, l.text, ctx);
  return { ...rest, candidate: reasons.length > 0, reasons, ...(kw ? { keyword: kw } : {}), ...(targets.length ? { targets } : {}) };
}

/**
 * Walks any JSON (API response, dump, stream line) and extracts dealer lines: feed
 * `thread.message` events and thread messages (`with` + `messages`) whose sender is the persona.
 */
export function collectRaw(value: unknown, wall?: string, out: Raw[] = [], depth = 0): Raw[] {
  if (depth > 8 || value === null || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    for (const v of value) collectRaw(v, wall, out, depth + 1);
    return out;
  }
  const o = value as Record<string, unknown>;
  const p = obj(o.payload);
  if (o.type === "thread.message" && str(p.text) && str(p.sender) && !isTeam(str(p.sender)!)) {
    const id = num(p.message) ?? str(p.message);
    out.push({ persona: str(p.sender)!, text: str(p.text)!, ...(num(o.tick) !== undefined ? { tick: num(o.tick)! } : {}), ...(num(o.t) !== undefined ? { gameHour: num(o.t)! } : {}), ...(wall ? { wall } : {}), ...(num(p.thread) !== undefined ? { thread: num(p.thread)! } : {}), ...(id !== undefined ? { messageId: id } : {}), source: "feed" });
    return out;
  }
  const withId = str(o.with);
  if (withId && !isTeam(withId) && Array.isArray(o.messages)) {
    for (const m of o.messages.map(obj)) {
      if (m.sender !== withId || !str(m.text)) continue;
      const id = num(m.id) ?? str(m.id);
      out.push({ persona: withId, text: str(m.text)!, ...(num(m.tick) !== undefined ? { tick: num(m.tick)! } : {}), ...(wall ? { wall } : {}), ...(num(o.id) !== undefined ? { thread: num(o.id)! } : {}), ...(id !== undefined ? { messageId: id } : {}), source: "our-thread" });
    }
    return out;
  }
  // Stream line (`{recv, event, data}`): the wall-clock time is the receive time.
  const recv = str(o.recv);
  for (const v of Object.values(o)) collectRaw(v, recv ?? wall, out, depth + 1);
  return out;
}

/** New lines (not seen in `seen`), deduplicated among themselves. Sorted by tick. */
export function newLines(raws: readonly Raw[], seen: ReadonlySet<string>, ctx: CandidateContext): HintLine[] {
  const keys = new Set(seen);
  // A message seen by id in the feed and in our thread is the same one; if a copy has no id, it is matched by text.
  const textKeys = new Set([...seen].filter((k) => k.startsWith("t:")));
  const out: HintLine[] = [];
  for (const r of [...raws].sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0))) {
    const k = hintKey(r.persona, r.text, r.messageId);
    const tk = hintKey(r.persona, r.text);
    if (keys.has(k) || (r.messageId === undefined && textKeys.has(tk))) continue;
    keys.add(k);
    out.push(line(r, ctx));
  }
  return out;
}

// ---------------------------------------------------------------- file

export const defaultHintsFile = (root: string) => join(root, "results", "bazaar-live", "hints.jsonl");

export function loadHints(file: string): HintLine[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((l) => {
      if (!l.trim()) return [];
      try {
        return [JSON.parse(l) as HintLine];
      } catch {
        // Corrupt line: ignored (the file only grows).
        return [];
      }
    });
}

export function appendHints(file: string, lines: readonly HintLine[]): void {
  if (!lines.length) return;
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
}

/** Seed from what is already stored in `results/` (dumps, scans, streams, traces): every `.json`/`.jsonl`. */
export function seedRaw(resultsDir: string): Raw[] {
  const out: Raw[] = [];
  const walk = (dir: string) => {
    for (const name of existsSync(dir) ? readdirSync(dir) : []) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith(".jsonl") && name !== "hints.jsonl") {
        for (const l of readFileSync(path, "utf8").split("\n")) {
          if (!l.includes('"text"')) continue;
          try {
            collectRaw(JSON.parse(l), undefined, out);
          } catch {
            // Partial line from a cut-off stream.
          }
        }
      } else if (name.endsWith(".json") && !/conversations|personas|flags|triggers/.test(name)) {
        try {
          collectRaw(JSON.parse(readFileSync(path, "utf8")), undefined, out);
        } catch {
          // Invalid JSON: skipped.
        }
      }
    }
  };
  walk(resultsDir);
  return out;
}

/** Per persona, most recent first. */
export function hintsByPersona(lines: readonly HintLine[]): Map<string, HintLine[]> {
  const out = new Map<string, HintLine[]>();
  for (const l of lines) out.set(l.persona, [...(out.get(l.persona) ?? []), l]);
  for (const v of out.values()) v.sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0));
  return out;
}

export function formatHints(lines: readonly HintLine[]): string[] {
  const by = hintsByPersona(lines);
  const counts = [...by].map(([p, ls]) => `${p} ${ls.length} (${ls.filter((l) => l.candidate).length} candidates)`);
  const last = [...lines].filter((l) => l.candidate).sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0)).slice(0, 3);
  return [`hints: ${counts.join(" · ") || "-"} · ${lines.length} lines`, ...last.map((l) => `  candidate ${l.persona} t${l.tick ?? "?"} [${l.reasons.join("; ")}] "${l.text.slice(0, 120)}"`)];
}
