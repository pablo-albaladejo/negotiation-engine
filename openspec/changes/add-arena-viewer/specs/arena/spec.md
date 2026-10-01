# Spec Delta: arena

## Purpose

Añade a los ficheros de resultados de la arena y de la promoción los campos que el visor necesita, de forma aditiva y versionada, escritos por la propia arena que decide esos valores.

## ADDED Requirements

### Requirement: Esquemas de resultados versionados
Los ficheros `results/<run>/transcripts.jsonl`, `results/<run>/summary.json` y `results/promote-*/gate.json` SHALL tener esquema Zod en `src/arena/results-schema.ts` y llevar `schemaVersion: 2`. Los esquemas SHALL aceptar ficheros v1 (sin `schemaVersion` ni campos nuevos). Los tests del escritor SHALL validar su salida contra esos esquemas.

#### Scenario: Salida del escritor válida
- **WHEN** se ejecuta `pnpm arena` con 1 semilla en un directorio temporal
- **THEN** cada línea de `transcripts.jsonl` y `summary.json` pasan `TranscriptLineSchema` y `SummarySchema` con `schemaVersion: 2`

#### Scenario: Fichero v1
- **WHEN** se valida un `transcripts.jsonl` escrito antes de este cambio
- **THEN** pasa el esquema y los campos nuevos quedan sin definir

### Requirement: Contexto de la partida en el transcript
Cada línea v2 de `transcripts.jsonl` SHALL incluir `roundLimit` (o `null` si el escenario no tiene límite) y `reserves: { ours, rival }` con las reservas por issue del escenario de arena. Estos campos SHALL escribirse solo en modo arena, nunca en trazas de torneo.

#### Scenario: Reservas en arena
- **WHEN** se juega una partida de arena con ZOPA vacía
- **THEN** su línea tiene `reserves.ours` y `reserves.rival` del catálogo y `metrics.zopaEmpty = true`

### Requirement: Parámetros en el resumen
`summary.json` v2 SHALL incluir `config.params` con los parámetros de la configuración usada (`beta`, `openingMargin`, `acceptMargin`, `acTimeThreshold`, `noise`, `defaultHorizon`, `persona`).

#### Scenario: Resumen con parámetros
- **WHEN** se ejecuta `pnpm arena` con la campeona
- **THEN** `summary.config.params.beta` es igual a `beta` de `config/champion.json`

### Requirement: Puerta de promoción explicada y en seco
`gate.json` v2 SHALL incluir `configs: { champion, candidate }` (configuraciones completas comparadas), por fase `summaries: { champion, candidate, candidateByRivalRole }` calculados por la arena con `summarize`, `dryRun` y `promoted`. `pnpm promote --dry-run` SHALL evaluar la puerta y escribir `gate.json` sin modificar `config/champion.json`.

#### Scenario: Ensayo en seco
- **WHEN** se ejecuta `pnpm promote config/candidates/x.json --dry-run` y la puerta pasa
- **THEN** `gate.json` tiene `dryRun: true`, `promoted: false` y `config/champion.json` no cambia

#### Scenario: Heatmap registrado
- **WHEN** termina la fase `tuning`
- **THEN** `summaries.candidateByRivalRole` tiene una entrada por rival y rol con `meanSurplus`
