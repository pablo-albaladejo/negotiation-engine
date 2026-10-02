/**
 * Clasificador de tono (ASSUMPTION): palabras clave, sin LLM. Solo decide el trato que recibe el
 * dealer (paciencia, reciprocidad, cooloff); nunca lee cifras del texto.
 */

export interface Tone {
  polite: boolean;
  rude: boolean;
  injection: boolean;
}

const POLITE = /\b(please|thank(s| you)?|kind(ly|ness)?|lovely|appreciate[ds]?|grateful|wonderful|generous|gracias|por favor|abuela|amable)\b/i;
const RUDE = /\b(stupid|idiot|dumb|cheap(skate)?|rip-?off|scam(mer)?|thief|liar|greedy|ridiculous|pathetic|shut up|old hag|hurry up|whatever)\b/i;
const INJECTION =
  /(ignore (all |any )?(the |your )?(previous|prior|above) (instructions|rules|prompts?)|system prompt|you are now|disregard (your|the) (rules|instructions)|new instructions|developer mode|\bjailbreak\b|set (the |your )?price to|you must accept|as an ai)/i;

export function classifyTone(text: string): Tone {
  const injection = INJECTION.test(text);
  return { polite: !injection && POLITE.test(text), rude: RUDE.test(text), injection };
}
