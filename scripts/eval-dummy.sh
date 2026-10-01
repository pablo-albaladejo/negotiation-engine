#!/usr/bin/env bash
# Evalúa el agente "dummy" (naive) contra la campeona en los dos escenarios:
#  A. config/baselines/dummy.json como candidata, en proceso: `pnpm arena --candidate` +
#     `pnpm promote --dry-run` (no toca config/champion.json).
#  B. src/bots/dummy-agent.ts como agente HTTP externo (no nuestro motor): se enchufa con
#     `--agent-url` contra los mismos bots que la campeona, y una partida directa
#     campeona-contra-dummy por HTTP.
# Semillas pequeñas y fijas: pensado para correr en 1-2 min. Uso: pnpm eval:dummy [seeds]
set -euo pipefail
cd "$(dirname "$0")/.."

SEEDS="${1:-5}"
SCENARIO="${EVAL_DUMMY_SCENARIO:-price-buyer-wide}"
STRATEGY="${EVAL_DUMMY_STRATEGY:-accept-first}"
AGENT_PORT="${EVAL_DUMMY_AGENT_PORT:-8797}"
DUMMY_PORT="${EVAL_DUMMY_DUMMY_PORT:-8799}"
RUN_PREFIX="${EVAL_DUMMY_RUN_PREFIX:-eval-dummy}"
LOG_DIR="results/eval-dummy"
mkdir -p "$LOG_DIR"
export LLM_PROVIDER=none
export AGENT_ALLOW_NOAUTH=1
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

echo "== escenario A: config/baselines/dummy.json como candidata (en proceso, sin red) =="
pnpm -s arena --candidate config/baselines/dummy.json --seeds "$SEEDS" --run-id "$RUN_PREFIX-A-arena" --out "$LOG_DIR"
echo
pnpm -s promote config/baselines/dummy.json --dry-run --seeds "$SEEDS" --reval-seeds "$SEEDS" --out "$LOG_DIR" || true

echo
echo "== escenario B: src/bots/dummy-agent.ts como agente HTTP externo (--strategy $STRATEGY) =="
pnpm -s dummy:serve --strategy "$STRATEGY" --port "$DUMMY_PORT" --scenario "$SCENARIO" 2>"$LOG_DIR/dummy-agent.log" &
PIDS+=($!)
wait_for "http://localhost:$DUMMY_PORT/health"

echo "-- campeona, mismos bots/escenario/semillas --"
pnpm -s arena --scenarios "$SCENARIO" --seeds "$SEEDS" --run-id "$RUN_PREFIX-B-champion" --out "$LOG_DIR"
echo
echo "-- dummy (agente HTTP), mismos bots/escenario/semillas --"
pnpm -s arena --agent-url "http://localhost:$DUMMY_PORT" --scenarios "$SCENARIO" --seeds "$SEEDS" --run-id "$RUN_PREFIX-B-dummy-agent" --out "$LOG_DIR"

echo
echo "-- partida directa: campeona (pnpm agent) contra el dummy, la arena hace de ring --"
PORT="$AGENT_PORT" pnpm -s agent 2>"$LOG_DIR/agent.log" &
PIDS+=($!)
wait_for "http://localhost:$AGENT_PORT/health"
pnpm -s arena --agent-url "http://localhost:$AGENT_PORT" --rival-url "http://localhost:$DUMMY_PORT" --rival-name "dummy-$STRATEGY" \
  --scenarios "$SCENARIO" --seeds "$SEEDS" --run-id "$RUN_PREFIX-B-direct" --out "$LOG_DIR"

echo
echo "resultados en $LOG_DIR/ (ábrelos en el visor: pnpm viewer, #/runs/<runId> o #/promote/<runId>)"
