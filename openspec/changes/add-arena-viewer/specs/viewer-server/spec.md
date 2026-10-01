# Spec Delta: viewer-server

## Purpose

Sirve al visor, solo en la máquina local y solo en lectura, los ficheros que la arena, la promoción y el agente ya escribieron en `results/`, validados línea a línea, y la cola en directo de la traza de torneo que se está escribiendo.

## ADDED Requirements

### Requirement: Solo local y sin autenticación
El servidor del visor SHALL escuchar únicamente en `127.0.0.1`; la dirección MUST NOT ser configurable (solo el puerto, con `VIEWER_PORT`). El servidor SHALL rechazar con 403 las peticiones cuya cabecera `Host` no sea `127.0.0.1:<puerto>` ni `localhost:<puerto>` (defensa ante DNS rebinding). El servidor no tiene autenticación porque solo es accesible desde la propia máquina; esta decisión SHALL figurar en el README del visor.

#### Scenario: Enlace a loopback
- **WHEN** se arranca el servidor con `VIEWER_PORT=0`
- **THEN** la dirección de escucha es `127.0.0.1` y no hay socket en `0.0.0.0` ni en `::`

#### Scenario: Host ajeno
- **WHEN** llega una petición con `Host: evil.example:5199`
- **THEN** el servidor responde 403 sin leer ningún fichero

### Requirement: Solo lectura y ficheros permitidos
El servidor SHALL exponer solo métodos `GET` (y `HEAD`) y MUST NOT escribir, mover ni borrar ficheros. SHALL leer únicamente bajo `results/` y, de `config/`, solo `config/champion.json` y el fichero de escenario que referencia una cabecera de torneo. Cualquier otro método SHALL responder 405.

#### Scenario: Método de escritura
- **WHEN** llega `POST /api/runs`
- **THEN** responde 405 y el árbol de `results/` no cambia

#### Scenario: Config fuera de la lista
- **WHEN** se pide `config/arena/scenarios.json` o `config/candidates/x.json`
- **THEN** responde 404

### Requirement: Protección contra path traversal
Todo identificador recibido (run, partida, sesión) SHALL cumplir `^[A-Za-z0-9_.-]{1,128}$` y no contener `..`; la ruta resuelta con `realpath` SHALL quedar dentro de la raíz permitida. Si no, el servidor SHALL responder 400 o 404 sin revelar rutas absolutas.

#### Scenario: Traversal codificado
- **WHEN** se pide `/api/runs/..%2F..%2Fetc%2Fpasswd`
- **THEN** responde 400 y no se abre ningún fichero fuera de `results/`

#### Scenario: Enlace simbólico hacia fuera
- **WHEN** `results/evil` es un enlace simbólico a un directorio fuera de `results/`
- **THEN** responde 404

### Requirement: Validación por línea sin caídas
El servidor SHALL validar con los esquemas Zod del escritor (`TraceLineSchema`, `TranscriptLineSchema`, `SummarySchema`, `GateFileSchema`) cada línea JSONL y cada JSON que lee. Una línea inválida SHALL omitirse y devolverse en `errors[]` con fichero relativo a `results/`, número de línea (desde 1), ruta del campo y mensaje; el resto del fichero SHALL seguir cargándose. Ningún contenido de un fichero MUST tumbar el proceso.

#### Scenario: Línea inválida
- **WHEN** la línea 1834 de un `transcripts.jsonl` tiene `"offer": {"pct": "one hundred four"}`
- **THEN** la respuesta trae las 1833 líneas válidas restantes y un error con `line: 1834` y el campo `transcript.0.offer.pct`

#### Scenario: JSON truncado
- **WHEN** la última línea de una traza está cortada a medias
- **THEN** la respuesta trae un error de esa línea y el proceso sigue vivo

### Requirement: Cola en directo por SSE
El servidor SHALL ofrecer `GET /api/live` como Server-Sent Events con las líneas nuevas, ya validadas, de la traza de torneo más reciente bajo `results/agent-*/`, detectadas con `fs.watch` y un sondeo de respaldo de 500 ms, leyendo desde el último desplazamiento y guardando la línea parcial hasta su salto de línea. SHALL emitir un evento `session` cuando aparece un fichero de sesión nuevo y un evento `invalid` por línea inválida. No SHALL usar servicios externos.

#### Scenario: Línea añadida
- **WHEN** el agente añade un registro a la traza de la sesión en curso
- **THEN** el cliente SSE recibe ese registro en menos de 1 s

#### Scenario: Escritura partida
- **WHEN** una línea llega en dos escrituras separadas
- **THEN** el cliente recibe un único registro completo

### Requirement: Arranque con un comando
`pnpm viewer` en la raíz SHALL arrancar en un solo proceso el servidor y la interfaz (Vite en modo middleware) y mostrar la URL local.

#### Scenario: Arranque
- **WHEN** se ejecuta `pnpm viewer` con `viewer/` instalado
- **THEN** `http://127.0.0.1:<puerto>/` sirve la interfaz y `/api/runs` responde JSON
