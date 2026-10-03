# src/flags/ — Flags

Detector de mala fe. Excepción estrecha a «del rival solo se lee la estructura»: comparar texto con estructura, y frases de presión de una lista cerrada en contraofertas; nunca para una cifra.

## Archivos

- **`flags.ts`** — `detectFlag`: compara el texto de un mensaje del dealer con la estructura de la oferta adjunta (carta, rareza, cantidad; catálogo para nombre → id → rareza con `indexCatalog`). Solo hay candidato con una contradicción verificable (verifiable); un regalo anunciado no cuenta. El cambio de carta solo cuenta si la carta nombrada es **del mismo set** que la ofrecida (el trickster liga la rareza inferior del mismo set mientras el texto nombra la buena, site-map § 7.6), y no cuenta un nombre de carta dentro de una frase que el dealer repite: las keywords de nuestras sondas en ese hilo («Do you know about X?», `flagCandidateOf` en [`state/`](../state/AGENTS.md)) y `EGG_ECHO_PHRASES` («chulapa dorada», «golden chulapa»). Mensaje 4743 (tick 506): la respuesta del egg «la chulapa dorada» se marcó como LAT-06 frente a RET-02, un flag erróneo.
- **`detectPressure`** / **`pressureTactic`** — frases de presión de la lista cerrada `PRESSURE_PATTERNS` (site-map § 9.4): `fake_deadline` (*decide now*, *we close in a minute*), `fake_rival` (otro pujador *offered more*) y `false_scarcity` (*the last one anywhere*). Hace falta la coincidencia Y que el mensaje sea una contraoferta del dealer (con oferta, no su primer mensaje); un regalo anunciado no cuenta. Devuelve solo la táctica, nunca un número. El candidato no es verificable: `FlagsRoute` ([coordinator](../coordinator/AGENTS.md)) solo lo envía con aprobación (`--approve-flags <ids>` o `--flag-pressure`), y en dry-run lo lista.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
- → [`test/`](../../test/AGENTS.md)
