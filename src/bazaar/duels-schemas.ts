import { z } from "zod";
import type { BazaarClient } from "./client.js";
import { ClockSchema, type Clock } from "./schemas.js";

/**
 * Esquemas de los duelos (`/api/duels`) y de `/api/schedule`. Tolerantes como `schemas.ts`: el
 * servidor añade campos y no sabemos la forma exacta de `rival_offer` ni de `deadline`, así que se
 * aceptan las variantes plausibles y `normalizeRivalOffer` las reduce a `{ price, days? }`.
 */

const num = z.number();

/** Oferta del rival: un número (solo precio), `{ price, days }` o nada si aún no ha hablado. */
export const RivalOfferSchema = z.union([num, z.looseObject({ price: num.nullish(), days: num.nullish() }), z.null()]).optional();

/** Peso privado por día de entrega: un número (P por día) o una tabla por día (array u objeto "0".."10"). */
export const DaysWeightSchema = z.union([num, z.array(num), z.record(z.string(), num), z.null()]).optional();

export const DuelSchema = z.looseObject({
  id: z.union([z.number(), z.string()]),
  role: z.enum(["seller", "buyer"]),
  your_limit: num,
  rival_offer: RivalOfferSchema,
  deadline: z.union([num, z.string(), z.null()]).optional(),
  issues: z.array(z.string()).default(["price"]),
  your_days_weight: DaysWeightSchema,
  status: z.string().nullish(),
  round: num.nullish(),
  rival: z.string().nullish(),
});
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

/** Oferta estructurada del rival (nunca su texto); `undefined` si no hay precio finito. */
export function normalizeRivalOffer(raw: Duel["rival_offer"]): StructuredOffer | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "number") return Number.isFinite(raw) ? { price: raw } : undefined;
  if (typeof raw.price !== "number" || !Number.isFinite(raw.price)) return undefined;
  return typeof raw.days === "number" && Number.isFinite(raw.days) ? { price: raw.price, days: raw.days } : { price: raw.price };
}

/** Cuerpo del POST de un mensaje de duelo: con días, el precio va también dentro de `offer` (como el SDK). */
export function duelMessageBody(text: string, offer: StructuredOffer): Record<string, unknown> {
  const price = Math.round(offer.price);
  if (offer.days === undefined) return { text, price };
  const days = Math.round(offer.days);
  return { text, price, days, offer: { price, days } };
}

/** Las rutas de duelos que usa el bucle; inyectable en los tests. */
export interface DuelsApi {
  clock(): Promise<Clock>;
  duels(done?: boolean): Promise<Duels>;
  schedule(): Promise<Schedule>;
  say(duelId: number | string, text: string, offer: StructuredOffer): Promise<unknown>;
  accept(duelId: number | string): Promise<unknown>;
}

/** Adaptador sobre `BazaarClient` (sin tocarlo): mismas cabeceras, límite de ritmo y errores tipados. */
export function duelsApi(client: BazaarClient): DuelsApi {
  return {
    clock: () => client.request("GET", "/api/clock", ClockSchema),
    duels: (done = false) => client.request("GET", `/api/duels${done ? "?done=true" : ""}`, DuelsSchema),
    schedule: () => client.request("GET", "/api/schedule", ScheduleSchema),
    say: (duelId, text, offer) => client.raw("POST", `/api/duels/${encodeURIComponent(String(duelId))}/messages`, duelMessageBody(text, offer)),
    accept: (duelId) => client.raw("POST", `/api/duels/${encodeURIComponent(String(duelId))}/accept`, {}),
  };
}
