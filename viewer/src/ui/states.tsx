import { Card, ChatMessage, Flag, Legend, WarningBanner } from "@negotiation-ring/design-system";
import type { ReactNode } from "react";
import type { ApiError } from "../api.js";

/** Flag + text inside a `WarningBanner`: stacked, left-aligned, so the Flag never stretches full width. */
function BannerBody({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "var(--space-2)" }}>{children}</div>;
}

/**
 * P8: carga en curso. Sin un conteo real de líneas/partidas leídas (la API no lo reporta hoy),
 * la barra es indeterminada: sin `aria-valuenow`, con `aria-busy`.
 */
export function LoadingCard({ label, current, total }: { label: string; current?: number; total?: number }) {
  const isDeterminate = current !== undefined && total !== undefined && total > 0;
  const percentage = isDeterminate ? (current / total) * 100 : 0;
  return (
    <Card title="Loading">
      <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <span className="nr-cfg">{label}</span>
        <div
          role="progressbar"
          {...(isDeterminate ? { "aria-valuenow": percentage, "aria-valuemin": 0, "aria-valuemax": 100 } : { "aria-busy": true })}
          style={{ height: 6, background: "var(--line)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}
        >
          <div style={{ width: `${isDeterminate ? percentage : 100}%`, height: "100%", background: "var(--ink)", borderRadius: "var(--radius-pill)" }} />
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
      <BannerBody>
        <Flag kind="walk">schema fails</Flag>
        <span style={{ font: "13px var(--font-mono)", color: "var(--ink)" }}>
          field <b>{first.path || "?"}</b>: {first.message}
        </span>
        <span className="nr-muted">{validCount} valid lines loaded.</span>
      </BannerBody>
    </WarningBanner>
  );
}

/** P8: run o partida sin registros: el estado vacío va directo en la Card, sin caja interior. */
export function EmptyStateCard({ title, body, command }: { title: string; body: string; command: string }) {
  return (
    <Card>
      <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", textAlign: "center", maxWidth: "48ch", margin: "0 auto" }}>
        <h3 className="nr-heading" style={{ fontSize: 16 }}>
          {title}
        </h3>
        <span className="nr-muted">
          {body} <code style={{ fontFamily: "var(--font-mono)", color: "var(--ink)", whiteSpace: "nowrap" }}>{command}</code>
        </span>
      </div>
    </Card>
  );
}

/**
 * P8: el rival rompió el protocolo. El título de la Card ya dice "Opponent breaks protocol"; el
 * título de este banner lleva el detalle técnico (sesión, modo, ronda), no repite la frase.
 * `rivalText`: registro local `rivalText` de esa ronda (nunca el registro `protocol`, que solo
 * trae rutas y códigos de Zod). `decision`: lo que el motor decidió según el log, o `null` si no
 * está registrado.
 */
export function ProtocolBreakBanner({
  detail,
  rivalText,
  round,
  decision,
  title,
}: {
  detail: string;
  rivalText?: string | null;
  round?: number | null;
  decision?: { kind: "fallback" | "walk"; label: string } | null;
  /** Override for callers that already show "Opponent breaks protocol" in a wrapping `Card` title. Defaults to the phrase + round, for backward compatibility. */
  title?: string;
}) {
  const bannerTitle = title ?? `Opponent breaks protocol${round ? ` · R${round}` : ""}`;
  return (
    <>
      {rivalText ? (
        <div className="nr-chat" style={{ marginBottom: "var(--space-3)" }}>
          <ChatMessage side="them" round={round ?? 0} text={rivalText} />
        </div>
      ) : null}
      <WarningBanner tone="warn" title={bannerTitle}>
        <BannerBody>
          <span className="nr-cfg">{detail}</span>
          {decision ? <Flag kind={decision.kind}>{decision.label}</Flag> : <span className="nr-muted">not logged</span>}
        </BannerBody>
      </WarningBanner>
    </>
  );
}

/** P8: LLM caído. Solo conteos registrados ("N of M via template"); sin hora ni porcentaje. */
export function TemplateBanner({ templateCount, ourMessageCount, provider }: { templateCount: number; ourMessageCount: number; provider: string | null }) {
  const all = ourMessageCount > 0 && templateCount === ourMessageCount;
  return (
    <WarningBanner tone="info" title={all ? `LLM down · ${provider ? `LLM_PROVIDER ${provider} · ` : ""}everything on template` : "Some messages on template"}>
      <BannerBody>
        <Flag kind="fallback">template</Flag>
        <span style={{ color: "var(--ink)" }}>
          {templateCount} of {ourMessageCount} via template. The engine decides the numbers and the validator still confirms them.
        </span>
      </BannerBody>
    </WarningBanner>
  );
}

/** P8: ZOPA vacía con retirada (arena): reservas registradas y la bandera `zopaEmpty` de las métricas. Always `tone="warn"` (walk). */
export function EmptyZopaBanner({ ours, rival, walked }: { ours: string; rival: string; walked: boolean }) {
  return (
    <WarningBanner tone="warn" title={`Empty ZOPA${walked ? " → walk" : ""}`}>
      <BannerBody>
        <Flag kind={walked ? "walk" : "neutral"}>{walked ? "walk" : "empty ZOPA"}</Flag>
        <span style={{ color: "var(--ink)" }}>
          Their reserve ({rival}) and ours ({ours}) do not overlap: no deal is possible.
        </span>
      </BannerBody>
    </WarningBanner>
  );
}
