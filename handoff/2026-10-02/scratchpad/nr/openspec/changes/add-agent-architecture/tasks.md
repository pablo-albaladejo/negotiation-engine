# Tasks

Orden = calendario (antes del viernes → viernes 18:45 → sábado → domingo 15:30). Cada tarea es TDD: primero el test o fixture, luego la implementación. Etiqueta de responsable entre corchetes. Los grupos 1–7 hacen verdad "competir desde el minuto 0": agente determinista + adaptador HTTP + un rival externo de sparring, sin ningún LLM.

## 1. Fundaciones (antes del viernes) [Pablo]

- [ ] 1.1 Añadir dependencias `hono`, `@hono/node-server`, `pino`, `pure-rand` (directa) y scripts `box`, `replay`, `tune`, `promote`, `redteam` en package.json; verificar con `pnpm install && pnpm typecheck && pnpm test` en verde
- [ ] 1.2 Test del contrato `Box<I,O>` (valida entrada y salida con Zod, error tipado si no cumple) y luego implementar el tipo, el registro de cajas y `ctx` (RNG, reloj inyectado, logger, traza); verificar con el test de una caja `echo`
- [ ] 1.3 Implementar `pnpm box <name> <fixture.json>`; verificar ejecutando la caja `echo` con un fixture válido y otro inválido (error señala el campo)
- [ ] 1.4 Propiedad fast-check "misma semilla ⇒ misma secuencia; semillas derivadas por caja independientes" y luego el envoltorio de `pure-rand`; verificar con `pnpm test`
- [ ] 1.5 [Pablo/Paula] Tests de `AgentConfigSchema` v1 (modo de ejes, pesos, umbral AC_time, márgenes, tiempos, procedencia; β negativo rechazado) y luego migrar el esquema y `config/champion.json` a `version: 1`; verificar que `pnpm agent` arranca con la campeona y falla con una configuración inválida

## 2. Contrato del ring y adaptador HTTP JSON (antes del viernes) [Pablo]

- [ ] 2.1 Fixtures `test/fixtures/ring/` válidos e inválidos y tests de los esquemas canónicos de entrada y salida (incl. `counter` sin oferta rechazado); luego implementar los esquemas en `src/protocol/`
- [ ] 2.2 Batería común de tests de contrato para cualquier `RingAdapter`/`RingClient` y adaptador en memoria que la pase; verificar con `pnpm test`
- [ ] 2.3 Adaptador servidor HTTP JSON con Hono (`POST /turn`, `GET /health` sin datos del mandato, error de protocolo para JSON malformado sin caída); verificar con la batería común usando `app.request()`
- [ ] 2.4 Cliente HTTP JSON (`RingClient`) con tiempo máximo; verificar jugando contra el servidor HTTP propio en un test de integración

## 3. Motor determinista mínimo (antes del viernes) [Paula]

- [ ] 3.1 Propiedades de la utilidad 2D (rango [0,1], monotonía por eje según rol, modo solo precio ignora el día, TAE implícita en pronto pago) y luego implementarla junto al mandato 2D; verificar con `pnpm test`
- [ ] 3.2 Extender las propiedades actuales de `test/guardrails.test.ts` a 2D (mandato por eje y sobre la utilidad, monotonía en utilidad, no finitos rechazados) y luego ampliar `enforceGuardrails` sin romper los tests 1D existentes
- [ ] 3.3 Propiedades del generador Boulware (apertura = margen configurado ± ruido, dentro de mandato, monótono, determinista por semilla) y luego implementarlo sin reciprocidad ni modelo del rival; verificar con `pnpm test`
- [ ] 3.4 Tabla de casos de aceptación (AC_next, AC_time, última ronda fuera de mandato ⇒ `walk` o contraoferta final, nunca `accept`) y luego implementar la caja de aceptación; verificar con `pnpm test`
- [ ] 3.5 Caja `engine` que compone utilidad → oferta → aceptación → guardarraíles y devuelve `accept | counter(pct, day) | walk`; verificar con `pnpm box engine test/fixtures/engine/*.json`

## 4. Frontera LLM determinista (antes del viernes) [Pablo/Gerard]

- [ ] 4.1 Esquema cerrado del parser (sin campos de identidad, rol, mandato, reserva ni decisión; campos extra rechazados) con fixtures de texto en español e inglés, y luego el parser determinista por expresiones regulares; verificar con `pnpm box parser`
- [ ] 4.2 [Gerard] Plantillas deterministas `accept`/`counter`/`walk` en la persona "cálido-firme"; verificar con la propiedad fast-check "la plantilla pasa validador y detector de fugas para toda decisión dentro del mandato"
- [ ] 4.3 Fixtures de textos correctos, con cifra distinta, con cifras extra y con acción incoherente, y luego el validador; verificar con `pnpm test`
- [ ] 4.4 Fixtures de fugas (reserva exacta y cercana, "mi máximo es", plazo, fragmentos de prompt) y de no-fugas (oferta final igual a la reserva), y luego el detector; verificar con `pnpm test`

