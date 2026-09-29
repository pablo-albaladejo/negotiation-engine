# Design: add-agent-architecture

## Context

Ver proposal.md (Why) y las specs de cada capacidad para los requisitos. Estado de partida: TS 7, Node 24, pnpm, zod 4, vitest 5, fast-check 4 y tsx instalados; `AgentConfigSchema` (escalar), `enforceGuardrails` 1D con propiedades fast-check, `LlmProviderSchema` (`none` | `claude-cli` | `anthropic-api`) y entrypoints vacíos. `pure-rand` es una dependencia transitiva de fast-check: se añade como dependencia directa.

Restricciones: solo portátiles y sin infraestructura; protocolo del ring desconocido hasta el viernes 18:45 (probablemente de estilo A2A: Causa Prima habla de "A2A peers", "agent card"), y puede ser solo texto, sin límite de rondas conocido y con el ring como servidor o como cliente; el escenario probable es el de Causa Prima (pronto pago con descuento `pct` y día de pago, límite de rondas, parada por ruptura de protocolo); ranking = fracción capturada del excedente de la ZOPA, sin acuerdo = 0 para ambos; rivales de cualquier modelo. Reglas del equipo: la cifra es código, el texto del rival es dato, nunca revelar ni loguear la reserva, toda salida validada por esquema, aleatorización obligatoria.

## Goals / Non-Goals

**Goals:**
- Esqueleto andante determinista jugando por HTTP antes de introducir LLM (camino crítico del minuto 0 en tasks.md, grupos 1–8).
- Arquitectura hexagonal: un cerebro puro (estado → decisión) rodeado de adaptadores y cajas LLM sustituibles, cada una con contrato Zod, fixtures y ejecución aislada.
- Todo reproducible: semillas explícitas, trazas por caja, replay y transcripciones doradas.

**Non-Goals:**
- Nada de NegMAS/Python ni Optuna en el runtime: NegMAS queda para prototipar curvas offline (Paula) y sus resultados entran como parámetros de configuración.
- Sin base de datos, colas ni servicios gestionados; el estado de sesión vive en memoria y las trazas en ficheros.
- Sin interfaz web; la tabla de la arena es de consola y el resumen es JSON.
- Sin soporte multi-modelo más allá de Claude en esta change (ver decisión 4).

## Decisions

### 1. Cerebro puro + cajas con contrato (hexagonal)
Cada caja es `Box<I, O> = { name, input: ZodType<I>, output: ZodType<O>, run(input, ctx) }`, con `ctx` que aporta RNG sembrado, reloj inyectado, logger y escritor de traza. Hasta el viernes 18:45 cada caja se ejecuta aislada con tests de vitest; el registro de cajas alimenta después `pnpm box <name> <fixture.json>` y `pnpm replay`. El pipeline es la composición de cajas, envuelve cada una en `try/catch` y es el único que conoce el orden del turno. **Alternativas:** clases con inyección de dependencias (más ceremonia, sin ventaja en 48 h); un framework de agentes (LangGraph, Mastra): esconden el flujo que precisamente queremos controlar y trazar.

### 2. Servidor HTTP: Hono
Hono (`hono` + `@hono/node-server`) sobre Request/Response estándar: arranca en Node en el portátil y se puede mover a la nube sin cambios; `app.request()` permite tests de contrato sin abrir puertos, y encaja con validación Zod. Son las únicas dependencias del minuto 0. `@a2a-js/sdk` trae integración con Express, no con Hono: si el spike lo confirma, el adaptador A2A se monta como app Express propia (otro puerto o montada vía el servidor HTTP de Node) sin tocar el adaptador Hono. **Rechazado:** Fastify (su validación es JSON Schema/ajv y duplicaría Zod; el rendimiento no es el cuello de botella); Express como base (API antigua, sin tipos de primera clase).

### 3. Protocolos: un contrato canónico, dos modos, tres adaptadores
`RingAdapter` (modo servidor: el ring nos llama) y `RingClient` + bucle de turnos (modo cliente: nosotros conducimos el bucle por sondeo, websocket o como cliente del ring) traducen al contrato canónico de ring-protocol y alimentan el mismo pipeline. HTTP JSON es la base del día 0, en ambos modos. A2A con `@a2a-js/sdk` (tarjeta de agente + manejador; cliente A2A para sparring) y MCP con `@modelcontextprotocol/sdk` (herramienta `negotiate_turn` sobre Streamable HTTP, y su lado cliente) son adaptadores completos solo si el ring los usa o si sobra tiempo; antes del viernes hay un spike A2A acotado a 2 h. Una batería de tests de contrato común se ejecuta contra todos los adaptadores y en ambos modos. El viernes solo se toca `src/protocol/` (comprobable con `git diff --stat`). La aceptación del rival se enlaza siempre a nuestra última oferta; con cifras distintas es una oferta nueva.

