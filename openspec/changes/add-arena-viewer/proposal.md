complexity: medium

# Proposal: visor de la arena y del torneo (add-arena-viewer)

## Why

La arena, la promoción, el ajuste y el agente en modo torneo ya escriben todo en `results/` (resúmenes JSON, `transcripts.jsonl`, trazas JSONL por partida y `gate.json`), pero solo se puede leer con `jq` o con la tabla de consola. Para iterar el sábado (¿por qué perdemos contra `extreme-anchor`?, ¿la candidata mejora de verdad?) y para la demo del domingo necesitamos ver una partida ronda a ronda, comparar campeona y candidata y proyectar la partida en curso. El diseño aprobado está en `docs/design/arena-viewer.dc.html` (pantallas P1–P8, solo componentes de `@negotiation-ring/design-system`).

El visor no añade inteligencia: muestra lo que el motor, el parser, el validador y la arena ya registraron. Cuando el diseño pide un valor que nadie registra, o lo registra quien lo decide (extensión aditiva y versionada del escritor) o desaparece de la pantalla.

## What Changes

- **Paquete `viewer/`** (Vite + React 18 + TypeScript, lockfile propio) que consume el código fuente de `design-system/` por alias de ruta; `pnpm viewer` arranca un único proceso Node con la API y Vite en modo middleware.
- **Servidor local de solo lectura**: escucha solo en `127.0.0.1`, sin autenticación (local por diseño), lee `results/` y una lista cerrada de ficheros de `config/`, protegido contra path traversal, valida con Zod cada línea y devuelve los errores con fichero, línea y campo en lugar de caerse.
- **Pantallas**: P1 runs, P2 partidas de un run con filtros, P3 replay en modo arena, P4 replay en modo torneo, P8 estados (log inválido, run vacío, cargando) en el minuto 0; P5 (2 issues) y P6 (campeona vs candidata) el sábado; P7 (proyector en directo por SSE) y el resto de P8 el domingo o si hay tiempo.
- **Extensiones aditivas de los escritores**, versionadas:
  - motor: explicación opcional de la decisión (`explain`: `t`, objetivo Boulware, paso, utilidades, AC_next, AC_time, estimación de la reserva del rival);
  - traza por partida v2: `traceVersion: 2` y `role` en la cabecera de torneo (nunca la reserva); registro `protocol` cuando el rival rompe el protocolo;
  - arena: `schemaVersion: 2` en `transcripts.jsonl` (con `roundLimit` y reservas de ambas partes solo en arena) y en `summary.json` (con los parámetros de la configuración);
  - promoción: `gate.json` v2 con las configuraciones comparadas, los resúmenes por fase y por rival × rol, y `pnpm promote --dry-run`.
- Esquemas Zod de los ficheros de resultados en el lado del escritor (`src/arena/results-schema.ts`), compartidos con el visor.
- Lo que el diseño muestra y no se registra ni se va a registrar se quita de la pantalla (ver design.md, tabla de huecos).

## Capabilities

### New Capabilities
- `viewer-server`: servidor local de solo lectura: enlace a `127.0.0.1`, ficheros permitidos, path traversal, validación por línea, cola SSE en directo, arranque con `pnpm viewer`.
- `arena-viewer`: modelos de pantalla a partir de los ficheros y pantallas P1–P8, reglas de privacidad y de "no recalcular", formato de números e idioma.

### Modified Capabilities
- Ninguna en `openspec/specs/` (no existe todavía; `add-agent-architecture` no está archivada). Se añaden requisitos nuevos a `arena`, `negotiation-engine` y `turn-pipeline` como deltas `ADDED`.

## Impact

- **Código**: nuevo `viewer/` (servidor en `viewer/server/`, UI en `viewer/src/`); cambios aditivos en `src/engine/engine.ts` (`DecisionSchema.explain`), `src/pipeline/trace.ts` (cabecera v2), `src/pipeline/pipeline.ts` (registro `protocol`), `src/pipeline/otel.ts` (redacción de `explain`), `src/agent/agent.ts` (rol en la cabecera), `src/arena/cli.ts`, `src/arena/promote.ts`, `src/arena/promote-main.ts`; nuevo `src/arena/results-schema.ts`.
- **Scripts**: `pnpm viewer`, `pnpm viewer:test`; `pnpm promote --dry-run`.
- **Dependencias**: solo en `viewer/package.json` (react, react-dom 18, vite, @vitejs/plugin-react, vitest, jsdom, @testing-library/react); el paquete raíz no gana dependencias, el agente del torneo no cambia de tamaño.
- **Sistemas**: ninguno; todo local, sin servicios externos.
- **Supuestos**: las trazas v1 ya escritas se siguen leyendo (los campos nuevos son opcionales y su ausencia se muestra como "not logged"); el ring puede no dar nombre del rival ni del equipo (P4/P7 muestran el `sessionId`, nombre de nuestro equipo `Us`). El texto crudo del rival en torneo se guarda en el JSONL local (registro `rivalText`) y se excluye de la exportación OTel/Langfuse; `pnpm promote --dry-run` corre la puerta completa sin tocar `config/champion.json`.
