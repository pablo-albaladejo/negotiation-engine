import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { DealerTraits } from "../dealers/dealer-profile.js";
import { PERSONA_PRIORS, RARITY_BOOK, type PersonaEstimates } from "../dealers/history/persona-fit.js";

/**
 * Model of each persona inside `GameState` (`Persona.model`): one field per YAML parameter (personas.md §1 and §3),
 * with its value, range, sample count, where it comes from and when it last changed. It accumulates tick by tick: the per-
 * persona fit (`src/dealers/history/persona-fit.ts`) WRITES here; the coordinator, the planners and the viewer
 * (`/api/bazaar/model`, `personas[].model`) READ from here. Structure only (prices, warnings, findings); never a figure
 * taken from text. What cannot be observed (templates, model, prompt_base, voice, knowledge) is absent: see `UNOBSERVABLE`.
 * Private: never appears in a message.
 */

export type FieldSource = "measured" | "prior" | "public" | "unknown";

export interface Field<T = number> {
  value: T | null;
  lo: number | null;
  hi: number | null;
  n: number;
  source: FieldSource;
  /** Last tick at which the value (or range) changed. */
  lastTick: number;
}

export interface BandModel {
  /** `floor_frac` (she sells) or `ceiling_frac` (she buys): limit measured as a fraction of the book (of the list price for a pack). */
  frac: Field;
  /** The same limit in P. */
  limit: Field;
}

export interface PersonaModel {
  id: string;
  updated: number;
  /** Known exactly (public API). */
  public: {
    kind?: string;
    level?: number;
    traits: DealerTraits;
    deals_per_team_per_hour?: number;
    unlock: { always?: boolean; early_deals_with?: string; early_min_deals?: number; early_min_level?: number; open_to_all_at?: string };
    menu: { sells: MenuLine[]; buys: MenuLine[] };
  };
  /** One field per `strategy` key of the YAML (the markups and the welcome, per side). */
  strategy: {
    opening_markup_sell: Field;
    opening_markup_buy: Field;
    beta: Field;
    max_rounds: Field;
    walk_after_rounds: Field;
    patience_jitter: Field;
    accept_margin: Field;
    mirror_concessions: Field<boolean>;
    welcome_first_deal: Field<boolean>;
    welcome_price_frac_sell: Field;
    welcome_price_frac_buy: Field;
    limit_jitter: Field;
    demand_markup: Field;
    politeness_discount: Field;
  };
  /** Per band `sells:<rarity>` / `buys:<rarity>`. */
  bands: Record<string, BandModel>;
  trades: { stock_per_hour: Field; budget_per_hour: Field };
  anti_cheat: { strikes_seen: Field; cooloff_seen: Field };
  trickster: { trap_seen: Field; switch_seen: Field };
  fired: { hints: Field; eggs: Field };
}

export interface MenuLine {
  pack?: string;
  card?: string;
  rarity?: string;
  sets?: string | string[];
  list_price?: number;
  opening_ask?: number;
  per_team_per_hour?: number;
}

/** YAML keys the API never lets us see: they are not modeled. */
export const UNOBSERVABLE = ["templates", "model", "prompt_base", "voice", "knowledge"] as const;

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" && x.length > 0 ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

export const unknownField = <T = number>(tick: number): Field<T> => ({ value: null, lo: null, hi: null, n: 0, source: "unknown", lastTick: tick });

