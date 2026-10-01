import { performance } from "node:perf_hooks";
import type { Offer } from "../engine/issues.js";
import { deriveSeed } from "../engine/rng.js";
import type { TraceRecord } from "../pipeline/box.js";
import { createProtocolSchemas, type TurnInput, type TurnOutput } from "../protocol/schemas.js";
import type { Participant, PlayerSession } from "./participant.js";
import { mandateFor, rivalRole, type Scenario } from "./scenario.js";
import { languageForSeed, nlRng, renderNaturalLanguage, type NlLanguage } from "../bots/nl-renderer.js";

export interface TranscriptEntry {
  round: number;
  from: "agent" | "rival";
  action: TurnOutput["action"];
  /** Oferta real del emisor (en solo texto, el agente no la recibe estructurada). */
  offer?: Offer;
  text: string;
  /** Texto completo: ¿la oferta del bot era extraíble como oferta firme? (verdad de terreno). */
  extractable?: boolean;
}

export type EndReason = "agreement" | "agent-walk" | "rival-walk" | "limit" | "rival-error" | "agent-error";

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
  /** Texto completo: idioma de la partida, acuerdos registrados sin aceptación real y aceptaciones reales no detectadas. */
  textMode?: "agent-side" | "full";
  language?: string;
  falseAccept?: number;
  missedAccept?: number;
}

export interface GameOptions {
  scenario: Scenario;
  agent: Participant;
  rival: Participant;
  seed: number;
  gameId?: string;
  /** `full`: el agente recibe solo texto en lenguaje natural (`rivalAction = message`, sin oferta), también aceptaciones y retiradas. */
  textMode?: "agent-side" | "full";
  languages?: readonly NlLanguage[];
}

const OPENING_TEXT = "Hola, empecemos la negociación.";

function sameValues(a: Offer, b: Offer): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => b[k] !== undefined && Math.abs(a[k]! - b[k]!) <= 1e-6);
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
  const full = options.textMode === "full";
  const lang = languageForSeed(options.languages ?? ["es", "en"], seed);
  const rng = nlRng(seed);
  if (full) Object.assign(result, { textMode: "full", language: lang, falseAccept: 0, missedAccept: 0 });
  let ourPrevious: Offer | undefined;
  /** Texto completo: un turno más del agente con el texto de aceptación o retirada del bot (el ring cierra con el movimiento canónico). */
  const notifyAgent = async (round: number, text: string): Promise<TurnOutput | undefined> => {
    try {
      const t0 = performance.now();
      const raw = await agent!.respond({ sessionId: gameId, round, ...visibleLimit, rivalAction: "message", text });
      result.agentLatencyMs.push(performance.now() - t0);
      return schemas.turnOutput.parse(raw);
    } catch {
      return undefined;
    }
  };

  try {
    for (let round = 1; round <= scenario.rounds; round++) {
      result.rounds = round;
      let ours: TurnOutput;
      try {
        const t0 = performance.now();
        const raw = await agent.respond(agentInput);
        result.agentLatencyMs.push(performance.now() - t0);
        ours = schemas.turnOutput.parse(raw);
      } catch (error) {
        result.endReason = "agent-error";
        result.error = message(error);
        break;
      }
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
        // Acuerdo registrado por texto sobre nuestra oferta anterior sin aceptación real del bot.
        if (full && ourPrevious && sameValues(ours.offer, ourPrevious) && (!rivalCurrent || !sameValues(ours.offer, rivalCurrent))) result.falseAccept = 1;
        break;
      }

      let theirs: TurnOutput;
      try {
        const raw = await rival.respond({ sessionId: gameId, round, roundLimit: scenario.rounds, rivalAction: "offer", rivalOffer: ours.offer, text: ours.text });
        theirs = schemas.turnOutput.parse(raw);
      } catch (error) {
        result.endReason = "rival-error";
        result.error = message(error);
        break;
      }
      let rivalText = theirs.text;
      let extractable: boolean | undefined;
      if (full && !options.rival.name.startsWith("llm")) {
        const rendered = renderNaturalLanguage(theirs.action === "walk" ? { action: "walk" } : { action: theirs.action, offer: theirs.offer }, lang, rng);
        rivalText = rendered.text;
        extractable = rendered.extractable;
      }
      ourPrevious = { ...ours.offer };
      result.transcript.push({ round, from: "rival", action: theirs.action, ...(theirs.action === "walk" ? {} : { offer: theirs.offer }), text: rivalText, ...(extractable === undefined ? {} : { extractable }) });
      if (theirs.action === "walk") {
        if (full) await notifyAgent(round + 1, rivalText);
        result.endReason = "rival-walk";
        break;
      }
      if (theirs.action === "accept") {
        if (full) {
          const seen = await notifyAgent(round + 1, rivalText);
          if (seen?.action !== "accept") result.missedAccept = 1;
        }
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
        rivalAction: full ? "message" : "offer",
        ...(scenario.mode === "structured" && !full ? { rivalOffer: theirs.offer } : {}),
        text: rivalText,
      };
    }
  } finally {
    result.records = agent.records?.() ?? [];
    await Promise.allSettled([agent.close?.(), rival.close?.()]);
  }
  return result;
}
