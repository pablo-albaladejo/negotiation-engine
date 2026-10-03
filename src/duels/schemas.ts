import { z } from "zod";
import type { BazaarClient } from "../shared/client.js";
import { ClockSchema, type Clock } from "../shared/schemas.js";

/**
 * Duel schemas (`/api/duels`) and `/api/schedule`. Tolerant like `schemas.ts`: the
 * server adds fields and we don't know the exact shape of `rival_offer` or `deadline`, so the
 * plausible variants are accepted and `normalizeRivalOffer` reduces them to `{ price, days? }`.
 */

const num = z.number();

/** Rival's offer: a number (price only), `{ price, days }` or nothing if they haven't spoken yet. */
export const RivalOfferSchema = z.union([num, z.looseObject({ price: num.nullish(), days: num.nullish() }), z.null()]).optional();

/**
 * Private weight per delivery day. Expected: a number (P per day) or a per-day table (array or object "0".."10"),
 * but no two-issue duel has been seen yet, so any shape is accepted here (a strict schema would drop the whole
 * `/api/duels` response) and `daysValueFrom` decides whether it is readable.
 */
export const DaysWeightSchema = z.unknown().optional();

/** The real server uses `duel` as id, `deadline_tick` and `rounds`; they are normalized to id/deadline/round. */
const normalizeDuel = (raw: unknown): unknown => {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  return { ...r, id: r.id ?? r.duel, deadline: r.deadline ?? r.deadline_tick, round: r.round ?? r.rounds };
};

/** A message in the duel thread; `sender` is "you" for ours, anything else for the rival's. */
export const DuelMessageSchema = z.looseObject({
  sender: z.string().nullish(),
  /** The real server uses `from` ("you" | rival name); `sender` stays for compatibility. */
  from: z.string().nullish(),
  price: num.nullish(),
  days: num.nullish(),
  text: z.string().nullish(),
});
export type DuelMessage = z.infer<typeof DuelMessageSchema>;

/** `your_offer`: our last offer according to the server (to avoid reopening after a restart without memory). */
export const YourOfferSchema = z
  .looseObject({ id: z.union([z.number(), z.string()]).nullish(), price: num.nullish(), days: num.nullish(), tick: num.nullish() })
  .nullish();

export const DuelSchema = z.preprocess(normalizeDuel, z.looseObject({
  id: z.union([z.number(), z.string()]),
  role: z.enum(["seller", "buyer"]),
  your_limit: num,
  rival_offer: RivalOfferSchema,
  your_offer: YourOfferSchema,
  messages: z.array(DuelMessageSchema).default([]),
  deadline: z.union([num, z.string(), z.null()]).optional(),
  issues: z.array(z.string()).default(["price"]),
  your_days_weight: DaysWeightSchema,
  /** Server's description of what the days weight means (text or object; read by `daysValueFrom`). */
  days_meaning: z.unknown().optional(),
  /** Decay per round of the deal (practice: 0.06). */
  decay_per_round: num.nullish(),
  status: z.string().nullish(),
  round: num.nullish(),
  rival: z.string().nullish(),
}));
export type Duel = z.infer<typeof DuelSchema>;

export const DuelsSchema = z.looseObject({ duels: z.array(DuelSchema).default([]) });
export type Duels = z.infer<typeof DuelsSchema>;

export const ScheduleSchema = z.looseObject({
  now_hours: num.optional(),
  upcoming: z
    .array(z.looseObject({ at_hours: num, action: z.string(), note: z.string().optional(), params: z.record(z.string(), z.unknown()).optional() }))
    .default([]),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

export interface StructuredOffer {
  price: number;
  days?: number;
}

/** Rival's structured offer (never their text); `undefined` if there is no finite price. */
export function normalizeRivalOffer(raw: Duel["rival_offer"]): StructuredOffer | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "number") return Number.isFinite(raw) ? { price: raw } : undefined;
  if (typeof raw.price !== "number" || !Number.isFinite(raw.price)) return undefined;
  return typeof raw.days === "number" && Number.isFinite(raw.days) ? { price: raw.price, days: raw.days } : { price: raw.price };
}

