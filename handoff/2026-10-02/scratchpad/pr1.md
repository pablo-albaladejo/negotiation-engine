## Qué trae

Implementación del camino del minuto 0 del cambio OpenSpec `add-agent-architecture` (38/79 tareas; las 27 aplazadas y las 10.x que dependen del protocolo real siguen abiertas).

- **Motor determinista** (`src/engine/`): utilidad, modelo del rival, Boulware con ruido sobre el paso, aceptación (AC_next, AC_time, última jugada), guardarraíles. La cifra y la decisión nunca salen de un LLM.
- **Protocolo** (`src/protocol/`): esquemas Zod, adaptador HTTP JSON con Hono (servidor y cliente), spike A2A con `@a2a-js/sdk`.
- **Pipeline del turno** (`src/pipeline/`): parser en cuarentena, normalizador numérico, validador, detector de fugas, plantilla de emergencia; siempre responde.
- **Arena** (`src/arena/`, `src/bots/`): escenarios como datos, bots Boulware/Conceder/TFT/solo-texto, sparring HTTP, métricas, trazas JSONL. 1008 partidas en ~4 s, 0 violaciones.
- **Seguridad**: modo servidor exige `AGENT_AUTH_TOKEN` (o `AGENT_ALLOW_NOAUTH=1`), logs pino con el mandato redactado, 3 casos red-team de Scribo como tests.
- **Specs actualizadas** con las decisiones de implementación (design.md §14) y 4 tareas nuevas (3.8, 10.10–10.12).

## Revisión

Dos vueltas de reviewer: veredicto final «ready». Arreglados el redondeo que podía cruzar el mandato por ~1e-11 (ahora siempre a nuestro favor, chequeo estricto) y el endpoint público sin auth.

## Cómo probar

```bash
pnpm install && pnpm test && pnpm typecheck   # 434 tests
pnpm arena
pnpm smoke
```

## Pendiente conocido

- 3.8: aceptación multi-issue puede quedar hasta 0,02 por debajo de u(reserva) en AC_next (no afecta al campeón v1, de un solo issue).
- 10.10: nos retiramos en la última ronda en vez de contraofertar (0 % de acuerdo con ZOPA estrecha contra Boulware/TFT).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
