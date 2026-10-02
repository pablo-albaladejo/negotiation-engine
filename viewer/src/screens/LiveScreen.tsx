import { ChatMessage, type ChatMessageFlag, ModeBadge, OfferChart, Root, Scoreboard, formatNumber } from "@negotiation-ring/design-system";
import { useEffect, useState } from "react";
import type { LiveModel, LiveOutcome } from "../model/index.js";
import { offerLabel } from "../ui/offer.js";

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
      <span style={{ font: "800 76px/1 var(--font-display)", color }}>{value}</span>
      <span style={{ font: "500 22px var(--font-body)", color: "var(--muted)" }}>{label}</span>
    </div>
  );
}

/** Escala el lienzo 1920 × 1080 al ancho de la ventana (el proyector lo ve a tamaño real). */
function useProjectorScale(): number {
  const [scale, setScale] = useState(() => (typeof window === "undefined" ? 1 : Math.min(1, window.innerWidth / PROJECTOR.width)));
  useEffect(() => {
    const onResize = () => setScale(Math.min(1, window.innerWidth / PROJECTOR.width));
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
      if (e.key === "Escape") setProjectorMode(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const HORIZON = 10; // Default horizon from config
  const rounds = model.status === "waiting" ? HORIZON : (model.roundLimit ?? model.round);
  const playing = model.status === "live" || model.status === "finished";
  const rival = model.status === "waiting" ? "next opponent" : (model.sessionId ?? "—");
  const flags = (b: LiveModel["last3"][number]): ChatMessageFlag[] => [
    ...(b.injection ? [{ kind: "injection" as const, label: "injection blocked" }] : []),
    ...(b.template ? [{ kind: "fallback" as const, label: "template" }] : []),
  ];
  const stats =
    model.status === "finished" && model.outcome
      ? [
          { value: model.outcome.action === "accept" ? "deal" : "walk", label: "outcome", color: model.outcome.action === "accept" ? "var(--ok)" : "var(--warn)" },
          { value: `${model.round}/${model.roundLimit ?? "—"}`, label: "rounds", color: "var(--ink)" },
          { value: `${model.templateCount} of ${model.ourMessageCount}`, label: "template messages", color: "var(--ink)" },
          { value: num(model.attacksBlocked), label: "attacks blocked", color: model.attacksBlocked > 0 ? "var(--warn)" : "var(--muted)" },
        ]
      : [
          { value: offerLabel(model.latest.theirOffer), label: "their latest offer", color: "var(--them)" },
          { value: offerLabel(model.latest.ourOffer), label: "our latest offer", color: "var(--us)" },
          { value: model.latest.uRival === null ? "—" : num(model.latest.uRival, 2), label: "utility of their offer", color: "var(--ink)" },
          { value: `${model.templateCount} of ${model.ourMessageCount}`, label: "template messages", color: "var(--ink)" },
        ];
  const headline = model.status === "finished" && model.outcome ? outcomeLabel(model.outcome) : `Session ${model.sessionId ?? "—"}${model.role ? ` · ${model.role}` : ""}`;
  const end = model.status === "finished" && model.outcome ? { round: model.outcome.round, kind: model.outcome.action === "accept" ? ("deal" as const) : ("walk" as const), label: model.outcome.action === "accept" ? "deal" : "walk" } : undefined;

  return (
    <div style={{ width: PROJECTOR.width * scale, height: PROJECTOR.height * scale, overflow: "hidden" }}>
      <div style={{ width: PROJECTOR.width, height: PROJECTOR.height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <Root
          theme="dark"
          data-screen="p7"
          style={{ position: "relative", width: PROJECTOR.width, height: PROJECTOR.height, boxSizing: "border-box", padding: "56px 72px", display: "flex", flexDirection: "column", gap: 36, overflow: "hidden" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Scoreboard badge={model.badge} us={US} rival={rival} round={model.status === "waiting" ? null : model.round} rounds={rounds} attacksBlocked={model.status === "waiting" ? null : model.attacksBlocked} />
              <ModeBadge mode="tournament" />
            </div>
            <button style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", font: "500 14px var(--font-body)" }} onClick={() => setProjectorMode(!projectorMode)}>
              {projectorMode ? "exit" : "projector mode"}
            </button>
          </div>
          {playing ? (
            <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0, 1.65fr) minmax(0, 1fr)", gap: 48 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24 }}>
                  <span style={{ font: "800 64px/1 var(--font-display)", color: model.status === "finished" ? "var(--ok)" : "var(--ink)" }}>{headline}</span>
                  <span style={{ font: "500 24px var(--font-body)", color: "var(--muted)" }}>utility × 100 by round</span>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <OfferChart rounds={Math.max(rounds, 1)} yDomain={[0, 100]} ourOffers={model.ours} theirOffers={model.theirs} injectionRounds={model.injectionRounds} {...(end ? { end } : {})} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 32, minHeight: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 32px" }}>
                  {stats.map((s) => (
                    <Stat key={s.label} {...s} />
                  ))}
                </div>
                <div className="nr-chat" style={{ zoom: 1.6, gap: 10, overflow: "hidden" }}>
                  {model.last3.map((b, i) => (
                    <ChatMessage key={`${b.round}-${b.side}-${i}`} side={b.side} round={b.round} text={b.text} flags={flags(b)} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, textAlign: "center" }}>
              <span style={{ font: "800 96px/1.05 var(--font-display)" }}>Waiting for the next match</span>
              {model.last ? <span style={{ font: "600 30px var(--font-mono)", color: model.last.action === "accept" ? "var(--ok)" : "var(--warn)", marginTop: 24 }}>Last: {outcomeLabel(model.last)}</span> : null}
            </div>
          )}
        </Root>
      </div>
    </div>
  );
}
