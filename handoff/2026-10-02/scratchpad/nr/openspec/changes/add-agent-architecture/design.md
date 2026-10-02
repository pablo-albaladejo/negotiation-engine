# Design: add-agent-architecture

## Context

Ver proposal.md (Why) y las specs de cada capacidad para los requisitos. Estado de partida: TS 7, Node 24, pnpm, zod 4, vitest 5, fast-check 4 y tsx instalados; `AgentConfigSchema` (escalar), `enforceGuardrails` 1D con propiedades fast-check, `LlmProviderSchema` (`none` | `claude-cli` | `anthropic-api`) y entrypoints vacíos. `pure-rand` ya está en `node_modules` como dependencia de fast-check.

Restricciones: solo portátiles y sin infraestructura; protocolo del ring desconocido hasta el viernes 18:45 (probablemente de estilo A2A: Causa Prima habla de "A2A peers", "agent card"); el escenario probable es el de Causa Prima (pronto pago con descuento `pct` y día de pago, mandato como banda de TAE, límite de rondas, parada por ruptura de protocolo); ranking = fracción capturada del excedente de la ZOPA, sin acuerdo = 0 para ambos; rivales de cualquier modelo. Reglas del equipo: la cifra es código, el texto del rival es dato, nunca revelar ni loguear la reserva, toda salida validada por esquema, aleatorización obligatoria.

## Goals / Non-Goals

**Goals:**
- Esqueleto andante determinista jugando por HTTP antes de introducir LLM (ver tasks.md, grupos 1–6).
- Arquitectura hexagonal: un cerebro puro (estado → decisión) rodeado de adaptadores y cajas LLM sustituibles, cada una con contrato Zod, fixtures y ejecución aislada.
- Todo reproducible: semillas explícitas, trazas por caja, replay y transcripciones doradas.

**Non-Goals:**
- Nada de NegMAS/Python ni Optuna en el runtime: NegMAS queda para prototipar curvas offline (Paula) y sus resultados entran como parámetros de configuración.
- Sin base de datos, colas ni servicios gestionados; el estado de sesión vive en memoria y las trazas en ficheros.
- Sin interfaz web; la tabla de la arena es de consola y el resumen es JSON.
- Sin soporte multi-modelo más allá de Claude en esta change (ver decisión 4).

## Decisions

### 1. Cerebro puro + cajas con contrato (hexagonal)
Cada caja es `Box<I, O> = { name, input: ZodType<I>, output: ZodType<O>, run(input, ctx) }`, con `ctx` que aporta RNG sembrado, reloj inyectado, logger y escritor de traza. Un registro de cajas alimenta `pnpm box <name> <fixture.json>` y `pnpm replay`. El pipeline es la composición de cajas y es el único que conoce el orden del turno. **Alternativas:** clases con inyección de dependencias (más ceremonia, sin ventaja en 48 h); un framework de agentes (LangGraph, Mastra): esconden el flujo que precisamente queremos controlar y trazar.

### 2. Servidor HTTP: Hono
Hono (`hono` + `@hono/node-server`) sobre Request/Response estándar: arranca en Node en el portátil y se puede mover a Workers, Vercel o Bun sin cambios si hay que desplegar en la nube; `app.request()` permite tests de contrato sin abrir puertos, y encaja con validación Zod. **Rechazado:** Fastify (maduro y rápido, pero su validación es JSON Schema/ajv y duplicaría Zod; el rendimiento no es el cuello de botella con un turno cada pocos segundos); Express (API antigua, sin tipos de primera clase).

### 3. Protocolos: un contrato canónico, tres adaptadores
`RingAdapter` (servidor) y `RingClient` (cliente) traducen al contrato canónico de ring-protocol. HTTP JSON es la base del día 0. A2A con `@a2a-js/sdk` (tarjeta de agente + manejador de mensajes; cliente A2A para sparring) y MCP con `@modelcontextprotocol/sdk` (herramienta `negotiate_turn` sobre Streamable HTTP). Se hace un spike de A2A antes del viernes porque es el candidato más probable; MCP queda como spike corto. Una batería de tests de contrato común se ejecuta contra todos los adaptadores. El viernes solo se toca `src/protocol/` (comprobable con `git diff --stat`).

