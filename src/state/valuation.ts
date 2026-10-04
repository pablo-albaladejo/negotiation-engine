import { SCANNER_PARAMS, marginalValue } from "../markets/scanner.js";
import type { Asset, Catalog } from "../shared/schemas.js";
import { buildValueModel, countHoldings, heldAssets, portfolioValue, type ValueRules } from "../trades/trades.js";

/**
 * Our valuation, built once per tick (`GameState.valuation`): the value model every route rebuilds today
 * (`buildValueModel`), laid out so it can be read and shown. Per card: the API value we know, the base (first copy,
 * no bonus) and where it comes from, what one more copy adds and what losing one costs (page risk included). Per page:
 * the bonus at stake. Read-only: it decides no figure; local use only (private values never go into a message).
 */

export interface CardValuation {
  ref: string;
  set: string;
  rarity: string;
  held: number;
  /** `your_value` from the API: the copy we hold, or `/api/me/value` (first copy) for a card we miss. */
  api?: number;
  /** Base value of the first copy without page bonus. */
  base: number;
  /** api: derived from an API value · estimated: set multiplier × book (no API value known yet). */
  baseSource: "api" | "estimated";
  /** What one more copy adds at our values (page bonus included when it completes a page). */
  nextCopy: number;
  /** What losing one copy costs (held only): value lost plus the page risk of breaking a near-complete page. */
  loseCopy?: number;
}

export interface PageValuation {
  set: string;
  have: number;
  of: number;
  complete: boolean;
  /** The page bonus: page bonus fraction × Σ base of its cards (ours when complete, at stake otherwise). */
  bonus: number;
  missing: string[];
}

export interface ValuationState {
  rules: ValueRules;
  /** Value of everything we hold at our values (copies with decreasing marginals + page and set bonus). */
  portfolio: number;
  cards: CardValuation[];
  pages: PageValuation[];
}

const r1 = (x: number) => Math.round(x * 10) / 10;

/** `apiValues`: every `your_value` we know (held copies and `/api/me/value` of missing cards). */
export function buildValuation(assets: readonly Asset[], catalog: Catalog | undefined, apiValues: ReadonlyMap<string, number>): ValuationState | undefined {
  if (!catalog) return undefined;
  const held = heldAssets([...assets]);
  const counts = countHoldings(held);
  const model = buildValueModel(catalog, held, new Map([...apiValues].filter(([ref]) => !counts.has(ref))));
  const cards: CardValuation[] = [];
  for (const [ref, meta] of model.meta) {
    const base = model.base.get(ref);
    if (base === undefined) continue;
    const n = counts.get(ref) ?? 0;
    const api = apiValues.get(ref);
    cards.push({
      ref,
      set: meta.set,
      rarity: meta.rarity,
      held: n,
      ...(api !== undefined ? { api } : {}),
      base: r1(base),
      baseSource: n > 0 || api !== undefined ? "api" : "estimated",
      nextCopy: r1(marginalValue(counts, ref, "buy", model)),
      ...(n > 0 ? { loseCopy: r1(marginalValue(counts, ref, "sell", model, SCANNER_PARAMS.protectPageHave)) } : {}),
    });
  }
  const pages: PageValuation[] = [...model.pages].map(([set, refs]) => {
    const missing = refs.filter((r) => !(counts.get(r) ?? 0));
    return {
      set,
      have: refs.length - missing.length,
      of: refs.length,
      complete: missing.length === 0,
      bonus: r1(model.rules.pageBonus * refs.reduce((s, r) => s + (model.base.get(r) ?? 0), 0)),
      missing,
    };
  });
  return { rules: model.rules, portfolio: r1(portfolioValue(counts, model)), cards, pages };
}
