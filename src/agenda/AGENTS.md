# src/agenda/ — Agenda y disparadores

El calendario como playbook y los eventos del feed como disparadores; los aplica el coordinador antes de que las rutas propongan. Nada hace un POST.

## Archivos

- **`agenda.ts`** — `PLAYBOOK` por acción del calendario, con antelación y acción prevista: bench (1 h antes: venue de tablón + plan de broker, solo intención; el bench duro, broker más firme), round (replanificar la escalera: 3 mejores por nivel y ronda), set_release (leer catálogo y valores del set nuevo, objetivos de página), grant_all (replanificar compras con la caja extra; abrir el sobre, solo intención), duels (0,5 h antes: cambiar la configuración de duelos, decay y días), day_closes (0,5 h antes: cerrar o renovar ofertas que caducarían con las puertas cerradas), announce y end_round (no abrir conversaciones, cerrar lo pendiente), persona (cierre de un puesto). `agendaItems` marca cada evento como due-now, due-soon o later; `agendaEffects` da lo que toca ya y el coordinador lo aplica ANTES de que las rutas propongan (bloquea aperturas, cierra personas, ajusta el decay de duelos). Las intenciones de agenda nunca salen: `arbitrate` las imprime y las descarta.
- **`triggers.ts`** — `runTriggers`: eventos del feed, cada uno una sola vez (cursor en `results/bazaar-live/<fecha>/triggers.json`, solo en vivo; en dry-run, en memoria). level.announced: esqueleto `personas/<id>.yaml`; level.activated: leer rasgos y menú y generar la ficha y `.claude/agents/persona-<id>.md` con `personaFiles` (estrategia por tipo; trickster, flags desde el primer mensaje; en dry-run solo se imprime qué se escribiría); level.unlocked para nosotros: conversaciones permitidas; cambio de `clock.limits`: presupuesto recalculado; egg de otro equipo: más prioridad de egg; aviso, strike o cooloff: sin probes y tono cuidadoso con esa persona.

## Links

- ↑ [`src/`](../AGENTS.md)
- → [`coordinator/`](../coordinator/AGENTS.md)
