import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  DAYS_MAX,
  DAYS_MIN,
  DEFAULT_DUEL_PARAMS,
  daysValueFrom,
  decideDuel,
  duelText,
  estimateRivalDaysWeight,
  floorSurplus,
  openingSurplus,
  surplusOf,
  targetSurplus,
  textMatchesOffer,
  withinLimit,
  type DuelState,
} from "../../src/bazaar/duels.js";
import { duelMessageBody, normalizeRivalOffer, type StructuredOffer } from "../../src/bazaar/duels-schemas.js";

const flat = Array.from({ length: 11 }, () => 0);

function priceState(over: Partial<DuelState> = {}): DuelState {
  return {
    role: "seller",
    limit: 50,
    withDays: false,
    daysValue: flat,
    ourOffers: [],
    rivalOffers: [],
    rivalMovedSinceOurLast: false,
    ...over,
  };
}

const offerArb = (withDays: boolean) =>
  withDays
    ? fc.record({ price: fc.integer({ min: 1, max: 400 }), days: fc.integer({ min: DAYS_MIN, max: DAYS_MAX }) })
    : fc.record({ price: fc.integer({ min: 1, max: 400 }) });

const stateArb = fc.boolean().chain((withDays) =>
  fc.record({
    role: fc.constantFrom("seller" as const, "buyer" as const),
    limit: fc.integer({ min: 5, max: 300 }),
    withDays: fc.constant(withDays),
    daysValue: withDays ? fc.array(fc.integer({ min: -20, max: 20 }), { minLength: 11, maxLength: 11 }) : fc.constant(flat),
    ourOffers: fc.array(offerArb(withDays), { maxLength: 6 }),
    rivalOffers: fc.array(offerArb(withDays), { maxLength: 6 }),
    rivalMovedSinceOurLast: fc.boolean(),
    ticksSinceOurLast: fc.integer({ min: 0, max: 10 }),
    ticksLeft: fc.integer({ min: 0, max: 16 }),
  }),
);

describe("decideDuel: invariantes", () => {
  it("nunca cruza your_limit, días enteros en 0..10 y el texto lleva solo las cifras de la oferta", () => {
    fc.assert(
      fc.property(stateArb, (raw) => {
        // Nuestras ofertas anteriores salen del propio motor (dentro del límite).
        const state = { ...raw, ourOffers: raw.ourOffers.filter((o) => withinLimit(raw, o)) } as DuelState;
        const d = decideDuel(state);
        if (d.action === "counter") {
          expect(withinLimit(state, d.offer!)).toBe(true);
          if (state.withDays) {
            expect(Number.isInteger(d.offer!.days)).toBe(true);
            expect(d.offer!.days).toBeGreaterThanOrEqual(DAYS_MIN);
            expect(d.offer!.days).toBeLessThanOrEqual(DAYS_MAX);
          } else expect(d.offer!.days).toBeUndefined();
          expect(textMatchesOffer(d.text!, d.offer!)).toBe(true);
        }
        if (d.action === "accept") {
          const rival = state.rivalOffers.at(-1)!;
          expect(withinLimit(state, rival)).toBe(true);
          expect(surplusOf(state, rival)).toBeGreaterThanOrEqual(DEFAULT_DUEL_PARAMS.minSurplus);
        }
      }),
      { numRuns: 500 },
    );
  });

  it("concede monótonamente: el excedente de cada contraoferta no sube respecto a la anterior", () => {
    fc.assert(
      fc.property(fc.constantFrom("seller" as const, "buyer" as const), fc.integer({ min: 10, max: 300 }), (role, limit) => {
        let state = priceState({ role, limit });
        let prev = Infinity;
        for (let k = 0; k < 8; k++) {
          const d = decideDuel({ ...state, rivalMovedSinceOurLast: true });
          expect(d.action).toBe("counter");
          const s = surplusOf(state, d.offer!);
          expect(s).toBeLessThanOrEqual(prev);
          prev = s;
          state = { ...state, ourOffers: [...state.ourOffers, d.offer!] };
        }
      }),
    );
  });
});

