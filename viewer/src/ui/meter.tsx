/** Barra de uso de un cupo (`used/of`): llena en aviso al tocar el tope. */
export function Meter({ label, used, of }: { label: string; used: number; of: number }) {
  const pct = of > 0 ? Math.min(100, Math.round((100 * used) / of)) : 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <span>{label}</span>
        <strong>
          {used}/{of}
        </strong>
      </div>
      <div role="meter" aria-label={`${label} ${used} of ${of}`} aria-valuemin={0} aria-valuemax={of} aria-valuenow={used} style={{ height: 6, borderRadius: "var(--radius-pill)", background: "var(--line)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "var(--warn)" : "var(--us)" }} />
      </div>
    </div>
  );
}
