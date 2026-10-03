# Fórmula de neg_points (medida el 3 oct)

**Resultado:** `neg_points` suma, por cada trato (con dealers y entre equipos), el **valor ganado a valor privado, sin tope**; la comisión **no se resta**.

- Compra a precio `p` de una carta de valor `v`: `v − p`.
- Venta a precio `p`: `p − v`.
- Sin `min(valor, book)`: el supuesto anterior (`dealerCap`, «anomalía de neg_points») queda **descartado**.

## Evidencia

Sábado, tick 361: `/api/me` → `score.neg_points = 46.2` (viernes −14.9, `duel_points` 0). Con nuestros 26 tratos del sábado (12 entre equipos en El Rastro y 14 con dealers) y los valores de `results/bazaar-live/values.json`:

| Fórmula | Total | Distancia a 46.2 |
|---------|------:|-----------------:|
| Sin tope: compra `v − p`, venta `p − v`, comisión no restada | 49.5 | 3.3 |
| Sin tope, menos comisión | 16.5 | 29.7 |
| Con tope `min(v, book) − p` | −66 | 112 |
| Solo pérdidas | −146 | 192 |

Los 3.3 de residuo se explican probablemente por el menor valor marginal de las repetidas.

## Ejemplo: ida y vuelta

RET-02: comprada por 12 en el tick 205 y vendida por 49 en el tick 230 → **+37** (`Y − X`).

## Cautelas

- Confianza media-alta: es **un solo agregado**, no un Δ aislado. Verificar con un Δ de `neg_points` tras el próximo trato suelto.
- La lectura del viernes (hilo 222: Δ0 en una compra por debajo del valor) **queda superada** por esta medida.
- **Δ0 en un trato con dealer (sábado, tick 530):** RET-10, la carta que completaba la página RET, comprada a El Chato por 91 P, dejó `neg_points` en 69,1 (igual desde el tick 507 hasta el 630). Incluso sin el bonus de página (~106) su base daba +21 (112 − 91), así que un Δ0 contradice que los tratos con dealers sumen siempre, o que el bonus de página puntúe. En cambio RET-09 a 84 P a otro equipo (tick 504) movió +23. Mientras no se aclare: el álbum solo se persigue en SAL-09, con tope en su base (`--page-bonus-scored` lo levanta) y cada Δ se audita trato a trato (`score-audit.jsonl`, veredicto `match` / `dealer-unscored` / `mismatch`; ver `src/coordinator/AGENTS.md`).
