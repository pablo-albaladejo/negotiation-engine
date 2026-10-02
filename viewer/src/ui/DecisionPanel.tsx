import { Card, DataTable, type DataTableColumn, type DataTableRow, Pill, formatNumber } from "@negotiation-ring/design-system";
import { useState } from "react";
import type { RoundPanel } from "../model/index.js";
import { nameLatencySteps } from "./decision.js";
import { SecondaryButton } from "./buttons.js";

/** P4: una entrada por paso, con nombre único cuando una caja corrió más de una vez; los pasos de 0 ms quedan tras "show all". */
function LatencyList({ boxes }: { boxes: readonly { box: string; latencyMs: number }[] }) {
  const [showAll, setShowAll] = useState(false);
  const steps = nameLatencySteps(boxes);
  const hiddenCount = steps.filter((s) => s.latencyMs === 0).length;
  const shown = showAll ? steps : steps.filter((s) => s.latencyMs > 0);
  return (
    <span>
      {shown.map((s) => `${s.name} ${s.latencyMs} ms`).join(" · ")}
      {hiddenCount > 0 ? (
        <SecondaryButton style={{ marginLeft: "var(--space-2)" }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "hide 0 ms steps" : `show all (+${hiddenCount})`}
        </SecondaryButton>
      ) : null}
    </span>
  );
}

const DECISION_COLUMNS: DataTableColumn[] = [
  { key: "k", label: "Turn step" },
  { key: "v", label: "Engine log" },
];

export interface DecisionPanelProps {
  hasTrace: boolean;
  panel: RoundPanel | null;
  selectedRound: number;
  totalRounds: number;
  onPrev: () => void;
  onNext: () => void;
}

/** Shared "Engine decision this round" card, reused by the arena and tournament replay screens. */
export function DecisionPanel({ hasTrace, panel, selectedRound, totalRounds, onPrev, onNext }: DecisionPanelProps) {
  const decisionRows: DataTableRow[] = panel
    ? [
        { k: "Rule", v: panel.decision?.rule ?? "not logged" },
        { k: "Target (Boulware curve)", v: panel.explain ? formatNumber(panel.explain.target, { locale: "en", decimals: 3 }) : "not logged" },
        { k: "Step vs previous round", v: panel.explain ? (panel.explain.step === null ? "n/a" : formatNumber(panel.explain.step, { locale: "en", decimals: 3 })) : "not logged" },
        {
          k: "AC_next",
          v: panel.explain ? <Pill kind={panel.explain.acNext ? "verdict" : "rejected"}>{panel.explain.acNext ? "accept" : "no accept"}</Pill> : "not logged",
        },
        { k: "AC_time", v: panel.explain ? panel.explain.acTime : "not logged" },
        { k: "Quarantined parser", v: panel.parser ? `${panel.parser.intent}${panel.parser.injectionSuspected ? " · injection" : ""}` : "not logged" },
        {
          k: "Validator",
          v: panel.validator
            ? `${panel.validator.ok ? "ok" : `rejected · ${Array.isArray(panel.validator.reasons) && panel.validator.reasons.length > 0 ? panel.validator.reasons.join(", ") : "no reason logged"}`} (${panel.boxes.filter((b) => b.box === "validator").length} attempt(s))`
            : "not logged",
        },
        {
          k: "Latencies",
          v: panel.boxes.length > 0 ? <LatencyList boxes={panel.boxes} /> : "not logged",
        },
      ]
    : [];

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
          <h3 className="nr-heading">Engine decision this round</h3>
          <span className="nr-cfg">
            R{selectedRound} / {totalRounds}
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <SecondaryButton onClick={onPrev}>← Previous round</SecondaryButton>
          <SecondaryButton onClick={onNext}>Next round →</SecondaryButton>
        </div>
      </div>
      {hasTrace ? (
        <>
          <DataTable columns={DECISION_COLUMNS} rows={decisionRows} />
          <p className="nr-muted" style={{ marginTop: "var(--space-2)" }}>
            Click a point on the chart to switch rounds. Values exactly as logged by the engine.
          </p>
        </>
      ) : (
        <p className="nr-muted">No trace recorded for this match (played with --no-traces or --agent-url).</p>
      )}
    </Card>
  );
}
