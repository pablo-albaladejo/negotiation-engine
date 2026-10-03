import { Flag } from "@negotiation-ring/design-system";
import { dealerFitStrip } from "../model/dealerFit.js";
import type { GameModel, ModelConversation } from "../model/gameModel.js";
import { bandView, isWelcome, strategyLines } from "../model/personaModel.js";

/**
 * Tira compacta «Dealer fit» del cajón: estimaciones de esa persona (β, max_rounds, markup, espejo, ronda de retirada,
 * con intervalo y n) y el límite medido de esa banda. Con `welcome` (primera conversación con ese dealer), aviso de que
 * solo mide el límite. Solo el lado del dealer.
 */
export function DealerFitStrip({ model, conv }: { model: GameModel | null; conv: ModelConversation | null }) {
  const s = dealerFitStrip(model, conv);
  if (!s) return null;
  return (
    <div aria-label="Dealer fit" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", fontSize: 12.5, border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
        <strong>Dealer fit · {s.persona} · {s.band}</strong>
        {s.welcome ? <Flag kind="decision">welcome</Flag> : null}
      </div>
      {s.items.map((i) => (
        <span key={i.label} style={{ fontFamily: "var(--font-mono)" }}>
          {i.label} {i.value} <span className="nr-muted">[{i.interval}] n{i.n}</span>
        </span>
      ))}
      <span style={{ fontFamily: "var(--font-mono)" }}>
        {s.limit ? (
          <>
            her limit {s.limit.value} <span className="nr-muted">[{s.limit.interval}] samples {s.limit.samples}</span> {s.limit.fewSamples ? <Flag kind="fallback">fewSamples</Flag> : null}
          </>
        ) : (
          <span className="nr-muted">her limit: no measure in this band yet</span>
        )}
      </span>
      {s.welcome ? (
        <span className="nr-muted">
          limit only, not the curve: first conversation with this dealer (opening = limit = final)
          {s.welcomeLimit ? ` · welcome limit ${s.welcomeLimit.value} [${s.welcomeLimit.interval}] n${s.welcomeLimit.n}` : ""}.
        </span>
      ) : null}
    </div>
  );
}

/**
 * Estrategia de la persona según el modelo de HOY (también en conversaciones viejas o cerradas): cada parámetro como
 * «value [lo–hi] · n · source» o «unknown»; el límite medido de la banda de esta conversación con su book; y la marca
 * `welcome` (solo cuenta para su límite). Solo el lado del dealer.
 */
export function PersonaStrategy({ model, conv }: { model: GameModel | null; conv: ModelConversation }) {
  if (conv.kind !== "dealer") return null;
  const lines = strategyLines(model, conv);
  const band = bandView(model, conv);
  const welcome = isWelcome(model, conv);
  return (
    <div aria-label="Persona strategy (today's model)" style={{ display: "flex", flexDirection: "column", gap: 2, borderTop: "1px solid var(--line)", paddingTop: "var(--space-2)", fontSize: 12.5 }}>
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
        <strong>{conv.counterparty} · today's model</strong>
        {welcome ? <Flag kind="decision">welcome: counts only towards her limit</Flag> : null}
      </div>
      {lines.map((l) => (
        <span key={l.key} style={{ fontFamily: "var(--font-mono)" }}>
          {l.label}: <span className={l.text === "unknown" ? "nr-muted" : undefined}>{l.text}</span>
        </span>
      ))}
      <span style={{ fontFamily: "var(--font-mono)" }}>
        {band ? (
          <>
            band {band.band} · her {band.kind}: {band.limit} · samples {band.samples} · book {band.book ?? "unknown"} {band.fewSamples ? <Flag kind="fallback">fewSamples</Flag> : null}
          </>
        ) : (
          <span className="nr-muted">band: unknown (no rarity for this conversation)</span>
        )}
      </span>
    </div>
  );
}