## 5. Pipeline de turno, estado y trazas (antes del viernes) [Pablo]

- [ ] 5.1 Tests de estado de sesión (aislamiento entre sesiones concurrentes, mandato y versión de configuración inmutables) y luego el almacén en memoria
- [ ] 5.2 Esquema Zod del registro de traza y de la cabecera de sesión, y luego el escritor JSONL en `results/<run>/`; verificar que una partida produce registros válidos contra el esquema
- [ ] 5.3 Tests de inyección de fallos (excepción, tiempo agotado y salida inválida en cada caja; 2 reintentos; presupuesto de turno) y luego el orquestador con ruta de emergencia (plantilla con la misma decisión; si falla el motor, última oferta válida o apertura); verificar que todos los turnos producen salida válida y el proceso sigue vivo
- [ ] 5.4 Logger `pino` con `redact` del mandato; verificar con un test que juega una partida en nivel `trace` y comprueba que la reserva no aparece en la salida de logs
- [ ] 5.5 Conectar `pnpm agent` = adaptador HTTP + pipeline + campeona con recarga al abrir sesión; verificar con un script de humo `curl` que juega 3 turnos contra el agente arrancado

## 6. Arena mínima y sparring: "minuto 0" (antes del viernes) [Pablo/Paula/Gerard]

- [ ] 6.1 Esquema de escenario y catálogo inicial (comprador y vendedor × ZOPA amplia, estrecha y vacía; solo precio y pronto pago); verificar con un test que carga y valida el catálogo completo
- [ ] 6.2 Test "misma semilla ⇒ misma transcripción" y luego la interfaz `Participant` y el runner de partidas en proceso
- [ ] 6.3 [Paula] Bots Boulware, Conceder y Tit-for-Tat con tests de su curva de concesión
- [ ] 6.4 Tests de métricas por partida (acuerdo, fracción de excedente, rondas, violaciones, fugas, uso de plantilla, latencia; ZOPA vacía excluida de la media) y luego su implementación
- [ ] 6.5 `Participant` externo por `RingClient` HTTP y `pnpm bot:serve <bot>` que expone un bot como agente HTTP; verificar jugando nuestro agente arrancado con `pnpm agent` contra un bot servido por HTTP, y registrando "error del rival" si se cae
- [ ] 6.6 `pnpm arena` con tabla de consola y guardado de transcripciones, trazas y resumen JSON en `results/`; verificar 1000 partidas con `LLM_PROVIDER=none` en pocos minutos, sin red
- [ ] 6.7 Hito minuto 0: partida completa por HTTP con `LLM_PROVIDER=none` contra un rival externo de sparring y 0 violaciones en 1000 partidas de arena; dejar constancia en el resumen de `results/`

## 7. Replay y regresión dorada (antes del viernes) [Pablo]

- [ ] 7.1 `pnpm replay <trace.jsonl> --box <name> [--config <file>]` que reejecuta una caja y muestra original vs nueva por turno; verificar reproduciendo el motor de una partida guardada con la misma configuración (0 diferencias) y con otra (diferencias listadas)
- [ ] 7.2 Guardar 5 partidas doradas sembradas en `test/golden/` y un test que las compara; verificar que alterar β hace fallar `pnpm test` indicando partida, ronda y diferencia

## 8. Proveedores y cajas LLM (antes del viernes / viernes tarde) [Pablo/Gerard]

- [ ] 8.1 Tests de contrato del proveedor con respuestas grabadas (ok, JSON inválido, tiempo agotado, error ⇒ error tipado) y luego la interfaz con esquema generado por `z.toJSONSchema()`
- [ ] 8.2 Proveedor `claude-cli` (`claude -p --json-schema`) pasando los tests de contrato; verificar con una llamada real manual y su respuesta grabada como fixture
- [ ] 8.3 Proveedor `anthropic-api` con salida estructurada y modelo por env, pasando los tests de contrato; confirmar el modo de salida estructurada de la versión instalada
- [ ] 8.4 Parser LLM en cuarentena (sin herramientas, texto del rival delimitado como dato, esquema cerrado); verificar con `pnpm box parser` sobre el set de fixtures y medir aciertos frente al parser determinista en `results/`
- [ ] 8.5 [Gerard] Narrador LLM con persona, cuya entrada es solo decisión + resumen tipado; verificar en la traza que su entrada no contiene reserva, plazo ni texto crudo y que el bucle validador + 2 reintentos + plantilla funciona con proveedor real

## 9. Adaptadores A2A y MCP (spikes antes del viernes) [Pablo]

- [ ] 9.1 Spike A2A con `@a2a-js/sdk`: tarjeta de agente + manejador que traduce al contrato canónico; verificar con la batería común de contrato
- [ ] 9.2 Cliente A2A como `Participant` externo; verificar jugando una partida contra nuestro propio agente expuesto por A2A
- [ ] 9.3 Spike MCP con `@modelcontextprotocol/sdk`: herramienta `negotiate_turn` sobre Streamable HTTP; verificar con la batería común de contrato

