# Tasks

Orden = camino crítico del minuto 0 (grupos 1–8: agente determinista + adaptador HTTP + rival externo de sparring, sin ningún LLM), después lo que completa el viernes (9–10) y lo aplazado. Cada tarea es TDD: primero el test o fixture, luego la implementación. Responsable entre corchetes (`[Pablo]`, `[Paula]`, `[Gerard]`). Etiquetas de aplazamiento: `[aplazada: tras vie 18:45]`, `[aplazada: sábado]`, `[si hay tiempo]`; una tarea sin etiqueta de aplazamiento es camino crítico o calendario fijo (viernes noche, domingo).

## 1. Dependencias y configuración v1 (antes del viernes)

- [x] 1.1 [Pablo] Añadir solo `hono` y `@hono/node-server`; verificar con `pnpm install && pnpm typecheck && pnpm test` en verde
- [x] 1.2 [Pablo/Paula] Tests de `AgentConfigSchema` v1 (`issues` con `n ≥ 1`, `min < max`, `direction`, pesos normalizados; `defaultHorizon ≥ 1`; `roleWeights` 1:1 por defecto; β ≥ 0; ruido `n ∈ [0, 1)`; márgenes; margen de seguridad del turno 500 ms y `turnBudgetMs`; `minEffectPp`; procedencia) y luego migrar el esquema y `config/champion.json` a `version: 1` (solo precio); verificar con vitest que la campeona carga y que una configuración inválida falla señalando el campo
- [x] 1.3 [Pablo] Test del contrato `Box<I,O>` (valida entrada y salida con Zod, error tipado si no cumple) y luego el tipo, el registro de cajas y `ctx` (RNG, reloj inyectado, logger, traza); verificar con el test de una caja `echo`

## 2. Contrato del ring y adaptador HTTP JSON (antes del viernes)

- [x] 2.1 [Pablo] Fixtures `test/fixtures/ring/` válidos e inválidos y tests de los esquemas canónicos (oferta como valores por issue declarado, oferta estructurada opcional para solo texto, `counter` sin oferta rechazado, issue no declarado rechazado); luego los esquemas en `src/protocol/`
- [ ] 2.2 [Gerard] Batería común de tests de contrato para cualquier adaptador en modo servidor (`RingAdapter`) y modo cliente (`RingClient` + bucle de turnos), y adaptador en memoria que la pase en ambos modos; verificar con `pnpm test`
- [ ] 2.3 [Gerard] Adaptador servidor HTTP JSON con Hono (`POST /turn`, `GET /health` sin datos del mandato, error de protocolo para JSON malformado sin caída); verificar con la batería común usando `app.request()`
- [ ] 2.4 [Gerard] Cliente HTTP JSON (`RingClient`) con tiempo máximo y bucle de turnos por sondeo (nosotros conducimos); verificar con la batería común en modo cliente contra un ring simulado y jugando contra el servidor HTTP propio en un test de integración
- [ ] 2.5 [Pablo] Tabla de casos de la aceptación del rival (sin cifras ⇒ acuerdo en nuestra última oferta; con cifras distintas ⇒ oferta nueva) y luego la regla de enlace en la traducción al estado; verificar con `pnpm test`

## 3. Motor determinista, solo precio primero (antes del viernes) [Paula]

