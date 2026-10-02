import { Card, ChatMessage, Flag, Legend, WarningBanner } from "@negotiation-ring/design-system";
import { useId, type ReactNode } from "react";
import type { ApiError } from "../api.js";

/** Flag + text inside a `WarningBanner`: stacked, left-aligned, so the Flag never stretches full width. */
function BannerBody({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "var(--space-2)" }}>{children}</div>;
}

/**
 * P8: carga en curso. Sin un conteo real de líneas/partidas leídas (la API no lo reporta hoy),
 * la barra es indeterminada: sin `aria-valuenow`, con `aria-busy`, una franja del 30% que se
 * desliza (quieta si `prefers-reduced-motion`). Solo se ve un porcentaje real cuando se pasan
 * `current`/`total`.
 */
export function LoadingCard({ label, current, total }: { label: string; current?: number; total?: number }) {
  const isDeterminate = current !== undefined && total !== undefined && total > 0;
  const percentage = isDeterminate ? (current / total) * 100 : 0;
  const labelId = useId();
  return (
    <Card title="Loading">
      <div role="status" style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <span className="nr-cfg" id={labelId}>{label}</span>
        <div
          role="progressbar"
          aria-labelledby={labelId}
          {...(isDeterminate ? { "aria-valuenow": percentage, "aria-valuemin": 0, "aria-valuemax": 100 } : { "aria-busy": true })}
          className="nr-progress-track"
        >
          <div className={isDeterminate ? "nr-progress-fill" : "nr-progress-fill nr-progress-indeterminate"} {...(isDeterminate ? { style: { width: `${percentage}%` } } : {})} />
        </div>
        <div className="nr-skeleton-grid" aria-hidden="true">
          <div className="nr-skeleton-block" style={{ height: 44 }} />
          <div className="nr-skeleton-block" style={{ height: 44 }} />
          <div className="nr-skeleton-block" style={{ height: 44 }} />
          <div className="nr-skeleton-block" style={{ height: 44 }} />
        </div>
        <div className="nr-skeleton-block" style={{ height: 120 }} aria-hidden="true" />
      </div>
    </Card>
  );
}

/** P8: log inválido. Muestra fichero, línea y campo del primer error, y cuántas líneas válidas se cargaron. */
export function InvalidLogBanner({ errors, validCount, skippedMatchId }: { errors: readonly ApiError[]; validCount: number; skippedMatchId?: string }) {
  const first = errors[0];
  if (!first) return null;
  return (
    <WarningBanner tone="warn" title={`${first.file ?? "not logged"}${first.line !== null ? ` · line ${first.line}` : ""}`}>
      <BannerBody>
        <Flag kind="walk">schema fails</Flag>
        <span className="nr-banner-detail">
          field <b>{first.path || "(root)"}</b>: {first.message}
        </span>
        <span className="nr-muted">{validCount} valid lines loaded.{skippedMatchId ? ` Match ${skippedMatchId} is skipped until the log is fixed.` : ""}</span>
      </BannerBody>
    </WarningBanner>
  );
}

/**
 * P8: run o partida sin registros: el estado vacío va directo en la Card, sin caja interior.
 * `body`/`command` son opcionales (p. ej. "sin resultados para estos filtros" solo necesita un
 * título y una acción); `action` añade un control debajo (botón "Clear filters", etc.).
 */
export function EmptyStateCard({
  title,
  body,
  command,
  after,
  action,
}: {
  title: string;
  body?: string;
  command?: string;
  /** Text after `command` on the same line (e.g. "and the viewer will pick up the JSONL logs automatically."). */
  after?: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <div className="nr-empty">
        <h3 className="nr-heading-sm">{title}</h3>
        {body ? (
          <span className="nr-muted">
            {body} {command ? <code className="nr-code-inline">{command}</code> : null} {after}
          </span>
        ) : null}
        {action}
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
        <span className="nr-text-ink">
          {templateCount} of {ourMessageCount} via template. The engine decides the numbers and the validator still confirms them.
        </span>
      </BannerBody>
    </WarningBanner>
  );
}

/**
 * P8: ZOPA vacía (arena): reservas registradas y la bandera `zopaEmpty` de las métricas. El
 * título lleva el detalle técnico ("Reserves 80 / 76"), no repite el título de la Card que lo
 * envuelve. `tone="warn"` solo si además se retiró; si la partida sigue, es solo informativo.
 */
export function EmptyZopaBanner({ ours, rival, walked }: { ours: string; rival: string; walked: boolean }) {
  return (
    <WarningBanner tone={walked ? "warn" : "info"} title={`Reserves ${ours} / ${rival}${walked ? " → walk" : ""}`}>
      <BannerBody>
        <Flag kind={walked ? "walk" : "neutral"}>{walked ? "walk" : "empty ZOPA"}</Flag>
        <span className="nr-text-ink">
          Their reserve ({rival}) and ours ({ours}) do not overlap: no deal is possible.
        </span>
      </BannerBody>
    </WarningBanner>
  );
}
