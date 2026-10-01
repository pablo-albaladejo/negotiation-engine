/**
 * Normalizador numérico compartido (parser determinista, validador y detector de fugas).
 * Convierte texto en ES/EN en lecturas numéricas: cifras y palabras, coma o punto decimal,
 * %, "por ciento", "percent", puntos básicos (100 pb = 1 %), rangos y fracciones ambiguas.
 * Los valores con unidad % o pb se expresan en puntos porcentuales.
 */

export type Unit = "percent" | "bps" | "none";

export interface NumberMention {
  kind: "number";
  text: string;
  start: number;
  end: number;
  /** Lectura literal (en puntos porcentuales si hay unidad % o pb). */
  value: number;
  unit: Unit;
  /** Todas las lecturas posibles, empezando por la literal. */
  readings: number[];
  ambiguous: boolean;
  /** fraction: "0.03" sin unidad (¿0,03 o 3 %?); separator: "1.500" (¿1,5 o 1500?). */
  ambiguity?: "fraction" | "separator";
  source: "digits" | "words";
}

export interface RangeMention {
  kind: "range";
  text: string;
  start: number;
  end: number;
  from: number;
  to: number;
  unit: Unit;
  readings: number[];
}

export type Mention = NumberMention | RangeMention;

interface Token {
  type: "num" | "word" | "sym";
  text: string;
  start: number;
  end: number;
}

