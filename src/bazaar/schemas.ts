import { z } from "zod";

/**
 * Esquemas de las respuestas del Bazaar. Tolerantes: campos desconocidos permitidos y casi todo
 * opcional, porque el servidor añade campos con cada nivel. Solo se exige lo que el agente usa.
 */

const num = z.number();

export const ClockSchema = z.looseObject({
  tick: num,
  tick_seconds: num.optional(),
  paused: z.boolean().optional(),
  next_tick_in: num.optional(),
  round: num.optional(),
  round_name: z.string().optional(),
  limits: z.record(z.string(), z.unknown()).optional(),
});
export type Clock = z.infer<typeof ClockSchema>;

export const AssetSchema = z.looseObject({
  id: num,
  kind: z.string().nullish(),
  ref: z.string(),
  name: z.string().nullish(),
  your_value: num.nullish(),
  serial: num.nullish(),
  print_run: num.nullish(),
  rarity: z.string().nullish(),
  locked: z.boolean().nullish(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const MeSchema = z.looseObject({
  id: z.string().nullish(),
  name: z.string().nullish(),
  cash: num,
  level: num.optional(),
  unlocked: z.array(z.string()).optional(),
  unlocked_dealers: z.array(z.string()).optional(),
  assets: z.array(AssetSchema).default([]),
  album: z.unknown().optional(),
  score: z.unknown().optional(),
});
export type Me = z.infer<typeof MeSchema>;

export const CatalogCardSchema = z.looseObject({
  id: z.string(),
  name: z.string().optional(),
  rarity: z.string().optional(),
  book: num.nullish(),
  print_run: num.nullish(),
  minted: num.nullish(),
});
export const CatalogSchema = z.looseObject({
  sets: z
    .array(z.looseObject({ id: z.string().optional(), name: z.string().optional(), cards: z.array(CatalogCardSchema).default([]) }))
    .default([]),
  packs: z
    .array(z.looseObject({ id: z.string(), name: z.string().optional(), expected_book: num.nullish(), slot_odds: z.unknown().optional() }))
    .default([]),
  value_rules: z.unknown().optional(),
});
export type Catalog = z.infer<typeof CatalogSchema>;

export const ValueSchema = z.looseObject({ card: z.string().optional(), your_value: num });

export const DealerSchema = z.looseObject({
  id: z.string(),
  name: z.string().optional(),
  level: num.nullish(),
  status: z.string().optional(),
});
/** El servidor responde `personas` (nombre antiguo) o `dealers`. */
export const DealersSchema = z.preprocess(
  (raw) => (raw && typeof raw === "object" && !("dealers" in raw) && "personas" in raw ? { ...raw, dealers: (raw as { personas: unknown }).personas } : raw),
  z.looseObject({ dealers: z.array(DealerSchema).default([]) }),
);

export const OfferSideSchema = z.looseObject({
  cash: num.nullish(),
  assets: z.array(z.unknown()).nullish(),
  cards: z.array(z.unknown()).nullish(),
  types: z.array(z.unknown()).nullish(),
});

export const StandingOfferSchema = z.looseObject({
  id: num,
  maker: z.string().nullish(),
  to: z.string().nullish(),
  status: z.string().nullish(),
  give: OfferSideSchema.nullish(),
  want: OfferSideSchema.nullish(),
  final: z.boolean().nullish(),
  expires_tick: num.nullish(),
});
export type StandingOffer = z.infer<typeof StandingOfferSchema>;

/** `offer` se deja sin validar aquí: `view.ts` la lee con `StandingOfferSchema.safeParse`, así una oferta rara no tumba el hilo. */
export const MessageSchema = z.looseObject({
  id: z.union([num, z.string()]).nullish(),
  text: z.string().nullish(),
  sender: z.string().nullish(),
  price: num.nullish(),
  tick: num.nullish(),
  offer: z.unknown().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ThreadSchema = z.looseObject({
  id: num,
  status: z.string().nullish().transform((s) => s ?? "open"),
  closed_reason: z.string().nullish(),
  team: z.string().nullish(),
  until_tick: num.nullish(),
  with: z.string().nullish(),
  topic: z.unknown().optional(),
  messages: z.array(MessageSchema).nullish().transform((m) => m ?? []),
  standing_offers: z.array(StandingOfferSchema).nullish().transform((o) => o ?? []),
});
export type Thread = z.infer<typeof ThreadSchema>;

export const ThreadSummarySchema = z.looseObject({ id: num, status: z.string().nullish(), with: z.string().nullish() });
export const ThreadListSchema = z.looseObject({ threads: z.array(ThreadSummarySchema).nullish().transform((t) => t ?? []) });

/** El agente no lee la respuesta de un mensaje: validarla solo servía para tumbar un envío que el servidor ya aceptó. */
export const SayResultSchema = z.unknown();

export const ErrorBodySchema = z.looseObject({ error: z.string().optional(), message: z.string().optional() });
