import type { Issue } from "../engine/config.js";
import type { Offer } from "../engine/issues.js";
import { normalizeNumbers, type NumberMention } from "./numbers.js";
import type { ParserFigure } from "./parser.js";

/**
 * Verificación determinista de las cifras del parser LLM por evidencia literal. El LLM propone
 * valor y fragmento; el código comprueba que el fragmento está en el texto del rival y que,
 * normalizado, da ese valor. Una cifra que no se puede comprobar no llega al motor.
 */

export type FigureConfidence = "verified-digits" | "verified-words" | "llm-only";
export type VerifyFailure = "span-not-found" | "value-mismatch" | "ambiguous" | "words-unverifiable" | "partial";

export interface FigureCheck {
  issue: string;
  value: number;
  evidence: string;
  ok: boolean;
  confidence?: FigureConfidence;
  reason?: VerifyFailure;
}

export type VerifyResult =
  | { ok: true; offer: Offer; confidence: FigureConfidence; checks: FigureCheck[] }
  | { ok: false; reason: VerifyFailure; checks: FigureCheck[] };

export interface VerifyOptions {
  acceptWordNumbers: "confirm" | "llm-only";
}

const TOLERANCE = 1e-6;
const ND_RE = /\p{Nd}/u;
const RANK: Record<FigureConfidence, number> = { "llm-only": 0, "verified-words": 1, "verified-digits": 2 };

/** Normalización para buscar un fragmento: NFKC, sin `\p{Cf}`, minúsculas y espacios plegados. */
export function foldForMatch(text: string): string {
  return text.normalize("NFKC").replace(/\p{Cf}/gu, "").toLowerCase().replace(/\s+/gu, " ").trim();
}

/** ¿El fragmento aparece literalmente (tras el plegado) en el texto? Un fragmento vacío nunca aparece. */
export function spanAppears(text: string, span: string | undefined): boolean {
  if (!span) return false;
  const needle = foldForMatch(span);
  return needle.length > 0 && foldForMatch(text).includes(needle);
}

const close = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE;

function inRange(issue: Issue | undefined, value: number): boolean {
  return !issue || (value >= issue.min - TOLERANCE && value <= issue.max + TOLERANCE);
}

/** Lecturas distintas de una mención que caen en el rango del issue. */
function readingsInRange(mention: NumberMention, issue: Issue | undefined): number[] {
  const out: number[] = [];
  for (const r of mention.readings) if (inRange(issue, r) && !out.some((o) => close(o, r))) out.push(r);
  return out;
}

/** Verifica una cifra: aparición del fragmento, luego dígitos o palabras ES/EN, si no `llm-only`/confirmar. */
export function verifyFigure(text: string, figure: ParserFigure, issue: Issue | undefined, options: VerifyOptions): FigureCheck {
  const base = { issue: figure.issue, value: figure.value, evidence: figure.evidence };
  if (!spanAppears(text, figure.evidence)) return { ...base, ok: false, reason: "span-not-found" };
  if (!inRange(issue, figure.value)) return { ...base, ok: false, reason: "value-mismatch" };
  const mentions = normalizeNumbers(figure.evidence);
  if (mentions.some((m) => m.kind === "range")) return { ...base, ok: false, reason: "ambiguous" };
  const numbers = mentions.filter((m): m is NumberMention => m.kind === "number");
  const hasDigits = ND_RE.test(figure.evidence.normalize("NFKC"));
  const pool = hasDigits ? numbers.filter((m) => m.source === "digits") : numbers;
  if (pool.length === 0) {
    if (hasDigits) return { ...base, ok: false, reason: "value-mismatch" };
    // Solo palabras de un idioma que el normalizador no cubre.
    return options.acceptWordNumbers === "llm-only"
      ? { ...base, ok: true, confidence: "llm-only" }
      : { ...base, ok: false, reason: "words-unverifiable" };
  }
  const matching = pool.find((m) => readingsInRange(m, issue).some((r) => close(r, figure.value)));
  if (!matching) return { ...base, ok: false, reason: "value-mismatch" };
  if (readingsInRange(matching, issue).length > 1) return { ...base, ok: false, reason: "ambiguous" };
  return { ...base, ok: true, confidence: matching.source === "digits" ? "verified-digits" : "verified-words" };
}

/**
 * Verifica todas las cifras y deriva la oferta: solo si cada issue declarado tiene una cifra
 * verificada (repetida con el mismo valor o única). La confianza es la peor de las cifras.
 */
export function verifyFigures(text: string, figures: readonly ParserFigure[], issues: readonly Issue[], options: VerifyOptions): VerifyResult {
  const byName = new Map(issues.map((i) => [i.name, i]));
  const checks = figures.map((f) => verifyFigure(text, f, byName.get(f.issue), options));
  const failed = checks.find((c) => !c.ok);
  if (failed) return { ok: false, reason: failed.reason!, checks };
  const values = new Map<string, number>();
  for (const c of checks) {
    const previous = values.get(c.issue);
    if (previous !== undefined && !close(previous, c.value)) return { ok: false, reason: "ambiguous", checks };
    values.set(c.issue, c.value);
  }
  if (issues.length === 0 || !issues.every((i) => values.has(i.name))) return { ok: false, reason: "partial", checks };
  const confidence = checks.reduce<FigureConfidence>((worst, c) => (RANK[c.confidence!] < RANK[worst] ? c.confidence! : worst), "verified-digits");
  return { ok: true, offer: Object.fromEntries(issues.map((i) => [i.name, values.get(i.name)!])), confidence, checks };
}
