# negotiation-ring — Contexto para Agentes de Código

Agente negociador para un torneo (Negotiation Ring, hackathon Causa Prima). El LLM interpreta y redacta la respuesta; el código decide la cifra de la oferta y si aceptamos o nos retiramos.

## Reglas no negociables

- **La cifra sale siempre del motor (`src/engine/`).** El narrador pone palabras a una decisión ya tomada; el validador descarta textos cuyo número no coincida.
- **Mandato (reserva), rol e identidad los fija el código**, nunca texto del rival. Toda oferta pasa por `enforceGuardrails`: no cruza el mandato y es monótona.
- **El texto del rival solo lo lee el parser** (`src/llm/`), sin herramientas, y devuelve JSON validado con Zod. Nunca vuelve a afectar la decisión.
- **Siempre respondemos**: timeouts, errores de esquema y fallos del LLM usan la plantilla determinista con el mismo número.
- **Protocolo modular**: el contrato con el ring vive en `src/protocol/`; si cambia el ring, solo se reescribe ahí.

## Tuerca del turno

```
  ring                        (POST /turn con sessionId, round, rival move y oferta)
    ↓
  [ adaptador entrada → Zod ] (protocolo del ring; error: 400 con esquema)
    ↓
  [ parser en cuarentena ]    (LLM sin herramientas, o determinista; queda JSON)
    ↓
  [ motor determinista ]      (modelo del rival, oferta Boulware+TFT, aceptación, guardarraíles)
    ↓
  [ narrador (LLM) ]          (redacta respuesta; fallo, timeout o poco tiempo → plantilla)
    ↓
  [ validador ]               (la cifra de la respuesta = decisión del motor)
    ↓
  [ adaptador salida ]        (Zod → protocolo del ring)
    ↓
  ring                        (TurnOutput: accept/counter/walk + oferta + texto)
```

Estados persistentes: `sessionId`, turno, ronda, plazo, ofertas pasadas, decisión sobre aceptación.

## Arquitectura

```
src/
├─ protocol/    esquemas Zod y adaptadores input/output (del ring → cerebro → al ring)
├─ engine/      motor: utilidad, modelo rival, oferta, aceptación, guardarraíles (NÚMEROS)
├─ pipeline/    orquestación del turno: cajas, timeout, reintentos, telemetría
├─ llm/         parser, narrador, plantilla, proveedor (none|claude-cli|anthropic-api)
├─ agent/       servidor HTTP (POST /turn, GET /health)
├─ arena/       self-play: partidas, métricas, tabla, promoción, comparación pareada
├─ bots/        rivales para la arena (adversariales, solo texto, LLM)
├─ dev/         herramientas: replay, golden, critic, box
├─ redteam/     harness de red team
└─ tune/        generadores, espacio de búsqueda, barridos de parámetros

test/           tests unitarios, de propiedades (fast-check), fixtures, golden
config/         champion.json (mejor config hasta ahora) + candidatos en candidates/
scripts/        utilidades shell (smoke, sparring, eval-dummy, tunnel)
docs/           design docs (en Markdown)
openspec/       propuestas de cambio (agencia arquitectónica)
design-system/  componentes React (paquete independiente, con .design-sync/ para Claude Design)
viewer/         visor local de resultados de arena/promoción/agente (paquete independiente)
redteam/        escenarios y cadenas de red team
results/        partidas guardadas, trazas, métricas (fuera de git)
```

## Paquetes y lockfiles

### Root (`negotiation-ring`)
- `pnpm install` → instala dependencias del motor, arena, agente, herramientas dev y tests.
- `pnpm test` → vitest sobre `test/`.
- `pnpm typecheck` → tsc.
- Lockfile: `pnpm-lock.yaml` (raíz).
- Node ≥ 22.

### `viewer/` (`@negotiation-ring/viewer`)
- Paquete independiente: React + Vite + vitest, servidor Node en `viewer/server/main.ts`.
- `pnpm --dir viewer install` → instala dependencias del visor.
- `pnpm --dir viewer start` → servidor en http://127.0.0.1:5199/ (puerto configurable con `VIEWER_PORT`, dirección fija). Lectura, sin cálculos. Texto rival solo como texto, nunca como HTML.
- Lockfile: `viewer/pnpm-lock.yaml`.

