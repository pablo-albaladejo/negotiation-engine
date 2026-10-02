#!/usr/bin/env bash
# Starts a tiny local static file server for the monitor dashboard.
# Usage: ./serve.sh [--foreground]
# --foreground: run in foreground (for launchd), write PID file, write to log
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

FOREGROUND=0
if [ "${1:-}" = "--foreground" ]; then
  FOREGROUND=1
fi

is_port_free() {
  local port="$1"
  ! lsof -i TCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

PORT=8787
for candidate in 8787 8788 8789 8790 8791; do
  if is_port_free "$candidate"; then
    PORT="$candidate"
    break
  fi
done

if [ "$FOREGROUND" -eq 0 ]; then
  # Background mode (nohup)
  if [ -f "$DIR/serve.pid" ] && kill -0 "$(cat "$DIR/serve.pid")" 2>/dev/null; then
    echo "serve.sh already running with PID $(cat "$DIR/serve.pid")"
    exit 0
  fi
  nohup python3 -m http.server "$PORT" --directory "$DIR" >"$DIR/serve.log" 2>&1 &
  disown
  echo $! > "$DIR/serve.pid"
  echo "Started dashboard server on http://localhost:$PORT/dashboard.html (PID $!)"
else
  # Foreground mode (for launchd)
  echo $$ > "$DIR/serve.pid"
  echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Starting dashboard server on http://localhost:$PORT/dashboard.html" >> "$DIR/serve.log"
  exec python3 -m http.server "$PORT" --directory "$DIR" >> "$DIR/serve.log" 2>&1
fi
