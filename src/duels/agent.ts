import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { BazaarError } from "../shared/client.js";
import { DAYS_MIN, DEFAULT_DUEL_PARAMS, daysValueFrom, decideDuel, textMatchesOffer, withinLimit, type DuelDecision, type DuelParams, type DuelState } from "./duels.js";
import { concessionsSinceRival, ourOfferFrom, rivalOfferFrom, type Duel, type DuelsApi, type Schedule, type StructuredOffer } from "./schemas.js";
import type { Clock } from "../shared/schemas.js";
import { liveTraceDir } from "../shared/trace.js";

/**
 * Duel loop: one step per tick. Reads `/api/duels`, decides each duel with `decideDuel` and sends
 * at most one message and one acceptance per duel per tick (duel accepts have their own limits, outside the team
 * accept quota). Per-duel memory (our offers and the rival's) lives
 * in the process and, if `stateFile` is given, on disk too (atomic write after each tick with POSTs)
 * so a restart recovers it instead of reopening or conceding again from scratch. The rival's
 * offer is read from `rival_offer` or, if missing, from their last message (`rivalOfferFrom`); ours,
 * from memory or, if there is no memory for that duel (restart without a file), from `your_offer`
 * (`ourOfferFrom`), to avoid reopening with a new anchor or repeating the first message. In `dryRun` there
 * are no POSTs and memory (and the file) is not touched.
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

/** `results/bazaar-live/<date>/duels-state.json`: where memory persists if no other file is given. */
export function defaultDuelsStateFile(root: string, now: Date = new Date()): string {
  return join(liveTraceDir(root, now), "duels-state.json");
}

/** Loads the persisted memory; empty if the file does not exist or is invalid (never throws). */
export function loadDuelsMemory(file: string): Map<string, Memory> {
  const map = new Map<string, Memory>();
  if (!existsSync(file)) return map;
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as PersistedDuelsState;
    if (data.schema !== DUELS_STATE_SCHEMA || !data.duels) return map;
    for (const [id, mem] of Object.entries(data.duels)) map.set(id, mem);
  } catch {
    // Corrupt or unreadable file: start without memory (the server payload still provides rival_offer/your_offer).
  }
  return map;
}

/** Saves all memory with an atomic rename (temp file + rename), like `lessons.ts`. */
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
  /** What was done: sent, simulated (dry-run), deferred (another acceptance this tick) or error. */
  outcome: "sent" | "dry-run" | "deferred" | "skipped" | `error:${string}`;
  assumption?: string;
  /** If the acceptance failed with no_offer: result of the counteroffer that matches the rival's offer. */
  fallback?: string;
}

export interface DuelStepReport {
  tick: number;
  entries: DuelStepEntry[];
}

/** Decision for a live duel, not yet executed. */
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
  /** Persisted memory file (atomic rename); if given, it is loaded on construction and rewritten after each tick with POSTs. */
  stateFile?: string;
}

