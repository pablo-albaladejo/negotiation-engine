/**
 * Bazaar conversations (dealers, teams, duels) as served by `/api/bazaar/threads` and
 * `/api/bazaar/duels`: the viewer never computes, it only types and re-displays what the server already
 * read (close state/reason verbatim from the Bazaar, message text verbatim -- it may carry
 * an injection attempt; it is never interpreted, only shown).
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

/** Most recent first (the server already sorts this way; here we only guard against an unexpected shape). */
export function conversationsModel(raw: readonly ConversationThread[] | null | undefined): ConversationThread[] {
  return raw ? [...raw].sort((a, b) => b.id - a.id) : [];
}

export function duelsModel(raw: readonly Duel[] | null | undefined): Duel[] {
  return raw ? [...raw] : [];
}
