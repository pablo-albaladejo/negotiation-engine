import { Card, DataTable } from "@negotiation-ring/design-system";
import type { GameModel, ModelGoal, ModelStrategy } from "../../model/gameModel.js";
import { Fold } from "../../ui/fold.js";
import { EmptyStateCard } from "../../ui/states.js";

/**
 * «Goals» tab: the goals session's goals.json and strategy registry as `GameState.goals` carries them. Gaps and
 * conflicts first, then the goals by priority, the strategies grouped by goal and the open proposals. Shown only: no
 * route decides from it, and a proposal's `figures_for_humans` is text for the person deciding, never a price.
 */

const col = { display: "flex", flexDirection: "column", gap: "var(--space-3)" } as const;
const TONE: Record<string, string> = {
  open: "var(--us)",
  done: "var(--ok)",
  live: "var(--ok)",
  approved: "var(--ok)",
  saturated: "var(--muted)",
  paused: "var(--muted)",
  retired: "var(--muted)",
  "no-data": "var(--muted)",
  proposed: "var(--warn)",
  behind: "var(--warn)",
  blocked: "var(--bad)",
};
const signed = (x: number | null) => (x === null ? "—" : `${x > 0 ? "+" : ""}${Math.round(x * 100) / 100}`);
const num = (x: number | null) => (x === null ? "—" : String(Math.round(x * 100) / 100));

function Chip({ status }: { status: string }) {
  const c = TONE[status] ?? "var(--muted)";
  return <span style={{ color: c, border: `1px solid ${c}`, borderRadius: 999, padding: "0 8px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{status}</span>;
}

function Bullets({ items, color }: { items: string[]; color?: string }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((t, i) => (
        <li key={i} style={color ? { color } : undefined}>
          {t}
        </li>
      ))}
    </ul>
  );
}

function GoalsTable({ goals }: { goals: ModelGoal[] }) {
  const sorted = [...goals].sort((a, b) => b.priority - a.priority || b.weight - a.weight);
  return (
    <DataTable
      columns={[
        { key: "goal", label: "Goal" },
        { key: "status", label: "Status" },
        { key: "weight", label: "Weight", numeric: true },
        { key: "now", label: "Now", numeric: true },
        { key: "day", label: "Δ day", numeric: true },
        { key: "tick", label: "Δ tick", numeric: true },
        { key: "until", label: "Until", numeric: true },
        { key: "target", label: "Target and why" },
      ]}
      rows={sorted.map((g) => {
        const day = g.now !== null && g.day_start !== null ? g.now - g.day_start : null;
        return {
          goal: (
            <span>
              <strong>{g.goal}</strong>
              <br />
              <span className="nr-muted" style={{ fontSize: 12 }}>{`${g.id} · ${g.block} · P${g.priority} · ${g.metric}`}</span>
            </span>
          ),
          status: <Chip status={g.status} />,
          weight: g.weight,
          now: num(g.now),
          day: <span style={{ color: (day ?? 0) > 0 ? "var(--ok)" : (day ?? 0) < 0 ? "var(--bad)" : undefined }}>{signed(day)}</span>,
          tick: <span style={{ color: g.delta_tick > 0 ? "var(--ok)" : g.delta_tick < 0 ? "var(--bad)" : undefined }}>{signed(g.delta_tick)}</span>,
          until: g.until_tick === null ? "—" : `t${g.until_tick}`,
          target: (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span>{g.target}</span>
              <span className="nr-muted" style={{ fontSize: 12 }}>
                {g.why}
              </span>
              {g.do_not.length ? (
                <details>
                  <summary className="nr-muted" style={{ fontSize: 12, cursor: "pointer" }}>{`Do not (${g.do_not.length})`}</summary>
                  <Bullets items={g.do_not} color="var(--bad)" />
                </details>
              ) : null}
            </div>
          ),
        };
      })}
    />
  );
}

function StrategiesByGoal({ goals, strategies }: { goals: ModelGoal[]; strategies: ModelStrategy[] }) {
  const order = [...goals].sort((a, b) => b.priority - a.priority).map((g) => g.id);
  const ids = [...new Set([...order, ...strategies.map((s) => s.goal)])].filter((id) => strategies.some((s) => s.goal === id));
  const name = (id: string) => goals.find((g) => g.id === id)?.goal ?? id;
  return (
    <div style={col}>
      {ids.map((id) => {
        const list = strategies.filter((s) => s.goal === id);
        return (
          <Fold key={id} title={`${name(id)} · ${list.length} strateg${list.length === 1 ? "y" : "ies"} (${list.filter((s) => s.status === "live").length} live)`} open={list.some((s) => s.status === "live" || s.status === "proposed")}>
            <DataTable
              columns={[
                { key: "what", label: "Strategy" },
                { key: "owner", label: "Owner" },
                { key: "status", label: "Status" },
                { key: "ok", label: "Pablo OK" },
                { key: "ship", label: "Commit · flag" },
                { key: "evidence", label: "Evidence" },
                { key: "conflicts", label: "Conflicts" },
              ]}
              rows={list.map((s) => ({
                what: (
                  <span>
                    {s.summary}
                    <br />
                    <span className="nr-muted" style={{ fontSize: 12 }}>
                      {s.id}
                    </span>
                  </span>
                ),
                owner: s.owner,
                status: <Chip status={s.status} />,
                ok: s.approved_by_pablo ? { value: "yes", tone: "better" as const } : "—",
                ship: [s.commit, s.flag].filter(Boolean).join(" · ") || "—",
                evidence: s.evidence || "—",
                conflicts: s.conflicts.length ? <span style={{ color: "var(--warn)" }}>{s.conflicts.join(", ")}</span> : "—",
              }))}
            />
          </Fold>
        );
      })}
    </div>
  );
}

