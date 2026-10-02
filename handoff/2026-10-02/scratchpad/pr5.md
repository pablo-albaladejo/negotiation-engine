## Qué trae

**`pnpm viewer`**: el visor de la arena, construido a partir del diseño aprobado en Claude Design (`docs/design/arena-viewer.dc.html`) con los componentes reales del design system. Implementa el cambio OpenSpec `add-arena-viewer`: 16 de 17 tareas. La 7.2 queda pendiente de la revisión visual a 1920×1080.

### Pantallas

| | Ruta | Qué muestra |
|---|---|---|
| P1 | `#/runs` | Lista de runs |
| P2 | `#/runs/<runId>` | Partidas de un run, con filtros |
| P3 | `#/runs/<runId>/games/<gameId>` | Repetición en arena: gráfico con ZOPA, chat, panel «Engine decision» a partir de `explain` y punto → mensaje |
| P4 | `#/tournament/<runId>/<session>` | Repetición en torneo: sin ZOPA ni reserva del rival, con badge TOURNAMENT |
| P5 | `#/runs/<runId>/games/<gameId>` | Partidas de dos issues, con `Scatter2D` y la región del mandato |
| P6 | `#/promote/<runId>` | Campeón vs candidato a partir de `gate.json`: comprobaciones, veredicto, heatmap y comando para copiar |
| P7 | `#/live` | Proyector en directo por SSE: scoreboard «Us», últimas 3 burbujas y ataques bloqueados |
| P8 | — | Estados: log inválido (línea y campo), run vacío, cargando, el rival rompe el protocolo, ZOPA vacía, LLM caído («N of M via template») |

### Servidor

- Un solo proceso `node:http` en **127.0.0.1**, con Vite como middleware.
- Solo lectura de `results/` y `config/`. Protegido contra path traversal, incluidos symlinks y `%2e%2e`.
- Rechaza un `Host` ajeno (403) y cualquier método distinto de GET (405).
- Cada línea JSONL se valida con Zod; una línea inválida no rompe la carga.
- La cola SSE limita la lectura a 1 MiB por tick y a 256 KiB una línea sin salto de línea.

### Extensiones de los escritores

- `transcripts.jsonl` v2 y `summary.config.params`.
- Cabecera de traza v2, con `role` en torneo y sin mandato.
- `explain` del motor:
  - Opcional; las decisiones son idénticas con y sin él, y hay test.
  - Equivale a la reserva, así que solo va a la traza local: redactado en OTel y en pino, y `targetOffer` es null cuando la concesión es completa.
- Texto crudo del rival guardado solo en la traza local; nunca va a OTel ni a pino.
- Registro `protocol`, que solo guarda rutas y códigos de Zod.
- `gate.json` v2 y `pnpm promote --dry-run`, que nunca toca `champion.json`.
- Escritura atómica de `gate.json` y `champion.json`.
- Design system: el `Heatmap` muestra las celdas sin valor como «n/a» en color neutro.

## Revisión

Tres rondas de reviewer; la última, aprobada sin hallazgos. Se corrigieron:

- **`explain` llevaba nuestra reserva.** Se puso a null y se añadió un test de propiedad.
- **El texto del rival y `explain` llegaban a pino.** Ahora hay un único punto de log, más un test que captura la salida a nivel trace.
- **Una regresión anulaba la estimación de la reserva del rival.** Se restauró y tiene test.
- **Faltaban tests de regresión.** Se añadieron, y dos de ellos se verificaron con mutación.

## Cómo probar

```bash
pnpm install && (cd viewer && pnpm install)
pnpm test && pnpm typecheck        # 662
pnpm viewer:test                   # 125
pnpm arena                         # 0 violaciones · 0 fugas
pnpm viewer                        # http://127.0.0.1:5199/
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
