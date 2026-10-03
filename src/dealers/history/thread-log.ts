import type { Side } from "../negotiation/negotiator.js";
import { StandingOfferSchema, type Me, type Thread } from "../../shared/schemas.js";
import { isDealer, type DealerRef } from "../negotiation/view.js";

/**
 * Resumen por conversación con un dealer (lo pide nuestro analista de datos): cartas, copias antes y después,
 * tratos con ese dealer en la última hora, tick/ts, su apertura y su final, y paciencia. Solo campos
 * estructurados y nuestros valores privados; nunca la clave ni el texto del dealer.
 */

export type ThreadOutcome = "deal" | "closed_no_deal" | "walked" | "cooloff";

export interface ThreadSummary {
  thread: number;
  dealer: string;
  kind: Side;
  target: string;
  /** Cartas de la conversación: la pedida o la que ella ofrece (rareza+set), o la que vendemos. */
  cards: string[];
  /** Compra cerrada: cartas que nos llegaron (por diferencia de activos). */
  received?: string[];
  copiesBefore: Record<string, number>;
  copiesAfter: Record<string, number>;
  dealsWithDealerLastHour: number;
  /** `welcome-first-deal`: precio aceptado, medido como su límite para este dealer y esta banda (`target`). */
  measuredLimit?: number;
  openTick?: number;
  openTs?: string;
  tick: number;
  ts: string;
  herList?: number;
  herOpening?: number;
  herFinal?: number;
  finalFlag: boolean;
  herPrices: number[];
  ourPrices: number[];
  patience: { msgs: number; herReplies: number; ticks: number; untilFinal: boolean };
  outcome: ThreadOutcome;
  closedReason?: string;
  rule?: string;
  price?: number;
  ourValue?: number;
  ourLimit?: number;
  valueCreated?: number;
  /** Nuestros puntos de la cifra al abrir (para medir el efecto del trato cuando se asiente). */
  negPointsBefore?: number;
  ladderPointsBefore?: number;
}

/** Cartas que el dealer ofrece en su oferta más reciente (`give.types` = "card:SAL-05"); vacío si no lo dice. */
export function revealedCards(thread: Thread, dealer: DealerRef): string[] {
  const offers = [...thread.standing_offers, ...thread.messages.map((m) => StandingOfferSchema.safeParse(m.offer)).flatMap((r) => (r.success ? [r.data] : []))];
  const hers = offers.filter((o) => isDealer(dealer, o.maker)).sort((a, b) => b.id - a.id);
  for (const o of hers) {
    const cards = (o.give?.types ?? []).flatMap((t) => (typeof t === "string" && t.startsWith("card:") ? [t.slice(5)] : []));
    if (cards.length) return [...new Set(cards)];
  }
  return [];
}

/** Copias que tenemos de cada carta. */
export function copiesOf(me: Me, refs: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of refs) out[r] = me.assets.filter((a) => a.ref === r && (a.kind ?? "card") === "card").length;
  return out;
}

export function outcomeOf(status: string, reason: string | null | undefined): ThreadOutcome {
  if (status === "deal") return "deal";
  if (reason && /walk|no_progress/i.test(reason)) return "walked";
  if (reason && /cool/i.test(reason)) return "cooloff";
  return "closed_no_deal";
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function valueCreated(kind: Side, value: number | undefined, price: number | undefined): number | undefined {
  if (value === undefined || price === undefined) return undefined;
  return round1(kind === "buy" ? value - price : price - value);
}

const copies = (r: Record<string, number>) => Object.entries(r).map(([k, v]) => `${k}×${v}`).join(" ") || "-";

/** "thread 184 · abuela · buy SAL-05 · deal at 10 · her 12→10 (final) · ours 8→9 · copies SAL-05×0 → ×1 · …" */
export function formatThreadSummary(s: ThreadSummary): string {
  const her = s.herPrices.length ? `her ${s.herPrices.join("→")}${s.finalFlag ? " (final)" : ""}` : "her -";
  const ours = s.ourPrices.length ? `ours ${s.ourPrices.join("→")}` : "ours -";
  const what = s.outcome === "deal" ? `deal at ${s.price ?? "?"}` : `${s.outcome}${s.closedReason ? ` (${s.closedReason})` : ""}${s.rule ? ` rule ${s.rule}` : ""}`;
  const value = s.ourValue !== undefined ? ` · our value ${round1(s.ourValue)}${s.ourLimit !== undefined ? ` limit ${s.ourLimit}` : ""}` : "";
  const created = s.valueCreated !== undefined && s.outcome === "deal" ? ` · value created ${s.valueCreated >= 0 ? "+" : ""}${s.valueCreated}` : "";
  const recv = s.received?.length ? ` · received ${s.received.join(",")}` : "";
  const limit = s.measuredLimit !== undefined ? ` · measured limit ${s.measuredLimit} (welcome-first-deal)` : "";
  return [
    `SUMMARY thread ${s.thread} · ${s.dealer} · ${s.kind} ${s.cards.join(",") || s.target} · ${what} · ${her} · ${ours}${value}${created}${recv}${limit}`,
    `  copies ${copies(s.copiesBefore)} → ${copies(s.copiesAfter)} · deals with ${s.dealer} last hour ${s.dealsWithDealerLastHour} · ticks ${s.openTick ?? "?"}→${s.tick} (${s.ts}) · patience ${s.patience.msgs} msgs / ${s.patience.ticks} ticks until ${s.patience.untilFinal ? "final" : "close"}`,
  ].join("\n");
}
