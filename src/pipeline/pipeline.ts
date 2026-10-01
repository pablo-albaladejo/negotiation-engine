import { z } from "zod";
import type { AgentConfig } from "../engine/config.js";
import { DecisionSchema, engineBox, openingOffer, type Decision, type EngineInput } from "../engine/engine.js";
import { enforceOfferGuardrails } from "../engine/guardrails.js";
import { acceptableForUs, orientIssues, pickIssues, sameOffer, type Offer } from "../engine/issues.js";
import { detectLeak, type LeakContext } from "../llm/leak.js";
import { templateNarrator, type Narrator, type NarratorInput, type TemplateContext } from "../llm/narrator.js";
import { deterministicParser, extractOfferDetailed, negatedAccept, parseDeterministic } from "../llm/deterministic-parser.js";
import { spanAppears } from "../llm/verify.js";
import { turnLanguage } from "../llm/language.js";
import { normalizeNumbers } from "../llm/numbers.js";
import { EMPTY_PARSE, parserOutputSchema, type ParserOutput, type TextParser } from "../llm/parser.js";
import { renderTemplate, templateLanguage, templateVariant, type Ask, type Echo } from "../llm/template.js";
import { CheckResultSchema, validateText, type TextCheck } from "../llm/validator.js";
import {
  createProtocolSchemas,
  GenericTurnInputSchema,
  ProtocolError,
  type ProtocolSchemas,
  type TurnInput,
  type TurnOutput,
} from "../protocol/schemas.js";
import { createContext, runBox, silentLogger, type BoxResult, type Logger, type TraceSink } from "./box.js";
import { bindRivalMove, verifyTextAcceptance, type BindingResult } from "./binding.js";
import { reconcileOffer, type Reconciled } from "./reconcile.js";
import { DEFAULT_RUNTIME_CONFIG, type ParserPolicy, type RuntimeConfig } from "./runtime-config.js";
import { ourLastOffer, type Session, type SessionStore } from "./session.js";

/** El cerebro visto desde los adaptadores: un turno canónico y la ruta de emergencia. */
export interface Brain {
  turn(raw: unknown): Promise<TurnOutput>;
  /** Respuesta válida sin depender de ninguna caja que pueda fallar. */
  fallback(raw: unknown): TurnOutput;
}

export interface PipelineDeps {
  store: SessionStore;
  /** Parser en cuarentena; por defecto el determinista (proveedor `none`). */
  parser?: TextParser;
  narrator?: Narrator;
  /** Motor inyectable (tests de fallos); por defecto la caja `engine`. */
  engine?: (input: EngineInput) => unknown;
  validator?: (check: TextCheck) => unknown;
  leakDetector?: (text: string, ctx: LeakContext) => unknown;
  now?: () => number;
  logger?: Logger;
  trace?: TraceSink;
  provider?: string;
  /** Intentos en total por caja con LLM antes de la plantilla; por defecto `llm.parser.attempts` y `llm.narrator.attempts`. */
  attempts?: number;
  /** Configuración de ejecución efectiva; por defecto la de `hybrid` sin fichero. */
  runtime?: RuntimeConfig;
}

const LeakResultSchema = z.union([
  z.object({ leak: z.literal(false) }).strict(),
  z.object({ leak: z.literal(true), reasons: z.array(z.string()) }).strict(),
]);
const NarratorOutputSchema = z.string().trim().min(1).max(5_000);

/** Campos del turno canónico: los únicos segmentos de ruta (con los issues) que puede nombrar `protocol`. */
const TURN_INPUT_FIELDS = Object.keys(GenericTurnInputSchema.shape);

class TimeoutError extends Error {
  override name = "TimeoutError";
}

/**
 * Presupuesto del turno: si el ring declara su tiempo, min(tiempo × `turn.budgetRatio`, tiempo −
 * margen de seguridad); si no, `turnBudgetMs` de la configuración.
 */
export function turnBudgetMs(timeoutMs: number | undefined, config: Pick<AgentConfig, "turnSafetyMarginMs" | "turnBudgetMs">, budgetRatio = 1): number {
  if (timeoutMs === undefined) return config.turnBudgetMs;
  return Math.max(0, Math.min(timeoutMs * budgetRatio, timeoutMs - config.turnSafetyMarginMs));
}

/** Reserva al final del turno para validador, detector de fugas y plantilla. */
const TAIL_RESERVE_MS = 300;

