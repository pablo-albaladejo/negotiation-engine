complexity: high

# Proposal: arquitectura del agente negociador (add-agent-architecture)

## Why

El repositorio solo tiene el andamiaje (esquema de configuración, `enforceGuardrails` con propiedades fast-check, enum de proveedor LLM y entrypoints vacíos). El torneo del Negotiation Ring empieza el viernes 2 de octubre de 2026 y el protocolo del ring no se conoce hasta las 18:45 de ese día: necesitamos un agente que pueda jugar una partida completa desde el minuto 0 contra cualquier rival (otro equipo, Claude o GPT) y, a la vez, una arquitectura en la que cada caja se pueda probar, medir e iterar por separado hasta la congelación del domingo a las 15:30.

El principio que lo ordena todo es el de Causa Prima, "LLMs inform; rules enforce": el LLM interpreta al rival y redacta la respuesta, pero la cifra y la decisión de aceptar o retirarse las decide siempre código determinista, cuyos parámetros ajusta fuera del torneo un bucle de self-play.

## What Changes

- **Esqueleto andante primero**: un agente determinista de extremo a extremo (`LLM_PROVIDER=none`, parser y narrador por plantilla) que juega una partida completa a través de un adaptador HTTP JSON genérico y contra al menos un rival externo de sparring, antes de introducir ningún LLM.
- **Cada caja es un módulo puro, tipado e intercambiable**, con contrato Zod de entrada y salida, fixtures y tests propios, y ejecutable de forma aislada (objetivo de vitest y CLI `pnpm box <caja>`): adaptadores, parser, estado de sesión, modelo del rival, generador de ofertas, aceptación, guardarraíles, narrador, validador, plantilla.
- **Adaptadores de protocolo intercambiables** con un contrato único hacia el cerebro: HTTP JSON (base), A2A y MCP. El cambio de protocolo del viernes solo reescribe adaptadores y esquemas.
- **Motor de estrategia determinista 2D** (% de descuento y día de pago): utilidad, modelo del rival (estimación de la reserva a partir de sus concesiones), generador Boulware β + Tit-for-Tat + ruido sembrado, aceptación AC_next / AC_time / walk, y guardarraíles (mandato y monotonía) extendidos a 2D.
- **Frontera LLM en cuarentena** (patrón dual-LLM / CaMeL): parser sin herramientas que solo devuelve JSON tipado y nunca fija identidad, mandato ni reserva; narrador que pone palabras a una decisión ya tomada; validador que exige que la cifra del texto coincida con la decisión; detector de fugas de la reserva; plantilla de emergencia.
- **Pipeline de turno robusto**: timeouts, 2 reintentos, plantilla de emergencia, validación de esquema en ambos sentidos; un turno nunca se pierde ni tumba el proceso.
- **Traza por turno** en JSONL (una entrada por caja con entrada, salida, semilla, versión de configuración y latencia) que permite reproducir y reevaluar cualquier caja offline; transcripciones doradas como tests de regresión. Logs estructurados; trazas externas (Langfuse/OpenTelemetry) opcionales tras un flag.
- **Arena con rigor estadístico**: RNG sembrado, comparación pareada campeón vs candidato sobre los mismos escenarios y semillas, ambos roles con el de comprador ponderado, intervalos de confianza por bootstrap; puerta de promoción = excedente mejor con IC y 0 violaciones y 0 fugas; tabla de resultados y partidas guardadas en `results/`.
- **Rivales externos como sparring**: la arena acepta como rival cualquier agente externo (endpoint HTTP/A2A de otro equipo o de un benchmark público) o un bot guiado por LLM, además de los bots en código.
- **Bucle de ajuste**: barrido de parámetros (rejilla / aleatorio, optimizador de caja negra opcional) sobre la arena, crítico LLM opcional sobre las derrotas, versionado de configuración y promoción a `config/champion.json`.
- **Red team** con promptfoo: los 3 patrones que fallaron contra Scribo (extracción por marco hipotético, campo de identidad fijado por el LLM, acción sensible sin contexto legítimo) más los plugins `excessive-agency`, `hijacking`, `prompt-extraction`, `ascii-smuggling` y la estrategia `jailbreak:meta`, ejecutable por script.
- `AgentConfigSchema` se amplía (parámetros 2D, márgenes, timeouts); `config/champion.json` pasa a versión 1 compatible con el nuevo esquema.

## Capabilities

### New Capabilities
- `ring-protocol`: esquemas del mensaje del ring y contrato único de adaptador (entrada/salida), con implementaciones HTTP JSON, A2A y MCP intercambiables.
- `negotiation-engine`: motor determinista 2D: utilidad, modelo del rival, generador de ofertas, condiciones de aceptación y guardarraíles.
- `llm-boundary`: parser en cuarentena, narrador, validador, plantilla, proveedores (`none` | `claude-cli` | `anthropic-api`) y detector de fugas.
- `turn-pipeline`: orquestación de un turno, estado de sesión, timeouts, reintentos, ruta de emergencia, trazas JSONL y observabilidad.
- `arena`: escenarios, bots en código, rivales externos y LLM, partidas sembradas, métricas, estadística pareada, puerta de promoción y resultados.
- `tuning`: barridos de parámetros, crítico LLM opcional, versionado y promoción de configuración.
- `red-team`: suite promptfoo contra nuestro agente con los patrones de Scribo y los plugins listados.

### Modified Capabilities
- Ninguna (no existen specs previas en `openspec/specs/`).

## Impact

- **Código**: nuevo contenido en `src/protocol/`, `src/engine/`, `src/llm/`, `src/agent/`, `src/bots/`, `src/arena/`; nuevas carpetas `src/pipeline/`, `src/trace/`, `src/tuning/`, `redteam/`, `test/fixtures/`, `test/golden/`. `src/engine/guardrails.ts` y `src/engine/config.ts` evolucionan a 2D sin romper sus propiedades actuales.
- **Scripts**: `pnpm agent`, `pnpm arena`, `pnpm box`, `pnpm replay`, `pnpm tune`, `pnpm promote`, `pnpm redteam`.
- **Dependencias** (se deciden en design.md): servidor HTTP, SDK de Anthropic, logger estructurado, RNG sembrable, SDK A2A, SDK MCP, promptfoo (dev); Langfuse/OpenTelemetry opcional.
- **Sistemas**: solo portátiles, sin infraestructura; exposición al ring por túnel o nube cuando se conozca el protocolo. `results/` sigue fuera de git; las configuraciones campeonas se versionan con commits `champion vN`.
- **Supuestos**: protocolo del ring desconocido hasta el viernes 18:45; el torneo puede ser solo de precio (entonces el día queda fijo); los rivales pueden ser cualquier LLM; sin infraestructura.
