import type { TraceLine } from "../../../src/pipeline/trace.js";
import { explainSeries, roundPanels, splitTrace, type Offer } from "./rounds.js";

/** Lo que el cliente acumula de `/api/live`: la sesión en curso y la anterior (para el descanso). */
export interface LiveFeed {
  runId: string | null;
  session: string | null;
  lines: TraceLine[];
  previous: { session: string; lines: TraceLine[] } | null;
  /** `Date.now()` del último evento recibido; `null` si aún no llegó ninguno. */
  lastEventAt: number | null;
}

export const emptyLiveFeed = (): LiveFeed => ({ runId: null, session: null, lines: [], previous: null, lastEventAt: null });

export type LiveStatus = "waiting" | "live" | "finished";

/** Final registrado: la acción terminal de nuestra salida (`output`), tal como se envió. */
export interface LiveOutcome {
  sessionId: string;
  round: number;
  action: "accept" | "walk";
  offer: Offer | null;
}

export interface LiveBubble {
  side: "us" | "them";
  round: number;
  text: string;
  offer: Offer | null;
  injection: boolean;
  template: boolean;
}

/**
 * P7 (proyector). Solo selecciona y cuenta registros: utilidades de `explain` (× 100), ofertas
 * enlazadas y de salida, banderas del parser y del detector de fugas. Nunca decide ni calcula.
 */
export interface LiveModel {
  status: LiveStatus;
  badge: "LIVE" | "FINAL" | "BREAK";
  sessionId: string | null;
  role: "buyer" | "seller" | null;
  round: number;
  /** Del registro `input` (lo da el ring); `null` si no lo dio. */
  roundLimit: number | null;
  /** Registros `parser` con `injectionSuspected` + registros `leak` con `leak: true`. */
  attacksBlocked: number;
  ours: { round: number; value: number }[];
  theirs: { round: number; value: number }[];
  injectionRounds: number[];
  latest: { ourOffer: Offer | null; theirOffer: Offer | null; uRival: number | null; uOffer: number | null };
  outcome: LiveOutcome | null;
  /** Final de la sesión anterior, para "Last: …" durante el descanso. */
  last: LiveOutcome | null;
  templateCount: number;
  ourMessageCount: number;
  last3: LiveBubble[];
}


const obj = (value: unknown): Record<string, unknown> | null => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null);

function outcomeOf(lines: readonly TraceLine[]): LiveOutcome | null {
  const { records } = splitTrace(lines);
  const output = [...records].reverse().find((r) => r.box === "output");
  const out = obj(output?.output);
  if (!output || !out || (out.action !== "accept" && out.action !== "walk")) return null;
  return { sessionId: output.sessionId, round: output.round, action: out.action, offer: (out.offer as Offer | undefined) ?? null };
}

export function liveModel(feed: LiveFeed): LiveModel {
  const { header, records } = splitTrace(feed.lines);
  const panels = roundPanels(records);
  const explain = explainSeries(panels);
  const outcome = outcomeOf(feed.lines);
  const previous = feed.previous ? outcomeOf(feed.previous.lines) : null;
  const status: LiveStatus = feed.session === null || records.length === 0 ? "waiting" : outcome === null ? "live" : "finished";
  const inputs = records.filter((r) => r.box === "input").map((r) => obj(r.output)?.roundLimit);
  const roundLimit = [...inputs].reverse().find((v): v is number => typeof v === "number") ?? null;
  const bubbles = panels.flatMap((p) => {
    const out: LiveBubble[] = [];
    const injection = p.parser?.injectionSuspected === true;
    if (p.rivalText !== null) out.push({ side: "them", round: p.round, text: p.rivalText, offer: p.rivalOffer, injection, template: false });
    if (p.ourText !== null) out.push({ side: "us", round: p.round, text: p.ourText, offer: p.ourOffer, injection: false, template: p.template });
    return out;
  });
  const lastOurs = [...panels].reverse().find((p) => p.ourOffer !== null)?.ourOffer ?? null;
  const lastTheirs = [...panels].reverse().find((p) => p.rivalOffer !== null)?.rivalOffer ?? null;
  const lastExplain = explain.at(-1);
  return {
    status,
    badge: status === "live" ? "LIVE" : status === "finished" ? "FINISHED" : "WAITING",
    sessionId: header?.sessionId ?? records[0]?.sessionId ?? null,
    role: header?.mode === "tournament" ? (header.role ?? null) : null,
    round: panels.at(-1)?.round ?? 0,
    roundLimit,
    attacksBlocked: records.filter((r) => (r.box === "parser" && obj(r.output)?.injectionSuspected === true) || (r.box === "leak" && obj(r.output)?.leak === true)).length,
    ours: explain.map((e) => ({ round: e.round, value: e.uOffer * 100 })),
    theirs: explain.flatMap((e) => (e.uRival === null ? [] : [{ round: e.round, value: e.uRival * 100 }])),
    injectionRounds: panels.filter((p) => p.parser?.injectionSuspected === true).map((p) => p.round),
    latest: { ourOffer: lastOurs, theirOffer: lastTheirs, uRival: lastExplain?.uRival ?? null, uOffer: lastExplain?.uOffer ?? null },
    outcome,
    last: status === "waiting" ? (outcome ?? previous) : previous,
    templateCount: panels.filter((p) => p.template).length,
    ourMessageCount: panels.filter((p) => p.ourText !== null).length,
    last3: bubbles.slice(-3),
  };
}
