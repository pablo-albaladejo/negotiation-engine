import type { OfferPoint } from "@negotiation-ring/design-system";
import type { ChatMessageFlag } from "@negotiation-ring/design-system";
import type { ConversationOffer, ConversationTraceEntry } from "../model/index.js";
import { offerDomain } from "./chart.js";

/**
 * Helpers de presentación para la Card "Conversations" (Bazaar): nada aquí calcula una métrica del
 * juego, solo da forma a los campos que ya sirvió el servidor (estado literal, textos literales de
 * las ofertas y de la traza del agente).
 */

const STATUS_FLAG: Record<string, ChatMessageFlag["kind"]> = {
  open: "neutral",
  deal: "decision",
  walked: "walk",
  closed: "fallback",
  closed_no_deal: "fallback",
  cooloff: "neutral",
};

export function threadFlagKind(status: string): ChatMessageFlag["kind"] {
  return STATUS_FLAG[status] ?? "neutral";
}

/** "buy pack:starter", "buy card:SAL-05", "buy rare:SAL", "sell assets:23,24", or "—" si no se reconoce la forma. */
export function topicLabel(topic: unknown): string {
  if (!topic || typeof topic !== "object") return "—";
  const t = topic as Record<string, unknown>;
  if (t.buy && typeof t.buy === "object") {
    const buy = t.buy as Record<string, unknown>;
    if (typeof buy.pack === "string") return `buy pack:${buy.pack}`;
    if (typeof buy.card === "string") return `buy card:${buy.card}`;
    if (typeof buy.rarity === "string" && typeof buy.set === "string") return `buy ${buy.rarity}:${buy.set}`;
    return "buy";
  }
  if (t.sell && typeof t.sell === "object") {
    const sell = t.sell as Record<string, unknown>;
    if (Array.isArray(sell.assets)) return `sell assets:${sell.assets.join(",")}`;
    return "sell";
  }
  return "—";
}

/** "abuela 13 · final" o "t02 21"; sin precio en ninguno de los dos lados, "—". */
export function offerChipLabel(offer: ConversationOffer): string {
  const cash = offer.give.cash !== null && offer.give.cash !== 0 ? offer.give.cash : offer.want.cash;
  const price = cash !== null && cash !== undefined ? String(cash) : "—";
  const assets = offer.assets.length > 0 ? ` (${offer.assets.join(", ")})` : "";
  return `${offer.maker ?? "?"} ${price}${offer.final ? " · final" : ""}${assets}`;
}

/** Un punto por entrada de traza con precio (nuestro/suyo), en orden de mensaje; `rounds` = nº de entradas. */
export function conversationChartPoints(trace: readonly ConversationTraceEntry[]): { rounds: number; ours: OfferPoint[]; theirs: OfferPoint[]; yDomain: [number, number] } {
  const ours: OfferPoint[] = [];
  const theirs: OfferPoint[] = [];
  trace.forEach((entry, index) => {
    const round = index + 1;
    if (typeof entry.ourPrice === "number") ours.push({ round, value: entry.ourPrice });
    if (typeof entry.herPrice === "number") theirs.push({ round, value: entry.herPrice });
  });
  const yDomain = offerDomain([...ours.map((p) => p.value), ...theirs.map((p) => p.value)]);
  return { rounds: trace.length, ours, theirs, yDomain };
}