/** Keeps `lastTick` if the field did not change from the previous tick. */
function settle<T>(next: Omit<Field<T>, "lastTick">, prev: Field<T> | undefined, tick: number): Field<T> {
  const same = prev && prev.value === next.value && prev.lo === next.lo && prev.hi === next.hi && prev.source === next.source;
  return { ...next, lastTick: same ? prev.lastTick : tick };
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;

function rangeField(r: { mean: number; lo: number; hi: number } | undefined, n: number, source: FieldSource, prev: Field | undefined, tick: number): Field {
  if (!r || source === "unknown") return settle({ value: null, lo: null, hi: null, n: 0, source: "unknown" }, prev, tick);
  return settle({ value: r3(r.mean), lo: r3(r.lo), hi: r3(r.hi), n, source }, prev, tick);
}

function scalarField<T extends number | boolean>(v: T | undefined, n: number, source: FieldSource, prev: Field<T> | undefined, tick: number): Field<T> {
  if (v === undefined || source === "unknown") return settle<T>({ value: null, lo: null, hi: null, n: 0, source: "unknown" }, prev, tick);
  const x = typeof v === "number" ? r3(v) : v;
  return settle<T>({ value: x as T, lo: typeof x === "number" ? x : null, hi: typeof x === "number" ? x : null, n, source }, prev, tick);
}

/** A counter that only goes up (warnings, findings...): what has been seen so far. */
function counter(seen: number, prev: Field | undefined, tick: number): Field {
  const n = Math.max(seen, prev?.n ?? 0);
  return settle({ value: n, lo: n, hi: n, n, source: "measured" }, prev, tick);
}

export interface PersonaModelInput {
  id: string;
  /** Entry from `/api/dealers` (public only). */
  raw: Record<string, unknown>;
  traits: DealerTraits;
  estimates?: PersonaEstimates;
  /** Strikes and cooloffs seen in conversations with this persona. */
  strikes: number;
  cooloffs: number;
  hintsFired: number;
  eggsFired: number;
  /** Correct flags about this persona (by reason text) such as pressure traps or swapped cards. */
  trapsSeen: number;
  switchesSeen: number;
  tick: number;
  prev?: PersonaModel | undefined;
}

function menuLines(x: unknown): MenuLine[] {
  return (Array.isArray(x) ? x : []).map((l) => {
    const o = obj(l);
    return {
      ...(str(o.pack) ? { pack: str(o.pack)! } : {}),
      ...(str(o.card) ? { card: str(o.card)! } : {}),
      ...(str(o.rarity) ? { rarity: str(o.rarity)! } : {}),
      ...(typeof o.sets === "string" || Array.isArray(o.sets) ? { sets: o.sets as string | string[] } : {}),
      ...(num(o.list_price) !== undefined ? { list_price: num(o.list_price)! } : {}),
      ...(num(o.opening_ask) !== undefined ? { opening_ask: num(o.opening_ask)! } : {}),
      ...(num(o.per_team_per_hour) !== undefined ? { per_team_per_hour: num(o.per_team_per_hour)! } : {}),
    };
  });
}

/** Builds the tick's model from the fit (`estimates`), the public data and what was seen; accumulates over `prev`. */
export function buildPersonaModel(i: PersonaModelInput): PersonaModel {
  const { tick, prev, estimates: e } = i;
  const hasPrior = PERSONA_PRIORS[i.id] !== undefined;
  // With own data (or from the posterior) → measured; only with the offline prior → prior; with nothing → unknown.
  const n = e?.fittedFrom ?? 0;
  const fitted: FieldSource = n > 0 ? "measured" : hasPrior ? "prior" : "unknown";
  const priorOnly: FieldSource = hasPrior ? "prior" : "unknown";
  const s = prev?.strategy;
  const u = obj(i.raw.unlock);
  const menu = obj(i.raw.menu);

  const welcome = e?.welcome;
  const welcomeFrac = (side: "buys" | "sells"): Field => {
    if (!welcome || welcome.side !== side) return settle({ value: null, lo: null, hi: null, n: 0, source: "unknown" }, side === "buys" ? s?.welcome_price_frac_buy : s?.welcome_price_frac_sell, tick);
    // Welcome price as part of the book: selling, at most this fraction; buying, at least 2 − fraction.
    const f = side === "sells" ? welcome.frac_of_book : { mean: 2 - welcome.frac_of_book.mean, lo: 2 - welcome.frac_of_book.hi, hi: 2 - welcome.frac_of_book.lo };
    return rangeField(f, welcome.n, welcome.n > 0 ? "measured" : "prior", side === "buys" ? s?.welcome_price_frac_buy : s?.welcome_price_frac_sell, tick);
  };

  const bands: Record<string, BandModel> = {};
  for (const [band, b] of Object.entries(e?.bands ?? {})) {
    const book = RARITY_BOOK[band.split(":")[1] ?? ""];
    const pb = prev?.bands[band];
    const src: FieldSource = n > 0 && b.samples > (PERSONA_PRIORS[i.id]?.bands?.[band]?.n ?? 0) ? "measured" : hasPrior ? "prior" : "measured";
    bands[band] = {
      limit: rangeField(b.limit, b.samples, src, pb?.limit, tick),
      frac: book ? rangeField({ mean: b.limit.mean / book, lo: b.limit.lo / book, hi: b.limit.hi / book }, b.samples, src, pb?.frac, tick) : unknownField(tick),
    };
  }

  const mirror = e?.mirror;
  return {
    id: i.id,
    updated: tick,
    public: {
      ...(str(i.raw.kind) ? { kind: str(i.raw.kind)! } : {}),
      ...(num(i.raw.level) !== undefined ? { level: num(i.raw.level)! } : {}),
      traits: i.traits,
      ...(num(menu.deals_per_team_per_hour) !== undefined ? { deals_per_team_per_hour: num(menu.deals_per_team_per_hour)! } : {}),
      unlock: {
        ...(typeof u.always === "boolean" ? { always: u.always } : {}),
        ...(str(u.early_deals_with) ? { early_deals_with: str(u.early_deals_with)! } : {}),
        ...(num(u.early_min_deals) !== undefined ? { early_min_deals: num(u.early_min_deals)! } : {}),
        ...(num(u.early_min_level) !== undefined ? { early_min_level: num(u.early_min_level)! } : {}),
        ...(str(u.open_to_all_at) ? { open_to_all_at: str(u.open_to_all_at)! } : {}),
      },
      menu: { sells: menuLines(menu.sells), buys: menuLines(menu.buys) },
    },
    strategy: {
      opening_markup_sell: rangeField(e?.opening_markup, n, fitted, s?.opening_markup_sell, tick),
      opening_markup_buy: rangeField(e?.opening_markup_buy ?? e?.opening_markup, n, fitted, s?.opening_markup_buy, tick),
      beta: rangeField(e?.beta, n, fitted, s?.beta, tick),
      max_rounds: rangeField(e?.max_rounds, n, fitted, s?.max_rounds, tick),
      walk_after_rounds: rangeField(e?.walk_after_rounds, n, fitted, s?.walk_after_rounds, tick),
      patience_jitter: scalarField(e?.patience_jitter, 0, priorOnly, s?.patience_jitter, tick),
      accept_margin: scalarField(hasPrior ? e?.accept_margin : undefined, 0, priorOnly, s?.accept_margin, tick),
      mirror_concessions: scalarField<boolean>(typeof mirror === "boolean" ? mirror : undefined, n, fitted, s?.mirror_concessions, tick),
      welcome_first_deal: scalarField<boolean>(e?.welcome_first_deal, welcome?.n ?? 0, (welcome?.n ?? 0) > 0 ? "measured" : priorOnly, s?.welcome_first_deal, tick),
      welcome_price_frac_sell: welcomeFrac("sells"),
      welcome_price_frac_buy: welcomeFrac("buys"),
      limit_jitter: scalarField(e?.limit_jitter, 0, priorOnly, s?.limit_jitter, tick),
      demand_markup: unknownField(tick),
      politeness_discount: unknownField(tick),
    },
    bands,
    trades: { stock_per_hour: prev?.trades.stock_per_hour ?? unknownField(tick), budget_per_hour: prev?.trades.budget_per_hour ?? unknownField(tick) },
    anti_cheat: { strikes_seen: counter(i.strikes, prev?.anti_cheat.strikes_seen, tick), cooloff_seen: counter(i.cooloffs, prev?.anti_cheat.cooloff_seen, tick) },
    trickster: { trap_seen: counter(i.trapsSeen, prev?.trickster.trap_seen, tick), switch_seen: counter(i.switchesSeen, prev?.trickster.switch_seen, tick) },
    fired: { hints: counter(i.hintsFired, prev?.fired.hints, tick), eggs: counter(i.eggsFired, prev?.fired.eggs, tick) },
  };
}

// ---------------------------------------------------------------- persistence

const SCHEMA = "bazaar-persona-model/v1";

export const defaultPersonaModelFile = (root: string) => join(root, "results", "bazaar-live", "persona-model.json");

/**
 * Saved models per persona; empty if missing or invalid (never throws). Without a file, the first tick migrates
 * from `persona-posterior.json`: the fit is already rebuilt from observations and the model is built from it.
 */
export function loadPersonaModels(file: string): Record<string, PersonaModel> {
  try {
    if (!existsSync(file)) return {};
    const d = JSON.parse(readFileSync(file, "utf8")) as { schema?: string; personas?: Record<string, PersonaModel> };
    return d.schema === SCHEMA && d.personas ? d.personas : {};
  } catch {
    return {};
  }
}

export function savePersonaModels(file: string, models: Readonly<Record<string, PersonaModel>>): void {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify({ schema: SCHEMA, updated: new Date().toISOString(), personas: models }, null, 2)}\n`);
  renameSync(tmp, file);
}

const f = (x: Field<number | boolean>): string => {
  if (x.value === null) return "?";
  const range = typeof x.value === "number" && x.lo !== null && x.hi !== null && x.lo !== x.hi ? `[${x.lo}–${x.hi}]` : "";
  const tag = x.source === "prior" ? "~" : "";
  return `${tag}${x.value}${range}`;
};

/** One line per persona for play's output. */
export function formatPersonaModel(m: PersonaModel): string {
  const st = m.strategy;
  const bands = Object.entries(m.bands).map(([b, x]) => `${b} ${f(x.frac)}×${x.limit.n}${x.limit.n < 3 ? "?" : ""}`).join(" ");
  const seen = [m.anti_cheat.strikes_seen.n ? `strikes ${m.anti_cheat.strikes_seen.n}` : "", m.anti_cheat.cooloff_seen.n ? `cooloff ${m.anti_cheat.cooloff_seen.n}` : "", m.fired.eggs.n ? `eggs ${m.fired.eggs.n}` : ""].filter(Boolean).join(" ");
  return `model ${m.id}: markup ${f(st.opening_markup_sell)}/${f(st.opening_markup_buy)} β ${f(st.beta)} rounds ${f(st.max_rounds)} walk ${f(st.walk_after_rounds)} mirror ${f(st.mirror_concessions)} welcome ${f(st.welcome_first_deal)}${st.welcome_price_frac_buy.value !== null ? ` (buy ${f(st.welcome_price_frac_buy)})` : ""}${st.welcome_price_frac_sell.value !== null ? ` (sell ${f(st.welcome_price_frac_sell)})` : ""} · bands ${bands || "-"}${seen ? ` · ${seen}` : ""} (~ = prior, ? = unknown)`;
}
