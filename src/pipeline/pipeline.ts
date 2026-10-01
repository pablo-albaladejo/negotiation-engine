import { z } from "zod";
import type { AgentConfig } from "../engine/config.js";
import { DecisionSchema, engineBox, openingOffer, type Decision, type EngineInput } from "../engine/engine.js";
import { enforceOfferGuardrails } from "../engine/guardrails.js";
import { acceptableForUs, orientIssues, pickIssues, sameOffer, type Offer } from "../engine/issues.js";
import { detectLeak, type LeakContext } from "../llm/leak.js";
import { templateNarrator, type Narrator, type NarratorInput } from "../llm/narrator.js";
import { deterministicParser, parseDeterministic } from "../llm/deterministic-parser.js";
import { normalizeNumbers } from "../llm/numbers.js";
import { EMPTY_PARSE, parserOutputSchema, type ParserOutput, type TextParser } from "../llm/parser.js";
import { renderTemplate } from "../llm/template.js";
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
import { bindRivalMove, type BindingResult } from "./binding.js";
import { reconcileTextOffer } from "./reconcile.js";
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
  /** Intentos en total por caja con LLM antes de la plantilla. */
  attempts?: number;
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

/** Presupuesto del turno: tiempo del ring − margen de seguridad, o `turnBudgetMs` si el ring no lo da. */
export function turnBudgetMs(timeoutMs: number | undefined, config: Pick<AgentConfig, "turnSafetyMarginMs" | "turnBudgetMs">): number {
  return timeoutMs !== undefined ? Math.max(0, timeoutMs - config.turnSafetyMarginMs) : config.turnBudgetMs;
}

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
  const narrator = deps.narrator ?? templateNarrator;
  const attempts = deps.attempts ?? 2;
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
    const deadline = startedAt + turnBudgetMs(input.timeoutMs, config);
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
      if (box === "narrator" && typeof data === "string") {
        return { textLength: data.length };
      }
      if (box === "validator" && typeof data === "object" && data) {
        // Validator returns { ok, reasons } con cifras quoted; solo guardar ok
        const obj = data as Record<string, unknown>;
        return { ok: obj.ok };
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
        provider: deps.provider ?? "none",
      };
      const full = error ? { ...entry, error } : entry;
      deps.trace?.write(full);
      logger.trace?.("box_record", full);
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

    // 1b. Texto crudo del rival: solo para la traza JSONL local (nunca a OTel/Langfuse); ver
    // src/pipeline/otel.ts (caja "rivalText" excluida de la exportación).
    if (input.text) record("rivalText", {}, { text: input.text }, "ok", t0);

    // 2. Parser en cuarentena (2 intentos; si falla, solo campos estructurados).
    let parse: ParserOutput = EMPTY_PARSE;
    let parsed = false;
    if (input.text) {
      const schema = parserOutputSchema(schemas.issueNames);
      const text = input.text;
      const context = { issueNames: schemas.issueNames };
      for (let attempt = 1; attempt <= attempts && remaining() > 0; attempt++) {
        const share = remaining() / 2 / (attempts - attempt + 1);
        const result = await guarded(
          "parser",
          { text },
          async (signal) => schema.parse(await parser.parse(text, signal, context)),
          share,
          attempt < attempts ? "retry" : "fallback",
        );
        if (result.ok) {
          parse = result.value;
          parsed = true;
          break;
        }
      }
      session.opponent.recordClaims(parse.claims);
    } else {
      record("parser", { text: null }, EMPTY_PARSE, "ok", now());
    }

    // 3. Reconciliación: la oferta estructurada manda. Sin ella (solo texto), la oferta del texto
    // exige el acuerdo de ambos parsers (o el determinista solo con `none`); si el rival mandó
    // cifras que no se confirman, el turno va sin oferta y la contraoferta pide repetirlas.
    let reconciled: Offer | undefined;
    let unconfirmed = false;
    let deterministicOffer: Offer | undefined;
    if (input.rivalOffer) {
      reconciled = pickIssues(issues, input.rivalOffer);
    } else if (input.text && input.rivalAction !== "walk") {
      const text = input.text;
      try {
        deterministicOffer = dual ? parseDeterministic(text, schemas.issueNames).offer : parsed ? parse.offer : undefined;
        reconciled = reconcileTextOffer(issues, deterministicOffer, parsed ? parse.offer : undefined, dual);
        unconfirmed = !reconciled && (input.rivalAction === "offer" || normalizeNumbers(text).length > 0);
      } catch (error) {
        logger.warn("reconcile_failed", { sessionId: session.id, round: input.round, error: errorMessage(error) });
        unconfirmed = true;
      }
    }
    record(
      "reconcile",
      { structured: input.rivalOffer !== undefined, parserOffer: parse.offer ?? null, deterministicOffer: deterministicOffer ?? null, dual },
      { offer: reconciled ?? null, unconfirmed },
      "ok",
      now(),
    );

    // 4. Regla de enlace de la aceptación del rival y actualización del estado.
    // Cifras sin confirmar: ni oferta nueva ni aceptación (un accept con cifras ilegibles no es acuerdo).
    const binding: BindingResult =
      unconfirmed && input.rivalAction !== "walk" ? { kind: "none" } : bindRivalMove(issues, input.rivalAction, reconciled, ourLastOffer(session));
    session.rivalAcceptedOurLast = binding.kind === "agreement";
    if (binding.kind === "offer") {
      session.rivalOffers.push(binding.offer);
      session.opponent.recordOffer(binding.offer);
    }
    if (binding.kind === "walk") session.rivalWalked = true;
    record("binding", { rivalAction: input.rivalAction }, binding, "ok", now());

    // 5. Motor determinista; si falla, última oferta válida o apertura.
    const engineInput = engineInputFor(session, now(), unconfirmed);
    const engineResult = await guarded(
      "engine",
      { issues: engineInput.issues, params: engineInput.params, state: engineInput.state, seed: engineInput.seed },
      async () => checkDecision(session, DecisionSchema.parse(await engine(engineInput))),
      remaining(),
      "fallback",
    );
    const decision: Decision = engineResult.ok ? engineResult.value : emergencyDecision(session);
    if (!engineResult.ok) record("emergency", null, decision, "fallback", now());

    if (decision.action === "counter") session.ourOffers.push({ ...decision.offer });
    if (decision.action === "accept") session.agreement = { ...decision.offer };

    // 6. Narrador → validador → detector de fugas (2 textos como mucho; luego plantilla).
    const offer = decision.action === "walk" ? undefined : decision.offer;
    const narratorInput: NarratorInput = {
      action: decision.action,
      rivalIntent: parse.intent,
      tactics: [...parse.tactics],
      persona: config.persona,
    };
    if (offer) narratorInput.offer = offer;
    const ask = unconfirmed && decision.action === "counter" ? ("confirm-figures" as const) : undefined;
    if (ask) narratorInput.ask = ask;
    const check: TextCheck = { action: decision.action, text: "" };
    if (offer) check.offer = offer;
    const leakCtx: LeakContext = { issues, reservation: mandate.reservation };
    if (offer) leakCtx.decided = offer;

    let text: string | undefined;
    for (let attempt = 1; attempt <= attempts && remaining() > 0 && !text; attempt++) {
      const failResult: BoxResult = attempt < attempts ? "retry" : "fallback";
      const narrated = await guarded(
        "narrator",
        narratorInput,
        async (signal) => NarratorOutputSchema.parse(await narrator.narrate(narratorInput, signal)),
        remaining() / (attempts - attempt + 1),
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
      text = renderTemplate({ action: decision.action, ...(offer ? { offer } : {}), ...(ask ? { ask } : {}) });
      record("template", { action: decision.action, offer: offer ?? null, ask: ask ?? null }, { text }, "fallback", now());
    }

    // 7. Salida canónica validada.
    const output = schemas.turnOutput.parse({ sessionId: session.id, round: input.round, action: decision.action, ...(offer ? { offer } : {}), text });
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
    logger.trace?.("box_record", record);
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
