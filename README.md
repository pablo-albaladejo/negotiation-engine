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
