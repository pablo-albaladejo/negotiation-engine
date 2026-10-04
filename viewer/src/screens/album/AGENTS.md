# viewer/src/screens/album/ — El álbum como cromos

La pestaña «Cards» (la tarjeta «Album», fuera de la cabina), con el aspecto de la página /cards del juego:

- **Chips arriba:** todas las páginas o una sola (color del set y have/of), y el filtro «only missing».
- **Por set:** una banda con su color y su tema del catálogo, have/of y una barra de progreso.
- **Un cromo por cada carta de la página:**
  - las que tenemos, a todo color, con borde de su rareza y «×N» si hay repetidas;
  - las que faltan, en gris y con borde discontinuo, sin valores encima;
  - debajo de cada cromo: las copias en circulación frente a la tirada (`minted`/`print_run`) y el precio de libro; y en otra línea el valor de la API («API», `your_value`: el de la copia que tenemos o el de `/api/me/value` para la primera copia) frente al nuestro («ours», `our_value`, de nuestro modelo de valor: si la tenemos, lo que cuesta perder una copia con el riesgo de página; si falta, lo que suma una copia más con el bonus de página). Al pasar el ratón se explica cada uno.
- **Shinies:** las cartas fuera de la página van aparte. Las ocultas solo aparecen si las tenemos, y entonces con la etiqueta «never sold».

El dibujo es nuestro: un sol y un perfil de edificios que sale de la referencia de la carta. No se copia el arte del juego.

- **`AlbumCards.tsx`** — la tarjeta.

Datos: `board.album.pages[].cards` y `.shinies`, de `albumOf` en [`viewer/server/bazaar/`](../../../server/bazaar/AGENTS.md). Solo lectura; aquí no se calcula ninguna cifra.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
