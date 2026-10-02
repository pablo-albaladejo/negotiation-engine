import { Card, DataTable, type DataTableColumn, type DataTableRow, Flag, formatNumber } from "@negotiation-ring/design-system";
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
          {showAll ? "Hide 0 ms steps" : `Show all (+${hiddenCount})`}
        </SecondaryButton>
      ) : null}
    </span>
  );
}

const DECISION_COLUMNS: DataTableColumn[] = [
  { key: "k", label: "Turn step" },
  { key: "v", label: "Engine log" },
  { key: "st", label: "Status" },
];

const dec1 = (v: number | null): string => (v === null ? "not logged" : formatNumber(v, { locale: "en", decimals: 1 }));

/** A7: one row per `decRows` entry in the design (d:609-617) -- no separate "Rule" row (its value
 * moved to the chat `rule: …` flag, A6). */
function decisionRows(panel: RoundPanel): DataTableRow[] {
  const explain = panel.explain;
  const attemptsCount = panel.boxes.filter((b) => b.box === "validator").length;
  const attemptsLabel = `${attemptsCount} attempt${attemptsCount === 1 ? "" : "s"}`;
  return [
    {
      k: "Target (Boulware curve)",
      v: explain ? `${dec1(explain.target)}${panel.decision?.rule === "opening" ? " (opening)" : ""}` : "not logged",
      st: <Flag kind="neutral">engine</Flag>,
    },
    { k: "Step vs previous round", v: explain ? dec1(explain.step) : "not logged", st: "" },
    {
      k: "AC_next",
      v: "not logged",
      st: explain ? <Flag kind={explain.acNext ? "decision" : "neutral"}>{explain.acNext ? "accept" : "no accept"}</Flag> : "not logged",
    },
    {
      k: "AC_time",
      v: explain ? `t = ${dec1(explain.t)}` : "not logged",
      st: explain ? <Flag kind={explain.acTime === "applies" ? "decision" : "neutral"}>{explain.acTime}</Flag> : "not logged",
    },
    {
      k: "Quarantined parser",
      v: panel.parser ? panel.parser.intent : "not logged",
      st: panel.parser ? <Flag kind={panel.parser.injectionSuspected ? "injection" : "neutral"}>{panel.parser.injectionSuspected ? "injection" : "clean"}</Flag> : "not logged",
    },
    {
      k: "Validator",
      v: panel.validator
        ? `${panel.validator.ok ? "ok" : `rejected · ${Array.isArray(panel.validator.reasons) && panel.validator.reasons.length > 0 ? panel.validator.reasons.join(", ") : "no reason logged"}`} · ${attemptsLabel}`
        : "not logged",
      st: panel.validator ? <Flag kind={panel.template ? "fallback" : "decision"}>{panel.template ? "template" : "ok"}</Flag> : "not logged",
    },
    {
      k: "Latencies",
      v: panel.boxes.length > 0 ? <LatencyList boxes={panel.boxes} /> : "not logged",
      st: "",
    },
  ];
}

export interface DecisionPanelProps {
  hasTrace: boolean;
  panel: RoundPanel | null;
  /** Actual logged round numbers, in order (may not start at 1 or be contiguous -- e.g. a tournament session). */
  rounds: number[];
  selectedRound: number;
  onSelectRound: (round: number) => void;
}

/** Shared "Engine decision this round" card, reused by the arena and tournament replay screens. */
export function DecisionPanel({ hasTrace, panel, rounds, selectedRound, onSelectRound }: DecisionPanelProps) {
  /** C6: a `selectedRound` not present in `rounds` (can't happen from the UI, but the prop isn't
   * typed to rule it out) used to disable both buttons via `indexOf` returning -1; finding the
   * nearest logged round on either side instead means Previous/Next still work (and are generally
   * more robust than an index walk if `rounds` were ever non-contiguous around the selection). */
  const prevRound = [...rounds].reverse().find((r) => r < selectedRound) ?? null;
  const nextRound = rounds.find((r) => r > selectedRound) ?? null;
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1]! : selectedRound;
  const rows: DataTableRow[] = panel ? decisionRows(panel) : [];

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
          <h3 className="nr-heading">Engine decision this round</h3>
          <span className="nr-cfg" role="status" aria-live="polite" aria-label={`Round ${selectedRound} of ${lastRound}`}>
            R{selectedRound} / {lastRound}
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <SecondaryButton onClick={() => prevRound !== null && onSelectRound(prevRound)} aria-disabled={prevRound === null}>
            ← Previous round
          </SecondaryButton>
          <SecondaryButton onClick={() => nextRound !== null && onSelectRound(nextRound)} aria-disabled={nextRound === null}>
            Next round →
          </SecondaryButton>
        </div>
      </div>
      {hasTrace ? (
        panel ? (
          <>
            <DataTable columns={DECISION_COLUMNS} rows={rows} />
            <p className="nr-muted" style={{ marginTop: "var(--space-2)" }}>
              Click a point on the chart to switch rounds. Values exactly as logged by the engine.
            </p>
          </>
        ) : (
          <p className="nr-muted">R{selectedRound}: not logged.</p>
        )
      ) : (
        <p className="nr-muted">No trace logged for this match (played with --no-traces or --agent-url).</p>
      )}
    </Card>
  );
}