/** Ticks until `deadline`: tick number (or epoch in s/ms) or ISO date; `undefined` if not understood. */
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

  /** Pure state of a duel from the server response and memory (without mutating it in dry-run). */
  stateOf(duel: Duel, clock: Clock): { state: DuelState; rival?: StructuredOffer; assumption?: string; paused?: boolean } {
    const mem = this.memory.get(this.key(duel.id)) ?? { ourOffers: [], rivalOffers: [], rivalMovedSinceOurLast: false };
    // A days weight or meaning means the duel negotiates days even if `issues` is missing (it defaults to price).
    const withDays = duel.issues.includes("days") || duel.your_days_weight != null || duel.days_meaning != null;
    const days: ReturnType<typeof daysValueFrom> = withDays ? daysValueFrom(duel.your_days_weight, this.params, duel.days_meaning) : { table: [] };
    const paused = withDays && days.unreadable === true && this.params.pauseOnUnreadableDays;
    const rival = rivalOfferFrom(duel);
    const rivalOffers = [...mem.rivalOffers];
    let moved = mem.rivalMovedSinceOurLast;
    if (rival && !sameOffer(rival, rivalOffers.at(-1))) {
      rivalOffers.push(rival);
      moved = true;
    }
    // No memory for this duel (new duel or restart without a state file): `your_offer` is read
    // from the server as our last offer, to avoid reopening with a new anchor or repeating the first message.
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
    const assumption = paused ? `PAUSED (no message, no accept): ${days.assumption}; rerun with --assumed-days-weight to play` : days.assumption;
    return { state, ...(rival ? { rival } : {}), ...(assumption ? { assumption } : {}), ...(paused ? { paused } : {}) };
  }

  /** Tick proposal without sending anything: clock and decision for each live duel (GET only). */
  async propose(): Promise<DuelProposal> {
    const clock = await this.api.clock();
    const { duels } = await this.api.duels();
    const live = duels.filter((d) => !d.status || !FINISHED.has(d.status));
    const planned = live
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
      .map((duel) => {
        const { state, rival, assumption, paused } = this.stateOf(duel, clock);
        const mem = this.memory.get(this.key(duel.id));
        const already = mem?.lastActionTick === clock.tick;
        if (paused) console.error(`duel ${duel.id}: ${assumption}`);
        const decision: DuelDecision = paused ? { action: "wait", rule: "days-unreadable", surplus: 0, round: state.ourOffers.length } : decideDuel(state, this.params);
        return { duel, state, ...(rival ? { rival } : {}), ...(assumption ? { assumption } : {}), decision, already };
      });
    return { clock, planned };
  }

  /** Autonomous step (`pnpm bazaar:duels`): every accepting duel accepts this tick (duels have their own accept limits). */
  async step(): Promise<DuelStepReport> {
    const proposal = await this.propose();
    const accepts = proposal.planned
      .filter((p) => p.decision.action === "accept" && !p.already)
      .sort((a, b) => b.decision.surplus - a.decision.surplus)
      .map((p) => p.duel.id);
    return this.execute(proposal, { accepts });
  }

  /**
   * Executes a proposal. `accepts`: duels whose acceptance is attempted, in order, one per duel (duel accepts have their
   * own limits and do not use the team quota; on no_offer, the rival's offer is matched instead). Accepting duels not in
   * `accepts` are deferred. `messages`: if given, only
   * those duels send their message (the coordinator allocates the quota); the rest are `skipped`.
   */
  async execute(proposal: DuelProposal, choice: { accepts: readonly (number | string)[]; messages?: ReadonlySet<string> }): Promise<DuelStepReport> {
    const { clock, planned } = proposal;
    const byId = new Map(planned.map((p) => [this.key(p.duel.id), p]));

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
        entry.outcome = "deferred"; // resolved below, in the given order
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
      if (!p || !entry || p.already || p.decision.action !== "accept" || entry.outcome !== "deferred") continue;
      if (this.options.dryRun) {
        entry.outcome = "dry-run";
        continue;
      }
      entry.outcome = await this.act(p.duel.id, p.decision, p.state, clock.tick);
      // no_offer: our later counteroffer voided the rival's offer (rival_offer is stale).
      // We can't accept it, but we can match it: we propose exactly their price/days and the rival closes it.
      if (entry.outcome === "error:no_offer" && p.rival && !sameOffer(p.rival, p.state.ourOffers.at(-1))) {
        const offer: StructuredOffer = { ...p.rival };
        // With days, the message always carries `days` (otherwise missing_days): if their offer has none, our best day.
        if (p.state.withDays && offer.days === undefined) offer.days = DAYS_MIN + p.state.daysValue.indexOf(Math.max(...p.state.daysValue));
        // Guardrail: never match an offer outside our limit.
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

/** One readable line per entry (dry-run and loop log). Shows our limit only on the local console. */
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

/** "no duels scheduled now" and the next duel session from `/api/schedule` (ticks and minutes approximated at the current pace). */
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
