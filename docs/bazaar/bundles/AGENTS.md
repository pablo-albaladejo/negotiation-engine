# docs/bazaar/bundles/ — Frontend del Bazaar (copia)

Copia sin comprimir del frontend público de bazaar.causaprima.ai, capturada el 3 oct 2026, con la misma estructura que sirve la web: index.html y los 80 ficheros de /assets/. Es la fuente del modelo de precio de los dealers en [`../site-map.md`](../site-map.md) § 8. Solo referencia: nada del repo la importa.

assets/ está exenta de la regla de 10 ficheros por carpeta (copia literal; ver el AGENTS.md raíz).

## Archivos

- **index.html** — página de entrada del SPA.
- **MANIFEST.txt** — sha256 de cada fichero. Desde esta carpeta, shasum -a 256 -c MANIFEST.txt sobre una descarga nueva colocada igual dice qué cambió.
- **assets/** — los 80 ficheros JS y CSS. Los que importan para el juego:
  - **PersonaEditor-CY0YsfDU.js** — editor de personas de admin: bandas de trades, vista previa de la curva de concesión, concesiones en espejo, precio de bienvenida, trickster.
  - **util-CFqlaVVI.js** — frase de prompt por rasgo y tramo, palabras por respuesta y la curva.
  - **useEvents-BpJ5PfZT.js** — escalera de 5 niveles (Friendly, Sharp, Collector, Tricksters, Banker).

## Links

- ↑ [`docs/bazaar/`](../AGENTS.md)
