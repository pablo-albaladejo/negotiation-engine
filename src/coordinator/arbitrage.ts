import { RARITY_BOOK } from "../dealers/history/persona-fit.js";
import type { PersonaModel } from "../state/persona-model.js";
import type { Budget, Verdict } from "./coordinator.js";

/**
 * Arbitraje entre personas: cuando el suelo medido de una persona que VENDE una rareza queda por debajo del techo
 * medido de otra que la COMPRA, comprar aquí y vender allí. Solo propuesta: nunca se ejecuta ni gasta cupo; se
 * comprueba contra el cupo de hilos que deja lo ya seleccionado y contra las agendas que cierran personas. Las
 * cifras son las estimaciones del ajuste por persona (pesimistas: lo más que pediría al vender, lo menos que daría al
 * comprar), nunca un texto. Privado: nunca en un mensaje.
 */

export interface ArbitrageIdea {
  rarity: string;
  buyFrom: string;
  sellTo: string;
  /** Lo más que pediría quien vende en su límite (hi de su banda `sells:`). */
  buyAt: number;
  /** Lo menos que daría quien compra en su límite (lo de su banda `buys:`). */
  sellAt: number;
  spread: number;
  /** Muestras de la banda con menos datos: con pocas, el límite aún puede estar en otro escalón del jitter. */
  samples: number;
}

/** Ideas por rareza ordenadas por margen; margen mínimo max(1 P, 5 % del book). */
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

/** Una línea por idea: propuesta, o por qué no cabe este tick (cupo de hilos tras lo seleccionado, agenda). */
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
