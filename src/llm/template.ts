import { z } from "zod";
import type { Offer } from "../engine/issues.js";
import { defineBox, registerBox } from "../pipeline/box.js";
import { en } from "./templates/en.js";
import { es } from "./templates/es.js";
import type { TemplatePack } from "./templates/types.js";

/** Cifra en la forma española (coma decimal); la usan también los bots. */
export const formatNumber = es.formatNumber;
export const formatOffer = es.formatOffer;

/** Plantillas por idioma (subetiqueta principal BCP-47). */
export const TEMPLATE_PACKS: Readonly<Record<string, TemplatePack>> = { en, es };

/** Opciones de idioma de la plantilla (claves `template.*` de la configuración de ejecución). */
export interface TemplateLanguageOptions {
  languages: readonly string[];
  fallbackLanguage: string;
  uncovered: "neutral" | "fallback-language";
}

export const DEFAULT_TEMPLATE_OPTIONS: TemplateLanguageOptions = { languages: ["en", "es"], fallbackLanguage: "en", uncovered: "neutral" };

export function primaryLanguage(tag: string | undefined): string | undefined {
  return tag?.split("-")[0]?.toLowerCase() || undefined;
}

/** Plantilla para un idioma: la suya si está en `languages`; si no, la de `fallbackLanguage`. */
function packFor(language: string, options: TemplateLanguageOptions): { pack: TemplatePack; covered: boolean } {
  const covered = options.languages.some((l) => primaryLanguage(l) === language) && TEMPLATE_PACKS[language] !== undefined;
  if (covered) return { pack: TEMPLATE_PACKS[language]!, covered };
  return { pack: TEMPLATE_PACKS[primaryLanguage(options.fallbackLanguage) ?? "en"] ?? en, covered: false };
}

/** Idioma en que queda escrita la plantilla (el de la forma neutral es `fallbackLanguage`). */
export function templateLanguage(language: string | undefined, options: TemplateLanguageOptions = DEFAULT_TEMPLATE_OPTIONS): string {
  const lang = primaryLanguage(language) ?? "es";
  const { covered } = packFor(lang, options);
  return covered ? lang : (primaryLanguage(options.fallbackLanguage) ?? "en");
}

/** Petición al rival que acompaña a la contraoferta (solo enums). */
export const AskSchema = z.enum(["confirm-figures", "confirm-acceptance"]);
export type Ask = z.infer<typeof AskSchema>;

export interface TemplateDecision {
  action: "accept" | "counter" | "walk";
  offer?: Offer;
  /** Solo texto sin oferta confirmada: la contraoferta pide que el rival repita sus cifras. */
  ask?: Ask;
}

/** Forma neutral: marca breve de la acción en `fallbackLanguage` y las cifras con su issue y unidad. */
function renderNeutral(decision: TemplateDecision, pack: TemplatePack): string {
  const figures = Object.entries(decision.offer ?? {})
    .map(([name, value]) => `${name} ${pack.formatNumber(value)}${name === "pct" ? "%" : ""}`)
    .join(", ");
  switch (decision.action) {
    case "accept":
      return `${pack.marks.accept}: ${figures}.`;
    case "walk":
      return `${pack.marks.walk}.`;
    case "counter": {
      const ask = decision.ask === "confirm-figures" ? `${pack.marks.confirmFigures}. ` : decision.ask === "confirm-acceptance" ? `${pack.marks.confirmAcceptance}. ` : "";
      return `${ask}${pack.marks.counter}: ${figures}.`;
    }
  }
}

/**
 * Plantilla determinista de la persona "cálido-firme" en el idioma dado (por defecto español):
 * escribe exactamente las cifras decididas con dígitos ASCII. Un idioma sin plantilla usa la forma
 * neutral o la plantilla completa de `fallbackLanguage`, según `uncovered`.
 */
export function renderTemplate(decision: TemplateDecision, language?: string, options: TemplateLanguageOptions = DEFAULT_TEMPLATE_OPTIONS): string {
  const lang = primaryLanguage(language) ?? "es";
  const { pack, covered } = packFor(lang, options);
  if (!covered && options.uncovered === "neutral") return renderNeutral(decision, pack);
  const offer = decision.offer ?? {};
  switch (decision.action) {
    case "accept":
      return pack.accept(offer);
    case "counter":
      if (decision.ask === "confirm-acceptance") return pack.confirmAcceptance(offer);
      if (decision.ask === "confirm-figures") return pack.confirmFigures(offer);
      return pack.counter(offer);
    case "walk":
      return pack.walk();
  }
}

export const templateBox = defineBox({
  name: "template",
  input: z
    .object({
      action: z.enum(["accept", "counter", "walk"]),
      offer: z.record(z.string(), z.number()).optional(),
      ask: AskSchema.optional(),
    })
    .strict(),
  output: z.object({ text: z.string().min(1) }).strict(),
  run: (input) => {
    const decision: TemplateDecision = { action: input.action };
    if (input.offer) decision.offer = input.offer;
    if (input.ask) decision.ask = input.ask;
    return { text: renderTemplate(decision) };
  },
});

registerBox(templateBox);
