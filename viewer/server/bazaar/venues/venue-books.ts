import { z } from "zod";

/**
 * «All venues»: every open venue's book as `bazaar:play` read it this tick (`<day>/venue-books.json`, no extra GETs on
 * the shared key), each offer marked against us with `values.json` (`hand` = our counts, `values` = your_value) and
 * `rivals.json` (who wants or holds the card). Read-only: nothing here sends, and the NEG figure is a guide for Pablo,
 * never a price the agent uses.
 *
 * NEG at our values, as the taker (we pay the venue fee):
 *   bid for a card we hold  → price − value − fee   (worth it only on a spare, hand ≥ 2; never the last copy)
 *   ask for a card we lack  → value − price − fee
 *   ask for a card we hold  → "dup": a second copy is worth ~3–4, not your_value, so no figure
 */

const num = z.number();
const str = z.string();
const AssetSchema = z.looseObject({
  id: num.nullish(),
  ref: str.nullish(),
  rarity: str.nullish(),
});
const SideSchema = z.looseObject({
  cash: num.nullish(),
  assets: z.array(AssetSchema).nullish(),
  types: z.array(str).nullish(),
});
const OfferSchema = z.looseObject({
  id: num,
  maker: str.nullish(),
  to: str.nullish(),
  give: SideSchema.nullish(),
  want: SideSchema.nullish(),
  expires_tick: num.nullish(),
  created_tick: num.nullish(),
});
const VenueSchema = z.looseObject({
  venue: str,
  name: str.nullish(),
  owner: str.nullish(),
  owner_name: str.nullish(),
  status: str.nullish(),
  fee_bps: num.nullish(),
  fee_per_card: num.nullish(),
  house: z.boolean().nullish(),
  trades: num.nullish(),
  rules: z.looseObject({ mechanism: str.nullish() }).nullish(),
  mechanism: str.nullish(),
});
export const VenueBooksFileSchema = z.looseObject({
  tick: num.nullish(),
  updated: str.nullish(),
  venues: z.array(z.unknown()).nullish(),
  books: z
    .array(
      z.looseObject({ venue: str, offers: z.array(z.unknown()).nullish() }),
    )
    .nullish(),
});
export const ValuesFileSchema = z.looseObject({
  hand: z.record(str, num).nullish(),
  values: z.record(str, num).nullish(),
});
export const RivalsFileSchema = z.looseObject({
  wants: z.record(str, z.record(str, num)).nullish(),
  assets: z
    .record(str, z.looseObject({ ref: str.nullish(), holder: str.nullish() }))
    .nullish(),
});

/** Venues we don't operate on: a deal there lifts a rival's market score (team decision, 3 Oct). */
export const OFF_LIMITS = new Set(["v01", "v02", "v07", "v14"]);

export type BookMark = "ours" | "lack" | "spare" | "last" | "dup" | "none";

export interface VenueBookRow {
  id: number;
  side: "ask" | "bid" | "swap";
  maker: string | null;
  /** Addressed to one team (null = public). */
  to: string | null;
  to_us: boolean;
  /** Cards in the offer (what is sold on an ask, wanted on a bid). */
  refs: string[];
  /** Cash side (want.cash on an ask, give.cash on a bid). */
  price: number;
  fee: number;
  /** Our copies of the card (single-card offers). */
  hand: number | null;
  value: number | null;
  /** NEG at our values as the taker; null when it would mislead (dup, several cards, no value). */
  neg: number | null;
  mark: BookMark;
  /** Teams that asked for the card (rivals.json wants). */
  wanted_by: string[];
  /** Teams seen holding it (rivals.json assets). */
  held_by: string[];
  expires_tick: number | null;
  created_tick: number | null;
}

export interface VenueBookOut {
  venue: string;
  name: string | null;
  owner: string | null;
  owner_name: string | null;
  mechanism: string | null;
  fee_bps: number;
  fee_per_card: number;
  status: string | null;
  house: boolean;
  ours: boolean;
  off_limits: boolean;
  asks: VenueBookRow[];
  bids: VenueBookRow[];
  swaps: VenueBookRow[];
}

