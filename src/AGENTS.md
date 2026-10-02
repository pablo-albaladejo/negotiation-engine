# src/ — Código del agente

| Carpeta | Responsabilidad |
|---------|-----------------|
| [`bazaar/`](bazaar/AGENTS.md) | Agente del Bazaar: dealers, duelos, El Rastro, broker, venue y simulador |
| [`engine/`](engine/AGENTS.md) | Núcleo numérico que usa el Bazaar: utilidad, concesión, aceptación y guardarraíles |

## Invariantes

- **La cifra sale del código** (`engine/` + planificadores de `bazaar/`), nunca de un texto.
- **Toda oferta pasa por `enforceGuardrails`**: no cruza el límite y es monótona.
- **Del rival solo se lee la estructura** (ofertas y precios), nunca su texto.

## Links

- ↑ [root `AGENTS.md`](../AGENTS.md)
- → [`test/`](../test/AGENTS.md)
