import { readFile, stat } from "node:fs/promises";
import type { FeedEvent } from "../bazaar-board-core.js";

/**
 * The whole flow behind each egg of ours: the thread it fired in (what we opened with which dealer), every message in
 * it up to the egg (our text and offer; the dealer's offer, and its text only on the egg tick, the reply that echoes the
 * trigger — the approved egg-hint exception, never a figure) and how the thread ended. From our team stream
 * (`stream-team.jsonl`, the only place with our own text). Read-only.
 */

export interface EggFlowStep {
  tick: number;
  who: "us" | "dealer";
  /** Our text, or the dealer's reply on the egg tick; null otherwise. */
  text: string | null;
  /** The offer in that message, in words ("we give 25 P for sobre_barrio"); null without one. */
  offer: string | null;
}

export interface EggFlow {
  thread: number | null;
  /** What the thread was opened for: "buy pack sobre_barrio", "buy card RET-12", "sell 418"… */
  topic: string | null;
  steps: EggFlowStep[];
  /** "deal at 26 P (t1341)", "closed by us (t1021)", "closed by abuela", "open". */
  outcome: string;
}

type Side = { cash?: unknown; types?: unknown[]; assets?: unknown[] };
type Payload = Record<string, unknown>;

const refsOf = (xs: readonly unknown[] | undefined): string[] =>
  (xs ?? []).flatMap((x) => (typeof x === "string" ? [x.replace(/^(card|pack):/, "")] : x && typeof x === "object" && typeof (x as { ref?: unknown }).ref === "string" ? [(x as { ref: string }).ref] : []));
const sideText = (s: Side | undefined): string => [...(typeof s?.cash === "number" && s.cash ? [`${s.cash} P`] : []), ...refsOf(s?.assets), ...refsOf(s?.types)].join(" + ") || "—";

function topicText(topic: unknown): string | null {
  if (!topic || typeof topic !== "object") return null;
  const parts: string[] = [];
  for (const [side, what] of Object.entries(topic as Record<string, unknown>)) {
    if (!what || typeof what !== "object") continue;
    const w = what as Record<string, unknown>;
    const item = [
      typeof w.pack === "string" ? `pack ${w.pack}` : null,
      typeof w.card === "string" ? `card ${w.card}` : null,
      typeof w.rarity === "string" ? `${w.rarity}${typeof w.set === "string" ? ` ${w.set}` : ""}` : null,
      Array.isArray(w.assets) ? `assets ${w.assets.join(", ")}` : null,
    ].filter(Boolean);
    parts.push(`${side} ${item.join(" ") || JSON.stringify(w)}`);
  }
  return parts.join(" · ") || null;
}

const cache = new Map<string, { key: string; events: FeedEvent[] }>();

/**
 * Thread events of our own threads from the team streams (thread.opened / thread.message / thread.closed with our team,
 * plus settlements), prefiltered by text before parsing: the files are ~13 MB a day. Cached per file size and mtime.
 */
export async function readOurThreadEvents(paths: readonly string[], team: string): Promise<FeedEvent[]> {
  const out: FeedEvent[] = [];
  const marks = [`"team":"${team}"`, `"scope":"team:${team}"`];
  for (const path of paths) {
    let key: string;
    try {
      const s = await stat(path);
      key = `${s.size}:${s.mtimeMs}`;
    } catch {
      continue;
    }
    const hit = cache.get(path);
    if (hit && hit.key === key) {
      out.push(...hit.events);
      continue;
    }
    const events: FeedEvent[] = [];
    const raw = await readFile(path, "utf8").catch(() => "");
    for (const line of raw.split("\n")) {
      const isThread = line.includes('"thread.') && marks.some((m) => line.includes(m));
      const isSettlement = line.includes('"settlement"') && line.includes(`"${team}"`);
      if (!isThread && !isSettlement) continue;
      try {
        const data = (JSON.parse(line) as { data?: FeedEvent }).data;
        if (data && typeof data.id === "number") events.push(data);
      } catch {
        // truncated line (the recorder may be writing it): skipped
      }
    }
    cache.set(path, { key, events });
    out.push(...events);
  }
  return out;
}

