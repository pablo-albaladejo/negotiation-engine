import type { PersonaEstimates } from "../dealers/history/persona-fit.js";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { traitsOf, type DealerTraits } from "../dealers/dealer-profile.js";
import { liveTraceDir } from "../shared/trace.js";
import type { Catalog } from "../shared/schemas.js";
import type { Conversation } from "./conversation.js";
import type { HintLine } from "../hints/corpus.js";

/**
 * Mundo alrededor de las negociaciones: personas (dealers y las que vayan apareciendo), easter eggs, badges,
 * regalos y flags. Todo sale de GET (`/api/dealers`, `/api/levels`, `/api/feed`, `/api/catalog`, hilos) y de dos
 * memorias locales: `personas.json` (pistas oídas y probes de eggs) y `flags.json` (flags enviados).
 *
 * Las personas NO son una lista fija: hoy hay dos, RULES habla de cinco y las nuevas llegan por `/api/levels` y
 * el feed (`level.announced`, `level.activated`, `level.unlocked`). Aquí no hay ningún id de persona escrito a mano.
 *
 * Pistas: vienen del corpus (`src/hints/corpus.ts`), segunda excepción estrecha a «del rival solo se lee la
 * estructura»; nunca dan una cifra ni cambian una decisión de precio.
 */

export type PersonaType = "dealer" | "collector" | "trickster" | "banker";
export type PersonaStatus = "announced" | "active" | "unlocked-for-us" | "closed";
const PERSONA_TYPES: readonly PersonaType[] = ["dealer", "collector", "trickster", "banker"];


export interface EggProbe {
  phrase: string;
  tick: number;
  result?: string;
  /** Eggs que le quedan a la persona tras el probe, si se sabe. */
  capLeft?: number;
}

export interface Persona {
  id: string;
  name?: string;
  type: PersonaType;
  status: PersonaStatus;
  level?: number;
  unlock: { always?: boolean; earlyDealsWith?: string; earlyMinDeals?: number; earlyMinLevel?: number; openToAllAt?: string };
  /** Progreso nuestro hacia el desbloqueo temprano: tratos NEGOCIADOS con `earlyDealsWith` (a precio de apertura no cuentan). */
  progress?: { dealer: string; deals: number; needed: number };
  /** Premio del desbloqueo (`unlock_reward_pack`), si la API lo expone. */
  unlockPrize?: string;
  /** Rasgos públicos; para una persona nueva, el negociador deriva sus parámetros de aquí (`negotiatorForDealer`). */
  traits: DealerTraits;
  teaser?: string;
  /** Líneas del dealer del corpus de pistas (`src/hints/`), las más recientes primero, con su marca de candidata. */
  hints: HintLine[];
  eggProbes: EggProbe[];
  /** Trickster: el detector de flags mira desde el primer mensaje (en el resto se salta la apertura). */
  flagsFromFirstMessage: boolean;
  /** Estrategia estimada de la persona y límite por banda (`src/dealers/history/persona-fit.ts`). Privado. */
  estimates?: PersonaEstimates;
}

export interface EggFind {
  team?: string;
  persona?: string;
  tick: number;
  prize?: string;
}

/** ASSUMPTION: 15 eggs por persona (`max_total`) mientras la API no diga otra cifra. */
export const EGGS_PER_PERSONA_ASSUMPTION = 15;

export interface WorldEggs {
  /** Por persona: hallazgos de otros equipos y eggs que quedan. */
  byPersona: Record<string, { foundByOthers: EggFind[]; left: number; leftAssumed: boolean }>;
}

export interface Gift {
  from?: string;
  tick: number;
  cash?: number;
  cards?: number;
  packs?: number;
  reason?: string;
}

export interface FlagRecord {
  messageId: number | string;
  reason: string;
  tick: number;
  persona?: string;
  result?: "hit" | "miss" | "pending";
  points?: number;
}

export interface OursWorld {
  eggs: EggFind[];
  badges: string[];
  hiddenCards: string[];
  gifts: Gift[];
  flags: { sent: FlagRecord[]; balance: number };
}

export interface FeedEvent {
  id?: number;
  tick: number;
  type: string;
  actor?: string;
  payload: Record<string, unknown>;
}

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" && x.length > 0 ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});
const count = (x: unknown): number | undefined => (Array.isArray(x) ? x.length : num(x));

