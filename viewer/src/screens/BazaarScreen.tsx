import { Card, ChatMessage, DataTable, Flag, KpiStrip, OfferChart } from "@negotiation-ring/design-system";
import { useState } from "react";
import { conversationChartPoints, offerChipLabel, threadFlagKind, topicLabel } from "../ui/conversation.js";
import { gridCols } from "../ui/grid.js";
import { PageTitle } from "../ui/page-title.js";
import { TableLink } from "../ui/buttons.js";
import { EmptyStateCard } from "../ui/states.js";
import type { BazaarLiveInfo, BazaarModel, ConversationThread, Duel } from "../model/index.js";

export interface BazaarScreenProps {
  model: BazaarModel;
  live: BazaarLiveInfo | null;
  conversations?: ConversationThread[];
  duels?: Duel[];
}

const NOT_LOGGED = "not logged";

function kpi(label: string, value: number | string | undefined): { label: string; value: string } {
  return { label, value: value === undefined ? NOT_LOGGED : String(value) };
}

/** Lista de hilos, más reciente primero: estado, con quién y tema. Seleccionar uno abre su chat. */
function ThreadList({ threads, selectedId, onSelect }: { threads: ConversationThread[]; selectedId: number | null; onSelect: (id: number) => void }) {
  return (
    <ul className="nr-list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {threads.map((t) => (
        <li key={t.id}>
          <TableLink aria-pressed={t.id === selectedId} onClick={() => onSelect(t.id)} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", width: "100%", textAlign: "left" }}>
            <Flag kind={threadFlagKind(t.status)}>{t.status}</Flag>
            <span>{t.with ?? "?"}</span>
            <span className="nr-muted">{topicLabel(t.topic)}</span>
          </TableLink>
        </li>
      ))}
    </ul>
  );
}

/** El hilo seleccionado como chat: mensajes literales (texto sin interpretar, puede traer un
 * intento de inyección), chips de precio de las ofertas abiertas y el gráfico de precios de la
 * traza local (si el agente la ha trazado para este hilo). */
function ThreadChat({ thread }: { thread: ConversationThread }) {
  const chart = conversationChartPoints(thread.trace);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Flag kind={threadFlagKind(thread.status)}>{thread.status}</Flag>
        <span>{thread.with ?? "?"}</span>
        <span className="nr-muted">{topicLabel(thread.topic)}</span>
        {thread.closed_reason ? <span className="nr-muted">· {thread.closed_reason}</span> : null}
      </div>
      {thread.standing_offers.length > 0 ? (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {thread.standing_offers.map((o, i) => (
            <Flag key={i} kind="neutral">
              {offerChipLabel(o)}
            </Flag>
          ))}
        </div>
      ) : null}
      {thread.messages.length > 0 ? (
        <div className="nr-chat" aria-live="polite">
          {thread.messages.map((m, i) => (
            <ChatMessage key={i} side={m.sender === thread.with ? "them" : "us"} round={m.ts ?? i + 1} text={m.text} />
          ))}
        </div>
      ) : (
        <span className="nr-muted">No messages logged yet.</span>
      )}
      {chart.rounds > 0 ? (
        <div style={{ height: 220 }}>
          <OfferChart rounds={chart.rounds} yDomain={chart.yDomain} ourOffers={chart.ours} theirOffers={chart.theirs} />
        </div>
      ) : null}
    </div>
  );
}

function ConversationsCard({ conversations }: { conversations: ConversationThread[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  if (conversations.length === 0) return <EmptyStateCard title="No Bazaar conversations yet" />;
  const selected = conversations.find((t) => t.id === selectedId) ?? conversations[0]!;
  return (
    <Card title="Conversations">
      <div className="nr-grid" style={gridCols("minmax(220px, 1fr) minmax(0, 2fr)")}>
        <ThreadList threads={conversations} selectedId={selected.id} onSelect={setSelectedId} />
        <ThreadChat thread={selected} />
      </div>
    </Card>
  );
}

function DuelsCard({ duels }: { duels: Duel[] }) {
  if (duels.length === 0) return null;
  return (
    <Card title="Duels">
      <DataTable
        columns={[
          { key: "id", label: "Duel", numeric: true },
          { key: "rival", label: "Rival" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "limit", label: "Our limit", numeric: true },
        ]}
        rows={duels.map((d) => ({
          id: d.id,
          rival: d.rival ?? NOT_LOGGED,
          role: d.role ?? NOT_LOGGED,
          status: d.done ? { value: d.status ?? "done", tone: "better" as const } : (d.status ?? "open"),
          limit: d.your_limit ?? NOT_LOGGED,
        }))}
      />
    </Card>
  );
}

/**
 * Bazaar: la cifra que maximizamos, tal como la trazó el agente, más las conversaciones en vivo
 * (dealers, equipos, duelos). La UI nunca calcula; solo presenta los campos y deltas ya logueados
 * por `src/bazaar/score.ts`, lo que `/api/bazaar/live` sirve en vivo (sin `rarest`/`luck`/
 * `luck_private`) y lo que `/api/bazaar/threads` + `/api/bazaar/duels` sirven en vivo (sin la clave).
 */
export function BazaarScreen({ model, live, conversations = [], duels = [] }: BazaarScreenProps) {
  // Si aun no hay snapshots logueados (`score.jsonl`), se cae a la cifra que ya sirvió
  // `/api/bazaar/live` para no mostrar "not logged" teniendo el dato a mano.
  const latest = model.latest ?? live?.score ?? null;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <PageTitle>Bazaar</PageTitle>
        <span className="nr-muted" aria-live="polite">
          {live ? `${live.team ?? "?"} · ${live.round ?? "?"} · tick ${live.tick ?? "?"}` : NOT_LOGGED}
        </span>
      </div>
      <KpiStrip
        items={[
          kpi("Score", latest?.score),
          kpi("Rank", latest?.rank),
          kpi("Negotiating", latest?.neg_points),
          kpi("Market-making", latest?.mm_points),
          kpi("Duels", latest?.duel_points),
          kpi("Ladder", latest?.ladder_points),
          kpi("Bench efficiency", latest?.bench_efficiency),
          kpi("Deals", latest?.deals),
        ]}
      />
      <ConversationsCard conversations={conversations} />
      <DuelsCard duels={duels} />
      <div className="nr-grid" style={gridCols("repeat(2, minmax(0, 1fr))")}>
        <Card title="Score over time">
          {model.chart.length > 0 ? (
            <DataTable
              columns={[
                { key: "tick", label: "Tick", numeric: true },
                { key: "score", label: "Score", numeric: true },
              ]}
              rows={model.chart.map((p) => ({ tick: p.tick, score: p.score }))}
            />
          ) : (
            <EmptyStateCard title="No logged score ticks yet" />
          )}
        </Card>
        <Card title="What moved the score">
          {model.moved.length > 0 ? (
            <DataTable
              columns={[
                { key: "tick", label: "Tick", numeric: true },
                { key: "component", label: "Component" },
                { key: "delta", label: "Delta", numeric: true },
                { key: "cause", label: "Cause" },
              ]}
              rows={model.moved.map((m) => ({
                tick: m.tick,
                component: m.component,
                delta: m.delta > 0 ? { value: m.delta, tone: "better" as const } : m.delta < 0 ? { value: m.delta, tone: "worse" as const } : { value: m.delta },
                cause: m.cause,
              }))}
            />
          ) : (
            <EmptyStateCard title="No logged score changes yet" />
          )}
        </Card>
      </div>
      <span className="nr-muted">Judges: not scored yet (not reported by /api/me).</span>
    </section>
  );
}
