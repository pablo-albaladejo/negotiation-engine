import type {
  BoardBookRow,
  BoardVenueBook,
  BoardVenueBooks,
} from "../../model/index.js";

/**
 * Pure filters and labels for the «Venues» tab: every open venue's book (play's venue-books.json) with each offer marked
 * against our hand. Presentation only: the NEG figure is a guide, never a price the agent uses.
 */

export interface VenueFilters {
  /** Asks for a card we lack. */
  lack: boolean;
  /** Bids for a card we hold. */
  ourBids: boolean;
  /** NEG > 0 at our values (fee included). */
  negPositive: boolean;
  /** Hide venues we don't operate on (they lift a rival's market). */
  hideOffLimits: boolean;
  /** Card ref substring (SAL-0…). */
  ref: string;
}

export const NO_FILTERS: VenueFilters = {
  lack: false,
  ourBids: false,
  negPositive: false,
  hideOffLimits: false,
  ref: "",
};

export function keepRow(r: BoardBookRow, f: VenueFilters): boolean {
  if (f.lack && !(r.side === "ask" && r.mark === "lack")) return false;
  if (
    f.ourBids &&
    !(r.side === "bid" && (r.mark === "spare" || r.mark === "last"))
  )
    return false;
  if (f.negPositive && !(r.neg !== null && r.neg > 0)) return false;
  if (
    f.ref &&
    !r.refs.some((x) => x.toLowerCase().includes(f.ref.trim().toLowerCase()))
  )
    return false;
  return true;
}

const anyFilter = (f: VenueFilters) =>
  f.lack || f.ourBids || f.negPositive || f.ref.trim() !== "";

/** Venues after the filters; with a row filter on, venues left empty are dropped. */
export function filterVenues(
  books: BoardVenueBooks,
  f: VenueFilters,
): BoardVenueBook[] {
  return books.venues
    .filter((v) => !(f.hideOffLimits && v.off_limits))
    .map((v) => ({
      ...v,
      asks: v.asks.filter((r) => keepRow(r, f)),
      bids: v.bids.filter((r) => keepRow(r, f)),
      swaps: v.swaps.filter((r) => keepRow(r, f)),
    }))
    .filter(
      (v) =>
        !anyFilter(f) || v.asks.length + v.bids.length + v.swaps.length > 0,
    );
}

export type Tone = "ok" | "warn" | "muted" | "us" | null;

/** What the mark means for us, and its tone (green only on a positive NEG we could take: a lacking card or a spare). */
export function markLabel(r: BoardBookRow): { text: string; tone: Tone } {
  switch (r.mark) {
    case "ours":
      return { text: "ours", tone: "us" };
    case "lack":
      return {
        text: "we lack it",
        tone: r.neg !== null && r.neg > 0 ? "ok" : "muted",
      };
    case "spare":
      return {
        text: `spare (×${r.hand ?? "?"})`,
        tone: r.neg !== null && r.neg > 0 ? "ok" : "muted",
      };
    case "last":
      return { text: "our last copy", tone: "warn" };
    case "keep":
      return { text: "never sold (hidden/keepsake)", tone: "warn" };
    case "dup":
      return { text: `dup (we hold ×${r.hand ?? "?"})`, tone: "muted" };
    default:
      return { text: "", tone: null };
  }
}

/** Counts for the summary line: offers, takeable NEG > 0, offers to us. */
export function summaryOf(venues: readonly BoardVenueBook[]): {
  offers: number;
  positive: number;
  toUs: number;
} {
  const rows = venues.flatMap((v) => [...v.asks, ...v.bids, ...v.swaps]);
  return {
    offers: rows.length,
    positive: rows.filter(
      (r) =>
        r.neg !== null &&
        r.neg > 0 &&
        (r.mark === "lack" || r.mark === "spare"),
    ).length,
    toUs: rows.filter((r) => r.to_us).length,
  };
}
