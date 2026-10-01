# openspec/ — Propuestas de Cambio Arquitectónico

Control de cambios estructurales: propuestas, tareas, specs, validación.

## Propósito

Agencia arquitectónica: antes de codificar cambios grandes, se proponen, diseñan, validan con OpenSpec.

## Estructura

`changes/<id>/`:
- **`proposal.md`** — Qué se propone, por qué.
- **`design.md`** — Cómo se implementa.
- **`spec.md`** — Especificación detallada.
- **`tasks.md`** — Lista de tareas (checkbox para marcar como done).

## Cambios actuales

| ID | Título | Estado |
|---|---|---|
| `add-agent-architecture` | Arquitectura inicial del agente | Hecho |
| `add-arena-viewer` | Visor de arena y promoción | Por hacer |

## Cómo validar

```bash
# Validar cambio (checkea tareas, spec, integridad)
openspec validate add-agent-architecture

# Listar cambios
ls openspec/changes/
```

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → [`changes/add-agent-architecture/`](changes/add-agent-architecture/) — propuesta inicial
- → [`changes/add-arena-viewer/`](changes/add-arena-viewer/) — propuesta de visor
