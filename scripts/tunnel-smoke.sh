#!/usr/bin/env bash
# Humo del despliegue por túnel: GET /health y un turno por la URL pública, validando la salida.
# Ejecutar desde OTRA red (p. ej. el móvil compartiendo datos) contra la URL que da el túnel:
#
#   # en el portátil del agente
#   AGENT_AUTH_TOKEN=... PORT=8787 pnpm agent
#   cloudflared tunnel --url http://localhost:8787      # o: ngrok http 8787
#
#   # desde otra red
#   AGENT_AUTH_TOKEN=... scripts/tunnel-smoke.sh https://<subdominio>.trycloudflare.com
#
# Exige HTTPS salvo con TUNNEL_ALLOW_HTTP=1 (solo para probar el script en local).
set -euo pipefail
cd "$(dirname "$0")/.."

URL="${1:?uso: scripts/tunnel-smoke.sh <url-pública>}"
URL="${URL%/}"
if [[ "$URL" != https://* && "${TUNNEL_ALLOW_HTTP:-0}" != "1" ]]; then
  echo "la URL debe ser https:// (TLS del túnel)" >&2
  exit 1
fi

AUTH=()
if [[ -n "${AGENT_AUTH_TOKEN:-}" ]]; then
  if [[ -n "${AGENT_AUTH_HEADER:-}" ]]; then AUTH=(-H "$AGENT_AUTH_HEADER: $AGENT_AUTH_TOKEN")
  else AUTH=(-H "Authorization: Bearer $AGENT_AUTH_TOKEN"); fi
fi

echo "== GET $URL/health"
curl -sSf --max-time 10 "$URL/health"
echo

SESSION="tunnel-smoke-$(date +%s)"
echo "== POST $URL/turn"
curl -sSf --max-time 10 -X POST -H 'content-type: application/json' "${AUTH[@]}" \
  -d "{\"sessionId\":\"$SESSION\",\"round\":1,\"roundLimit\":10,\"rivalAction\":\"offer\",\"rivalOffer\":{\"pct\":1},\"text\":\"Puedo ofrecer un 1 %.\"}" \
  "$URL/turn" | pnpm -s exec tsx scripts/check-turn.ts
echo "humo del túnel OK"
