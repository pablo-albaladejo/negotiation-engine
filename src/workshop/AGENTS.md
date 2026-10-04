# src/workshop/ — El Taller

El Taller (`POST /api/taller {assets: [a, b, c]}`) cambia tres repetidas de una rareza por una carta al azar de la siguiente. El resultado se ve, pero **nunca puntúa**: no da `neg_points` ni escalera. Solo gana lo que valga para nosotros la carta nueva, y una carta de página que nos falta vale mucho más que una repetida.

## Archivos

- **`workshop.ts`**:
  - **`buildWorkshop`** construye `GameState.workshop`.
    - Repetidas por rareza, con los mismos guardarraíles que una venta: nunca la última copia libre, nada en un hilo ni en una oferta abiertos, y nunca una carta oculta ni de recuerdo (`isKeepsake`; regla de Pablo: las ocultas no se venden).
    - **Las repetidas van antes a los equipos** (Pablo, 4 oct; el mismo criterio que los dealers): no se usa ninguna copia de una carta que ofrecemos a equipos (oferta abierta en El Rastro, en un venue o dirigida a un equipo, `teamOfferedAssets`) ni de una carta que una presentación de las últimas 6 h nos da como poseedores (`introDemand` de [`src/intros/`](../intros/AGENTS.md)), ni de una carta que le falta a un rival para cerrar una página (`nearPageDemand`: le falta una). Además, el arbitraje descarta el craft si otra ruta vende o anuncia esa copia o esa carta en el mismo tick (locks `ref:` frente a `sell:`); caso de origen: el 4 oct, a las 10:48, un craft se llevó tres copias que El Rastro iba a anunciar. El Taller nunca cancela un anuncio. Si no se pueden leer nuestras ofertas, no hay nada que convertir (`blocked`: falla cerrado).
    - Coste de cada repetida: el máximo entre perder la copia a nuestro valor (`loseCopy`) y la mejor puja por ella ahora.
    - Valor esperado: la media de lo que suma una copia más (`nextCopy`) entre las cartas publicadas y no ocultas de la rareza siguiente.
    - Decisión por rareza:
      - `craft` si el valor esperado supera el coste en ≥ max(2 P, 10 % del coste);
      - `hold` si no;
      - `short` si faltan repetidas.
    - También guarda los «taller.crafted» del feed y las cartas retenidas para equipos (`demand`).
  - **`proposeWorkshop`**: como mucho una intención `craft` por tick, la de más neto, con los activos como locks. Sin `--workshop` no hay intención, solo la nota «would craft …», así no le quita los locks a los anuncios de esas copias.
  - **`executeWorkshop`**: solo en vivo, con `--confirm` y `--workshop`. Vuelve a leer `/api/me`, los hilos y las ofertas, comprueba todos los guardarraíles (demanda de equipos incluida) y solo entonces hace el POST. Si algo cambió, aborta.
  - **ASSUMPTIONS** (`WORKSHOP_ASSUMPTIONS`): la carta sale uniforme entre las de la rareza siguiente (el reparto real no se publica), y el Taller no gasta el cupo de aceptaciones (sin verificar).

Lo leen el coordinador (ruta `workshop`, ver [`src/coordinator/`](../coordinator/AGENTS.md)) y el visor (cromos de la pestaña «Cards» y panel «The Workshop»).

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`state/`](../state/AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
