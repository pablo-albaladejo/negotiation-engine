# viewer/src/screens/profile/ — Nuestro perfil

Tarjetas de nuestro equipo, bajo el marcador («We are Team 2»):

- **`Eggs.tsx`** — «Our easter eggs»:
  - cada huevo que hemos encontrado: persona, tick, el puesto entre los hallazgos de esa persona, la frase de sondeo nuestra que lo disparó y el premio (cartas con nombre, rareza, tirada y si es oculta, P, sobres y la insignia de ese tick);
  - por persona, todos los hallazgos (equipo y tick, los nuestros resaltados) y nuestros sondeos (enviados, acierto, fallo y el último).

Datos: `board.eggs`, de `eggsOf` en [`viewer/server/bazaar/profile/`](../../../server/bazaar/profile/AGENTS.md). Solo lectura; aquí no se calcula ninguna cifra.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
