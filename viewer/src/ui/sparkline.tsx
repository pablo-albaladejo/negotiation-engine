/** Línea mínima de una serie (cómo converge una estimación): un punto por valor, el último marcado. */
export function Sparkline({ values, label, width = 96, height = 22 }: { values: number[]; label: string; width?: number; height?: number }) {
  if (values.length === 0) return <span className="nr-muted">—</span>;
  const pad = 3;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (k: number) => (values.length === 1 ? width / 2 : pad + (k * (width - 2 * pad)) / (values.length - 1));
  const y = (v: number) => (hi === lo ? height / 2 : pad + ((hi - v) * (height - 2 * pad)) / (hi - lo));
  const last = values.length - 1;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}: ${values.join(" → ")}`} style={{ verticalAlign: "middle", overflow: "visible" }}>
      {values.length > 1 ? <polyline points={values.map((v, k) => `${x(k)},${y(v)}`).join(" ")} fill="none" stroke="var(--them)" strokeWidth={1.5} /> : null}
      <circle cx={x(last)} cy={y(values[last]!)} r={2.5} fill="var(--them)" />
    </svg>
  );
}
