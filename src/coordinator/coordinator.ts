import type { GameState, TickLimits } from "../state/game-state.js";

/**
 * Coordinador por tick, puro: cada ruta (duelos, dealers, El Rastro) propone sus intenciones sin enviarlas; aquí
 * se reparte el presupuesto del tick leído de `clock.limits` (nunca fijado en código) y se decide qué sale.
 *
 * ASSUMPTION (por verificar en vivo): la aceptación de un duelo comparte el cupo `accepts_per_team_per_tick` con
 * los dealers y El Rastro. Si resulta que no, basta con sacar la clase "duel" del cupo en `arbitrate`.
 */

export type Route = "duels" | "dealers" | "trades" | "flags" | "eggs" | "agenda" | "packs";
/**
 * `flag`: `POST /api/flags`, no usa el cupo de aceptaciones. `probe`: mensaje de egg, cuenta como mensaje y va el último.
 * `unpack`: abrir un sobre cerrado; ASSUMPTION (sin verificar): no gasta el cupo de aceptaciones.
 * `agenda`: acción del calendario (venue, sobre, ofertas antes del cierre) que solo se imprime: nunca sale de aquí.
 */
export type IntentKind = "accept" | "message" | "open" | "listing" | "cancel" | "flag" | "probe" | "agenda" | "unpack";
export type AcceptClass = "duel" | "page-completing" | "dealer-ladder" | "other";

/** Prioridad de las aceptaciones (menor rango, antes); a igual rango, más valor esperado primero. */
export const ACCEPT_PRIORITY: Record<AcceptClass, { rank: number; why: string }> = {
  duel: { rank: 1, why: "duel: its value decays every round" },
  "page-completing": { rank: 2, why: "SAL-09 or a page-completing buy (+25 % page bonus)" },
  "dealer-ladder": { rank: 3, why: "dealer ladder (best three deals per level count)" },
  other: { rank: 4, why: "the rest" },
};

export const DUEL_ACCEPT_QUOTA_ASSUMPTION = "ASSUMPTION: a duel accept shares the team accept quota (accepts_per_team_per_tick) with dealers and El Rastro";

export interface Intent {
  /** Único en el tick: `duels:accept:177`, `dealers:counter:abuela:56`, `trades:post:3`... */
  id: string;
  route: Route;
  kind: IntentKind;
  /** Conversación a la que cuenta el mensaje (`duel:177`, `dealer:56`). */
  conversation?: string;
  acceptClass?: AcceptClass;
  /** Valor esperado (P, a nuestros valores) si sale; solo para ordenar. */
  ev?: number;
  /** Línea legible: qué y con qué cifra (decidida por código). */
  summary: string;
  /** Cifra decidida por código (ya pasada por `enforceGuardrails`), si la intención lleva una. */
  price?: number;
  /** Activos que compromete (`asset:29`): un activo, un sitio, también entre rutas en el mismo tick. */
  locks?: string[];
}

export interface Budget {
  accepts: number;
  messagesPerConversation: number;
  maxOpenThreads: number;
  openThreadsNow: number;
  offersPerTick: number;
  maxOpenOffers: number;
  openOffersNow: number;
  /** Límites que faltaban en `clock.limits`: se usan como 0 (conservador: no se hace nada de ese tipo). */
  missing: string[];
  /** Agenda: motivo para no abrir conversaciones nuevas (final, congelación, fin de ronda). */
  opensBlocked?: string;
  /** Agenda: personas que cierran (no se abre con ellas). */
  closedPersonas?: readonly string[];
}

export function budgetFrom(state: Pick<GameState, "limits" | "ours" | "env">): Budget {
  const l: TickLimits = state.limits;
  const missing: string[] = [];
  const get = (v: number | undefined, name: string) => {
    if (v === undefined) missing.push(name);
    return v ?? 0;
  };
  return {
    accepts: get(l.acceptsPerTick, "accepts_per_team_per_tick"),
    messagesPerConversation: get(l.messagesPerConversation, "messages_per_side_per_tick"),
    maxOpenThreads: get(l.maxOpenThreads, "max_open_threads_per_team"),
    openThreadsNow: state.ours.openThreads.length,
    offersPerTick: get(l.offersPerTick, "offers_per_team_per_tick"),
    maxOpenOffers: get(l.maxOpenOffers, "max_open_offers_per_team"),
    openOffersNow: state.env.myOpenOffers,
    missing,
  };
}

export function formatBudget(b: Budget): string[] {
  return [
    `accepts/tick ${b.accepts} · messages/conversation/tick ${b.messagesPerConversation} · open threads ${b.openThreadsNow}/${b.maxOpenThreads} · listings/tick ${b.offersPerTick} · open offers ${b.openOffersNow}/${b.maxOpenOffers}`,
    ...(b.missing.length ? [`missing in clock.limits (used as 0, nothing of that kind goes out): ${b.missing.join(", ")}`] : []),
    DUEL_ACCEPT_QUOTA_ASSUMPTION,
  ];
}

export interface Verdict {
  intent: Intent;
  selected: boolean;
  reason: string;
}

const priority = (i: Intent) => ACCEPT_PRIORITY[i.acceptClass ?? "other"];