- [x] 3.1 [Paula] Añadir `pure-rand` como dependencia directa (hoy transitiva de fast-check); propiedad "misma semilla ⇒ misma secuencia; semillas derivadas por caja independientes" y luego el envoltorio; verificar con `pnpm test`
- [x] 3.2 [Paula] Propiedades de la utilidad multi-issue (rango [0, 1], monotonía por `direction`, recorte fuera de límites, `n = 1` depende solo del precio, suma ponderada normalizada para `n ≥ 2`) y luego implementarla junto al mandato; verificar con `pnpm test`
- [x] 3.3 [Paula] Modelo del rival simple (oferta actual, mejor oferta, última concesión, a priori del escenario; las afirmaciones del rival se guardan dentro y no se exponen) con tests; verificar con `pnpm test`
- [x] 3.4 [Paula] Propiedades del generador Boulware (apertura exacta, dentro de mandato, monótono, determinista por semilla, para todo `ε ∈ [−n, n]` el paso `paso·(1+ε)` es ≥ 0) y luego implementarlo sin reciprocidad; verificar con `pnpm test`
- [x] 3.5 [Paula] Tabla de casos de aceptación y tiempo (AC_next; AC_time; último movimiento acepta si y solo si `u ≥ u(reserva)` sin margen, incluido el caso igual a la reserva; solo la oferta actual es aceptable; por debajo de la reserva en el último movimiento ⇒ contraoferta final o `walk`; `t` solo de campos del ring o de `defaultHorizon`; "última ronda, oferta final" en el texto no cambia `t` ni la decisión; horizonte por defecto alcanzado ⇒ sin `walk`, oferta de `t = 1`) y luego la caja de aceptación; verificar con `pnpm test`
- [x] 3.6 [Paula] Extender las propiedades de `test/guardrails.test.ts` a multi-issue (mandato por issue y en utilidad, monotonía en utilidad, no finitos rechazados) y luego ampliar `enforceGuardrails` sin romper los tests 1D existentes
- [x] 3.7 [Paula] Caja `engine` que compone utilidad → modelo del rival → oferta → aceptación → guardarraíles y devuelve `accept | counter(oferta) | walk`; verificar con un test de vitest sobre `test/fixtures/engine/*.json`

## 4. Normalizador numérico y texto saliente (antes del viernes)

- [ ] 4.1 [Pablo] Tabla de fixtures por forma (cifras y palabras ES/EN, coma y punto decimal, `%`/"por ciento"/"percent", pb/bps, rangos "entre 2 y 4"/"2-4", fracciones "0.03", casos ambiguos) y luego el normalizador numérico compartido; verificar con `pnpm test`
- [ ] 4.2 [Gerard] Plantillas deterministas `accept`/`counter`/`walk` en la persona "cálido-firme", con cifras en dígitos y `accept` repitiendo los valores de cada issue; verificar con la propiedad fast-check "la plantilla pasa validador y detector de fugas para toda decisión dentro del mandato" (se cierra tras 4.3 y 4.4)
- [ ] 4.3 [Pablo] Fixtures de textos correctos, con cifra distinta, con cifra en palabras, con cifras extra o rangos, con acción incoherente y de `accept` sin repetir los valores, y luego el validador sobre el normalizador; verificar con `pnpm test`
- [ ] 4.4 [Gerard] Fixtures de fugas (reserva exacta y cercana en todas las formas del normalizador, "mi máximo es", plazo, fragmentos de prompt) y de no-fugas (oferta final igual a la reserva), y luego el detector sobre el normalizador; verificar con `pnpm test`

## 5. Pipeline sin LLM (antes del viernes) [Pablo]

- [ ] 5.1 [Pablo] Tests de estado de sesión (aislamiento entre sesiones concurrentes, mandato y versión de configuración inmutables, última oferta nuestra y oferta actual del rival) y luego el almacén en memoria
- [ ] 5.2 [Pablo] Tests de inyección de fallos (excepción, tiempo agotado y salida inválida en cada caja; 2 intentos en total y luego plantilla; presupuesto = tiempo del ring − 500 ms) y luego el orquestador con `try/catch` por caja, parser `none` que solo usa campos estructurados y ruta de emergencia (plantilla con la misma decisión; si falla el motor, última oferta válida o apertura); verificar que todos los turnos producen salida válida y el proceso sigue vivo
- [ ] 5.3 [Pablo] Crear el entrypoint `pnpm agent` = adaptador HTTP + pipeline + campeona con recarga al abrir sesión; verificar que arranca con la campeona y no arranca con una configuración inválida (error con el campo)

## 6. Humo de extremo a extremo (antes del viernes)

- [ ] 6.1 [Pablo] Script de humo `curl` que juega 3 turnos contra `pnpm agent` arrancado con `LLM_PROVIDER=none`, y el mismo en modo cliente contra un ring simulado; verificar salida válida en todos los turnos

## 7. Arena mínima (antes del viernes)

