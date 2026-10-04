# test/markets/ — Guardarraíles de las rutas de mercados

- **`rival-buy-epic.test.ts`** — vía épica de prueba de rival-buy (`EPIC_BUY_PARAMS`, `--rival-buy-epic`; aprobada por Pablo el 4 oct para SAL-11). Con caja, pujas abiertas, valores y titulares aleatorios, comprueba que cada puja:
  - nunca supera el techo;
  - solo va a los equipos de la lista;
  - deja la caja por encima del suelo;
  - es la única puja épica abierta a la vez.

  Si ya tenemos la carta o su valor queda por debajo del techo, no sale ninguna puja nueva. Los escalones de precio son inicio, punto medio y techo.

## Links

- ↑ [`test/`](../AGENTS.md)