/** `/api/feed` tolerante: `{events: [...]}` o una lista; un evento raro se ignora. */
export function parseFeed(raw: unknown): FeedEvent[] {
  const list = Array.isArray(raw) ? raw : Array.isArray(obj(raw).events) ? (obj(raw).events as unknown[]) : [];
  return list.flatMap((e) => {
    const o = obj(e);
    const type = str(o.type);
    const tick = num(o.tick);
    if (!type || tick === undefined) return [];
    return [{ ...(num(o.id) !== undefined ? { id: num(o.id)! } : {}), tick, type, ...(str(o.actor) ? { actor: str(o.actor)! } : {}), payload: obj(o.payload) }];
  });
}

const personaOf = (e: FeedEvent) => str(e.payload.persona) ?? str(e.payload.dealer) ?? e.actor;
const prizeOf = (p: Record<string, unknown>) => str(p.prize) ?? str(p.reward) ?? str(p.badge) ?? str(p.card) ?? (num(p.cash) !== undefined ? `${num(p.cash)} P` : undefined);

/** Eggs del mundo y lo nuestro (eggs, badges, cartas ocultas, regalos, resultado de flags) desde el feed. */
export function worldFromFeed(events: readonly FeedEvent[], team: string | undefined, personaIds: readonly string[], heldRefs: readonly string[], catalog: Catalog | undefined, flags: readonly FlagRecord[]): { eggs: WorldEggs; ours: OursWorld } {
  const byPersona: WorldEggs["byPersona"] = {};
  const slot = (p: string) => (byPersona[p] ??= { foundByOthers: [], left: EGGS_PER_PERSONA_ASSUMPTION, leftAssumed: true });
  for (const p of personaIds) slot(p);
  const ours: OursWorld = { eggs: [], badges: [], hiddenCards: [], gifts: [], flags: { sent: flags.map((f) => ({ ...f })), balance: 0 } };
  const foundPerPersona = new Map<string, number>();
  for (const e of events) {
    const who = str(e.payload.team);
    if (e.type === "egg.found" || e.type === "egg.given") {
      const persona = personaOf(e);
      const find: EggFind = { ...(who ? { team: who } : {}), ...(persona ? { persona } : {}), tick: e.tick, ...(prizeOf(e.payload) ? { prize: prizeOf(e.payload)! } : {}) };
      if (persona) {
        foundPerPersona.set(persona, (foundPerPersona.get(persona) ?? 0) + 1);
        const max = num(e.payload.max_total);
        if (max !== undefined) Object.assign(slot(persona), { left: max, leftAssumed: false });
      }
      if (who && who === team) ours.eggs.push(find);
      else if (persona) slot(persona).foundByOthers.push(find);
    } else if (e.type === "badge.awarded" && who === team) {
      ours.badges.push(str(e.payload.badge) ?? str(e.payload.name) ?? "?");
    } else if (e.type === "gift.given" && who === team) {
      const g = e.payload;
      ours.gifts.push({ ...(e.actor ? { from: e.actor } : {}), tick: e.tick, ...(num(g.cash) !== undefined ? { cash: num(g.cash)! } : {}), ...(count(g.cards) !== undefined ? { cards: count(g.cards)! } : {}), ...(count(g.packs) !== undefined ? { packs: count(g.packs)! } : {}), ...(str(g.reason) ? { reason: str(g.reason)! } : {}) });
    } else if (e.type.startsWith("flag.") && who === team) {
      // Resultado de un flag nuestro, si el feed lo publica (no visto aún): se casa por message_id.
      const id = e.payload.message_id;
      const rec = ours.flags.sent.find((f) => String(f.messageId) === String(id));
      const points = num(e.payload.points) ?? num(e.payload.delta);
      const hit = e.type.includes("upheld") || e.type.includes("hit") || e.payload.correct === true || (points !== undefined && points > 0);
      if (rec) Object.assign(rec, { result: hit ? "hit" : "miss", ...(points !== undefined ? { points } : {}) });
    }
  }
  for (const [p, n] of foundPerPersona) {
    const s = slot(p);
    s.left = Math.max(0, s.left - n);
  }
  ours.flags.balance = ours.flags.sent.reduce((a, f) => a + (f.points ?? 0), 0);
  const hidden = new Set((catalog?.sets ?? []).flatMap((s) => s.cards.filter((c) => (c as { hidden?: unknown }).hidden === true).map((c) => c.id)));
  ours.hiddenCards = [...new Set(heldRefs.filter((r) => hidden.has(r)))];
  return { eggs: { byPersona }, ours };
}

/** Tipo de persona (`kind` de `/api/dealers`); lo desconocido cuenta como dealer. */
export function personaTypeOf(raw: unknown): PersonaType {
  const k = str(obj(raw).kind) ?? str(obj(raw).type);
  return PERSONA_TYPES.includes(k as PersonaType) ? (k as PersonaType) : "dealer";
}

