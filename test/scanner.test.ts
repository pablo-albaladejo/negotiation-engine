import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { feeOf, proposeMarkets } from "../src/markets/markets.js";
import { marginalValue, ScannerLedger, scannerMargin, scanDecision, SCANNER_PARAMS } from "../src/markets/scanner.js";
import type { GameState } from "../src/state/game-state.js";
import type { PriceEntry, VenueInfo } from "../src/state/prices.js";
import { countHoldings, DEFAULT_VALUE_RULES, type HeldAsset, type TradeState, type ValueModel } from "../src/trades/trades.js";

/** Scanner guardrails: never buys above marginal value − fee − margin, never sells below it, the hourly cap holds. */

const SET = "AAA";
const PAGE = Array.from({ length: 10 }, (_, k) => `${SET}-${String(k + 1).padStart(2, "0")}`);
const CARDS = PAGE.slice(0, 4);

function model(bases: number[]): ValueModel {
  const m: ValueModel = { rules: DEFAULT_VALUE_RULES, base: new Map(), meta: new Map(), pages: new Map([[SET, PAGE]]), sets: new Map([[SET, PAGE]]) };
  PAGE.forEach((r, k) => {
    m.meta.set(r, { ref: r, set: SET, rarity: "common", book: 10 });
    m.base.set(r, bases[k % bases.length]!);
  });
  return m;
}

const venue = (feeBps: number, feePerCard: number): VenueInfo => ({ id: "rastro", house: true, feeBps, feePerCard, depth: 10, canTrade: true });

interface World {
  bases: number[];
  holdings: number[];
  asks: (number | undefined)[];
  bids: (number | undefined)[];
  feeBps: number;
  feePerCard: number;
  cash: number;
  /** Copies per card locked in our own offers (the first ones). */
  locked?: number[];
}

function build(w: World, tick: number, offerBase = 0) {
  const m = model(w.bases);
  let id = 1;
  const held: HeldAsset[] = [];
  CARDS.forEach((r, k) => {
    for (let n = 0; n < w.holdings[k]!; n++) held.push({ id: id++, ref: r, value: 0, locked: n < (w.locked?.[k] ?? 0) });
  });
  const counts = countHoldings(held);
  const prices: PriceEntry[] = CARDS.map((r, k) => {
    const ask = w.asks[k];
    const bid = w.bids[k];
    return {
      ref: r,
      set: SET,
      book: 10,
      hidden: false,
      dealers: { sells: [], buys: [] },
      byVenue: { rastro: { ...(ask !== undefined ? { ask: { price: ask, venue: "rastro", offer: offerBase + 100 + k } } : {}), ...(bid !== undefined ? { bid: { price: bid, venue: "rastro", offer: offerBase + 200 + k } } : {}), asks: 1, bids: 1 } },
      value: w.bases[k % w.bases.length]!,
      holdings: counts.get(r) ?? 0,
      completesPage: false,
    };
  });
  const state = {
    tick,
    clock: { tick, tickSeconds: 60, paused: false },
    time: { gameHour: (tick * 60) / 3600 },
    ours: { cash: w.cash },
    markets: { prices, venues: [venue(w.feeBps, w.feePerCard)] },
  } as unknown as GameState;
  const trade = { tick, myId: "t02", cash: w.cash, held, pageSets: [SET], board: [], mine: [], toMe: [], settlements: [], model: m, limits: { offersPerTick: 12, maxOpenOffers: 30, acceptsPerTick: 1 }, spent: 0, reserved: new Set<number>() } as TradeState;
  return { state, trade, counts, m };
}

const price = fc.option(fc.integer({ min: 1, max: 80 }), { nil: undefined });
const world = fc.record({
  bases: fc.array(fc.integer({ min: 1, max: 90 }), { minLength: 1, maxLength: 4 }),
  holdings: fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 4, maxLength: 4 }),
  asks: fc.array(price, { minLength: 4, maxLength: 4 }),
  bids: fc.array(price, { minLength: 4, maxLength: 4 }),
  feeBps: fc.integer({ min: 0, max: 1500 }),
  feePerCard: fc.integer({ min: 0, max: 3 }),
  cash: fc.integer({ min: 0, max: 300 }),
});