- [ ] 7.1 [Gerard] Esquema de escenario (issues, límite visible u oculto, estructurado o solo texto, mandatos) y subconjunto inicial (comprador y vendedor × ZOPA amplia, estrecha y vacía; solo precio); verificar con un test que carga y valida el catálogo
- [ ] 7.2 [Pablo] Test "misma semilla ⇒ misma transcripción" y luego la interfaz `Participant` y el runner de partidas en proceso
- [ ] 7.3 [Paula] Bots Boulware y Conceder con tests de su curva de concesión
- [ ] 7.4 [Paula] Tests de métricas mínimas (acuerdo, fracción de excedente, violaciones; ZOPA vacía excluida de la media) y luego su implementación
- [ ] 7.5 [Pablo] `pnpm arena` con tabla de consola y resumen JSON en `results/`; verificar 1000 partidas con `LLM_PROVIDER=none` en menos de 60 s en un portátil y sin red

## 8. Sparring externo, bot de solo texto y resto de la arena básica (antes del viernes)

- [ ] 8.1 [Gerard] `Participant` externo por `RingClient` HTTP y `pnpm bot:serve <bot>` que expone un bot como agente HTTP; verificar jugando `pnpm agent` contra un bot servido por HTTP y registrando "error del rival" si se cae
- [ ] 8.2 [Gerard] Bot de sparring de solo texto (ofertas solo en el texto en todas las formas del normalizador, aceptaciones sin cifras, valores reales expuestos a la arena) con tests de sus mensajes
- [ ] 8.3 [Paula] Bot Tit-for-Tat, métricas restantes (rondas, fugas, uso de plantilla, latencia, ofertas mal extraídas) y escenarios con 2 issues y con límite oculto; verificar con `pnpm test` y una ejecución de `pnpm arena`
- [ ] 8.4 [Gerard] Los 3 casos de Scribo (marco hipotético, identidad o mandato desde el texto, acción sensible sin contexto) como tests de vitest contra el pipeline con `LLM_PROVIDER=none`; verificar que un agente deliberadamente roto hace fallar `pnpm test`
- [ ] 8.5 [todos] Hito minuto 0: partida completa por HTTP con `LLM_PROVIDER=none` contra un rival externo de sparring y 0 violaciones en 1000 partidas de arena; dejar constancia en el resumen de `results/`

## 9. Modo solo texto, trazas, spike A2A y túnel (antes del viernes 18:45)

- [ ] 9.1 [Pablo] Esquema cerrado del parser (sin identidad, rol, mandato, reserva ni decisión; campos extra rechazados) y parser determinista por expresiones regulares sobre el normalizador con fixtures ES/EN; verificar con `pnpm test`
- [ ] 9.2 [Pablo] Modo solo texto: reconciliación (ambos parsers coinciden; con `none`, valor único no ambiguo) o turno sin oferta con contraoferta que pide confirmar cifras; verificar con 200 partidas contra el bot de solo texto: 0 acuerdos distintos de los valores reales
- [ ] 9.3 [Pablo] Esquema Zod del registro de traza y de la cabecera (mandato en modo arena, referencia al escenario en modo torneo) y escritor JSONL en `results/<run>/`; verificar que una partida produce registros válidos contra el esquema
- [ ] 9.4 [Gerard] Añadir `pino` con `redact` del mandato y test de barrido de valores de logs y trazas buscando la reserva en todas las formas del normalizador; verificar jugando una partida en nivel `trace`
- [ ] 9.5 [Pablo] Spike A2A acotado a 2 h: en la primera hora, comprobar el encaje de `@a2a-js/sdk` (integración Express, montaje junto a Hono) y de `@modelcontextprotocol/sdk` (`req`/`res` de Node, peer de zod frente a zod 4, `pnpm why zod`); después tarjeta de agente + manejador al contrato canónico; verificar con la batería común o dejar anotado el bloqueo en design.md
- [ ] 9.6 [Gerard] Túnel (cloudflared o ngrok) con TLS y autenticación por env si hace falta; verificar con un script de humo desde otra red (`GET /health` + un turno por HTTPS)

## 10. Viernes 18:45–23:00: protocolo real