async function withTimeout<T>(fn: (signal: AbortSignal) => T | Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(`tiempo agotado (${Math.round(ms)} ms)`));
    }, Math.max(0, ms));
  });
  try {
    return await Promise.race([Promise.resolve().then(() => fn(controller.signal)), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cajas cuyo registro va solo a la traza local, nunca a pino: `rivalText` lleva el texto crudo del
 * rival. El `explain` del motor se censura por rutas (`REDACT_PATHS` en log.ts). Los registros
 * `protocol` (solo rutas y códigos de zod) sí se loguean.
 */
const LOCAL_ONLY_BOXES: ReadonlySet<string> = new Set(["rivalText", "evidence"]);

/** Único punto por el que un registro de caja llega al logger. */
function logBoxRecord(logger: Logger, record: { box: string }): void {
  if (!LOCAL_ONLY_BOXES.has(record.box)) logger.trace?.("box_record", record);
}

function failureKind(error: unknown): "timeout" | "invalid" | "exception" {
  if (error instanceof TimeoutError) return "timeout";
  if (error instanceof z.ZodError || (error as Error)?.name === "BoxContractError") return "invalid";
  return "exception";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 300) : "error desconocido";
}

/** Ruta de emergencia del motor: nuestra última oferta válida o la apertura, siempre tras los guardarraíles. */
export function emergencyDecision(session: Session): Decision & { action: "counter" } {
  const { config, mandate } = session;
  const issues = orientIssues(config.issues, mandate.role);
  const last = ourLastOffer(session);
  const base = last ?? openingOffer(config.issues, mandate, config);
  return { action: "counter", offer: enforceOfferGuardrails(issues, mandate, base, last), rule: "emergency" };
}

function engineInputFor(session: Session, nowMs: number, currentOfferUnconfirmed = false): EngineInput {
  const { config } = session;
  const state: EngineInput["state"] = {
    round: session.round,
    ourOffers: session.ourOffers.map((o) => ({ ...o })),
    rivalOffers: session.rivalOffers.map((o) => ({ ...o })),
    rivalAcceptedOurLast: session.rivalAcceptedOurLast,
    rivalWalked: session.rivalWalked,
    // Sin el campo canónico se supone que el rival no responde tras nuestro último movimiento.
    rivalCanRespond: session.rivalCanRespond ?? false,
  };
  if (currentOfferUnconfirmed) state.currentOfferUnconfirmed = true;
  if (session.roundLimit !== undefined) state.roundLimit = session.roundLimit;
  if (session.deadlineMs !== undefined) {
    state.deadlineMs = session.deadlineMs;
    state.startedAtMs = session.startedAtMs;
    state.nowMs = nowMs;
  }
  return {
    issues: config.issues.map((i) => ({ ...i })),
    mandate: { role: session.mandate.role, reservation: { ...session.mandate.reservation } },
    params: {
      beta: config.beta,
      openingMargin: config.openingMargin,
      acceptMargin: config.acceptMargin,
      acTimeThreshold: config.acTimeThreshold,
      noise: config.noise,
      defaultHorizon: config.defaultHorizon,
      ...(config.reciprocity !== undefined ? { reciprocity: config.reciprocity } : {}),
      ...(config.acCombiThreshold !== undefined ? { acCombiThreshold: config.acCombiThreshold } : {}),
    },
    state,
    seed: session.seed,
  };
}

export function createPipeline(deps: PipelineDeps): Brain {
  const now = deps.now ?? Date.now;
  const logger = deps.logger ?? silentLogger;
  const parser = deps.parser ?? deterministicParser;
  /** Con un parser distinto del determinista, el determinista es la segunda lectura obligatoria. */
  const dual = parser.name !== deterministicParser.name;
  const runtime = deps.runtime ?? DEFAULT_RUNTIME_CONFIG;
  /** Sin LLM, `llm-primary-verified` y `dual-strict` se degradan a `deterministic-only`. */
  const policy: ParserPolicy = dual ? runtime.parser.policy : "deterministic-only";
  /** Con `deterministic-only` no se llama al LLM: intención y tácticas también del determinista. */
  const activeParser = policy === "deterministic-only" ? deterministicParser : parser;
  const llmActive = activeParser !== deterministicParser;
  const narrator = deps.narrator ?? templateNarrator;
  const parserAttempts = deps.attempts ?? runtime.llm.parser.attempts;
  const narratorAttempts = deps.attempts ?? runtime.llm.narrator.attempts;
  /** La plantilla como narrador es instantánea: ni límite por llamada ni omisión por tiempo. */
  const llmNarrator = narrator !== templateNarrator;
  const engine =
    deps.engine ?? ((input: EngineInput) => runBox(engineBox, input, createContext({ now, logger })));
  const validator = deps.validator ?? validateText;
  const leakDetector = deps.leakDetector ?? detectLeak;
  const locks = new Map<string, Promise<unknown>>();

  function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const previous = locks.get(id) ?? Promise.resolve();
    const run = previous.then(fn, fn);
    locks.set(
      id,
      run.catch(() => undefined),
    );
    return run;
  }

  async function runTurn(session: Session, input: TurnInput, schemas: ProtocolSchemas, startedAt: number): Promise<TurnOutput> {
    const { config, mandate } = session;
    const issues = config.issues;
    const oriented = orientIssues(issues, mandate.role);
    /** Extremo de un rango peor para nosotros (para un comprador de descuento, el pct menor). */
    const worse = (name: string, lo: number, hi: number) => (oriented.find((i) => i.name === name)?.direction === "higher-better" ? lo : hi);
    const bpsUnits = Object.values(runtime.parser.units.bps).flat();
    const extractOptions = runtime.parser.ranges === "conservative" ? { worse, bpsUnits } : { bpsUnits };
    const deadline = startedAt + turnBudgetMs(input.timeoutMs ?? runtime.ring.timeoutMs, config, runtime.turn.budgetRatio);
    const remaining = () => Math.max(0, deadline - now());

    /** Sanitiza entrada/salida de cajas LLM que pueden registrar textos sensibles. */
    function sanitizeBox(box: string, role: "input" | "output", data: unknown): unknown {
      if (role === "input") {
        if (typeof data !== "object" || !data || Array.isArray(data)) return data;
        const obj = data as Record<string, unknown>;
        // Parser: rival text podría contener cifras de la reserva
        if (box === "parser") {
          const { text, ...rest } = obj;
          return { ...rest, textLength: typeof text === "string" ? text.length : null };
        }
        // Narrator: solo persona, sin instrucciones
        if (box === "narrator") return { persona: (obj as any).persona };
        // Validator: no registrar el texto candidato
        if (box === "validator") {
          const { text, ...rest } = obj;
          return { ...rest, textLength: typeof text === "string" ? text.length : null };
        }
        // Leak: no registrar el texto ni las razones
        if (box === "leak") {
          return { textLength: typeof obj.text === "string" ? obj.text.length : null };
        }
        return data;
      }
      // Salidas de LLM que podrían contener texto sensible
      // Parser: las evidencias son texto del rival; solo van a la caja local `evidence`.
      if (box === "parser" && typeof data === "object" && data && !Array.isArray(data)) {
        const { figures, intentEvidence: _evidence, ...rest } = data as ParserOutput;
        return figures ? { ...rest, figures: figures.map((f) => ({ issue: f.issue, value: f.value })) } : rest;
      }
      if (box === "narrator" && typeof data === "string") {
        return { textLength: data.length };
      }
      if (box === "validator" && typeof data === "object" && data) {
        // Validator returns { ok, reasons } con cifras quoted; solo guardar ok
        const obj = data as Record<string, unknown>;
        return obj.coherence === "unchecked" ? { ok: obj.ok, coherence: "coherence-unchecked" } : { ok: obj.ok };
      }
      if (box === "leak" && typeof data === "object" && data) {
        const obj = data as Record<string, unknown>;
        // Registrar leak flag pero no las razones que delatarían cifras
        if (obj.leak) return { leak: true };
        return { leak: false };
      }
      return data;
    }

    const record = (box: string, boxInput: unknown, output: unknown, result: BoxResult, t0: number, error?: string) => {
      const entry = {
        sessionId: session.id,
        round: input.round,
        box,
        input: sanitizeBox(box, "input", boxInput),
        output: sanitizeBox(box, "output", output),
        result,
        latencyMs: now() - t0,
        seed: session.seed,
        configVersion: session.configVersion,
        runtimeConfig: runtime.fingerprint,
        provider: deps.provider ?? "none",
      };
      const full = error ? { ...entry, error } : entry;
      deps.trace?.write(full);
      logBoxRecord(logger, full);
    };

    /** Ejecuta una caja dentro de try/catch y con tiempo máximo; nunca lanza. */
    async function guarded<T>(
      box: string,
      boxInput: unknown,
      fn: (signal: AbortSignal) => T | Promise<T>,
      timeoutMs: number,
      failResult: BoxResult,
    ): Promise<{ ok: true; value: T } | { ok: false }> {
      const t0 = now();
      try {
        const value = await withTimeout(fn, timeoutMs);
        record(box, boxInput, value, "ok", t0);
        return { ok: true, value };
      } catch (error) {
        const kind = failureKind(error);
        logger.warn("box_failed", { box, kind, recovery: failResult, sessionId: session.id, round: input.round });
        record(box, boxInput, null, failResult, t0, `${kind}: ${errorMessage(error)}`);
        return { ok: false };
      }
    }

    // 1. Entrada canónica y campos estructurados al estado.
    const t0 = now();
    session.round = input.round;
    if (input.roundLimit !== undefined) session.roundLimit = input.roundLimit;
    if (input.deadline !== undefined) session.deadlineMs = Date.parse(input.deadline);
    if (input.rivalCanRespond !== undefined) session.rivalCanRespond = input.rivalCanRespond;
    record("input", { rivalAction: input.rivalAction, hasOffer: input.rivalOffer !== undefined, hasText: !!input.text }, { round: session.round, roundLimit: session.roundLimit ?? null }, "ok", t0);

    // 1a. Acuerdo ya registrado: respuesta idempotente con las mismas cifras y el mismo texto.
    if (session.agreement && session.agreementText) {
      const repeat = schemas.turnOutput.parse({ sessionId: session.id, round: input.round, action: "accept", offer: { ...session.agreement }, text: session.agreementText });
      record("agreement-repeat", { origin: session.agreementOrigin ?? null }, repeat, "ok", now());
      return repeat;
    }

    // 1b. Texto crudo del rival: solo para la traza JSONL local (nunca a OTel/Langfuse); ver
    // src/pipeline/otel.ts (caja "rivalText" excluida de la exportación).
    if (input.text) record("rivalText", {}, { text: input.text }, "ok", t0);

    // 2. Parser en cuarentena (`llm.parser.attempts` intentos de hasta `llm.parser.timeoutMs`; si
    // falla, `parser.onLlmFailure`).
    let parse: ParserOutput = EMPTY_PARSE;
    let parsed = false;
    let llmFailed = false;
    let fallbackIntent: ParserOutput["intent"] | undefined;
    if (input.text) {
      const schema = parserOutputSchema(schemas.issueNames);
      const text = input.text;
      const context = { issueNames: schemas.issueNames };
      for (let attempt = 1; attempt <= parserAttempts && remaining() > 0; attempt++) {
        const share = Math.min(runtime.llm.parser.timeoutMs, Math.max(0, remaining() - TAIL_RESERVE_MS));
        const result = await guarded(
          "parser",
          { text },
          async (signal) => schema.parse(await activeParser.parse(text, signal, context)),
          share,
          attempt < parserAttempts ? "retry" : "fallback",
        );
        if (result.ok) {
          parse = result.value;
          parsed = true;
          break;
        }
      }
      // Parser LLM fallido: la intención (y solo ella, con su evidencia) puede venir del determinista.
      // `deterministic` la usa con las reglas del camino sin LLM; `confirm` solo la usa para pedir
      // que el rival confirme su aceptación (src/pipeline/AGENTS.md, «Fallo del parser LLM»).
      if (llmActive && !parsed) {
        llmFailed = true;
        const fallback = parseDeterministic(text, schemas.issueNames);
        fallbackIntent = fallback.intent;
        if (runtime.parser.onLlmFailure === "deterministic") parse = fallback;
      }
      session.opponent.recordClaims(parse.claims);
      const language = turnLanguage(parse.language, text);
      if (language !== "und") session.language = language;
    } else {
      record("parser", { text: null }, EMPTY_PARSE, "ok", now());
    }

    // 3. Reconciliación: la oferta estructurada manda (confianza `structured`). Sin ella, la oferta
    // del texto sigue `parser.policy` (src/pipeline/reconcile.ts); si el rival mandó cifras que no
    // se confirman, el turno va sin oferta y la contraoferta pide repetirlas.
    let reconciled: Offer | undefined;
    let unconfirmed = false;
    let deterministicOffer: Offer | undefined;
    let outcome: Reconciled | undefined;
    if (input.rivalOffer) {
      reconciled = pickIssues(issues, input.rivalOffer);
      outcome = { offer: reconciled, confidence: "structured" };
    } else if (input.text && input.rivalAction !== "walk") {
      const text = input.text;
      try {
        const detSource = llmActive ? parseDeterministic(text, schemas.issueNames) : parsed ? parse : undefined;
        const detailed = detSource && !detSource.injectionSuspected ? extractOfferDetailed(text, schemas.issueNames, extractOptions) : {};
        deterministicOffer = detailed.offer;
        const reconcileInput: Parameters<typeof reconcileOffer>[0] = {
          issues,
          text,
          policy,
          deterministic: deterministicOffer,
          acceptWordNumbers: runtime.parser.acceptWordNumbers,
          onLlmFailure: runtime.parser.onLlmFailure,
          ranges: runtime.parser.ranges,
          worse,
          bpsUnits,
        };
        if (detailed.ranges) reconcileInput.deterministicRanges = detailed.ranges;
        if (llmActive) reconcileInput.llm = parsed ? { ok: true, output: parse } : { ok: false };
        outcome = reconcileOffer(reconcileInput);
        reconciled = outcome.offer;
        const proposedFigures = llmActive && parsed && (parse.figures?.length ?? 0) > 0;
        unconfirmed = !reconciled && (input.rivalAction === "offer" || proposedFigures || normalizeNumbers(text).length > 0);
      } catch (error) {
        logger.warn("reconcile_failed", { sessionId: session.id, round: input.round, error: errorMessage(error) });
        unconfirmed = true;
      }
    }
    const confidence = reconciled ? (outcome?.confidence ?? null) : unconfirmed ? "unconfirmed" : null;
    record(
      "reconcile",
      {
        structured: input.rivalOffer !== undefined,
        policy,
        configuredPolicy: runtime.parser.policy,
        llmCalled: llmActive && !!input.text,
        parserOffer: parse.offer ?? null,
        parserFigures: parse.figures?.map((f) => ({ issue: f.issue, value: f.value })) ?? null,
        deterministicOffer: deterministicOffer ?? null,
        dual,
      },
      { offer: reconciled ?? null, unconfirmed, confidence, reason: unconfirmed ? (outcome?.reason ?? null) : null, language: session.language ?? null, ranges: outcome?.ranges ?? null },
      "ok",
      now(),
    );
    // Evidencias literales (texto del rival): solo en la traza local, nunca en pino ni OTel.
    if (outcome?.checks || parse.intentEvidence) {
      record("evidence", {}, { checks: outcome?.checks ?? [], intentEvidence: parse.intentEvidence ?? null }, "ok", now());
    }

    // 4a. Aceptación y retirada leídas en el texto: solo en turnos sin acción del ring (`message`);
    // una acción del ring distinta siempre prevalece.
    let rivalAction = input.rivalAction;
    let textAccepted = false;
    let confirmAcceptance = false;
    const textSignal: Record<string, unknown> = { intent: parse.intent, ...(llmFailed ? { llmFailed: true, onLlmFailure: runtime.parser.onLlmFailure } : {}) };
    if (input.rivalAction === "message" && input.text) {
      const text = input.text;
      if (llmFailed && runtime.parser.onLlmFailure === "confirm" && fallbackIntent === "accept" && runtime.acceptance.signal === "parser-intent-verified") {
        // Sin lectura LLM y con `confirm`: una aceptación aparente nunca cierra; se pide confirmarla.
        textSignal.acceptSignal = runtime.acceptance.signal;
        textSignal.acceptVerified = false;
        textSignal.acceptReason = "llm-failed";
        confirmAcceptance = ourLastOffer(session) !== undefined;
      } else if (parse.intent === "accept") {
        textSignal.acceptSignal = runtime.acceptance.signal;
        if (runtime.acceptance.signal === "parser-intent-verified") {
          const acceptInput: Parameters<typeof verifyTextAcceptance>[0] = {
            issues,
            text,
            intent: parse.intent,
            negated: negatedAccept(text),
            ourLast: ourLastOffer(session),
            textHasNumbers: normalizeNumbers(text).length > 0,
            ranged: normalizeNumbers(text).some((m) => m.kind === "range"),
          };
          if (parse.intentEvidence) acceptInput.intentEvidence = parse.intentEvidence;
          if (llmActive && outcome?.checks) acceptInput.checks = outcome.checks;
          if ((!llmActive || llmFailed) && deterministicOffer) acceptInput.deterministic = deterministicOffer;
          const verdict = verifyTextAcceptance(acceptInput);
          textSignal.acceptVerified = verdict.verified;
          if (!verdict.verified) textSignal.acceptReason = verdict.reason;
          if (verdict.verified) {
            textAccepted = true;
            rivalAction = "accept";
            // El acuerdo es nuestra última oferta: cifras citadas (si las hay) ya coinciden con ella.
            if (!reconciled || !sameOffer(issues, reconciled, ourLastOffer(session)!)) reconciled = undefined;
            unconfirmed = false;
          }
        }
      } else if (parse.intent === "walk") {
        textSignal.walkSignal = runtime.acceptance.walkSignal;
        const walkVerified = runtime.acceptance.walkSignal === "parser-intent-verified" && spanAppears(text, parse.intentEvidence);
        textSignal.walkVerified = walkVerified;
        if (walkVerified) rivalAction = "walk";
      }
    }

    // 4. Regla de enlace de la aceptación del rival y actualización del estado.
    // Cifras sin confirmar: ni oferta nueva ni aceptación (un accept con cifras ilegibles no es acuerdo).
    const binding: BindingResult =
      unconfirmed && rivalAction !== "walk" ? { kind: "none" } : bindRivalMove(issues, rivalAction, reconciled, ourLastOffer(session));
    session.rivalAcceptedOurLast = binding.kind === "agreement";
    if (binding.kind === "offer") {
      session.rivalOffers.push(binding.offer);
      session.opponent.recordOffer(binding.offer);
      // Cifra solo LLM o rango: oferta no firme, el motor no puede aceptarla en este turno.
      session.rivalCurrentLlmOnly = outcome?.confidence === "llm-only" || outcome?.confidence === "range";
    }
    if (binding.kind === "walk") session.rivalWalked = true;
    record("binding", { rivalAction: input.rivalAction, effectiveAction: rivalAction, textSignal }, binding, "ok", now());

    // 5. Motor determinista; si falla, última oferta válida o apertura.
    const engineInput = engineInputFor(session, now(), unconfirmed);
    const engineResult = await guarded(
      "engine",
      { issues: engineInput.issues, params: engineInput.params, state: engineInput.state, seed: engineInput.seed },
      async () => checkDecision(session, DecisionSchema.parse(await engine(engineInput))),
      remaining(),
      "fallback",
    );
    let decision: Decision = engineResult.ok ? engineResult.value : emergencyDecision(session);
    if (!engineResult.ok) record("emergency", null, decision, "fallback", now());
    // Una cifra `llm-only` no basta para aceptar: contraoferta con nuestras cifras que pide confirmar.
    let llmOnlyBlocked = false;
    const rivalCurrent = session.rivalOffers.at(-1);
    if (decision.action === "accept" && session.rivalCurrentLlmOnly && rivalCurrent && sameOffer(issues, decision.offer, rivalCurrent) && !session.rivalAcceptedOurLast) {
      decision = emergencyDecision(session);
      llmOnlyBlocked = true;
      record("llm-only-accept-blocked", null, decision, "ok", now());
    }

    // Aceptación aparente sin lectura LLM (`onLlmFailure = confirm`): repetimos nuestra última oferta
    // para que un «sí» cierre exactamente lo que el rival parecía aceptar.
    if (confirmAcceptance && decision.action === "counter") {
      decision = emergencyDecision(session);
      record("confirm-acceptance", null, decision, "ok", now());
    }
    if (decision.action === "counter") session.ourOffers.push({ ...decision.offer });
    if (decision.action === "accept") {
      session.agreement = { ...decision.offer };
      session.agreementOrigin = session.rivalAcceptedOurLast ? (textAccepted ? "rival-text-verified" : "ring-action") : "engine-accept";
      session.agreementRound = input.round;
    }

    // 6. Narrador → validador → detector de fugas (2 textos como mucho; luego plantilla).
    const offer = decision.action === "walk" ? undefined : decision.offer;
    const narratorInput: NarratorInput = {
      action: decision.action,
      rivalIntent: parse.intent,
      tactics: [...parse.tactics],
      persona: config.persona,
    };
    if (offer) narratorInput.offer = offer;
    // Idioma de salida: el de la sesión (`narrator.language = auto`) o el fijado; sin idioma conocido, `template.fallbackLanguage`.
    const outLanguage = runtime.narrator.language === "auto" ? (session.language ?? runtime.template.fallbackLanguage) : runtime.narrator.language;
    narratorInput.language = outLanguage;
    const ask: Ask | undefined =
      decision.action !== "counter"
        ? undefined
        : confirmAcceptance
          ? "confirm-acceptance"
          : unconfirmed || llmOnlyBlocked || (reconciled !== undefined && outcome?.confidence === "range")
            ? "confirm-figures"
            : undefined;
    if (ask) narratorInput.ask = ask;
    const check: TextCheck = { action: decision.action, text: "", language: outLanguage, coherence: runtime.validator.coherence };
    if (offer) check.offer = offer;
    const leakCtx: LeakContext = { issues, reservation: mandate.reservation };
    if (offer) leakCtx.decided = offer;
    // Plantilla: formulación rotada por sesión y ronda; la petición de confirmar repite las cifras
    // DEL RIVAL (rango o lectura solo LLM) solo si no se acercan a nuestra reserva.
    const variant = templateVariant(session.id, input.round);
    let echo: Echo | undefined;
    if (ask === "confirm-figures") {
      const range = outcome?.ranges ? Object.entries(outcome.ranges)[0] : undefined;
      const llmOnlyIssue = llmOnlyBlocked && rivalCurrent ? Object.keys(rivalCurrent)[0] : undefined;
      if (range && reconciled) echo = { kind: "range", issue: range[0], bounds: range[1] };
      else if (llmOnlyIssue) echo = { kind: "figure", issue: llmOnlyIssue, value: rivalCurrent![llmOnlyIssue]! };
      if (echo) {
        const probe = renderTemplate({ action: "counter", ...(offer ? { offer } : {}), ask, echo }, outLanguage, runtime.template);
        if (detectLeak(probe, leakCtx).leak) echo = undefined;
      }
    }
    if (echo) check.echoed = echo.kind === "range" ? [...echo.bounds] : [echo.value];
    const templateContext: TemplateContext = { variant, ...(echo ? { echo } : {}) };

    let text: string | undefined;
    const { minRemainingMs } = runtime.llm.narrator;
    for (let attempt = 1; attempt <= narratorAttempts && remaining() > 0 && !text; attempt++) {
      // Sin tiempo para una llamada útil (también antes de un reintento): plantilla directamente.
      if (llmNarrator && remaining() < minRemainingMs) {
        record("narrator-skipped", { attempt, remainingMs: Math.round(remaining()), minRemainingMs }, null, "fallback", now());
        break;
      }
      const failResult: BoxResult = attempt < narratorAttempts ? "retry" : "fallback";
      const share = llmNarrator ? Math.min(runtime.llm.narrator.timeoutMs, Math.max(0, remaining() - TAIL_RESERVE_MS)) : remaining() / (narratorAttempts - attempt + 1);
      const narrated = await guarded(
        "narrator",
        narratorInput,
        async (signal) => NarratorOutputSchema.parse(await narrator.narrate(narratorInput, signal, templateContext)),
        share,
        failResult,
      );
      if (!narrated.ok) continue;
      const candidate = narrated.value;
      const validation = await guarded("validator", { ...check, text: candidate }, async () => CheckResultSchema.parse(await validator({ ...check, text: candidate })), remaining(), failResult);
      if (!validation.ok || !validation.value.ok) continue;
      const leak = await guarded("leak", { text: candidate }, async () => LeakResultSchema.parse(await leakDetector(candidate, leakCtx)), remaining(), failResult);
      if (!leak.ok) continue;
      if (leak.value.leak) {
        logger.warn("leak_blocked", { sessionId: session.id, round: input.round, attempt });
        continue;
      }
      text = candidate;
    }
    if (!text) {
      text = renderTemplate({ action: decision.action, variant, ...(offer ? { offer } : {}), ...(ask ? { ask } : {}) }, outLanguage, runtime.template);
      record("template", { action: decision.action, offer: offer ?? null, ask: ask ?? null, language: templateLanguage(outLanguage, runtime.template) }, { text }, "fallback", now());
    }

    // 7. Salida canónica validada.
    const output = schemas.turnOutput.parse({ sessionId: session.id, round: input.round, action: decision.action, ...(offer ? { offer } : {}), text });
    if (decision.action === "accept") {
      session.agreementText = text;
      record("agreement", { origin: session.agreementOrigin ?? null, round: input.round }, { offer: { ...decision.offer } }, "ok", now());
    }
    record("output", null, output, "ok", now());
    return output;
  }

  /** Una decisión del motor solo vale si sus cifras son coherentes con el estado y el mandato. */
  function checkDecision(session: Session, decision: Decision): Decision {
    const { config, mandate } = session;
    const issues = orientIssues(config.issues, mandate.role);
    if (decision.action === "walk") return decision;
    if (Object.keys(decision.offer).length !== issues.length) throw new Error("oferta con issues no declarados");
    const offer = pickIssues(issues, decision.offer);
    if (decision.action === "counter") {
      return { ...decision, offer: enforceOfferGuardrails(issues, mandate, offer, ourLastOffer(session)) };
    }
    const rivalCurrent = session.rivalOffers.at(-1);
    const last = ourLastOffer(session);
    const isCurrent = rivalCurrent !== undefined && sameOffer(issues, offer, rivalCurrent);
    const isAgreement = session.rivalAcceptedOurLast && last !== undefined && sameOffer(issues, offer, last);
    if (!(isCurrent || isAgreement) || !acceptableForUs(issues, mandate, offer)) {
      throw new Error("accept sobre una oferta que no es la actual, fuera del mandato o por debajo de u(reserva)");
    }
    return { ...decision, offer };
  }

  function fallbackOutput(raw: unknown): TurnOutput {
    try {
      const base = GenericTurnInputSchema.parse(raw);
      const session = deps.store.getOrCreate(base.sessionId);
      const schemasFor = () => createProtocolSchemas(session.config.issues.map((i) => i.name));
      // Sesión ya cerrada: la acción terminal coherente, nunca una contraoferta nueva.
      const last = ourLastOffer(session);
      const oriented = orientIssues(session.config.issues, session.mandate.role);
      const candidate = session.agreement ?? (session.rivalAcceptedOurLast ? last : undefined);
      const agreed = candidate && acceptableForUs(oriented, session.mandate, candidate) ? candidate : undefined;
      if (agreed) {
        session.agreement = { ...agreed };
        const offer = { ...agreed };
        return schemasFor().turnOutput.parse({ sessionId: base.sessionId, round: base.round, action: "accept", offer, text: renderTemplate({ action: "accept", offer }) });
      }
      if (session.rivalWalked) {
        return { sessionId: base.sessionId, round: base.round, action: "walk", text: renderTemplate({ action: "walk" }) };
      }
      const decision = emergencyDecision(session);
      if (!ourLastOffer(session)) session.ourOffers.push({ ...decision.offer });
      return schemasFor().turnOutput.parse({
        sessionId: base.sessionId,
        round: base.round,
        action: "counter",
        offer: decision.offer,
        text: renderTemplate(decision),
      });
    } catch {
      const r = (raw ?? {}) as { sessionId?: unknown; round?: unknown };
      const sessionId = typeof r.sessionId === "string" && r.sessionId ? r.sessionId.slice(0, 200) : "unknown";
      const round = typeof r.round === "number" && Number.isInteger(r.round) && r.round >= 1 ? r.round : 1;
      return { sessionId, round, action: "walk", text: renderTemplate({ action: "walk" }) };
    }
  }

  /**
   * Registro `protocol` de un turno que no cumple el esquema canónico, solo si el `sessionId` es
   * legible: rutas de los campos (segmentos fuera del esquema, p. ej. claves inventadas por el
   * rival, como `*`) y códigos de Zod; nunca valores, mensajes ni texto del rival.
   */
  function recordProtocol(raw: unknown, error: z.ZodError, startedAt: number, session?: Session): void {
    const r = (raw ?? {}) as { sessionId?: unknown; round?: unknown };
    const readable = typeof r.sessionId === "string" && r.sessionId.length >= 1 && r.sessionId.length <= 200 ? r.sessionId : undefined;
    const sessionId = session?.id ?? readable;
    if (!deps.trace || sessionId === undefined) return;
    const known = new Set([...TURN_INPUT_FIELDS, ...(session?.config.issues.map((i) => i.name) ?? [])]);
    const issues = error.issues.map((i) => ({
      path: i.path.map((p) => (typeof p === "number" || (typeof p === "string" && known.has(p)) ? String(p) : "*")).join("."),
      code: i.code,
    }));
    const round = typeof r.round === "number" && Number.isInteger(r.round) && r.round >= 1 ? r.round : 1;
    const record = {
      sessionId,
      round,
      box: "protocol",
      input: null,
      output: { issues },
      result: "error" as const,
      latencyMs: now() - startedAt,
      ...(session ? { seed: session.seed, configVersion: session.configVersion } : {}),
      provider: deps.provider ?? "none",
      error: issues.map((i) => `${i.path || "(root)"}:${i.code}`).join(", "),
    };
    deps.trace.write(record);
    logBoxRecord(logger, record);
  }

  return {
    async turn(raw) {
      const startedAt = now();
      const base = GenericTurnInputSchema.safeParse(raw);
      if (!base.success) {
        const sessionId = (raw as { sessionId?: unknown } | null)?.sessionId;
        recordProtocol(raw, base.error, startedAt, typeof sessionId === "string" ? deps.store.get(sessionId) : undefined);
        throw ProtocolError.fromZod(base.error, "Turno");
      }
      const session = deps.store.getOrCreate(base.data.sessionId);
      const schemas = createProtocolSchemas(session.config.issues.map((i) => i.name));
      const parsed = schemas.turnInput.safeParse(raw);
      if (!parsed.success) {
        recordProtocol(raw, parsed.error, startedAt, session);
        throw ProtocolError.fromZod(parsed.error, "Turno");
      }
      return withLock(session.id, async () => {
        try {
          return await runTurn(session, parsed.data, schemas, startedAt);
        } catch (error) {
          logger.error("turn_failed", { sessionId: session.id, round: parsed.data.round, error: errorMessage(error) });
          return fallbackOutput(parsed.data);
        }
      });
    },
    fallback: fallbackOutput,
  };
}