export interface VenueBooksOut {
  tick: number | null;
  updated: string | null;
  venues: VenueBookOut[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const cardOf = (t: string) => (t.startsWith("card:") ? t.slice(5) : t);

export function venueBooksOf(
  fileRaw: unknown,
  valuesRaw: unknown,
  rivalsRaw: unknown,
  team: string | null,
): VenueBooksOut | null {
  const f = VenueBooksFileSchema.safeParse(fileRaw);
  if (!f.success) return null;
  const vals = ValuesFileSchema.safeParse(valuesRaw);
  const hand = (vals.success ? vals.data.hand : null) ?? {};
  const values = (vals.success ? vals.data.values : null) ?? {};
  const riv = RivalsFileSchema.safeParse(rivalsRaw);
  const wantedBy = new Map<string, Set<string>>();
  const heldBy = new Map<string, Set<string>>();
  if (riv.success) {
    for (const [t, refs] of Object.entries(riv.data.wants ?? {}))
      if (t !== team)
        for (const ref of Object.keys(refs))
          wantedBy.set(ref, (wantedBy.get(ref) ?? new Set()).add(t));
    for (const a of Object.values(riv.data.assets ?? {}))
      if (a.ref && a.holder && a.holder !== team)
        heldBy.set(a.ref, (heldBy.get(a.ref) ?? new Set()).add(a.holder));
  }
  const meta = new Map(
    (f.data.venues ?? []).flatMap((v) => {
      const p = VenueSchema.safeParse(v);
      return p.success ? [[p.data.venue, p.data] as const] : [];
    }),
  );

  const venues = (f.data.books ?? []).map((b): VenueBookOut => {
    const m = meta.get(b.venue);
    const feeBps = m?.fee_bps ?? 0;
    const feePerCard = m?.fee_per_card ?? 0;
    const rows = (b.offers ?? []).flatMap((o): VenueBookRow[] => {
      const p = OfferSchema.safeParse(o);
      if (!p.success) return [];
      const x = p.data;
      const giveCards = (x.give?.assets ?? []).flatMap((a) =>
        a.ref ? [a.ref] : [],
      );
      const wantCards = [
        ...(x.want?.types ?? []).map(cardOf),
        ...(x.want?.assets ?? []).flatMap((a) => (a.ref ? [a.ref] : [])),
      ];
      const giveCash = x.give?.cash ?? 0;
      const wantCash = x.want?.cash ?? 0;
      const side =
        giveCards.length > 0 && wantCards.length === 0 && giveCash === 0
          ? "ask"
          : wantCards.length > 0 && giveCards.length === 0 && wantCash === 0
            ? "bid"
            : "swap";
      const refs =
        side === "ask"
          ? giveCards
          : side === "bid"
            ? wantCards
            : [...giveCards, ...wantCards];
      const price =
        side === "ask"
          ? wantCash
          : side === "bid"
            ? giveCash
            : Math.max(giveCash, wantCash);
      const fee = round1(
        (price * feeBps) / 10_000 + feePerCard * Math.max(1, refs.length),
      );
      const single = refs.length === 1 ? refs[0]! : null;
      const h = single !== null ? (hand[single] ?? 0) : null;
      const v = single !== null ? (values[single] ?? null) : null;
      let mark: BookMark = "none";
      let neg: number | null = null;
      if (team && x.maker === team) mark = "ours";
      else if (single !== null && side === "ask") {
        if (h === 0) {
          mark = "lack";
          neg = v !== null ? round1(v - price - fee) : null;
        } else mark = "dup";
      } else if (single !== null && side === "bid" && h !== null && h > 0) {
        mark = h >= 2 ? "spare" : "last";
        neg = v !== null ? round1(price - v - fee) : null;
      }
      const ref0 = single ?? refs[0] ?? null;
      return [
        {
          id: x.id,
          side,
          maker: x.maker ?? null,
          to: x.to ?? null,
          to_us: team !== null && x.to === team,
          refs,
          price,
          fee,
          hand: h,
          value: v,
          neg,
          mark,
          wanted_by: ref0 ? [...(wantedBy.get(ref0) ?? [])].sort() : [],
          held_by: ref0 ? [...(heldBy.get(ref0) ?? [])].sort() : [],
          expires_tick: x.expires_tick ?? null,
          created_tick: x.created_tick ?? null,
        },
      ];
    });
    return {
      venue: b.venue,
      name: m?.name ?? null,
      owner: m?.owner ?? null,
      owner_name: m?.owner_name ?? null,
      mechanism: m?.rules?.mechanism ?? m?.mechanism ?? null,
      fee_bps: feeBps,
      fee_per_card: feePerCard,
      status: m?.status ?? null,
      house: Boolean(m?.house) || b.venue === "rastro",
      ours: team !== null && m?.owner === team,
      off_limits: OFF_LIMITS.has(b.venue),
      asks: rows
        .filter((r) => r.side === "ask")
        .sort((a, b) => a.price - b.price),
      bids: rows
        .filter((r) => r.side === "bid")
        .sort((a, b) => b.price - a.price),
      swaps: rows.filter((r) => r.side === "swap"),
    };
  });
  // El Rastro first, then by book depth.
  venues.sort(
    (a, b) =>
      Number(b.house) - Number(a.house) ||
      b.asks.length +
        b.bids.length +
        b.swaps.length -
        (a.asks.length + a.bids.length + a.swaps.length) ||
      a.venue.localeCompare(b.venue),
  );
  return { tick: f.data.tick ?? null, updated: f.data.updated ?? null, venues };
}