export interface PersonaMemo {
  eggProbes?: EggProbe[];
}

export interface PersonaInputs {
  dealers: readonly unknown[];
  levels: unknown;
  events: readonly FeedEvent[];
  team?: string;
  unlocked: readonly string[];
  conversations: readonly Conversation[];
  /** Corpus de pistas por persona (más recientes primero). */
  hints: ReadonlyMap<string, HintLine[]>;
  memos: ReadonlyMap<string, PersonaMemo>;
}

/** Tratos negociados con un dealer: hilo cerrado en trato a un precio distinto de su apertura. */
export function negotiatedDeals(conversations: readonly Conversation[], dealer: string): number {
  return conversations.filter((c) => c.kind === "dealer" && c.counterparty === dealer && c.result?.price !== undefined && c.history.herPrices[0] !== undefined && c.result.price !== c.history.herPrices[0]).length;
}

/** Personas del tick: `/api/dealers` + `/api/levels` + eventos de nivel del feed, con estado y progreso de desbloqueo. */
export function buildPersonas(i: PersonaInputs): Persona[] {
  const levels = Array.isArray(obj(i.levels).levels) ? (obj(i.levels).levels as unknown[]).map(obj) : [];
  const ids = new Set<string>();
  for (const d of i.dealers) if (str(obj(d).id)) ids.add(str(obj(d).id)!);
  for (const l of levels) if (str(l.id)) ids.add(str(l.id)!);
  const announced = new Map<string, string | undefined>();
  const activated = new Set<string>();
  const unlockedByFeed = new Set<string>();
  for (const e of i.events) {
    const p = str(e.payload.persona) ?? str(e.payload.id);
    if (!p) continue;
    if (e.type === "level.announced") {
      ids.add(p);
      announced.set(p, str(e.payload.persona_name) ?? str(e.payload.name));
    } else if (e.type === "level.activated") {
      ids.add(p);
      activated.add(p);
    } else if (e.type === "level.unlocked" && str(e.payload.team) === i.team) unlockedByFeed.add(p);
  }
  return [...ids].map((id) => {
    const d = obj(i.dealers.find((x) => obj(x).id === id));
    const l = levels.find((x) => x.id === id) ?? {};
    const u = obj(d.unlock);
    const dStatus = str(d.status) ?? str(l.state);
    const closed = dStatus !== undefined && /closed|retired|gone|ended/i.test(dStatus);
    const status: PersonaStatus = closed
      ? "closed"
      : i.unlocked.includes(id) || unlockedByFeed.has(id)
        ? "unlocked-for-us"
        : dStatus === "announced" || (Object.keys(d).length === 0 && !activated.has(id)) || (d.level === null && !activated.has(id))
          ? "announced"
          : "active";
    const earlyWith = str(u.early_deals_with);
    const earlyMin = num(u.early_min_deals);
    const memo = i.memos.get(id);
    const hints = i.hints.get(id) ?? [];
    const type = personaTypeOf(d);
    const name = str(d.name) ?? str(l.name) ?? announced.get(id);
    const prize = str(d.unlock_reward_pack) ?? str(u.unlock_reward_pack) ?? str(l.unlock_reward_pack);
    return {
      id,
      ...(name ? { name } : {}),
      type,
      status,
      ...(num(d.level) !== undefined ? { level: num(d.level)! } : {}),
      unlock: {
        ...(typeof u.always === "boolean" ? { always: u.always } : {}),
        ...(earlyWith ? { earlyDealsWith: earlyWith } : {}),
        ...(earlyMin !== undefined ? { earlyMinDeals: earlyMin } : {}),
        ...(num(u.early_min_level) !== undefined ? { earlyMinLevel: num(u.early_min_level)! } : {}),
        ...(str(u.open_to_all_at) ? { openToAllAt: str(u.open_to_all_at)! } : num(l.opens_to_all_at_hours) !== undefined ? { openToAllAt: `${num(l.opens_to_all_at_hours)} h` } : {}),
      },
      ...(earlyWith && earlyMin !== undefined ? { progress: { dealer: earlyWith, deals: negotiatedDeals(i.conversations, earlyWith), needed: earlyMin } } : {}),
      ...(prize ? { unlockPrize: prize } : {}),
      traits: traitsOf(d),
      ...(str(l.teaser) ? { teaser: str(l.teaser)! } : {}),
      hints,
      eggProbes: memo?.eggProbes ?? [],
      flagsFromFirstMessage: type === "trickster",
    };
  });
}

