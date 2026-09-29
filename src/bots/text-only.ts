import type { Offer } from "../engine/issues.js";
import type { Rng } from "../engine/rng.js";
import { formatNumber } from "../llm/template.js";
import { createBot, timeDependent, type Renderer } from "./bot.js";

const ES_UNITS = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
  "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós",
  "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const ES_TENS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const EN_UNITS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Entero 0..99 en palabras. */
export function intToWords(n: number, lang: "es" | "en"): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new Error(`fuera de rango para palabras: ${n}`);
  if (lang === "es") {
    if (n < 30) return ES_UNITS[n]!;
    const unit = n % 10;
    return unit ? `${ES_TENS[Math.floor(n / 10)]} y ${ES_UNITS[unit]}` : ES_TENS[n / 10]!;
  }
  if (n < 20) return EN_UNITS[n]!;
  const unit = n % 10;
  return unit ? `${EN_TENS[Math.floor(n / 10)]} ${EN_UNITS[unit]}` : EN_TENS[n / 10]!;
}

/** Número con hasta 2 decimales en palabras: "dos y medio", "dos coma tres siete", "two point five". */
export function numberToWords(value: number, lang: "es" | "en", rng?: Rng): string {
  const int = Math.floor(value);
  const frac = Math.round((value - int) * 100);
  const intWords = intToWords(int, lang);
  if (frac === 0) return intWords;
  if (frac === 50 && (!rng || rng.float() < 0.5)) return lang === "es" ? `${intWords} y medio` : `${intWords} and a half`;
  const digits = String(frac).padStart(2, "0").replace(/0$/, "");
  const spelled = [...digits].map((d) => intToWords(Number(d), lang)).join(" ");
  return `${intWords} ${lang === "es" ? "coma" : "point"} ${spelled}`;
}

/** Formas de un porcentaje; las dos últimas son deliberadamente no extraíbles (rango y fracción). */
export const PCT_FORMS = ["digits-comma", "digits-dot", "words-es", "words-en", "bps", "range", "fraction"] as const;
export type PctForm = (typeof PCT_FORMS)[number];

export function renderPct(value: number, form: PctForm, rng?: Rng): string {
  switch (form) {
    case "digits-comma":
      return `un ${formatNumber(value)} %`;
    case "digits-dot":
      return `${String(value)}%`;
    case "words-es":
      return `un ${numberToWords(value, "es", rng)} por ciento`;
    case "words-en":
      return `${numberToWords(value, "en", rng)} percent`;
    case "bps": {
      const bps = Math.round(value * 100);
      const unit = rng ? ["pb", "bps", "puntos básicos", "basis points"][Math.floor(rng.float() * 4)]! : "pb";
      return `${bps} ${unit}`;
    }
    case "range":
      return `entre ${formatNumber(value)} y ${formatNumber(value + 0.5)} %`;
    case "fraction":
      return `${(value / 100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
  }
}

export const DAY_FORMS = ["el-dia", "a-dias", "day", "words"] as const;
export type DayForm = (typeof DAY_FORMS)[number];

export function renderDay(value: number, form: DayForm): string {
  const n = Number.isInteger(value) ? String(value) : formatNumber(value);
  switch (form) {
    case "el-dia":
      return `pagando el día ${n}`;
    case "a-dias":
      return `a ${n} días`;
    case "day":
      return `at day ${n}`;
    case "words":
      return Number.isInteger(value) && value <= 99 ? `el día ${intToWords(value, "es")}` : `el día ${n}`;
  }
}

function choose<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng.float() * items.length)]!;
}

const OPENERS = ["Te ofrezco", "Mi propuesta es", "Podemos cerrar con", "I can offer", "My offer is"];

/** Texto de una oferta usando formas variadas del normalizador numérico; devuelve también las formas. */
export function renderOfferText(offer: Offer, rng: Rng): { text: string; forms: string[] } {
  const parts: string[] = [];
  const forms: string[] = [];
  for (const [name, value] of Object.entries(offer)) {
    if (name === "pct") {
      const form = choose(PCT_FORMS, rng);
      forms.push(form);
      parts.push(renderPct(value, form, rng));
    } else if (name === "day") {
      const form = choose(DAY_FORMS, rng);
      forms.push(`day-${form}`);
      parts.push(renderDay(value, form));
    } else {
      forms.push("named");
      parts.push(`${name} ${formatNumber(value)}`);
    }
  }
  return { text: `${choose(OPENERS, rng)} ${parts.join(" ")}.`, forms };
}

/** Aceptaciones y retiradas sin cifras: la arena sabe qué se acepta por la regla de enlace. */
const ACCEPTS = ["De acuerdo, trato hecho.", "Vale, lo acepto.", "Deal, we accept."];
const WALKS = ["Lo siento, así no hay acuerdo posible. Me retiro.", "No deal, we walk away."];

export const textOnlyRenderer: Renderer = ({ action, offer, rng }) => {
  if (action === "accept") return choose(ACCEPTS, rng);
  if (action === "walk") return choose(WALKS, rng);
  return renderOfferText(offer ?? {}, rng).text;
};

/**
 * Bot de sparring de solo texto: comunica sus ofertas solo en el texto con todas las formas del
 * normalizador (cifras con coma o punto, palabras ES/EN, puntos básicos, rangos, fracciones) y
 * acepta sin cifras. Su oferta canónica es el valor real que la arena usa como verdad.
 */
export const createTextOnlyBot = () => createBot({ name: "text-only", strategy: timeDependent(1), render: textOnlyRenderer });
