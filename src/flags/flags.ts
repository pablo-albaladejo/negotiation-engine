import type { Catalog } from "../shared/schemas.js";

/**
 * Detector de mala fe para `POST /api/flags` (un flag correcto puntúa, uno erróneo cuesta: RULES.md:55).
 *
 * EXCEPCIÓN ESTRECHA, aprobada por el usuario, a «del rival solo se lee la estructura»: aquí se lee el texto del
 * dealer, pero SOLO para compararlo con la estructura de la oferta adjunta a ese mismo mensaje (qué carta, qué
 * rareza, cuántas). El texto NUNCA da una cifra ni cambia una decisión de precio. Solo se propone un flag cuando la
 * contradicción es verificable con la estructura y el catálogo; nunca por tono, presión ni frases de urgencia.
 */

export interface CardInfo {
  id: string;
  name: string;
  rarity?: string;
}

export interface CatalogIndex {
  byId: Map<string, CardInfo>;
  /** Nombres normalizados, del más largo al más corto (para no casar un nombre dentro de otro). */
  names: { norm: string; card: CardInfo }[];
  rarities: string[];
}

const DEFAULT_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

/** Minúsculas, sin acentos y con espacios simples. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ");
}

export function indexCatalog(catalog: Pick<Catalog, "sets"> & { rarities?: unknown }): CatalogIndex {
  const byId = new Map<string, CardInfo>();
  for (const s of catalog.sets) for (const c of s.cards) byId.set(c.id, { id: c.id, name: c.name ?? c.id, ...(c.rarity ? { rarity: c.rarity } : {}) });
  const names = [...byId.values()].filter((c) => c.name.length >= 4).map((card) => ({ norm: normalize(card.name), card })).sort((a, b) => b.norm.length - a.norm.length);
  const r = catalog.rarities && typeof catalog.rarities === "object" ? Object.keys(catalog.rarities) : [];
  return { byId, names, rarities: r.length ? r : DEFAULT_RARITIES };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Cartas que el texto nombra (por id o por nombre completo del catálogo, palabra entera). */
export function namedCards(text: string, idx: CatalogIndex): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/\b([A-Z]{3}-\d{2})\b/g)) if (idx.byId.has(m[1]!)) found.add(m[1]!);
  let norm = normalize(text);
  for (const { norm: name, card } of idx.names) {
    const re = new RegExp(`(^|[^a-z0-9])${escape(name)}([^a-z0-9]|$)`);
    if (re.test(norm)) {
      found.add(card.id);
      norm = norm.replace(new RegExp(escape(name), "g"), " ");
    }
  }
  return [...found];
}

/** Rarezas que el texto atribuye a una carta («a rare card», «this uncommon one»); un adjetivo suelto no cuenta. */
export function namedRarities(text: string, idx: CatalogIndex): string[] {
  const norm = normalize(text);
  const out = new Set<string>();
  for (const r of idx.rarities) {
    if (new RegExp(`\\b${escape(r)} (card|one|single|copy|print)s?\\b`).test(norm)) out.add(r);
  }
  return [...out];
}

const QUANTITY_WORDS: Record<string, number> = { one: 1, single: 1, two: 2, both: 2, pair: 2, three: 3, four: 4, five: 5 };

/** Cantidad de cartas que el texto afirma («two cards», «3 copies»); `undefined` si no la afirma. */
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

/** Cartas de la oferta (ambos lados): activos con `ref` y tipos `card:REF`. Solo estructura. */
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

export interface FlagCandidate {
  messageId: number | string;
  namedCard?: string;
  offerCard?: string;
  namedRarity?: string;
  offerRarity?: string;
  quantityMismatch?: { named: number; offered: number };
  /** Hay una contradicción verificable entre el texto y la estructura de la oferta del mismo mensaje. */
  verifiable: boolean;
  reason?: string;
}

/**
 * Compara el texto de un mensaje del dealer con la oferta adjunta. Solo hay candidato verificable si la oferta
 * trae exactamente una carta conocida por el catálogo y el texto: nombra una única carta y es otra; o atribuye una
 * única rareza a la carta y no es la suya; o afirma un número de cartas distinto. Sin oferta, nada.
 */
export function detectFlag(message: { id?: number | string | null; text?: string | null; offer?: OfferShape | null }, idx: CatalogIndex): FlagCandidate | undefined {
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
  const named = namedCards(message.text, idx);
  // Un regalo anunciado («a little present from me: …») nombra otra carta sin contradecir la oferta: no se marca.
  const mentionsGift = /\b(present|gift|regalo|regalito)\b/.test(normalize(message.text));
  if (!mentionsGift && named.length === 1 && named[0] !== offerCard.id) {
    return { ...base, namedCard: named[0]!, offerCard: offerCard.id, verifiable: true, reason: `text names ${named[0]} (${idx.byId.get(named[0]!)?.name}), the offer gives ${offerCard.id} (${offerCard.name})` };
  }
  const rarities = namedRarities(message.text, idx);
  if (offerCard.rarity && rarities.length === 1 && rarities[0] !== offerCard.rarity && (named.length === 0 || named.includes(offerCard.id))) {
    return { ...base, offerCard: offerCard.id, namedRarity: rarities[0]!, offerRarity: offerCard.rarity, verifiable: true, reason: `text calls it ${rarities[0]}, ${offerCard.id} is ${offerCard.rarity}` };
  }
  return undefined;
}
