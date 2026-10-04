/**
 * Venue for every offer we post (bids, asks, directed). Pablo, 4 Oct: only on v21 (Team 9's market, 0% fee, board),
 * Team 9 being our allies; feeding their Market-making score is deliberate.
 */
export const OFFER_VENUE = "v21";
/** Team that owns `OFFER_VENUE`: the server refuses a directed offer to it there (`self_venue`). */
export const OFFER_VENUE_OWNER = "t09";

/** Our own offers still count as ours on El Rastro (posted before the switch), so the lanes keep managing them. */
export const isOurOfferVenue = (venue: string | null | undefined): boolean => venue === OFFER_VENUE || venue === "rastro";
