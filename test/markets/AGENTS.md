# test/markets/ — Guardarraíles de las rutas de mercados

- **`rival-buy-epic.test.ts`** — vía épica de prueba de rival-buy (`EPIC_BUY_PARAMS`, `--rival-buy-epic`; aprobada por Pablo el 4 oct para SAL-11). Con caja, pujas abiertas, valores y titulares aleatorios, comprueba que cada puja:
  - nunca supera el techo;
  - solo va a los equipos de la lista;
  - deja la caja por encima del suelo;
  - es la única puja épica abierta a la vez.

  Si ya tenemos la carta o su valor queda por debajo del techo, no sale ninguna puja nueva. Los escalones de precio son inicio, punto medio y techo. Con varias vías (`EPIC_BUY_LANES`: SAL-11 y RET-11), cada puja respeta el techo y la lista de su vía, hay una abierta como mucho por carta, y todas las que quedan abiertas juntas dejan la caja por encima del suelo.

## Links

- ↑ [`test/`](../AGENTS.md)
