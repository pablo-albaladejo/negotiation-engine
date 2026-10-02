import sys

edits = [
    {
        "file": "/Users/pablo/development/hackathon/negotiation-ring/viewer/src/ui/DecisionPanel.tsx",
        "old": '''          <SecondaryButton onClick={() => prevRound !== null && onSelectRound(prevRound)} disabled={prevRound === null}>
            ← Previous round
          </SecondaryButton>
          <SecondaryButton onClick={() => nextRound !== null && onSelectRound(nextRound)} disabled={nextRound === null}>
            Next round →
          </SecondaryButton>''',
        "new": '''          <SecondaryButton onClick={() => prevRound !== null && onSelectRound(prevRound)} aria-disabled={prevRound === null}>
            ← Previous round
          </SecondaryButton>
          <SecondaryButton onClick={() => nextRound !== null && onSelectRound(nextRound)} aria-disabled={nextRound === null}>
            Next round →
          </SecondaryButton>''',
    },
    {
        "file": "/Users/pablo/development/hackathon/negotiation-ring/design-system/src/styles.css",
        "old": '.nr-btn-secondary:disabled,.nr-btn:disabled,.nr-btn-primary:disabled{opacity:0.5;cursor:not-allowed}',
        "new": '.nr-btn-secondary:disabled,.nr-btn:disabled,.nr-btn-primary:disabled,.nr-btn-secondary[aria-disabled=true]{opacity:0.5;cursor:not-allowed}',
    },
]

for e in edits:
    with open(e["file"], encoding="utf-8") as f:
        content = f.read()
    count = content.count(e["old"])
    if count != 1:
        print(f"ERROR: found {count} occurrences for edit in {e['file']}", file=sys.stderr)
        sys.exit(1)
    content = content.replace(e["old"], e["new"], 1)
    with open(e["file"], "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", e["file"])