### 4. LLM: `@anthropic-ai/sdk` en torneo, `claude -p --json-schema` en desarrollo
Zod 4 es la única fuente de verdad: `z.toJSONSchema()` genera el esquema que se pasa al proveedor y la respuesta se revalida con el mismo esquema Zod. `claude-cli` usa la suscripción (gratis para muestras pequeñas); `anthropic-api` usa salida estructurada (tool con `input_schema` forzado mediante `tool_choice`, o el modo nativo si está disponible en la versión instalada). Modelo configurable por env. Cada caja con LLM tiene 2 intentos en total por turno y después plantilla. **Rechazado:** Vercel AI SDK (añade una capa sobre dos proveedores que ya controlamos; se reconsidera si el torneo impone otro modelo); LangChain (pesado, sin valor aquí).

### 5. Frontera de seguridad: dual-LLM + CaMeL ligero
Patrón dual-LLM (Willison, 2023) y CaMeL (DeepMind, 2025): el parser en cuarentena ve el texto hostil pero no tiene herramientas ni secretos y solo emite datos tipados con esquema cerrado (`.strict()`, sin campos de identidad ni mandato). Las afirmaciones del rival y cualquier cadena libre del parser se quedan en el modelo del rival; el narrador recibe solo enums (acción, intención, identificadores de táctica, persona) y las cifras decididas, escribe cifras con dígitos, y aunque lo secuestren no tiene nada que filtrar ni puede cambiar la cifra (el validador la comprueba). El control de flujo (aceptar, cerrar) es código. El detector de fugas es defensa en profundidad.
- **Ring estructurado**: la oferta del rival viene del campo estructurado; el texto solo va al parser.
- **Ring de solo texto**: la oferta del rival solo se registra si el parser determinista (regex + normalizador) y el parser LLM coinciden en cada issue; con `LLM_PROVIDER=none`, si el determinista da un único valor no ambiguo por issue. Si no, turno sin oferta y contraoferta pidiendo confirmar cifras. Nuestros mensajes de aceptación repiten los valores exactos, para que un malentendido no se convierta en acuerdo.
Esto responde a los 3 fallos de Scribo: extracción hipotética (el narrador no conoce la reserva), campo de identidad fijado por el LLM (esquema cerrado), acción sensible sin contexto (solo el motor acepta y solo sobre la oferta actual registrada).

### 6. Normalizador numérico compartido
Un único módulo convierte texto en lecturas numéricas: cifras y palabras en ES/EN, coma o punto decimal, `%`/"por ciento"/"percent", puntos básicos (100 pb = 1 %), rangos ("entre 2 y 4") y fracciones ("0.03", ambigua con 0,03 %). Lo usan el parser determinista (conservador: rango o ambigüedad ⇒ sin oferta), el validador (cualquier cifra no decidida ⇒ rechazo) y el detector de fugas (todas las lecturas de una cifra ambigua). Una tabla de fixtures por forma es su contrato.

### 7. Motor: estado del arte clásico, simple primero
- **Issues y utilidad**: `issues: {name, min, max, direction, weight}[]`; solo precio es `n = 1`. Utilidad aditiva ponderada y normalizada con límites explícitos por issue (`u = Σ wᵢ · normᵢ`). La TAE implícita del pronto pago no es la utilidad: solo puede usarse offline para elegir pesos y límites.
- **Ofertas**: tácticas dependientes del tiempo Boulware/Conceder (Faratin, Sierra & Jennings, 1998) con β de la configuración. El ruido sembrado se aplica al paso, `paso · (1 + ε)` con `ε ∈ [−n, n]` y paso ≥ 0, para no revelar la reserva por la secuencia de concesiones sin romper la monotonía. Tit-for-Tat multiplica el paso por un factor en [0, 1]: solo puede reducir la concesión frente a la curva, nunca superarla. Con n > 1 se elige en la curva de iso-utilidad el punto más cercano a la última oferta del rival.
- **Tiempo**: `t` sale solo de campos del ring o de `defaultHorizon`; nunca del parser. Con horizonte por defecto alcanzado no hay retirada: se mantiene la oferta de `t = 1`.
- **Aceptación**: AC_next, AC_time y AC_combi (Baarslag et al.) sobre la oferta actual del rival (nunca una anterior). En nuestro último movimiento posible: aceptar si y solo si `u ≥ u(reserva)`, sin margen, porque no acordar vale 0 para ambos; si no, contraoferta final o `walk` si el ring ya no admite respuesta.
- **Modelo del rival**: primero simple (mejor oferta del rival, última concesión, a priori del escenario); el sábado regresión de su curva de concesión + frecuencias para los pesos; el modelo bayesiano (Hindriks & Tykhonov, 2008) solo si la arena lo justifica.
- **Referencias LLM**: OG-Narrator (2024) valida la separación generador de ofertas + narrador; NegotiationArena (Bianchi et al., 2024), AgenticPay y Magentic Marketplace (Microsoft, 2025) aportan escenarios y comportamientos de rivales que se copian como bots, no como código.

