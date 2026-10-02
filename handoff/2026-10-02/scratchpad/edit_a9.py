import json, subprocess, sys

edits = [
    {
        "file": "/Users/pablo/development/hackathon/negotiation-ring/viewer/src/App.tsx",
        "old": 'import { InvalidLogBanner, LoadingCard } from "./ui/states.js";',
        "new": 'import { EmptyStateCard, InvalidLogBanner, LoadingCard } from "./ui/states.js";',
    },
    {
        "file": "/Users/pablo/development/hackathon/negotiation-ring/viewer/src/App.tsx",
        "old": '  if (!state.summary) return <LoadingCard label={`results/${runId}/summary.json is not available`} />;',
        "new": '  if (!state.summary) return <EmptyStateCard title={`results/${runId}/summary.json is not available`} />;',
    },
    {
        "file": "/Users/pablo/development/hackathon/negotiation-ring/viewer/src/App.tsx",
        "old": '  if (!line) return <LoadingCard label={`${gameId} is not available`} />;',
        "new": '  if (!line) return <EmptyStateCard title={`${gameId} is not available`} />;',
    },
    {
        "file": "/Users/pablo/development/hackathon/negotiation-ring/viewer/src/App.tsx",
        "old": '  if (!state.gate) return <LoadingCard label={`results/${runId}/gate.json is not available${state.errors[0] ? `: ${state.errors[0].message}` : ""}`} />;',
        "new": '  if (!state.gate) return <EmptyStateCard title={`results/${runId}/gate.json is not available`} body={state.errors[0]?.message} />;',
    },
]

for e in edits:
    with open(e["file"], encoding="utf-8") as f:
        content = f.read()
    count = content.count(e["old"])
    if count != 1:
        print(f"ERROR: found {count} occurrences for edit in {e['file']}:\n{e['old'][:80]}", file=sys.stderr)
        sys.exit(1)
    content = content.replace(e["old"], e["new"], 1)
    with open(e["file"], "w", encoding="utf-8") as f:
        f.write(content)
    print("OK:", e["file"], e["old"][:60])
