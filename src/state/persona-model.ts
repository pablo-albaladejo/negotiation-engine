import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { DealerTraits } from "../dealers/dealer-profile.js";
import { PERSONA_PRIORS, RARITY_BOOK, type PersonaEstimates } from "../dealers/history/persona-fit.js";

/**
 * Modelo de cada persona dentro de `GameState` (`Persona.model`): un campo por parámetro del YAML (personas.md §1 y §3),
 * con su valor, rango, nº de muestras, de dónde sale y cuándo cambió por última vez. Se acumula tick a tick: el ajuste
 * por persona (`src/dealers/history/persona-fit.ts`) ESCRIBE aquí; el coordinador, los planificadores y el visor
 * (`/api/bazaar/model`, `personas[].model`) LEEN de aquí. Solo estructura (precios, avisos, hallazgos); nunca una cifra
 * sacada de un texto. Lo que no se puede observar (templates, model, prompt_base, voice, knowledge) no está: ver `UNOBSERVABLE`.
 * Privado: nunca sale en un mensaje.
 */

export type FieldSource = "measured" | "prior" | "public" | "unknown";

export interface Field<T = number> {
  value: T | null;
  lo: number | null;
  hi: number | null;
  n: number;
  source: FieldSource;
  /** Último tick en que cambió el valor (o el rango). */
  lastTick: number;
}

export interface BandModel {
  /** `floor_frac` (vende ella) o `ceiling_frac` (compra ella): límite medido como fracción del book (del precio de lista en un sobre). */
  frac: Field;
  /** El mismo límite en P. */
  limit: Field;
}

export interface PersonaModel {
  id: string;
  updated: number;
  /** Conocido con exactitud (API pública). */
  public: {
    kind?: string;
    level?: number;
    traits: DealerTraits;
    deals_per_team_per_hour?: number;
    unlock: { always?: boolean; early_deals_with?: string; early_min_deals?: number; early_min_level?: number; open_to_all_at?: string };
    menu: { sells: MenuLine[]; buys: MenuLine[] };
  };
  /** Un campo por clave de `strategy` del YAML (los markups y la bienvenida, por lado). */
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
  /** Por banda `sells:<rareza>` / `buys:<rareza>`. */
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

/** Claves del YAML que la API nunca deja ver: no se modelan. */
export const UNOBSERVABLE = ["templates", "model", "prompt_base", "voice", "knowledge"] as const;

const num = (x: unknown): number | undefined => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
const str = (x: unknown): string | undefined => (typeof x === "string" && x.length > 0 ? x : undefined);
const obj = (x: unknown): Record<string, unknown> => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {});

export const unknownField = <T = number>(tick: number): Field<T> => ({ value: null, lo: null, hi: null, n: 0, source: "unknown", lastTick: tick });

/** Conserva `lastTick` si el campo no cambió respecto al tick anterior. */
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

/** Un contador que solo sube (avisos, hallazgos...): lo visto hasta ahora. */
function counter(seen: number, prev: Field | undefined, tick: number): Field {
  const n = Math.max(seen, prev?.n ?? 0);
  return settle({ value: n, lo: n, hi: n, n, source: "measured" }, prev, tick);
}

export interface PersonaModelInput {
  id: string;
  /** Entrada de `/api/dealers` (solo lo público). */
  raw: Record<string, unknown>;
  traits: DealerTraits;
  estimates?: PersonaEstimates;
  /** Strikes y cooloffs vistos en las conversaciones con esta persona. */
  strikes: number;
  cooloffs: number;
  hintsFired: number;
  eggsFired: number;
  /** Flags acertados sobre esta persona (por texto de la razón) como trampas de presión o cartas cambiadas. */
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

/** Construye el modelo del tick a partir del ajuste (`estimates`), lo público y lo visto; acumula sobre `prev`. */
export function buildPersonaModel(i: PersonaModelInput): PersonaModel {
  const { tick, prev, estimates: e } = i;
  const hasPrior = PERSONA_PRIORS[i.id] !== undefined;
  // Con datos propios (o del posterior) → medido; solo con el prior offline → prior; sin nada → desconocido.
  const n = e?.fittedFrom ?? 0;
  const fitted: FieldSource = n > 0 ? "measured" : hasPrior ? "prior" : "unknown";
  const priorOnly: FieldSource = hasPrior ? "prior" : "unknown";
  const s = prev?.strategy;
  const u = obj(i.raw.unlock);
  const menu = obj(i.raw.menu);

  const welcome = e?.welcome;
  const welcomeFrac = (side: "buys" | "sells"): Field => {
    if (!welcome || welcome.side !== side) return settle({ value: null, lo: null, hi: null, n: 0, source: "unknown" }, side === "buys" ? s?.welcome_price_frac_buy : s?.welcome_price_frac_sell, tick);
    // Precio de bienvenida como parte del book: vendiendo, como mucho esta fracción; comprando, al menos 2 − fracción.
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

// ---------------------------------------------------------------- persistencia

const SCHEMA = "bazaar-persona-model/v1";

export const defaultPersonaModelFile = (root: string) => join(root, "results", "bazaar-live", "persona-model.json");

/**
 * Modelos guardados por persona; vacío si no existe o no es válido (nunca lanza). Sin fichero, el primer tick migra
 * desde `persona-posterior.json`: el ajuste ya se rehace de las observaciones y el modelo se construye de él.
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

/** Una línea por persona para la salida de play. */
export function formatPersonaModel(m: PersonaModel): string {
  const st = m.strategy;
  const bands = Object.entries(m.bands).map(([b, x]) => `${b} ${f(x.frac)}×${x.limit.n}${x.limit.n < 3 ? "?" : ""}`).join(" ");
  const seen = [m.anti_cheat.strikes_seen.n ? `strikes ${m.anti_cheat.strikes_seen.n}` : "", m.anti_cheat.cooloff_seen.n ? `cooloff ${m.anti_cheat.cooloff_seen.n}` : "", m.fired.eggs.n ? `eggs ${m.fired.eggs.n}` : ""].filter(Boolean).join(" ");
  return `model ${m.id}: markup ${f(st.opening_markup_sell)}/${f(st.opening_markup_buy)} β ${f(st.beta)} rounds ${f(st.max_rounds)} walk ${f(st.walk_after_rounds)} mirror ${f(st.mirror_concessions)} welcome ${f(st.welcome_first_deal)}${st.welcome_price_frac_buy.value !== null ? ` (buy ${f(st.welcome_price_frac_buy)})` : ""}${st.welcome_price_frac_sell.value !== null ? ` (sell ${f(st.welcome_price_frac_sell)})` : ""} · bands ${bands || "-"}${seen ? ` · ${seen}` : ""} (~ = prior, ? = unknown)`;
}
