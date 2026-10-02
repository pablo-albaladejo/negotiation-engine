# negotiation-ring

Agente negociador del **Equipo 2** para el Negotiation Ring del hackathon de Causa Prima.

> El LLM interpreta al rival y redacta la respuesta. **La cifra la decide siempre el código.**
> Fuera del torneo, un bucle de self-play ajusta los parámetros de ese código.

## Arquitectura de un turno

```
ring ─▶ adaptador de entrada (Zod) ─▶ parser en cuarentena (LLM sin herramientas) ─▶ JSON
                                                                                    │
        estado de la sesión (mandato · historial · ronda · plazo) ◀────────────────┘
                     │
                     ▼
        motor determinista: modelo del rival → oferta (Boulware β + TFT) → aceptación → guardarraíles
                     │ decisión = accept | counter(pct, day) | walk
                     ▼
        narrador (LLM) ─▶ validador (cifra = decisión) ─▶ adaptador de salida ─▶ ring
                     └─ 2 fallos o timeout ─▶ plantilla determinista (mismo número)
```

Principios:

- **El número nunca sale del LLM.** El texto del rival solo llega a un parser aislado que devuelve campos tipados.
- **Mandato e identidad los fija el código**, nunca el texto del rival.
- **Siempre respondemos**: timeouts, validación de esquema y plantilla de emergencia.
- **El adaptador va separado del cerebro**: si cambia el protocolo del ring, solo se reescribe `src/protocol/`.

## Estructura

```
src/
├─ protocol/   esquemas Zod del ring y adaptadores de entrada/salida
├─ engine/     motor determinista: utilidad, modelo del rival, oferta, aceptación, guardarraíles
├─ llm/        parser, narrador y plantilla · proveedor: none | claude-cli | anthropic-api
├─ agent/      servidor que habla con el ring
├─ bots/       rivales para la arena
└─ arena/      self-play: partidas, métricas, tabla
config/        champion.json (la mejor configuración hasta ahora) y candidatos
test/          tests, incluidas propiedades con fast-check
results/       partidas guardadas (fuera de git)
```

## Uso

Requisitos: Node ≥ 22 y pnpm.

```bash
pnpm install
cp .env.example .env
pnpm test        # tests unitarios y de propiedades
pnpm typecheck
pnpm arena       # self-play local contra los bots
AGENT_AUTH_TOKEN=… pnpm agent   # agente con config/champion.json (en local sin token: AGENT_ALLOW_NOAUTH=1)
pnpm bot:serve conceder --port 8790   # un bot como agente HTTP para sparring
pnpm sparring    # pnpm agent contra un bot servido, la arena hace de ring
```

En modo servidor el agente no arranca sin `AGENT_AUTH_TOKEN` (exige `Authorization: Bearer <token>`,
o la cabecera de `AGENT_AUTH_HEADER`); `AGENT_ALLOW_NOAUTH=1` lo permite solo para pruebas en local.

Despliegue por túnel: `AGENT_AUTH_TOKEN=… pnpm agent`, `cloudflared tunnel --url http://localhost:8787`
(o `ngrok http 8787`) y, desde otra red, `scripts/tunnel-smoke.sh https://<url-del-túnel>`
(`GET /health` + un turno por HTTPS validado contra el esquema).

## Evaluar un agente cualquiera (baseline o externo)

Hay dos formas de meter un agente "dummy" (u otro cualquiera) en la arena, para compararlo con la
campeona exactamente con los mismos bots, escenarios y semillas:

**(a) Como configuración de nuestro motor** (`AgentConfig`, válida por `parseConfig`):

```bash
pnpm arena --candidate config/baselines/dummy.json --seeds 5   # comparación pareada
pnpm promote config/baselines/dummy.json --dry-run --seeds 5 --reval-seeds 5   # puerta completa, sin tocar champion.json
```

`config/candidates/` está en `.gitignore` (es el área de trabajo efímera de `pnpm tune`); una
baseline que sí queremos versionar va en `config/baselines/` en su lugar.

**(b) Como agente HTTP externo**, cualquier programa que no sea nuestro motor, con tal de que hable
el contrato canónico `POST /turn` / `GET /health` (esquemas Zod de `src/protocol/schemas.ts`):