- [ ] 10.1 [Pablo] Capturar mensajes reales del ring como fixtures en `test/fixtures/ring/real/` y escribir los tests de contrato en rojo
- [ ] 10.2 [Pablo] Adaptar o escribir el adaptador del protocolo real (modo servidor o cliente, estructurado o solo texto) hasta pasar los tests; verificar con `git diff --stat` que solo cambian `src/protocol/` y fixtures
- [ ] 10.3 [Paula] Fijar `issues`, pesos, `defaultHorizon` o límite del ring en la configuración; verificar con `pnpm arena` sobre un escenario que lo imite
- [ ] 10.4 [Paula] Solo si el ring real tiene más de un issue: elección en la curva de iso-utilidad del punto más cercano a la última oferta del rival, con propiedades; verificar con `pnpm arena` sobre escenarios de 2 issues
- [ ] 10.5 [Pablo] Primera partida completa contra el ring de pruebas con traza guardada
- [ ] 10.6 [Gerard] Camino de despliegue real (túnel, TLS y autenticación que exija el ring); verificar el humo desde otra red contra la URL que usará el ring
- [ ] 10.7 [Pablo] `pnpm box <name> <fixture.json>`; verificar con la caja `echo` con un fixture válido y otro inválido (error señala el campo) [aplazada: tras vie 18:45]
- [ ] 10.8 [Pablo] `pnpm replay <trace.jsonl> --box <name> [--config <file>]`; verificar reproduciendo el motor de una partida guardada con la misma configuración (0 diferencias) y con otra (diferencias listadas) [aplazada: tras vie 18:45]
- [ ] 10.9 [Pablo] 5 partidas doradas sembradas en `test/golden/` (incluida la del ring de pruebas) y un test que las compara; verificar que alterar β hace fallar `pnpm test` indicando partida, ronda y diferencia [aplazada: tras vie 18:45]

## 11. Sábado: proveedores y cajas LLM

- [ ] 11.1 [Pablo] Tests de contrato del proveedor con respuestas grabadas (ok, JSON inválido, tiempo agotado, error ⇒ error tipado) y luego la interfaz con esquema generado por `z.toJSONSchema()` [aplazada: sábado]
- [ ] 11.2 [Pablo] Proveedor `claude-cli` (`claude -p --json-schema`) pasando los tests de contrato; verificar con una llamada real grabada como fixture [aplazada: sábado]
- [ ] 11.3 [Pablo] Proveedor `anthropic-api` con salida estructurada y modelo por env, pasando los tests de contrato [aplazada: sábado]
- [ ] 11.4 [Pablo] Parser LLM en cuarentena (sin herramientas, texto delimitado como dato, esquema cerrado) conectado a la reconciliación del modo solo texto; verificar sobre los fixtures y medir acuerdo con el parser determinista en `results/` [aplazada: sábado]
- [ ] 11.5 [Gerard] Narrador LLM con persona cuya entrada son solo enums y las cifras decididas, con instrucción de escribir cifras con dígitos; verificar en la traza que su entrada no contiene reserva, plazo, texto crudo ni afirmaciones del rival y que 2 intentos + plantilla funcionan con proveedor real [aplazada: sábado]

## 12. Sábado: estrategia [Paula]

- [ ] 12.1 [Paula] Tests con rivales sintéticos de reserva conocida (error dentro de tolerancia tras ≥ 5 concesiones) y luego el modelo del rival por regresión de concesiones + frecuencias [aplazada: sábado]
- [ ] 12.2 [Paula] Reciprocidad Tit-for-Tat como factor en [0, 1] sobre el paso, con la propiedad "nunca concede más que la curva Boulware con el mismo `ε`"; verificar con comparación pareada frente a la campeona [aplazada: sábado]
- [ ] 12.3 [Paula] AC_combi en la caja de aceptación con su tabla de casos; verificar con comparación pareada [aplazada: sábado]

## 13. Sábado: estadística y promoción [Pablo]