### 8. RNG sembrable: `pure-rand`
Generadores puros (xoroshiro128+) de dubzzz; hoy es dependencia transitiva de fast-check y se añade como dependencia directa. Cada partida deriva semillas independientes por caja (motor, bot, bootstrap) a partir de la semilla de partida. **Rechazado:** `seedrandom` (API mutable y global), `Math.random` (no reproducible).

### 9. Trazas y logs: JSONL propio + pino
Escritor JSONL propio (~50 líneas) con esquema Zod del registro; un fichero por partida en `results/<run>/`. La cabecera lleva el mandato solo en modo arena; en modo torneo lleva una referencia al escenario (id + hash). Logs con `pino`; su `redact` es por rutas, así que un test recorre los valores de logs y trazas buscando la reserva en todas las formas del normalizador. Langfuse/OpenTelemetry detrás de flag, apagado por defecto y solo si hay tiempo. **Rechazado:** usar Langfuse como almacén de trazas para replay (dependencia de red y de cuenta; el replay tiene que funcionar offline).

### 10. Arena y estadística propias
Arena en proceso (~200 líneas): `Participant` común para nuestro agente, bots en código, bots LLM y rivales externos (estos vía `RingClient`). Objetivo: 1000 partidas en menos de 60 s en un portátil con `LLM_PROVIDER=none`. Rivales `tuning` y `heldOut` (bots LLM, agentes externos, campeona anterior; nunca en ajuste) y semillas de ajuste y de revalidación separadas. Estadística por clúster (escenario × rival), porque las partidas del mismo clúster no son independientes, con roles ponderados por `roleWeights` (por defecto 1:1). Fase 1 (viernes/sábado): diferencia media pareada + test de signos sobre clústeres. Fase 2 (sábado): bootstrap sembrado que remuestrea clústeres (2000 remuestreos). Puerta: efecto ≥ `minEffectPp` (+1 pp por defecto) y significativo, 0 violaciones, 0 fugas, repetición con semillas de revalidación y no empeorar en el conjunto reservado. **Rechazado:** `simple-statistics` (cabe en 40 líneas testeables); tests paramétricos (el excedente no es normal y está acotado); bootstrap por partida (infla la confianza).

### 11. Ajuste: muestreo aleatorio + rejilla, optimizador enchufable
Interfaz `propose(history) → Config[]` y `evaluate(config) → PairedReport`. Muestreo aleatorio sembrado y rejilla (β, apertura, márgenes, ruido, pesos, umbral de tiempo) solo contra rivales `tuning`; la ganadora se revalida con semillas nuevas y el conjunto reservado antes de promover. Successive halving, optimizador de caja negra y crítico LLM, si hay tiempo.

### 12. Red team: promptfoo 0.123.1 por `npx`
Se ejecuta con `npx promptfoo@0.123.1`, sin añadirlo a `package.json`. Versión ya usada contra Scribo (`prompt-injection` y `jailbreak*` son estrategias, `indirect-prompt-injection` necesita `indirectInjectionVar`, `jailbreak-templates` requiere login en Promptfoo Cloud). Proveedor propio contra nuestro adaptador HTTP; aserciones JS deterministas además del evaluador (contra Scribo, 15 de 18 "fallos" eran falsos positivos). Los 3 casos de Scribo existen además como tests de vitest en cada `pnpm test`.

### 13. Configuración v1 y recarga
`AgentConfigSchema` v1 añade `issues`, `defaultHorizon`, `roleWeights`, β, apertura, margen de aceptación, amplitud de ruido `n`, umbral AC_time, margen de seguridad del turno (500 ms), `turnBudgetMs`, `minEffectPp` y metadatos de procedencia; `champion.json` pasa a `version: 1`. El agente relee la campeona al abrir cada sesión (comprobando mtime), nunca a mitad de sesión.