/**
 * Reparte el tick: como mucho `accepts` aceptaciones entre todas las rutas (por clase y valor esperado), mensajes
 * por conversación según `messagesPerConversation` (ninguno en la conversación cuya aceptación sale), hilos nuevos
 * hasta `maxOpenThreads` y altas hasta `offersPerTick` sin pasar de `maxOpenOffers`. Las cancelaciones siempre salen.
 */
export function arbitrate(intents: readonly Intent[], b: Budget): Verdict[] {
  const verdicts = new Map<string, Verdict>();
  // Un activo, un sitio: la primera intención seleccionada (en orden de arbitraje) se queda el activo.
  const taken = new Map<string, string>();
  const clash = (i: Intent) => i.locks?.map((l) => (taken.has(l) ? `${l} already in ${taken.get(l)}` : undefined)).find(Boolean);
  const take = (i: Intent) => i.locks?.forEach((l) => taken.set(l, i.id));
  const accepts = intents.filter((i) => i.kind === "accept").sort((a, c) => priority(a).rank - priority(c).rank || (c.ev ?? 0) - (a.ev ?? 0));
  const acceptedConversations = new Set<string>();
  let acceptsUsed = 0;
  const winners: string[] = [];
  accepts.forEach((i) => {
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      return;
    }
    if (acceptsUsed < b.accepts) {
      acceptsUsed += 1;
      winners.push(i.id);
      take(i);
      const k = acceptsUsed - 1;
      if (i.conversation) acceptedConversations.add(i.conversation);
      verdicts.set(i.id, { intent: i, selected: true, reason: `accept ${k + 1}/${b.accepts}: rank ${priority(i).rank} (${priority(i).why})${i.ev !== undefined ? `, EV ${i.ev.toFixed(1)}` : ""}` });
    } else {
      verdicts.set(i.id, { intent: i, selected: false, reason: b.accepts === 0 ? "no accepts this tick (quota 0)" : `accept quota ${b.accepts}/tick used by ${winners.join(", ")}` });
    }
  });

  const perConversation = new Map<string, number>();
  // Los probes de eggs son de baja prioridad: solo usan el hueco que dejen los mensajes de negociación.
  for (const i of [...intents.filter((x) => x.kind === "message"), ...intents.filter((x) => x.kind === "probe")]) {
    const conv = i.conversation ?? i.id;
    if (acceptedConversations.has(conv)) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `accept selected in ${conv}` });
      continue;
    }
    const used = perConversation.get(conv) ?? 0;
    if (used >= b.messagesPerConversation) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `message quota ${b.messagesPerConversation}/conversation/tick used in ${conv}` });
      continue;
    }
    perConversation.set(conv, used + 1);
    verdicts.set(i.id, { intent: i, selected: true, reason: `message ${used + 1}/${b.messagesPerConversation} in ${conv}` });
  }

  let threads = b.openThreadsNow;
  for (const i of intents.filter((x) => x.kind === "open").sort((a, c) => (c.ev ?? 0) - (a.ev ?? 0))) {
    if (b.opensBlocked) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `agenda: no new conversations (${b.opensBlocked})` });
      continue;
    }
    const persona = i.route === "dealers" ? i.id.split(":")[2] : undefined;
    if (persona && b.closedPersonas?.includes(persona)) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `agenda: ${persona} closes` });
      continue;
    }
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      continue;
    }
    if (threads >= b.maxOpenThreads) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `open threads ${threads}/${b.maxOpenThreads}` });
      continue;
    }
    threads += 1;
    take(i);
    verdicts.set(i.id, { intent: i, selected: true, reason: `open thread ${threads}/${b.maxOpenThreads}` });
  }

  for (const i of intents.filter((x) => x.kind === "unpack")) {
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      continue;
    }
    take(i);
    verdicts.set(i.id, { intent: i, selected: true, reason: "open pack: ASSUMPTION it does not use the accept quota (unverified)" });
  }
  for (const i of intents.filter((x) => x.kind === "agenda")) verdicts.set(i.id, { intent: i, selected: false, reason: "agenda intent: printed only (live needs its own CLI with --confirm and user approval)" });
  for (const i of intents.filter((x) => x.kind === "flag")) verdicts.set(i.id, { intent: i, selected: true, reason: "flag: structural contradiction, does not use the accept quota" });

  const cancels = intents.filter((x) => x.kind === "cancel");
  for (const i of cancels) verdicts.set(i.id, { intent: i, selected: true, reason: "cancel (frees an open offer)" });
  let posted = 0;
  let open = b.openOffersNow - cancels.length;
  for (const i of intents.filter((x) => x.kind === "listing")) {
    const busy = clash(i);
    if (busy) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `asset lock: ${busy}` });
      continue;
    }
    if (posted >= b.offersPerTick) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `listings ${posted}/${b.offersPerTick} this tick` });
      continue;
    }
    if (open >= b.maxOpenOffers) {
      verdicts.set(i.id, { intent: i, selected: false, reason: `open offers ${open}/${b.maxOpenOffers}` });
      continue;
    }
    posted += 1;
    open += 1;
    take(i);
    verdicts.set(i.id, { intent: i, selected: true, reason: `listing ${posted}/${b.offersPerTick}, open offers ${open}/${b.maxOpenOffers}` });
  }
  return intents.map((i) => verdicts.get(i.id)!);
}
