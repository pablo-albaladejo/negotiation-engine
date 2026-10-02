#!/usr/bin/env bash
# Matriz de evaluación del texto completo (`src/arena/eval-llm-main.ts`): política del parser
# (llm-primary-verified | dual-strict | deterministic-only) × idioma del rival (es, en) × proveedor
# (claude-cli, y anthropic-api si hay clave), contra bots en código con el renderizador de lenguaje
# natural y el bot LLM. Informa sin-extraer, mal-leídas, falsas aceptaciones, confirmaciones,
# plantilla y latencia p50/p95 por celda.
#
# Requiere el perfil PERSONAL de Anthropic (no la pasarela de Aircall): `claude-anthropic` es una
# función de zsh, así que no se puede invocar desde un `spawn`; este script reproduce su entorno a
# mano. Para `anthropic-api`, la clave va en EVAL_LLM_ANTHROPIC_API_KEY (y el modelo en
# EVAL_LLM_ANTHROPIC_MODEL), nunca la de la pasarela. Nunca imprime ni comitea tokens.
#
# Presupuesto por defecto pequeño (1 escenario, 1 semilla, boulware + bot LLM): la cota de llamadas
# se imprime antes de jugar y corta si supera EVAL_LLM_MAX_CALLS (300).
# Uso: pnpm eval:llm [--dry-run]   ·   sin llamadas: LLM_PROVIDER=none pnpm eval:llm
set -euo pipefail
cd "$(dirname "$0")/.."

export EVAL_LLM_SCENARIO="${EVAL_LLM_SCENARIO:-text-buyer-wide}"
export EVAL_LLM_RIVALS="${EVAL_LLM_RIVALS:-boulware}"
export EVAL_LLM_SEEDS="${EVAL_LLM_SEEDS:-1}"
export EVAL_LLM_LANGUAGES="${EVAL_LLM_LANGUAGES:-es,en}"
export EVAL_LLM_POLICIES="${EVAL_LLM_POLICIES:-llm-primary-verified,dual-strict,deterministic-only}"
export EVAL_LLM_MAX_CALLS="${EVAL_LLM_MAX_CALLS:-300}"
export EVAL_LLM_OUT="${EVAL_LLM_OUT:-results/eval-llm}"

api=()
if [[ -n "${EVAL_LLM_ANTHROPIC_API_KEY:-}" ]]; then
  api=(ANTHROPIC_API_KEY="$EVAL_LLM_ANTHROPIC_API_KEY" ANTHROPIC_MODEL="${EVAL_LLM_ANTHROPIC_MODEL:-}")
fi

exec env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL -u EVAL_LLM_ANTHROPIC_API_KEY \
  KAI_PROFILE=anthropic CLAUDE_CONFIG_DIR="$HOME/.claude-anthropic" "${api[@]}" \
  pnpm exec tsx src/arena/eval-llm-main.ts "$@"