const TOKEN_RE = /(\d+(?:[.,]\d+)*)|([\p{L}]+)|(%|½|[-–])/gu;

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.toLowerCase().matchAll(TOKEN_RE)) {
    const type = match[1] ? "num" : match[2] ? "word" : "sym";
    tokens.push({ type, text: match[0], start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}

const SMALL: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21,
  veintiún: 21, veintiuna: 21, veintidós: 22, veintidos: 22, veintitrés: 23, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiséis: 26, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const HUNDREDS_ES: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
  cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500, seiscientos: 600,
  seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800,
  novecientos: 900, novecientas: 900,
};
/** Palabras que casi siempre son artículos o adverbios: solo cuentan con unidad, fracción o tras "día". */
const WEAK = new Set(["un", "una", "uno", "one", "once"]);
const DAY_WORDS = new Set(["día", "dia", "días", "dias", "day", "days"]);
const DECIMAL_WORDS = new Set(["coma", "punto", "point"]);

function isTens(value: number): boolean {
  return value >= 20 && value <= 90 && value % 10 === 0;
}

function gapIsSpace(text: string, a: Token, b: Token): boolean {
  return /^\s*$/.test(text.slice(a.end, b.start));
}

interface Parsed {
  value: number;
  readings: number[];
  ambiguity?: "fraction" | "separator";
  next: number;
  source: "digits" | "words";
  qualified: boolean;
}

function parseDigits(raw: string): { value: number; readings: number[]; separatorAmbiguous: boolean } {
  const seps = raw.match(/[.,]/g) ?? [];
  if (seps.length === 0) return { value: Number(raw), readings: [Number(raw)], separatorAmbiguous: false };
  const parts = raw.split(/[.,]/);
  if (seps.length === 1) {
    const [int, frac] = [parts[0]!, parts[1]!];
    const decimal = Number(`${int}.${frac}`);
    if (frac.length === 3 && Number(int) !== 0) {
      return { value: decimal, readings: [decimal, Number(int + frac)], separatorAmbiguous: true };
    }
    return { value: decimal, readings: [decimal], separatorAmbiguous: false };
  }
  const last = seps.at(-1)!;
  const groupsOk = parts.slice(1, -1).every((p) => p.length === 3);
  if (seps.every((s) => s === last) && groupsOk && parts.at(-1)!.length === 3) {
    const value = Number(parts.join(""));
    return { value, readings: [value], separatorAmbiguous: false };
  }
  if (groupsOk && seps.slice(0, -1).every((s) => s !== last)) {
    const value = Number(`${parts.slice(0, -1).join("")}.${parts.at(-1)}`);
    return { value, readings: [value], separatorAmbiguous: false };
  }
  const value = Number(`${parts[0]}.${parts[1]}`);
  return { value, readings: [value], separatorAmbiguous: true };
}

/** Número en palabras a partir de tokens[i]; null si no empieza un número. */
function parseWords(tokens: Token[], i: number, text: string): { value: number; next: number } | null {
  let total = 0;
  let current = 0;
  let j = i;
  let consumed = 0;
  let lastSmall: number | null = null;
  while (j < tokens.length) {
    const tok = tokens[j]!;
    if (consumed > 0 && !gapIsSpace(text, tokens[j - 1]!, tok) && tok.type !== "sym") break;
    if (tok.type !== "word" && !(tok.type === "sym" && tok.text === "-")) break;
    const w = tok.text;
    if (w in SMALL) {
      const v = SMALL[w]!;
      // "twenty five": decena seguida de unidad; cualquier otra pareja son dos números.
      if (lastSmall !== null && !(isTens(lastSmall) && v > 0 && v < 10)) break;
      current += v;
      lastSmall = v;
    } else if (w in HUNDREDS_ES) {
      if (current !== 0) break;
      current = HUNDREDS_ES[w]!;
      lastSmall = null;
    } else if (w === "hundred" && consumed > 0) {
      current = (current || 1) * 100;
      lastSmall = null;
    } else if ((w === "mil" || w === "thousand") && (consumed > 0 || w === "mil")) {
      total += (current || 1) * 1000;
      current = 0;
      lastSmall = null;
    } else if ((w === "y" || w === "-" || w === "and") && consumed > 0) {
      // "treinta y dos", "twenty-five", "one hundred and five"
      const nextTok = tokens[j + 1];
      const nv = nextTok && nextTok.text in SMALL ? SMALL[nextTok.text]! : null;
      const afterTens = lastSmall !== null && isTens(lastSmall) && nv !== null && nv > 0 && nv < 10;
      const afterHundred = w === "and" && lastSmall === null && current > 0 && nv !== null;
      if (!(afterTens || afterHundred)) break;
      current += nv!;
      lastSmall = nv!;
      j += 2;
      consumed += 2;
      continue;
    } else {
      break;
    }
    j++;
    consumed++;
  }
  if (consumed === 0) return null;
  return { value: total + current, next: j };
}

function parseNumberAt(tokens: Token[], i: number, text: string): Parsed | null {
  const tok = tokens[i]!;
  let value: number;
  let readings: number[];
  let ambiguity: "separator" | undefined;
  let next: number;
  let source: "digits" | "words";
  let qualified = false;

  if (tok.type === "num") {
    const parsed = parseDigits(tok.text);
    ({ value, readings } = parsed);
    if (parsed.separatorAmbiguous) ambiguity = "separator";
    next = i + 1;
    source = "digits";
    qualified = true;
  } else if (tok.type === "word") {
    const words = parseWords(tokens, i, text);
    if (!words) return null;
    ({ value, next } = words);
    readings = [value];
    source = "words";
    qualified = !(next === i + 1 && WEAK.has(tok.text));
    // Decimales en palabras: "dos coma cinco", "two point five".
    const marker = tokens[next];
    if (marker && DECIMAL_WORDS.has(marker.text) && gapIsSpace(text, tokens[next - 1]!, marker)) {
      let digits = "";
      let k = next + 1;
      while (k < tokens.length && gapIsSpace(text, tokens[k - 1]!, tokens[k]!)) {
        const t = tokens[k]!;
        if (t.type === "num" && !/[.,]/.test(t.text)) digits += t.text;
        else if (t.type === "word" && t.text in SMALL && SMALL[t.text]! < 10) digits += String(SMALL[t.text]);
        else break;
        k++;
      }
      if (digits) {
        value = Number(`${value}.${digits}`);
        readings = [value];
        next = k;
        qualified = true;
      }
    }
  } else {
    return null;
  }

  // "y medio", "y media", "and a half".
  const t1 = tokens[next];
  const t2 = tokens[next + 1];
  const t3 = tokens[next + 2];
  if (t1?.text === "y" && (t2?.text === "medio" || t2?.text === "media") && gapIsSpace(text, t1, t2)) {
    value += 0.5;
    readings = [value];
    next += 2;
    qualified = true;
  } else if (t1?.text === "and" && t2?.text === "a" && t3?.text === "half") {
    value += 0.5;
    readings = [value];
    next += 3;
    qualified = true;
  } else if (t1?.text === "½" && gapIsSpace(text, tokens[next - 1]!, t1)) {
    value += 0.5;
    readings = [value];
    next += 1;
    qualified = true;
  }

  const result: Parsed = { value, readings, next, source, qualified };
  if (ambiguity) result.ambiguity = ambiguity;
  return result;
}

/** Unidad tras el número (solo separada por espacios); devuelve la unidad y el índice siguiente. */
function parseUnit(tokens: Token[], i: number, text: string): { unit: Unit; next: number } {
  const at = (k: number) => {
    const t = tokens[k];
    if (!t || !gapIsSpace(text, tokens[k - 1]!, t)) return undefined;
    return t.text;
  };
  const a = at(i);
  const b = a === undefined ? undefined : at(i + 1);
  if (a === "%") return { unit: "percent", next: i + 1 };
  if (a === "por" && b === "ciento") return { unit: "percent", next: i + 2 };
  if (a === "porciento" || a === "percent" || a === "pct" || a === "pp") return { unit: "percent", next: i + 1 };
  if (a === "per" && b === "cent") return { unit: "percent", next: i + 2 };
  if ((a === "puntos" || a === "punto") && (b === "porcentuales" || b === "porcentual")) return { unit: "percent", next: i + 2 };
  if (a === "percentage" && (b === "points" || b === "point")) return { unit: "percent", next: i + 2 };
  if (a === "pb" || a === "bps" || a === "bp" || a === "pbs") return { unit: "bps", next: i + 1 };
  if (a === "p" && tokens[i + 1]?.text === "b") return { unit: "bps", next: i + 2 };
  if ((a === "puntos" || a === "punto") && (b === "básicos" || b === "basicos" || b === "básico" || b === "basico")) {
    return { unit: "bps", next: i + 2 };
  }
  if (a === "basis" && (b === "points" || b === "point")) return { unit: "bps", next: i + 2 };
  return { unit: "none", next: i };
}

function convert(value: number, unit: Unit): number {
  return unit === "bps" ? value / 100 : value;
}

interface RawNumber {
  mention: NumberMention;
  firstToken: number;
  lastToken: number;
}

function scanNumbers(text: string, tokens: Token[]): RawNumber[] {
  const found: RawNumber[] = [];
  let i = 0;
  while (i < tokens.length) {
    const parsed = parseNumberAt(tokens, i, text);
    if (!parsed) {
      i++;
      continue;
    }
    const { unit, next } = parseUnit(tokens, parsed.next, text);
    const prev = tokens[i - 1];
    const afterDay = prev !== undefined && DAY_WORDS.has(prev.text);
    if (!parsed.qualified && unit === "none" && !afterDay) {
      i = parsed.next;
      continue;
    }
    const start = tokens[i]!.start;
    const end = tokens[next - 1]!.end;
    const value = convert(parsed.value, unit);
    let readings = parsed.readings.map((r) => convert(r, unit));
    let ambiguity = parsed.ambiguity;
    if (!ambiguity && unit === "none" && parsed.source === "digits" && value > 0 && value < 1) {
      readings = [value, value * 100];
      ambiguity = "fraction";
    }
    const mention: NumberMention = {
      kind: "number",
      text: text.slice(start, end),
      start,
      end,
      value,
      unit,
      readings,
      ambiguous: ambiguity !== undefined,
      source: parsed.source,
    };
    if (ambiguity) mention.ambiguity = ambiguity;
    found.push({ mention, firstToken: i, lastToken: next - 1 });
    i = next;
  }
  return found;
}

const RANGE_OPENERS: Record<string, Set<string>> = {
  y: new Set(["entre"]),
  and: new Set(["between"]),
  a: new Set(["de", "desde"]),
  to: new Set(["from"]),
};

export function normalizeNumbers(text: string): Mention[] {
  const tokens = tokenize(text);
  const numbers = scanNumbers(text, tokens);
  const mentions: Mention[] = [];
  for (let k = 0; k < numbers.length; k++) {
    const a = numbers[k]!;
    const b = numbers[k + 1];
    if (b) {
      const gap = text.slice(a.mention.end, b.mention.start).trim().toLowerCase();
      const opener = tokens[a.firstToken - 1]?.text;
      const isDash = gap === "-" || gap === "–";
      const isWordRange = gap in RANGE_OPENERS && opener !== undefined && RANGE_OPENERS[gap]!.has(opener);
      const isBareRange = (gap === "a" || gap === "to") && a.mention.unit === "none";
      if (isDash || isWordRange || isBareRange) {
        const unit = a.mention.unit !== "none" ? a.mention.unit : b.mention.unit;
        const from = a.mention.unit === "none" ? convert(a.mention.value, unit) : a.mention.value;
        const to = b.mention.value;
        const start = isWordRange ? tokens[a.firstToken - 1]!.start : a.mention.start;
        mentions.push({
          kind: "range",
          text: text.slice(start, b.mention.end),
          start,
          end: b.mention.end,
          from: Math.min(from, to),
          to: Math.max(from, to),
          unit,
          readings: [from, to, ...a.mention.readings.slice(1), ...b.mention.readings.slice(1)],
        });
        k++;
        continue;
      }
    }
    mentions.push(a.mention);
  }
  return mentions;
}

/** Todas las lecturas numéricas del texto (incluidas las alternativas de cifras ambiguas y extremos de rangos). */
export function allReadings(text: string): number[] {
  return normalizeNumbers(text).flatMap((m) => m.readings);
}
