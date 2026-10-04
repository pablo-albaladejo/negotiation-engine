# test/markets/ — Guardarraíles de las rutas de mercados

- **`rival-buy-epic.test.ts`** — vía épica de prueba de rival-buy (`EPIC_BUY_PARAMS`, `--rival-buy-epic`; aprobada por Pablo el 4 oct para SAL-11). Con caja, pujas abiertas, valores y titulares aleatorios, comprueba que cada puja:
  - nunca supera el techo;
  - solo va a los equipos de la lista;
  - deja la caja por encima del suelo;
  - es la única puja épica abierta a la vez.

  Si ya tenemos la carta o su valor queda por debajo del techo, no sale ninguna puja nueva. Los escalones de precio son inicio, punto medio y techo. Con varias vías (`EPIC_BUY_LANES`: SAL-11 y RET-11), cada puja respeta el techo y la lista de su vía, hay una abierta como mucho por carta, y todas las que quedan abiertas juntas dejan la caja por encima del suelo. La vía abierta (RET-11) publica una sola puja sin `to` al techo, nunca por encima, y El Rastro no la cancela (sin la exención sí lo haría).

- **`workshop.test.ts`** — El Taller (`src/workshop/workshop.ts`). Con manos aleatorias (copias libres, en un anuncio nuestro, en un hilo o en otro venue), comprueba que el Taller:
  - nunca entrega la última copia libre, una copia ocupada ni una oculta;
  - nunca mezcla rarezas;
  - solo cancela anuncios nuestros de las copias que entrega;
  - propone como mucho una por tick;
  - sin `send`, nunca llama a la API;
  - en vivo, si en la nueva lectura una copia elegida está ocupada, ya no es nuestra o sería la última libre, no cancela nada ni hace el POST.

## Links

- ↑ [`test/`](../AGENTS.md)
