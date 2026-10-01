#!/usr/bin/env bash
# Mide, con llamadas reales al LLM, si el parser y el narrador aportan valor sobre la vía
# determinista (`src/arena/eval-llm-main.ts`): parser en modo solo-texto (none vs claude-cli),
# calidad del narrador (rechazos del validador, plantilla, fugas, latencia) y unas partidas
# reales de la campeona contra el bot guiado por LLM (`--llm-bot`, src/bots/llm-bot.ts).
#
# Requiere el perfil PERSONAL de Anthropic (no la pasarela de Aircall): `claude-anthropic` es una
# función de zsh, así que no se puede invocar desde un `spawn`; este script reproduce su entorno a
# mano en cada llamada. Nunca imprime ni comitea tokens.
#
# Presupuesto por defecto: pequeño (1 escenario, 1 semilla, 6 rivales de texto + 3 partidas contra
# el bot LLM) — unas 90-150 llamadas reales al LLM. Ajustable con las variables EVAL_LLM_*
# (ver src/arena/eval-llm-main.ts). Uso: pnpm eval:llm
set -euo pipefail
cd "$(dirname "$0")/.."

export EVAL_LLM_SCENARIO="${EVAL_LLM_SCENARIO:-text-buyer-wide}"
export EVAL_LLM_RIVALS="${EVAL_LLM_RIVALS:-text-only,inject-voss,liar,hypothetical,extreme-anchor,causa-prima}"
export EVAL_LLM_SEEDS="${EVAL_LLM_SEEDS:-1}"
export EVAL_LLM_RIVAL_GAMES="${EVAL_LLM_RIVAL_GAMES:-3}"
export EVAL_LLM_RIVAL_SCENARIO="${EVAL_LLM_RIVAL_SCENARIO:-price-buyer-wide}"
export EVAL_LLM_SKIP_RIVAL="${EVAL_LLM_SKIP_RIVAL:-0}"
export EVAL_LLM_OUT="${EVAL_LLM_OUT:-results/eval-llm}"

exec env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL \
  KAI_PROFILE=anthropic CLAUDE_CONFIG_DIR="$HOME/.claude-anthropic" \
  pnpm exec tsx src/arena/eval-llm-main.ts