## 10. Viernes 18:45–23:00: protocolo real [Pablo]

- [ ] 10.1 Capturar mensajes reales del ring como fixtures en `test/fixtures/ring/real/` y escribir los tests de contrato en rojo
- [ ] 10.2 Adaptar o escribir el adaptador del protocolo real hasta pasar los tests; verificar con `git diff --stat` que solo cambian `src/protocol/` y fixtures
- [ ] 10.3 [Paula] Fijar modo de ejes (solo precio o `pct` + `day`) y mapeo de utilidad del escenario real en la configuración; verificar con `pnpm arena` sobre un escenario que lo imite
- [ ] 10.4 Primera partida completa contra el ring de pruebas con traza guardada y convertida en partida dorada
- [ ] 10.5 Camino de despliegue (portátil + túnel o nube) con `GET /health` accesible desde fuera; verificar desde otra red

## 11. Sábado: estrategia [Paula]

- [ ] 11.1 Tests con rivales sintéticos de reserva conocida (error de estimación dentro de tolerancia tras ≥ 5 concesiones) y luego el modelo del rival por regresión de concesiones + frecuencias
- [ ] 11.2 Añadir reciprocidad Tit-for-Tat y el modelo del rival al generador con propiedades (no conceder más que la curva si el rival no concede); verificar con comparación pareada frente a la campeona
- [ ] 11.3 AC_combi en la caja de aceptación con su tabla de casos; verificar con comparación pareada

## 12. Sábado: estadística y promoción [Pablo]

- [ ] 12.1 Runner pareado campeón vs candidata sobre mismos escenarios, rivales, roles y semillas; verificar que dos configuraciones idénticas dan diferencia 0
- [ ] 12.2 Bootstrap pareado sembrado con tests sobre distribuciones conocidas (cobertura aproximada del IC) y ponderación del rol comprador configurable (por defecto 2:1)
- [ ] 12.3 Puerta de promoción (IC inferior > 0, 0 violaciones, 0 fugas) y `pnpm promote <candidate>` que escribe `config/champion.json` vN+1, propone el mensaje `champion vN+1` y respeta el flag de congelación; verificar con tests de los tres rechazos y un aprobado

## 13. Sábado: ajuste [Paula]

- [ ] 13.1 `pnpm tune` con muestreo aleatorio sembrado y rejilla sobre rangos declarados, candidatas versionadas con procedencia en `config/candidates/`; verificar que la misma semilla reproduce la tabla
- [ ] 13.2 Interfaz de optimizador enchufable (`propose`/`evaluate`) y successive halving; verificar que cambiar de generador no cambia la arena ni la puerta
- [ ] 13.3 Crítico LLM opcional sobre derrotas que escribe un informe en `results/` sin tocar configuraciones; verificar ejecutándolo sobre una ejecución guardada

## 14. Sábado: bots adversariales y LLM [Gerard]

- [ ] 14.1 Bots con texto en código: Inject+Voss, mentiroso (falso BATNA), extracción por marco hipotético, ancla extrema y "estilo Causa Prima"; verificar que en la arena dan 0 violaciones y 0 fugas
- [ ] 14.2 Bot guiado por LLM con persona configurable como `Participant`; verificar con una muestra pequeña vía `claude-cli`

## 15. Sábado: red team [Gerard]

- [ ] 15.1 Configuración promptfoo 0.123.1 con proveedor propio contra el adaptador HTTP, plugins `excessive-agency`, `hijacking`, `prompt-extraction`, `ascii-smuggling` y estrategia `jailbreak:meta`; verificar con un smoke de 3 casos
- [ ] 15.2 Casos explícitos de los 3 patrones de Scribo y aserciones JS deterministas (sin reserva ni instrucciones, decisión igual a la del motor, esquema); verificar que un agente deliberadamente roto hace fallar la suite
- [ ] 15.3 `pnpm redteam` con número de casos acotado, informe en `results/` y código de salida distinto de cero si hay fallos reales; verificar ejecución completa con 0 fallos reales

## 16. Observabilidad opcional [Pablo]

- [ ] 16.1 Exportación a Langfuse/OpenTelemetry tras flag; verificar que con el flag apagado no hay conexiones y con él encendido aparece la traza de una partida

## 17. Domingo hasta las 15:30: congelación [todos]

- [ ] 17.1 Última comparación pareada y promoción de la campeona final; activar el flag de congelación; verificar que `pnpm promote` se niega a sobrescribir
- [ ] 17.2 Smoke test contra el ring con la campeona congelada y ensayo de rollback a la campeona anterior vía git
- [ ] 17.3 [Gerard] Guion de demo con una partida dorada, la tabla de la arena y el informe del red team de `results/`
