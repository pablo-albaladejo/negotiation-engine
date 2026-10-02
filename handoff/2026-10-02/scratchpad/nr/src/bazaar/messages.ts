import type { Side } from "./negotiator.js";

/**
 * Plantillas deterministas (amables, en inglés natural). El texto lleva exactamente una cifra y es
 * la del precio estructurado; nunca menciona nuestra valoración ni ids de cartas.
 * Se rota por ronda para no repetir las mismas palabras (algunos dealers lo toman por spam).
 */

const BUY_OPEN = [
  "Good evening, Abuela Carmen! What a lovely stall. I would be happy to offer {p} P for it, if that suits you.",
  "Hello, Abuela! I have been looking for one just like this. Would {p} P be all right? Thank you so much.",
];
const BUY_COUNTER = [
  "Thank you, Abuela, you are very kind. I can stretch a little: {p} P?",
  "I really appreciate your patience. Could we meet at {p} P?",
  "You drive a fair bargain! Let me move a bit more: {p} P, with all my thanks.",
  "It would make my evening. How about {p} P?",
  "I am counting my coins carefully, Abuela. {p} P is what I can do right now.",
  "Thank you for being so generous with your time. Would {p} P work for you?",
];
const SELL_OPEN = [
  "Good evening, Abuela Carmen! This one has been with me a while and I would love it to find a good home. Would you give {p} P for it?",
  "Hello, Abuela! I have a card you might like. I was hoping for {p} P, if that is all right with you.",
];
const SELL_COUNTER = [
  "Thank you, Abuela, that is kind of you. I could come down a little: {p} P?",
  "I appreciate it very much. Could we say {p} P?",
  "You are a wonderful haggler! Let me meet you partway: {p} P.",
  "It is a lovely card, and I want you to have it. {p} P?",
  "Thank you for your patience. Would {p} P suit you?",
  "I am happy to move again for you: {p} P, with my thanks.",
];
const CLOSE = [
  "Thank you so much for your time, Abuela. I could not quite make it work today, but I hope to see you again soon!",
  "That is a little beyond me this time. Thank you for being so kind, Abuela, have a lovely evening.",
];

function pick(list: readonly string[], round: number): string {
  return list[((round % list.length) + list.length) % list.length]!;
}

/** Texto para una contraoferta con precio `price` en la ronda `round` (0 = apertura). */
export function counterText(side: Side, round: number, price: number): string {
  const tpl = round === 0 ? pick(side === "buy" ? BUY_OPEN : SELL_OPEN, price) : pick(side === "buy" ? BUY_COUNTER : SELL_COUNTER, round - 1);
  const text = tpl.replace("{p}", String(Math.round(price)));
  if (!textMatchesPrice(text, price)) throw new Error("plantilla con cifra distinta del precio");
  return text;
}

export function closeText(round: number): string {
  return pick(CLOSE, round);
}

/** Todas las cifras del texto. */
export function numbersIn(text: string): number[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));
}

/** El texto lleva exactamente una cifra y es la del precio estructurado. */
export function textMatchesPrice(text: string, price: number): boolean {
  const nums = numbersIn(text);
  return nums.length === 1 && nums[0] === Math.round(price);
}