### 14. Decisiones de implementación (reflejadas tras el lote 2)
- **Mandato**: sale de `config/scenario.json`, sustituible con `AGENT_SCENARIO` (`src/agent/index.ts:13`), nunca del mensaje del turno. Cómo lo entrega el torneo es una pregunta abierta para 10.x.
- **Dirección de los issues**: `direction` se declara desde el comprador y se invierte para el vendedor (`orientIssues`, `src/engine/issues.ts:22-29`); todo el motor trabaja con issues ya orientados a nuestro rol.
- **Último movimiento**: el motor lo detecta con `round >= roundLimit` (`src/engine/acceptance.ts:29`). El pipeline pasa siempre `rivalCanRespond: false` (`src/pipeline/pipeline.ts:108`), así que sin oferta aceptable en el último movimiento el motor devuelve `walk` (`src/engine/acceptance.ts:72`) en vez de una contraoferta final. Consecuencia medida en la arena: 0 % de acuerdo contra Boulware y Tit-for-Tat con ZOPA estrecha (el rival aún respondería). Falta un campo canónico "el ring admite respuesta" (ring-protocol, tarea 10.10).
- **Redondeo**: `OFFER_DECIMALS = 2` (`src/engine/issues.ts:18`); `roundInFavor` (`src/engine/issues.ts:73`) avanza un paso a nuestro favor si tras redondear el valor sigue en nuestra contra, y `withinOfferMandate` es estricto, sin tolerancia (`src/engine/issues.ts:88`). Por eso la apertura queda a menos de un paso de redondeo de la utilidad de apertura y nunca peor para nosotros, no "exactamente" en ella; y en `t = 1` la utilidad objetivo es `u(reserva)` (`src/engine/offer.ts:47`) redondeada a nuestro favor, que coincide con la reserva por issue solo con un issue y una reserva que ya tiene 2 decimales.
- **Aceptación en solo texto**: solo `rivalAction === "accept"` del ring cierra un acuerdo (regla de enlace, `src/pipeline/binding.ts:21-27`); la intención del parser solo llega al narrador como `rivalIntent` (`src/pipeline/pipeline.ts:294`) y nunca controla el flujo. Si un ring de solo texto no trae la acción, su adaptador tendrá que traducirla (tarea 10.11).
- **Valores de la campeona v1, pendientes de revisión de Paula**: `noise = 0.1` (amplitud del ruido sobre el paso de concesión, `src/engine/offer.ts:40-50`; sustituye al antiguo 0,01 sobre la oferta), `acTimeThreshold = 0.9` y `turnBudgetMs = 4500` (`config/champion.json`).
- **Retirada del rival**: si el rival se retira, el motor responde `walk` (`src/engine/engine.ts:90`).
- **Tolerancia de fugas**: por defecto el 2 % del rango del issue alrededor de la reserva (`src/llm/leak.ts:6,43`).
- **Rutas del modo cliente**: `GET /next`, `POST /respond` y `POST /error` solo existen en el ring simulado (`src/protocol/sim-ring.ts`) y son provisionales hasta conocer el protocolo real.
- **Autenticación**: en modo servidor el agente no arranca sin `AGENT_AUTH_TOKEN` salvo con `AGENT_ALLOW_NOAUTH=1` (`src/agent/agent.ts:107-113`), solo para pruebas en local.
- **Ruta de emergencia**: `fallbackOutput` respeta una sesión ya cerrada: `accept` con el acuerdo registrado y `walk` tras la retirada del rival (`src/pipeline/pipeline.ts:359-376`).
- **Referencia al escenario en las trazas de torneo**: nombre del fichero + los primeros 16 hex del SHA-256 de su contenido (`src/agent/agent.ts:75`, `src/arena/scenario.ts:105-107`). Con pocas reservas posibles el hash se puede invertir por fuerza bruta: antes de compartir trazas fuera del equipo hace falta un HMAC con clave (turn-pipeline).
- **Brecha conocida (aceptación por debajo de la reserva)**: solo la regla de último movimiento y horizonte por defecto exige `u ≥ u(reserva)` (`src/engine/acceptance.ts:81`). `ac-next` (`src/engine/acceptance.ts:85`) acepta una oferta dentro de los límites por issue si `u ≥ ourNextUtility − acceptMargin`; con 2 o más issues eso puede quedar hasta 0,02 por debajo de `u(reserva)`. Con la campeona v1 (un solo issue) no puede ocurrir. negotiation-engine lo exige ya como requisito; la corrección con propiedad es la tarea 3.8, sin hacer.
- **Límite oculto corto**: con un límite oculto de 6 rondas la arena da 0 % de acuerdo porque `defaultHorizon = 10` (escenario `price-buyer-hidden-short`); ver tarea 10.12.

