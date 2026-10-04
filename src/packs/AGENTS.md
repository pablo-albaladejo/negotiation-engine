# src/packs/ — Sobres

Estado de los sobres y ruta PACKS: abrir, vender cerrado y comprar (en pausa). Toda cifra por `enforceGuardrails`.

## Archivos

- **`packs.ts`** — `buildPacks` (`GameState.packs`): sobres cerrados nuestros (id, tipo, `your_value`) y, por tipo, huecos del catálogo ajustados al suministro con `adjustSlots` (si una rareza llega a su tirada, `PRINT_RUNS`, el hueco cae a la inferior), book esperado, nuestro valor estimado (carta a carta: media por rareza de nuestros valores, y una carta que ya tenemos a su valor de la copia siguiente con `nextCopyValue`), dealers que lo venden (lista y apertura), mejor ask y bid en El Rastro y último trato del feed. `proposePacks`: COMPRAR a un dealer está **en pausa** (compra a ciegas: lo que sale de un sobre puntúa como *luck*, RULES.md:122; decisión del 3 oct): solo deja una nota con el trato esperado y el camino del negociador por `enforceGuardrails`, y el agente de dealers solo propone `{buy: {pack}}` con `blindBuys`, que `bazaar:play` no pasa (ver [`src/dealers/`](../dealers/AGENTS.md)); ABRIR cada sobre cerrado salvo que venderlo cerrado gane; VENDER cerrado en El Rastro cuando la mejor puja supera nuestro valor (nunca por debajo). Los sobres del grant_all de la agenda y del premio de desbloqueo se anuncian para abrirse al llegar. `executePacks` (solo en vivo con --confirm): abrir con `POST /api/packs/{id}/open` y listar. **ASSUMPTIONS** (`PACK_ASSUMPTIONS`): `/api/me/value` no acepta sobres (comprobado: unknown_card), así que el valor de un sobre ajeno es una media por rareza (sigue llevando el bonus de página de las cartas que faltan: cota alta, no cifra de compra); abrir no gasta el cupo de aceptaciones (sin verificar).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)

**Venue (Pablo, 4 oct):** la venta de un sobre cerrado se publica solo en v21 (`OFFER_VENUE`, de [`src/shared/offer-venue.ts`](../shared/AGENTS.md)), que tiene comisión del 0 %. El precio sigue saliendo del código, nunca por debajo de nuestro valor.