```bash
pnpm dummy:serve --strategy accept-first --port 8799 --scenario price-buyer-wide
pnpm arena --agent-url http://localhost:8799 --scenarios price-buyer-wide --seeds 5
```

`--agent-url` **sustituye** a nuestro agente (no añade un rival: para eso está `--rival-url`). El
turno que viaja por HTTP (`TurnInput`) no incluye el mandato del agente externo: cada servidor debe
conocer su propio mandato por su cuenta (aquí, por `--scenario`, igual que `pnpm bot:serve`), no lo
recibe de la arena. Para una partida directa campeona-contra-dummy por HTTP, ver `scripts/sparring.sh`
o `scripts/eval-dummy.sh`.

`pnpm eval:dummy [seeds]` (por defecto 5 semillas, ~20 s) corre de punta a punta los dos escenarios
contra `config/baselines/dummy.json` y `src/bots/dummy-agent.ts`, y deja todo en `results/eval-dummy/`.

## Medir el valor del LLM (parser y narrador)

`pnpm eval:llm` (`scripts/eval-llm.sh`) juega en texto completo (`--text-mode full`) una matriz
política del parser (`llm-primary-verified`, `dual-strict`, `deterministic-only`) × idioma del rival
(`EVAL_LLM_LANGUAGES`, por defecto `es,en`) × proveedor (`claude-cli`, y `anthropic-api` si hay
`EVAL_LLM_ANTHROPIC_API_KEY`), contra bots en código con el renderizador de lenguaje natural y el
bot LLM (`src/bots/llm-bot.ts`). Informa por celda sin-extraer, mal-leídas, falsas aceptaciones,
confirmaciones, plantilla y latencia p50/p95; solo una celda con 0 falsas aceptaciones es candidata
a valor por defecto. `pnpm eval:llm --dry-run` imprime el plan y la cota de llamadas sin jugar;
`LLM_PROVIDER=none pnpm eval:llm` juega la matriz sin ninguna llamada. Deja los resultados en
`results/eval-llm/` (fuera de git).

Necesita el **perfil personal** de Anthropic, no la pasarela de Aircall: como `claude-anthropic` es
una función de zsh (no se puede invocar desde un `spawn`), el script reproduce su entorno a mano en
cada llamada (`KAI_PROFILE=anthropic`, `CLAUDE_CONFIG_DIR=$HOME/.claude-anthropic`, sin las
variables `ANTHROPIC_*` de la pasarela). Si se ejecuta el eval a mano hay que anteponer ese mismo
entorno a cualquier comando que llame al LLM:

```bash
env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_API_KEY -u ANTHROPIC_MODEL \
    KAI_PROFILE=anthropic CLAUDE_CONFIG_DIR="$HOME/.claude-anthropic" LLM_PROVIDER=claude-cli <comando>
```

Coste: con el presupuesto por defecto (1 escenario, 1 semilla, boulware + bot LLM, 6 celdas) la
cota es de 280 llamadas reales (en la práctica menos: las partidas acaban antes del límite); el
script corta si la cota supera `EVAL_LLM_MAX_CALLS` (300). Ajustable con las variables `EVAL_LLM_*`
(ver `src/arena/eval-llm-main.ts`). En modo texto, `anthropic-api` es el proveedor recomendado:
`claude -p` paga ≈2 s de arranque por llamada y no cabe en el presupuesto del turno.
`pnpm arena` sin argumentos sigue sin hacer ninguna llamada al LLM.

## Flujo de trabajo

1. **Programar**: motor, bots y adaptadores. `pnpm test` tiene que pasar.
2. **Evaluar**: `pnpm arena` enfrenta la configuración candidata contra el campeón en todos los bots, roles y escenarios.
3. **Promover**: si mejora el excedente con **0 violaciones del mandato**, pasa a `config/champion.json` (commit `champion vN`).
4. **Competir**: el agente arranca siempre con el campeón. Si algo falla, se vuelve al campeón anterior con git.

## Equipo

| Quién  | Pieza                                                       |
| ------ | ----------------------------------------------------------- |
| Pablo  | adaptadores, parser, validador, arena, métricas, despliegue |
| Paula  | motor de estrategia, modelo del rival, ajuste de parámetros |
| Gerard | narrador y persona, bots adversariales, red team            |