## Risks / Trade-offs

- [El protocolo real no encaja en el contrato canónico (streaming, multi-mensaje por turno, solo texto, ring como servidor)] → contrato interno ampliable; modos servidor y cliente; modo solo texto con bot de sparring; fixtures reales capturados antes de escribir código el viernes.
- [Encaje de SDKs] `@a2a-js/sdk` trae integración Express, no Hono; los transportes de `@modelcontextprotocol/sdk` usan `req`/`res` de Node y pueden declarar un peer de zod incompatible con zod 4 → comprobación en la primera hora del spike (instalar, `pnpm why zod`, turno de prueba); mitigación: montar vía Express o el servidor HTTP de Node, y aislar el SDK MCP en su adaptador si hay conflicto de zod.
- [Extracción errónea de cifras en ring de solo texto] → doble parser con acuerdo obligatorio, normalizador conservador, aceptación que repite cifras, métrica de ofertas mal extraídas contra el bot de solo texto.
- [El narrador con LLM supera el tiempo del ring] → presupuesto = tiempo del ring − 500 ms y plantilla; se puede competir con `LLM_PROVIDER=none`.
- [Sobreajuste a nuestros bots en código] → rivales reservados, revalidación con semillas nuevas, efecto mínimo y estadística por clústeres.
- [El detector de fugas da falsos positivos cuando nuestra oferta final coincide con la reserva] → se excluye la cifra decidida y se prueba con fast-check.

## Migration Plan

No hay sistema en producción. Despliegue: el agente corre en un portátil con `pnpm agent` expuesto por túnel (cloudflared o ngrok) con TLS, con humo desde otra red antes del viernes 18:45; con protocolo estructurado se puede correr sin LLM. Rollback: `git checkout <commit champion vN-1> -- config/champion.json` y esperar a la siguiente sesión (recarga). El domingo se activa el flag de congelación antes de las 15:30.

## Open Questions

**Resueltas:**
- Peso del rol comprador en la puerta: 1:1 por defecto, configurable con `roleWeights` hasta conocer la puntuación oficial.
- Mandato en la cabecera de la traza: solo en modo arena; en torneo, referencia al escenario.
- Reintentos: 2 intentos en total por caja con LLM, luego plantilla.
- Orden de trabajo: tasks.md sigue el camino crítico del minuto 0; lo aplazado se etiqueta, no se borra.
- Spike A2A (9.5): `@a2a-js/sdk` 1.3.0 implementa A2A v1.0 y no necesita Express: `JsonRpcTransportHandler` + `DefaultRequestHandler` + `InMemoryTaskStore` se montan en Hono (`POST /a2a`, `GET /.well-known/agent-card.json`, `src/protocol/a2a.ts`) y pasan la batería común con el turno canónico en una parte `data`. Sin dependencia de zod (solo `jose`; `express` y los drivers de BD son peers opcionales). `@modelcontextprotocol/sdk` 1.31.0 declara `zod ^3.25 || ^4.0`: compatible con zod 4; su transporte Streamable HTTP con `req`/`res` de Node queda sin probar.

**Abiertas (con respuesta por defecto):**
- Modo solo texto con `LLM_PROVIDER=none`: por defecto basta el parser determinista si da un único valor no ambiguo por issue.
- Valor de `defaultHorizon` y de `minEffectPp`: por defecto 10 rondas y +1 pp; se revisan con el protocolo real.
- API exacta de `@modelcontextprotocol/sdk` (montaje del transporte junto a Hono): se confirma si el ring usa MCP (17.2).
- Modo de salida estructurada de `@anthropic-ai/sdk` (nativo o tool forzada): ambos cumplen la spec.
- Si el ring exige TLS propio o autenticación concreta, y credenciales del evaluador de promptfoo.
- Cómo entrega el torneo el mandato de cada sesión (hoy `config/scenario.json` o `AGENT_SCENARIO`): se decide con el protocolo real (10.x).
- Si el ring admite respuesta del rival tras nuestro último movimiento: por defecto se supone que no (`walk` en vez de contraoferta final); tarea 10.10.
- Cómo comunica un ring de solo texto la aceptación del rival si no trae acción estructurada: por defecto, solo la acción del ring cierra un acuerdo; tarea 10.11.
- `defaultHorizon` y β con límite de rondas oculto y corto (0 % de acuerdo con 6 rondas y `defaultHorizon = 10`): por defecto se mantienen hasta conocer si el ring comunica el límite; tarea 10.12.
