# src/flags/ — Flags

Detector de mala fe. Excepción estrecha a «del rival solo se lee la estructura»: comparar texto con estructura, y frases de presión de una lista cerrada en contraofertas; nunca para una cifra.

## Archivos

- **`flags.ts`** — `detectFlag`: compara el texto de un mensaje del dealer con la estructura de la oferta adjunta (carta, rareza, cantidad; catálogo para nombre → id → rareza con `indexCatalog`). Solo hay candidato con una contradicción verificable (verifiable); un regalo anunciado no cuenta.
- **`detectPressure`** / **`pressureTactic`** — frases de presión de la lista cerrada `PRESSURE_PATTERNS` (site-map § 9.4): `fake_deadline` (*decide now*, *we close in a minute*), `fake_rival` (otro pujador *offered more*) y `false_scarcity` (*the last one anywhere*). Hace falta la coincidencia Y que el mensaje sea una contraoferta del dealer (con oferta, no su primer mensaje); un regalo anunciado no cuenta. Devuelve solo la táctica, nunca un número. El candidato no es verificable: `FlagsRoute` solo lo envía con aprobación (`--approve-flags <ids>` o `--flag-pressure`), y en dry-run lo lista. Sobre los 141 mensajes de dealers guardados (Abuela y El Chato, sin tricksters) no casa ninguno.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)
