import { readFileSync } from "node:fs";
import { z } from "zod";

/**
 * Modelo de un dealer del Bazaar a partir de su ficha (`GET /api/dealers/{id}`): rasgos y menú.
 * Cada parámetro dice si es REAL (sale tal cual de la API o de RULES.md) o ASSUMPTION (hipótesis
 * nuestra, a recalibrar con trazas en vivo). Ver `src/bazaar/sim/AGENTS.md`.
 */

const unit = z.number().min(0).max(1);

export const DealerProfileSchema = z.looseObject({
  id: z.string(),
  name: z.string().optional(),
  level: z.number().nullish(),
  traits: z.looseObject({ patience: unit, generosity: unit, shrewdness: unit, memory: unit, strictness: unit, chattiness: unit }),
  menu: z.looseObject({
    sells: z
      .array(
        z.looseObject({
          pack: z.string().optional(),
          rarity: z.string().optional(),
          sets: z.string().optional(),
          name: z.string().optional(),
          list_price: z.number(),
          opening_ask: z.number().optional(),
          per_team_per_hour: z.number().optional(),
        }),
      )
      .default([]),
    buys: z
      .array(z.looseObject({ rarity: z.string().optional(), sets: z.string().optional(), list_price: z.number().optional(), per_team_per_hour: z.number().optional() }))
      .default([]),
    deals_per_team_per_hour: z.number().optional(),
  }),
});
export type DealerProfile = z.infer<typeof DealerProfileSchema>;
export type Traits = DealerProfile["traits"];

/** Ficha real guardada como fixture (respuesta de `GET /api/dealers/abuela`). */
export const ABUELA_FIXTURE = "test/fixtures/bazaar/dealer-abuela.json";

