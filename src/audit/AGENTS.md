# src/audit/ — Monitor de ineficiencias (`pnpm bazaar:audit`)

Solo lectura: lee las trazas locales del día y avisa de lo que nos cuesta puntos (comprar repetidas, vender por debajo de una puja abierta, perder la única copia de una página…). Nunca hace POST; GET a `/api/me` como mucho al arrancar y cada ≥ 5 min (`--no-api` lo evita).

## Archivos

- **`main.ts`** — CLI. `pnpm bazaar:audit --date YYYY-MM-DD`: procesa el día entero, imprime un informe (alertas por detector, P totales, medido o no y por qué) y sale. `pnpm bazaar:audit --watch`: lee lo nuevo cada `--interval` s (15) y añade solo alertas nuevas. Salidas en `results/bazaar-live/<fecha>/` (`--out` cambia la carpeta): `audit.jsonl` (una línea por alerta, deduplicada por `key` también entre reinicios) y audit-status.json (se sobrescribe: por detector, medido o no y por qué, alertas, P y último tick; por fuente, último tick y si está parada). Una fuente con más de 10 ticks sin datos mientras el reloj avanza deja sus detectores como no medidos (unmeasured).
- **`sources.ts`** — `Tail` (lectura incremental por desplazamiento en bytes), parsers tolerantes del stream del recorder (`stream-team.jsonl`/`stream-public.jsonl`; el equipo sale de su línea hello), de `plan.jsonl` (copia local tolerante del esquema de [`src/coordinator/plan-log.ts`](../coordinator/AGENTS.md)), de `decisions.jsonl` y de `play.log` (`PlayLogParser`: caja, suelo de caja, accept de markets seleccionados, `post list`/`post bid` enviados, aperturas de dealers y fallos) cuando no hay `plan.jsonl` para ese tick. Línea base: el `/api/me` grabado en los dump y api-scan del día; catálogo, el último grabado; valores, results/bazaar-live/values.json.
- **`ledger.ts`** — `replay`: repasa el stream en orden de id sobre la línea base. Libro por carta (`Lot`: cuándo, a qué precio y desde dónde entró y salió; sobres y regalos incluidos), nuestros tratos con las copias que teníamos antes (`OurTrade`, con el hilo del dealer y su reserva), el libro de órdenes de cada venue en el momento de cada trato (mejor puja y mejor ask de otro equipo, con comisión; sin las ofertas dirigidas a otro equipo, ni las canceladas, caducadas o ya casadas) y nuestras retiradas de ofertas.
- **`detectors.ts`** — `dup-buy` (pérdida = precio − `nextCopyValue`; no salta si la copia se revendió con beneficio en ≤ 30 ticks), `round-trip-loss` (venta − comisión − compra < 0 en ≤ 30 ticks), `below-best-bid` / `above-best-ask` (≥ 1 P contra la mejor cotización abierta), `album-copy-lost` (última copia de una carta de página; alta si rompe una página completa; solo si lo cobrado no cubre su valor para nosotros, `valueDelta`), `cash-floor` (caja bajo el suelo; el gasto por tick sobre `--max-spend` solo con `plan.jsonl`), `double-act` (dos rutas compran o venden la misma carta en el mismo tick), `repeat-failure` (la misma intención o `ruta:error` falla en ≥ 3 ticks seguidos), `churn` (la misma oferta publicada y retirada ≥ 3 veces, todas a menos de 20 ticks: el reprecio lento del agente de El Rastro, cada 10 ticks, no cuenta) y `stale-source`.

## Reglas

- Valoración reutilizada: `buildValueModel`, `valueDelta` y `tradeFee` de [`src/trades/`](../trades/AGENTS.md) y `nextCopyValue` de [`src/dealers/`](../dealers/AGENTS.md). Supuesto conservador de comisiones: la paga quien vende (puja neta = puja − comisión; ask = precio + comisión).
- Lo arranca `pnpm bazaar:up` como hijo audit (`--no-audit` lo quita); ver [`scripts/ops/`](../../scripts/ops/AGENTS.md).

## Links

- ↑ [`src/`](../AGENTS.md)
