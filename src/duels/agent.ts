import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { BazaarError } from "../shared/client.js";
import { DAYS_MIN, DEFAULT_DUEL_PARAMS, daysValueFrom, decideDuel, textMatchesOffer, withinLimit, type DuelDecision, type DuelParams, type DuelState } from "./duels.js";
import { concessionsSinceRival, ourOfferFrom, rivalOfferFrom, type Duel, type DuelsApi, type Schedule, type StructuredOffer } from "./schemas.js";
import type { Clock } from "../shared/schemas.js";
import { liveTraceDir } from "../shared/trace.js";

/**
 * Bucle de duelos: un paso por tick. Lee `/api/duels`, decide cada duelo con `decideDuel` y envía
 * como mucho un mensaje por duelo y tick y una aceptación por equipo y tick (la de más excedente;
 * las demás esperan al tick siguiente). La memoria por duelo (nuestras ofertas y las del rival) vive
 * en el proceso y, si se da `stateFile`, también en disco (escritura atómica tras cada tick con POSTs)
 * para que un reinicio la recupere en vez de reabrir o volver a conceder desde cero. La oferta del
 * rival se lee de `rival_offer` o, si falta, del último mensaje suyo (`rivalOfferFrom`); la nuestra,
 * de la memoria o, si no hay memoria para ese duelo (reinicio sin fichero), de `your_offer`
 * (`ourOfferFrom`), para no reabrir con un ancla nueva ni repetir el primer mensaje. En `dryRun` no
 * hay ningún POST ni se toca la memoria (ni el fichero).
 */

interface Memory {
  ourOffers: StructuredOffer[];
  rivalOffers: StructuredOffer[];
  lastOurTick?: number;
  rivalMovedSinceOurLast: boolean;
  lastActionTick?: number;
}

const DUELS_STATE_SCHEMA = "bazaar-duels-state/v1";

interface PersistedDuelsState {
  schema?: string;
  updated?: string;
  duels?: Record<string, Memory>;
}

/** `results/bazaar-live/<fecha>/duels-state.json`: dónde persiste la memoria si no se indica otro fichero. */
export function defaultDuelsStateFile(root: string, now: Date = new Date()): string {
  return join(liveTraceDir(root, now), "duels-state.json");
}

/** Carga la memoria persistida; vacía si el fichero no existe o no es válido (nunca lanza). */
export function loadDuelsMemory(file: string): Map<string, Memory> {
  const map = new Map<string, Memory>();
  if (!existsSync(file)) return map;
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as PersistedDuelsState;
    if (data.schema !== DUELS_STATE_SCHEMA || !data.duels) return map;
    for (const [id, mem] of Object.entries(data.duels)) map.set(id, mem);
  } catch {
    // Fichero corrupto o ilegible: se arranca sin memoria (el payload del servidor sigue dando rival_offer/your_offer).
  }
  return map;
}

/** Guarda toda la memoria con rename atómico (fichero temporal + rename), como `lessons.ts`. */
export function saveDuelsMemory(file: string, memory: ReadonlyMap<string, Memory>): void {
  mkdirSync(dirname(file), { recursive: true });
  const duels: Record<string, Memory> = {};
  for (const [id, mem] of memory) duels[id] = mem;
  const text = `${JSON.stringify({ schema: DUELS_STATE_SCHEMA, updated: new Date().toISOString(), duels }, null, 2)}\n`;
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
}

export interface DuelStepEntry {
  duelId: number | string;
  role: Duel["role"];
  issues: string[];
  limit: number;
  rival?: StructuredOffer;
  ticksLeft?: number;
  decision: DuelDecision;
  /** Lo que se hizo: enviado, simulado (dry-run), aplazado (otra aceptación en este tick) o error. */
  outcome: "sent" | "dry-run" | "deferred" | "skipped" | `error:${string}`;
  assumption?: string;
  /** Si la aceptación falló con no_offer: resultado de la contraoferta que iguala la oferta del rival. */
  fallback?: string;
}

export interface DuelStepReport {
  tick: number;
  entries: DuelStepEntry[];
}

/** Decisión de un duelo vivo, aún sin ejecutar. */
export interface PlannedDuel {
  duel: Duel;
  state: DuelState;
  rival?: StructuredOffer;
  assumption?: string;
  decision: DuelDecision;
  /** Ya actuamos en este duelo en este tick. */
  already: boolean;
}

export interface DuelProposal {
  clock: Clock;
  planned: PlannedDuel[];
}

