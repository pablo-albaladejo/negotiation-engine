import type { ReactNode } from "react";

/** Sección plegable: lo secundario (historial, mercado, lo descartado) no compite con lo que hay que decidir ahora. */
export function Fold({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="nr-card" open={open} style={{ padding: "var(--space-3) var(--space-4)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>{title}</summary>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>{children}</div>
    </details>
  );
}
