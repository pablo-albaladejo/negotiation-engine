# bazaar monitor

Polls 7 read-only endpoints on `bazaar.causaprima.ai` every 10 seconds and appends timestamped JSON snapshots to `data/snapshots.jsonl`: `clock`, `leaderboard`, `dealers`, `schedule`, `levels`, `feed`, `rastro_offers`.

- `feed` (`GET /api/feed?limit=300`): recent event log (offers, trades/settlements, threads, etc). Capped to the last 300 events per poll to keep lines small.
- `rastro_offers` (`GET /api/venues/rastro/offers`): current open offers on El Rastro; `offers[].give.assets[].rarity` is the card offered, `offers[].want.cash` is the asking price.
- Data: `data/snapshots.jsonl` (one JSON line per endpoint per cycle)
- Log: `sniff.log` (tail with `tail -f sniff.log`)
- PID: `sniff.pid`
- Cookie: `cookie.txt` (single line, session cookie) — if requests start failing with 401/403, grab a fresh `cookie` header value from the browser's devtools and overwrite this file; the script re-reads it every cycle, no restart needed. If leaderboard fails 3+ times in a row, a macOS notification alerts you.

## Running (macOS LaunchAgent)

The sniffer and dashboard run as persistent LaunchAgents via `launchd`, with KeepAlive enabled (auto-restart if killed):

- **Start**: `./start.sh` (bootstraps both sniff and serve agents)
- **Stop**: `./stop.sh` (unloads both agents)
- **Status**: `launchctl print gui/$(id -u)/ai.causaprima.bazaar-sniff | head` or `launchctl list | grep "ai.causaprima.bazaar"`
- **Start only the sniffer**: `launchctl bootstrap gui/$(id -u) /Users/pablo/Library/LaunchAgents/ai.causaprima.bazaar-sniff.plist`
- **Start only the server**: `launchctl bootstrap gui/$(id -u) /Users/pablo/Library/LaunchAgents/ai.causaprima.bazaar-serve.plist`

### Details
- `sniff.sh` runs in foreground under `/usr/bin/caffeinate -i -s` (prevents idle sleep on AC power).
- `serve.sh --foreground` runs the HTTP server in the foreground for launchd.
- Both jobs write logs to `launchd.log` (shared), plus their own `sniff.log` and `serve.log`.
- Both have `KeepAlive: true`, so if either process dies, launchd restarts it within seconds.
- **Caveat**: Closing the lid without an external display will still sleep the Mac, even with caffeinate (macOS behavior).

## Dashboard

- View it at: `http://localhost:8787/dashboard.html` (self-contained HTML/JS, no build step, polls `data/snapshots.jsonl` every 5s).
- Started and managed via `./start.sh` / `./stop.sh`.