export function loadDealerProfile(path: string = ABUELA_FIXTURE): DealerProfile {
  return DealerProfileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

export interface SimParams {
  /** ASSUMPTION. Suelo oculto al vender = list_price × (1 − floorFrac). Hipótesis barrida 0,15–0,35; por defecto 0,1 + 0,2 × generosity. */
  floorFrac: number;
  /** ASSUMPTION. Cada hilo tiene su propio límite secreto (REAL: RULES.md): floorFrac × (1 ± floorJitter), uniforme por semilla. */
  floorJitter: number;
  /** ASSUMPTION. Apertura sin opening_ask = list_price × openingMarkup (30/26 ≈ 1,15 en el sobre). */
  openingMarkup: number;
  /** CALIBRATED (hilo 125: común de lista 10, abrió a 5). Al comprarnos: primera puja = list_price × buyOpenFrac (0,4 + 0,1 × generosity). */
  buyOpenFrac: number;
  /** CALIBRATED (hilo 125: 5 → 6 en 6 mensajes). Al comprarnos su techo es bajo: max(apertura + 1, round(apertura × buyCeilingMult)). */
  buyCeilingMult: number;
  /** CALIBRATED (hilo 125: concedimos 5 P en pasos de 1, ella 1 P). Su paso = nuestro paso × reciprocity (0,1 + 0,2 × generosity − 0,1 × shrewdness, en [0,1, 0,5]). */
  reciprocity: number;
  /** ASSUMPTION. Con nuestro primer precio concede firstMoveFrac del tramo (no hay paso previo con que comparar). */
  firstMoveFrac: number;
  /** ASSUMPTION. Su paso nunca supera maxStepFrac del tramo. */
  maxStepFrac: number;
  /** ASSUMPTION. Acepta nuestro precio si queda a menos de acceptGapFrac × tramo de su nuevo precio (0,1 × (1 − shrewdness)). */
  acceptGapFrac: number;
  /** CALIBRATED (hilos 56 y 125: ~6–7 mensajes nuestros, contados por intercambio, no por tic). Rondas antes de la oferta final ≈ patienceBase + patience × patienceScale (6 para Abuela, ± jitter). */
  patienceBase: number;
  patienceScale: number;
  /** ASSUMPTION. ± rondas aleatorias por hilo. */
  patienceJitter: number;
  /** ASSUMPTION. La oferta final cierra finalFrac del hueco que le queda hasta su límite (0,5 × generosity). */
  finalFrac: number;
  /** ASSUMPTION. Amabilidad (REAL: "Abuela likes kindness"): +rondas y +reciprocidad por mensaje amable, con tope. */
  politeRounds: number;
  politeRoundsCap: number;
  politeReciprocity: number;
  politeReciprocityCap: number;
  /** ASSUMPTION. Rudeza: −rondas y −reciprocidad por mensaje, escaladas por (1 + 2 × strictness). */
  rudeRounds: number;
  rudeReciprocity: number;
  /** ASSUMPTION. Inyección (REAL: cambia palabras, nunca precios): −rondas como la rudeza; cooloff con probabilidad 0,5 × strictness. */
  injectionCooloffProb: number;
  /** ASSUMPTION. Duración del cooloff en ticks (5 + 25 × strictness). REAL: el cooloff trae until_tick. */
  cooloffTicks: number;
  /** ASSUMPTION. Fracción del trato (amable/rudo) que pasa al siguiente hilo del mismo equipo (= memory). REAL: "remember treatment". */
  memoryCarry: number;
  /** REAL. menu.deals_per_team_per_hour (sin dato: 8). */
  dealsPerHour: number;
  /** REAL. Ticks por hora del día: 60 el viernes (ticks de 60 s), 120 el sábado, 240 el domingo. */
  ticksPerHour: number;
  /** ASSUMPTION. Frases por mensaje = 1 + round(chattiness × 3). Solo afecta al texto, nunca al precio. */
  sentences: number;
  /**
   * REAL (hilo 56). Rarezas que el dealer nos compra a precio fijo: puja ese precio, no se mueve por
   * mucho que concedamos (sin reciprocidad), su final es el mismo precio y el trato cuenta. Abuela: comunes a 13.
   */
  fixedBuyPrices: Record<string, number>;
}

/** Lo aprendido en vivo por dealer (ver `fixedBuyPrices`). */
export const LEARNED_FIXED_BUY_PRICES: Record<string, Record<string, number>> = { abuela: { common: 13 } };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Parámetros del simulador derivados de los rasgos; `overrides` fija cualquiera (barridos, calibración). */
export function deriveParams(profile: DealerProfile, overrides: Partial<SimParams> = {}): SimParams {
  const t = profile.traits;
  const sev = 1 + 2 * t.strictness;
  return {
    floorFrac: 0.1 + 0.2 * t.generosity,
    floorJitter: 0.2,
    openingMarkup: 1.15,
    buyOpenFrac: 0.4 + 0.1 * t.generosity,
    buyCeilingMult: 1.2,
    reciprocity: clamp(0.1 + 0.2 * t.generosity - 0.1 * t.shrewdness, 0.1, 0.5),
    firstMoveFrac: 0.05 + 0.05 * t.generosity,
    maxStepFrac: 0.25,
    acceptGapFrac: 0.1 * (1 - t.shrewdness),
    patienceBase: 2,
    patienceScale: 5,
    patienceJitter: 1,
    finalFrac: 0.5 * t.generosity,
    politeRounds: 0.5,
    politeRoundsCap: 2,
    politeReciprocity: 0.03,
    politeReciprocityCap: 0.1,
    rudeRounds: 1 * sev,
    rudeReciprocity: 0.05 * sev,
    injectionCooloffProb: 0.5 * t.strictness,
    cooloffTicks: Math.round(5 + 25 * t.strictness),
    memoryCarry: t.memory,
    dealsPerHour: profile.menu.deals_per_team_per_hour ?? 8,
    ticksPerHour: 60,
    sentences: 1 + Math.round(t.chattiness * 3),
    fixedBuyPrices: { ...(LEARNED_FIXED_BUY_PRICES[profile.id] ?? {}) },
    ...overrides,
  };
}

export type Side = "buy" | "sell";

/** Un artículo del menú desde nuestro lado: `buy` = ella vende; `sell` = ella nos compra. */
export interface MenuItem {
  side: Side;
  /** `pack:sobre_barrio` o `rarity:common`. */
  key: string;
  /** Precio de lista (REAL al vender; al comprar, el de su venta de la misma rareza). */
  list: number;
  /** Primer precio: REAL si el menú trae opening_ask; si no, derivado. */
  opening: number;
  perTeamPerHour?: number;
  /** Precio fijo (REAL al comprarnos comunes la Abuela): su límite es su apertura y nunca se mueve. */
  fixed?: boolean;
}

/** Menú resuelto. Al comprar, la referencia es el list_price de su venta de la misma rareza (ASSUMPTION: `buys` no trae precio). */
export function menuItems(profile: DealerProfile, p: Pick<SimParams, "openingMarkup" | "buyOpenFrac"> & Partial<Pick<SimParams, "fixedBuyPrices">>): MenuItem[] {
  const out: MenuItem[] = [];
  for (const s of profile.menu.sells) {
    const key = s.pack ? `pack:${s.pack}` : s.rarity ? `rarity:${s.rarity}` : undefined;
    if (!key) continue;
    const opening = Math.round(s.opening_ask ?? s.list_price * p.openingMarkup);
    out.push({ side: "buy", key, list: s.list_price, opening, ...(s.per_team_per_hour !== undefined ? { perTeamPerHour: s.per_team_per_hour } : {}) });
  }
  for (const b of profile.menu.buys) {
    if (!b.rarity) continue;
    const fixed = p.fixedBuyPrices?.[b.rarity];
    if (fixed !== undefined) {
      out.push({ side: "sell", key: `rarity:${b.rarity}`, list: b.list_price ?? fixed, opening: fixed, fixed: true, ...(b.per_team_per_hour !== undefined ? { perTeamPerHour: b.per_team_per_hour } : {}) });
      continue;
    }
    const list = b.list_price ?? profile.menu.sells.find((s) => s.rarity === b.rarity)?.list_price;
    if (list === undefined) continue;
    const opening = Math.max(1, Math.round(list * p.buyOpenFrac));
    out.push({ side: "sell", key: `rarity:${b.rarity}`, list, opening, ...(b.per_team_per_hour !== undefined ? { perTeamPerHour: b.per_team_per_hour } : {}) });
  }
  return out;
}

/** Límite secreto de un hilo: suelo al vender (según `floorFrac`), techo bajo al comprarnos (hilo 125); al menos 1 P mejor que la apertura. */
export function limitFor(item: MenuItem, floorFrac: number, p: Pick<SimParams, "buyCeilingMult">): number {
  if (item.fixed) return item.opening;
  if (item.side === "buy") return Math.min(item.opening - 1, Math.ceil(item.list * (1 - floorFrac)));
  return Math.max(item.opening + 1, Math.round(item.opening * p.buyCeilingMult));
}
