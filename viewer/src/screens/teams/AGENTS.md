# viewer/src/screens/teams/ — Equipos

- **`TeamsView.tsx`** — la pestaña «Teams»: todo lo que sabemos de cada equipo en un sitio. Una sola tabla hace de selector: la clasificación (score, negociación, mercado, álbum, páginas, tratos) junto a lo que se ve de cada equipo (evolución del score, página más cercana, lo que pide y repetidas); del equipo elegido, sus partes del score (rank, score, negociación, mercado, álbum, páginas, nivel, tratos) y su evolución, lo que hemos hecho con él (tratos, ofertas y duelos: cada uno abre su conversación), sus tratos con otros equipos, los eggs que ha encontrado y su colección según la estructura pública; debajo, las oportunidades: cartas nuestras que otros piden (`Rivals`, que antes vivía en «Model»).
- **`TeamLink.tsx`** — `TeamName`: el nombre de un equipo como enlace que abre «Teams» en ese equipo desde cualquier pestaña (contexto `TeamNav`, que pone `viewer/src/screens/BazaarScreen.tsx`); el nuestro va con el color «us».

Solo lectura: del rival solo se muestra estructura, nunca su texto; aquí nada envía.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
