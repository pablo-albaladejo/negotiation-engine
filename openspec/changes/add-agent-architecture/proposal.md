complexity: high

# Proposal: arquitectura del agente negociador (add-agent-architecture)

## Why

El repositorio solo tiene el andamiaje (esquema de configuración, `enforceGuardrails` con propiedades fast-check, enum de proveedor LLM y entrypoints vacíos). El torneo del Negotiation Ring empieza el viernes 2 de octubre de 2026 y el protocolo del ring no se conoce hasta las 18:45 de ese día: necesitamos un agente que pueda jugar una partida completa desde el minuto 0 contra cualquier rival (otro equipo, Claude o GPT) y, a la vez, una arquitectura en la que cada caja se pueda probar, medir e iterar por separado hasta la congelación del domingo a las 15:30.

El principio que lo ordena todo es el de Causa Prima, "LLMs inform; rules enforce": el LLM interpreta al rival y redacta la respuesta, pero la cifra y la decisión de aceptar o retirarse las decide siempre código determinista, cuyos parámetros ajusta fuera del torneo un bucle de self-play.

## What Changes

- **Esqueleto andante primero**: un agente determinista de extremo a extremo (`LLM_PROVIDER=none`, parser y narrador por plantilla) que juega una partida completa a través de un adaptador HTTP JSON genérico y contra al menos un rival externo de sparring, antes de introducir ningún LLM. tasks.md sigue ese camino crítico y etiqueta lo aplazado.
- **Cada caja es un módulo puro, tipado e intercambiable**, con contrato Zod de entrada y salida, fixtures y tests propios, ejecutable de forma aislada (vitest desde el principio; CLI `pnpm box <caja>` tras el viernes 18:45): adaptadores, parser, normalizador numérico, estado de sesión, modelo del rival, generador de ofertas, aceptación, guardarraíles, narrador, validador, plantilla.
- **Adaptadores de protocolo intercambiables** con un contrato único hacia el cerebro, en modo servidor (el ring nos llama) y modo cliente (nosotros conducimos el bucle): HTTP JSON (base), A2A (spike de 2 h) y MCP (si el ring lo usa o sobra tiempo). Modo solo texto: la oferta del rival se extrae del texto solo si el parser determinista y el LLM coinciden, y nuestras aceptaciones repiten las cifras exactas. La aceptación del rival se enlaza solo a nuestra última oferta. El viernes solo se reescriben adaptadores y esquemas. Despliegue accesible desde fuera por túnel con humo previo.
- **Motor de estrategia determinista multi-issue** (`issues: {name,min,max,direction,weight}[]`; solo precio = 1 issue): utilidad aditiva ponderada normalizada, modelo del rival, generador Boulware β con ruido sembrado sobre el paso de concesión y Tit-for-Tat que solo reduce concesiones, aceptación AC_next / AC_time / último movimiento (`u ≥ u(reserva)`) sobre la oferta actual, tiempo derivado solo del ring o de `defaultHorizon`, y guardarraíles (mandato y monotonía).
- **Frontera LLM en cuarentena** (patrón dual-LLM / CaMeL): parser sin herramientas que solo devuelve JSON tipado; narrador que solo recibe enums y las cifras decididas; normalizador numérico compartido (palabras ES/EN, coma decimal, %, pb, rangos, fracciones) para parser, validador y detector de fugas; plantilla de emergencia.
- **Pipeline de turno robusto**: presupuesto = tiempo del ring − 500 ms, 2 intentos en total por caja con LLM y luego plantilla, validación de esquema en ambos sentidos; un turno nunca se pierde ni tumba el proceso.
- **Traza por turno** en JSONL (una entrada por caja con entrada, salida, semilla, versión de configuración y latencia; mandato solo en modo arena) que permite reproducir y reevaluar cualquier caja offline; transcripciones doradas tras el viernes 18:45. Logs estructurados con test de barrido de valores; trazas externas (Langfuse/OpenTelemetry) opcionales tras un flag.
- **Arena con rigor estadístico**: RNG sembrado, 1000 partidas en menos de 60 s, comparación pareada campeón vs candidato por clústeres (escenario × rival) con roles ponderados por `roleWeights` (1:1 por defecto); primero media pareada + test de signos, el sábado bootstrap por clústeres; puerta = efecto mínimo (+1 pp) significativo, revalidación con semillas nuevas, rivales reservados nunca usados en ajuste, 0 violaciones y 0 fugas.
- **Rivales externos como sparring**: la arena acepta como rival cualquier agente externo (HTTP/A2A), un bot de solo texto y un bot guiado por LLM, además de los bots en código (los adversariales, el sábado).
- **Bucle de ajuste**: barrido de parámetros (rejilla / aleatorio) solo contra rivales de ajuste, optimizador de caja negra y crítico LLM opcionales, versionado de configuración y promoción a `config/champion.json`.
- **Red team** con promptfoo (`npx promptfoo@0.123.1`, sin dependencia): los 3 patrones que fallaron contra Scribo (también como tests de vitest en cada cambio) y `prompt-extraction`; `excessive-agency`, `hijacking`, `ascii-smuggling` y `jailbreak:meta` si hay tiempo.
- `AgentConfigSchema` se amplía (`issues`, `defaultHorizon`, `roleWeights`, márgenes, ruido, tiempos); `config/champion.json` pasa a versión 1 compatible con el nuevo esquema.