### 4. LLM: `@anthropic-ai/sdk` en torneo, `claude -p --json-schema` en desarrollo
Zod 4 es la única fuente de verdad: `z.toJSONSchema()` genera el esquema que se pasa al proveedor y la respuesta se revalida con el mismo esquema Zod (defensa en profundidad aunque el proveedor garantice la forma). `claude-cli` usa la suscripción (gratis para muestras pequeñas); `anthropic-api` usa salida estructurada (tool con `input_schema` forzado mediante `tool_choice`, o el modo nativo de salida estructurada si está disponible en la versión instalada). Modelo configurable por env. **Rechazado:** Vercel AI SDK (es lo que usa Causa Prima y facilitaría usar GPT, pero añade una capa sobre dos proveedores que ya controlamos; se reconsidera si el torneo impone otro modelo); LangChain (pesado, sin valor aquí).

### 5. Frontera de seguridad: dual-LLM + CaMeL ligero
Patrón dual-LLM (Willison, 2023) y CaMeL (DeepMind, 2025) como referencia: el LLM en cuarentena (parser) ve el texto hostil pero no tiene herramientas ni secretos y solo emite datos tipados con esquema cerrado (`.strict()`, sin campos de identidad ni mandato); el narrador no ve el texto crudo ni la reserva, solo la decisión y un resumen tipado, así que aunque lo secuestren no tiene nada que filtrar ni puede cambiar la cifra (el validador la comprueba). El control de flujo (aceptar, cerrar) es código, como la separación de control y datos de CaMeL. El detector de fugas (reserva ± tolerancia, plazo, frases de "mi límite/máximo", fragmentos de prompts) es defensa en profundidad. Esto responde directamente a los 3 fallos de Scribo: extracción hipotética (el narrador no conoce la reserva), campo de identidad fijado por el LLM (esquema cerrado), acción sensible sin contexto (solo el motor acepta y solo sobre la oferta estructurada).

### 6. Motor: estado del arte clásico, simple primero
- **Utilidad 2D**: aditiva ponderada y normalizada; en escenarios de pronto pago se mapea (`pct`, `day`) a la TAE implícita (como el mandato de Causa Prima, expresado como banda de TAE), en solo precio a precio. El mapeo concreto se fija en el esquema del escenario.
- **Ofertas**: tácticas dependientes del tiempo Boulware/Conceder (Faratin, Sierra & Jennings, 1998) con β de la configuración, reciprocidad Tit-for-Tat relativa y ruido sembrado para no revelar la reserva por la secuencia de concesiones; en 2D se elige en la curva de iso-utilidad el punto más cercano a la última oferta del rival (trade-off).
- **Aceptación**: AC_next, AC_time y su combinación AC_combi (Baarslag et al.), tal como se estudian en ANAC/Genius/NegMAS. Como no acordar vale 0 para ambos, retirarse solo tiene sentido si ninguna oferta del rival está dentro del mandato al final.
- **Modelo del rival**: regresión de la reserva a partir de sus concesiones (ajuste de su curva de concesión y extrapolación al plazo) + modelo de frecuencias para los pesos de los ejes; el modelo bayesiano (Hindriks & Tykhonov, 2008) es la mejora del sábado si la arena lo justifica.
- **Referencias LLM**: OG-Narrator (2024) valida la separación generador de ofertas + narrador; NegotiationArena (Bianchi et al., 2024), AgenticPay y Magentic Marketplace (Microsoft, 2025) aportan escenarios y comportamientos de rivales (anclaje, sobre-concesión de LLMs) que se copian como bots, no como código.

### 7. RNG sembrable: `pure-rand`
Generadores puros (xoroshiro128+) de dubzzz, ya presentes vía fast-check, así que no añade superficie nueva; se declara como dependencia directa. Cada partida deriva semillas independientes por caja (motor, bot, bootstrap) a partir de la semilla de partida. **Rechazado:** `seedrandom` (API mutable y global), `Math.random` (no reproducible).

### 8. Trazas y logs: JSONL propio + pino
Escritor JSONL propio (~50 líneas) con esquema Zod del registro; un fichero por partida en `results/<run>/`. Logs con `pino` y `redact` sobre las rutas del mandato; un test de propiedad comprueba que la reserva nunca aparece en la salida de logs. Langfuse/OpenTelemetry detrás de `OTEL_ENABLED`/`LANGFUSE_ENABLED`, apagado por defecto (Causa Prima usa Langfuse, útil para la demo). **Rechazado:** usar Langfuse como almacén de trazas para replay (dependencia de red y de cuenta; el replay tiene que funcionar offline).

