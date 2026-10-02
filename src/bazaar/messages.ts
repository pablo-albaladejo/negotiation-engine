import type { Side } from "./negotiator.js";

/**
 * Plantillas deterministas (amables, en inglés natural). El texto lleva exactamente una cifra y es
 * la del precio estructurado; nunca menciona nuestra valoración ni ids de cartas.
 * Se rota por ronda para no repetir las mismas palabras (algunos dealers lo toman por spam).
 */

const BUY_OPEN = [
  "Good evening! What a lovely stall. I would be happy to offer {p} P for it, if that suits you.",
  "Hello! I have been looking for one just like this. Would {p} P be all right? Thank you so much.",
];
const BUY_COUNTER = [
  "Thank you, you are very kind. I can stretch a little: {p} P?",
  "I really appreciate your patience. Could we meet at {p} P?",
  "You drive a fair bargain! Let me move a bit more: {p} P, with all my thanks.",
  "It would make my evening. How about {p} P?",
  "I am counting my coins carefully. {p} P is what I can do right now.",
  "Thank you for being so generous with your time. Would {p} P work for you?",
];
const SELL_OPEN = [
  "Good evening! This one has been with me a while and I would love it to find a good home. Would you give {p} P for it?",
  "Hello! I have a card you might like. I was hoping for {p} P, if that is all right with you.",
];
const SELL_COUNTER = [
  "Thank you, that is kind of you. I could come down a little: {p} P?",
  "I appreciate it very much. Could we say {p} P?",
  "You are a wonderful haggler! Let me meet you partway: {p} P.",
  "It is a lovely card, and I want you to have it. {p} P?",
  "Thank you for your patience. Would {p} P suit you?",
  "I am happy to move again for you: {p} P, with my thanks.",
];
const CLOSE = [
  "Thank you so much for your time. I could not quite make it work today, but I hope to see you again soon!",
  "That is a little beyond me this time. Thank you for being so kind, have a lovely evening.",
];
const HOLD = [
  "Thank you, you are very kind. I will stay right here at {p} P, if that is all right.",
  "I do appreciate your patience. My offer still stands at {p} P, whenever you are ready.",
  "No rush at all. {p} P is still what I can do, with my thanks.",
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

/** Texto para aguantar el precio `price` ya enviado (ronda `round`), sin abrir una oferta nueva. */
export function holdText(round: number, price: number): string {
  const text = pick(HOLD, round).replace("{p}", String(Math.round(price)));
  if (!textMatchesPrice(text, price)) throw new Error("plantilla con cifra distinta del precio");
  return text;
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