### `design-system/` (`@negotiation-ring/design-system`)
- Paquete independiente: componentes React, esbuild, TypeScript.
- `pnpm --dir design-system install` → instala dependencias.
- `pnpm --dir design-system build` → genera `dist/`.
- Lockfile: `design-system/pnpm-lock.yaml`.

## Variables de entorno

```bash
# Proveedor del LLM: none | claude-cli | anthropic-api
LLM_PROVIDER=none

# Solo si anthropic-api (día del torneo). Nunca subir a git.
ANTHROPIC_API_KEY=

# Config que carga el agente (por defecto config/champion.json)
AGENT_CONFIG=config/champion.json

# Autenticación POST /turn: Bearer por defecto, custom con AGENT_AUTH_HEADER
AGENT_AUTH_TOKEN=
AGENT_AUTH_HEADER=
# Solo tests en local
AGENT_ALLOW_NOAUTH=1
```

Ver `.env.example`.

## Scripts `pnpm`

| Comando | Descripción |
|---------|-------------|
| `pnpm test` | Tests unitarios + propiedades (fast-check). Must pass antes de commit. |
| `pnpm test:watch` | Vitest en modo watch. |
| `pnpm typecheck` | TypeScript. |
| `pnpm arena` | Self-play: candidata vs campeona, todos los bots/roles/escenarios. |
| `pnpm promote` | Puerta de promoción: revalida campeona, evalúa candidata, decide si promueve. |
| `pnpm tune` | Barrido de parámetros en el espacio del motor. |
| `pnpm agent` | Servidor del agente: `AGENT_CONFIG=config/champion.json` por defecto. |
| `pnpm redteam` | Harness de red team. |
| `pnpm bot:serve` | Servidor de un bot como agente HTTP para sparring. |
| `pnpm dummy:serve` | Servidor del dummy-agent (estrategia fija). |
| `pnpm sparring` | Agente vs bot por HTTP: arena con `--rival-url`. |
| `pnpm eval:dummy` | Evaluación de punta a punta vs dummy (5 semillas, ~20 s). |
| `pnpm eval:llm` | Matriz política × idioma × proveedor en texto completo (`scripts/eval-llm.sh`; llamadas reales salvo `LLM_PROVIDER=none`; `--dry-run` imprime el plan). |
| `pnpm box <cmd>` | Caja de pruebas de motor. |
| `pnpm replay <game.json>` | Reproduce una partida guardada. |
| `pnpm golden:update` | Regenera fixtures doradas. |
| `pnpm critic <game.json>` | Analiza una partida. |
| `pnpm smoke` | Smoke test: HTTP sin herramientas, 1 turno. |
| `pnpm viewer` | Visor local (React). |
| `pnpm viewer:test` | Tests del visor. |
| `pnpm viewer:typecheck` | TypeScript del visor. |
| `pnpm ds:test` | Tests del design-system. |

## Evaluación de un agente (baseline, externo u otro candidato)

### (a) Como configuración del motor (`AgentConfig`)

```bash
# Candidata vs campeona, pareada
pnpm arena --candidate config/baselines/dummy.json --seeds 5

# Puerta completa, sin tocar champion.json
pnpm promote config/baselines/dummy.json --dry-run --seeds 5 --reval-seeds 5
```

`config/candidates/` está en `.gitignore` (área efímera de `pnpm tune`). Una baseline que sí versionar va en `config/baselines/`.

### (b) Como agente HTTP externo

```bash
# Bot dummy en puerto 8799
pnpm dummy:serve --strategy accept-first --port 8799 --scenario price-buyer-wide

# Arena: candidata por HTTP reemplaza nuestro agente (no añade rival)
pnpm arena --agent-url http://localhost:8799 --scenarios price-buyer-wide --seeds 5
```

