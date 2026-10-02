/**
 * One row per logged pipeline step, with a unique name when a box ran more than once in the
 * round (e.g. `parser#1`, `parser#2`); a box that ran only once keeps its bare name.
 */
export function nameLatencySteps(boxes: readonly { box: string; latencyMs: number }[]): { name: string; latencyMs: number }[] {
  const counts = new Map<string, number>();
  for (const b of boxes) counts.set(b.box, (counts.get(b.box) ?? 0) + 1);
  const seen = new Map<string, number>();
  return boxes.map((b) => {
    if (counts.get(b.box) === 1) return { name: b.box, latencyMs: b.latencyMs };
    const n = (seen.get(b.box) ?? 0) + 1;
    seen.set(b.box, n);
    return { name: `${b.box}#${n}`, latencyMs: b.latencyMs };
  });
}
