import { WarningBanner } from "@negotiation-ring/design-system";

export function WarningBannerExample() {
  return (
    <WarningBanner tone="warn" title="results/r-1003.jsonl · line 1834">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
        field <b>offer.value</b>: expected number, got string "one hundred four"
      </span>
      <span className="nr-muted">1833 valid lines loaded. Match m-0917 is skipped until the log is fixed.</span>
    </WarningBanner>
  );
}
