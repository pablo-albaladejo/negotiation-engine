/**
 * Conversaciones del Bazaar (dealers, equipos, duelos) tal como las sirve `/api/bazaar/threads` y
 * `/api/bazaar/duels`: el visor nunca calcula, solo tipa y vuelve a mostrar lo que el servidor ya
 * leyó (estado/razón de cierre literales del Bazaar, texto literal de los mensajes -- puede traer
 * un intento de inyección; nunca se interpreta, solo se muestra).
 */
export interface ConversationMessage {
  sender: string | null;
  text: string;
  ts?: number;
}

export interface ConversationOffer {
  maker: string | null;
  give: { cash: number | null };
  want: { cash: number | null };
  assets: string[];
  final: boolean;
}

export interface ConversationTraceEntry {
  ts?: string;
  tick?: number;
  action?: string;
  ourPrice?: number;
  herPrice?: number;
  herOpening?: number;
  herFinal?: boolean;
  rule?: string;
  reservation?: number;
  effectiveReservation?: number;
  status?: string;
  closedReason?: string;
  settledPrice?: number;
  text?: string;
  patience?: unknown;
}

export type ThreadStatus = "open" | "deal" | "walked" | "closed" | "cooloff" | (string & {});

export interface ConversationThread {
  id: number;
  with: string | null;
  topic: unknown;
  status: ThreadStatus;
  closed_reason: string | null;
  messages: ConversationMessage[];
  standing_offers: ConversationOffer[];
  trace: ConversationTraceEntry[];
}

export interface Duel {
  id: number;
  role?: string | null;
  status?: string | null;
  rival?: string | null;
  your_limit?: number | null;
  round?: number | null;
  deadline?: number | string | null;
  done: boolean;
}

/** Más recientes primero (el servidor ya ordena así; aquí solo se blinda contra una forma inesperada). */
export function conversationsModel(raw: readonly ConversationThread[] | null | undefined): ConversationThread[] {
  return raw ? [...raw].sort((a, b) => b.id - a.id) : [];
}

export function duelsModel(raw: readonly Duel[] | null | undefined): Duel[] {
  return raw ? [...raw] : [];
}