/** The flow of the egg we found at `persona` on `tick`, or null if no thread of ours with that persona explains it. */
export function eggFlowOf(egg: { persona: string; tick: number }, events: readonly FeedEvent[], team: string, windowTicks = 6): EggFlow | null {
  const pay = (e: FeedEvent): Payload => (e.payload && typeof e.payload === "object" ? (e.payload as Payload) : {});
  const msgs = events.filter((e) => e.type === "thread.message" && pay(e).with === egg.persona && pay(e).team === team && typeof e.tick === "number");
  // The thread: the dealer's reply on the egg tick, else our latest message to that persona within the window.
  const reply = msgs.find((e) => e.tick === egg.tick && pay(e).sender === egg.persona);
  const ours = msgs.filter((e) => pay(e).sender === team && e.tick! <= egg.tick && egg.tick - e.tick! <= windowTicks).sort((a, b) => b.tick! - a.tick!)[0];
  const thread = (reply ?? ours) ? pay((reply ?? ours)!).thread : undefined;
  if (typeof thread !== "number") return null;

  const inThread = events.filter((e) => pay(e).thread === thread);
  const opened = inThread.find((e) => e.type === "thread.opened");
  // thread.closed carries no team: a closed event of this thread id is ours only after our own thread opened it.
  const closed = inThread.find((e) => e.type === "thread.closed" && (e.tick ?? -1) >= (opened?.tick ?? -1));
  // One step per message id (the recorder may hold it twice, once without text): keep the copy with text.
  const byId = new Map<number, FeedEvent>();
  for (const e of inThread) {
    if (e.type !== "thread.message" || (e.tick ?? Infinity) > egg.tick + 1) continue;
    const id = pay(e).message;
    if (typeof id !== "number") continue;
    const prev = byId.get(id);
    if (!prev || (typeof pay(e).text === "string" && typeof pay(prev).text !== "string")) byId.set(id, e);
  }
  const steps: EggFlowStep[] = [...byId.values()]
    .sort((a, b) => a.tick! - b.tick! || (pay(a).message as number) - (pay(b).message as number))
    .map((e) => {
      const p = pay(e);
      const isUs = p.sender === team;
      const o = (p.offer ?? null) as { give?: Side; want?: Side } | null;
      const offer = o ? (isUs ? `we give ${sideText(o.give)} for ${sideText(o.want)}` : typeof o.give?.cash === "number" && o.give.cash ? `offers ${sideText(o.give)} for ${sideText(o.want)}` : `asks ${sideText(o.want)} for ${sideText(o.give)}`) : null;
      const text = typeof p.text === "string" && (isUs || e.tick === egg.tick) ? p.text : null;
      return { tick: e.tick!, who: isUs ? "us" : "dealer", text, offer };
    });

  // Outcome: a settlement between us and the dealer while the thread lived, else how it closed.
  const first = opened?.tick ?? steps[0]?.tick ?? egg.tick;
  const last = closed?.tick ?? egg.tick + windowTicks;
  const deal = events.find((e) => {
    if (e.type !== "settlement" || typeof e.tick !== "number" || e.tick < first || e.tick > last + 1) return false;
    const parties = pay(e).parties;
    return Array.isArray(parties) && parties.includes(team) && parties.includes(egg.persona);
  });
  const by = closed ? pay(closed).by : undefined;
  const outcome = deal
    ? `deal${typeof pay(deal).price === "number" ? ` at ${pay(deal).price} P` : ""} (t${deal.tick})`
    : closed
      ? `closed by ${by === team ? "us" : typeof by === "string" ? by : "?"} without a deal (t${closed.tick})`
      : "no close recorded";
  return { thread, topic: topicText(opened ? pay(opened).topic : undefined), steps, outcome };
}
