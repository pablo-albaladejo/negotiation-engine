# Spec Delta: arena-viewer

## Purpose

Convierte los ficheros de `results/` en modelos de pantalla y los pinta con los componentes de `@negotiation-ring/design-system`, según el diseño aprobado `docs/design/arena-viewer.dc.html` (P1–P8), sin recalcular nunca una decisión ni una métrica.

## ADDED Requirements

### Requirement: El visor no recalcula
Los adaptadores (fichero → modelo de pantalla) SHALL limitarse a seleccionar, filtrar, ordenar, contar registros y dar formato. MUST NOT calcular utilidades, excedentes, medias, diferencias, objetivos, estimaciones ni veredictos: esos valores salen del campo que los registra. El veredicto de promoción SHALL salir de `gate.pass` y de `gate.checks` de `gate.json`. Un valor no registrado SHALL mostrarse como `not logged` (o el elemento se omite según design.md), nunca aproximado.

#### Scenario: Traza v1 sin explicación del motor
- **WHEN** se abre en P3 una partida cuya traza no tiene `explain` en el registro `engine`
- **THEN** el panel "Engine decision this round" muestra la regla registrada y `not logged` en objetivo, paso, AC_next y AC_time, y la curva objetivo no se dibuja

#### Scenario: Veredicto
- **WHEN** `gate.json` tiene `gate.pass = false` con `heldOut/non-negative` fallido
- **THEN** P6 muestra la píldora de rechazo con esa comprobación y el `meanDiffPp` registrado en `reports.heldOut`, sin evaluar ningún umbral en el visor

### Requirement: Solo componentes del sistema de diseño
Las pantallas SHALL construirse solo con los componentes exportados por `@negotiation-ring/design-system` (gráficos incluidos: `OfferChart`, `Scatter2D`, `Heatmap`); el visor MUST NOT añadir librerías de gráficos. La interfaz SHALL estar en inglés y los números SHALL formatearse con `formatNumber(v, { locale: "en" })`.

#### Scenario: Formato de número
- **WHEN** se muestra un excedente medio de 0.268
- **THEN** aparece como `26.8%` en la tira de KPIs

### Requirement: Runs y partidas (P1, P2)
P1 SHALL listar los directorios de `results/` por tipo (arena, promoción, torneo) con los campos de `summary.json` (id, fecha, configuración, partidas, excedente medio, acuerdo, violaciones, fugas) y su `ModeBadge`. P2 SHALL mostrar los KPIs de `summary.overall` y la tabla de partidas de `transcripts.jsonl` con `Filters` por rival, rol, resultado y la casilla "template".

#### Scenario: Filtro por rival
- **WHEN** en P2 se elige el rival `boulware` y el rol `buyer`
- **THEN** la tabla solo contiene partidas de `transcripts.jsonl` con `rival = "boulware"` y `role = "buyer"`

### Requirement: Replay en modo arena (P3)
P3 SHALL mostrar para una partida de arena los KPIs, el `OfferChart` con nuestras ofertas y las del rival, la ZOPA y ambas reservas (de `transcripts.jsonl` v2), la curva objetivo y la estimación de la reserva del rival (de `explain`), el chat y el panel de decisión del motor por ronda con regla, AC_next, AC_time, parser, validador y latencias por caja de la traza.

#### Scenario: Cambio de ronda
- **WHEN** se pulsa un punto de la ronda 5 en el gráfico
- **THEN** el panel de decisión muestra los registros de la ronda 5 de la traza y se resalta el mensaje de esa ronda

#### Scenario: Partida sin traza
- **WHEN** la partida se jugó con `--no-traces` o `--agent-url`
- **THEN** P3 muestra gráfico y chat desde `transcripts.jsonl` y el panel de decisión indica que no hay traza

### Requirement: Privacidad en modo torneo (P4, P7)
En modo torneo el visor MUST NOT mostrar ni pedir la reserva del rival ni la ZOPA. Nuestra reserva SHALL mostrarse solo si existe en local el fichero de escenario cuyo nombre y hash coinciden con `header.scenario`; si no, `not available`. El visor SHALL mantener la sanitización de la traza: de narrador, validador y detector de fugas solo muestra longitudes y banderas.

