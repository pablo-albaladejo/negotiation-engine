import type { Offer } from "../../engine/issues.js";
import { formatWith, type TemplatePack } from "./types.js";

const formatNumber = (value: number) => formatWith(value, ",");

function formatIssue(name: string, value: number): string {
  if (name === "pct") return `un ${formatNumber(value)} %`;
  if (name === "day") return `pago el día ${formatNumber(value)}`;
  return `${name} ${formatNumber(value)}`;
}

const formatOffer = (offer: Offer) =>
  Object.entries(offer)
    .map(([name, value]) => formatIssue(name, value))
    .join(", con ");

/** Plantilla en español de la persona "cálido-firme". */
export const es: TemplatePack = {
  formatNumber,
  formatOffer,
  accept: (offer) => `¡Trato hecho! Aceptamos ${formatOffer(offer)}. Gracias por la negociación.`,
  counter: (offer) => `Gracias por tu propuesta. Te propongo ${formatOffer(offer)}. Creo que es una propuesta justa para ambos.`,
  confirmFigures: (offer) => `No he podido confirmar tus cifras: ¿me las repites con dígitos? Mientras tanto, te propongo ${formatOffer(offer)}.`,
  confirmAcceptance: (offer) => `¿Me confirmas que cerramos en ${formatOffer(offer)}? Respóndeme con un sí y lo damos por cerrado.`,
  walk: () => "Gracias por tu tiempo, pero así no podemos seguir. Lo dejamos aquí.",
  marks: { accept: "Aceptado", counter: "Contraoferta", walk: "Sin acuerdo", confirmFigures: "Repite tus cifras con dígitos", confirmAcceptance: "Confirma con un sí" },
};
