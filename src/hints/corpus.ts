import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { normalize } from "../flags/flags.js";
import type { Catalog } from "../shared/schemas.js";

/**
 * Corpus de pistas: cada línea de un dealer, por persona, con tick, hora de juego, hora de pared, hilo y mensaje,
 * y su fuente (nuestro hilo o el feed público). Excepción estrecha a «del rival solo se lee la estructura»: este
 * texto se guarda para buscar pistas de eggs y NUNCA entra en una cifra ni en una decisión de precio.
 *
 * Una regla determinista marca candidatas (con sus `reasons`); `classification` queda en null hasta que un LLM la
 * rellene en el paso 3 ('hint' | 'egg-clue' | 'voice'). Persiste en `results/bazaar-live/hints.jsonl`, solo
 * añadiendo, a través de los días; se deduplica por id de mensaje o, sin id, por persona + texto normalizado.
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
  /** Palabra clave para un probe («… about X»), si la hay. */
  keyword?: string;
  classification: null | "hint" | "egg-clue" | "voice";
}

/** Contexto de la regla: personas conocidas (id y nombre) y catálogo (ids, sets sin publicar). */
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

/** Regla determinista de candidata; devuelve los motivos (vacío si no lo es). */
export function candidateReasons(persona: string, text: string, ctx: CandidateContext): string[] {
  const reasons: string[] = [];
  const norm = normalize(text);
  const others = ctx.personas.filter((p) => p.id !== persona && [p.id, p.name].some((n) => n && new RegExp(`\\b${normalize(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(norm)));
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
  const reasons = candidateReasons(r.persona, r.text, ctx);
  const kw = /\babout ([a-z][\w' -]{2,30}?)(?:[.,!?…]|$)/i.exec(r.text)?.[1]?.trim();
  return { key: hintKey(r.persona, r.text, r.messageId), ...r, candidate: reasons.length > 0, reasons, ...(kw ? { keyword: kw } : {}), classification: null };
}

/**
 * Recorre cualquier JSON (respuesta de la API, volcado, línea de stream) y saca las líneas de dealer: eventos
 * `thread.message` del feed y mensajes de hilos (`with` + `messages`) cuyo emisor es la persona.
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
  // Línea de stream (`{recv, event, data}`): la hora de pared es la de recepción.
  const recv = str(o.recv);
  for (const v of Object.values(o)) collectRaw(v, recv ?? wall, out, depth + 1);
  return out;
}

/** Líneas nuevas (no vistas en `seen`), deduplicadas entre sí. Ordena por tick. */
export function newLines(raws: readonly Raw[], seen: ReadonlySet<string>, ctx: CandidateContext): HintLine[] {
  const keys = new Set(seen);
  // Un mensaje visto por id en el feed y en nuestro hilo es el mismo; si una copia no trae id, se casa por texto.
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

// ---------------------------------------------------------------- fichero

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
        // Línea corrupta: se ignora (el fichero solo crece).
        return [];
      }
    });
}

export function appendHints(file: string, lines: readonly HintLine[]): void {
  if (!lines.length) return;
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
}

/** Semilla desde lo ya guardado en `results/` (volcados, escaneos, streams, trazas): todo `.json`/`.jsonl`. */
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
            // Línea a medias de un stream cortado.
          }
        }
      } else if (name.endsWith(".json") && !/conversations|personas|flags|triggers/.test(name)) {
        try {
          collectRaw(JSON.parse(readFileSync(path, "utf8")), undefined, out);
        } catch {
          // JSON inválido: se salta.
        }
      }
    }
  };
  walk(resultsDir);
  return out;
}

/** Por persona, las más recientes primero. */
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
