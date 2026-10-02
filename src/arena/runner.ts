import { performance } from "node:perf_hooks";
import type { Issue } from "../engine/config.js";
import { withinIssueRanges, type Offer } from "../engine/issues.js";
import { deriveSeed } from "../engine/rng.js";
import type { TraceRecord } from "../pipeline/box.js";
import { RemoteContractError } from "../protocol/http.js";
import { createProtocolSchemas, ProtocolError, type ProtocolSchemas, type TurnInput, type TurnOutput } from "../protocol/schemas.js";
import type { Participant, PlayerSession } from "./participant.js";
import { mandateFor, rivalRole, type Scenario } from "./scenario.js";

export interface TranscriptEntry {
  round: number;
  from: "agent" | "rival";
  action: TurnOutput["action"];
  /** Oferta real del emisor (en solo texto, el agente no la recibe estructurada). */
  offer?: Offer;
  text: string;
}

export type EndReason = "agreement" | "agent-walk" | "rival-walk" | "limit" | "rival-error" | "agent-error" | "protocol-violation";

/** Quién rompió el protocolo y por qué (salida fuera del esquema canónico, de otra sesión o de otra ronda). */
export interface ProtocolViolation {
  by: "agent" | "rival";
  detail: string;
}

export interface GameResult {
  gameId: string;
  scenarioId: string;
  rival: string;
  agent: string;
  role: Scenario["role"];
  mode: Scenario["mode"];
  seed: number;
  endReason: EndReason;
  /** Acuerdo con los valores reales: la oferta del rival que aceptamos o la nuestra que aceptó. */
  agreement?: Offer;
  agreedBy?: "agent" | "rival";
  /** Aceptamos unos valores que no son la oferta real del rival (solo texto mal extraído). */
  wrongAgreement: boolean;
  rounds: number;
  transcript: TranscriptEntry[];
  agentLatencyMs: number[];
  records: readonly TraceRecord[];
  error?: string;
  /** Solo con `endReason: "protocol-violation"`. */
  protocolViolation?: ProtocolViolation;
}

export interface GameOptions {
  scenario: Scenario;
  agent: Participant;
  rival: Participant;
  seed: number;
  gameId?: string;
}

const OPENING_TEXT = "Hola, empecemos la negociación.";

function sameValues(a: Offer, b: Offer): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => b[k] !== undefined && Math.abs(a[k]! - b[k]!) <= 1e-6);
}

/**
 * Salida de un participante según el protocolo: esquema canónico, misma sesión, misma ronda y, con
 * `issues`, oferta estructurada dentro del rango declarado de cada issue (el ring declara los issues;
 * una cifra estructurada fuera de rango rompe el protocolo). Devuelve la violación o la salida validada.
 */
export function checkTurnOutput(
  schemas: ProtocolSchemas,
  raw: unknown,
  sessionId: string,
  round: number,
  issues: readonly Issue[] = [],
): { output: TurnOutput } | { violation: string } {
  const parsed = schemas.turnOutput.safeParse(raw);
  if (!parsed.success) return { violation: ProtocolError.fromZod(parsed.error, "TurnOutput").message };
  if (parsed.data.sessionId !== sessionId) return { violation: "TurnOutput de otra sesión" };
  if (parsed.data.round !== round) return { violation: `TurnOutput de la ronda ${parsed.data.round} en la ronda ${round}` };
  const output = parsed.data;
  if (output.action !== "walk" && issues.length > 0 && !withinIssueRanges(issues, output.offer)) {
    const bad = issues.filter((i) => !withinIssueRanges([i], output.offer)).map((i) => i.name);
    return { violation: `oferta fuera del rango declarado: ${bad.join(", ")}` };
  }
  return { output: parsed.data };
}

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300);
}

/**
 * Una partida en proceso: la arena hace de ring. Nuestro agente abre en la ronda 1 y en cada
 * ronda responde el rival; en la ronda `rounds` una contraoferta del rival ya no tiene respuesta.
 * El rival recibe siempre nuestras ofertas estructuradas y el límite real; el agente recibe el
 * límite solo si el escenario lo hace visible y, en solo texto, únicamente el texto del rival.
 */
