import { z } from "zod";

/**
 * Where each of OUR open offers comes from (`plan.jsonl`, one line per tick written by `bazaar:play`): the route that
 * posted it (trades on El Rastro, rival-page / rival-buy / rival-swap of the markets route, team-desk), its postings
 * today (new → reprice …) with the price and tick of each, the NEG if it fills (the intent's `ev`) and the ticks left.
 * Joined by structure only: a sale by the asset it gives (`assetIds`), a bid by the card it wants and the team it is
 * addressed to. Read-only.
 */

const num = z.number();
const str = z.string();
const IntentSchema = z.looseObject({ id: str, route: str.nullish(), kind: str.nullish(), ref: str.nullish(), assetIds: z.array(num).nullish(), price: num.nullish(), ev: num.nullish(), summary: str.nullish() });
const ExecutionSchema = z.looseObject({ id: str, route: str.nullish(), ok: z.boolean().nullish(), detail: str.nullish() });
export const PlanLineSchema = z.looseObject({ tick: num.nullish(), mode: str.nullish(), intents: z.array(z.unknown()).nullish(), execution: z.array(z.unknown()).nullish() });
export type PlanLine = z.infer<typeof PlanLineSchema>;

const OriginOfferSchema = z.looseObject({
  id: num,
  to: str.nullish(),
  give: z.looseObject({ cash: num.nullish(), assets: z.array(z.looseObject({ id: num.nullish(), ref: str.nullish() })).nullish() }).nullish(),
  want: z.looseObject({ cash: num.nullish(), types: z.array(str).nullish(), assets: z.array(z.looseObject({ ref: str.nullish() })).nullish() }).nullish(),
  expires_tick: num.nullish(),
  created_tick: num.nullish(),
});

export interface OriginStep {
  tick: number;
  price: number | null;
  /** new | reprice | safety (from the intent summary), or null. */
  tag: string | null;
  /** Later postings at the same price (a repost after expiry). */
  reposts?: number;
}

export interface OfferOrigin {
  /** trades | rival-page | rival-buy | rival-swap | team-desk | the raw route. */
  route: string;
  steps: OriginStep[];
  /** NEG if it fills, from the last posting's `ev`. */
  neg: number | null;
  ticks_left: number | null;
  /** The last posting's summary (our own text, structure and figures). */
  summary: string | null;
}

interface Posting {
  tick: number;
  route: string;
  ref: string | null;
  assetIds: number[];
  to: string | null;
  price: number | null;
  ev: number | null;
  tag: string | null;
  summary: string | null;
}

export function routeOf(id: string, route: string | null | undefined): string {
  if (id.startsWith("trades:")) return "trades";
  if (id.startsWith("markets:rivalbuy")) return "rival-buy";
  if (id.startsWith("markets:rivalswap") || id.startsWith("markets:swap")) return "rival-swap";
  if (id.startsWith("markets:rival")) return "rival-page";
  if (/^(teamdesk|team-desk|desk)/.test(id)) return "team-desk";
  return route ?? id.split(":")[0] ?? "?";
}

const toOf = (id: string, summary: string | null | undefined): string | null => /:(t\d{2})(?::|$)/.exec(id)?.[1] ?? /\bto=(t\d{2})\b/.exec(summary ?? "")?.[1] ?? null;
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Executed listings of the day (ok and actually sent, not «would»). */
export function postingsOf(lines: readonly PlanLine[]): Posting[] {
  const out: Posting[] = [];
  for (const l of lines) {
    if (l.tick == null) continue;
    const intents = new Map((l.intents ?? []).flatMap((i) => {
      const p = IntentSchema.safeParse(i);
      return p.success ? [[p.data.id, p.data] as const] : [];
    }));
    for (const e of l.execution ?? []) {
      const x = ExecutionSchema.safeParse(e);
      if (!x.success || !x.data.ok || /\bwould\b/i.test(x.data.detail ?? "")) continue;
      const it = intents.get(x.data.id);
      if (!it || it.kind !== "listing") continue;
      out.push({
        tick: l.tick,
        route: routeOf(it.id, it.route),
        ref: it.ref ?? null,
        assetIds: it.assetIds ?? [],
        to: toOf(it.id, it.summary),
        price: it.price ?? null,
        ev: it.ev ?? null,
        tag: /\((new|reprice|safety)\b/.exec(it.summary ?? "")?.[1] ?? null,
        summary: it.summary ?? null,
      });
    }
  }
  return out;
}

/** Origin of each open offer of ours, by offer id. */
/** `offers`: our open offers as the API returns them (parsed here). */
export function offerOriginsOf(lines: readonly PlanLine[], offers: readonly unknown[], tick: number | null): Record<string, OfferOrigin> {
  const postings = postingsOf(lines);
  const out: Record<string, OfferOrigin> = {};
  for (const raw of offers) {
    const parsed = OriginOfferSchema.safeParse(raw);
    if (!parsed.success) continue;
    const o = parsed.data;
    const asset = o.give?.assets?.[0]?.id ?? null;
    const wanted = (o.want?.types?.[0] ?? "").replace(/^card:/, "") || o.want?.assets?.[0]?.ref || null;
    const isSale = asset !== null;
    const created = o.created_tick ?? Infinity;
    const match = postings.filter((p) => p.tick <= created + 1 && (isSale ? p.assetIds.includes(asset) : wanted !== null && p.ref === wanted && p.to === (o.to ?? null)));
    if (!match.length) continue;
    const last = match[match.length - 1]!;
    // This offer's chain: from its last «new» posting on, with identical reposts (same price) collapsed.
    const start = match.map((p) => p.tag).lastIndexOf("new");
    const chain = match.slice(Math.max(0, start)).reduce<OriginStep[]>((acc, p) => {
      const prev = acc[acc.length - 1];
      if (prev && prev.price === p.price) prev.reposts = (prev.reposts ?? 0) + 1;
      else acc.push({ tick: p.tick, price: p.price, tag: p.tag });
      return acc;
    }, []);
    out[String(o.id)] = {
      route: last.route,
      steps: chain.slice(-5),
      neg: last.ev !== null ? round1(last.ev) : null,
      ticks_left: o.expires_tick != null && tick !== null ? o.expires_tick - tick : null,
      summary: last.summary,
    };
  }
  return out;
}