// ---------------------------------------------------------------- memoria local

const PERSONAS_SCHEMA = "bazaar-personas/v1";
const FLAGS_SCHEMA = "bazaar-flags/v1";

export const defaultPersonasFile = (root: string, now: Date = new Date()) => join(liveTraceDir(root, now), "personas.json");
export const defaultFlagsFile = (root: string, now: Date = new Date()) => join(liveTraceDir(root, now), "flags.json");

function readJson(file: string, schema: string): Record<string, unknown> | undefined {
  if (!existsSync(file)) return undefined;
  try {
    const data = obj(JSON.parse(readFileSync(file, "utf8")));
    return data.schema === schema ? data : undefined;
  } catch {
    // Fichero corrupto: se arranca vacío (lo estructural sale de la API).
    return undefined;
  }
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, file);
}

export function loadPersonaMemos(file: string): Map<string, PersonaMemo> {
  const personas = obj(readJson(file, PERSONAS_SCHEMA)?.personas);
  return new Map(Object.entries(personas).map(([id, m]) => [id, m as PersonaMemo]));
}

export function savePersonaMemos(file: string, personas: readonly Persona[]): void {
  writeJson(file, { schema: PERSONAS_SCHEMA, updated: new Date().toISOString(), personas: Object.fromEntries(personas.map((p) => [p.id, { eggProbes: p.eggProbes }])) });
}

export function loadFlags(file: string): FlagRecord[] {
  const flags = readJson(file, FLAGS_SCHEMA)?.flags;
  return Array.isArray(flags) ? (flags as FlagRecord[]) : [];
}

export function saveFlags(file: string, flags: readonly FlagRecord[]): void {
  writeJson(file, { schema: FLAGS_SCHEMA, updated: new Date().toISOString(), flags });
}

// ---------------------------------------------------------------- consola

/** «chato: unlocked-for-us · abuela deals 3/3». */
export function formatPersona(p: Persona): string {
  const progress = p.progress ? ` · ${p.progress.dealer} deals ${p.progress.deals}/${p.progress.needed}` : p.unlock.always ? " · always open" : "";
  const extra = [p.type !== "dealer" ? `type ${p.type}` : undefined, p.level !== undefined ? `L${p.level}` : undefined, p.unlock.openToAllAt ? `open to all ${p.unlock.openToAllAt}` : undefined, p.unlockPrize ? `prize ${p.unlockPrize}` : undefined, `hints ${p.hints.length} (${p.hints.filter((h) => h.candidate).length} cand.)`, `probes ${p.eggProbes.length}`, p.flagsFromFirstMessage ? "flags from 1st msg" : undefined, p.estimates ? `fit ${p.estimates.fittedFrom} conv (markup ${p.estimates.opening_markup.mean}, β ${p.estimates.beta.mean}, max_rounds ${p.estimates.max_rounds.mean}, mirror ${p.estimates.mirror}; ${Object.entries(p.estimates.bands).map(([b, e]) => `${b} ${e.limit.mean} [${e.limit.lo}–${e.limit.hi}] n${e.samples}${e.fewSamples ? "?" : ""}`).join(", ")})` : undefined].filter(Boolean);
  return `${p.id}: ${p.status}${progress} · ${extra.join(" · ")}`;
}

export function formatEggsAndFlags(eggs: WorldEggs, ours: OursWorld): string[] {
  const per = Object.entries(eggs.byPersona).map(([p, s]) => `${p} ${s.foundByOthers.length} by others, ${s.left} left${s.leftAssumed ? "*" : ""}`);
  return [
    `eggs: ${per.join(" · ") || "-"}${per.some((x) => x.endsWith("*")) ? ` (* ASSUMPTION: ${EGGS_PER_PERSONA_ASSUMPTION} per persona)` : ""}`,
    `ours: eggs ${ours.eggs.length} · badges ${ours.badges.length ? ours.badges.join(", ") : 0} · hidden cards ${ours.hiddenCards.length ? ours.hiddenCards.join(", ") : 0} · gifts ${ours.gifts.length}${ours.gifts.length ? ` (${ours.gifts.map((g) => `${g.from ?? "?"} t${g.tick}`).join(", ")})` : ""}`,
    `flags: sent ${ours.flags.sent.length} (${ours.flags.sent.filter((f) => f.result === "hit").length} hit, ${ours.flags.sent.filter((f) => f.result === "miss").length} miss) · balance ${ours.flags.balance} P`,
  ];
}
