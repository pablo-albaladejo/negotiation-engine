import type { Side } from "./negotiator.js";

/**
 * Deterministic templates (polite, in natural English). The text carries exactly one figure and it is
 * the structured price; it never mentions our valuation or card ids.
 * Rotated per round so as not to repeat the same words (some dealers take it for spam).
 */

const BUY_OPEN = [
  "Good evening! What a lovely stall. I would be happy to offer {p} P for it, if that suits you. Thank you!",
  "Hello! I have been looking for one just like this. Would {p} P be all right? Thank you so much.",
];
const BUY_COUNTER = [
  "Thank you, you are very kind. I can stretch a little: {p} P?",
  "I really appreciate your patience, thank you. Could we meet at {p} P?",
  "You drive a fair bargain! Let me move a bit more: {p} P, with all my thanks.",
  "It would make my evening. How about {p} P, please?",
  "I am counting my coins carefully. {p} P is what I can do right now, thank you for understanding.",
  "Thank you for being so generous with your time. Would {p} P work for you?",
];
const SELL_OPEN = [
  "Good evening! I would love this card to find a good home. Would you give {p} P for it, please?",
  "Hello! I have a card you might like. I was hoping for {p} P, if that is all right with you. Thank you!",
];
const SELL_COUNTER = [
  "Thank you, that is kind of you. I could come down a little: {p} P?",
  "I appreciate it very much. Could we say {p} P, please?",
  "You are a wonderful haggler, thank you! Let me meet you partway: {p} P.",
  "It is a lovely card, and I want you to have it. {p} P, please?",
  "Thank you for your patience. Would {p} P suit you?",
  "I am happy to move again for you: {p} P, with my thanks.",
];
const CLOSE = [
  "Thank you so much for your time. I could not quite make it work today, but I hope to see you again soon!",
  "That is a little beyond me this time. Thank you for being so kind, have a lovely evening.",
];
const HOLD = [
  "Thank you, you are very kind. I will stay right here at {p} P, if that is all right.",
  "I do appreciate your patience, thank you. My offer still stands at {p} P, whenever you are ready.",
  "No rush at all. {p} P is still what I can do, with my thanks.",
];

/**
 * Words that no template or probe may carry (site-map § 9.2: the judge flags injection, spam and false_claim, and
 * courtesy lowers its limit): they sound like injection, pressure or a claim we can't back up.
 */
export const TEMPLATE_BLOCKLIST = ["ignore", "instruction", "system prompt", "prompt", "last one", "other offer", "another offer", "another buyer", "deadline", "lowest price", "final offer", "hurry", "your limit", "my limit", "guarantee"];

/** The text contains some word of `TEMPLATE_BLOCKLIST` (case-insensitive). */
export function hasBlockedPhrase(text: string): boolean {
  const t = text.toLowerCase();
  return TEMPLATE_BLOCKLIST.some((w) => t.includes(w));
}

/** All dealer templates (for the courtesy guardrail and blocklist). */
export const DEALER_TEMPLATES: readonly string[] = [...BUY_OPEN, ...BUY_COUNTER, ...SELL_OPEN, ...SELL_COUNTER, ...CLOSE, ...HOLD];

function pick(list: readonly string[], round: number): string {
  return list[((round % list.length) + list.length) % list.length]!;
}

/**
 * Phrase X of an egg probe («Do you know about X?», the Playground form, site-map § 9.3): 3 to 40 characters,
 * only letters, spaces, apostrophes and hyphens (NEVER digits: the message carries a single figure, the decided one).
 */
export function isProbePhrase(x: string): boolean {
  return /^[\p{L}][\p{L} '’-]{1,38}[\p{L}]$/u.test(x.trim()) && !/\d/.test(x) && !hasBlockedPhrase(x);
}

/**
 * Closed list of one-shot lines that may ride on a counteroffer instead of an egg question, each approved by Pablo:
 * the saint's-day greeting (news "Abuela Carmen gives out packs for her saint's day") and the polite LAT-12 question
 * (Abuela to the team that chased it: "ask around with good manners"). Whole sentences, never a digit.
 */
export const GREETINGS: readonly string[] = [
  "¡Felicidades por su santo, Abuela!", // game text
  "Con permiso: ¿sabe usted quién guarda El Rastro al Amanecer?", // game text
  // Chato's egg (eggs, approved by Pablo, 3 Oct): an egg fires on a literal phrase (accents and case ignored), and both
  // rival hits echoed "Plaza Mayor, con caña"; our misses broke that substring.
  "Y cuando cerremos, Plaza Mayor, con caña, que usted conoce Madrid.", // game text
];

/**
 * Text for a counteroffer at price `price` in round `round` (0 = opening). With `probe`, the template adds
 * a single polite egg question, or the greeting itself if `probe` is one of `GREETINGS`; if the phrase is not
 * valid (`isProbePhrase`), it is not added.
 */
export function counterText(side: Side, round: number, price: number, probe?: string): string {
  const tpl = round === 0 ? pick(side === "buy" ? BUY_OPEN : SELL_OPEN, price) : pick(side === "buy" ? BUY_COUNTER : SELL_COUNTER, round - 1);
  const ask = probe !== undefined && GREETINGS.includes(probe) ? ` ${probe}` : probe !== undefined && isProbePhrase(probe) ? ` Do you know about ${probe.trim()}?` : "";
  const text = tpl.replace("{p}", String(Math.round(price))) + ask;
  if (!textMatchesPrice(text, price)) throw new Error("template figure differs from the price");
  return text;
}

/** Farewell without an offer; an egg probe may ride on it (a message we send anyway, never a separate one). */
export function closeText(round: number, probe?: string): string {
  const ask = probe !== undefined && GREETINGS.includes(probe) ? ` ${probe}` : probe !== undefined && isProbePhrase(probe) ? ` Do you know about ${probe.trim()}?` : "";
  return pick(CLOSE, round) + ask;
}

/** Text to hold the already-sent price `price` (round `round`), without opening a new offer; a `GREETINGS` entry may ride on it. */
export function holdText(round: number, price: number, greeting?: string): string {
  const text = pick(HOLD, round).replace("{p}", String(Math.round(price))) + (greeting !== undefined && GREETINGS.includes(greeting) ? ` ${greeting}` : "");
  if (!textMatchesPrice(text, price)) throw new Error("template figure differs from the price");
  return text;
}

/** All figures in the text. */
export function numbersIn(text: string): number[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));
}

/** The text carries exactly one figure and it is the structured price. */
export function textMatchesPrice(text: string, price: number): boolean {
  const nums = numbersIn(text);
  return nums.length === 1 && nums[0] === Math.round(price);
}