#### Scenario: Escenario local presente
- **WHEN** la cabecera de torneo referencia `scenario.json` con hash `h` y `config/scenario.json` tiene hash `h`
- **THEN** P4 dibuja nuestra reserva y no dibuja reserva del rival ni ZOPA

#### Scenario: Escenario cambiado
- **WHEN** el hash de `config/scenario.json` no coincide con el de la cabecera
- **THEN** P4 muestra `Our reserve: not available` y no dibuja la línea

### Requirement: Texto del rival solo como texto
El texto del rival SHALL mostrarse solo dentro de `ChatMessage` como nodo de texto; MUST NOT interpretarse como HTML, Markdown ni enlace.

#### Scenario: Texto con HTML
- **WHEN** el rival escribió `<img src=x onerror=alert(1)>`
- **THEN** la burbuja muestra esos caracteres literalmente y el DOM no contiene un elemento `img`

### Requirement: Dos issues (P5)
Para partidas con exactamente 2 issues, P5 SHALL mostrar `Scatter2D` con las ofertas de ambas partes y el rectángulo del mandato (límites de `issues` y reserva de la cabecera), el `OfferChart` de utilidades por ronda tomadas de `explain` y la tabla de ofertas registradas. Las líneas de isoutilidad y la fórmula de utilidad del diseño no se muestran.

#### Scenario: Partida de 2 issues
- **WHEN** se abre una partida del escenario `pct-day`
- **THEN** P5 muestra un punto por oferta en el plano descuento × día y las utilidades registradas por ronda

### Requirement: Campeona vs candidata (P6)
P6 SHALL leer un `gate.json` v2 y mostrar métricas de ambas configuraciones por fase, las comprobaciones de la puerta tal como se registraron, el `Heatmap` de excedente por rival × rol de la candidata, el diff de parámetros entre las dos configuraciones registradas y el comando `pnpm promote <candidata>` para copiar solo si `dryRun` es verdadero y la puerta pasó. El visor MUST NOT promover.

#### Scenario: Puerta en seco aprobada
- **WHEN** `gate.json` tiene `dryRun: true` y `gate.pass: true`
- **THEN** P6 muestra la píldora de aprobación y el comando con la ruta de `candidate` para copiar

#### Scenario: Promoción ya hecha
- **WHEN** `gate.json` tiene `promoted: true`
- **THEN** P6 muestra `promoted to champion v<n>` y no muestra el comando

### Requirement: Directo para proyector (P7)
P7 SHALL mostrar, a partir de `/api/live`, el `Scoreboard` (ronda, límite y ataques bloqueados contados como registros `parser` con `injectionSuspected` o registros `leak` con `leak: true`), un `OfferChart` grande con las utilidades de `explain`, las 3 últimas burbujas y el estado LIVE, FINAL o BREAK, en tema oscuro.

#### Scenario: Ataque bloqueado
- **WHEN** llega un registro `parser` con `injectionSuspected: true`
- **THEN** el contador de ataques bloqueados sube en 1 sin recargar la página

### Requirement: Estados límite (P8)
El visor SHALL mostrar: log inválido con fichero, línea y campo y el número de líneas válidas cargadas; run vacío; carga en curso con progreso; rival que rompe el protocolo; ZOPA vacía con retirada; LLM caído con todos nuestros mensajes por plantilla. Ningún estado límite SHALL dejar la pantalla en blanco.

#### Scenario: Run vacío
- **WHEN** un `summary.json` tiene `overall.games = 0`
- **THEN** P2 muestra "has no matches" con el comando `pnpm arena` y no una tabla vacía

#### Scenario: LLM caído
- **WHEN** todos los turnos propios de una partida tienen registro `template` con `result: "fallback"`
- **THEN** cada burbuja nuestra lleva la bandera `template` y la cabecera indica cuántos mensajes de cuántos salieron por plantilla