function Proposal({ s }: { s: ModelStrategy }) {
  return (
    <div className="nr-card" style={{ padding: "var(--space-3)", borderLeft: `4px solid ${TONE[s.status] ?? "var(--line)"}`, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", flexWrap: "wrap" }}>
        <Chip status={s.status} />
        <strong>{s.summary}</strong>
        <span className="nr-muted" style={{ fontSize: 12 }}>{`${s.id} · ${s.owner} → ${s.goal} · OK by ${s.ok_by ?? "pablo"}${s.approved_at ? ` · approved ${s.approved_at}` : ""}`}</span>
      </div>
      {s.figures_for_humans ? (
        <span>
          <span className="nr-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Figures · for humans, not a price:{" "}
          </span>
          {s.figures_for_humans}
        </span>
      ) : null}
      {s.pros?.length || s.cons?.length ? (
        <div className="nr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
          <div>
            <strong style={{ color: "var(--ok)" }}>Pros</strong>
            {s.pros?.length ? <Bullets items={s.pros} /> : <span className="nr-muted"> —</span>}
          </div>
          <div>
            <strong style={{ color: "var(--bad)" }}>Cons</strong>
            {s.cons?.length ? <Bullets items={s.cons} /> : <span className="nr-muted"> —</span>}
          </div>
        </div>
      ) : null}
      {s.recommendation ? (
        <span>
          <strong>Recommendation: </strong>
          {s.recommendation}
        </span>
      ) : null}
      {s.conflicts.length ? <span style={{ color: "var(--warn)", fontSize: 12 }}>{`Conflicts with ${s.conflicts.join(", ")}`}</span> : null}
    </div>
  );
}

export function GoalsView({ model, loading }: { model: GameModel | null; loading: boolean }) {
  if (!model || !model.available) return <EmptyStateCard title={loading ? "Loading our model…" : `Goals need our model: ${model?.reason ?? "not available"}`} />;
  const reg = model.registry;
  if (!reg || (!reg.goals && !reg.strategies)) return <EmptyStateCard title="No goals yet: the viewer server predates GameState.goals, or results/state/goals.json and strategies.json are missing." />;
  const goals = reg.goals?.goals ?? [];
  const strategies = reg.strategies?.strategies ?? [];
  const gaps = reg.strategies?.gaps ?? [];
  const conflicts = reg.strategies?.conflicts ?? [];
  const proposals = strategies.filter((s) => s.status === "proposed" || s.status === "approved");
  return (
    <div style={col}>
      <span className="nr-muted">{`goals.json t${reg.goals?.tick ?? "?"} · ${reg.goals?.updated_at ?? "?"} · strategies.json ${reg.strategies?.updated_at ?? "?"} · written by the goals session; shown only, no route decides from it`}</span>
      {gaps.length || conflicts.length ? (
        <Card title={`Gaps ${gaps.length} · conflicts ${conflicts.length}`}>
          <div style={col}>
            {gaps.length ? (
              <div>
                <strong style={{ color: "var(--warn)" }}>Gaps · goals without a live strategy</strong>
                <Bullets items={gaps} />
              </div>
            ) : null}
            {conflicts.length ? (
              <div>
                <strong style={{ color: "var(--bad)" }}>Conflicts between strategies</strong>
                <Bullets items={conflicts} />
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
      {reg.goals?.changes.length ? (
        <Card title="Changes this tick">
          <Bullets items={reg.goals.changes} />
        </Card>
      ) : null}
      <Card title={`Goals · ${goals.length} by priority`}>{goals.length ? <GoalsTable goals={goals} /> : <span className="nr-muted">goals.json not read.</span>}</Card>
      <Card title={`Proposals · ${proposals.length} (proposed or approved, not live yet)`}>
        {proposals.length ? (
          <div style={col}>
            {proposals.map((s) => (
              <Proposal key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <span className="nr-muted">No open proposals.</span>
        )}
      </Card>
      <Card title={`Strategies · ${strategies.length} by goal`}>{strategies.length ? <StrategiesByGoal goals={goals} strategies={strategies} /> : <span className="nr-muted">strategies.json not read.</span>}</Card>
    </div>
  );
}