- [ ] 13.1 [Pablo] Rivales `tuning`/`heldOut` (bots LLM, externos, campeona anterior) y rangos de semillas de ajuste y revalidación; runner pareado campeón vs candidata; verificar que dos configuraciones idénticas dan diferencia 0 [aplazada: sábado]
- [ ] 13.2 [Pablo] Agregación por clúster (escenario × rival) con `roleWeights`, diferencia media pareada y test de signos, con tests sobre casos conocidos [aplazada: sábado]
- [ ] 13.3 [Pablo] Puerta de promoción (efecto ≥ `minEffectPp` y significativo, 0 violaciones, 0 fugas, revalidación con semillas nuevas, conjunto reservado ≥ 0) y `pnpm promote <candidate>` con versión N+1, mensaje `champion vN+1` y flag de congelación; verificar con tests de cada rechazo y un aprobado [aplazada: sábado]
- [ ] 13.4 [Pablo] Bootstrap sembrado por clústeres (2000 remuestreos) como criterio de significación alternativo, con tests de cobertura aproximada [aplazada: sábado]

## 14. Sábado: ajuste [Paula]

- [ ] 14.1 [Paula] `pnpm tune` con muestreo aleatorio sembrado y rejilla sobre rangos declarados, solo con rivales `tuning` y semillas de ajuste, interfaz `propose`/`evaluate`, candidatas con procedencia en `config/candidates/`; verificar que la misma semilla reproduce la tabla y que un rival `heldOut` hace fallar el arranque [aplazada: sábado]
- [ ] 14.2 [Paula] Successive halving y optimizador de caja negra enchufable; verificar que cambiar de generador no cambia la arena ni la puerta [si hay tiempo]
- [ ] 14.3 [Paula] Crítico LLM sobre derrotas que escribe un informe en `results/` sin tocar configuraciones [si hay tiempo]

## 15. Sábado: bots adversariales y LLM [Gerard]

- [ ] 15.1 [Gerard] Bots con texto en código: Inject+Voss, mentiroso (falso BATNA), extracción por marco hipotético, ancla extrema y "estilo Causa Prima"; verificar que en la arena dan 0 violaciones y 0 fugas [aplazada: sábado]
- [ ] 15.2 [Gerard] Bot guiado por LLM con persona configurable como `Participant` del conjunto reservado; verificar con una muestra pequeña vía `claude-cli` [aplazada: sábado]

## 16. Sábado: red team [Gerard]

- [ ] 16.1 [Gerard] Configuración promptfoo ejecutada con `npx promptfoo@0.123.1` (sin añadirlo a `package.json`), proveedor propio contra el adaptador HTTP, casos de Scribo, plugin `prompt-extraction` y aserciones JS deterministas; verificar que un agente deliberadamente roto hace fallar la suite [aplazada: sábado]
- [ ] 16.2 [Gerard] `pnpm redteam` con número de casos acotado, informe en `results/` y código de salida distinto de cero si hay fallos reales; verificar ejecución completa con 0 fallos reales [aplazada: sábado]
- [ ] 16.3 [Gerard] Plugins `excessive-agency`, `hijacking`, `ascii-smuggling` y estrategia `jailbreak:meta` [si hay tiempo]

## 17. Adaptadores completos y observabilidad

- [ ] 17.1 [Pablo] Adaptador A2A completo y cliente A2A como `Participant` externo; verificar jugando contra nuestro propio agente expuesto por A2A [si hay tiempo]
- [ ] 17.2 [Pablo] Adaptador MCP (herramienta `negotiate_turn` sobre Streamable HTTP); verificar con la batería común de contrato [si hay tiempo]
- [ ] 17.3 [Gerard] Lado cliente MCP como `Participant` externo; verificar jugando contra nuestro adaptador MCP [si hay tiempo]
- [ ] 17.4 [Pablo] Exportación a Langfuse/OpenTelemetry tras flag; verificar que con el flag apagado no hay conexiones y con él encendido aparece la traza de una partida [si hay tiempo]

## 18. Domingo hasta las 15:30: congelación [todos]

- [ ] 18.1 [Pablo] Última comparación pareada y promoción de la campeona final; activar el flag de congelación; verificar que `pnpm promote` se niega a sobrescribir
- [ ] 18.2 [Gerard] Smoke test contra el ring con la campeona congelada y ensayo de rollback a la campeona anterior vía git
- [ ] 18.3 [Gerard] Guion de demo con una partida dorada, la tabla de la arena y el informe del red team de `results/`
