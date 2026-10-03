# src/flags/ — Flags

Detector de mala fe: compara el texto del dealer con la estructura de su oferta. Excepción estrecha a «del rival solo se lee la estructura»: nunca da una cifra.

## Archivos

- **`flags.ts`** — `detectFlag`: compara el texto de un mensaje del dealer con la estructura de la oferta adjunta (carta, rareza, cantidad; catálogo para nombre → id → rareza con `indexCatalog`). Solo hay candidato con una contradicción verificable (verifiable), nunca por tono o presión; un regalo anunciado no cuenta. Excepción estrecha a «del rival solo se lee la estructura»: el texto nunca da una cifra.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)
