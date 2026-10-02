#!/bin/bash
# Persistent monitor for the bazaar hackathon API.
# Every INTERVAL seconds, hits 7 read-only endpoints and appends a JSON line
# per endpoint per cycle to data/snapshots.jsonl. Keeps running across
# non-200 responses / curl errors (e.g. expired session cookie) so a cookie
# refresh is a one-file edit (cookie.txt), not a restart.
# Can be run in foreground under launchd or backgrounded with nohup.
# Handles SIGTERM cleanly (no half-written JSON lines).

set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$DIR/data"
DATA_FILE="$DATA_DIR/snapshots.jsonl"
LOG_FILE="$DIR/sniff.log"
PID_FILE="$DIR/sniff.pid"
COOKIE_FILE="$DIR/cookie.txt"
ALERT_NOTIF_FILE="$DIR/.cookie_alert_notif_ts"

BASE_URL="https://bazaar.causaprima.ai"
ENDPOINTS=(clock leaderboard dealers schedule levels feed rastro_offers)
INTERVAL=10
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"

# Track consecutive leaderboard failures for cookie expiry alert
LEADERBOARD_FAILURES=0

# Flag to gracefully exit on SIGTERM
SHOULD_EXIT=0

cleanup() {
  SHOULD_EXIT=1
}

trap cleanup SIGTERM SIGINT

# Map internal endpoint names to actual API paths (+ query string). Most
# endpoint names match "/api/<name>" directly; a few need a different path
# or a query param to keep the response small (feed can grow unbounded, so
# we only ask for the most recent events each poll).
endpoint_path() {
  case "$1" in
    feed) echo "feed?limit=300" ;;
    rastro_offers) echo "venues/rastro/offers" ;;
    *) echo "$1" ;;
  esac
}

mkdir -p "$DATA_DIR"
echo $$ > "$PID_FILE"

log() {
  printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1" >> "$LOG_FILE"
}

fetch_one() {
  local endpoint="$1"
  local cookie
  cookie="$(cat "$COOKIE_FILE" 2>/dev/null)"
  local ts
  ts="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

  local response status body
  response="$(curl -s -o - -w '\n%{http_code}' \
    --max-time 8 \
    -H "accept: application/json" \
    -H "accept-language: en-US,en;q=0.9" \
    -H "user-agent: $USER_AGENT" \
    -H "sec-fetch-dest: empty" \
    -H "sec-fetch-mode: cors" \
    -H "sec-fetch-site: same-origin" \
    -H "cookie: $cookie" \
    "$BASE_URL/api/$(endpoint_path "$endpoint")" 2>>"$LOG_FILE")"
  local curl_exit=$?

  if [ $curl_exit -ne 0 ]; then
    echo "{\"ts\":\"$ts\",\"endpoint\":\"$endpoint\",\"status\":0,\"body\":null}" >> "$DATA_FILE"
    if [ "$endpoint" = "leaderboard" ]; then
      LEADERBOARD_FAILURES=$((LEADERBOARD_FAILURES + 1))
    fi
    echo "FAIL(curl_exit=$curl_exit)"
    return
  fi

  status="${response##*$'\n'}"
  body="${response%$'\n'*}"

  if [ "$status" = "200" ]; then
    if [ "$endpoint" = "leaderboard" ]; then
      LEADERBOARD_FAILURES=0
    fi
    if command -v jq >/dev/null 2>&1 && echo "$body" | jq -e . >/dev/null 2>&1; then
      jq -c --arg ts "$ts" --arg endpoint "$endpoint" --argjson status "$status" \
        '{ts: $ts, endpoint: $endpoint, status: $status, body: .}' <<< "$body" >> "$DATA_FILE"
    else
      # jq unavailable or body not valid JSON; store raw body as a string.
      python3 - "$ts" "$endpoint" "$status" <<'PYEOF' >> "$DATA_FILE" 2>>"$LOG_FILE" || echo "{\"ts\":\"$ts\",\"endpoint\":\"$endpoint\",\"status\":$status,\"body\":null}" >> "$DATA_FILE"
import json, sys
ts, endpoint, status = sys.argv[1], sys.argv[2], int(sys.argv[3])
body = sys.stdin.read()
try:
    parsed = json.loads(body)
except Exception:
    parsed = None
print(json.dumps({"ts": ts, "endpoint": endpoint, "status": status, "body": parsed}))
PYEOF
    fi
    echo "OK($status)"
  else
    if [ "$endpoint" = "leaderboard" ]; then
      LEADERBOARD_FAILURES=$((LEADERBOARD_FAILURES + 1))
    fi
    echo "{\"ts\":\"$ts\",\"endpoint\":\"$endpoint\",\"status\":$status,\"body\":null}" >> "$DATA_FILE"
    echo "FAIL($status)"
  fi
}

show_cookie_alert() {
  local now
  now="$(date +%s)"
  local last_alert=0
  if [ -f "$ALERT_NOTIF_FILE" ]; then
    last_alert="$(cat "$ALERT_NOTIF_FILE")"
  fi

  # Only show alert if more than 600 seconds (10 minutes) have passed since last one
  if [ $((now - last_alert)) -ge 600 ]; then
    osascript -e 'display notification "Cookie in cookie.txt probably expired (401/403 for 3+ cycles). Grab a fresh session cookie from browser devtools and update the file; monitor will use it on next cycle." with title "Bazaar sniffer"' 2>/dev/null || true
    echo "$now" > "$ALERT_NOTIF_FILE"
  fi
}

log "sniff.sh started pid=$$"

while [ "$SHOULD_EXIT" -eq 0 ]; do
  cycle_ts="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  results=()
  for ep in "${ENDPOINTS[@]}"; do
    result="$(fetch_one "$ep")"
    results+=("$ep=$result")
  done
  log "cycle $cycle_ts: ${results[*]}"

  # Check if leaderboard has failed 3+ times in a row and show alert once per 10min
  if [ "$LEADERBOARD_FAILURES" -ge 3 ]; then
    show_cookie_alert
  fi

  # Exit gracefully after flushing current cycle
  if [ "$SHOULD_EXIT" -eq 1 ]; then
    log "sniff.sh received SIGTERM, exiting cleanly"
    exit 0
  fi

  sleep "$INTERVAL"
done
