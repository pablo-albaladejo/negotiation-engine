# src/workshop/ — El Taller

El Taller (`POST /api/taller {assets: [a, b, c]}`) cambia tres repetidas de una rareza por una carta al azar de la siguiente. El resultado se ve, pero **nunca puntúa**: no da `neg_points` ni escalera. Solo gana lo que valga para nosotros la carta nueva, y una carta de página que nos falta vale mucho más que una repetida.

## Archivos

- **`workshop.ts`**:
  - **`buildWorkshop`** construye `GameState.workshop`.
    - Repetidas por rareza, con los mismos guardarraíles que una venta: nunca la última copia libre, nada en un hilo abierto ni en una oferta que no sea un anuncio nuestro, y nunca una carta oculta ni de recuerdo (`isKeepsake`; regla de Pablo: las ocultas no se venden).
    - Un anuncio nuestro simple en El Rastro (solo pide caja, sin hilo ni destinatario) no bloquea la copia: el Taller lo cancela antes. La copia que se queda tiene que estar libre y sin anunciar.
    - Coste de cada repetida: el máximo entre perder la copia a nuestro valor (`loseCopy`) y la mejor puja por ella ahora.
    - Valor esperado: la media de lo que suma una copia más (`nextCopy`) entre las cartas publicadas y no ocultas de la rareza siguiente.
    - Decisión por rareza:
      - `craft` si el valor esperado supera el coste en ≥ max(2 P, 10 % del coste);
      - `hold` si no;
      - `short` si faltan repetidas.
    - También guarda los «taller.crafted» del feed.
  - **`proposeWorkshop`**: como mucho una intención `craft` por tick, la de más neto, con los activos como locks. Sin `--workshop` no hay intención, solo la nota «would craft …», así no le quita los locks a los anuncios de esas copias.
  - **`executeWorkshop`**: solo en vivo, con `--confirm` y `--workshop`. Lee `/api/me`, los hilos y las ofertas y comprueba todos los guardarraíles antes de cancelar nada. Después cancela los anuncios, vuelve a leer y a comprobar, y solo entonces hace el POST. Si algo cambió, aborta.
  - **ASSUMPTIONS** (`WORKSHOP_ASSUMPTIONS`): la carta sale uniforme entre las de la rareza siguiente (el reparto real no se publica), y el Taller no gasta el cupo de aceptaciones (sin verificar).

Lo leen el coordinador (ruta `workshop`, ver [`src/coordinator/`](../coordinator/AGENTS.md)) y el visor (cromos de la pestaña «Cards» y panel «The Workshop»).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