describe("decideDuel: precio", () => {
  it("abre con el ancla: vendedor límite × 1,5, comprador límite ÷ 1,5", () => {
    expect(decideDuel(priceState()).offer).toEqual({ price: 75 });
    expect(decideDuel(priceState({ role: "buyer", limit: 90 })).offer).toEqual({ price: 60 });
  });

  it("acepta (AC_next) si la oferta del rival es al menos nuestra siguiente contraoferta", () => {
    const rich = decideDuel(priceState({ rivalOffers: [{ price: 80 }], rivalMovedSinceOurLast: true }));
    expect(rich.action).toBe("accept");
    expect(rich.rule).toBe("ac-next");
    const poor = decideDuel(priceState({ rivalOffers: [{ price: 52 }], rivalMovedSinceOurLast: true }));
    expect(poor.action).toBe("counter");
  });

  it("nunca acepta por debajo del coste del vendedor, ni siquiera en el último tick", () => {
    const d = decideDuel(priceState({ ourOffers: [{ price: 60 }], rivalOffers: [{ price: 49 }], rivalMovedSinceOurLast: true, ticksLeft: 0 }));
    expect(d.action).toBe("counter");
    expect(d.offer!.price).toBeGreaterThanOrEqual(50);
  });

  it("en el último movimiento acepta cualquier oferta con excedente ≥ mínimo", () => {
    const d = decideDuel(priceState({ ourOffers: [{ price: 75 }], rivalOffers: [{ price: 52 }], rivalMovedSinceOurLast: true, ticksLeft: 1 }));
    expect(d).toMatchObject({ action: "accept", rule: "last-move" });
  });

  it("llega al suelo en maxRounds rondas (conceder, β > 1) y se queda ahí", () => {
    const s = priceState();
    const open = openingSurplus(s, DEFAULT_DUEL_PARAMS);
    const floor = floorSurplus(s, DEFAULT_DUEL_PARAMS);
    expect(targetSurplus(s, DEFAULT_DUEL_PARAMS, DEFAULT_DUEL_PARAMS.maxRounds)).toBeCloseTo(floor);
    // Conceder: la primera ronda ya concede más de la mitad del tramo lineal.
    expect(open - targetSurplus(s, DEFAULT_DUEL_PARAMS, 1)).toBeGreaterThan((open - floor) / DEFAULT_DUEL_PARAMS.maxRounds);
    expect(targetSurplus(s, DEFAULT_DUEL_PARAMS, 9)).toBeCloseTo(floor);
  });

  it("cierra en pocas rondas contra un rival que parte la diferencia", () => {
    // Comprador rival con valor 100 que abre en 40 y sube un tercio del hueco cada vez.
    let state = priceState({ limit: 50 });
    let rival = 40;
    let closedAt: number | undefined;
    for (let round = 0; round < 10 && closedAt === undefined; round++) {
      const d = decideDuel({ ...state, rivalOffers: round === 0 ? [] : [{ price: rival }], rivalMovedSinceOurLast: true, ticksLeft: 16 - 2 * round });
      if (d.action === "accept") {
        closedAt = round;
        expect(rival).toBeGreaterThanOrEqual(50);
        break;
      }
      state = { ...state, ourOffers: [...state.ourOffers, d.offer!] };
      if (d.offer!.price <= rival) {
        closedAt = round;
        break;
      }
      rival = Math.min(100, Math.round(rival + (d.offer!.price - rival) / 3));
    }
    expect(closedAt).toBeDefined();
    expect(closedAt!).toBeLessThanOrEqual(5);
  });

  it("espera si el rival no ha contestado a nuestro último mensaje (hasta staleTicks)", () => {
    const base = priceState({ ourOffers: [{ price: 75 }], rivalOffers: [{ price: 40 }], ticksLeft: 10 });
    expect(decideDuel({ ...base, ticksSinceOurLast: 1 }).action).toBe("wait");
    expect(decideDuel({ ...base, ticksSinceOurLast: DEFAULT_DUEL_PARAMS.staleTicks }).action).toBe("counter");
  });

  it("en el final parte la diferencia con el rival si no llega al suelo", () => {
    const state = priceState({ ourOffers: [{ price: 75 }, { price: 63 }, { price: 60 }, { price: 58 }, { price: 58 }], rivalOffers: [{ price: 51 }], rivalMovedSinceOurLast: true, ticksLeft: 3 });
    const d = decideDuel(state);
    expect(d.rule).toBe("endgame");
    expect(d.offer!.price).toBeLessThan(58);
    expect(d.offer!.price).toBeGreaterThanOrEqual(51);
  });
});