export interface DuelsAgentOptions {
  dryRun: boolean;
  params?: Partial<DuelParams>;
  now?: () => number;
  /** Fichero de memoria persistida (rename atómico); si se da, se carga al construir y se reescribe tras cada tick con POSTs. */
  stateFile?: string;
}

/** Tics hasta `deadline`: número de tick (o epoch en s/ms) o fecha ISO; `undefined` si no se entiende. */
export function ticksLeft(deadline: Duel["deadline"], clock: Pick<Clock, "tick" | "tick_seconds">, nowMs: number): number | undefined {
  if (deadline === null || deadline === undefined) return undefined;
  const tickSeconds = clock.tick_seconds && clock.tick_seconds > 0 ? clock.tick_seconds : 60;
  let ms: number | undefined;
  if (typeof deadline === "string") {
    const parsed = Date.parse(deadline);
    if (Number.isNaN(parsed)) return undefined;
    ms = parsed;
  } else if (deadline > 1e12) ms = deadline;
  else if (deadline > 1e9) ms = deadline * 1000;
  else return Math.max(0, deadline - clock.tick);
  return Math.max(0, Math.floor((ms - nowMs) / 1000 / tickSeconds));
}

const FINISHED = new Set(["done", "settled", "closed", "expired", "deal", "no_deal", "accepted", "failed"]);

const sameOffer = (a: StructuredOffer | undefined, b: StructuredOffer | undefined) => !!a && !!b && a.price === b.price && a.days === b.days;

export class DuelsAgent {
  private readonly memory: Map<string, Memory>;
  readonly params: DuelParams;
  private readonly now: () => number;

  constructor(
    private readonly api: DuelsApi,
    private readonly options: DuelsAgentOptions,
  ) {
    this.params = { ...DEFAULT_DUEL_PARAMS, ...options.params };
    this.now = options.now ?? Date.now;
    this.memory = options.stateFile ? loadDuelsMemory(options.stateFile) : new Map();
  }

  private key(duelId: number | string): string {
    return String(duelId);
  }

  /** Estado puro de un duelo a partir de la respuesta del servidor y de la memoria (sin mutarla en dry-run). */
  stateOf(duel: Duel, clock: Clock): { state: DuelState; rival?: StructuredOffer; assumption?: string } {
    const mem = this.memory.get(this.key(duel.id)) ?? { ourOffers: [], rivalOffers: [], rivalMovedSinceOurLast: false };
    const withDays = duel.issues.includes("days");
    const days = withDays ? daysValueFrom(duel.your_days_weight, this.params) : { table: [] as number[] };
    const rival = rivalOfferFrom(duel);
    const rivalOffers = [...mem.rivalOffers];
    let moved = mem.rivalMovedSinceOurLast;
    if (rival && !sameOffer(rival, rivalOffers.at(-1))) {
      rivalOffers.push(rival);
      moved = true;
    }
    // Sin memoria para este duelo (duelo nuevo o reinicio sin fichero de estado): se lee `your_offer`
    // del servidor como nuestra última oferta, para no reabrir con un ancla nueva ni repetir el primer mensaje.
    const ourOffers = mem.ourOffers.length === 0 ? [...(ourOfferFrom(duel) ? [ourOfferFrom(duel)!] : [])] : mem.ourOffers;
    const lastOurTick = mem.lastOurTick ?? (ourOffers.length > 0 ? (duel.your_offer?.tick ?? undefined) : undefined);
    const left = ticksLeft(duel.deadline, clock, this.now());
    const state: DuelState = {
      role: duel.role,
      limit: duel.your_limit,
      withDays,
      daysValue: withDays ? days.table : Array.from({ length: 11 }, () => 0),
      ourOffers,
      rivalOffers,
      rivalMovedSinceOurLast: moved,
      concessionsSinceRival: concessionsSinceRival(duel.messages ?? []),
      ...(typeof duel.decay_per_round === "number" ? { decay: duel.decay_per_round } : {}),
      ...(lastOurTick !== undefined ? { ticksSinceOurLast: clock.tick - lastOurTick } : {}),
      ...(left !== undefined ? { ticksLeft: left } : {}),
    };
    return { state, ...(rival ? { rival } : {}), ...("assumption" in days && days.assumption ? { assumption: days.assumption } : {}) };
  }

