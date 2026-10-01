import { Card, Flag, WarningBanner } from "@negotiation-ring/design-system";
import type { ApiError } from "../api.js";

/** P8: carga en curso, con una barra de progreso indeterminada (no conocemos el total por adelantado). */
export function LoadingCard({ label }: { label: string }) {
  return (
    <Card title="Loading">
      <div aria-busy="true" style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <span className="nr-cfg">{label}</span>
        <div style={{ height: 6, background: "var(--line)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
        </div>
      </div>
    </Card>
  );
}

/** P8: log inválido. Muestra fichero, línea y campo del primer error, y cuántas líneas válidas se cargaron. */
export function InvalidLogBanner({ errors, validCount }: { errors: readonly ApiError[]; validCount: number }) {
  const first = errors[0];
  if (!first) return null;
  return (
    <WarningBanner tone="warn" title={`${first.file ?? "?"}${first.line !== null ? ` · line ${first.line}` : ""}`}>
      <Flag kind="walk">schema fails</Flag>
      <span style={{ font: "13px var(--font-mono)", color: "var(--ink)" }}>
        field <b>{first.path || "?"}</b>: {first.message}
      </span>
      <span className="nr-muted">{validCount} valid lines loaded.</span>
    </WarningBanner>
  );
}

/** P8: run o partida sin registros. */
export function EmptyStateCard({ title, body, command }: { title: string; body: string; command: string }) {
  return (
    <Card>
      <div style={{ padding: "32px var(--space-4)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", textAlign: "center" }}>
        <h3 className="nr-heading" style={{ fontSize: 16 }}>
          {title}
        </h3>
        <span className="nr-muted">
          {body} <code style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{command}</code>
        </span>
      </div>
    </Card>
  );
}