export async function playGame(options: GameOptions): Promise<GameResult> {
  const { scenario, seed } = options;
  const gameId = options.gameId ?? `${scenario.id}__${options.rival.name}__${seed}`;
  const issueNames = scenario.issues.map((i) => i.name);
  const schemas = createProtocolSchemas(issueNames);
  const result: GameResult = {
    gameId,
    scenarioId: scenario.id,
    rival: options.rival.name,
    agent: options.agent.name,
    role: scenario.role,
    mode: scenario.mode,
    seed,
    endReason: "limit",
    wrongAgreement: false,
    rounds: 0,
    transcript: [],
    agentLatencyMs: [],
    records: [],
  };
  const common = { sessionId: gameId, scenarioId: scenario.id, issues: scenario.issues, mode: scenario.mode };

  let agent: PlayerSession | undefined;
  let rival: PlayerSession | undefined;
  try {
    agent = await options.agent.start({ ...common, mandate: mandateFor(scenario, scenario.role), seed: deriveSeed(seed, "agent") });
  } catch (error) {
    return { ...result, endReason: "agent-error", error: message(error) };
  }
  try {
    rival = await options.rival.start({ ...common, mandate: mandateFor(scenario, rivalRole(scenario.role)), seed: deriveSeed(seed, "rival") });
  } catch (error) {
    return { ...result, endReason: "rival-error", error: message(error) };
  }

  const visibleLimit = {
    ...(scenario.limitVisible ? { roundLimit: scenario.rounds } : {}),
    ...(scenario.rivalCanRespond ? { rivalCanRespond: true } : {}),
  };
  let agentInput: TurnInput = { sessionId: gameId, round: 1, ...visibleLimit, rivalAction: "message", text: OPENING_TEXT };
  let rivalCurrent: Offer | undefined;
  // Violación de protocolo: la partida termina sin acuerdo (valor 0 para ambos) y se registra quién.
  const violated = (by: ProtocolViolation["by"], detail: string) => {
    result.endReason = "protocol-violation";
    result.protocolViolation = { by, detail: detail.slice(0, 300) };
    result.error = result.protocolViolation.detail;
  };

  try {
    for (let round = 1; round <= scenario.rounds; round++) {
      result.rounds = round;
      let rawOurs: unknown;
      try {
        const t0 = performance.now();
        rawOurs = await agent.respond(agentInput);
        result.agentLatencyMs.push(performance.now() - t0);
      } catch (error) {
        if (error instanceof RemoteContractError) violated("agent", message(error));
        else {
          result.endReason = "agent-error";
          result.error = message(error);
        }
        break;
      }
      const checkedOurs = checkTurnOutput(schemas, rawOurs, gameId, round, scenario.issues);
      if ("violation" in checkedOurs) {
        violated("agent", checkedOurs.violation);
        break;
      }
      const ours = checkedOurs.output;
      result.transcript.push({ round, from: "agent", action: ours.action, ...(ours.action === "walk" ? {} : { offer: ours.offer }), text: ours.text });
      if (ours.action === "walk") {
        result.endReason = "agent-walk";
        break;
      }
      if (ours.action === "accept") {
        result.endReason = "agreement";
        result.agreedBy = "agent";
        result.agreement = rivalCurrent ?? ours.offer;
        result.wrongAgreement = !rivalCurrent || !sameValues(ours.offer, rivalCurrent);
        break;
      }

      let rawTheirs: unknown;
      try {
        rawTheirs = await rival.respond({ sessionId: gameId, round, roundLimit: scenario.rounds, rivalAction: "offer", rivalOffer: ours.offer, text: ours.text });
      } catch (error) {
        if (error instanceof RemoteContractError) violated("rival", message(error));
        else {
          result.endReason = "rival-error";
          result.error = message(error);
        }
        break;
      }
      const checkedTheirs = checkTurnOutput(schemas, rawTheirs, gameId, round, scenario.issues);
      if ("violation" in checkedTheirs) {
        violated("rival", checkedTheirs.violation);
        break;
      }
      const theirs = checkedTheirs.output;
      result.transcript.push({ round, from: "rival", action: theirs.action, ...(theirs.action === "walk" ? {} : { offer: theirs.offer }), text: theirs.text });
      if (theirs.action === "walk") {
        result.endReason = "rival-walk";
        break;
      }
      if (theirs.action === "accept") {
        // Regla de enlace: el rival acepta nuestra última oferta.
        result.endReason = "agreement";
        result.agreedBy = "rival";
        result.agreement = { ...ours.offer };
        break;
      }
      rivalCurrent = { ...theirs.offer };
      agentInput = {
        sessionId: gameId,
        round: round + 1,
        ...visibleLimit,
        rivalAction: "offer",
        ...(scenario.mode === "structured" ? { rivalOffer: theirs.offer } : {}),
        text: theirs.text,
      };
    }
  } finally {
    result.records = agent.records?.() ?? [];
    await Promise.allSettled([agent.close?.(), rival.close?.()]);
  }
  return result;
}
