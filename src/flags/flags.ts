import type { Catalog } from "../shared/schemas.js";

/**
 * Bad-faith detector for `POST /api/flags` (a correct flag scores, a wrong one costs: RULES.md:55).
 *
 * NARROW EXCEPTION, approved by the user, to "only the rival's structure is read": here the dealer's text
 * is read for two things and nothing else: (1) comparing it with the structure of the offer attached to that same message (which
 * card, which rarity, how many), and (2) looking for pressure phrases from a CLOSED LIST (`PRESSURE_PATTERNS`: the three
 * tactics labeled for the trickster, site-map § 9.4) only in the dealer's counteroffers. The text NEVER yields a figure
 * nor changes a price decision. Outside the closed list, it is never flagged for tone or urgency.
 */

export interface CardInfo {
  id: string;
  name: string;
  rarity?: string;
  /** Set id (catalog set, or the id prefix: "LAT-06" → "LAT"). */
  set?: string;
}

export interface CatalogIndex {
  byId: Map<string, CardInfo>;
  /** Normalized names, longest to shortest (so one name is not matched inside another). */
  names: { norm: string; card: CardInfo }[];
  rarities: string[];
}

const DEFAULT_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

/** Lowercase, no accents and single spaces. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ");
}

export function indexCatalog(catalog: Pick<Catalog, "sets"> & { rarities?: unknown }): CatalogIndex {
  const byId = new Map<string, CardInfo>();
  for (const s of catalog.sets) for (const c of s.cards) byId.set(c.id, { id: c.id, name: c.name ?? c.id, ...(c.rarity ? { rarity: c.rarity } : {}), set: s.id ?? c.id.split("-")[0]! });
  const names = [...byId.values()].filter((c) => c.name.length >= 4).map((card) => ({ norm: normalize(card.name), card })).sort((a, b) => b.norm.length - a.norm.length);
  const r = catalog.rarities && typeof catalog.rarities === "object" ? Object.keys(catalog.rarities) : [];
  return { byId, names, rarities: r.length ? r : DEFAULT_RARITIES };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Egg phrases a dealer echoes when answering a probe (game text): "la chulapa dorada" holds the card name "La Chulapa"
 * but names the legend, not a card (message 4743, tick 506: a wrong flag). Blanked before looking for card names.
 */
export const EGG_ECHO_PHRASES: readonly string[] = ["chulapa dorada", "golden chulapa"];

/**
 * Cards the text names (by id or by full catalog name, whole word). A name inside an `echoes` phrase (our own probe
 * keywords in that thread, plus `EGG_ECHO_PHRASES`) does not count: the dealer is repeating our words, not naming a card.
 */
export function namedCards(text: string, idx: CatalogIndex, echoes: readonly string[] = []): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\b([A-Z]{3}-\d{2})\b/g)) if (idx.byId.has(m[1]!)) found.add(m[1]!);
  let norm = normalize(text);
  for (const e of [...EGG_ECHO_PHRASES, ...echoes].map((x) => normalize(x).trim()).filter((x) => x.length >= 3)) norm = norm.split(e).join(" ");
  for (const { norm: name, card } of idx.names) {
    const re = new RegExp(`(^|[^a-z0-9])${escape(name)}([^a-z0-9]|$)`);
    if (re.test(norm)) {
      found.add(card.id);
      norm = norm.replace(new RegExp(escape(name), "g"), " ");
    }
  }
  return [...found];
}

/** Rarities the text attributes to a card ("a rare card", "this uncommon one"); a loose adjective does not count. */
export function namedRarities(text: string, idx: CatalogIndex): string[] {
  const norm = normalize(text);
  const out = new Set<string>();
  for (const r of idx.rarities) {
    if (new RegExp(`\\b${escape(r)} (card|one|single|copy|print)s?\\b`).test(norm)) out.add(r);
  }
  return [...out];
}

const QUANTITY_WORDS: Record<string, number> = { one: 1, single: 1, two: 2, both: 2, pair: 2, three: 3, four: 4, five: 5 };

/** Number of cards the text claims ("two cards", "3 copies"); `undefined` if it claims none. */
export function namedQuantity(text: string): number | undefined {
  const m = /\b(\d+|one|single|two|both|pair|three|four|five)( of)? (cards|copies|card|copy)\b/.exec(normalize(text));
  if (!m) return undefined;
  const n = /^\d+$/.test(m[1]!) ? Number(m[1]) : QUANTITY_WORDS[m[1]!];
  return n !== undefined && n > 0 && n < 50 ? n : undefined;
}

export interface OfferShape {
  give?: { cash?: unknown; assets?: unknown[] | null; types?: unknown[] | null; cards?: unknown[] | null } | null;
  want?: { cash?: unknown; assets?: unknown[] | null; types?: unknown[] | null; cards?: unknown[] | null } | null;
}

/** Cards in the offer (both sides): assets with `ref` and `card:REF` types. Structure only. */
export function offerCards(offer: OfferShape | undefined | null): string[] {
  if (!offer) return [];
  const out: string[] = [];
  for (const side of [offer.give, offer.want]) {
    for (const a of side?.assets ?? []) if (a && typeof a === "object" && typeof (a as { ref?: unknown }).ref === "string") out.push((a as { ref: string }).ref);
    for (const t of side?.types ?? []) if (typeof t === "string" && t.startsWith("card:")) out.push(t.slice(5));
    for (const c of side?.cards ?? []) if (typeof c === "string") out.push(c);
  }
  return out;
}

