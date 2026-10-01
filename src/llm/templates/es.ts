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
  accept: [
    (o) => `¡Trato hecho! Aceptamos ${o}. Gracias por la negociación.`,
    (o) => `Aceptamos ${o}. Ha sido un placer negociar contigo.`,
    (o) => `Perfecto, trato hecho: ${o}. Gracias.`,
    (o) => `De acuerdo, aceptamos ${o}. Gracias por tu flexibilidad.`,
  ],
  counter: [
    (o) => `Gracias por tu propuesta. Te propongo ${o}. Creo que es una propuesta justa para ambos.`,
    (o) => `Entiendo tu posición. Mi propuesta es ${o}.`,
    (o) => `Podemos avanzar con ${o}. ¿Qué te parece?`,
    (o) => `Te planteo ${o}; creo que nos acerca a un buen cierre.`,
  ],
  confirmFigures: [
    (o) => `No he podido confirmar tus cifras: ¿me las repites con dígitos? Mientras tanto, te propongo ${o}.`,
    (o) => `Para confirmar tus cifras, ¿me las escribes con dígitos? Por mi parte, propongo ${o}.`,
    (o) => `Quiero confirmar tus cifras antes de seguir: ¿puedes indicarlas con dígitos? Mi propuesta es ${o}.`,
    (o) => `Ayúdame a confirmar tus cifras escribiéndolas con dígitos. Entretanto, te planteo ${o}.`,
  ],
  confirmAcceptance: [
    (o) => `¿Me confirmas que cerramos en ${o}? Respóndeme con un sí y lo damos por cerrado.`,
    (o) => `¿Confirmas entonces ${o}? Con un sí lo cerramos.`,
    (o) => `Solo para estar seguros: ¿confirmas que cerramos en ${o}?`,
    (o) => `¿Me confirmas ${o}? Un sí basta para cerrarlo.`,
  ],
  walk: [
    "Gracias por tu tiempo, pero así no podemos seguir. Lo dejamos aquí.",
    "Lo siento, pero nos retiramos: no vemos un punto de encuentro.",
    "Gracias por la conversación; lamentablemente, terminamos sin acuerdo.",
    "Así no podemos seguir. Gracias de todos modos.",
  ],
  echo: (e, o) => {
    const unit = e.issue === "pct" ? " %" : "";
    const ask =
      e.kind === "range"
        ? `¿Es un ${formatNumber(e.bounds[0])} o un ${formatNumber(e.bounds[1])}${unit}?`
        : `¿Te refieres a ${formatNumber(e.value)}${unit}?`;
    return `${ask} Para seguir necesito una cifra concreta. Mientras tanto, te propongo ${o}.`;
  },
  marks: { accept: "Aceptado", counter: "Contraoferta", walk: "Sin acuerdo", confirmFigures: "Repite tus cifras con dígitos", confirmAcceptance: "Confirma con un sí" },
};
