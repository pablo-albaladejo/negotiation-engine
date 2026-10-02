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
- **`src/screens/`** — Vistas: arena, promoción, turno, `BazaarScreen` (vista unificada del Bazaar: una lista de todas nuestras conversaciones —dealers, duelos, tratos y ofertas entre equipos— con valor, excedente, veredicto y Δ de la cifra servidos por `/api/bazaar/board`; filtros en la query del hash, detalle con mensajes literales y nuestras decisiones por tick, y panel de mercado: reloj, clasificación, feed, El Rastro y nuestro venue).
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

Accede a http://127.0.0.1:5199 (puerto con `VIEWER_PORT`; la dirección es fija). `VIEWER_RESULTS_DIR` cambia la raíz de `results/`; `VIEWER_BAZAAR_DIR` cambia de dónde lee la pestaña "Bazaar" (`score.jsonl`, por defecto `results/bazaar-live`); `BAZAAR_KEY` (opcional, igual que en `src/bazaar/`) habilita la parte privada de `/api/bazaar/board` (sin clave solo se ve el mercado público). La pestaña se refresca una vez por tick del juego (`next_tick_in`) y el servidor nunca pasa de 2 req/s al Bazaar. Excepción a "solo lectura": el visor escribe `results/bazaar-live/<fecha>/verdicts.json` (valor de cada trato calculado una vez). `VIEWER_BAZAAR_SNAPSHOTS` apunta al fichero de snapshots del monitor de causa-prima, respaldo de solo lectura si el Bazaar no responde.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- ← Datos: [`src/arena/`](../src/arena/AGENTS.md) genera `results/`
- → [`server/`](server/AGENTS.md) — servidor
- → [`src/`](src/AGENTS.md) — componentes React
- → [`test/`](test/AGENTS.md) — tests
- → Design system: [`design-system/`](../design-system/AGENTS.md)