/** A finite price/day from a message, structured; `undefined` if it carries no price. */
function offerOfMessage(m: Pick<DuelMessage, "price" | "days">): StructuredOffer | undefined {
  if (typeof m.price !== "number" || !Number.isFinite(m.price)) return undefined;
  return typeof m.days === "number" && Number.isFinite(m.days) ? { price: m.price, days: m.days } : { price: m.price };
}

/**
 * Current rival offer: `rival_offer` if present, otherwise the price of their last message
 * (`sender` other than "you") that has one. Never reads the message text, only its price/days.
 */
export function rivalOfferFrom(duel: Pick<Duel, "rival_offer" | "messages">): StructuredOffer | undefined {
  const direct = normalizeRivalOffer(duel.rival_offer);
  if (direct) return direct;
  const messages = duel.messages ?? [];
  for (let k = messages.length - 1; k >= 0; k--) {
    const m = messages[k]!;
    // Only messages known to be the rival's: the server marks ours with from="you".
    const who = m.from ?? m.sender;
    if (who == null || who === "you") continue;
    const offer = offerOfMessage(m);
    if (offer) return offer;
  }
  return undefined;
}

/**
 * Our concessions since the rival's last offer with a price: how many times we changed price or days in
 * our later messages (the opening doesn't count). Only reads `from`, `price` and `days`, never the text.
 */
export function concessionsSinceRival(messages: readonly Pick<DuelMessage, "from" | "sender" | "price" | "days">[]): number {
  let n = 0;
  let prev: StructuredOffer | undefined;
  for (const m of messages) {
    const offer = offerOfMessage(m);
    if (!offer) continue;
    const who = m.from ?? m.sender;
    if (who != null && who !== "you") {
      n = 0;
      continue;
    }
    if (who === "you") {
      if (prev && (prev.price !== offer.price || (prev.days ?? 0) !== (offer.days ?? 0))) n += 1;
      prev = offer;
    }
  }
  return n;
}

/** Our last offer according to the server (`your_offer`); used to avoid reopening after a restart without memory. */
export function ourOfferFrom(duel: Pick<Duel, "your_offer">): StructuredOffer | undefined {
  const o = duel.your_offer;
  if (!o) return undefined;
  return offerOfMessage(o);
}

/** Body of the duel message POST: with days, the price also goes inside `offer` (like the SDK). */
export function duelMessageBody(text: string, offer: StructuredOffer): Record<string, unknown> {
  const price = Math.round(offer.price);
  if (offer.days === undefined) return { text, price };
  const days = Math.round(offer.days);
  return { text, price, days, offer: { price, days } };
}

/** The duel routes the loop uses; injectable in tests. */
export interface DuelsApi {
  clock(): Promise<Clock>;
  duels(done?: boolean): Promise<Duels>;
  schedule(): Promise<Schedule>;
  say(duelId: number | string, text: string, offer: StructuredOffer): Promise<unknown>;
  accept(duelId: number | string): Promise<unknown>;
}

/** Adapter over `BazaarClient` (without touching it): same headers, rate limit and typed errors. */
export function duelsApi(client: BazaarClient): DuelsApi {
  return {
    clock: () => client.request("GET", "/api/clock", ClockSchema),
    duels: (done = false) => client.request("GET", `/api/duels${done ? "?done=true" : ""}`, DuelsSchema),
    schedule: () => client.request("GET", "/api/schedule", ScheduleSchema),
    say: (duelId, text, offer) => client.raw("POST", `/api/duels/${encodeURIComponent(String(duelId))}/messages`, duelMessageBody(text, offer)),
    accept: (duelId) => client.raw("POST", `/api/duels/${encodeURIComponent(String(duelId))}/accept`, {}),
  };
}
