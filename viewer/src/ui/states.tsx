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

/** P8: el rival rompió el protocolo. `detail`: rutas y códigos de Zod (torneo, registro `protocol`) o el error de la arena. */
export function ProtocolBreakBanner({ round, detail }: { round: number | null; detail: string }) {
  return (
    <WarningBanner tone="warn" title={`Opponent breaks protocol${round !== null ? ` · R${round}` : ""}`}>
      <Flag kind="walk">breaks protocol</Flag>
      <span style={{ font: "13px var(--font-mono)", color: "var(--ink)" }}>{detail}</span>
    </WarningBanner>
  );
}

/** P8: LLM caído. Solo conteos registrados ("N of M via template"); sin hora ni porcentaje. */
export function TemplateBanner({ templateCount, ourMessageCount, provider }: { templateCount: number; ourMessageCount: number; provider: string | null }) {
  const all = ourMessageCount > 0 && templateCount === ourMessageCount;
  return (
    <WarningBanner tone="info" title={all ? `LLM down · ${provider ? `LLM_PROVIDER ${provider} · ` : ""}everything on template` : "Some messages on template"}>
      <Flag kind="fallback">template</Flag>
      <span style={{ color: "var(--ink)" }}>
        {templateCount} of {ourMessageCount} via template. The engine decides the numbers and the validator still confirms them.
      </span>
    </WarningBanner>
  );
}

/** P8: ZOPA vacía con retirada (arena): reservas registradas y la bandera `zopaEmpty` de las métricas. */
export function EmptyZopaBanner({ ours, rival, walked }: { ours: string; rival: string; walked: boolean }) {
  return (
    <WarningBanner tone="info" title={`Empty ZOPA${walked ? " → walk" : ""}`}>
      <Flag kind={walked ? "walk" : "neutral"}>{walked ? "walk" : "empty ZOPA"}</Flag>
      <span style={{ color: "var(--ink)" }}>
        Their reserve ({rival}) and ours ({ours}) do not overlap: no deal is possible.
      </span>
    </WarningBanner>
  );
}
