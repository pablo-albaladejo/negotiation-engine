import type { PairedCluster } from "./arena.js";
import type { ClusterSummary } from "./metrics.js";

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}`);

function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, k) => Math.max(h.length, ...rows.map((r) => r[k]!.length)));
  const line = (cells: string[]) => cells.map((c, k) => (k < 3 ? c.padEnd(widths[k]!) : c.padStart(widths[k]!))).join("  ");
  return [line(header), widths.map((w) => "-".repeat(w)).join("  "), ...rows.map(line)].join("\n");
}

/** Tabla de consola por clúster escenario × rival. */
export function clusterTable(clusters: readonly ClusterSummary[]): string {
  return table(
    ["escenario", "rival", "rol", "n", "acuerdo%", "excedente%", "viol", "rondas", "fugas", "plantilla", "lat ms", "mal extr", "err rival"],
    clusters.map((c) => [
      c.scenarioId,
      c.rival,
      c.role,
      String(c.games),
      pct(c.agreementRate),
      pct(c.meanSurplus),
      String(c.violations),
      c.meanRoundsToAgreement === null ? "—" : c.meanRoundsToAgreement.toFixed(1),
      String(c.leaks),
      String(c.templateFallbacks),
      c.latencyMeanMs === null ? "—" : c.latencyMeanMs.toFixed(2),
      `${c.misExtracted}/${c.unextracted}`,
      String(c.rivalErrors),
    ]),
  );
}

export function pairedTable(pairs: readonly PairedCluster[]): string {
  return table(
    ["escenario", "rival", "", "pares", "campeona%", "candidata%", "dif pp"],
    pairs.map((p) => [p.scenarioId, p.rival, "", String(p.pairs), pct(p.champion), pct(p.candidate), p.diffPp === null ? "—" : p.diffPp.toFixed(2)]),
  );
}
