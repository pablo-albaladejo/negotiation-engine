#!/usr/bin/env bash
# Humo de extremo a extremo con LLM_PROVIDER=none:
#  1. modo servidor: arranca `pnpm agent` y juega 3 turnos con curl validando cada respuesta;
#  2. modo cliente: el agente conduce el bucle contra un ring simulado.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${SMOKE_PORT:-8787}"
RING_PORT="${SMOKE_RING_PORT:-8788}"
LOG_DIR="results/smoke"
mkdir -p "$LOG_DIR"
export LLM_PROVIDER=none
# El modo servidor exige token: el humo usa uno propio y lo envía en cada turno.
export AGENT_AUTH_TOKEN="smoke-$$"
AGENT_PID=""
RING_PID=""
cleanup() {
  [[ -n "$AGENT_PID" ]] && kill "$AGENT_PID" 2>/dev/null || true
  [[ -n "$RING_PID" ]] && kill "$RING_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait_for() {
  for _ in $(seq 1 100); do
    curl -sf "$1" >/dev/null 2>&1 && return 0
    sleep 0.2
  done
  echo "no responde: $1" >&2
  return 1
}

echo "== modo servidor (puerto $PORT)"
PORT="$PORT" pnpm -s agent 2>"$LOG_DIR/agent-server.log" &
AGENT_PID=$!
wait_for "http://localhost:$PORT/health"
curl -sf "http://localhost:$PORT/health"
echo
for round in 1 2 3; do
  body="{\"sessionId\":\"smoke\",\"round\":$round,\"roundLimit\":10,\"rivalAction\":\"offer\",\"rivalOffer\":{\"pct\":$round},\"text\":\"Puedo ofrecer un $round %.\"}"
  curl -sf -X POST -H 'content-type: application/json' -H "Authorization: Bearer $AGENT_AUTH_TOKEN" -d "$body" "http://localhost:$PORT/turn" | pnpm -s exec tsx scripts/check-turn.ts
done
kill "$AGENT_PID"
wait "$AGENT_PID" 2>/dev/null || true
AGENT_PID=""

echo "== modo cliente (ring simulado en $RING_PORT)"
pnpm -s exec tsx scripts/sim-ring.ts --port "$RING_PORT" --rounds 3 &
RING_PID=$!
wait_for "http://localhost:$RING_PORT/health"
AGENT_MODE=client RING_URL="http://localhost:$RING_PORT" pnpm -s agent 2>"$LOG_DIR/agent-client.log"
wait "$RING_PID"
RING_PID=""
echo "humo OK"
