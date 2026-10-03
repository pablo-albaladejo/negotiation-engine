# docs/bazaar/bundles/pretty/ — Frontend del Bazaar, versión legible

Los mismos ficheros que [`../assets/`](../AGENTS.md) (más index.html), pasados por wakaru (deshace la minificación: !0 → true, comas encadenadas → sentencias, llamadas de React → JSX, nombres sencillos donde los deduce) y después por Prettier. Sin el hash de Vite en el nombre: Button-DIaWEsZ9.js es aquí Button.js, y los imports, el mapa de dependencias y el index.html apuntan ya a los nombres nuevos. La equivalencia con el original es el nombre de ../assets/ sin el guion y los 8 caracteres que van antes de la extensión.

- Los nombres de variables siguen siendo los del minificador (e, t, n…) salvo los que wakaru deduce: la web no publica source maps.
- Los .js llevan JSX: se leen, pero Node no los ejecuta. Para cualquier duda, manda el original de ../assets/.
- Para buscar, empieza por assets/PersonaEditor.js (modelo de precio: función Zt, curva qt), assets/util.js (rasgos y curva) y assets/useEvents.js (niveles).
- assets/ está exenta de la regla de 10 ficheros por carpeta (ver el AGENTS.md raíz).

Regenerar desde ../assets/: npx @wakaru/cli f.js -o pretty/assets/f.js para cada .js, quitar el hash del nombre y de todas sus referencias, y luego npx prettier --write sobre pretty/.

## Links

- ↑ [`docs/bazaar/bundles/`](../AGENTS.md)
