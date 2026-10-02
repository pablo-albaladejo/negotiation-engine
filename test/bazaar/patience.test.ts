import { describe, expect, it } from "vitest";
import { formatPatience, PatienceLog } from "../../src/bazaar/dealers/patience.js";

describe("registro de paciencia por conversación", () => {
  it("hilo 125 reconstruido: 6 mensajes nuestros, 7 tics hasta su final, su respuesta a cada paso", () => {
    const log = new PatienceLog("sell", 71);
    const her = [5, 5, 6, 6, 6, 6];
    const ours = [20, 19, 18, 17, 16, 15];
    for (let i = 0; i < 6; i++) {
      log.observe(72 + i, her[i], false, i);
      log.sent(72 + i, "counter", ours[i]!, her[i]);
    }
    log.observe(78, 6, true, 6);
    const s = log.summary(78);
    expect(s).toMatchObject({ ourMsgs: 6, herReplies: 6, ticks: 7, untilFinal: true });
    expect(s.steps.map((x) => [x.ourPrice, x.step, x.herMove])).toEqual([
      [20, undefined, 0],
      [19, 1, 1],
      [18, 1, 0],
      [17, 1, 0],
      [16, 1, 0],
      [15, 1, 0],
    ]);
    expect(log.herAtCounters()).toEqual([5, 5, 6, 6, 6, 6]);
    expect(formatPatience(s)).toBe(
      "patience: 6 msgs / 7 ticks until final · her replies 6 · steps: anchor 20 (her +0), step 1 → 19 (her +1), step 1 → 18 (her +0), step 1 → 17 (her +0), step 1 → 16 (her +0), step 1 → 15 (her +0)",
    );
  });

  it("sin final: cuenta tics hasta el cierre; aguantes cuentan como mensajes pero no como paso; la final se fija la primera vez", () => {
    const log = new PatienceLog("buy", 10);
    log.sent(11, "counter", 22, 29);
    log.observe(11, 29, false);
    log.observe(12, 28, false, 1);
    log.sent(12, "hold", 22, 28);
    log.observe(15, 28, false, 1);
    expect(log.summary(16)).toMatchObject({ ourMsgs: 2, herReplies: 1, ticks: 6, untilFinal: false });
    expect(log.summary(16).steps.map((x) => [x.kind, x.herMove])).toEqual([
      ["counter", 1],
      ["hold", 0],
    ]);
    log.observe(17, 27, true);
    log.observe(19, 27, true);
    expect(log.summary(20).ticks).toBe(7);
    expect(formatPatience(log.summary(20))).toMatch(/^patience: 2 msgs \/ 7 ticks until final · her replies 1 · steps: anchor 22 \(her \+1\), hold 22 \(her \+0\)$/);
  });
});
