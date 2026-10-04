# viewer/src/screens/nav/ — Links between tabs

- **`Links.tsx`** — the `NavCtx` context (set by `viewer/src/screens/BazaarScreen.tsx`) and the links that use it: `TickLink` («t1231» opens the «Tick 1231» drawer) and `DealerName` (opens the «Dealers» tab with that dealer selected). `TeamName` (in `teams/`) uses the same context and, if it receives a dealer's id, renders it as `DealerName`. Without the context they render as text.
- **`TickPanel.tsx`** — the «Tick N» drawer: what the board saw within ±2 ticks of N, oldest to newest (our conversations: opened, message and close; deals between other teams, directed offers, public feed, eggs found, the Taller and the grants), with ← → to move between ticks. Each conversation opens its drawer. Read-only.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
