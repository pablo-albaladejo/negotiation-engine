# src/packs/ — Sobres

Estado de los sobres y ruta PACKS: comprar negociado, abrir, vender cerrado. Toda cifra por `enforceGuardrails`.

## Archivos

- **`packs.ts`** — `buildPacks` (`GameState.packs`): sobres cerrados nuestros (id, tipo, `your_value`) y, por tipo, huecos del catálogo ajustados al suministro con `adjustSlots` (si una rareza llega a su tirada, `PRINT_RUNS`, el hueco cae a la inferior), book esperado, nuestro valor estimado, dealers que lo venden (lista y apertura), mejor ask y bid en El Rastro y último trato del feed. `proposePacks`: COMPRAR a un dealer solo si nuestro valor supera el trato esperado y este queda por debajo de la apertura (cuenta para la escalera), respetando el suelo de caja, con el camino del negociador por `enforceGuardrails` (ahora solo una nota, sin gastar cupo de hilos: la compra la negocia el agente de dealers con `{buy: {pack}}`, ver [`src/dealers/`](../dealers/AGENTS.md)); ABRIR cada sobre cerrado salvo que venderlo cerrado gane; VENDER cerrado en El Rastro cuando la mejor puja supera nuestro valor (nunca por debajo). Los sobres del grant_all de la agenda y del premio de desbloqueo se anuncian para abrirse al llegar. `executePacks` (solo en vivo con --confirm): abrir con `POST /api/packs/{id}/open` y listar. **ASSUMPTIONS** (`PACK_ASSUMPTIONS`): `/api/me/value` no acepta sobres (comprobado: unknown_card), así que el valor de un sobre ajeno es una media por rareza; abrir no gasta el cupo de aceptaciones (sin verificar).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)