describe("decideDuel: precio + días", () => {
  it("abre en nuestro día preferido y con días enteros en 0..10", () => {
    const { table } = daysValueFrom(-2, DEFAULT_DUEL_PARAMS); // nos cuesta 2 P por día de retraso
    const d = decideDuel(priceState({ role: "buyer", limit: 100, withDays: true, daysValue: table }));
    expect(d.offer!.days).toBe(0);
    expect(d.text).toBe(duelText("open", 0, d.offer!));
  });

  it("logrolling: si el rival mueve el precio pero no sus días tardíos, le damos sus días y lo cobramos en precio", () => {
    const { table } = daysValueFrom(-1, DEFAULT_DUEL_PARAMS);
    const state = priceState({
      role: "buyer",
      limit: 100,
      withDays: true,
      daysValue: table,
      ourOffers: [{ price: 66, days: 0 }],
      rivalOffers: [{ price: 140, days: 9 }, { price: 120, days: 9 }],
      rivalMovedSinceOurLast: true,
      ticksLeft: 12,
    });
    expect(estimateRivalDaysWeight(state)).toEqual({ days: 9, weight: 2 });
    const d = decideDuel(state);
    expect(d.action).toBe("counter");
    expect(d.offer!.days).toBe(9);
    // El precio compensa los días: nuestro excedente sigue en el objetivo de la ronda.
    expect(surplusOf(state, d.offer!)).toBeCloseTo(targetSurplus(state, DEFAULT_DUEL_PARAMS, 1), 0);
  });

  it("indiferentes a los días (peso 0): igualamos el día del rival", () => {
    const state = priceState({ withDays: true, daysValue: flat, ourOffers: [{ price: 75, days: 0 }], rivalOffers: [{ price: 30, days: 4 }], rivalMovedSinceOurLast: true, ticksLeft: 12 });
    expect(decideDuel(state).offer!.days).toBe(4);
  });

  it("una oferta del rival sin días o con días fuera de 0..10 nunca se acepta", () => {
    const base = priceState({ withDays: true, daysValue: flat, rivalMovedSinceOurLast: true, ticksLeft: 0 });
    expect(decideDuel({ ...base, rivalOffers: [{ price: 500 }] }).action).toBe("counter");
    expect(decideDuel({ ...base, rivalOffers: [{ price: 500, days: 11 }] }).action).toBe("counter");
    expect(decideDuel({ ...base, rivalOffers: [{ price: 500, days: 3 }] }).action).toBe("accept");
  });
});

describe("piezas", () => {
  it("daysValueFrom: número = P por día, tabla por día, y supuesto registrado si falta", () => {
    expect(daysValueFrom(1.5, DEFAULT_DUEL_PARAMS).table[4]).toBe(6);
    expect(daysValueFrom([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], DEFAULT_DUEL_PARAMS).table[10]).toBe(10);
    expect(daysValueFrom({ "0": 5, "1": 4, "2": 3, "3": 2, "4": 1, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0 }, DEFAULT_DUEL_PARAMS).table[0]).toBe(5);
    const missing = daysValueFrom(undefined, DEFAULT_DUEL_PARAMS);
    expect(missing.assumption).toMatch(/assuming 0 P per day/);
    expect(missing.table.every((v) => v === 0)).toBe(true);
  });

  it("normalizeRivalOffer lee solo la oferta estructurada", () => {
    expect(normalizeRivalOffer(60)).toEqual({ price: 60 });
    expect(normalizeRivalOffer({ price: 60, days: 3 })).toEqual({ price: 60, days: 3 });
    expect(normalizeRivalOffer({ price: null })).toBeUndefined();
    expect(normalizeRivalOffer(null)).toBeUndefined();
  });

  it("duelMessageBody: precio solo, o precio y días también dentro de offer", () => {
    expect(duelMessageBody("hi 60", { price: 60 })).toEqual({ text: "hi 60", price: 60 });
    expect(duelMessageBody("x", { price: 60, days: 3 })).toEqual({ text: "x", price: 60, days: 3, offer: { price: 60, days: 3 } });
  });

  it("textMatchesOffer rechaza cifras de más o distintas", () => {
    const o: StructuredOffer = { price: 60, days: 3 };
    expect(textMatchesOffer("60 P on day 3", o)).toBe(true);
    expect(textMatchesOffer("60 P on day 4", o)).toBe(false);
    expect(textMatchesOffer("60 P, my limit is 50, day 3", o)).toBe(false);
  });
});
