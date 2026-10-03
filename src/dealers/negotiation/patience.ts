import type { Side } from "./negotiator.js";

/**
 * Patience log per conversation: how many messages we sent it, how many times it answered, how many ticks
 * until its final offer (or the close) and what it answered to each of our steps. Live (threads 56 and 125) its
 * patience is spent per exchange (~6–7 of our messages), not per tick. Pure: the agent feeds it.
 */

export interface PatienceStep {
  tick: number;
  kind: "counter" | "hold";
  ourPrice: number;
  /** Size of our step relative to our previous price (absent on the anchor and on holds). */
  step?: number;
  /** Its standing price when sending and the next one we saw; `herMove` = how much it moved towards us. */
  herBefore?: number;
  herAfter?: number;
  herMove?: number;
}

export interface PatienceSummary {
  ourMsgs: number;
  herReplies: number;
  /** Ticks from when it opened until its final offer (if it gave one) or until the close. */
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

  /** Each tick with the thread in view: its standing price, whether it is final and how many messages of its own are in the thread. */
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

  /** Its price when each of our counteroffers was sent (to measure its response per step), if known for all. */
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
