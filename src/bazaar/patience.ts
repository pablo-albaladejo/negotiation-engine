import type { Side } from "./negotiator.js";

/**
 * Registro de paciencia por conversación: cuántos mensajes le mandamos, cuántas veces contestó, cuántos tics
 * hasta su oferta final (o el cierre) y qué respondió a cada paso nuestro. En vivo (hilos 56 y 125) su
 * paciencia se gasta por intercambio (~6–7 mensajes nuestros), no por tic. Puro: lo alimenta el agente.
 */

export interface PatienceStep {
  tick: number;
  kind: "counter" | "hold";
  ourPrice: number;
  /** Tamaño de nuestro paso respecto a nuestro precio anterior (sin él en el ancla y en los aguantes). */
  step?: number;
  /** Su precio vigente al enviar y el siguiente que vimos; `herMove` = lo que se movió hacia nosotros. */
  herBefore?: number;
  herAfter?: number;
  herMove?: number;
}

export interface PatienceSummary {
  ourMsgs: number;
  herReplies: number;
  /** Tics desde que se abrió hasta su oferta final (si la dio) o hasta el cierre. */
  ticks: number;
  untilFinal: boolean;
  steps: PatienceStep[];
}

export class PatienceLog {
  private readonly steps: PatienceStep[] = [];
  private herReplies = 0;
  private finalTick: number | undefined;

  constructor(
    readonly side: Side,
    readonly openTick: number,
  ) {}

  /** Cada tic con el hilo a la vista: su precio vigente, si es final y cuántos mensajes suyos hay en el hilo. */
  observe(tick: number, herPrice: number | undefined, herFinal: boolean, herMessages?: number): void {
    if (herMessages !== undefined) this.herReplies = Math.max(this.herReplies, herMessages);
    if (herFinal && this.finalTick === undefined) this.finalTick = tick;
    const last = this.steps[this.steps.length - 1];
    if (herPrice !== undefined && last && last.herAfter === undefined && tick > last.tick) {
      last.herAfter = herPrice;
      if (last.herBefore !== undefined) last.herMove = this.side === "buy" ? last.herBefore - herPrice : herPrice - last.herBefore;
    }
  }

  sent(tick: number, kind: "counter" | "hold", ourPrice: number, herBefore: number | undefined): void {
    const prev = [...this.steps].reverse().find((s) => s.kind === "counter");
    this.steps.push({
      tick,
      kind,
      ourPrice,
      ...(kind === "counter" && prev ? { step: Math.abs(ourPrice - prev.ourPrice) } : {}),
      ...(herBefore !== undefined ? { herBefore } : {}),
    });
  }

  /** Su precio al enviar cada una de nuestras contraofertas (para medir su respuesta por paso), si se conoce en todas. */
  herAtCounters(): number[] | undefined {
    const at = this.steps.filter((s) => s.kind === "counter").map((s) => s.herBefore);
    return at.every((x): x is number => x !== undefined) ? at : undefined;
  }

  summary(tick: number): PatienceSummary {
    const untilFinal = this.finalTick !== undefined;
    return { ourMsgs: this.steps.length, herReplies: this.herReplies, ticks: (this.finalTick ?? tick) - this.openTick, untilFinal, steps: this.steps.map((s) => ({ ...s })) };
  }
}

/** "patience: 6 msgs / 7 ticks until final · her replies 6 · steps: anchor 20 (her +0), step 1 → 19 (her +1), …" */
export function formatPatience(s: PatienceSummary): string {
  const steps = s.steps.map((x) => {
    const her = x.herMove !== undefined ? ` (her ${x.herMove >= 0 ? "+" : ""}${x.herMove})` : x.herBefore !== undefined ? ` (her ${x.herBefore}, no reply yet)` : "";
    const what = x.kind === "hold" ? `hold ${x.ourPrice}` : x.step === undefined ? `anchor ${x.ourPrice}` : `step ${x.step} → ${x.ourPrice}`;
    return `${what}${her}`;
  });
  return `patience: ${s.ourMsgs} msgs / ${s.ticks} ticks until ${s.untilFinal ? "final" : "close"} · her replies ${s.herReplies}${steps.length ? ` · steps: ${steps.join(", ")}` : ""}`;
}