`--agent-url` sustituye nuestro agente. El turno no incluye el mandato externo; cada servidor conoce el suyo por `--scenario`.

### (`pnpm eval:dummy`)

```bash
pnpm eval:dummy 5  # 5 semillas (por defecto), ~20 s. Resultados en results/eval-dummy/
```

### (`pnpm eval:llm`)

Matriz en texto completo: política del parser × idioma del rival × proveedor (`src/arena/eval-llm-plan.ts`), contra bots en código con el renderizador de lenguaje natural y el bot LLM; informa sin-extraer, mal-leídas, falsas aceptaciones, confirmaciones, plantilla y latencia p50/p95 por celda. `pnpm eval:llm --dry-run` imprime el plan y la cota de llamadas; `LLM_PROVIDER=none pnpm eval:llm` la juega sin llamadas. Con LLM corta si la cota supera `EVAL_LLM_MAX_CALLS` (300 por defecto; la matriz por defecto son 280). Detalle y perfil de cuenta en el README («Medir el valor del LLM»). Resultados en `results/eval-llm/`.

Conclusión de la medición anterior (antes de `text-first-ring`): con la reconciliación AND el parser LLM no recuperaba ofertas, y el narrador vía `claude -p` no cabía en `turnBudgetMs` (casi siempre la plantilla); de ahí la política `llm-primary-verified`, el presupuesto por caja y `anthropic-api` como proveedor recomendado en modo texto.

## OpenSpec: cambios de arquitectura

| ID | Título | Estado | Spec |
|---|---|---|---|
| `add-agent-architecture` | Arquitectura inicial del agente negociador | Hecho | [proposal](openspec/changes/add-agent-architecture/proposal.md) |
| `add-arena-viewer` | Visor de arena y promoción | Por hacer | [proposal](openspec/changes/add-arena-viewer/proposal.md) |

Ver `openspec/changes/<id>/` para tareas y propuesta. Validar con `openspec validate <id>`.

## Flujo de trabajo

1. **Programar**: motor, bots, adaptadores. `pnpm test` + `pnpm typecheck` deben pasar.
2. **Evaluar**: `pnpm arena` enfrenta la candidata contra el campeón en todos los bots, roles y escenarios.
3. **Promover**: si mejora el excedente con **0 violaciones del mandato**, pasa a `config/champion.json` (commit `champion vN`).
4. **Competir**: agente arranca siempre con el campeón. Fallos → vuelta atrás con git.

## Para empezar: orden de lectura

1. **Root `AGENTS.md`** ← estás aquí.
2. **`README.md`** — visión general en español, ejemplos de uso.
3. **`src/protocol/AGENTS.md`** — esquemas, adaptadores, contrato con el ring.
4. **`src/engine/AGENTS.md`** — motor determinista, utilidad, ofertas, aceptación.
5. **`src/llm/AGENTS.md`** — parser, narrador, proveedor, plantilla.
6. **`src/pipeline/AGENTS.md`** — orquestación del turno, timeout, telemetría.
7. **`src/agent/AGENTS.md`** — servidor HTTP.
8. **`src/arena/AGENTS.md`** — self-play, métricas, promoción.
9. **`config/AGENTS.md`** — configuración, champion.json, candidatos.
10. **Resto de módulos según necesidad** (`bots/`, `redteam/`, `tune/`, `dev/`, etc.).

## Links a subcarpetas

- [`src/`](src/AGENTS.md) — módulos de lógica
- [`test/`](test/AGENTS.md) — tests y fixtures
- [`config/`](config/AGENTS.md) — configuración
- [`scripts/`](scripts/AGENTS.md) — scripts shell
- [`docs/`](docs/AGENTS.md) — design docs
- [`openspec/`](openspec/AGENTS.md) — propuestas de cambio
- [`viewer/`](viewer/AGENTS.md) — visor de resultados (paquete React)
- [`design-system/`](design-system/AGENTS.md) — componentes React
- [`redteam/`](redteam/AGENTS.md) — escenarios red team (confidencial)

---

*Versión: hackathon Causa Prima, Equipo 2 (Pablo, Paula, Gerard).*