  /** Propuesta del tick sin enviar nada: reloj y decisión de cada duelo vivo (solo GET). */
  async propose(): Promise<DuelProposal> {
    const clock = await this.api.clock();
    const { duels } = await this.api.duels();
    const live = duels.filter((d) => !d.status || !FINISHED.has(d.status));
    const planned = live
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
      .map((duel) => {
        const { state, rival, assumption } = this.stateOf(duel, clock);
        const mem = this.memory.get(this.key(duel.id));
        const already = mem?.lastActionTick === clock.tick;
        return { duel, state, ...(rival ? { rival } : {}), ...(assumption ? { assumption } : {}), decision: decideDuel(state, this.params), already };
      });
    return { clock, planned };
  }

  /** Paso autónomo (`pnpm bazaar:duels`): una aceptación por tick, la de más excedente; el resto espera. */
  async step(): Promise<DuelStepReport> {
    const proposal = await this.propose();
    const accepts = proposal.planned
      .filter((p) => p.decision.action === "accept" && !p.already)
      .sort((a, b) => b.decision.surplus - a.decision.surplus)
      .map((p) => p.duel.id);
    return this.execute(proposal, { accepts });
  }

  /**
   * Ejecuta una propuesta. `accepts`: duelos cuya aceptación se intenta, en orden; como mucho una sale (si falla,
   * p. ej. no_offer, se prueba la siguiente). Las demás aceptaciones quedan aplazadas. `messages`: si se da, solo
   * esos duelos envían su mensaje (el coordinador reparte el cupo); los demás quedan `skipped`.
   */
  async execute(proposal: DuelProposal, choice: { accepts: readonly (number | string)[]; messages?: ReadonlySet<string> }): Promise<DuelStepReport> {
    const { clock, planned } = proposal;
    const byId = new Map(planned.map((p) => [this.key(p.duel.id), p]));
    let acceptDone = false;

    const entries: DuelStepEntry[] = [];
    for (const p of planned) {
      const entry: DuelStepEntry = {
        duelId: p.duel.id,
        role: p.duel.role,
        issues: p.duel.issues,
        limit: p.duel.your_limit,
        ...(p.rival ? { rival: p.rival } : {}),
        ...(p.state.ticksLeft !== undefined ? { ticksLeft: p.state.ticksLeft } : {}),
        decision: p.decision,
        outcome: "skipped",
        ...(p.assumption ? { assumption: p.assumption } : {}),
      };
      entries.push(entry);
      if (p.already || p.decision.action === "wait") continue;
      if (p.decision.action === "accept") {
        entry.outcome = "deferred"; // se resuelven abajo, en el orden dado
        continue;
      }
      if (choice.messages && !choice.messages.has(this.key(p.duel.id))) continue;
      if (this.options.dryRun) {
        entry.outcome = "dry-run";
        continue;
      }
      entry.outcome = await this.act(p.duel.id, p.decision, p.state, clock.tick);
    }
    for (const id of choice.accepts) {
      const p = byId.get(this.key(id));
      const entry = entries.find((e) => this.key(e.duelId) === this.key(id));
      if (!p || !entry || p.already || p.decision.action !== "accept" || acceptDone) continue;
      if (this.options.dryRun) {
        entry.outcome = "dry-run";
        acceptDone = true;
        continue;
      }
      entry.outcome = await this.act(p.duel.id, p.decision, p.state, clock.tick);
      if (entry.outcome === "sent") acceptDone = true;
      // no_offer: nuestra contraoferta posterior anuló la oferta del rival (rival_offer queda obsoleta).
      // No se puede aceptar, pero sí igualarla: proponemos exactamente su precio/días y el rival la cierra.
      else if (entry.outcome === "error:no_offer" && p.rival && !sameOffer(p.rival, p.state.ourOffers.at(-1))) {
        const offer: StructuredOffer = { ...p.rival };
        // Con días, el mensaje siempre lleva `days` (si no, missing_days): si su oferta no los trae, nuestro mejor día.
        if (p.state.withDays && offer.days === undefined) offer.days = DAYS_MIN + p.state.daysValue.indexOf(Math.max(...p.state.daysValue));
        // Guardarraíl: nunca se iguala una oferta fuera de nuestro límite.
        if (!withinLimit(p.state, offer)) {
          entry.fallback = "match skipped: outside our limit";
          continue;
        }
        const terms = p.state.withDays ? `${offer.price} P with ${offer.days} days` : `${offer.price} P`;
        const match: DuelDecision = {
          action: "counter",
          offer,
          text: `You have a deal at your number: ${terms}. Happy to close it now.`,
          rule: "match-stale",
          surplus: p.decision.surplus,
          round: p.state.ourOffers.length,
        };
        if (!textMatchesOffer(match.text!, offer)) {
          entry.fallback = "match skipped: text and offer differ";
          continue;
        }
        entry.fallback = `match ${terms}: ${await this.act(p.duel.id, match, p.state, clock.tick)}`;
      }
    }
    if (!this.options.dryRun && this.options.stateFile) saveDuelsMemory(this.options.stateFile, this.memory);
    return { tick: clock.tick, entries };
  }