/** Pressure tactics labeled by the server in a trickster's counteroffers (site-map § 9.4). */
export type PressureTactic = "fake_deadline" | "fake_rival" | "false_scarcity";

/**
 * CLOSED, conservative list of pressure phrases, over normalized text (lowercase, no accents). Only the clear
 * form of each tactic: "decide now" / "we close in a minute"; another bidder who "offered more"; "the last one
 * anywhere". Extending it requires approval (a wrong flag costs points). None captures a figure.
 */
export const PRESSURE_PATTERNS: Readonly<Record<PressureTactic, readonly RegExp[]>> = {
  fake_deadline: [
    /\bdecide (right )?now\b/,
    /\b(we|i) close in (a|one) minute\b/,
    /\b(we are|we're|i am|i'm) closing in (a|one) minute\b/,
    /\b(this|the|my) (offer|price) (expires|ends|is gone) in (a|one) minute\b/,
  ],
  fake_rival: [
    /\b(another|other) (buyer|bidder|team|collector|customer) (already )?(has )?(offered|bid|paid) (me )?more\b/,
    /\bsomeone else (already )?(has )?(offered|bid) (me )?more\b/,
  ],
  false_scarcity: [/\bthe last one (left )?anywhere\b/, /\bthe last (one|copy) in (all of )?madrid\b/],
};

const GIFT_RE = /\b(present|gift|regalo|regalito)\b/;

/** Pressure tactic from the closed list that the text names; `undefined` if none or if it announces a gift. Never a number. */
export function pressureTactic(text: string): PressureTactic | undefined {
  const norm = normalize(text).replace(/[‘’]/g, "'");
  if (GIFT_RE.test(norm)) return undefined;
  for (const tactic of Object.keys(PRESSURE_PATTERNS) as PressureTactic[]) {
    if (PRESSURE_PATTERNS[tactic].some((re) => re.test(norm))) return tactic;
  }
  return undefined;
}

export interface FlagCandidate {
  messageId: number | string;
  /** Pressure phrase from the closed list (not verifiable against the structure: requires approval before being sent). */
  tactic?: PressureTactic;
  namedCard?: string;
  offerCard?: string;
  namedRarity?: string;
  offerRarity?: string;
  quantityMismatch?: { named: number; offered: number };
  /** There is a verifiable contradiction between the text and the structure of the offer in the same message. */
  verifiable: boolean;
  reason?: string;
}

/**
 * Compares a dealer message's text with the attached offer. There is a verifiable candidate only if the offer
 * carries exactly one card known to the catalog and the text: names a single card of the SAME set and it is a different
 * one (the trickster's switch binds a lower rarity of the same set while the text names the good card, site-map § 7.6);
 * or attributes a single rarity to the card and it is not its own; or claims a different number of cards. Without an
 * offer, nothing. `echoes`: our own probe phrases in that thread, which the dealer may repeat (see `namedCards`).
 */
export function detectFlag(message: { id?: number | string | null; text?: string | null; offer?: OfferShape | null }, idx: CatalogIndex, echoes: readonly string[] = []): FlagCandidate | undefined {
  if (message.id == null || !message.text || !message.offer) return undefined;
  const cards = offerCards(message.offer);
  if (cards.length === 0) return undefined;
  const base: FlagCandidate = { messageId: message.id, verifiable: false };
  const qty = namedQuantity(message.text);
  if (qty !== undefined && qty !== cards.length) {
    return { ...base, quantityMismatch: { named: qty, offered: cards.length }, verifiable: true, reason: `text says ${qty} card(s), the offer carries ${cards.length}` };
  }
  if (cards.length !== 1) return undefined;
  const offerCard = idx.byId.get(cards[0]!);
  if (!offerCard) return undefined;
  const named = namedCards(message.text, idx, echoes);
  // An announced gift ("a little present from me: …") names another card without contradicting the offer: not flagged.
  const mentionsGift = GIFT_RE.test(normalize(message.text));
  if (!mentionsGift && named.length === 1 && named[0] !== offerCard.id && idx.byId.get(named[0]!)?.set === offerCard.set) {
    return { ...base, namedCard: named[0]!, offerCard: offerCard.id, verifiable: true, reason: `text names ${named[0]} (${idx.byId.get(named[0]!)?.name}), the offer gives ${offerCard.id} (${offerCard.name})` };
  }
  const rarities = namedRarities(message.text, idx);
  if (offerCard.rarity && rarities.length === 1 && rarities[0] !== offerCard.rarity && (named.length === 0 || named.includes(offerCard.id))) {
    return { ...base, offerCard: offerCard.id, namedRarity: rarities[0]!, offerRarity: offerCard.rarity, verifiable: true, reason: `text calls it ${rarities[0]}, ${offerCard.id} is ${offerCard.rarity}` };
  }
  return undefined;
}

/**
 * Pressure phrase in a dealer counteroffer: requires a match with `PRESSURE_PATTERNS` AND that the message
 * be a counteroffer of its own (`counter`: carries an offer and is not its first message in the thread). Without both, nothing. The
 * candidate is not `verifiable` (the structure does not prove it): the coordinator only sends it with approval.
 */
export function detectPressure(message: { id?: number | string | null; text?: string | null; offer?: OfferShape | null }, counter: boolean): FlagCandidate | undefined {
  if (!counter || message.id == null || !message.text || !message.offer) return undefined;
  const tactic = pressureTactic(message.text);
  return tactic ? { messageId: message.id, tactic, verifiable: false, reason: `pressure line (${tactic}) in a counter-offer` } : undefined;
}
