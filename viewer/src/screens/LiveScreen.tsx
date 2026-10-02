import { ChatMessage, type ChatMessageFlag, ModeBadge, OfferChart, Root, Scoreboard, formatNumber } from "@negotiation-ring/design-system";
import { useEffect, useState } from "react";
import type { LiveModel, LiveOutcome } from "../model/index.js";
import { offerLabel } from "../ui/offer.js";
import { BackLink, SecondaryButton } from "../ui/buttons.js";
import { routeTo } from "../route.js";

export const PROJECTOR = { width: 1920, height: 1080 } as const;
/** Nombre de nuestro equipo en el marcador (design.md, Open Questions). */
export const US = "Us";

const num = (v: number, decimals?: number) => formatNumber(v, { locale: "en", ...(decimals !== undefined ? { decimals } : {}) });


function outcomeLabel(o: LiveOutcome): string {
  return o.action === "accept" ? `Deal at ${offerLabel(o.offer)}` : "Walk · no deal";
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="nr-live-stat-value" style={{ color }}>{value}</span>
      <span className="nr-live-stat-label">{label}</span>
    </div>
  );
}

function projectorScale(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.innerWidth / PROJECTOR.width, window.innerHeight / PROJECTOR.height);
}

/** Escala el lienzo 1920 × 1080 a la ventana entera, sin recortar ni dejar franja: el factor es
 * el mínimo entre ancho y alto (el proyector lo ve centrado, con el sobrante relleno de --bg). */
function useProjectorScale(): number {
  const [scale, setScale] = useState(projectorScale);
  useEffect(() => {
    const onResize = () => setScale(projectorScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
}

/** P7: proyector, siempre oscuro. Privacidad de torneo: sin ZOPA ni reserva del rival. */
export function LiveScreen({ model }: { model: LiveModel }) {
  const scale = useProjectorScale();
  const [projectorMode, setProjectorMode] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !projectorMode) return;
      setProjectorMode(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [projectorMode]);

  const chartRounds = model.roundLimit ?? model.round;
  const rounds = model.status === "waiting" ? model.roundLimit : chartRounds;
  const playing = model.status === "live" || model.status === "finished";
  const waiting = model.status === "waiting";
  const rival = waiting ? "next opponent" : (model.rival ?? "not logged");
  const flags = (b: LiveModel["lastMessages"][number]): ChatMessageFlag[] => [
    ...(b.injection ? [{ kind: "injection" as const, label: "injection blocked" }] : []),
    ...(b.template ? [{ kind: "fallback" as const, label: "template" }] : []),
  ];
  const stats =
    model.status === "finished" && model.outcome
      ? [
          { value: model.outcome.action === "accept" ? "deal" : "walk", label: "outcome", color: model.outcome.action === "accept" ? "var(--ok)" : "var(--warn)" },
          { value: model.roundLimit !== null ? `${model.round}/${model.roundLimit}` : String(model.round), label: "rounds", color: "var(--ink)" },
          { value: `${model.templateCount} of ${model.ourMessageCount}`, label: "template messages", color: "var(--ink)" },
          { value: num(model.attacksBlocked), label: "attacks blocked", color: model.attacksBlocked > 0 ? "var(--warn)" : "var(--muted)" },
        ]
      : [
          { value: offerLabel(model.latest.theirOffer), label: "their latest offer", color: "var(--them)" },
          { value: offerLabel(model.latest.ourOffer), label: "our latest offer", color: "var(--us)" },
          { value: model.latest.uRival === null ? "not logged" : num(model.latest.uRival, 2), label: "utility of their offer", color: "var(--ink)" },
          { value: `${model.templateCount} of ${model.ourMessageCount}`, label: "template messages", color: "var(--ink)" },
        ];
  /** C9: `sessionId` missing shouldn't read as a literal "Session not logged" -- drop the "Session"
   * label entirely rather than pairing it with a placeholder it doesn't apply to. */
  const headline =
    model.status === "finished" && model.outcome
      ? outcomeLabel(model.outcome)
      : model.sessionId !== null
        ? `Session ${model.sessionId}${model.role ? ` · ${model.role}` : ""}`
        : (model.role ?? "not logged");
  const end = model.status === "finished" && model.outcome ? { round: model.outcome.round, kind: model.outcome.action === "accept" ? ("deal" as const) : ("walk" as const), label: model.outcome.action === "accept" ? "deal" : "walk" } : undefined;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <BackLink
        className="nr-live-corner-back"
        style={{ position: "fixed", top: 16, left: 16 }}
        onClick={() => {
          window.location.hash = routeTo.runs();
        }}
      >
        ← Runs
      </BackLink>
      <div style={{ width: PROJECTOR.width, height: PROJECTOR.height, transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <Root
          theme="dark"
          data-screen="p7"
          style={{ position: "relative", width: PROJECTOR.width, height: PROJECTOR.height, boxSizing: "border-box", padding: "56px 72px", display: "flex", flexDirection: "column", gap: 36, overflow: "hidden" }}
        >
          {!projectorMode ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <Scoreboard badge={model.badge} us={US} rival={rival} rivalPending={waiting} round={waiting ? null : model.round} rounds={rounds} attacksBlocked={waiting ? null : model.attacksBlocked} />
                <ModeBadge mode="tournament" />
              </div>
              <SecondaryButton onClick={() => setProjectorMode(true)}>Projector mode</SecondaryButton>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SecondaryButton onClick={() => setProjectorMode(false)}>Exit projector mode (Esc)</SecondaryButton>
            </div>
          )}
          {playing ? (
            <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0, 1.65fr) minmax(0, 1fr)", gap: 48 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24 }}>
                  <span className="nr-live-headline" style={{ color: model.status === "finished" ? "var(--ok)" : "var(--ink)" }}>{headline}</span>
                  <span style={{ font: "500 24px var(--font-body)", color: "var(--muted)" }}>utility × 100 by round</span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <OfferChart rounds={Math.max(chartRounds, 1)} yDomain={[0, 100]} ourOffers={model.ours} theirOffers={model.theirs} zopa={false} injectionRounds={model.injectionRounds} {...(end ? { end } : {})} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 32, minHeight: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 32px" }}>
                  {stats.map((s) => (
                    <Stat key={s.label} {...s} />
                  ))}
                </div>
                <div className="nr-chat nr-chat-projector" style={{ gap: 10, overflow: "hidden" }}>
                  {model.lastMessages.map((b, i) => (
                    <ChatMessage key={`${b.round}-${b.side}-${i}`} side={b.side} round={b.round} text={b.text} flags={flags(b)} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, textAlign: "center" }}>
              <span className="nr-live-waiting">Waiting for the next match</span>
              {model.last ? <span style={{ font: "600 30px var(--font-mono)", color: model.last.action === "accept" ? "var(--ok)" : "var(--warn)", marginTop: 24 }}>Last: {outcomeLabel(model.last)}</span> : null}
            </div>
          )}
        </Root>
      </div>
    </div>
  );
}