  private async act(duelId: number | string, decision: DuelDecision, state: DuelState, tick: number): Promise<DuelStepEntry["outcome"]> {
    const key = this.key(duelId);
    const mem: Memory = this.memory.get(key) ?? { ourOffers: [], rivalOffers: [], rivalMovedSinceOurLast: false };
    mem.rivalOffers = [...state.rivalOffers];
    try {
      if (decision.action === "accept") {
        await this.api.accept(duelId);
      } else if (decision.offer && decision.text !== undefined) {
        await this.api.say(duelId, decision.text, decision.offer);
        mem.ourOffers = [...mem.ourOffers, decision.offer];
        mem.lastOurTick = tick;
        mem.rivalMovedSinceOurLast = false;
      }
      mem.lastActionTick = tick;
      this.memory.set(key, mem);
      return "sent";
    } catch (e) {
      this.memory.set(key, { ...mem, rivalMovedSinceOurLast: state.rivalMovedSinceOurLast });
      if (e instanceof BazaarError) return `error:${e.code}`;
      throw e;
    }
  }
}

/** Una línea legible por entrada (dry-run y log del bucle). Muestra nuestro límite solo en la consola local. */
export function formatDuelEntry(e: DuelStepEntry, withDays = e.issues.includes("days")): string {
  const fmt = (o: StructuredOffer | undefined) => (o ? (withDays ? `${o.price} P/day ${o.days ?? "?"}` : `${o.price} P`) : "-");
  const d = e.decision;
  const what =
    d.action === "accept"
      ? `ACCEPT rival ${fmt(e.rival)} (surplus ${d.surplus.toFixed(1)}, ${d.rule})`
      : d.action === "wait"
        ? `WAIT (${d.rule})`
        : `COUNTER ${fmt(d.offer)} (surplus ${d.surplus.toFixed(1)}, round ${d.round}, ${d.rule}) "${d.text}"`;
  const head = `duel ${e.duelId} · ${e.role} · ${e.issues.join("+")} · limit ${e.limit} · rival ${fmt(e.rival)} · ticks left ${e.ticksLeft ?? "?"}`;
  return `${head}\n  → ${what} [${e.outcome}]${e.fallback ? ` → ${e.fallback}` : ""}${e.assumption ? `\n  assumption: ${e.assumption}` : ""}`;
}

/** "no duels scheduled now" y la próxima sesión de duelos de `/api/schedule` (tics y minutos aproximados al ritmo actual). */
export function formatNextDuels(schedule: Schedule, clock: Pick<Clock, "tick_seconds">): string {
  const now = schedule.now_hours ?? 0;
  const next = schedule.upcoming.filter((u) => u.action === "duels" && u.at_hours >= now).sort((a, b) => a.at_hours - b.at_hours)[0];
  if (!next) return "no duels scheduled now · no upcoming duels in /api/schedule";
  const params = next.params ?? {};
  const name = typeof params.name === "string" ? params.name : next.note ?? "duels";
  const issues = Array.isArray(params.issues) ? params.issues.join("+") : "price";
  const ticks = Math.round((next.at_hours - now) * 60);
  const tickSeconds = clock.tick_seconds ?? 60;
  const extras = [
    issues,
    typeof params.duel_ticks === "number" ? `${params.duel_ticks} ticks per duel` : undefined,
    typeof params.decay === "number" ? `decay ${Math.round(params.decay * 100)}%/round` : undefined,
    typeof params.max_concurrent === "number" ? `max ${params.max_concurrent} at once` : undefined,
    params.practice === true ? "practice (not scored)" : undefined,
  ].filter(Boolean);
  return `no duels scheduled now · next: "${name}" at ${next.at_hours.toFixed(2)} h (now ${now.toFixed(2)} h; in ~${ticks} ticks ≈ ${Math.round((ticks * tickSeconds) / 60)} min at ${tickSeconds} s/tick) · ${extras.join(" · ")}`;
}