## Capabilities

### New Capabilities
- `ring-protocol`: esquemas del mensaje del ring, contrato único de adaptador en modo servidor y cliente, modo solo texto, enlace de la aceptación del rival, despliegue por túnel, con implementaciones HTTP JSON, A2A y MCP intercambiables.
- `negotiation-engine`: motor determinista multi-issue: utilidad, modelo del rival, generador de ofertas, tiempo y horizonte, condiciones de aceptación y guardarraíles.
- `llm-boundary`: parser en cuarentena, normalizador numérico compartido, narrador, validador, plantilla, proveedores (`none` | `claude-cli` | `anthropic-api`) y detector de fugas.
- `turn-pipeline`: orquestación de un turno, estado de sesión, presupuesto de tiempo, reintentos, ruta de emergencia, trazas JSONL y observabilidad.
- `arena`: escenarios, bots en código y de solo texto, rivales externos y LLM, rivales reservados, partidas sembradas, métricas, estadística pareada por clústeres, puerta de promoción y resultados.
- `tuning`: barridos de parámetros, crítico LLM opcional, versionado y promoción de configuración.
- `red-team`: suite promptfoo contra nuestro agente con los patrones de Scribo y los plugins listados, y casos de Scribo en vitest.

### Modified Capabilities
- Ninguna (no existen specs previas en `openspec/specs/`).

## Impact

- **Código**: nuevo contenido en `src/protocol/`, `src/engine/`, `src/llm/`, `src/agent/`, `src/bots/`, `src/arena/`; nuevas carpetas `src/pipeline/`, `src/trace/`, `src/tuning/`, `redteam/`, `test/fixtures/`, `test/golden/`. `src/engine/guardrails.ts` y `src/engine/config.ts` evolucionan a multi-issue sin romper sus propiedades actuales.
- **Scripts**: `pnpm agent`, `pnpm arena`, `pnpm bot:serve`, `pnpm box`, `pnpm replay`, `pnpm tune`, `pnpm promote`, `pnpm redteam`.
- **Dependencias** (se deciden en design.md): minuto 0 solo `hono` y `@hono/node-server`; después `pure-rand` (directa; hoy transitiva de fast-check), `pino`, SDK de Anthropic; SDK A2A y SDK MCP tras el spike; Langfuse/OpenTelemetry opcional. promptfoo no se añade: se ejecuta con `npx promptfoo@0.123.1`.
- **Sistemas**: solo portátiles, sin infraestructura; exposición al ring por túnel (cloudflared o ngrok) con humo desde otra red antes del viernes. `results/` sigue fuera de git; las configuraciones campeonas se versionan con commits `champion vN`.
- **Supuestos**: protocolo del ring desconocido hasta el viernes 18:45 (puede ser solo texto, sin límite de rondas conocido, con el ring como cliente o como servidor); el torneo puede ser solo de precio (1 issue); los rivales pueden ser cualquier LLM; puntuación oficial por rol desconocida (de ahí `roleWeights` 1:1); sin infraestructura.
