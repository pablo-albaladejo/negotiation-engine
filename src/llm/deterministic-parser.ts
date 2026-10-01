import type { Offer } from "../engine/issues.js";
import { foldText, normalizeNumbers, type Mention } from "./numbers.js";
import { EMPTY_PARSE, type Intent, type ParserOutput, type Tactic, type TextParser } from "./parser.js";
import { ACCEPT_RE, WALK_RE } from "./validator.js";

function phrase(patterns: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}])(?:${patterns.join("|")})(?![\\p{L}])`, "iu");
}

/** Marcadores de tácticas del rival (ES/EN). Solo informan: el control de flujo es del motor. */
const TACTIC_PATTERNS: [Tactic, RegExp][] = [
  [
    "prompt-injection",
    phrase([
      "ignora(?:r)? (?:todas )?(?:tus|las) (?:instrucciones|reglas)",
      "olvida(?:r)? (?:tus|las) (?:instrucciones|reglas)",
      "ignore (?:all |your |the |any )?(?:previous |prior )?(?:instructions|rules)",
      "forget (?:your|all|the) (?:instructions|rules)",
      "(?:nuevas|new) (?:instrucciones|instructions)",
      "system prompt",
      "prompt del sistema",
      "(?:tu|tus|your) (?:reserva|reservation|máximo|maximo|mínimo|minimo|límite|limite|limit|tope|bottom line|mandato|mandate|instrucciones|instructions)",
      "(?:dime|revela|reveal|tell me) (?:tu|your)",
    ]),
  ],
  ["hypothetical-framing", phrase(["hipot[ée]tic\\p{L}*", "imagina\\p{L}*", "supongamos", "si fueras", "si diseñaras", "hypothetical\\p{L}*", "imagine", "suppose", "if you were"])],
  [
    "identity-claim",
    phrase([
      "soy (?:tu|el|la) (?:supervisor\\p{L}*|jef[ea]|organizador\\p{L}*|admin\\p{L}*|desarrollador\\p{L}*)",
      "i am (?:your|the) (?:supervisor|boss|admin\\p{L}*|organi[sz]er|developer)",
      "(?:ahora )?eres (?:el|la) (?:vendedor\\p{L}*|comprador\\p{L}*)",
      "you are (?:now )?the (?:seller|buyer)",
    ]),
  ],
  ["false-deadline", phrase(["última ronda", "ultima ronda", "oferta final", "última oferta", "ultima oferta", "last round", "final offer", "last offer"])],
  ["false-batna", phrase(["otra oferta", "otro proveedor", "competidor\\p{L}*", "another offer", "other supplier", "competitor\\p{L}*"])],
  ["pressure", phrase(["ahora mismo", "inmediatamente", "urgente", "right now", "immediately", "urgent"])],
];

const SUSPICIOUS: ReadonlySet<Tactic> = new Set(["prompt-injection", "hypothetical-framing", "identity-claim"]);
const NEGATED_ACCEPT = phrase(["(?:no|not|never|nunca|can't|cannot|won't|don't) (?:\\p{L}+ )?(?:acepto|aceptamos|accept\\p{L}*)"]);
const DAY_BEFORE = /(?:^|[^\p{L}])(?:día|dia|day)\s*$/iu;
const DAY_AFTER = /^\s*(?:días|dias|days)(?![\p{L}])/iu;

/** Issue al que se refiere una cifra, o null si no se puede asignar sin adivinar. */
function assign(text: string, mention: Mention, issueNames: readonly string[]): string | null {
  const before = text.slice(Math.max(0, mention.start - 40), mention.start);
  const after = text.slice(mention.end, mention.end + 20);
  if (DAY_BEFORE.test(before) || DAY_AFTER.test(after)) return issueNames.includes("day") ? "day" : null;
  if (mention.unit !== "none") return issueNames.includes("pct") ? "pct" : null;
  for (const name of issueNames) {
    if (name === "pct" || name === "day") continue;
    if (new RegExp(`(?:^|[^\\p{L}])${name}\\s*[:=]?\\s*$`, "iu").test(before)) return name;
  }
  return null;
}

/**
 * Oferta solo si cada cifra se asigna a un issue declarado, cada issue tiene exactamente un valor
 * (repetido o no) y no hay rangos ni cifras ambiguas. Conservador: ante la duda, sin oferta.
 */
export function extractOffer(raw: string, issueNames: readonly string[]): Offer | undefined {
  const text = foldText(raw);
  const values = new Map<string, number>();
  for (const mention of normalizeNumbers(text)) {
    if (mention.kind === "range" || mention.ambiguous) return undefined;
    const issue = assign(text, mention, issueNames);
    if (!issue) return undefined;
    const previous = values.get(issue);
    if (previous !== undefined && Math.abs(previous - mention.value) > 1e-9) return undefined;
    values.set(issue, mention.value);
  }
  if (issueNames.length === 0 || !issueNames.every((n) => values.has(n))) return undefined;
  return Object.fromEntries(issueNames.map((n) => [n, values.get(n)!]));
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parser determinista (proveedor `none` y segunda lectura en solo texto): expresiones regulares
 * sobre el normalizador numérico compartido, con el mismo contrato cerrado que el parser LLM.
 * Con sospecha de inyección no devuelve oferta.
 */
export function parseDeterministic(text: string, issueNames: readonly string[]): ParserOutput {
  const tactics: Tactic[] = [];
  const claims: string[] = [];
  for (const sentence of sentences(text)) {
    let flagged = false;
    for (const [tactic, re] of TACTIC_PATTERNS) {
      if (!re.test(sentence)) continue;
      flagged = true;
      if (!tactics.includes(tactic)) tactics.push(tactic);
    }
    if (flagged && claims.length < 20) claims.push(sentence.slice(0, 500));
  }
  const injectionSuspected = tactics.some((t) => SUSPICIOUS.has(t));
  const offer = injectionSuspected ? undefined : extractOffer(text, issueNames);

  let intent: Intent = "other";
  let intentEvidence: string | undefined;
  if (injectionSuspected) intent = "other";
  else if (WALK_RE.test(text)) [intent, intentEvidence] = ["walk", WALK_RE.exec(text)?.[0]];
  else if (ACCEPT_RE.test(text) && !NEGATED_ACCEPT.test(text)) [intent, intentEvidence] = ["accept", ACCEPT_RE.exec(text)?.[0]];
  else if (offer) intent = "offer";

  const output: ParserOutput = { ...EMPTY_PARSE, intent, claims, tactics, injectionSuspected };
  if (offer) output.offer = offer;
  if (intentEvidence?.trim()) output.intentEvidence = intentEvidence.trim().slice(0, 200);
  return output;
}

/** Negación de una aceptación (es/en): veta una aceptación leída por el LLM. */
export function negatedAccept(text: string): boolean {
  return NEGATED_ACCEPT.test(text);
}

export const deterministicParser: TextParser = {
  name: "deterministic",
  parse: async (text, _signal, context) => parseDeterministic(text, context?.issueNames ?? []),
};
