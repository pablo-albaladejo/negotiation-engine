import { RARITY_BOOK } from "../dealers/history/persona-fit.js";
import type { PersonaModel } from "../state/persona-model.js";
import type { Budget, Verdict } from "./coordinator.js";

/**
 * Arbitrage between personas: when the measured floor of a persona that SELLS a rarity is below the measured ceiling
 * of another that BUYS it, buy here and sell there. Proposal only: never executed and never spends quota; it is
 * checked against the thread quota left by what is already selected and against the agendas that close personas. The
 * figures are the per-persona fit estimates (pessimistic: the most it would ask when selling, the least it would give when
 * buying), never a text. Private: never in a message.
 */

export interface ArbitrageIdea {
  rarity: string;
  buyFrom: string;
  sellTo: string;
  /** The most the seller would ask at its limit (hi of its `sells:` band). */
  buyAt: number;
  /** The least the buyer would give at its limit (that of its `buys:` band). */
  sellAt: number;
  spread: number;
  /** Samples of the band with the least data: with few, the limit may still sit on another jitter step. */
  samples: number;
}

/** Ideas per rarity ordered by margin; minimum margin max(1 P, 5 % of the book). */
export function personaArbitrage(personas: readonly { id: string; model?: PersonaModel }[]): ArbitrageIdea[] {
  const ideas: ArbitrageIdea[] = [];
  for (const a of personas) {
    for (const [band, sell] of Object.entries(a.model?.bands ?? {})) {
      if (!band.startsWith("sells:")) continue;
      const rarity = band.slice("sells:".length);
      const minSpread = Math.max(1, 0.05 * (RARITY_BOOK[rarity] ?? 10));
      for (const b of personas) {
        const buy = b.id === a.id ? undefined : b.model?.bands[`buys:${rarity}`];
        if (!buy) continue;
        const buyAt = Math.ceil(sell.limit.hi ?? Infinity);
        const sellAt = Math.floor(buy.limit.lo ?? -Infinity);
        if (sellAt - buyAt >= minSpread) ideas.push({ rarity, buyFrom: a.id, sellTo: b.id, buyAt, sellAt, spread: sellAt - buyAt, samples: Math.min(sell.limit.n, buy.limit.n) });
      }
    }
  }
  return ideas.sort((x, y) => y.spread - x.spread);
}

/** One line per idea: proposal, or why it does not fit this tick (thread quota after what is selected, agenda). */
export function arbitrageLines(ideas: readonly ArbitrageIdea[], budget: Budget, verdicts: readonly Verdict[]): string[] {
  let threadsLeft = budget.maxOpenThreads - budget.openThreadsNow - verdicts.filter((v) => v.selected && v.intent.kind === "open").length;
  return ideas.map((i) => {
    const what = `buy ${i.rarity} @ ${i.buyFrom} ≤ ${i.buyAt} P, sell @ ${i.sellTo} ≥ ${i.sellAt} P (spread ${i.spread} P, samples ${i.samples}${i.samples < 3 ? "?" : ""})`;
    const closed = [i.buyFrom, i.sellTo].find((p) => budget.closedPersonas?.includes(p));
    if (budget.opensBlocked) return `${what} · blocked: agenda (${budget.opensBlocked})`;
    if (closed) return `${what} · blocked: agenda closes ${closed}`;
    if (threadsLeft < 2) return `${what} · blocked: open threads (needs 2, left ${Math.max(0, threadsLeft)})`;
    threadsLeft -= 2;
    return `${what} · PROPOSAL (not executed)`;
  });
}
