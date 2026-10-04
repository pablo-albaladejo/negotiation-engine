# viewer/server/bazaar/profile/ — Datos de nuestro perfil

- **`eggs.ts`** — `eggsOf` arma `board.eggs`, los easter eggs:
  - Nuestros: cada «egg.found» con nuestro equipo. Su premio es el «egg.given» de ese tick o del siguiente (cartas, P, sobres) más la insignia («badge.awarded») del mismo momento. La frase que lo disparó es nuestro último sondeo a esa persona en los 6 ticks anteriores (`results/bazaar-live/<fecha>/personas.json` de todos los días, sin duplicados: los sondeos se guardan por día).
  - Por persona: todos los hallazgos (equipo y tick) y el resumen de nuestros sondeos (enviados, acierto, fallo, el último).
  - Nuestras insignias («badge.awarded») y los regalos («gift.given») con sus cartas y lo que hacíamos con esa persona cuando llegó: el hilo, nuestra oferta de ese tick (estructura, sin texto) y el trato de los ticks siguientes. Además, los regalos de cada persona a todo el campo (cuántos, a cuántos equipos y cuántos a nosotros).
  - Sale del stream público que guarda el recorder más el feed, sin duplicados por id. Solo estructura: nunca el texto de un dealer. Las cartas se completan con el catálogo (nombre, rareza, tirada, oculta).
- **`grants.ts`** — `grantsOf` arma `board.grants`: las subvenciones de la organización a nuestro equipo («admin.grant» del stream de equipo, `results/bazaar-live/<fecha>/stream-team.jsonl`), con P, sobres, cartas, quién (schedule, news, system) y el motivo. Sirve para que un salto de caja (la paga diaria, los +400 P de hoy o los +150 P de mañana) salga etiquetado como subvención y no como un trato o un error. Solo se leen las líneas que nombran el evento y cada fichero se relee solo si cambia su tamaño.

## Links

- ↑ [`viewer/server/bazaar/`](../AGENTS.md)
- → Pantalla: [`viewer/src/screens/profile/`](../../../src/screens/profile/AGENTS.md)
