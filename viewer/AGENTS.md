# viewer/ — Visor de Resultados

Paquete independiente: aplicación React + servidor Node para visualizar resultados de arena, promoción y agente. Solo lectura, 127.0.0.1, nunca calcula métricas.

## Propósito

Dashboard interactivo:

- Resultados de self-play (partidas, métricas, tablas).
- Histórico de promociones (campeona vs candidatas).
- Trazas de turnos (explicaciones del motor, texto del rival, respuesta).

Agnóstico del protocolo del ring.

## Estructura

- **`server/`** — Servidor Node/Hono que sirve API y archivos estáticos.
- **`src/`** — Componentes React (model, screens, UI).
- **`test/`** — Tests de visor.
- **`package.json`** — Paquete independiente (`@negotiation-ring/viewer`).
- **`pnpm-lock.yaml`** — Lockfile específico.

## Archivos clave

- **`server/main.ts`** — Entry point: arranca servidor en http://127.0.0.1:5199 (puerto configurable con `VIEWER_PORT`, dirección fija).
- **`src/model/`** — Lógica de modelo (carga resultados, procesa).
- **`src/screens/`** — Vistas: arena, promoción, turno.
- **`src/ui/`** — Componentes: tablas, gráficos, listados.

## Invariantes

- **Solo lectura**: nunca modifica datos.
- **127.0.0.1 solamente**: sin exposición a red abierta.
- **Sin cálculos de métricas**: solo presentación (métricas calculadas por `src/arena/`).
- **Datos de `results/`**: accede a JSON generado por arena.
- **Texto rival**: mostrado solo como texto plano, nunca como HTML.

## Cómo usar

```bash
# Instalar dependencias
pnpm --dir viewer install

# Arranca servidor (React dev + API)
pnpm --dir viewer start
# o
pnpm viewer

# Tests
pnpm --dir viewer test

# TypeScript
pnpm --dir viewer typecheck
```

Accede a http://127.0.0.1:3000.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- ← Datos: [`src/arena/`](../src/arena/AGENTS.md) genera `results/`
- → [`server/`](server/AGENTS.md) — servidor
- → [`src/`](src/AGENTS.md) — componentes React
- → [`test/`](test/AGENTS.md) — tests
- → Design system: [`design-system/`](../design-system/AGENTS.md)
