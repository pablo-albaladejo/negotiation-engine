#!/usr/bin/env bash
# Sparring por HTTP con LLM_PROVIDER=none: arranca `pnpm agent` y un bot con `pnpm bot:serve`,
# y la arena hace de ring entre los dos procesos. Uso: scripts/sparring.sh [bot] [partidas]
# Deja el resumen en results/<run>/summary.json.
set -euo pipefail
cd "$(dirname "$0")/.."

BOT="${1:-conceder}"
GAMES="${2:-3}"
AGENT_PORT="${SPARRING_AGENT_PORT:-8797}"
BOT_PORT="${SPARRING_BOT_PORT:-8798}"
RUN_ID="${SPARRING_RUN_ID:-sparring-http-$BOT}"
LOG_DIR="results/sparring"
mkdir -p "$LOG_DIR"
export LLM_PROVIDER=none
PIDS=()
cleanup() { for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

wait_for() {
  for _ in $(seq 1 100); do
    curl -sf "$1" >/dev/null 2>&1 && return 0
    sleep 0.2
  done
  echo "no responde: $1" >&2
  return 1
}

# El mandato de `pnpm agent` (config/scenario.json) es el de price-buyer-wide.
PORT="$AGENT_PORT" pnpm -s agent 2>"$LOG_DIR/agent.log" &
PIDS+=($!)
pnpm -s bot:serve "$BOT" --port "$BOT_PORT" --scenario price-buyer-wide 2>"$LOG_DIR/bot.log" &
PIDS+=($!)
wait_for "http://localhost:$AGENT_PORT/health"
wait_for "http://localhost:$BOT_PORT/health"

pnpm -s arena --agent-url "http://localhost:$AGENT_PORT" --rival-url "http://localhost:$BOT_PORT" --rival-name "$BOT-http" \
  --scenarios price-buyer-wide --seeds "$GAMES" --run-id "$RUN_ID"