describe("dispersion scanner", () => {
  it("never buys above marginal value − fee − margin, never sells below marginal value + fee + margin", () => {
    fc.assert(
      fc.property(world, (w) => {
        const { state, trade, counts, m } = build(w, 600);
        const { intents } = proposeMarkets(state, new Map(), { scanner: true, trade, ledger: new ScannerLedger(), cashFloor: 20 });
        for (const i of intents.filter((x) => x.acceptClass === "scanner")) {
          const p = i.price!;
          const fee = feeOf(venue(w.feeBps, w.feePerCard), p);
          const side = i.locks!.some((l) => l.startsWith("buy:")) ? "buy" : "sell";
          const mv = Math.round(marginalValue(counts, i.ref!, side, m) * 10) / 10;
          if (side === "buy") expect(p + fee + scannerMargin(p)).toBeLessThanOrEqual(mv + 0.1);
          else expect(p - fee - scannerMargin(p)).toBeGreaterThanOrEqual(mv - 0.1);
        }
      }),
      { numRuns: 300 },
    );
  });

  it("without --scanner no scanner intent is ever proposed", () => {
    fc.assert(
      fc.property(world, (w) => {
        const { state, trade } = build(w, 600);
        const { intents } = proposeMarkets(state, new Map(), { trade, ledger: new ScannerLedger(), cashFloor: 20 });
        expect(intents.some((x) => x.acceptClass === "scanner")).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it("the hourly spend cap and the cash floor hold even if every proposed buy executes", () => {
    fc.assert(
      fc.property(fc.array(world, { minLength: 1, maxLength: 12 }), fc.integer({ min: 0, max: 120 }), (ticks, cap) => {
        const ledger = new ScannerLedger();
        ticks.forEach((w, k) => {
          const tick = 600 + k * 7;
          const { state, trade } = build(w, tick, k * 1000);
          const { intents } = proposeMarkets(state, new Map(), { scanner: true, trade, ledger, cashFloor: 20, spendPerHour: cap });
          const buys = intents.filter((x) => x.acceptClass === "scanner" && x.locks!.some((l) => l.startsWith("buy:")));
          const cost = buys.reduce((s, x) => s + x.price! + feeOf(venue(w.feeBps, w.feePerCard), x.price!), 0);
          expect(w.cash - cost).toBeGreaterThanOrEqual(buys.length ? 20 : -Infinity);
          for (const x of intents) ledger.commit(x.id);
          expect(ledger.spentIn(Math.floor((tick * 60) / 3600))).toBeLessThanOrEqual(cap + 1e-9);
        });
      }),
      { numRuns: 200 },
    );
  });

  it("scanDecision: never more than N deals per counterparty per hour, never below the margin", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), fc.double({ min: 0, max: 10, noNaN: true }), fc.integer({ min: 0, max: 150 }), fc.integer({ min: 0, max: 5 }), fc.constantFrom("buy" as const, "sell" as const), (p, fee, marginal, deals, side) => {
        const d = scanDecision({ side, price: p, fee, penalty: 0, marginal, cash: 1000, cashFloor: 20, spentThisHour: 0, committedThisTick: 0, spendPerHour: 1000, dealsWithCounterparty: deals });
        if (d.ok) {
          expect(deals).toBeLessThan(SCANNER_PARAMS.dealsPerCounterpartyPerHour);
          expect(d.net).toBeGreaterThanOrEqual(scannerMargin(p));
        }
      }),
    );
  });

  it("never sells a card with an active rival-page directed listing", () => {
    fc.assert(
      fc.property(world, (w) => {
        const { state, trade } = build(w, 600);
        const { intents } = proposeMarkets(state, new Map(), { scanner: true, trade, ledger: new ScannerLedger(), cashFloor: 0, directedRefs: new Set(CARDS) });
        expect(intents.filter((x) => x.locks?.some((l) => l.startsWith("sell:")))).toEqual([]);
      }),
    );
  });

  it("deterministic: a clear ask below marginal value is bought and a clear bid above it is sold", () => {
    const w: World = { bases: [40], holdings: [0, 3, 0, 0], asks: [10, undefined, undefined, undefined], bids: [undefined, 18, undefined, undefined], feeBps: 0, feePerCard: 0, cash: 200 };
    const { state, trade } = build(w, 600);
    const { intents } = proposeMarkets(state, new Map(), { scanner: true, trade, ledger: new ScannerLedger(), cashFloor: 20 });
    const scanner = intents.filter((x) => x.acceptClass === "scanner");
    expect(scanner.some((x) => x.ref === "AAA-01" && x.locks!.includes("buy:AAA-01"))).toBe(true);
    expect(scanner.some((x) => x.ref === "AAA-02" && x.locks!.includes("sell:AAA-02"))).toBe(true);
  });

  it("copies locked in our own offers never make the last free copy of a page-target set look like a duplicate", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3 }), fc.integer({ min: 0, max: 1 }), fc.integer({ min: 5, max: 80 }), fc.integer({ min: 1, max: 90 }), (lockedN, free, bid, base) => {
        const w: World = { bases: [base], holdings: [0, lockedN + free, 0, 0], locked: [0, lockedN, 0, 0], asks: [undefined, undefined, undefined, undefined], bids: [undefined, bid, undefined, undefined], feeBps: 0, feePerCard: 0, cash: 200 };
        const { state, trade } = build(w, 600);
        const { intents } = proposeMarkets(state, new Map(), { scanner: true, trade, ledger: new ScannerLedger(), cashFloor: 0, pageTargets: ["AAA-09"] });
        expect(intents.filter((x) => x.locks?.includes("sell:AAA-02"))).toEqual([]);
      }),
    );
  });
});