### 9. Arena y estadística propias
Arena en proceso (~200 líneas): `Participant` común para nuestro agente, bots en código, bots LLM y rivales externos (estos últimos vía `RingClient`). Estadística: bootstrap pareado por percentiles, sembrado, 2000 remuestreos, sobre la diferencia por (escenario, rival, rol, semilla), con el rol comprador ponderado (por defecto 2:1, configurable). Puerta: límite inferior del IC > 0 y 0 violaciones y 0 fugas. **Rechazado:** `simple-statistics` o similares (la necesidad cabe en 40 líneas testeables con fast-check); tests de hipótesis paramétricos (el excedente no es normal y está acotado).

### 10. Ajuste: muestreo aleatorio + rejilla, optimizador enchufable
Interfaz `propose(history) → Config[]` y `evaluate(config) → PairedReport`. Primero muestreo aleatorio sembrado y rejilla (los parámetros son pocos: β, apertura, márgenes, ruido, pesos, umbral de tiempo); successive halving para ahorrar partidas. Un optimizador de caja negra en TS es opcional. El crítico LLM usa el mismo proveedor y solo escribe un informe.

### 11. Red team: promptfoo fijado en 0.123.1
Versión que ya se usó contra Scribo (conocemos su comportamiento: `prompt-injection` y `jailbreak*` son estrategias, `indirect-prompt-injection` necesita `indirectInjectionVar`, las estrategias `jailbreak-templates` requieren login en Promptfoo Cloud). Proveedor propio que habla con nuestro adaptador HTTP; aserciones JS deterministas además del evaluador, porque contra Scribo 15 de 18 "fallos" eran falsos positivos del evaluador. Los bots adversariales de la arena son la versión barata que corre en cada ejecución.

### 12. Configuración v1 y recarga
`AgentConfigSchema` v1 añade modo de ejes, pesos, umbral AC_time, márgenes 2D, tiempos máximos y metadatos de procedencia; `champion.json` pasa a `version: 1`. El agente relee la campeona al abrir cada sesión (comprobando mtime), nunca a mitad de sesión.

## Risks / Trade-offs

- [El protocolo real no encaja en el contrato canónico (por ejemplo, streaming o multi-mensaje por turno)] → el contrato es interno y se puede ampliar; spike A2A previo; los fixtures reales se capturan antes de escribir código el viernes.
- [La traza guarda el mandato en la cabecera de sesión, en tensión con "nunca loguear la reserva"] → solo en `results/` (fuera de git), nunca en logs ni en telemetría externa; en modo torneo se puede sustituir por una referencia al escenario (pendiente de confirmar con el equipo).
- [El narrador con LLM supera el tiempo del ring] → presupuesto por turno y plantilla; con protocolo estructurado se puede competir con `LLM_PROVIDER=none`.
- [Sobreajuste a nuestros bots en código] → rivales externos y bots LLM en la comparación; ponderar el rol comprador; revisar las derrotas con el crítico.
- [La API de `@a2a-js/sdk`, `@modelcontextprotocol/sdk` o la salida estructurada de `@anthropic-ai/sdk` difiere de lo supuesto] → se verifica en los spikes (tareas de los grupos 8 y 9) antes de depender de ella; el contrato canónico aísla el impacto.
- [El detector de fugas da falsos positivos cuando nuestra oferta final coincide con la reserva] → se excluye la cifra decidida y se prueba con fast-check.

## Migration Plan

No hay sistema en producción. Despliegue: el agente corre en un portátil con `pnpm agent` expuesto por túnel, o en la nube si el ring lo exige; con protocolo estructurado se puede correr sin LLM. Rollback: `git checkout <commit champion vN-1> -- config/champion.json` y reiniciar o esperar a la siguiente sesión (recarga). El domingo se activa el flag de congelación antes de las 15:30.

## Open Questions

- Versión y API exactas de `@a2a-js/sdk` y `@modelcontextprotocol/sdk` (servidor y cliente): se confirman en los spikes.
- Modo de salida estructurada de `@anthropic-ai/sdk` en la versión que se instale (nativo o tool forzada): ambos cumplen la spec.
- Herramienta de túnel (cloudflared, ngrok u otra) y si el ring exige TLS o autenticación.
- Paquete concreto de Langfuse/OpenTelemetry para Node 24.
- Credenciales para el evaluador de promptfoo (clave de API o suscripción vía `claude -p`).
