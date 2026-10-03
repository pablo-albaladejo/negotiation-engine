# viewer/ — Visor del Bazaar

Paquete independiente (React + servidor Node) con una sola pestaña, `#bazaar`: una cabina: cifra y puesto (con distancia al de delante y al líder), próximas citas del calendario, lo abierto ahora (duelos con límite y pujas, hilos, nuestras ofertas avisando si vendemos nuestra única copia), álbum con las cartas que faltan y su valor, tratos que movieron la cifra (Δ real del juego), estado de nuestros agentes, historial plegado (duelos aparte, sin veredicto) y mercado plegado (clasificación con negociación, mercado, nivel, álbum con ★ = páginas completas y tratos por equipo; feed, El Rastro y nuestro venue). Cartas que faltan con los colores oficiales de rareza; el rival de duelo es otro equipo bajo un alias. Cada conversación se abre en un panel lateral (se cierra con Escape) con la curva de la negociación: nuestras ofertas, las del rival, nuestro límite por tick, nuestro valor (o el límite del duelo), el final y, si el límite bajó durante la compra, una nota con el motivo posible; eje X en ticks reales y eje Y en números redondos; al pasar el cursor, una caja con los valores de ese tick. Quién es quién: nosotros siempre «Team 2 (us)», los demás equipos por su nombre, y cada parte con su tipo (dealer, rival de duelo, oferta pública, equipo); en los libros, donde el Bazaar anonimiza al autor, las nuestras se reconocen por id de oferta. Solo 127.0.0.1.

**Vista «Model»** (pestaña junto a la cabina): NUESTRO modelo interno, no un espejo de la API, servido por `/api/bazaar/model`. Resumen de tiempo arriba («h 2.65 · R1 ×0.5 · closed until Sat 09:00»); entorno → estado → decisión (lecturas que fallaron, `GameState`, presupuesto del tick desde `clock.limits` con la ASSUMPTION del accept de duelo); línea de tiempo 0–24 h (rondas y pesos, cierres, eventos con nuestra acción prevista y su antelación, disparadores recientes); coordinador (cada intención por ruta con SELECTED/DROPPED y motivo, y la tabla `ACCEPT_PRIORITY`); objetivos (puntuación por componente, pesos, palancas, SAL-09, suelo de caja y topes); personas (estado, tipo, rasgos, progreso de desbloqueo, eggs ajenos) y el corpus de pistas con filtros; conversaciones del modelo (duelos, dealers y ofertas de El Rastro); mercados, venues, precios por carta, sobres; eggs y flags. El cajón de cada conversación añade ESTADO y ESTRATEGIA y el camino previsto en discontinua sobre la curva. Los campos que aún no trae `src/state/` se pintan solo si están.

## Estructura

- **[`server/`](server/AGENTS.md)** — `/api/bazaar/*` sobre la API del Bazaar y `results/bazaar-live/`.
- **[`src/`](src/AGENTS.md)** — la app React (`BazaarScreen`).
- Sistema de diseño por alias a [`design-system/`](../design-system/AGENTS.md) (sin build).

## Invariantes

- **127.0.0.1 solamente**, Host comprobado, solo GET/HEAD.
- **Hacia el Bazaar solo GET**: tablero ≤ 2 req/s y modelo ≤ 1,5 req/s (visor < 4 req/s); nunca devuelve la clave.
- **El modelo no puede enviar**: cliente de solo lectura (`ReadOnlyBazaarClient` + `readOnlyFetch`), rutas en dry-run, nunca el método execute; test de guardarraíl en `test/bazaar-model-guard.test.ts` (`pnpm viewer:test`).
- **Datos privados solo en local**: el modelo lleva valores privados, `your_limit` y reservas; el servidor solo escucha en 127.0.0.1 y rechaza otro Host.
- Única escritura: `results/bazaar-live/<fecha>/verdicts.json` (valor de cada trato, calculado una vez).
- **Texto rival**: solo como texto plano, nunca como HTML.

## Cómo usar

```bash
pnpm --dir viewer install
set -a && . ./.env && set +a && pnpm viewer   # http://127.0.0.1:5199/#bazaar
pnpm viewer:typecheck
pnpm viewer:test   # guardarraíles del modelo
```

`VIEWER_PORT` cambia el puerto; `VIEWER_BAZAAR_DIR` la carpeta de trazas (por defecto `results/bazaar-live`); `BAZAAR_KEY` habilita la parte privada de `/api/bazaar/board` (sin clave, solo el mercado público). `VIEWER_BAZAAR_SNAPSHOTS` apunta a un respaldo de solo lectura si el Bazaar no responde.

## Links

- ↑ [`AGENTS.md`](../AGENTS.md)
- → [`src/`](../src/AGENTS.md) — de donde salen las trazas
