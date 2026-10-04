# viewer/src/screens/goals/ — Objetivos y registro de estrategias

- **`GoalsView.tsx`** — la pestaña «Goals»: lo que lleva `GameState.goals` (goals.json y strategies.json, que escribe la sesión «goals»). Arriba los huecos y los conflictos; luego los objetivos por prioridad (peso, ahora, Δ del día y del tick, estado, hasta qué tick, objetivo, por qué y los «do not» plegados), las propuestas abiertas (proposed o approved: pros, contras, recomendación, quién da el OK) y todas las estrategias agrupadas por objetivo (dueño, estado, OK de Pablo, commit y flag, evidencia, conflictos).

Solo se muestra: ninguna ruta decide con esto. `figures_for_humans` va como texto con la etiqueta «for humans, not a price»; la cifra de una oferta sale siempre del código de la ruta.

## Links

- ↑ [`viewer/src/screens/`](../AGENTS.md)
